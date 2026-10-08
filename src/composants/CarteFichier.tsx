import type { FichierRetenu } from '../envoi/EnvoiContexte'
import { genreDe, poidsLisible } from '../envoi/formats'
import { Cadenas3D } from '../pieces/Cadenas3D'
import { Icone } from '../pieces/Icone'
import { IconeFichier } from '../pieces/IconeFichier'
import { Verre } from '../verre/useVerreLiquide'
import './CarteFichier.css'

type Props = {
  fichier: FichierRetenu
  statut: string
  /* De 0 a 100 ; absent, pas de barre. */
  progres?: number
  /* Present, la croix permet de retirer le fichier. */
  onRetirer?: () => void
  /* Present, un clic sur la carte montre ce document dans l apercu. */
  onVoir?: () => void
  /* C est ce document que l apercu montre. */
  actif?: boolean
  /* Le document est deja dans le coffre. */
  scelle?: boolean
}

// Un document retenu : un etat qui a change se voit avoir change.
export function CarteFichier({ fichier, statut, progres, onRetirer, onVoir, actif, scelle }: Props) {
  const corps = (
    <>
      <IconeFichier genre={genreDe(fichier.nom)} />
      <span className="infos">
        <span className="nom" title={fichier.nom}>
          {fichier.nom}
        </span>
        <span className="meta" aria-live="polite">
          <b>{poidsLisible(fichier.poids)}</b> · {statut}
        </span>
        {progres !== undefined && (
          <span className="progres" data-fini={progres === 100} aria-hidden="true">
            <span style={{ width: `${progres}%` }} />
          </span>
        )}
      </span>
    </>
  )

  return (
    <Verre rayon={16} className="fichier" data-actif={actif}>
      {onVoir ? (
        <button
          type="button"
          className="fichier-voir"
          aria-pressed={actif}
          aria-label={`Voir l'aperçu de ${fichier.nom}`}
          onClick={onVoir}
        >
          {corps}
        </button>
      ) : (
        <span className="fichier-voir">{corps}</span>
      )}
      {onRetirer && (
        <button type="button" className="croix" aria-label={`Retirer ${fichier.nom}`} onClick={onRetirer}>
          <Icone nom="croix" />
        </button>
      )}
      {scelle && <Cadenas3D />}
    </Verre>
  )
}
