import type { Droit } from '../envoi/EnvoiContexte'
import { Icone, type NomIcone } from '../pieces/Icone'
import { VerreBouton } from '../verre/useVerreLiquide'
import './ChoixDroit.css'

export const DROITS: { valeur: Droit; texte: string; detail: string; icone: NomIcone }[] = [
  { valeur: 'consulter', texte: 'Peut consulter', detail: 'Lire et télécharger', icone: 'oeil' },
  { valeur: 'modifier', texte: 'Peut modifier', detail: 'Déposer une nouvelle version', icone: 'crayon' },
]

// Le choix du droit : deux cartes, une seule retenue.
export function ChoixDroit({
  valeur,
  onChoisir,
  libelle,
}: {
  valeur: Droit
  onChoisir: (d: Droit) => void
  libelle: string
}) {
  return (
    <div className="choix-cartes" role="radiogroup" aria-labelledby={libelle}>
      {DROITS.map((d) => {
        const actif = valeur === d.valeur
        return (
          <VerreBouton
            key={d.valeur}
            rayon={16}
            role="radio"
            aria-checked={actif}
            className="choix-carte"
            onClick={() => onChoisir(d.valeur)}
          >
            <span className="choix-icone">
              <Icone nom={d.icone} />
            </span>
            <span className="choix-textes">
              <span className="choix-texte">{d.texte}</span>
              <span className="choix-detail">{d.detail}</span>
            </span>
            <span className="choix-pastille" aria-hidden="true">
              {actif && <Icone nom="coche" epaisseur={2.5} />}
            </span>
          </VerreBouton>
        )
      })}
    </div>
  )
}
