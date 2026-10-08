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
| `maquette-safevault.html` | la **reference statique** : les deux ecrans, figes, dans un seul fichier a ouvrir au double-clic |
| `src/`, `index.html`, `public/` | l'**application** React, ou les deux ecrans fonctionnent vraiment |
| `outils/` | ce qui fabrique la maquette statique et les images du logo |
| `polices/` | Wura mi by GemmaS, la police de l'interface |

Les deux montrent la meme interface. La maquette statique sert de reference :
elle ne bouge pas, elle s'ouvre partout, on peut la joindre a un rendu.
L'application sert a essayer le parcours pour de vrai, par exemple pour le
mini-audit.

### La maquette statique

Le fichier est **autonome** (environ 290 Ko) : les polices et les images sont
embarquees en base64, il n'appelle aucun serveur. Il s'ouvre par un double-clic
dans n'importe quel navigateur, en ligne ou hors ligne. Les boutons ne menent
nulle part, aucun fichier n'est lu : chaque ecran est fige dans l'etat qui
montre le mieux ce qu'il sait faire. Les survols, eux, sont vivants.

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

Le script `outils/maquette.mjs` lit le gabarit (`outils/maquette/gabarit.html`,
le balisage des deux ecrans), y verse les feuilles de style de l'application
telles qu'elles sont dans `src/`, embarque les polices et les deux images du
logo, et ecrit `maquette-safevault.html`. Il n'a besoin que de Node.

- Une couleur, un rayon, un espacement change dans `src/` : relancer la
  commande suffit, la maquette suit.
- Un texte ou un element change dans un ecran : le reporter dans le gabarit,
  puis relancer la commande.
- Ne pas retoucher `maquette-safevault.html` a la main : la prochaine
  fabrication effacerait la retouche.

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
