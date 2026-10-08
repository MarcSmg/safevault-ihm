import './DocumentVivant.css'

// Une feuille de papier ou le texte est en train de s ecrire : un titre,
// puis quatre lignes d une ecriture a la main, tracees l une apres l autre.
// Elles tiennent un instant, s effacent, et la feuille se remplit de nouveau.
// Le trait se dessine par son pointille (pathLength vaut 1 pour toutes les
// lignes, quelle que soit leur longueur).

const LIGNES = [
  // Le titre : court, plus epais, a l encre ocean.
  'M9 18.5c1.5-1.5 3 1.5 4.5 0s3 1.5 4.5 0 3 1.5 4.5 0',
  'M9 24.5c1.75-1.4 3.5 1.4 5.25 0s3.5 1.4 5.25 0 3.5 1.4 5.25 0 3.5 1.4 5.25 0',
  'M9 29.5c1.6-1.4 3.2 1.4 4.8 0s3.2 1.4 4.8 0 3.2 1.4 4.8 0 3.2 1.4 3.6 0',
  'M9 34.5c1.75-1.4 3.5 1.4 5.25 0s3.5 1.4 5.25 0 3.5 1.4 5.25 0 3.5 1.4 5.25 0',
  'M9 39.5c1.5-1.4 3 1.4 4.5 0s3 1.4 4.5 0',
]

export function DocumentVivant() {
  return (
    <svg className="document-vivant" viewBox="0 0 40 48" aria-hidden="true">
      <defs>
        <linearGradient id="papier" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#eef0f8" />
        </linearGradient>
        <linearGradient id="pli" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#f6f7fc" />
          <stop offset="1" stopColor="#cfd4e6" />
        </linearGradient>
      </defs>

      {/* La feuille, son coin plie et l ombre que le pli jette sur elle. */}
      <path
        className="feuille"
        d="M8 2.5h17.5l10 10V41a4.5 4.5 0 0 1-4.5 4.5H8A4.5 4.5 0 0 1 3.5 41V7A4.5 4.5 0 0 1 8 2.5z"
        fill="url(#papier)"
      />
      <path d="M25.5 2.5 35.5 12.5V16l-10-6z" fill="#1b2350" opacity="0.07" />
      <path className="pli" d="M25.5 2.5V9a3.5 3.5 0 0 0 3.5 3.5h6.5z" fill="url(#pli)" />

      {LIGNES.map((d, i) => (
        <path key={d} className={`ligne ligne-${i + 1}`} d={d} pathLength={1} />
      ))}
    </svg>
  )
}
