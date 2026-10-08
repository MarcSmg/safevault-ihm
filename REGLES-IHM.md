# Les règles d'IHM dans la maquette SafeVault

Cinq règles d'ergonomie, visibles dans la maquette. L'utilisateur reste le même
partout : un employé pressé, pas informaticien, qui envoie un document en
quelques minutes.

## 1. Le guidage

Chaque écran affiche une phrase qui dit quoi faire, sous le titre
(`Assistant.tsx`, prop `guide`) : « Ajoutez vos fichiers dans la zone
ci-dessous. Chacun est chiffré dès son arrivée. »

**Pourquoi** : l'utilisateur ne devine pas, il sait quoi faire au premier
regard.

## 2. La charge de travail

Un seul bouton plein par écran (`BoutonVerre variante="plein"`) : « Suivant »,
puis « Partager le document ». Le reste est discret. Le parcours est découpé en
étapes.

**Pourquoi** : moins à lire et à décider, plus vite le document part.

## 3. Le contrôle explicite

Un bouton « Annuler » sur chaque écran, un « Retour » sur Partager, une croix
pour retirer un fichier ou un destinataire.

**Pourquoi** : une erreur se défait en un geste, l'utilisateur n'a pas peur de
se tromper.

## 4. La gestion des erreurs

Les refus de fichier sont écrits en français simple (`formats.ts`) : « Ce
format n'est pas accepté. Formats possibles : PDF, Word, JPG, PNG. » Jamais de
code technique.

**Pourquoi** : l'utilisateur comprend le problème et la solution, tout de
suite.

## 5. Le retour d'information

Une barre de progression et un statut pendant le chiffrement (« chiffrement en
cours… », « déposé et chiffré »), une notification à chaque envoi.

**Pourquoi** : l'utilisateur voit que son action a marché, il avance en
confiance.

---

| règle | où | pourquoi |
|---|---|---|
| guidage | phrase sous chaque titre | il sait quoi faire |
| charge de travail | un seul bouton plein par écran | moins à lire |
| contrôle explicite | Annuler, Retour, retrait | pas peur de se tromper |
| gestion des erreurs | message en français, pas de code | il comprend et corrige |
| retour d'information | progression, notification | il avance en confiance |
