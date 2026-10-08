import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icone } from '../pieces/Icone'
import { useVerreLiquide } from './useVerreLiquide'
import './BoutonVerre.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  /* plein : l action principale de l ecran ; clair : une action d appoint. */
  variante?: 'plein' | 'clair'
  fleche?: boolean
  icone?: ReactNode
}

// Le rayon des boutons, a garder egal a celui de BoutonVerre.css.
const RAYON = 14

// Un bouton en verre liquide : ses bords courbent ce qui passe derriere.
export function BoutonVerre({
  variante = 'clair',
  fleche = false,
  icone,
  className,
  style,
  children,
  ...reste
}: Props) {
  const verre = useVerreLiquide<HTMLButtonElement>(RAYON, style)

  return (
    <button
      ref={verre.ref}
      type="button"
      className={['bouton-verre verre verre-appuyable', variante === 'plein' && 'plein', className]
        .filter(Boolean)
        .join(' ')}
      style={verre.style}
      {...reste}
    >
      {verre.filtre}
      <span className="bouton-verre-texte">
        {icone}
        {children}
        {fleche && (
          <span className="fleche" aria-hidden="true">
            <Icone nom="flecheDroite" />
          </span>
        )}
      </span>
    </button>
  )
}
