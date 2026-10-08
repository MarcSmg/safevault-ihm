// Le jeu d icones de SafeVault, dessine pour lui, dans la grammaire d iOS :
// grille de 24, trait de 1,5, bouts et angles arrondis, formes pleines
// evitees. Pas de couleur propre : l icone prend celle du texte.
// Chaque trait declare une longueur de 1 : au survol il se retrace au meme
// rythme, qu il soit court ou long (voir styles/boutons.css).

const TRACES = {
  cadenas: (
    <>
      <rect pathLength={1} x="4.75" y="10.75" width="14.5" height="10.5" rx="2.75" />
      <path pathLength={1} d="M8 10.75V7.5a4 4 0 0 1 8 0v3.25" />
      <path pathLength={1} d="M12 15v2" />
    </>
  ),
  cle: (
    <>
      <circle pathLength={1} cx="8" cy="15.5" r="3.75" />
      <path pathLength={1} d="M10.75 12.75 19 4.5" />
      <path pathLength={1} d="m16.25 7.25 2.25 2.25" />
      <path pathLength={1} d="m14 9.5 1.75 1.75" />
    </>
  ),
  fichier: (
    <>
      <path pathLength={1} d="M13.75 3.25H7.5A2.25 2.25 0 0 0 5.25 5.5v13a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25V8.25z" />
      <path pathLength={1} d="M13.75 3.25v3.5a1.5 1.5 0 0 0 1.5 1.5h3.5" />
    </>
  ),
  image: (
    <>
      <rect pathLength={1} x="3.75" y="4.75" width="16.5" height="14.5" rx="2.75" />
      <circle pathLength={1} cx="9" cy="9.75" r="1.5" />
      <path pathLength={1} d="m4.25 17 4.5-4.25 3.5 3.25 2.75-2.5 4.75 4.25" />
    </>
  ),
  deposer: (
    <>
      <g className="icone-fleche">
        <path pathLength={1} d="M12 3.75v10.5" />
        <path pathLength={1} d="m7.75 10 4.25 4.25L16.25 10" />
      </g>
      <path pathLength={1} d="M4.75 15.25v2a2.5 2.5 0 0 0 2.5 2.5h9.5a2.5 2.5 0 0 0 2.5-2.5v-2" />
    </>
  ),
  alerte: (
    <>
      <path pathLength={1} d="M10.4 4.6 3.3 17.1a1.85 1.85 0 0 0 1.6 2.65h14.2a1.85 1.85 0 0 0 1.6-2.65L13.6 4.6a1.85 1.85 0 0 0-3.2 0z" />
      <path pathLength={1} d="M12 9.5v4" />
      <path pathLength={1} d="M12 16.75h.01" />
    </>
  ),
  personne: (
    <>
      <circle pathLength={1} cx="12" cy="8.25" r="3.5" />
      <path pathLength={1} d="M5.25 19.5c.9-3.1 3.55-5 6.75-5s5.85 1.9 6.75 5" />
    </>
  ),
  oeil: (
    <>
      <path pathLength={1} d="M2.75 12C4.6 8.1 8 5.75 12 5.75s7.4 2.35 9.25 6.25C19.4 15.9 16 18.25 12 18.25S4.6 15.9 2.75 12z" />
      <circle pathLength={1} cx="12" cy="12" r="3" />
    </>
  ),
  crayon: (
    <>
      <path pathLength={1} d="m14.75 5.75 3.5 3.5" />
      <path pathLength={1} d="M4.75 19.25 5.5 15.5 15.9 5.1a2.47 2.47 0 0 1 3.5 3.5L9 19l-4.25.25z" />
    </>
  ),
  horloge: (
    <>
      <circle pathLength={1} cx="12" cy="12" r="8.25" />
      <path pathLength={1} d="M12 7.75V12l2.75 1.75" />
    </>
  ),
  calendrier: (
    <>
      <rect pathLength={1} x="3.75" y="5.25" width="16.5" height="15" rx="2.75" />
      <path pathLength={1} d="M3.75 10h16.5" />
      <path pathLength={1} d="M8 3.25v3.5" />
      <path pathLength={1} d="M16 3.25v3.5" />
    </>
  ),
  chevronGauche: <path pathLength={1} d="M14.25 6.25 8.5 12l5.75 5.75" />,
  chevronDroite: <path pathLength={1} d="m9.75 6.25 5.75 5.75-5.75 5.75" />,
  croix: (
    <>
      <path pathLength={1} d="m6.75 6.75 10.5 10.5" />
      <path pathLength={1} d="m17.25 6.75-10.5 10.5" />
    </>
  ),
  coche: <path pathLength={1} d="m5.25 12.5 4.25 4.25 9.25-9.5" />,
  cocheCercle: (
    <>
      <circle pathLength={1} cx="12" cy="12" r="8.25" />
      <path pathLength={1} d="m8.5 12.25 2.5 2.5 4.5-5" />
    </>
  ),
  envoyer: (
    <>
      <path pathLength={1} d="M20.25 3.75 10.5 13.5" />
      <path pathLength={1} d="m20.25 3.75-6 16.5-3.75-6.75-6.75-3.75z" />
    </>
  ),
  bouclier: (
    <>
      <path pathLength={1} d="M12 3.25 5.25 5.75v5.5c0 4.35 2.85 7.75 6.75 9.5 3.9-1.75 6.75-5.15 6.75-9.5v-5.5z" />
      <path pathLength={1} d="m9.25 12 2 2 3.75-4" />
    </>
  ),
  agrandir: (
    <>
      <path pathLength={1} d="M14.25 4.75h5v5" />
      <path pathLength={1} d="m19.25 4.75-5.5 5.5" />
      <path pathLength={1} d="M9.75 19.25h-5v-5" />
      <path pathLength={1} d="m4.75 19.25 5.5-5.5" />
    </>
  ),
  flecheDroite: (
    <>
      <path pathLength={1} d="M4.75 12h14.5" />
      <path pathLength={1} d="m13.75 6.5 5.5 5.5-5.5 5.5" />
    </>
  ),
  flecheGauche: (
    <>
      <path pathLength={1} d="M19.25 12H4.75" />
      <path pathLength={1} d="M10.25 6.5 4.75 12l5.5 5.5" />
    </>
  ),
  info: (
    <>
      <circle pathLength={1} cx="12" cy="12" r="8.25" />
      <path pathLength={1} d="M12 11v5" />
      <path pathLength={1} d="M12 7.75h.01" />
    </>
  ),
}

export type NomIcone = keyof typeof TRACES

export function Icone({ nom, epaisseur = 1.5 }: { nom: NomIcone; epaisseur?: number }) {
  return (
    <svg
      className="icone"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={epaisseur}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {TRACES[nom]}
    </svg>
  )
}
