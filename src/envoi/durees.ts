// Combien de temps le lien reste ouvert : une duree toute faite, ou jusqu a
// une date choisie au calendrier.

export type Duree = '24h' | '7j' | '30j' | 'illimitee' | 'date'

export const DUREES: { valeur: Exclude<Duree, 'date'>; texte: string; heures: number | null }[] = [
  { valeur: '24h', texte: '24 heures', heures: 24 },
  { valeur: '7j', texte: '7 jours', heures: 24 * 7 },
  { valeur: '30j', texte: '30 jours', heures: 24 * 30 },
  { valeur: 'illimitee', texte: 'Sans limite', heures: null },
]

// Au calendrier, on choisit d aujourd hui a dans un an.
export const JOURS_MAX = 365

// Un jour du calendrier s ecrit "2026-10-23", a l heure d ici.
export const enCle = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const deCle = (cle: string) => {
  const [annee, mois, jour] = cle.split('-').map(Number)
  return new Date(annee, mois - 1, jour)
}
// Le jour qui tombe dans n jours, a minuit.
export const dansJours = (n: number, depuis = new Date()) =>
  new Date(depuis.getFullYear(), depuis.getMonth(), depuis.getDate() + n)

const jour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const jourAnnee = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

// La phrase qui dit, en clair, quand le lien cessera de fonctionner.
// `dateFin` ne sert que pour une date choisie au calendrier.
export function finAcces(duree: Duree, dateFin: string | null = null, depuis = new Date()) {
  if (duree === 'date') {
    const fin = deCle(dateFin ?? enCle(depuis))
    // L annee ne se dit que si ce n est pas celle en cours.
    const quand = (fin.getFullYear() === depuis.getFullYear() ? jour : jourAnnee).format(fin)
    return `Le lien fonctionnera jusqu'au ${quand} inclus.`
  }
  const d = DUREES.find((x) => x.valeur === duree)!
  if (d.heures === null) return "Le lien reste valable jusqu'à ce que vous le retiriez."
  const fin = new Date(depuis.getTime() + d.heures * 3600_000)
  const quand = d.heures < 48 ? `${jour.format(fin)} à ${heure.format(fin)}` : jour.format(fin)
  return `Le lien cessera de fonctionner le ${quand}.`
}
