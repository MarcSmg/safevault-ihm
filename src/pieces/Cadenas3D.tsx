import { usePhotoCadenas } from '../logo/photoCadenas'
import { Icone } from './Icone'
import './Cadenas3D.css'

// Le cadenas du logo, en image. Sans WebGL, ou le temps que la photo soit
// prise, le cadenas au trait le remplace.
export function Cadenas3D({ className }: { className?: string }) {
  const photo = usePhotoCadenas()
  const classes = ['cadenas-3d', className].filter(Boolean).join(' ')
  return (
    <span className={classes} aria-hidden="true">
      {photo ? <img src={photo} alt="" draggable={false} /> : <Icone nom="cadenas" />}
    </span>
  )
}
