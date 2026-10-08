import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Cadenas3D } from '../pieces/Cadenas3D'
import { Verre } from '../verre/useVerreLiquide'
import './Notifications.css'

// Les notifications, a la maniere d iOS : une banniere de verre qui descend
// du haut de l ecran, dit ce qui vient de se passer, puis se retire seule.
// On peut aussi la renvoyer d un clic. Comme sur iOS, l icone est celle de
// l application : le cadenas du logo.

type Notification = { id: number; titre: string; texte: string }
type Annonce = Omit<Notification, 'id'>

const DUREE = 5200

const Contexte = createContext<(a: Annonce) => void>(() => {})

export const useNotifier = () => useContext(Contexte)

export function NotificationsFournisseur({ children }: { children: ReactNode }) {
  const [liste, setListe] = useState<Notification[]>([])
  const compteur = useRef(0)

  const notifier = useCallback((a: Annonce) => {
    setListe((l) => [...l.slice(-2), { ...a, id: ++compteur.current }])
  }, [])
  const retirer = useCallback((id: number) => setListe((l) => l.filter((n) => n.id !== id)), [])

  return (
    <Contexte.Provider value={notifier}>
      {children}
      <div className="notifications" role="status" aria-live="polite">
        {liste.map((n) => (
          <Banniere key={n.id} notification={n} onFin={() => retirer(n.id)} />
        ))}
      </div>
    </Contexte.Provider>
  )
}

function Banniere({ notification, onFin }: { notification: Notification; onFin: () => void }) {
  const [sortie, setSortie] = useState(false)

  useEffect(() => {
    const minuterie = setTimeout(() => setSortie(true), DUREE)
    return () => clearTimeout(minuterie)
  }, [])

  return (
    <Verre
      rayon={24}
      depoli
      className="banniere"
      data-sortie={sortie}
      onClick={() => setSortie(true)}
      onAnimationEnd={(e) => e.animationName === 'banniere-sortie' && onFin()}
    >
      <span className="banniere-icone">
        <Cadenas3D />
      </span>
      <span className="banniere-textes">
        <span className="banniere-ligne">
          <b>{notification.titre}</b>
          <small>maintenant</small>
        </span>
        <span className="banniere-texte">{notification.texte}</span>
      </span>
    </Verre>
  )
}
