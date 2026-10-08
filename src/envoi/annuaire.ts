// L annuaire de l entreprise, simule pour la maquette.

export type Collegue = { nom: string; email: string }

export const ANNUAIRE: Collegue[] = [
  { nom: 'Ayélé Sagbo', email: 'a.sagbo@entreprise.bj' },
  { nom: 'Koffi Houngbédji', email: 'k.houngbedji@entreprise.bj' },
  { nom: 'Rachida Bio', email: 'r.bio@entreprise.bj' },
  { nom: 'Séna Adjovi', email: 's.adjovi@entreprise.bj' },
  { nom: 'Fiacre Zinsou', email: 'f.zinsou@entreprise.bj' },
  { nom: 'Mariam Tchala', email: 'm.tchala@entreprise.bj' },
  { nom: 'Ulrich Agossou', email: 'u.agossou@entreprise.bj' },
  { nom: 'Edwige Dossou', email: 'e.dossou@entreprise.bj' },
]

const MAX_PROPOSITIONS = 4

// Sans accents ni majuscules : "sena" doit trouver "Séna".
function plat(texte: string) {
  return texte.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function chercher(requete: string, exclus: Collegue[]): Collegue[] {
  const cle = plat(requete.trim())
  if (!cle) return []
  return ANNUAIRE.filter(
    (c) =>
      !exclus.some((e) => e.email === c.email) &&
      (plat(c.nom).includes(cle) || c.email.includes(cle)),
  ).slice(0, MAX_PROPOSITIONS)
}

export function estEmail(texte: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texte)
}

export function initiales(nom: string) {
  const mots = nom.split(/[\s@.]+/).filter(Boolean)
  return mots
    .slice(0, 2)
    .map((m) => m[0].toUpperCase())
    .join('')
}
