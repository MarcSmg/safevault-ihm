// Assemble maquette-safevault.html, la reference statique des deux ecrans.
//
//   npm run maquette
//
// Le fichier produit est autonome : il s ouvre au double-clic, sans serveur
// ni reseau. Il reunit
//   - le gabarit (outils/maquette/gabarit.html) : le balisage des deux
//     ecrans, releve dans l application et fige ;
//   - les feuilles de style de l application (src/), telles quelles : la
//     maquette suit donc la direction artistique sans qu on la recopie ;
//   - les polices (polices/) et les deux photos (outils/maquette/), en base64.
// Aucune dependance : Node suffit.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'

const racine = new URL('../', import.meta.url)
const lire = (chemin) => readFileSync(new URL(chemin, racine), 'utf8')
const base64 = (chemin) => readFileSync(new URL(chemin, racine)).toString('base64')

// Les polices, embarquees.
const GRAISSES = [
  ['WuraMiByGemmaS-Light.woff2', 300],
  ['WuraMiByGemmaS.woff2', 400],
  ['WuraMiByGemmaS-SemiBold.woff2', 600],
  ['WuraMiByGemmaS-Bold.woff2', 700],
]
const polices = GRAISSES.map(
  ([fichier, graisse]) => `@font-face {
  font-family: 'WuraMi';
  src: url(data:font/woff2;base64,${base64(`polices/${fichier}`)}) format('woff2');
  font-weight: ${graisse};
  font-style: normal;
  font-display: swap;
}`,
).join('\n\n')

// Les styles de l application : le socle d abord, dans l ordre de
// src/main.tsx, puis les feuilles des composants.
const SOCLE = ['tokens.css', 'base.css', 'verre.css', 'boutons.css'].map((f) => `src/styles/${f}`)
// Ce que la maquette ne montre pas : les notifications et l ecran de fin.
const HORS_MAQUETTE = ['src/notifications/Notifications.css', 'src/ecrans/Envoye.css']

function feuilles(dossier) {
  return readdirSync(new URL(dossier, racine), { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? feuilles(`${dossier}${e.name}/`) : [`${dossier}${e.name}`]))
    .filter((chemin) => chemin.endsWith('.css'))
}
const composants = feuilles('src/')
  .filter((chemin) => !chemin.startsWith('src/styles/') && !HORS_MAQUETTE.includes(chemin))
  .sort()

const photos = `:root {
  --photo-trousseau: url(data:image/png;base64,${base64('outils/maquette/trousseau.png')});
  --photo-cadenas: url(data:image/png;base64,${base64('outils/maquette/cadenas.png')});
}`

const styles = [
  polices,
  ...[...SOCLE, ...composants].map((chemin) => `/* ---- ${chemin} ---- */\n${lire(chemin).trim()}`),
  `/* ---- outils/maquette/maquette.css ---- */\n${lire('outils/maquette/maquette.css').trim()}`,
  photos,
].join('\n\n')

const gabarit = lire('outils/maquette/gabarit.html')
if (!gabarit.includes('/*{{STYLES}}*/')) throw new Error('Le gabarit a perdu son repere /*{{STYLES}}*/.')
const maquette = gabarit.replace('/*{{STYLES}}*/', () => styles)

writeFileSync(new URL('maquette-safevault.html', racine), maquette)
console.log(`maquette-safevault.html : ${Math.round(maquette.length / 1024)} Ko, ${SOCLE.length + composants.length} feuilles de style.`)
