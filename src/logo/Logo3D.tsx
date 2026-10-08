import { useEffect, useRef } from 'react'
import './Logo3D.css'

// Le moteur 3D est lourd : il se charge a part. On le demande des que ce
// fichier est lu, sans attendre que la page soit montee, pour que le
// trousseau arrive au plus tot.
const moteur = import('./sceneLogo')
// Sans WebGL ou hors ligne, le nom ecrit a cote suffit : pas d erreur en console.
moteur.catch(() => {})

// Le logo : le cadenas et sa cle, en 3D. Decoratif, le nom ecrit a cote
// parle aux lecteurs d ecran.
export function Logo3D() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const hote = ref.current
    if (!hote) return
    let annule = false
    let logo: { detruire: () => void } | null = null
    moteur
      .then(({ creerLogo }) => {
        if (!annule) logo = creerLogo(hote)
      })
      // Sans WebGL, le nom suffit.
      .catch(() => {})
    return () => {
      annule = true
      logo?.detruire()
    }
  }, [])

  return <div ref={ref} className="logo-3d" aria-hidden="true" />
}
