import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { photoPrise, publierPhoto } from './photoCadenas'

// Le logo de SafeVault en 3D : un cadenas et sa cle, relies par un anneau
// de metal, aux couleurs de la DA. Le cadenas est en metal ocean, sa serrure
// et la cle en limonade, l anse et l anneau en chrome. Le cadenas et la cle
// pendent a l anneau et se balancent quand le pointeur passe ; chacun est un
// pendule amorti. La scene ne se redessine que lorsqu elle bouge.
//
// Les matieres sont des images cuites a l avance (public/modeles/matcap-*.png,
// faites par outils/matcaps.html) : le metal et ses reflets y sont deja
// peints. Calculer la lumiere en direct demandait a la carte graphique de
// compiler de gros programmes, et figeait la page plusieurs secondes au
// demarrage sur une machine modeste.

// `tour` : de combien l objet pivote sur lui-meme, de part et d autre de `baseY`.
type Pendule = {
  objet: THREE.Object3D
  angle: number
  vitesse: number
  gain: number
  phase: number
  baseY: number
  tour: number
}
type Matieres = { chrome: THREE.Material; ocean: THREE.Material; limonade: THREE.Material; noir: THREE.Material }

async function chargerMatieres(): Promise<Matieres> {
  const chargeur = new THREE.TextureLoader()
  const cuite = async (nom: string) => {
    const image = await chargeur.loadAsync(`/modeles/matcap-${nom}.png`)
    image.colorSpace = THREE.SRGBColorSpace
    return new THREE.MeshMatcapMaterial({ matcap: image })
  }
  const [chrome, ocean, limonade] = await Promise.all([cuite('chrome'), cuite('ocean'), cuite('limonade')])
  return { chrome, ocean, limonade, noir: new THREE.MeshBasicMaterial({ color: 0x06070d }) }
}

// Le cadenas. Son origine est le haut de l anse.
function construireCadenas(m: Matieres) {
  const groupe = new THREE.Group()
  const rayonAnse = 0.3
  const epaisseur = 0.075

  const arc = new THREE.Mesh(new THREE.TorusGeometry(rayonAnse, epaisseur, 32, 72, Math.PI), m.chrome)
  arc.position.y = -rayonAnse
  groupe.add(arc)
  for (const cote of [-1, 1]) {
    const jambe = new THREE.Mesh(new THREE.CylinderGeometry(epaisseur, epaisseur, 0.42, 32), m.chrome)
    jambe.position.set(cote * rayonAnse, -rayonAnse - 0.21, 0)
    groupe.add(jambe)
  }

  // Le corps : un metal anodise ocean, sous un vernis.
  const yCorps = -0.62 - 0.46
  const corps = new THREE.Mesh(new RoundedBoxGeometry(1.02, 0.92, 0.46, 10, 0.14), m.ocean)
  corps.position.y = yCorps
  groupe.add(corps)

  // La serrure : une pastille limonade cerclee de chrome, le trou en creux.
  const zFace = 0.232
  const bague = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.024, 20, 56), m.chrome)
  bague.position.set(0, yCorps - 0.02, zFace)
  groupe.add(bague)
  const pastille = new THREE.Mesh(new THREE.CircleGeometry(0.14, 48), m.limonade)
  pastille.position.set(0, yCorps - 0.02, zFace - 0.001)
  groupe.add(pastille)
  const trou = new THREE.Shape()
  trou.absarc(0, 0.035, 0.042, 0, Math.PI * 2, false)
  const fente = new THREE.Shape()
  fente.moveTo(-0.018, 0.015)
  fente.lineTo(0.018, 0.015)
  fente.lineTo(0.027, -0.085)
  fente.lineTo(-0.027, -0.085)
  fente.closePath()
  for (const s of [trou, fente]) {
    const forme = new THREE.Mesh(new THREE.ShapeGeometry(s), m.noir)
    forme.position.set(0, yCorps - 0.02, zFace + 0.0005)
    groupe.add(forme)
  }

  return groupe
}

const jeterFormes = (racine: THREE.Object3D) =>
  racine.traverse((o) => {
    if (o instanceof THREE.Mesh) o.geometry.dispose()
  })

// La photo du cadenas seul, de trois quarts, sur fond transparent. Elle sert
// partout ou l interface montre un cadenas. Prise avec le moteur du logo,
// avant sa premiere image : pas de second contexte WebGL a payer.
function photographier(rendu: THREE.WebGLRenderer, m: Matieres) {
  const scene = new THREE.Scene()
  const cadenas = construireCadenas(m)
  cadenas.rotation.set(0.06, -0.5, 0)
  scene.add(cadenas)

  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 50)
  camera.position.set(0, -0.6, 4.75)
  camera.lookAt(0, -0.76, 0)

  rendu.setPixelRatio(1)
  rendu.setSize(256, 256, false)
  rendu.render(scene, camera)
  const url = rendu.domElement.toDataURL('image/png')
  jeterFormes(cadenas)
  return url
}

export function creerLogo(hote: HTMLElement) {
  const sansMouvement = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const rendu = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' })
  rendu.outputColorSpace = THREE.SRGBColorSpace
  hote.appendChild(rendu.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 50)
  camera.position.set(0.1, -0.36, 6.9)
  camera.lookAt(0.1, -0.36, 0)

  const porte = new THREE.Group()
  scene.add(porte)
  const pendules: Pendule[] = []
  let matieres: Matieres | null = null
  let detruit = false

  function suspendre(objet: THREE.Object3D, ou: THREE.Vector3, gain: number, phase: number, baseY: number, tour: number) {
    const attache = new THREE.Group()
    attache.position.copy(ou)
    attache.add(objet)
    porte.add(attache)
    objet.rotation.y = baseY
    const p = { objet: attache, angle: 0, vitesse: 0, gain, phase, baseY, tour }
    pendules.push(p)
    return p
  }

  // L anneau : il passe dans l anse du cadenas et dans la tete de la cle.
  // Tourne de biais, son cote droit vient vers l oeil.
  const RAYON_ANNEAU = 0.4
  const BIAIS = -0.9
  // L avance de la cle sur l anneau, pour qu elle passe devant la face du cadenas.
  const DEVANT = 0.16
  // Un point du fil de l anneau, a l angle donne (0 a droite, -90 en bas).
  const surAnneau = (degres: number) => {
    const a = (degres * Math.PI) / 180
    const x = RAYON_ANNEAU * Math.cos(a)
    return new THREE.Vector3(x * Math.cos(BIAIS), 0.36 + RAYON_ANNEAU * Math.sin(a), -x * Math.sin(BIAIS))
  }

  function monter(m: Matieres, modeleCle: THREE.Object3D) {
    if (!photoPrise()) publierPhoto(photographier(rendu, m))
    rendu.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    dimensionner()

    const anneau = new THREE.Mesh(new THREE.TorusGeometry(RAYON_ANNEAU, 0.036, 24, 96), m.chrome)
    anneau.position.y = 0.36
    anneau.rotation.y = BIAIS
    porte.add(anneau)

    // Le cadenas pend a gauche du bas de l anneau : le fil passe sous son anse.
    // Il presente sa face un peu vers la gauche : son cote droit recule et
    // laisse la place a la cle.
    const prise = surAnneau(-108)
    prise.y += 0.11
    suspendre(construireCadenas(m), prise, 0.7, 0, 0.22, 0.08)

    // La cle : le modele de butter.video, en limonade, accrochee a l anneau.
    {
      const cle = modeleCle
      cle.traverse((o) => {
        if (o instanceof THREE.Mesh) o.material = m.limonade
      })
      const b = new THREE.Box3().setFromObject(cle)
      const echelle = 1.3 / (b.max.y - b.min.y)
      cle.scale.setScalar(echelle)
      cle.position.y = -b.max.y * echelle + 0.12
      const tenue = new THREE.Group()
      tenue.add(cle)
      tenue.rotation.z = 0.42
      // La cle pend a droite du bas de l anneau, devant le cadenas : quand
      // elle le touche, elle repose sur sa face, elle ne le traverse pas.
      const accroche = surAnneau(-58)
      accroche.z += DEVANT
      // Un leger elan au depart : la photo d attente montrait la cle au repos.
      suspendre(tenue, accroche, 1.3, 1.7, 0.3, 0.12).angle = 0.1
    }

    // La premiere image est dessinee : la photo d attente peut s effacer.
    avancer(0)
    hote.dataset.vivant = 'true'
    if (!sansMouvement) {
      reveiller(3000)
      avant = performance.now()
      boucle(avant)
    }
  }

  // On ne dessine que tant que quelque chose bouge : apres un geste, ou tant
  // qu un pendule n est pas revenu au repos.
  let reveil = 0
  const reveiller = (duree = 2500) => (reveil = Math.max(reveil, performance.now() + duree))
  const enMouvement = () =>
    performance.now() < reveil || pendules.some((p) => Math.abs(p.angle) > 0.004 || Math.abs(p.vitesse) > 0.02)

  // Le pointeur donne de l elan aux pendules.
  let px = 0
  let dernierX: number | null = null
  function suivre(e: PointerEvent) {
    reveiller()
    px = THREE.MathUtils.clamp((e.clientX / window.innerWidth) * 2 - 1, -1, 1)
    if (dernierX !== null) {
      const elan = THREE.MathUtils.clamp((e.clientX - dernierX) * 0.006, -0.3, 0.3)
      for (const p of pendules) p.vitesse -= elan * p.gain
    }
    dernierX = e.clientX
  }
  function secouer() {
    reveiller()
    for (const p of pendules) p.vitesse += (Math.random() - 0.5) * 8 * p.gain
  }
  window.addEventListener('pointermove', suivre, { passive: true })
  hote.addEventListener('pointerdown', secouer)

  function dimensionner() {
    const { width, height } = hote.getBoundingClientRect()
    if (!width || !height) return
    rendu.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    reveiller(300)
    if (sansMouvement && matieres) avancer(0)
  }
  const veille = new ResizeObserver(() => matieres && dimensionner())
  veille.observe(hote)

  let image = 0
  let visible = true
  let avant = 0
  let temps = 0

  function avancer(dt: number) {
    temps += dt
    porte.rotation.y += (px * 0.3 + Math.sin(temps * 0.5) * 0.16 - porte.rotation.y) * 0.05

    for (const p of pendules) {
      // Ressort de rappel et frottement : le pendule revient au repos.
      p.vitesse += (-20 * p.angle - 2 * p.vitesse) * dt
      p.angle += p.vitesse * dt
      p.objet.rotation.z = p.angle
      p.objet.children[0].rotation.y = p.baseY + Math.sin(temps * 0.6 + p.phase) * p.tour
    }

    rendu.render(scene, camera)
  }

  function boucle(t: number) {
    image = requestAnimationFrame(boucle)
    const dt = Math.min(Math.max(t - avant, 0) / 1000, 1 / 30)
    avant = t
    if (!visible || document.hidden || !enMouvement()) return
    avancer(dt)
  }

  const vue = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
  vue.observe(hote)

  // Les matieres et la cle se chargent ensemble : le trousseau apparait
  // entier, d un seul coup, au lieu de voir la cle arriver apres le cadenas.
  Promise.all([chargerMatieres(), new GLTFLoader().loadAsync('/modeles/cle.glb')])
    .then(([m, gltf]) => {
      matieres = m
      if (!detruit) monter(m, gltf.scene)
    })
    // Sans les images, pas de logo : le nom ecrit a cote suffit.
    .catch(() => {})

  return {
    detruire() {
      detruit = true
      cancelAnimationFrame(image)
      window.removeEventListener('pointermove', suivre)
      hote.removeEventListener('pointerdown', secouer)
      veille.disconnect()
      vue.disconnect()
      jeterFormes(scene)
      if (matieres) {
        for (const m of Object.values(matieres)) {
          if (m instanceof THREE.MeshMatcapMaterial) m.matcap?.dispose()
          m.dispose()
        }
      }
      rendu.dispose()
      rendu.domElement.remove()
      delete hote.dataset.vivant
    },
  }
}
