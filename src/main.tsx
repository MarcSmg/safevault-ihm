import './styles/polices.css'
import './styles/tokens.css'
import './styles/base.css'
import './styles/verre.css'
import './styles/boutons.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './App'

createRoot(document.getElementById('racine')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
