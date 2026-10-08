import { useSyncExternalStore } from 'react'

// Le cadenas 3D du logo, en photo : partout ou l interface montre un cadenas
// (notification, document scelle), c est le meme objet que dans le logo.
// La scene du logo prend la photo une fois, a son demarrage ; ici on la
// garde et on previent ceux qui l attendent.

let photo: string | null = null
const abonnes = new Set<() => void>()

export const photoPrise = () => photo !== null

export function publierPhoto(url: string) {
  photo = url
  abonnes.forEach((prevenir) => prevenir())
}

function abonner(prevenir: () => void) {
  abonnes.add(prevenir)
  return () => abonnes.delete(prevenir)
}

// L adresse de la photo, ou null tant qu elle n est pas prise (ou sans WebGL).
export const usePhotoCadenas = () => useSyncExternalStore(abonner, () => photo)
