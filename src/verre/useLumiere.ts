import { useEffect } from 'react'

// La lumiere du verre suit la main : sous le pointeur, un petit verre recoit la
// position de la lueur (--lx, --ly) et l angle de son arete la plus vive
// (--angle), une seule ecriture par image. Le reglage systeme "moins de
// mouvement" l emporte.

const SELECTEUR = '.verre'

export function useLumiere() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let attente = false
    let dernier: PointerEvent | null = null

    function poser() {
      attente = false
      const e = dernier
      if (!e || !(e.target instanceof Element)) return
      const cible = e.target.closest<HTMLElement>(SELECTEUR)
      if (!cible) return
      const b = cible.getBoundingClientRect()
      const x = e.clientX - b.left
      const y = e.clientY - b.top
      cible.style.setProperty('--lx', `${x}px`)
      cible.style.setProperty('--ly', `${y}px`)
      // L angle du conique part du haut ; on le tourne vers la main.
      const angle = (Math.atan2(y - b.height / 2, x - b.width / 2) * 180) / Math.PI + 90
      cible.style.setProperty('--angle', `${angle}deg`)
    }

    function suivre(e: PointerEvent) {
      dernier = e
      if (attente) return
      attente = true
      requestAnimationFrame(poser)
    }

    window.addEventListener('pointermove', suivre, { passive: true })
    return () => window.removeEventListener('pointermove', suivre)
  }, [])
}
