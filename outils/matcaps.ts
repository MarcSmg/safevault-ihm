import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// Outil de developpement, hors de l application (ouvrir /outils/matcaps.html
// sur le serveur de developpement). Il cuit les matieres du logo en images
// (des "matcaps") : une boule par matiere, sous l eclairage de studio.
// Le logo n a plus qu a lire ces images, sans calculer la lumiere : la carte
// graphique n a presque rien a compiler et la page demarre sans a-coup.
// A relancer si l on change une couleur.

const TAILLE = 256
const MATIERES: Record<string, THREE.Material> = {
  chrome: new THREE.MeshStandardMaterial({ color: 0xf2f3f5, metalness: 1, roughness: 0.1 }),
  ocean: new THREE.MeshPhysicalMaterial({
    color: 0x1f46fa,
    metalness: 0.85,
    roughness: 0.3,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12,
  }),
  limonade: new THREE.MeshStandardMaterial({ color: 0xc7ee30, metalness: 1, roughness: 0.22 }),
}

const rendu = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
rendu.setPixelRatio(1)
rendu.setSize(TAILLE, TAILLE, false)
rendu.toneMapping = THREE.ACESFilmicToneMapping
rendu.toneMappingExposure = 1.15
rendu.outputColorSpace = THREE.SRGBColorSpace

const scene = new THREE.Scene()
scene.environment = new THREE.PMREMGenerator(rendu).fromScene(new RoomEnvironment(), 0.03).texture
const soleil = new THREE.DirectionalLight(0xffffff, 2)
soleil.position.set(-3, 5, 4)
scene.add(soleil)

// Un matcap se lit par la normale : n.xy * 0,495 + 0,5. La boule deborde
// donc d un rien du cadre, pour que son bord tombe juste sur celui de l image.
const boule = new THREE.Mesh(new THREE.SphereGeometry(1 / 0.99, 160, 120))
scene.add(boule)
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 20)
camera.position.z = 6

const hote = document.getElementById('boules')!
for (const [nom, matiere] of Object.entries(MATIERES)) {
  boule.material = matiere
  rendu.render(scene, camera)
  const fichier = `matcap-${nom}.png`
  const figure = document.createElement('figure')
  const image = document.createElement('img')
  image.src = rendu.domElement.toDataURL('image/png')
  image.dataset.nom = fichier
  const lien = document.createElement('a')
  lien.href = image.src
  lien.download = fichier
  lien.textContent = fichier
  figure.append(image, lien)
  hote.append(figure)
}
document.body.dataset.pret = 'true'
