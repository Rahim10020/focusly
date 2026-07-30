# Redesign plan: Profile page

## Contexte actuel

La page `src/app/(app)/profile/page.tsx` est composee de 4 composants :

- `ProfileHeader` : carte avec **gradient** de couverture, avatar, nom/email, bouton Edit Profile avec `EditPencilLineIcon`, et bouton appareil photo avec `EditPencilIcon` en mode edition
- `ProfileStatsGrid` : 4 cartes statistiques avec **icones circulaires** (`CircleIcon`, `CheckIcon`, `ClockIcon`, SVG fire inline)
- `ActivityOverview` : carte avec 3 rangees de metriques, chacune avec **icone circulaire**
- `DomainDistribution` : carte avec barres de progression horizontales

## Objectifs de redesign

- Supprimer tout **gradient**
- Supprimer les **icones** de la page
- Design propre, minimal, epure
- Garder toutes les fonctionnalites existantes (edition profil, upload avatar, stats, etc.)

## Proposition de redesign

### 1. ProfileHeader
- Supprimer la div gradient `bg-linear-to-br...`
- Utiliser `Card variant="outline"` ou `default` avec une bordure subtile
- Disposition : avatar a gauche, infos au centre, actions a droite (ou empile en mobile)
- Remplacer le bouton appareil photo par un indicateur textuel discret ou un label "Change photo"
- Remplacer le bouton "Edit Profile" par un bouton texte sans icone
- En mode edition : champs Input simples, bordure fine, sans icones

### 2. ProfileStatsGrid
- Garder la grille 4 colonnes
- Supprimer tous les conteneurs d'icones circulaires
- Afficher les valeurs en grand, les labels en petit en dessous
- Utiliser une petite barre de couleur ou un point colore en guise de repère visuel (ex: petit rond de 8px au lieu d'icone 48px)
- Style : carte `variant="outline"` ou `default` avec layout centre

### 3. ActivityOverview
- Supprimer toutes les icones circulaires
- Simplifier chaque rangee en : label a gauche, valeur a droite, dans un conteneur `bg-muted` arrondi
- Ou utiliser une liste simple avec separateurs fins
- Titre de carte reste en place

### 4. DomainDistribution
- Deja sans icones, a garder tel quel
- Harmoniser le style des barres de progression avec la nouvelle palette (couleur plus sobre si necessaire)

## Structure de fichiers a modifier

- `src/app/(app)/profile/page.tsx` : pas de changement de logique, seulement les props restent identiques
- `src/app/(app)/profile/_components/ProfileHeader.tsx` : refonte complete du JSX, suppression gradient et icones
- `src/app/(app)/profile/_components/ProfileStatsGrid.tsx` : suppression des imports d'icones, simplification du layout
- `src/app/(app)/profile/_components/ActivityOverview.tsx` : suppression des imports d'icones, simplification des rangees
- `src/app/(app)/profile/_components/DomainDistribution.tsx` : potentiellement aucun changement

## Question ouverte

**Faut-il garder des icones fonctionnelles minimales (ex: le crayon pour le bouton Edit Profile) ou supprimer completement toutes les icones de la page ?**

Recommandation : supprimer toutes les icones pour respecter la demande "pas d'icones ia", et remplacer les actions iconiques par du texte (ex: "Edit Profile", "Change photo") ou des indicateurs purement typographiques.
