# Le format .god2

Un fichier `.god2` est une maquette : des ecrans, leurs styles, et de quoi
nommer leurs calques. C'est le format que **god2-design** ouvre, retouche et
enregistre.

Un `.god2` est un fichier texte, en JSON (UTF-8). Il se suffit a lui-meme :
polices et images y sont embarquees en base64, il n'appelle rien d'exterieur.

## Ce qu'il contient

```json
{
  "format": "god2",
  "version": 1,
  "nom": "SafeVault · Maquette EC1",
  "auteurs": ["Gblewa", "Marc"],
  "formats": [
    { "nom": "Bureau", "largeur": 1440, "hauteur": 900 },
    { "nom": "Téléphone", "largeur": 390, "hauteur": 844 }
  ],
  "ecrans": [
    { "id": "deposer", "nom": "Déposer", "adresse": "safevault.app/deposer", "balisage": "<div class=\"scene\">…</div>" },
    { "id": "apercu", "nom": "Aperçu agrandi", "fenetre": true, "balisage": "…" }
  ],
  "symboles": "<svg width=\"0\" height=\"0\">…</svg>",
  "styles": "@font-face { … } :root { … } …",
  "jetons": [["--ocean", "Océan"]],
  "stylesTexte": [[".panneau-titre", "Titre d'étape"]],
  "calques": {
    "noms": { "bouton-verre": "Bouton" },
    "composants": ["bouton-verre"],
    "images": ["logo-3d"]
  }
}
```

| champ | obligatoire | role |
|---|---|---|
| `format` | oui | toujours `"god2"` ; god2-design refuse tout autre fichier |
| `version` | oui | `1` |
| `nom` | oui | le nom de la maquette |
| `ecrans` | oui | les ecrans ; `balisage` est le HTML du corps de la page. `fenetre: true` : l'ecran se montre a la hauteur de la fenetre du format (une fenetre modale, par exemple) et non a celle de son contenu |
| `formats` | non | les largeurs auxquelles chaque ecran est pose sur la toile ; par defaut, un bureau de 1440. `hauteur` est celle de la fenetre, pour les ecrans `fenetre` |
| `styles` | non | la feuille de style commune a tous les ecrans |
| `symboles` | non | des dessins SVG que les ecrans reprennent par `<use>` |
| `auteurs` | non | les prenoms montres dans la barre |
| `jetons` | non | les couleurs a montrer dans Styles : la variable CSS et son nom |
| `stylesTexte` | non | les styles de texte a montrer dans Styles : un selecteur et son nom |
| `calques.noms` | non | le nom d'un calque d'apres la classe CSS de son element |
| `calques.composants` | non | les classes dont les elements sont des composants |
| `calques.images` | non | les classes dont les elements sont des images |

Chaque ecran est pose sur la toile une fois par format : six ecrans et deux
formats donnent douze cadres. Un cadre est une vraie page, a sa largeur : les
regles `@media` de `styles` s'y appliquent comme dans une fenetre.

## Ce que l'atelier ecrit dans le balisage

Une retouche faite dans god2-design s'inscrit dans le `balisage` de l'ecran,
sur l'element lui-meme :

- des styles en ligne : `translate` pour un deplacement, `width` et `height`
  pour une taille, puis couleurs, rayon, opacite, typographie ;
- `data-nom` : le nom donne a un calque, qui l'emporte sur le nom deduit ;
- `data-masque` : un calque masque (il porte aussi `display: none`), que
  l'atelier garde dans son arbre pour pouvoir le remontrer.

Ce qu'on dessine (cadre, forme, trait, texte, image) est ajoute a la racine de
l'ecran, en `position: absolute`, avec tous ses styles sur lui : un `.god2`
retouche reste lisible sans l'atelier. Le balisage etant commun a tous les
formats, une retouche vaut pour chacun.

## Ouvrir un .god2

Dans god2-design : menu Fichier, Ouvrir un fichier .god2, ou glisser le fichier
sur la fenetre. `maquette-safevault.html` est god2-design avec la maquette de
SafeVault deja ouverte ; il peut en ouvrir une autre. L'application
god2-design (un projet Next, dans son propre depot) range plusieurs maquettes
et les ouvre dans le meme atelier.

Un `.god2` venu d'ailleurs est traite comme un contenu etranger : sur la
toile, aucun de ses scripts ne s'execute ; en presentation, ils tournent dans
une page coupee de l'atelier.

## Et les autres editeurs de design ?

Aucun editeur n'ouvre une extension qu'il ne connait pas : Figma, Lunacy,
Penpot ou Illustrator n'ouvriront pas un `.god2` tel quel. Le pont, c'est le
**SVG**, que tous savent ouvrir. god2-design exporte chaque cadre, ou n'importe
quel calque, en SVG (menu Fichier, ou l'onglet Export) :

- un groupe par calque, nomme comme dans god2-design ;
- les fonds, bordures et degrades en formes modifiables ;
- les textes en vrais textes, ligne par ligne, en Outfit (dont Wura mi by
  GemmaS est une instance, pour que l'editeur trouve la police) ;
- les icones en traces ;
- pas les ombres ni les reflets du verre, qui ne se traduisent pas proprement.

Le dossier `maquette-svg/` du depot contient les douze cadres de SafeVault
deja exportes. Verifie dans Lunacy 14 : le cadre s'ouvre a sa taille, avec ses
calques, ses textes et ses icones.

Le chemin inverse n'existe pas : un SVG retouche dans un autre editeur ne
redevient pas un `.god2`.

## Fabriquer le .god2 de SafeVault

`npm run maquette` ecrit `maquette-safevault.god2` a partir de
`outils/maquette/document.json` (nom, formats, noms des calques), des ecrans
`ecran-*.html`, de `feuilles.svg`, des styles de l'application (`src/`) et des
polices. Le meme document est embarque dans `maquette-safevault.html`.
