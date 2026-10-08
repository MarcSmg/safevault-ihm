import type { PDFDocumentProxy, PDFWorker } from 'pdfjs-dist'
import urlOuvrier from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// pdf.js, pour l apercu. Le lancer coute cher (un gros script a lire, un
// fil de calcul a demarrer) : on ne le fait qu une fois, a l avance, et tous
// les documents passent par le meme fil.

type Moteur = { pdfjs: typeof import('pdfjs-dist'); ouvrier: PDFWorker }

let moteur: Promise<Moteur> | null = null

function moteurPdf() {
  moteur ??= import('pdfjs-dist').then(async (pdfjs) => {
    pdfjs.GlobalWorkerOptions.workerSrc = urlOuvrier
    const ouvrier = new pdfjs.PDFWorker()
    await ouvrier.promise
    return { pdfjs, ouvrier }
  })
  // Un echec (reseau coupe au mauvais moment) ne doit pas condamner la suite.
  moteur.catch(() => {
    moteur = null
  })
  return moteur
}

// A appeler au demarrage : le moteur se prepare pendant que la page est au
// repos, et le premier PDF s affiche sans attendre.
export function prechaufferPdf() {
  const lancer = () => void moteurPdf().catch(() => {})
  if ('requestIdleCallback' in window) requestIdleCallback(lancer, { timeout: 2000 })
  else setTimeout(lancer, 800)
}

// Les documents ouverts, par adresse. Le petit apercu et le grand lisent le
// meme : on compte qui s en sert, et on ne le ferme qu une fois lache par tous.
type Ouvert = { document: Promise<PDFDocumentProxy>; usages: number }
const ouverts = new Map<string, Ouvert>()

export function ouvrirPdf(url: string) {
  let ouvert = ouverts.get(url)
  if (!ouvert) {
    ouvert = {
      usages: 0,
      document: moteurPdf().then(({ pdfjs, ouvrier }) => pdfjs.getDocument({ url, worker: ouvrier }).promise),
    }
    ouverts.set(url, ouvert)
  }
  ouvert.usages++
  return ouvert.document
}

export function fermerPdf(url: string) {
  const ouvert = ouverts.get(url)
  if (!ouvert) return
  ouvert.usages--
  // On attend un peu : on revient souvent au document qu on vient de quitter.
  setTimeout(() => {
    if (ouvert.usages > 0 || ouverts.get(url) !== ouvert) return
    ouverts.delete(url)
    ouvert.document.then((d) => d.loadingTask.destroy()).catch(() => {})
  }, 5000)
}
