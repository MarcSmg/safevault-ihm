import { createContext, useContext, useRef, useState, type ReactNode } from 'react'
import type { Collegue } from './annuaire'
import { dansJours, enCle, type Duree } from './durees'

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
  /* Le dernier jour d acces, quand la duree est une date choisie ("2026-10-23"). */
  dateFin: string | null
  partage: boolean
}

const DEPART: Envoi = {
  fichiers: [],
  depose: false,
  destinataires: [],
  droit: 'consulter',
  duree: '7j',
  dateFin: null,
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
    // Passer a "une date" en propose une tout de suite, dans une semaine :
    // le choix n est jamais vide.
    choisirDuree: (duree: Duree) =>
      setEnvoi((e) => ({
        ...e,
        duree,
        dateFin: duree === 'date' && !e.dateFin ? enCle(dansJours(7)) : e.dateFin,
      })),
    choisirDate: (dateFin: string) => changer({ duree: 'date', dateFin }),
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
