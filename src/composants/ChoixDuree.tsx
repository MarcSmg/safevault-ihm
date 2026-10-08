import { DUREES, type Duree } from '../envoi/durees'
import { Icone } from '../pieces/Icone'
import { VerreBouton } from '../verre/useVerreLiquide'
import { Calendrier } from './Calendrier'
import './ChoixDroit.css'

// La duree d acces : quelques pastilles, une seule retenue. La derniere
// ouvre un calendrier, pour arreter l acces a la date que l on veut.
export function ChoixDuree({
  valeur,
  date,
  onChoisir,
  onDate,
  libelle,
}: {
  valeur: Duree
  date: string | null
  onChoisir: (d: Duree) => void
  onDate: (cle: string) => void
  libelle: string
}) {
  return (
    <>
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
        <VerreBouton
          rayon={12}
          role="radio"
          aria-checked={valeur === 'date'}
          className="pastille"
          onClick={() => onChoisir('date')}
        >
          <Icone nom="calendrier" />
          Choisir une date
        </VerreBouton>
      </div>
      {valeur === 'date' && date && <Calendrier valeur={date} onChoisir={onDate} />}
    </>
  )
}
