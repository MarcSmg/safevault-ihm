# IHM-Safevault
# SafeVault, maquette EC1 (ergonomie)

Deux ecrans cles de **SafeVault**, un coffre-fort numerique d'entreprise pour
stocker et partager des documents confidentiels. Travail du cours d'EC1 : un
logiciel n'a aucune valeur si l'humain ne parvient pas a s'en servir.

L'utilisateur garde en tete, pour chaque decision : un employe presse, pas
informaticien, qui doit envoyer un document important en quelques minutes,
souvent dans le stress. Chaque choix se juge a une question : est-ce que ca aide
vraiment cet utilisateur, ou est-ce que ca complique sa vie ?

---

## Ce qu'il y a dans ce depot

| chemin | role |
|---|---|
| `maquette-safevault.html` | la **reference statique** : le parcours en six ecrans figes, ouverts dans l'atelier **god2-design**, dans un seul fichier a ouvrir au double-clic |
| `maquette-safevault.god2` | la meme maquette, seule, au format `.god2` que god2-design ouvre et enregistre |
| `maquette-svg/` | les douze cadres exportes en SVG, pour les autres editeurs de design (Figma, Lunacy, Penpot, Illustrator) |
| `src/`, `index.html`, `public/` | l'**application** React, ou les deux ecrans fonctionnent vraiment |
| `outils/` | ce qui fabrique la maquette statique (et son atelier god2-design) et les images du logo |
| `polices/` | Wura mi by GemmaS, la police de l'interface |

Les deux montrent la meme interface. La maquette statique sert de reference :
elle ne bouge pas, elle s'ouvre partout, on peut la joindre a un rendu.
L'application sert a essayer le parcours pour de vrai, par exemple pour le
mini-audit.

### La maquette statique, dans god2-design

Le fichier est **autonome** (environ 520 Ko) : les polices et les images sont
embarquees en base64, il n'appelle aucun serveur. Il s'ouvre par un double-clic
dans n'importe quel navigateur, en ligne ou hors ligne.

Il s'ouvre dans **god2-design**, un atelier ecrit pour ce projet qui presente la
maquette comme un fichier de design :

- **la barre** : les menus Fichier, Affichage et Aide, le fichier ouvert,
  Presenter, le zoom, le theme clair ou sombre ;
- **le volet de gauche** : les calques de chaque ecran (avec une recherche),
  les composants et combien de fois ils servent, les styles de couleur et de
  texte ;
- **la toile**, au centre : douze cadres, les six ecrans en bureau (1440) et
  en telephone (390). On s'y deplace a la molette ou avec la main (touche `H`,
  ou `Espace` maintenue), on zoome avec `Ctrl` + molette, `+` et `-` ;
  `Maj 1` montre tout, `Maj 2` le calque choisi, `Maj 0` revient a 100 % ;
- **les proprietes**, a droite : un clic sur un element donne sa position, ses
  dimensions, son rayon, ses couleurs, sa typographie, ses effets. L'onglet
  Export enregistre la selection en SVG ou le fichier en `.god2` ;
- **Presenter** (touche `P`) : l'ecran en vrai, a la taille de la fenetre, avec
  ses survols. Sur un telephone, le fichier s'ouvre directement ainsi.

La maquette se lit, elle ne se modifie pas : les outils de dessin sont montres
mais inactifs, les boutons des ecrans ne menent nulle part, aucun fichier
n'est lu.

Les six ecrans suivent le parcours, de gauche a droite :

1. **Deposer, au depart** : la zone de depot vide, avant le premier document ;
2. **Deposer, documents ajoutes** : deux documents chiffres, un fichier refuse
   et son message, l'apercu ;
3. **Apercu agrandi** : la fenetre qui montre le document en grand ;
4. **Partager, a l'arrivee** : le formulaire vide, et la notification
   « 2 documents deposes » ;
5. **Partager, pret a envoyer** : un destinataire, un droit, une duree ;
6. **Documents partages** : la fin du parcours, sa notification, et le bouton
   pour envoyer un autre document.

### Le format .god2 et les autres editeurs

Une maquette est un document `.god2` : ses ecrans, leurs styles, les noms de
ses calques, dans un seul fichier JSON autonome. god2-design en ouvre un par le
menu Fichier ou en le glissant sur la fenetre. Le format est decrit dans
`outils/maquette/FORMAT-GOD2.md`.

Aucun editeur de design n'ouvre une extension qu'il ne connait pas. Pour
Figma, Lunacy, Penpot ou Illustrator, god2-design exporte chaque cadre en
**SVG** : un groupe par calque, des formes et des textes modifiables. Les
douze cadres sont deja exportes dans `maquette-svg/`. Verifie dans Lunacy :
le cadre s'ouvre a sa taille, avec ses calques, ses textes et ses icones. Les
ombres et les reflets du verre ne passent pas dans le SVG.

god2-design existe aussi comme application a part (un projet Next, dans son
propre depot), qui range plusieurs maquettes `.god2` et les ouvre dans le
meme atelier. Les trois fichiers de l'atelier y sont les memes qu'ici.

### L'application

```
npm install
npm run dev        # http://localhost:5173
npm run build      # la version de production, dans dist/
```

Rien ne quitte le navigateur : le chiffrement et l'envoi sont simules, les
fichiers choisis ne servent qu'a l'apercu.

---

## Les deux ecrans

### Ecran 1, deposer un document (`/deposer`)

Etape 1 sur 2. L'employe arrive avec un ou plusieurs documents a mettre en
securite.

- un titre clair, `Deposer un document` ;
- une phrase de guidage qui dit quoi faire ;
- un message d'erreur en langage courant quand un format est refuse ;
- la zone de depot, glisser-deposer ou parcourir, pour un ou plusieurs fichiers ;
- chaque fichier retenu, avec l'icone de son type (PDF, Word, image), son poids
  et sa barre de chiffrement ;
- l'apercu du document choisi (PDF, Word `.docx`, image), qu'on peut agrandir ;
- une note de securite, le chiffrement ;
- une seule action principale, `Deposer le document`, et une sortie, `Annuler`.

### Ecran 2, partager avec un collegue (`/partager`)

Etape 2 sur 2. Les documents sont deposes, il faut les transmettre.

- le rappel des documents, deposes et chiffres, avec leur apercu ;
- un titre clair, `Partager avec un collegue` ;
- une phrase de guidage ;
- le champ destinataire, qui propose les collegues de l'annuaire, et les
  personnes ajoutees (retirables) ;
- le choix du droit, consulter ou modifier, une seule option retenue ;
- la duree de l'acces, qui s'eteint toute seule par securite ;
- une seule action principale, `Partager le document`, un `Retour` et une
  sortie, `Annuler`.

L'application ajoute un troisieme temps, la confirmation (`/envoye`), et des
notifications qui disent ce qui vient de se passer.

---

## Les quatre regles d'IHM, et ou elles se voient

Les deux ecrans portent, par leur conception, les quatre regles a justifier
dans la partie 2.

| regle | ou | pourquoi ca aide l'employe presse |
|---|---|---|
| **guidage** | la phrase sous chaque titre, la liste des etapes a gauche, les bulles `?` et la ligne d'aide sous chaque champ | il sait quoi faire et ou il en est sans deviner, meme la premiere fois |
| **charge de travail** | un seul bouton plein par ecran, des choix deja faits (consulter, 7 jours), l'annuaire qui complete le nom | rien ne disperse l'attention, l'action evidente saute aux yeux |
| **controle explicite** | `Annuler` et `Retour` partout, la croix qui retire un fichier ou un destinataire ; rien ne part sans un clic | une erreur se defait, il n'est jamais coince |
| **gestion des erreurs** | l'alerte `Le fichier ... n'a pas pu etre ajoute. Formats possibles : PDF, Word, JPG, PNG.` ; un doublon est ignore sans bruit | il comprend le probleme et la solution, jamais un code technique |

Les justifications redigees de la partie 2 viendront dans un fichier a part.

---

## La direction artistique

### Couleurs (`src/styles/tokens.css`)

```
--fond      hsl(229 36% 92%)   le lavande du fond de page, uni
--texte     hsl(0 0% 7%)       l'encre
--discret   hsl(215 16% 47%)   le seul gris de texte
--ocean     hsl(229 97% 55%)   le bleu : ce qui se clique, ce qui est retenu
--limonade  hsl(71 88% 56%)    le lime : ce qui est fait, ce qui est sur
--erreur    hsl(0 84% 60%)     le rouge : l'erreur, et les sorties au survol
```

Un role par couleur. Le bleu ne sert qu'a ce qui se clique ou qui est choisi.
Le lime ne sert qu'a dire que c'est fait (barre de chiffrement pleine, etape
terminee). Le rouge n'apparait que pour une erreur, ou sous le pointeur quand
on s'apprete a defaire quelque chose (`Annuler`, `Fermer`, retirer).

### Typographie

**Wura mi by GemmaS**, instance d'Outfit sous licence OFL, en quatre graisses :
Light 300, Regular 400, SemiBold 600, Bold 700. Le corps ne bouge pas : 16 px.

### Logo

Le nom `SafeVault`, et un trousseau en 3D accroche a la queue de son S : un
anneau de chrome, un cadenas bleu et sa cle lime. Dans l'application, le
cadenas et la cle se balancent quand le pointeur passe. Partout ou l'interface
montre un cadenas (document scelle, notification), c'est ce meme cadenas.

### Le verre

Un verre liquide, proche de l'eau : presque rien dans la masse, tout se joue
sur les bords et a la surface.

- la masse est transparente ; une ombre fine sous l'arete du haut et une clarte
  au bas donnent l'epaisseur d'une goutte ;
- l'arete est un filet de lumiere qui tourne vers le pointeur ;
- au survol, une onde de lumiere part de la main et s'elargit a la surface ;
- dans l'application, sur Chrome et Edge, les bords courbent ce qui passe
  derriere eux (refraction calculee, `src/verre/lentille.ts`). La maquette
  statique s'en passe.

Le reglage systeme `moins de mouvement` l'emporte sur tout.

### Icones

Un jeu d'icones dessine pour SafeVault (`src/pieces/Icone.tsx`) : grille de 24,
trait de 1,5, bouts arrondis. Elles se retracent au survol de leur bouton.

---

## Technique

- **Application** : Vite, React, TypeScript, react-router. Une feuille de style
  par composant, sans bibliotheque d'interface.
- **Mobile d'abord** : les regles de base sont celles du telephone, les ecrans
  plus larges ajoutent leurs colonnes par paliers (640, 900, 1100 px). Debord
  horizontal mesure a 0 px en 1440 comme en 375.
- **Rien d'externe** : polices, modele 3D et images sont dans le depot.
  L'apercu des PDF (pdf.js) et des documents Word (docx-preview) est embarque,
  aucun service en ligne n'est appele.
- **Fluidite** : les matieres du logo sont des images cuites a l'avance
  (`public/modeles/matcap-*.png`), pour que la page ne se fige pas au demarrage
  sur une carte graphique modeste. La scene 3D ne se redessine que lorsqu'elle
  bouge.
- **Controle** : zero tiret cadratin.

### Refabriquer la maquette statique

```
npm run maquette
```

Le script `outils/maquette.mjs` ecrit `maquette-safevault.god2` et
`maquette-safevault.html` a partir de `outils/maquette/` :

- `gabarit.html`, `atelier.css`, `atelier.js` : l'atelier god2-design ;
- `document.json` : le nom de la maquette, ses formats, les noms des calques ;
- `ecran-*.html` : le balisage des six ecrans, releve dans l'application ;
- `feuilles.svg`, `ecrans.css` : le contrat montre dans l'apercu, et ce que la
  maquette ajoute aux styles de l'application ;
- `trousseau.png`, `cadenas.png` : les photos qui remplacent la 3D.

Il y verse les feuilles de style de l'application telles qu'elles sont dans
`src/`, et embarque les polices. Il n'a besoin que de Node.

- Une couleur, un rayon, un espacement change dans `src/` : relancer la
  commande suffit, la maquette suit.
- Un texte ou un element change dans un ecran : le reporter dans
  `ecran-*.html`, puis relancer la commande.
- Ne pas retoucher `maquette-safevault.html` ni le `.god2` a la main : la
  prochaine fabrication effacerait la retouche.
- Les SVG de `maquette-svg/` ne sont pas refaits par la commande : ouvrir la
  maquette, puis Fichier, Exporter tous les cadres en SVG.

### Refaire les images du logo

Ouvrir `http://localhost:5173/outils/matcaps.html` pendant que `npm run dev`
tourne : la page cuit les trois matieres du logo (chrome, bleu, lime) en
images, a enregistrer dans `public/modeles/`. A refaire seulement si une
couleur du logo change.

---

## Ce qui reste a faire (projet complet EC1)

Ces ecrans couvrent la **partie 1, l'ergonomie** : le cadrage autour d'un
utilisateur reel et ses deux ecrans. Restent, dans des fichiers a part :

1. **Les justifications des quatre regles d'IHM** (partie 2), redigees.
2. **La note sur le support mobile** : une demi-page, au moins deux differences
   concretes si SafeVault existait aussi sur mobile.
3. **Le mini-audit** : faire tester la maquette par deux ou trois camarades
   d'une autre equipe, noter ou la personne a hesite ou s'est trompee, classer
   chaque probleme par gravite (0 a 4), proposer une correction pour au moins un
   probleme de gravite 2 ou plus. Les resultats de ce test se remplissent apres
   le test reel, ils ne s'inventent pas.
