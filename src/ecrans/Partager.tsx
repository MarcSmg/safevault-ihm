import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Apercu } from '../composants/Apercu'
import { Assistant } from '../composants/Assistant'
import { CarteFichier } from '../composants/CarteFichier'
import { Champ } from '../composants/Champ'
import { ChampDestinataire } from '../composants/ChampDestinataire'
import { ChoixDroit } from '../composants/ChoixDroit'
import { ChoixDuree } from '../composants/ChoixDuree'
import { PastilleDestinataire } from '../composants/PastilleDestinataire'
import { finAcces } from '../envoi/durees'
import { useEnvoi } from '../envoi/EnvoiContexte'
import { useNotifier } from '../notifications/Notifications'
import { Icone } from '../pieces/Icone'
import { BoutonVerre } from '../verre/BoutonVerre'

const enListe = new Intl.ListFormat('fr', { type: 'conjunction' })

export function Partager() {
  const envoi = useEnvoi()
  const naviguer = useNavigate()
  const notifier = useNotifier()
  const [choisi, setChoisi] = useState<string | null>(null)

  // On n arrive ici qu avec des documents deja dans le coffre.
  if (envoi.fichiers.length === 0 || !envoi.depose) return <Navigate to="/deposer" replace />
  if (envoi.partage) return <Navigate to="/envoye" replace />

  const { fichiers, destinataires } = envoi
  const plusieursDocs = fichiers.length > 1
  const plusieurs = destinataires.length > 1
  const montre = fichiers.find((f) => f.id === choisi) ?? fichiers[0]
  const ceQuOnPartage = plusieursDocs ? 'ces documents' : 'ce document'

  let aideDestinataire = 'Tapez un nom ou une adresse, puis choisissez dans la liste ou appuyez sur Entrée.'
  if (destinataires.length === 1) aideDestinataire = "1 personne recevra le lien. Vous pouvez en ajouter d'autres."
  if (plusieurs) aideDestinataire = `${destinataires.length} personnes recevront le lien.`

  return (
    <Assistant
      etape={1}
      titre="Partager avec un collègue"
      guide={`Ajoutez la personne qui pourra consulter ${ceQuOnPartage}. Elle recevra un lien sécurisé, rien ne quitte le coffre.`}
      avant={
        <ul className="fichiers" aria-label="Documents déposés">
          {fichiers.map((f) => (
            <li key={f.id}>
              <CarteFichier
                fichier={f}
                statut="déposé et chiffré"
                scelle
                actif={plusieursDocs && montre.id === f.id}
                onVoir={plusieursDocs ? () => setChoisi(f.id) : undefined}
              />
            </li>
          ))}
        </ul>
      }
      cote={<Apercu fichier={montre} />}
      gauche={
        <button
          type="button"
          className="bouton-discret sortie"
          onClick={() => {
            envoi.recommencer()
            naviguer('/deposer')
          }}
        >
          Annuler
        </button>
      }
      droite={
        <>
          <button type="button" className="bouton-discret" onClick={() => naviguer('/deposer')}>
            <Icone nom="flecheGauche" />
            Retour
          </button>
          <BoutonVerre
            variante="plein"
            fleche
            disabled={destinataires.length === 0}
            onClick={() => {
              const noms = enListe.format(destinataires.map((c) => c.nom))
              notifier({
                titre: plusieursDocs ? 'Documents envoyés avec succès' : 'Document envoyé avec succès',
                texte: `${noms} ${plusieurs ? 'recevront' : 'recevra'} un lien sécurisé.`,
              })
              envoi.partager()
              naviguer('/envoye')
            }}
          >
            {plusieursDocs ? 'Partager les documents' : 'Partager le document'}
          </BoutonVerre>
        </>
      }
    >
      <Champ
        libelle="Destinataire"
        pour="champ-destinataire"
        requis
        info="Seules les personnes ajoutées ici pourront ouvrir le lien. Un collègue hors annuaire s'ajoute par son adresse e-mail."
        aide={aideDestinataire}
      >
        <ChampDestinataire exclus={destinataires} onAjouter={envoi.ajouter} />
        {destinataires.length > 0 && (
          <ul className="destinataires" aria-label="Destinataires retenus">
            {destinataires.map((c) => (
              <li key={c.email}>
                <PastilleDestinataire collegue={c} onRetirer={() => envoi.retirer(c.email)} />
              </li>
            ))}
          </ul>
        )}
      </Champ>

      <Champ
        libelle={plusieurs ? 'Ce que ces personnes pourront faire' : "Ce qu'elle pourra faire"}
        idLibelle="libelle-droit"
        info="Consulter suffit dans la plupart des cas. Modifier permet aussi de remplacer le document par une nouvelle version."
      >
        <ChoixDroit valeur={envoi.droit} onChoisir={envoi.choisirDroit} libelle="libelle-droit" />
      </Champ>

      <Champ
        libelle="Durée de l'accès"
        idLibelle="libelle-duree"
        info="Par sécurité, le lien s'éteint tout seul. Vous pourrez toujours le retirer plus tôt."
        aide={finAcces(envoi.duree)}
      >
        <ChoixDuree valeur={envoi.duree} onChoisir={envoi.choisirDuree} libelle="libelle-duree" />
      </Champ>
    </Assistant>
  )
}
