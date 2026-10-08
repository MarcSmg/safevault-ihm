import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
} from 'react'
import { lentille, refractionPossible, type Lentille } from './lentille'

// Les reglages de couleur du verre, poses apres la refraction : presque pas
// de flou, le fond reste lisible et c est la courbure qui fait la matiere.
const TEINTE = 'blur(0.6px) saturate(1.45)'
// Le verre depoli : pour ce qui flotte au-dessus d un texte et doit rester lisible.
export const DEPOLI = 'blur(18px) saturate(1.8)'

// Donne a un element le verre liquide : une lentille a sa taille, refaite
// quand il change de taille, posee en backdrop-filter. Le rayon doit etre
// celui de son border-radius.
export function useVerreLiquide<T extends HTMLElement>(
  rayon: number,
  style?: CSSProperties,
  teinte = TEINTE,
  actif = true,
) {
  const ref = useRef<T>(null)
  const id = `lentille-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const [carte, setCarte] = useState<Lentille | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !actif || !refractionPossible) return
    let attente = 0
    const mesurer = () => {
      cancelAnimationFrame(attente)
      attente = requestAnimationFrame(() => setCarte(lentille(el.offsetWidth, el.offsetHeight, rayon)))
    }
    mesurer()
    const veille = new ResizeObserver(mesurer)
    veille.observe(el)
    return () => {
      cancelAnimationFrame(attente)
      veille.disconnect()
    }
  }, [rayon, actif])

  const filtre = carte && actif ? `url(#${id}) ${teinte}` : undefined

  return {
    ref,
    style: filtre ? { ...style, backdropFilter: filtre, WebkitBackdropFilter: filtre } : style,
    filtre: carte && actif && <FiltreLentille id={id} carte={carte} />,
  }
}

// La refraction : une seule passe de deplacement, pour rester fluide meme
// sur une carte graphique modeste.
function FiltreLentille({ id, carte }: { id: string; carte: Lentille }) {
  return (
    <svg className="lentille-filtre" aria-hidden="true" width="0" height="0">
      <filter
        id={id}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
        x="0"
        y="0"
        width={carte.largeur}
        height={carte.hauteur}
      >
        <feImage
          href={carte.carte}
          x="0"
          y="0"
          width={carte.largeur}
          height={carte.hauteur}
          preserveAspectRatio="none"
          result="carte"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="carte"
          scale={carte.echelle}
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  )
}

// Un bloc en verre liquide. `depoli` le rend lisible au-dessus d un texte ;
// `lentille={false}` garde la matiere du verre sans la refraction, pour les
// grandes surfaces et ce qui n a rien a courber.
export function Verre({
  rayon,
  depoli = false,
  lentille: avecLentille = true,
  className,
  style,
  children,
  ...reste
}: HTMLAttributes<HTMLDivElement> & { rayon: number; depoli?: boolean; lentille?: boolean }) {
  const verre = useVerreLiquide<HTMLDivElement>(rayon, style, depoli ? DEPOLI : undefined, avecLentille)
  return (
    <div ref={verre.ref} className={['verre', className].filter(Boolean).join(' ')} style={verre.style} {...reste}>
      {verre.filtre}
      {children}
    </div>
  )
}

// Un bouton en verre liquide, sans habillage : cartes de choix, pastilles.
export function VerreBouton({
  rayon,
  className,
  style,
  children,
  ...reste
}: ButtonHTMLAttributes<HTMLButtonElement> & { rayon: number }) {
  const verre = useVerreLiquide<HTMLButtonElement>(rayon, style)
  return (
    <button
      ref={verre.ref}
      type="button"
      className={['verre verre-appuyable', className].filter(Boolean).join(' ')}
      style={verre.style}
      {...reste}
    >
      {verre.filtre}
      {children}
    </button>
  )
}
