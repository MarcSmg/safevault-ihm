# Les icônes de SafeVault : méthode et animation

Les icônes sont en **image vectorielle** (SVG), pas en bitmap : elles restent
nettes à toute taille et pèsent quelques octets (`src/pieces/Icone.tsx`).

## Le remplissage

Aucun remplissage : seul le **trait** est dessiné (`fill="none"`,
`stroke="currentColor"`). Ce sont des contours, pas des silhouettes pleines.
Deux avantages : elles restent lisibles sur le fond en verre, et elles
prennent automatiquement la couleur du texte autour d'elles, sans qu'on ait à
colorer chaque icône à la main. Grille de 24 par 24, épaisseur de trait 1,5,
bouts et jonctions arrondis (`strokeLinecap`/`strokeLinejoin: round`).

## Les courbes de Bézier

La plupart des formes (cadenas, horloge, flèches) se construisent avec des
**lignes droites** et des **arcs de cercle** (commande `A` du chemin SVG),
des commandes exactes pour un angle arrondi ou un cercle parfait.

Trois icônes ont une courbe organique qu'un arc ne rend pas : les épaules de
l'icône `personne`, l'amande de l'icône `oeil`, le bas arrondi du `bouclier`.
Pour celles-là, le tracé passe par une **courbe de Bézier cubique** (commande
`C`, et sa variante `S` qui enchaîne une seconde courbe en gardant la tangente
de la première) : deux points de contrôle fixent la tangente de départ et
d'arrivée, comme dans un outil de dessin vectoriel.

## L'animation, et pourquoi elle reste légère

Au survol d'un bouton, chaque trait de l'icône se retrace comme s'il était
dessiné à la main (`src/styles/boutons.css`). Chaque chemin déclare une
longueur normalisée de 1 (`pathLength={1}`), et une seule animation CSS
(`stroke-dashoffset`, de 1 à 0) suffit pour tous les traits, courts ou longs,
sans aucun calcul en JavaScript.

Trois raisons pour lesquelles ça ne ralentit pas l'interface :

1. C'est une **animation CSS pure**, qui tourne sur le fil de composition du
   navigateur, pas sur le fil principal où s'exécute le reste de
   l'application.
2. `pathLength` normalise chaque trait : la même règle `@keyframes` sert
   toutes les icônes, sans recalcul propre à chacune.
3. Le reflet qui suit la souris sur le verre (`useLumiere.ts`) n'écrit que
   deux ou trois variables CSS, une seule fois par image, via
   `requestAnimationFrame`. Même si la souris bouge cent fois par seconde, la
   page ne se met à jour qu'une fois par image. `prefers-reduced-motion`
   coupe tout pour qui demande moins de mouvement.
