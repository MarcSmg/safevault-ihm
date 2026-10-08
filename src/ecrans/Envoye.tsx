import { Navigate, useNavigate } from 'react-router'
import { Assistant } from '../composants/Assistant'
import { CarteFichier } from '../composants/CarteFichier'
import { DROITS } from '../composants/ChoixDroit'
import { finAcces } from '../envoi/durees'
import { useEnvoi } from '../envoi/EnvoiContexte'
import { Icone } from '../pieces/Icone'
import { BoutonVerre } from '../verre/BoutonVerre'
import './Envoye.css'

const enListe = new Intl.ListFormat('fr', { type: 'conjunction' })

// La fin du parcours : on dit ce qui a ete fait, et on offre de recommencer.
export function Envoye() {
  const envoi = useEnvoi()
  const naviguer = useNavigate()

  if (envoi.fichiers.length === 0 || !envoi.partage) return <Navigate to="/deposer" replace />

  const { fichiers, destinataires } = envoi
  const droit = DROITS.find((d) => d.valeur === envoi.droit)!
  const noms = enListe.format(destinataires.map((c) => c.nom))
  const verbe = destinataires.length > 1 ? 'recevront' : 'recevra'

  return (
    <Assistant
      etape={2}
      titre={fichiers.length > 1 ? 'Documents partagés' : 'Document partagé'}
      guide={`${noms} ${verbe} un lien sécurisé par e-mail.`}
      avant={
        <span className="reussite" aria-hidden="true">
          <Icone nom="coche" epaisseur={2.2} />
        </span>
      }
      droite={
        <BoutonVerre
          variante="plein"
          fleche
          onClick={() => {
            envoi.recommencer()
            naviguer('/deposer')
          }}
        >
          Envoyer un autre document
        </BoutonVerre>
      }
    >
      <ul className="fichiers" aria-label="Documents partagés">
        {fichiers.map((f) => (
          <li key={f.id}>
            <CarteFichier fichier={f} statut="déposé et chiffré" scelle />
          </li>
        ))}
      </ul>
      <ul className="recapitulatif">
        <li>
          <Icone nom={droit.icone} />
          <span>
            <b>{droit.texte}</b> · {droit.detail.toLowerCase()}
          </span>
        </li>
        <li>
          <Icone nom="horloge" />
          <span>{finAcces(envoi.duree, envoi.dateFin)}</span>
        </li>
      </ul>
    </Assistant>
  )
}
