import { useEffect, useRef, useState } from 'react'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { fermerPdf, ouvrirPdf } from '../apercu/pdf'
import type { FichierRetenu } from '../envoi/EnvoiContexte'
import { genreDe, sansApercu } from '../envoi/formats'
import { Icone } from '../pieces/Icone'
import { IconeFichier } from '../pieces/IconeFichier'
import { BoutonVerre } from '../verre/BoutonVerre'
import './Apercu.css'

// Au-dela, on ne dessine plus : l apercu sert a reconnaitre le document,
// pas a le lire en entier.
const PAGES_MAX = 12

// Une page du PDF, dessinee par pdf.js dans une toile a nous. Elle garde sa
// place des le depart et ne se dessine qu en approchant de l ecran : la
// premiere page arrive tout de suite, les autres ne coutent rien avant.
function PagePdf({ document_, numero, ratio }: { document_: PDFDocumentProxy; numero: number; ratio: string }) {
  const refToile = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const toile = refToile.current
    if (!toile) return
    let annule = false
    let rendu: RenderTask | null = null

    const dessiner = async () => {
      const page = await document_.getPage(numero)
      if (annule) return
      const base = page.getViewport({ scale: 1 })
      const largeur = toile.clientWidth || 360
      const vue = page.getViewport({ scale: (largeur / base.width) * Math.min(window.devicePixelRatio, 1.5) })
      toile.width = vue.width
      toile.height = vue.height
      toile.style.aspectRatio = `${base.width} / ${base.height}`
      rendu = page.render({ canvas: toile, viewport: vue })
      await rendu.promise
      toile.dataset.pret = 'true'
    }

    const veille = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return
        veille.disconnect()
        // Une page annulee en cours de route rejette sa promesse : rien a dire.
        dessiner().catch(() => {})
      },
      { root: toile.closest('.defilement-fin'), rootMargin: '500px 0px' },
    )
    veille.observe(toile)

    return () => {
      annule = true
      veille.disconnect()
      rendu?.cancel()
    }
  }, [document_, numero])

  return <canvas ref={refToile} className="apercu-page" style={{ aspectRatio: ratio }} />
}

type EtatPdf = 'chargement' | 'erreur' | { document_: PDFDocumentProxy; ratio: string }

// Les pages d un PDF, l une sous l autre. Le lecteur du navigateur impose sa
// propre barre de defilement, pas celui-ci.
function PagesPdf({ url }: { url: string }) {
  const [etat, setEtat] = useState<EtatPdf>('chargement')

  useEffect(() => {
    let annule = false
    setEtat('chargement')
    ouvrirPdf(url)
      .then(async (document_) => {
        const premiere = (await document_.getPage(1)).getViewport({ scale: 1 })
        if (!annule) setEtat({ document_, ratio: `${premiere.width} / ${premiere.height}` })
      })
      .catch(() => {
        if (!annule) setEtat('erreur')
      })
    return () => {
      annule = true
      fermerPdf(url)
    }
  }, [url])

  if (etat === 'erreur') {
    return (
      <p className="apercu-attente">
        Ce PDF ne peut pas être affiché ici. Il sera tout de même chiffré et envoyé.
      </p>
    )
  }

  // En attendant le document, une feuille blanche tient deja sa place.
  if (etat === 'chargement') {
    return (
      <div className="apercu-pages" role="status">
        <span className="apercu-page" data-attente="true" />
        <span className="visuellement-cache">Préparation de l'aperçu…</span>
      </div>
    )
  }

  const nombre = Math.min(etat.document_.numPages, PAGES_MAX)
  const reste = etat.document_.numPages - nombre
  return (
    <>
      <div className="apercu-pages">
        {Array.from({ length: nombre }, (_, i) => (
          <PagePdf key={i} document_={etat.document_} numero={i + 1} ratio={etat.ratio} />
        ))}
      </div>
      {reste > 0 && (
        <p className="apercu-suite">
          … et {reste} autre{reste > 1 ? 's' : ''} page{reste > 1 ? 's' : ''}.
        </p>
      )}
    </>
  )
}

function SansApercu() {
  return (
    <div className="apercu-vide">
      <IconeFichier genre="word" />
      <p>
        <b>Pas d'aperçu pour ce document.</b>
        <span>Il sera tout de même chiffré et envoyé tel quel.</span>
      </p>
    </div>
  )
}

// Un document Word (.docx), mis en pages par docx-preview. Les feuilles sont
// composees a leur taille reelle, puis reduites a la largeur de la zone.
function PagesWord({ url }: { url: string }) {
  const refCadre = useRef<HTMLDivElement>(null)
  const refFeuilles = useRef<HTMLDivElement>(null)
  const [etat, setEtat] = useState<'chargement' | 'pret' | 'erreur'>('chargement')

  useEffect(() => {
    const cadre = refCadre.current
    const feuilles = refFeuilles.current
    if (!cadre || !feuilles) return
    let annule = false
    // La largeur d une feuille a taille reelle, mesuree une fois.
    let largeurFeuille = 0

    const ajuster = () => {
      if (!largeurFeuille) return
      const marges = getComputedStyle(cadre)
      const utile = cadre.clientWidth - parseFloat(marges.paddingLeft) - parseFloat(marges.paddingRight)
      feuilles.style.zoom = String(Math.min(1, utile / largeurFeuille))
    }

    ;(async () => {
      try {
        const [{ renderAsync }, contenu] = await Promise.all([
          import('docx-preview'),
          fetch(url).then((r) => r.blob()),
        ])
        // Compose a l ecart, pose d un coup : pas de page a moitie ecrite.
        const brouillon = document.createElement('div')
        await renderAsync(contenu, brouillon, undefined, { className: 'word', inWrapper: false })
        if (annule) return
        feuilles.replaceChildren(...brouillon.childNodes)
        largeurFeuille = feuilles.querySelector<HTMLElement>('section')?.offsetWidth ?? 0
        ajuster()
        setEtat('pret')
      } catch {
        if (!annule) setEtat('erreur')
      }
    })()

    const veille = new ResizeObserver(ajuster)
    veille.observe(cadre)
    return () => {
      annule = true
      veille.disconnect()
      feuilles.replaceChildren()
    }
  }, [url])

  if (etat === 'erreur') return <SansApercu />

  return (
    <div ref={refCadre} className="apercu-pages" role={etat === 'chargement' ? 'status' : undefined}>
      {etat === 'chargement' && (
        <>
          <span className="apercu-page" data-attente="true" />
          <span className="visuellement-cache">Préparation de l'aperçu…</span>
        </>
      )}
      <div ref={refFeuilles} className="apercu-word" />
    </div>
  )
}

// Ce que le navigateur sait montrer du document, sans rien envoyer nulle part.
function Contenu({ fichier }: { fichier: FichierRetenu }) {
  const genre = genreDe(fichier.nom)
  if (genre === 'pdf') return <PagesPdf url={fichier.url} />
  if (genre === 'image') return <img src={fichier.url} alt={`Aperçu de ${fichier.nom}`} decoding="async" />
  if (sansApercu(fichier.nom)) return <SansApercu />
  return <PagesWord url={fichier.url} />
}

// L apercu du document : on verifie d un coup d oeil que c est le bon, avant
// de le deposer comme avant de le partager. Il s agrandit en plein ecran.
export function Apercu({ fichier }: { fichier: FichierRetenu }) {
  const refGrand = useRef<HTMLDialogElement>(null)
  const [ouvert, setOuvert] = useState(false)
  const visible = !sansApercu(fichier.nom)

  return (
    <figure className="apercu">
      <figcaption className="apercu-tete">
        <span className="apercu-titre">Aperçu</span>
        {visible && (
          <button
            type="button"
            className="bouton-discret petit"
            onClick={() => {
              setOuvert(true)
              refGrand.current?.showModal()
            }}
          >
            <Icone nom="agrandir" />
            Agrandir
          </button>
        )}
      </figcaption>
      <div className="apercu-cadre defilement-fin" key={fichier.id}>
        <Contenu fichier={fichier} />
      </div>

      <dialog
        ref={refGrand}
        className="apercu-grand"
        aria-label={`Aperçu de ${fichier.nom}`}
        onClose={() => setOuvert(false)}
      >
        <div className="apercu-grand-tete">
          <span className="apercu-grand-nom">{fichier.nom}</span>
          <BoutonVerre className="sortie" onClick={() => refGrand.current?.close()} icone={<Icone nom="croix" />}>
            Fermer
          </BoutonVerre>
        </div>
        <div className="apercu-grand-cadre defilement-fin">{ouvert && <Contenu fichier={fichier} />}</div>
      </dialog>
    </figure>
  )
}
