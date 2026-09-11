# Fix unused vars in TaskBoardView

## Contexte

Le composant `TaskBoardView` reçoit des props pour les actions en masse (`searchQuery`, `onSelectAll`, `onClearSelection`, `onBulkComplete`, `onBulkDelete`) mais ne les utilise pas dans son rendu. Ces props sont préfixées par `_` (convention pour "intentionnellement inutilisé"), mais `@typescript-eslint/no-unused-vars` signale quand même les erreurs.

Le parent `TasksView` passe ces props à la fois à `TaskList` (qui les utilise pour la vue liste) et à `TaskBoardView` (qui ne les utilise pas car la vue board n'a pas de toolbar d'actions en masse).

## Décision

Supprimer les props inutilisées du destructuring dans `TaskBoardView`. Les garder dans l'interface `TaskBoardViewProps` car le parent les passe toujours (elles seront simplement ignorées par le composant board). Cela évite de casser le contrat de props partagé entre les deux vues.

Alternative plus propre : nettoyer le parent `TasksView` pour ne pas passer ces props à `TaskBoardView`, mais cela demande plus de changements et risque de casser le spread `{...props}`.

## Plan

1. **`TaskBoardView.tsx`** — Supprimer du destructuring les 5 variables inutilisées :
   - `searchQuery: _searchQuery` → supprimer
   - `onSelectAll: _onSelectAll` → supprimer
   - `onClearSelection: _onClearSelection` → supprimer
   - `onBulkComplete: _onBulkComplete` → supprimer
   - `onBulkDelete: _onBulkDelete` → supprimer

2. **Vérification** — S'assurer que `selectedTaskIds` et `onToggleSelection` sont bien utilisés dans le JSX (ils le sont via `TaskBoardCard`).

## Validation

- Lint : `npm run lint` sur le fichier concerné
- Build : vérifier qu'aucune erreur TypeScript n'apparaît
