import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import type { Collegue } from './annuaire'
import type { Duree } from './durees'

// L envoi en cours, partage par les ecrans : les documents deposes,
// puis a qui on les confie, avec quel droit et pour combien de temps.

// `url` est une adresse locale au navigateur, pour l apercu : le fichier
// ne quitte pas la machine. `chiffre` passe a vrai quand sa barre est pleine.
export type FichierRetenu = { id: string; nom: string; poids: number; url: string; chiffre: boolean }
export type Droit = 'consulter' | 'modifier'

type Envoi = {
  fichiers: FichierRetenu[]
  depose: boolean
  destinataires: Collegue[]
  droit: Droit
  duree: Duree
  partage: boolean
}

const DEPART: Envoi = {
  fichiers: [],
  depose: false,
  destinataires: [],
  droit: 'consulter',
  duree: '7j',
  partage: false,
}

function useEnvoiLocal() {
  const [envoi, setEnvoi] = useState(DEPART)
  const compteur = useRef(0)
  const changer = (morceau: Partial<Envoi>) => setEnvoi((e) => ({ ...e, ...morceau }))

  return {
    ...envoi,
    // Ajoute des documents et les rend ; un nouveau document remet le depot a faire.
    ajouterFichiers: (fichiers: File[]) => {
      const nouveaux = fichiers.map((f) => ({
        id: `f${++compteur.current}`,
        nom: f.name,
        poids: f.size,
        url: URL.createObjectURL(f),
        chiffre: false,
      }))
      setEnvoi((e) => ({ ...e, fichiers: [...e.fichiers, ...nouveaux], depose: false }))
      return nouveaux
    },
    retirerFichier: (id: string) =>
      setEnvoi((e) => {
        e.fichiers.filter((f) => f.id === id).forEach((f) => URL.revokeObjectURL(f.url))
        const fichiers = e.fichiers.filter((f) => f.id !== id)
        return { ...e, fichiers, depose: e.depose && fichiers.length > 0 }
      }),
    marquerChiffre: (id: string) =>
      setEnvoi((e) => ({
        ...e,
        fichiers: e.fichiers.map((f) => (f.id === id ? { ...f, chiffre: true } : f)),
      })),
    deposer: () => changer({ depose: true }),
    ajouter: (c: Collegue) =>
      setEnvoi((e) => ({ ...e, destinataires: [...e.destinataires, c] })),
    retirer: (email: string) =>
      setEnvoi((e) => ({
        ...e,
        destinataires: e.destinataires.filter((c) => c.email !== email),
      })),
    choisirDroit: (droit: Droit) => changer({ droit }),
    choisirDuree: (duree: Duree) => changer({ duree }),
    partager: () => changer({ partage: true }),
    recommencer: () => {
      envoi.fichiers.forEach((f) => URL.revokeObjectURL(f.url))
      setEnvoi(DEPART)
    },
  }
}

const Contexte = createContext<ReturnType<typeof useEnvoiLocal> | null>(null)

export function EnvoiFournisseur({ children }: { children: ReactNode }) {
  return <Contexte.Provider value={useEnvoiLocal()}>{children}</Contexte.Provider>
}

export function useEnvoi() {
  const envoi = useContext(Contexte)
  if (!envoi) throw new Error('useEnvoi doit etre appele sous <EnvoiFournisseur>')
  return envoi
}
