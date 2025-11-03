# Focusly

Une application de gestion de productivité combinant une to-do list et un timer Pomodoro, construite avec Next.js, React et Tailwind CSS.

## Description

Focusly vous aide à gérer votre temps et votre productivité grâce à un système de tâches intégré à la technique Pomodoro. Suivez vos sessions de travail, complétez vos tâches et visualisez vos statistiques de productivité.

## Fonctionnalités

### 1. Gestion des Tâches
- Ajouter une nouvelle tâche
- Marquer une tâche comme complétée/non complétée
- Supprimer une tâche
- Affichage séparé : tâches actives vs tâches complétées
- Compteur de pomodoros par tâche
- Sauvegarde automatique dans LocalStorage

### 2. Timer Pomodoro
- Timer de 25 minutes pour le travail
- Pause courte de 5 minutes
- Pause longue de 15 minutes (après 4 cycles)
- Contrôles : Start / Pause / Resume / Reset / Skip
- Affichage visuel avec cercle de progression animé
- Indicateur de cycles complétés
- Passage automatique travail → pause → travail
- Tracking automatique des sessions complétées

### 3. Statistiques
- **Today's Focus** : temps de focus aujourd'hui
- **Total Focus Time** : temps total accumulé
- **Tasks Completed** : nombre de tâches terminées
- **Completion Rate** : pourcentage de tâches complétées
- Historique des 10 dernières sessions avec date et heure
- Page dédiée /stats pour consulter les détails

### 4. Thème Clair/Sombre
- Switch entre mode clair et mode sombre
- Sauvegarde automatique de la préférence
- Détection du thème système
- Palette beige/warm pour le mode clair
- Palette sombre moderne pour le mode dark

### 5. Interface & UX
- Design minimaliste inspiré de Notion
- Responsive (mobile et desktop)
- Navigation avec header sticky
- Animations et transitions fluides
- Composants UI réutilisables

### 6. Persistance des Données
Toutes les données sont sauvegardées localement :
- Tâches
- Sessions Pomodoro
- Statistiques
- Préférence de thème

## Technologies Utilisées

- **Next.js 16** - Framework React
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS 4** - Styling
- **LocalStorage** - Persistance des données

## Installation

1. Cloner le repository
```bash
git clone <your-repo-url>
cd focusly
```

2. Installer les dépendances
## Installation

1. Cloner le repository
```bash
git clone <your-repo-url>
cd focusly
```

2. Installer les dépendances
```bash
npm install
```

3. Lancer le serveur de développement
```bash
npm run dev
```

4. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur

## Commandes Disponibles

```bash
npm run dev      # Lancer le serveur de développement
npm run build    # Créer le build de production
npm run start    # Lancer le serveur de production
npm run lint     # Vérifier le code avec ESLint
```

## Configuration Pomodoro

Les durées par défaut peuvent être modifiées dans `src/lib/constants.ts` :

```typescript
export const POMODORO_DURATION = 25 * 60;  // 25 minutes
export const SHORT_BREAK = 5 * 60;          // 5 minutes
export const LONG_BREAK = 15 * 60;          // 15 minutes
export const POMODORO_CYCLES_FOR_LONG_BREAK = 4;  // 4 cycles
```

## Palette de Couleurs


```bash
npm install
```

3. Lancer le serveur de développement
```bash
npm run dev
```

4. Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur

## Commandes Disponibles

```bash
npm run dev      # Lancer le serveur de développement
npm run build    # Créer le build de production
npm run start    # Lancer le serveur de production
npm run lint     # Vérifier le code avec ESLint
```

## Configuration Pomodoro

Les durées par défaut peuvent être modifiées dans `src/lib/constants.ts` :

```typescript
export const POMODORO_DURATION = 25 * 60;  // 25 minutes
export const SHORT_BREAK = 5 * 60;          // 5 minutes
export const LONG_BREAK = 15 * 60;          // 15 minutes
export const POMODORO_CYCLES_FOR_LONG_BREAK = 4;  // 4 cycles
```

## Palette de Couleurs

### Mode Clair (Warm/Beige)
- Background: `#F8F4E3`
- Primary: `#7D6E5C`
- Accent: `#A6937C`
- Card: `#FFFFFF`

### Mode Sombre
- Background: `#1A1A1A`
- Primary: `#A6937C`
- Card: `#252525`

## Fonctionnalités Futures (Optionnelles)

- Authentification utilisateur
- Notifications sonores de fin de session
- Sélectionner une tâche spécifique pour le Pomodoro
- Édition de tâches existantes
- Filtres avancés de tâches
- Export des données (CSV, JSON)
- Graphiques de productivité avancés
- Synchronisation cloud
- Application mobile native

## License

MIT

## Auteur

Développé avec Next.js et Tailwind CSS