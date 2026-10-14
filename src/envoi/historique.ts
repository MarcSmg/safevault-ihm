import type { Collegue } from './annuaire'
import { supprimerFichier, cleCoffre } from './coffre'
import type { Droit } from './EnvoiContexte'
import type { Duree } from './durees'

// Une ligne de l historique : un document depose entre dans le coffre tout
// de suite, le partage n est qu une etape suivante, parfois absente. Les
// deux temps se lisent sur la meme entree : `dateDepot` existe toujours,
// `datePartage` et le reste n existent que si `partage` est vrai.
// `id` de chaque fichier retrouve ses octets dans le coffre (coffre.ts),
// par la cle `cleCoffre(idHistorique, idFichier)`.
export type EntreeHistorique = {
  id: string
  dateDepot: string
  fichiers: { id: string; nom: string; poids: number }[]
  partage: boolean
  datePartage: string | null
  destinataires: Collegue[]
  droit: Droit | null
  duree: Duree | null
  dateFin: string | null
}

const CLE = 'safevault-historique'
// Au dela, les plus anciennes entrees s effacent : un historique de
// prototype, pas une archive sans fin.
const MAX = 50

// La forme d avant la separation du depot et du partage : une seule date,
// un partage toujours suppose, et des fichiers sans identifiant, puisque le
// coffre (coffre.ts) n existait pas encore pour les retrouver.
type EntreeHeritee = {
  id: string
  date: string
  fichiers: { nom: string; poids: number }[]
  destinataires: Collegue[]
  droit: Droit
  duree: Duree
  dateFin: string | null
}

// Relit une entree ecrite avant l introduction du depot separe du partage,
// sans la perdre : son unique date devient a la fois le depot et le
// partage, et le partage lui-meme reste acquis. Ses fichiers restent sans
// octets consultables : le coffre n avait pas encore de quoi les garder.
function migrer(e: EntreeHistorique | EntreeHeritee): EntreeHistorique {
  if ('dateDepot' in e) return e
  return {
    id: e.id,
    dateDepot: e.date,
    fichiers: e.fichiers.map((f, i) => ({ id: `heritage${i}`, ...f })),
    partage: true,
    datePartage: e.date,
    destinataires: e.destinataires,
    droit: e.droit,
    duree: e.duree,
    dateFin: e.dateFin,
  }
}

export function lireHistorique(): EntreeHistorique[] {
  try {
    const brut = localStorage.getItem(CLE)
    if (!brut) return []
    const valeur = JSON.parse(brut)
    return Array.isArray(valeur) ? valeur.map(migrer) : []
  } catch {
    // Un stockage plein, desactive par la personne, ou corrompu : l historique
    // est un confort, jamais une donnee dont le reste de l app depend.
    return []
  }
}

function ecrireHistorique(entrees: EntreeHistorique[]) {
  const gardees = entrees.slice(0, MAX)
  // Ce qui sort par la limite n a plus de raison de garder ses octets.
  entrees.slice(MAX).forEach((e) => e.fichiers.forEach((f) => supprimerFichier(cleCoffre(e.id, f.id))))
  try {
    localStorage.setItem(CLE, JSON.stringify(gardees))
  } catch {
    // Un geste reussi (deposer, partager) ne doit jamais echouer parce que
    // sa trace n a pas pu s ecrire : on tente, et on continue sinon.
  }
}

// Le document entre dans le coffre des cet instant, partage ou non : rend
// l identifiant de l entree, pour que partagerHistorique la retrouve plus
// tard si un partage a lieu dans la meme visite, et pour que ses fichiers
// retrouvent leurs octets par cleCoffre(id, fichier.id).
export function deposerHistorique(fichiers: { id: string; nom: string; poids: number }[]): string {
  const id = `h${Date.now()}${Math.random().toString(36).slice(2, 7)}`
  const entree: EntreeHistorique = {
    id,
    dateDepot: new Date().toISOString(),
    fichiers,
    partage: false,
    datePartage: null,
    destinataires: [],
    droit: null,
    duree: null,
    dateFin: null,
  }
  ecrireHistorique([entree, ...lireHistorique()])
  return id
}

// Complete l entree deja ouverte par deposerHistorique : la meme ligne porte
// desormais les deux temps, plutot que d en dupliquer une seconde.
export function partagerHistorique(
  id: string,
  details: { destinataires: Collegue[]; droit: Droit; duree: Duree; dateFin: string | null },
) {
  const suite = lireHistorique().map((e) =>
    e.id === id ? { ...e, partage: true, datePartage: new Date().toISOString(), ...details } : e,
  )
  ecrireHistorique(suite)
}
