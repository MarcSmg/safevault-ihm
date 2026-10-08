import type { ReactNode } from 'react'
import { Icone } from '../pieces/Icone'
import './Alerte.css'

// Le message d erreur : ce qui s est passe, puis quoi faire.
export function Alerte({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="alerte" role="alert">
      <Icone nom="alerte" />
      <span className="texte">
        <b>{titre}</b> <span>{children}</span>
      </span>
    </div>
  )
}
