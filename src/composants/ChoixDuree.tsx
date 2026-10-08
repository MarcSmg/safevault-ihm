import { DUREES, type Duree } from '../envoi/durees'
import { VerreBouton } from '../verre/useVerreLiquide'
import './ChoixDroit.css'

// La duree d acces : quelques pastilles, une seule retenue.
export function ChoixDuree({
  valeur,
  onChoisir,
  libelle,
}: {
  valeur: Duree
  onChoisir: (d: Duree) => void
  libelle: string
}) {
  return (
    <div className="pastilles" role="radiogroup" aria-labelledby={libelle}>
      {DUREES.map((d) => (
        <VerreBouton
          key={d.valeur}
          rayon={12}
          role="radio"
          aria-checked={valeur === d.valeur}
          className="pastille"
          onClick={() => onChoisir(d.valeur)}
        >
          {d.texte}
        </VerreBouton>
      ))}
    </div>
  )
}
