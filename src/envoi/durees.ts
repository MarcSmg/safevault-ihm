// Combien de temps le lien reste ouvert.

export type Duree = '24h' | '7j' | '30j' | 'illimitee'

export const DUREES: { valeur: Duree; texte: string; heures: number | null }[] = [
  { valeur: '24h', texte: '24 heures', heures: 24 },
  { valeur: '7j', texte: '7 jours', heures: 24 * 7 },
  { valeur: '30j', texte: '30 jours', heures: 24 * 30 },
  { valeur: 'illimitee', texte: 'Sans limite', heures: null },
]

const jour = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })

// La phrase qui dit, en clair, quand le lien cessera de fonctionner.
export function finAcces(duree: Duree, depuis = new Date()) {
  const d = DUREES.find((x) => x.valeur === duree)!
  if (d.heures === null) return "Le lien reste valable jusqu'à ce que vous le retiriez."
  const fin = new Date(depuis.getTime() + d.heures * 3600_000)
  const quand = d.heures < 48 ? `${jour.format(fin)} à ${heure.format(fin)}` : jour.format(fin)
  return `Le lien cessera de fonctionner le ${quand}.`
}
