import { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { prechaufferPdf } from './apercu/pdf'
import { Entete } from './composants/Entete'
import { Deposer } from './ecrans/Deposer'
import { Envoye } from './ecrans/Envoye'
import { Partager } from './ecrans/Partager'
import { EnvoiFournisseur } from './envoi/EnvoiContexte'
import { NotificationsFournisseur } from './notifications/Notifications'
import { useLumiere } from './verre/useLumiere'

export function App() {
  useLumiere()
  useEffect(prechaufferPdf, [])

  return (
    <EnvoiFournisseur>
      <NotificationsFournisseur>
        <main className="scene">
          <Entete />
          <Routes>
            <Route path="/deposer" element={<Deposer />} />
            <Route path="/partager" element={<Partager />} />
            <Route path="/envoye" element={<Envoye />} />
            <Route path="*" element={<Navigate to="/deposer" replace />} />
          </Routes>
          <p className="pied">Maquette EC1, ergonomie. Police Wura mi by GemmaS.</p>
        </main>
      </NotificationsFournisseur>
    </EnvoiFournisseur>
  )
}
