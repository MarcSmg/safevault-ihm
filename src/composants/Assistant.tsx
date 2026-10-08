import { useEffect, useRef, type ReactNode } from 'react'
import { ListeEtapes } from './ListeEtapes'
import './Assistant.css'

type Props = {
  /* 0 deposer, 1 partager, 2 termine. */
  etape: 0 | 1 | 2
  titre: string
  /* Le guidage : la phrase qui dit quoi faire, en langage courant. */
  guide: ReactNode
  /* Ce qui se lit avant le titre, comme le rappel du document. */
  avant?: ReactNode
  /* La colonne de droite du panneau : l apercu du document. */
  cote?: ReactNode
  /* La barre d actions : la sortie a gauche, l avancee a droite. */
  gauche?: ReactNode
  droite?: ReactNode
  children?: ReactNode
}

// Le parcours guide, a la maniere des formulaires de creation d e-freeshop :
// les etapes a gauche, l etape en cours dans un panneau, les actions en bas.
export function Assistant({ etape, titre, guide, avant, cote, gauche, droite, children }: Props) {
  const refTitre = useRef<HTMLHeadingElement>(null)

  // Chaque etape est une page : le titre prend le focus pour que le lecteur
  // d ecran annonce ou l on est, et l onglet porte le meme nom.
  useEffect(() => {
    document.title = `${titre} · SafeVault`
    refTitre.current?.focus({ preventScroll: true })
  }, [titre])

  // Une etape s ouvre en haut de la page, comme une page neuve : le bouton qui
  // y mene est tout en bas, on n a pas a remonter soi-meme.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [etape])

  return (
    <div className="assistant">
      <header className="assistant-tete">
        <h1 className="assistant-titre">Envoyer un document</h1>
        <p className="assistant-chapo">
          Déposez-le, choisissez qui peut l'ouvrir. SafeVault chiffre tout à votre place.
        </p>
      </header>

      <div className="assistant-grille">
        <ListeEtapes courante={etape} />

        <section className="panneau verre-plaque" aria-labelledby="titre-etape">
          <div className="panneau-colonnes" data-cote={Boolean(cote)} key={etape}>
            <div className="panneau-corps">
              {avant}
              <div className="panneau-tete">
                <h2 id="titre-etape" ref={refTitre} tabIndex={-1} className="panneau-titre">
                  {titre}
                </h2>
                <p className="guide">{guide}</p>
              </div>
              {children}
            </div>
            {cote && <aside className="panneau-cote">{cote}</aside>}
          </div>

          {(gauche || droite) && (
            <div className="panneau-barre">
              <div className="barre-groupe">{gauche}</div>
              <div className="barre-groupe">{droite}</div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
