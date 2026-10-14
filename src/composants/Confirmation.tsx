import { useEffect, useRef, type ReactNode } from 'react'
import { Icone } from '../pieces/Icone'
import { BoutonVerre } from '../verre/BoutonVerre'
import './Confirmation.css'

type Props = {
  ouvert: boolean
  titre: string
  children: ReactNode
  texteConfirmer: string
  onAnnuler: () => void
  onConfirmer: () => void
}

// Une question posee avant un geste sensible : on dit le risque, puis on
// laisse le dernier mot a la personne. Echap ferme comme la croix, et c est
// toujours un refus silencieux, jamais une validation par defaut.
export function Confirmation({ ouvert, titre, children, texteConfirmer, onAnnuler, onConfirmer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (ouvert && !d.open) d.showModal()
    if (!ouvert && d.open) d.close()
  }, [ouvert])

  return (
    <dialog
      ref={ref}
      className="confirmation verre-plaque"
      aria-labelledby="confirmation-titre"
      onCancel={onAnnuler}
    >
      <span className="confirmation-icone" aria-hidden="true">
        <Icone nom="alerte" epaisseur={1.8} />
      </span>
      <p id="confirmation-titre" className="confirmation-titre">
        {titre}
      </p>
      <div className="confirmation-texte">{children}</div>
      <div className="confirmation-actions">
        <button type="button" className="bouton-discret" onClick={onAnnuler}>
          Annuler
        </button>
        <BoutonVerre variante="plein" onClick={onConfirmer}>
          {texteConfirmer}
        </BoutonVerre>
      </div>
    </dialog>
  )
}
