import { useRef, useState } from 'react'
import { ACCEPTES } from '../envoi/formats'
import { Icone } from '../pieces/Icone'
import { BoutonVerre } from '../verre/BoutonVerre'
import { Verre } from '../verre/useVerreLiquide'
import './ZoneDepot.css'

type Props = {
  onFichiers: (f: File[]) => void
  /* Des documents sont deja la : la zone se fait petite et invite a en ajouter. */
  compacte?: boolean
}

// Sur un ecran tactile on ne glisse pas un fichier : on le dit autrement.
const TACTILE = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

// La zone de depot : on y glisse un ou plusieurs fichiers, ou on clique
// n importe ou dedans pour ouvrir le selecteur.
export function ZoneDepot({ onFichiers, compacte = false }: Props) {
  const refEntree = useRef<HTMLInputElement>(null)
  const [survol, setSurvol] = useState(false)

  let invite = TACTILE ? 'Touchez pour choisir vos fichiers' : 'Glissez-déposez vos fichiers ici'
  if (compacte) invite = 'Ajoutez un autre document'
  if (survol) invite = 'Lâchez les fichiers ici'

  let precision = TACTILE ? 'depuis votre appareil' : 'ou'
  if (compacte) precision = TACTILE ? 'Touchez pour parcourir vos fichiers.' : 'Glissez-le ici, ou parcourez vos fichiers.'

  return (
    <>
      <Verre
        rayon={22}
        lentille={false}
        className="depot"
        data-survol={survol}
        data-compacte={compacte}
        onClick={() => refEntree.current?.click()}
        onDragEnter={(e) => {
          e.preventDefault()
          setSurvol(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSurvol(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setSurvol(false)
          if (e.dataTransfer.files.length) onFichiers([...e.dataTransfer.files])
        }}
      >
        <span className="rond">
          <Icone nom="deposer" />
        </span>
        <span className="depot-textes">
          <p>{invite}</p>
          <p className="ou">{precision}</p>
        </span>
        <BoutonVerre>Parcourir mes fichiers</BoutonVerre>
      </Verre>
      {/* Hors de la zone, pour que son clic ne remonte pas jusqu a elle. */}
      <input
        ref={refEntree}
        type="file"
        accept={ACCEPTES}
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFichiers([...e.target.files])
          e.target.value = ''
        }}
      />
    </>
  )
}
