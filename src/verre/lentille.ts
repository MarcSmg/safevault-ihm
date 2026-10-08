// La lentille du verre liquide.
//
// Le verre est vu comme une plaque epaisse dont le bord est bombe : sa surface
// suit un profil de squircle sur la largeur du biseau, plate au centre. Pour
// chaque pixel, on calcule ou le rayon de l oeil, refracte par cette surface
// (loi de Snell, indice 1,5), touche le fond. Au centre le rayon file droit ;
// sur le biseau il est devie vers l interieur, d autant plus que la pente est
// forte. Le fond se tasse et se courbe le long des aretes, comme sous le verre
// d Apple ou le curseur de Noomo.
//
// La carte nourrit un feDisplacementMap SVG pose en backdrop-filter. Rouge :
// decalage horizontal, vert : vertical, 128 vaut zero. L echelle du filtre
// vaut deux fois le decalage maximal, pour couvrir [-force, +force].

export type Lentille = {
  carte: string
  echelle: number
  largeur: number
  hauteur: number
}

const INDICE = 1.5
const PAS = 128

// La deviation le long du biseau, de l arete (0) au plat (1), entre 0 et 1.
const profil = (() => {
  const hauteur = (x: number) => Math.pow(1 - Math.pow(1 - x, 4), 1 / 4)
  const brut: number[] = []
  for (let i = 0; i <= PAS; i++) {
    const x = Math.min(Math.max(i / PAS, 0.001), 0.999)
    const e = 0.0005
    const pente = (hauteur(Math.min(x + e, 1)) - hauteur(Math.max(x - e, 0))) / (2 * e)
    const incidence = Math.atan(pente)
    const refraction = Math.asin(Math.sin(incidence) / INDICE)
    brut.push(Math.tan(incidence - refraction))
  }
  const max = Math.max(...brut)
  return brut.map((v) => v / max)
})()

const cache = new Map<string, Lentille>()

export function lentille(largeur: number, hauteur: number, rayon: number): Lentille {
  const l = Math.max(1, Math.round(largeur))
  const h = Math.max(1, Math.round(hauteur))
  const cle = `${l}x${h}r${rayon}`
  const connue = cache.get(cle)
  if (connue) return connue

  const cote = Math.min(l, h)
  const biseau = Math.max(6, Math.min(cote * 0.42, 26))
  const force = Math.max(3, Math.min(cote * 0.2, 16))
  const echelle = force * 2

  // La carte est lisse : on la calcule a demi-taille et le filtre l etire.
  // Quatre fois moins de points a calculer et a encoder.
  const lc = Math.max(1, Math.ceil(l / 2))
  const hc = Math.max(1, Math.ceil(h / 2))
  const toile = document.createElement('canvas')
  toile.width = lc
  toile.height = hc
  const ctx = toile.getContext('2d')!
  const image = ctx.createImageData(lc, hc)
  const px = image.data

  const demiL = l / 2
  const demiH = h / 2
  const r = Math.min(rayon, demiL, demiH)

  for (let y = 0; y < hc; y++) {
    for (let x = 0; x < lc; x++) {
      const cx = ((x + 0.5) * l) / lc - demiL
      const cy = ((y + 0.5) * h) / hc - demiH
      const qx = Math.abs(cx) - (demiL - r)
      const qy = Math.abs(cy) - (demiH - r)
      const ox = Math.max(qx, 0)
      const oy = Math.max(qy, 0)
      const dehors = Math.hypot(ox, oy)

      // Profondeur sous l arete : 0 sur le bord, positive vers le centre.
      const profondeur = r - dehors - Math.min(Math.max(qx, qy), 0)

      // La normale sortante du bord le plus proche.
      let nx = 0
      let ny = 0
      if (dehors > 0) {
        nx = (ox / dehors) * Math.sign(cx)
        ny = (oy / dehors) * Math.sign(cy)
      } else if (qx > qy) {
        nx = Math.sign(cx)
      } else {
        ny = Math.sign(cy)
      }

      let m = 0
      if (profondeur < biseau) {
        const t = Math.max(profondeur, 0) / biseau
        m = force * profil[Math.round(t * PAS)]
      }

      const i = (y * lc + x) * 4
      px[i] = 127.5 + (-nx * m * 255) / echelle
      px[i + 1] = 127.5 + (-ny * m * 255) / echelle
      px[i + 2] = 128
      px[i + 3] = 255
    }
  }

  ctx.putImageData(image, 0, 0)
  const resultat = { carte: toile.toDataURL(), echelle, largeur: l, hauteur: h }
  cache.set(cle, resultat)
  return resultat
}

// Seul Chromium sait poser un filtre SVG en backdrop-filter. Ailleurs, le
// verre garde ses aretes et ses reflets, sans la refraction. On s en passe
// aussi sur les ecrans tactiles : un telephone n a pas la carte graphique
// pour, et le defilement au doigt doit rester fluide.
export const refractionPossible =
  typeof navigator !== 'undefined' &&
  /Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent) &&
  !/Firefox\//.test(navigator.userAgent) &&
  !window.matchMedia('(pointer: coarse)').matches
