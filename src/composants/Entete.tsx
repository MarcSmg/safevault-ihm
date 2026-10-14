import {  useNavigate } from 'react-router'
import { useEnvoi } from '../envoi/EnvoiContexte'
import { useAvertirPerte } from '../envoi/useAvertirPerte'
import { Logo3D } from '../logo/Logo3D'
import { Verre } from '../verre/useVerreLiquide'
import { Confirmation } from './Confirmation'
import './Entete.css'

// Le logo et l historique a gauche, comme une marque et son premier lien de
// navigation ; le profil seul au bord droit, puisque c est d une autre
// nature, un compte, pas une destination. L anneau du trousseau est accroche
// au S du nom : le cadenas et la cle pendent sous le mot.
export function Entete() {
  const envoi = useEnvoi()
  const naviguer = useNavigate()
  // Le logo ramene a l accueil depuis n importe quel ecran. Un partage en
  // cours de redaction s y perdrait en silence sans ce detour : on previent
  // d abord (voir useAvertirPerte pour la regle exacte).
  const allerALaccueil = useAvertirPerte(() => {
    envoi.recommencer()
    naviguer('/deposer')
  })

  return (
    <header className="entete">
      <div className="entete-marque">
        <button
          type="button"
          className="logo logo-bouton"
          onClick={allerALaccueil.demander}
          aria-label="Retour à l'accueil SafeVault"
        >
          <span className="logo-nom">SafeVault</span>
          <Logo3D />
          {/* Le S, redessine par-dessus la moitie de l anneau qui passe derriere lui. */}
          <span className="logo-s" aria-hidden="true">
            S
          </span>
        </button>
      </div>
      <Verre rayon={26} className="compte">
        <span className="jeton" aria-hidden="true">G</span>
        <span className="qui">Coffi ENANBLO</span>
      </Verre>

      <Confirmation
        ouvert={allerALaccueil.ouvert}
        titre="Un document est en cours"
        texteConfirmer="Continuer quand même"
        onAnnuler={allerALaccueil.annuler}
        onConfirmer={allerALaccueil.confirmer}
      >
        Les données seront perdues. Voulez-vous quand même continuer ?
      </Confirmation>
    </header>
  )
}
