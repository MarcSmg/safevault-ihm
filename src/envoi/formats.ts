// Les formats que le coffre accepte, et les messages de refus en langage
// courant : on dit le probleme et la solution, jamais un code technique.

const EXTENSIONS = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']

export const ACCEPTES = EXTENSIONS.map((e) => `.${e}`).join(',')

export type Refus = { nom: string; raison: string }

function extension(nom: string) {
  const point = nom.lastIndexOf('.')
  return point < 0 ? '' : nom.slice(point + 1).toLowerCase()
}

export function verifier(fichier: File): Refus | null {
  if (!EXTENSIONS.includes(extension(fichier.name))) {
    return {
      nom: fichier.name,
      raison: "Ce format n'est pas accepté. Formats possibles : PDF, Word, JPG, PNG.",
    }
  }
  if (fichier.size === 0) {
    return {
      nom: fichier.name,
      raison: 'Ce fichier est vide. Vérifiez que vous avez choisi le bon document.',
    }
  }
  return null
}

const chiffres = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

export function poidsLisible(octets: number) {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 ** 2) return `${chiffres.format(octets / 1024)} Ko`
  return `${chiffres.format(octets / 1024 ** 2)} Mo`
}

// La famille du document : elle choisit son icone et la facon d en montrer
// un apercu.
export type Genre = 'pdf' | 'image' | 'word'

export function genreDe(nom: string): Genre {
  const e = extension(nom)
  if (e === 'pdf') return 'pdf'
  if (e === 'jpg' || e === 'jpeg' || e === 'png') return 'image'
  return 'word'
}

// L ancien format Word (.doc) est le seul qu on ne sait pas montrer.
export const sansApercu = (nom: string) => extension(nom) === 'doc'
