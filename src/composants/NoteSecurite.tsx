import type { ReactNode } from 'react'
import { DocumentVivant } from '../pieces/DocumentVivant'
import './NoteSecurite.css'

// La note de securite : une feuille qui s ecrit, et la phrase qui rassure.
export function NoteSecurite({ children }: { children: ReactNode }) {
  return (
    <span className="securite">
      <DocumentVivant />
      <span>{children}</span>
    </span>
  )
}
