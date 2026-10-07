# IHM-Safevault
# SafeVault, maquette EC1 (ergonomie)

Maquette de deux ecrans cles de **SafeVault**, un coffre-fort numerique
d'entreprise pour stocker et partager des documents confidentiels. Travail du
cours d'EC1 : un logiciel n'a aucune valeur si l'humain ne parvient pas a s'en
servir.

L'utilisateur garde en tete, pour chaque decision : un employe presse, pas
informaticien, qui doit envoyer un document important en quelques minutes,
souvent dans le stress. Chaque choix se juge a une question : est-ce que ca aide
vraiment cet utilisateur, ou est-ce que ca complique sa vie ?

---

## Ce qu'il y a dans ce dossier

| fichier | role |
|---|---|
| `maquette-safevault.html` | la maquette, deux ecrans, autonome, a ouvrir au double-clic |
| `README.md` | ce fichier |

Le fichier HTML est **autonome** (198 Ko) : les polices sont embarquees en
base64, il n'appelle aucun serveur et aucun domaine exterieur. Il s'ouvre par un
double-clic dans n'importe quel navigateur, sans build, en ligne ou hors ligne.

> Le verre (reflet au pointeur, onde a l'appui) rend le mieux sur Chrome ou
> Edge. Sur les autres navigateurs, les quatre autres ingredients optiques
> restent et suffisent.

---

## Les deux ecrans

### Ecran 1, deposer un fichier (`safevault.app/deposer`)

Etape 1 sur 2. L'employe arrive avec un document a mettre en securite.

- un titre clair, `Deposer un document` ;
- une phrase de guidage qui dit quoi faire ;
- un exemple de message d'erreur en langage courant (format refuse) ;
- la zone de depot, glisser-deposer ou parcourir ;
- le fichier retenu, avec son poids et sa barre de progression ;
- une note de securite, le chiffrement ;
- une seule action principale, `Deposer le document`, et une sortie, `Annuler`.

### Ecran 2, partager avec un collegue (`safevault.app/partager`)

Etape 2 sur 2. Le document est depose, il faut le transmettre.

- un rappel du document, depose et chiffre ;
- un titre clair, `Partager avec un collegue` ;
- une phrase de guidage ;
- le champ destinataire et le collegue ajoute (retirable) ;
- le choix du droit, consulter ou modifier, une seule option retenue ;
- l'expiration automatique de l'acces, par securite ;
- une seule action principale, `Partager le document`, et une sortie, `Annuler`.

---

## Les quatre regles d'IHM, et ou elles se voient

Les deux ecrans portent deja, par leur conception, les quatre regles a
justifier dans la partie 2. Elles sont donc visibles dans la maquette.

| regle | ou | pourquoi ca aide l'employe presse |
|---|---|---|
| **guidage** | la phrase sous chaque titre (`Glissez votre fichier...`, `Ajoutez la personne...`) | il sait quoi faire sans deviner, meme la premiere fois |
| **charge de travail** | un seul bouton plein par ecran, peu d'informations affichees | rien ne disperse l'attention, l'action evidente saute aux yeux |
| **controle explicite** | `Annuler` partout, et la croix qui retire un fichier ou un destinataire | une erreur se defait, il n'est jamais coince |
| **gestion des erreurs** | l'alerte `Le fichier ... n'a pas pu etre ajoute. Formats possibles : PDF, Word, JPG, PNG.` | il comprend le probleme et la solution, jamais un code technique |

Les justifications redigees de la partie 2 viendront dans un fichier a part.

---

## La direction artistique, reprise de `site-god2`

Rien ici n'est invente. Tout est repris, a la valeur pres, du site de
presentation `site-god2` du depot, dont les valeurs sont elles-memes mesurees
sur les sites en production (voir `regles/FINITION.md`).

### Couleurs (tokens de `site-god2/src/index.css`)

```
--encre   #101014   l'encre, jamais du noir pur
--gris    #6b6b76   le seul gris de texte
--surface #cad6ec   le ciel, fond de page
--voile   #f2f4fb   le voile clair
--bleu    #0f3efa   le bleu de marque : ce qui se clique
--lime    #c7ee30   le lime de marque : la securite, le statut sur
```

Un role par couleur. Le bleu ne sert qu'a ce qui se clique (bascule, liens). Le
lime ne sert qu'a la securite (le cadenas, le badge chiffre). Les icones n'ont
pas de couleur, elles sont en encre ou en gris.

### Typographie

- **Wura mi by GemmaS**, l'instance d'Outfit du projet, sous licence OFL, en
  quatre graisses embarquees : Light 300, Regular 400, SemiBold 600, Bold 700.
- **William Narasi** pour la seule signature du pied.
- Le grand titre est en 300 avec une emphase en 600, l'interlettrage serre a
  -0,02 em, comme le grand format de la DA. Le corps ne bouge pas : 16 px.

### Fond

- le **lavis** : trois foyers de lumiere, rose en haut a droite, bleu a gauche,
  turquoise en bas a droite, avec le debord de douze pour cent, copie de
  `.lavis` ;
- le **grain** : un bruit fractal `feTurbulence` en data-URI, pose sous tout le
  contenu, meme recette que la DA.

### Logo

Le logo **GOD2**, pose dans une pastille de verre. Le O n'est pas une lettre, il
est bati : deux L entailles qui se touchent par la pointe et laissent deux coins
mordus. Grammaire exacte reprise de `site-god2/src/pieces/MarqueGod2.tsx`.

### Le verre (glassmorphism)

Recette copiee de `site-god2/src/documentation/Documentation.css` et
`verre.ts`, elle-meme relevee sur iOS 27 :

```
--verre-fond   hsl(220 30% 99% / 0.5)
--verre-flou   blur(20px) saturate(1.9) brightness(1.1) contrast(1.03)
--verre-bord   hsl(224 40% 22% / 0.26)   le bord assombri, la nouveaute iOS 27
--verre-arete      hsl(0 0% 100% / 0.95)  l'arete claire en haut
--verre-arete-bas  hsl(0 0% 100% / 0.62)  l'arete en bas
```

Les cinq ingredients optiques : le flou et la saturation, la clarte, l'arete
claire en haut et sombre en bas, le reflet speculaire en biais, et le reflet qui
suit le pointeur. L'onde part du point d'appui pendant sept dixiemes de seconde.
Le reglage systeme `moins de mouvement` l'emporte sur tout.

---

## Technique

- **Autonome** : les cinq polices woff2 sont lues dans
  `site-god2/public/polices/` et inserees en base64 dans le fichier. Aucun lien
  externe, rien a installer.
- **Responsive** : deux colonnes au-dela de 860 px, une seule en dessous. Debord
  horizontal mesure a 0 px en 1280 comme en 390.
- **Mouvement** : le reflet du pointeur et l'onde sont portes par un petit
  script vanilla, traduit de `verre.ts`. Une ecriture de variables par image au
  plus. Tout s'arrete si la personne a demande moins de mouvement.
- **Controle** : passe `npm run interdits safevault-ec1` sans une ligne rouge,
  zero tiret cadratin.

### Refabriquer le fichier

Le fichier a ete assemble par un script qui lit le gabarit, embarque les
polices, et ecrit la maquette. Pour le regenerer apres une retouche du gabarit,
il suffit de relancer ce script (hors de ce dossier, les polices sources sont
dans `site-god2/public/polices/`). Le fichier livre se suffit a lui-meme, il
n'a besoin d'aucune dependance pour s'ouvrir.

---

## Ce qui reste a faire (projet complet EC1)

Cette maquette couvre la **partie 1, l'ergonomie** : le cadrage autour d'un
utilisateur reel et ses deux ecrans. Restent, dans des fichiers a part :

1. **Les justifications des quatre regles d'IHM** (partie 2), redigees.
2. **La note sur le support mobile** : une demi-page, au moins deux differences
   concretes si SafeVault existait aussi sur mobile.
3. **Le mini-audit** : faire tester la maquette par deux ou trois camarades
   d'une autre equipe, noter ou la personne a hesite ou s'est trompee, classer
   chaque probleme par gravite (0 a 4), proposer une correction pour au moins un
   probleme de gravite 2 ou plus. Les resultats de ce test se remplissent apres
   le test reel, ils ne s'inventent pas.
