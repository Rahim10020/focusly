# Roadmap d'Améliorations - Focusly

Ce document répertorie toutes les améliorations proposées pour l'application Focusly, avec un focus particulier sur la gestion des sous-tâches.

## Table des Matières
1. [Améliorations des Sous-Tâches](#améliorations-des-sous-tâches)
2. [Gestion du Temps](#gestion-du-temps)
3. [Performance et Évolutivité](#performance-et-évolutivité)
4. [Expérience Utilisateur](#expérience-utilisateur)
5. [Sécurité et Fiabilité](#sécurité-et-fiabilité)

---

## Améliorations des Sous-Tâches

### 1. Édition en Ligne des Sous-Tâches
- Permettre la modification directe du titre d'une sous-tâche
- Ajouter une validation côté client (longueur min/max)
- Sauvegarde automatique lors de la perte de focus

```tsx
const [editingId, setEditingId] = useState<string | null>(null);
const [editValue, setEditValue] = useState('');

// Dans le rendu :
{editingId === subTask.id ? (
    <input
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleSaveEdit}
        onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit();
            if (e.key === 'Escape') setEditingId(null);
        }}
        autoFocus
        className="flex-1"
    />
) : (
    <span onClick={() => {
        setEditingId(subTask.id);
        setEditValue(subTask.title);
    }}>
        {subTask.title}
    </span>
)}
```

### 2. Glisser-Déposer des Sous-Tâches
- Implémenter le réordonnement par glisser-déposer
- Sauvegarder le nouvel ordre dans la base de données
- Animation fluide pendant le glissement

```tsx
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(subTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onReordered(items);
};

<DragDropContext onDragEnd={onDragEnd}>
    <Droppable droppableId="subtasks">
        {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
                {subTasks.map((subTask, index) => (
                    <Draggable key={subTask.id} draggableId={subTask.id} index={index}>
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                            >
                                {/* Votre rendu de sous-tâche existant */}
                            </div>
                        )}
                    </Draggable>
                ))}
                {provided.placeholder}
            </div>
        )}
    </Droppable>
</DragDropContext>
```

### 3. Sous-Tâches Récursives
- Permettre les sous-tâches imbriquées
- Limiter la profondeur d'imbrication
- Afficher une arborescence claire

```typescript
interface SubTask {
    id: string;
    title: string;
    completed: boolean;
    createdAt: number;
    completedAt?: number;
    subTasks?: SubTask[]; // Sous-tâches imbriquées
    parentId?: string; // Référence au parent
}
```

### 4. Validation des Données
- Longueur minimale/maximale du titre
- Vérification des doublons
- Validation des dates

```typescript
// Dans useTasks.ts, fonction addSubTask
if (title.trim().length < 1 || title.length > 100) {
    showErrorToast('Invalid Subtask', 'Subtask title must be between 1 and 100 characters');
    return;
}
```

---

## Gestion du Temps

### 1. Calcul Automatique de la Durée
- Calcul basé sur startTime/endTime
- Mise à jour en temps réel
- Gestion des chevauchements

```typescript
const calculateDuration = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const start = new Date();
    start.setHours(startHours, startMinutes, 0, 0);
    
    const end = new Date();
    end.setHours(endHours, endMinutes, 0, 0);
    
    // Si l'heure de fin est avant l'heure de début, on suppose que c'est le lendemain
    if (end <= start) {
        end.setDate(end.getDate() + 1);
    }
    
    return (end.getTime() - start.getTime()) / (1000 * 60); // en minutes
};
```

### 2. Gestion des Fuseaux Horaire
- Détection automatique du fuseau de l'utilisateur
- Conversion pour le stockage en UTC
- Affichage dans le fuseau local

### 3. Rappels et Notifications
- Notifications avant le début d'une tâche
- Rappels pour les échéances
- Options de personnalisation

---

## Performance et Évolutivité

### 1. Pagination des Sous-Tâches
- Chargement paresseux pour les listes longues
- Pagination côté serveur
- Indicateur de chargement

### 2. Mise en Cache
- Cache des tâches fréquemment consultées
- Invalidation intelligente du cache
- Stratégie de rafraîchissement

### 3. Optimisation des Requêtes
- Requêtes groupées
- Chargement différé des données secondaires
- Réduction de la taille des payloads

---

## Expérience Utilisateur

### 1. Raccourcis Clavier
- Navigation rapide entre les tâches
- Marquer comme terminé/à faire
- Accès rapide aux actions courantes

### 2. Thèmes et Personnalisation
- Thèmes clair/sombre
- Personnalisation des couleurs
- Disposition personnalisable

### 3. Accessibilité
- Support du lecteur d'écran
- Navigation au clavier
- Contraste des couleurs

---

## Sécurité et Fiabilité

### 1. Validation Côté Serveur
- Vérification des autorisations
- Validation des entrées
- Protection contre les injections

### 2. Gestion des Conflits
- Détection des modifications concurrentes
- Résolution des conflits
- Historique des modifications

### 3. Sauvegarde et Restauration
- Export/import des données
- Historique des versions
- Récupération après erreur

---

## Prochaines Étapes

1. **Priorisation** : Sélectionner les fonctionnalités les plus importantes
2. **Estimation** : Évaluer le temps de développement
3. **Planification** : Créer des tickets pour chaque amélioration
4. **Implémentation** : Développer et tester chaque fonctionnalité
5. **Déploiement** : Mettre en production de manière incrémentale

---

Dernière mise à jour : 17/11/2025
