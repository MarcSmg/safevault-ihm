// Assemble la maquette statique des ecrans, sous deux formes :
//
//   maquette-safevault.god2   le document seul, au format .god2
//                             (outils/maquette/FORMAT-GOD2.md) ;
//   maquette-safevault.html   le meme document, embarque dans god2-design,
//                             l atelier qui le presente comme un fichier de
//                             design (toile, calques, proprietes, export).
//
//   npm run maquette
//
// Le fichier HTML est autonome : il s ouvre au double-clic, sans serveur ni
// reseau. L assemblage reunit
//   - l atelier : outils/maquette/gabarit.html, atelier.css et atelier.js ;
//   - le document : outils/maquette/document.json (nom, formats, noms des
//     calques), les ecrans ecran-*.html (le balisage releve dans
//     l application et fige) et feuilles.svg (le contrat de l apercu) ;
//   - les feuilles de style de l application (src/), telles quelles : la
//     maquette suit donc la direction artistique sans qu on la recopie ;
//   - les polices (polices/) et les deux photos (outils/maquette/), en base64.
// Aucune dependance : Node suffit.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const racine = new URL('../', import.meta.url)
const lire = (chemin) => readFileSync(new URL(chemin, racine), 'utf8')
const base64 = (chemin) => readFileSync(new URL(chemin, racine)).toString('base64')

// Les polices, embarquees. Elles servent deux fois : dans l atelier et dans
// chaque ecran, qui est une page a part.
const GRAISSES = [
  ['WuraMiByGemmaS-Light.woff2', 300],
  ['WuraMiByGemmaS.woff2', 400],
  ['WuraMiByGemmaS-SemiBold.woff2', 600],
  ['WuraMiByGemmaS-Bold.woff2', 700],
]
const police = ([fichier, graisse]) => `@font-face {
  font-family: 'WuraMi';
  src: url(data:font/woff2;base64,${base64(`polices/${fichier}`)}) format('woff2');
  font-weight: ${graisse};
  font-style: normal;
  font-display: swap;
}`
const polices = GRAISSES.map(police).join('\n\n')
// L atelier n ecrit qu en trois graisses.
const policesAtelier = GRAISSES.filter(([, graisse]) => graisse !== 300).map(police).join('\n\n')

// Les styles de l application : le socle d abord, dans l ordre de
// src/main.tsx, puis les feuilles des composants.
const SOCLE = ['tokens.css', 'base.css', 'verre.css', 'boutons.css'].map((f) => `src/styles/${f}`)
function feuilles(dossier) {
  return readdirSync(new URL(dossier, racine), { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? feuilles(`${dossier}${e.name}/`) : [`${dossier}${e.name}`]))
    .filter((chemin) => chemin.endsWith('.css'))
}
const composants = feuilles('src/')
  .filter((chemin) => !chemin.startsWith('src/styles/'))
  .sort()

const photos = `:root {
  --photo-trousseau: url(data:image/png;base64,${base64('outils/maquette/trousseau.png')});
  --photo-cadenas: url(data:image/png;base64,${base64('outils/maquette/cadenas.png')});
}`

const stylesEcrans = [
  polices,
  ...[...SOCLE, ...composants].map((chemin) => `/* ---- ${chemin} ---- */\n${lire(chemin).trim()}`),
  `/* ---- outils/maquette/ecrans.css ---- */\n${lire('outils/maquette/ecrans.css').trim()}`,
  photos,
].join('\n\n')

// Le document .god2 : ce que l atelier ouvre, et ce qu il enregistre.
const source = JSON.parse(lire('outils/maquette/document.json'))
const document = {
  format: 'god2',
  version: 1,
  nom: source.nom,
  auteurs: source.auteurs,
  formats: source.formats,
  ecrans: source.ecrans.map(({ source: fichier, ...ecran }) => ({
    ...ecran,
    balisage: lire(`outils/maquette/${fichier}`).trim(),
  })),
  symboles: lire('outils/maquette/feuilles.svg').trim(),
  styles: stylesEcrans,
  jetons: source.jetons,
  stylesTexte: source.stylesTexte,
  calques: source.calques,
}
const god2 = JSON.stringify(document)
writeFileSync(new URL('maquette-safevault.god2', racine), god2)

const atelier = lire('outils/maquette/atelier.js').trim()
if (/<\/script/i.test(atelier)) throw new Error('"</script" dans atelier.js : le fichier assemble serait coupe a cet endroit.')

const pieces = {
  '/*{{STYLES_ATELIER}}*/': lire('outils/maquette/atelier.css').replace('/*{{POLICES}}*/', () => policesAtelier).trim(),
  // Dans la page, le document est pose dans une balise inerte : un "<" ecrit
  // en clair pourrait la refermer.
  '/*{{DOCUMENT_GOD2}}*/': god2.replace(/</g, () => String.fromCharCode(92) + 'u003c'),
  '/*{{SCRIPT_ATELIER}}*/': atelier,
}

let maquette = lire('outils/maquette/gabarit.html')
for (const [repere, contenu] of Object.entries(pieces)) {
  if (!maquette.includes(repere)) throw new Error(`Le gabarit a perdu son repere ${repere}.`)
  maquette = maquette.replace(repere, () => contenu)
}

writeFileSync(new URL('maquette-safevault.html', racine), maquette)
const ko = (texte) => `${Math.round(texte.length / 1024)} Ko`
console.log(`maquette-safevault.god2 : ${ko(god2)}. maquette-safevault.html : ${ko(maquette)}, ${SOCLE.length + composants.length} feuilles de style.`)
