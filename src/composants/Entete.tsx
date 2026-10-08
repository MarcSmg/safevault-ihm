import { Logo3D } from '../logo/Logo3D'
import { Verre } from '../verre/useVerreLiquide'
import './Entete.css'

// Le logo en haut a gauche, le profil au bord droit. L anneau du trousseau
// est accroche au S du nom : le cadenas et la cle pendent sous le mot.
export function Entete() {
  return (
    <header className="entete">
      <span className="logo">
        <span className="logo-nom">SafeVault</span>
        <Logo3D />
        {/* Le S, redessine par-dessus la moitie de l anneau qui passe derriere lui. */}
        <span className="logo-s" aria-hidden="true">
          S
        </span>
      </span>
      <Verre rayon={26} className="compte">
        <span className="jeton" aria-hidden="true">G</span>
        <span className="qui">Gblewa</span>
      </Verre>
    </header>
  )
}
