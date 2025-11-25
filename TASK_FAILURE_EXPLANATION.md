# Gestion des Tâches Échouées

## État Actuel

Actuellement, l'application Focusly **ne dispose pas d'une fonctionnalité pour marquer les tâches comme "échouées"**.

## Statuts de Tâches Disponibles

Les tâches dans l'application peuvent avoir deux états:

1. **Non complétées** (`completed: false`) - Tâches actives en attente
2. **Complétées** (`completed: true`) - Tâches terminées avec succès

## Comportement Actuel

- Une tâche reste dans l'état "non complétée" tant qu'elle n'est pas marquée comme terminée
- Les tâches en retard (overdue) sont identifiées mais ne sont pas automatiquement marquées comme échouées
- L'utilisateur peut simplement supprimer une tâche s'il ne souhaite plus la compléter

## Recommandations pour Implémenter cette Fonctionnalité

Si vous souhaitez ajouter une gestion des tâches échouées, voici les modifications à apporter:

### 1. Modifier le Type de Tâche
```typescript
// Dans src/types/index.ts
export interface Task {
  // ... autres propriétés
  status?: 'active' | 'completed' | 'failed';
  failedAt?: number;
  failureReason?: string;
}
```

### 2. Ajouter une Fonction pour Marquer comme Échouée
```typescript
// Dans src/lib/hooks/useTasks.ts
const markTaskAsFailed = async (id: string, reason?: string) => {
  // Logique pour marquer la tâche comme échouée
};
```

### 3. Créer une Interface Utilisateur
- Bouton pour marquer une tâche comme échouée
- Modal pour saisir une raison optionnelle
- Section distincte pour afficher les tâches échouées

### 4. Mettre à Jour les Statistiques
- Ajouter un compteur pour les tâches échouées
- Ajuster le calcul du taux de réussite (completion rate)

### 5. Politiques d'Échec Automatique (Optionnel)
- Marquer automatiquement comme échouées les tâches en retard de X jours
- Notifier l'utilisateur avant de marquer automatiquement comme échouée
- Permettre à l'utilisateur de réactiver une tâche échouée

## Note
Cette fonctionnalité n'est pas encore implémentée car elle nécessite des décisions de design concernant:
- Quand une tâche doit-elle être considérée comme échouée?
- Les tâches échouées doivent-elles être automatiquement archivées?
- Doit-on permettre de "ressusciter" une tâche échouée?
