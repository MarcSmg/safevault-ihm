import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Alerte } from '../composants/Alerte'
import { Apercu } from '../composants/Apercu'
import { Assistant } from '../composants/Assistant'
import { CarteFichier } from '../composants/CarteFichier'
import { NoteSecurite } from '../composants/NoteSecurite'
import { ZoneDepot } from '../composants/ZoneDepot'
import { useEnvoi, type FichierRetenu } from '../envoi/EnvoiContexte'
import { verifier, type Refus } from '../envoi/formats'
import { useNotifier } from '../notifications/Notifications'
import { BoutonVerre } from '../verre/BoutonVerre'

const DUREE_CHIFFREMENT = 1200

type PropsFichier = {
  fichier: FichierRetenu
  depose: boolean
  actif: boolean
  onVoir: () => void
  onRetirer: () => void
  onChiffre: () => void
}

// Un document en cours de depot. Le chiffrement est simule : la barre se
// remplit, puis le document est pret. Un document deja chiffre ne rejoue pas
// sa barre.
function FichierEnDepot({ fichier, depose, actif, onVoir, onRetirer, onChiffre }: PropsFichier) {
  const [progres, setProgres] = useState(fichier.chiffre ? 100 : 0)

  // Le chiffrement ne se lance qu une fois par document : seul son id compte.
  useEffect(() => {
    if (fichier.chiffre) return
    const debut = performance.now()
    let image = 0
    const avancer = (t: number) => {
      const p = Math.min(100, ((t - debut) / DUREE_CHIFFREMENT) * 100)
      setProgres(p)
      if (p < 100) image = requestAnimationFrame(avancer)
      else onChiffre()
    }
    image = requestAnimationFrame(avancer)
    return () => cancelAnimationFrame(image)
  }, [fichier.id])

  let statut = 'chiffrement en cours…'
  if (depose) statut = 'déposé et chiffré'
  else if (fichier.chiffre) statut = 'chiffré, prêt à déposer'

  return (
    <CarteFichier
      fichier={fichier}
      statut={statut}
      progres={fichier.chiffre ? 100 : progres}
      actif={actif}
      onVoir={onVoir}
      onRetirer={onRetirer}
    />
  )
}

export function Deposer() {
  const { fichiers, depose, ajouterFichiers, retirerFichier, marquerChiffre, deposer, recommencer } = useEnvoi()
  const [refus, setRefus] = useState<Refus[]>([])
  const [choisi, setChoisi] = useState<string | null>(null)
  const naviguer = useNavigate()
  const notifier = useNotifier()

  const pret = fichiers.length > 0 && fichiers.every((f) => f.chiffre)
  const montre = fichiers.find((f) => f.id === choisi) ?? fichiers[fichiers.length - 1]
  const plusieurs = fichiers.length > 1

  function recevoir(recus: File[]) {
    const refuses: Refus[] = []
    const bons: File[] = []
    // Le meme document glisse deux fois n est garde qu une fois.
    const connus = new Set(fichiers.map((f) => `${f.nom}/${f.poids}`))
    for (const f of recus) {
      const r = verifier(f)
      const cle = `${f.name}/${f.size}`
      if (r) refuses.push(r)
      else if (!connus.has(cle)) {
        connus.add(cle)
        bons.push(f)
      }
    }
    setRefus(refuses)
    if (bons.length) {
      const ajoutes = ajouterFichiers(bons)
      setChoisi(ajoutes[ajoutes.length - 1].id)
    }
  }

  return (
    <Assistant
      etape={0}
      titre={plusieurs ? 'Déposer des documents' : 'Déposer un document'}
      guide="Ajoutez vos fichiers dans la zone ci-dessous. Chacun est chiffré dès son arrivée."
      cote={montre && <Apercu fichier={montre} />}
      gauche={
        <button
          type="button"
          className="bouton-discret sortie"
          disabled={fichiers.length === 0 && refus.length === 0}
          onClick={() => {
            setRefus([])
            recommencer()
          }}
        >
          Annuler
        </button>
      }
      droite={
        <BoutonVerre
          variante="plein"
          fleche
          disabled={!pret}
          onClick={() => {
            if (!depose) {
              notifier({
                titre: plusieurs ? `${fichiers.length} documents déposés` : 'Document déposé',
                texte: plusieurs
                  ? 'Ils sont chiffrés et rangés dans le coffre.'
                  : `${fichiers[0].nom} est chiffré et rangé dans le coffre.`,
              })
            }
            deposer()
            naviguer('/partager')
          }}
        >
          Suivant
        </BoutonVerre>
      }
    >
      {refus.map((r) => (
        <Alerte key={r.nom} titre={`Le fichier « ${r.nom} » n'a pas pu être ajouté.`}>
          {r.raison}
        </Alerte>
      ))}

      {fichiers.length > 0 && (
        <ul className="fichiers" aria-label="Documents à déposer">
          {fichiers.map((f) => (
            <li key={f.id}>
              <FichierEnDepot
                fichier={f}
                depose={depose}
                actif={plusieurs && montre?.id === f.id}
                onVoir={() => setChoisi(f.id)}
                onRetirer={() => retirerFichier(f.id)}
                onChiffre={() => marquerChiffre(f.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <ZoneDepot onFichiers={recevoir} compacte={fichiers.length > 0} />

      <NoteSecurite>
        Chiffré de bout en bout. Vous seul, puis vos destinataires, pouvez l'ouvrir. Formats acceptés : PDF,
        Word, JPG, PNG.
      </NoteSecurite>
    </Assistant>
  )
}
