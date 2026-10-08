import { initiales, type Collegue } from '../envoi/annuaire'
import { Icone } from '../pieces/Icone'
import { Verre } from '../verre/useVerreLiquide'
import './PastilleDestinataire.css'

// Le collegue ajoute, une pastille que l on peut retirer : controle explicite.
export function PastilleDestinataire({
  collegue,
  onRetirer,
}: {
  collegue: Collegue
  onRetirer: () => void
}) {
  const horsAnnuaire = collegue.nom === collegue.email
  return (
    <Verre rayon={24} lentille={false} className="destinataire">
      <span className="jeton" aria-hidden="true">
        {initiales(collegue.nom)}
      </span>
      <span className="ligne">
        <b>{collegue.nom}</b>
        {!horsAnnuaire && <small>{collegue.email}</small>}
      </span>
      <button
        type="button"
        className="croix"
        aria-label={`Retirer ${collegue.nom}`}
        onClick={onRetirer}
      >
        <Icone nom="croix" />
      </button>
    </Verre>
  )
}
