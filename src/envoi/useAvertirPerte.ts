import { useState } from 'react'
import { useEnvoi } from './EnvoiContexte'

// Protege un geste qui ferait perdre quelque chose de pas encore enregistre.
// Un document depose entre tout de suite dans le coffre (voir deposer(),
// EnvoiContexte) : le perdre n est plus un risque une fois cette etape
// passee. Ce qui reste a proteger a ce moment-la, c est un partage en cours
// de redaction, pas encore confie. Avant le depot, c est l inverse : le
// fichier choisi n existe encore nulle part ailleurs que dans cet ecran.
// Partage par le logo (retour a l accueil) et les boutons Annuler.
export function useAvertirPerte(action: () => void) {
  const envoi = useEnvoi()
  const [ouvert, setOuvert] = useState(false)

  const aQuelqueChoseAPerdre = envoi.depose
    ? !envoi.partage && envoi.destinataires.length > 0
    : envoi.fichiers.length > 0

  function demander() {
    if (aQuelqueChoseAPerdre) setOuvert(true)
    else action()
  }

  function confirmer() {
    setOuvert(false)
    action()
  }

  function annuler() {
    setOuvert(false)
  }

  return { demander, ouvert, confirmer, annuler }
}
