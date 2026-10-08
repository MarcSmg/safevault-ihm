import type { Genre } from '../envoi/formats'
import './IconeFichier.css'

// L icone d un document, selon sa famille : une feuille au coin plie, et une
// etiquette qui dit ce que c est. PDF en rouge, Word en ocean, image en
// limonade : on reconnait le fichier avant d avoir lu son nom.

const ETIQUETTES: Record<Genre, string> = { pdf: 'PDF', word: 'DOC', image: 'IMG' }

export function IconeFichier({ genre }: { genre: Genre }) {
  return (
    <svg className="icone-fichier" data-genre={genre} viewBox="0 0 34 40" aria-hidden="true">
      <path
        className="feuille"
        d="M11 2.5h12.5l8 8V34a3.5 3.5 0 0 1-3.5 3.5H11A3.5 3.5 0 0 1 7.5 34V6A3.5 3.5 0 0 1 11 2.5z"
      />
      <path className="pli" d="M23.5 2.5V8a2.5 2.5 0 0 0 2.5 2.5h5.5z" />
      {genre === 'image' && (
        <>
          <circle className="trait" cx="14.5" cy="15" r="1.75" />
          <path className="trait" d="m11 22 4-3.5 3 2.5 2.5-2 4.5 3.5" />
        </>
      )}
      {genre !== 'image' && (
        <>
          <path className="trait" d="M12 13.5h10" />
          <path className="trait" d="M12 17.5h14" />
        </>
      )}
      <rect className="etiquette" x="2" y="22.5" width="23" height="11" rx="3" />
      <text className="texte" x="13.5" y="30.6" textAnchor="middle">
        {ETIQUETTES[genre]}
      </text>
    </svg>
  )
}
