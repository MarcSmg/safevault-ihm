import { useId, type ReactNode } from 'react'
import './Champ.css'

type Props = {
  libelle: string
  /* L id du controle a lier par un <label>. Sans lui, le libelle porte
     l id `idLibelle`, a reprendre en aria-labelledby sur un groupe. */
  pour?: string
  idLibelle?: string
  requis?: boolean
  /* La bulle "?" : a quoi sert le champ, en une phrase. */
  info?: string
  /* La ligne sous le champ, qui repond a ce que l on vient de faire. */
  aide?: ReactNode
  children: ReactNode
}

export function Champ({ libelle, pour, idLibelle, requis, info, aide, children }: Props) {
  const Libelle = pour ? 'label' : 'span'
  return (
    <div className="champ-bloc">
      <div className="champ-tete">
        <Libelle className="champ-libelle" htmlFor={pour} id={idLibelle}>
          {libelle}
          {requis && (
            <span className="champ-requis" aria-hidden="true">
              *
            </span>
          )}
        </Libelle>
        {info && <BulleInfo texte={info} />}
      </div>
      {children}
      {aide && (
        <p className="champ-aide" aria-live="polite">
          {aide}
        </p>
      )}
    </div>
  )
}

function BulleInfo({ texte }: { texte: string }) {
  const id = useId()
  return (
    <span className="bulle">
      <button type="button" className="bulle-bouton" aria-label="À quoi sert ce champ ?" aria-describedby={id}>
        ?
      </button>
      <span role="tooltip" id={id} className="bulle-texte">
        {texte}
      </span>
    </span>
  )
}
