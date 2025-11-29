# Analyse: Gestion des Tâches

**Fichier principal:** `src/app/tasks/page.tsx` (198 lignes)

## 📋 Description de la Fonctionnalité

Le système de gestion des tâches est le cœur de l'application Focusly. Il permet :
- CRUD complet des tâches (Create, Read, Update, Delete)
- Gestion des sous-tâches avec complétion indépendante
- Support des tags colorés et priorités (high, medium, low)
- Drag-and-drop pour réorganisation de l'ordre
- Tri par priorité, date, ordre personnalisé
- Filtrage par tag, domaine, statut
- Vue Kanban (To Do, In Progress, Done)

**Composants principaux:**
- `TasksView` - Vue principale
- `TaskList` - Liste avec drag-and-drop
- `TaskItem` - Item individuel
- `TaskModal` - Formulaire de création/édition (883 lignes!)
- `TaskBoardView` - Vue Kanban
- `QuickAddTask` - Ajout rapide

## 🐛 Problèmes Identifiés

### 1. **TaskModal Trop Complexe (883 lignes)**
**Sévérité:** Haute
**Localisation:** `src/components/tasks/TaskModal.tsx`

**Description:**
Le composant TaskModal contient 883 lignes de code, ce qui le rend difficile à maintenir, tester et debugger. Il gère trop de responsabilités dans un seul fichier.

**Impact:**
- Maintenance difficile
- Tests complexes
- Réutilisabilité limitée
- Performance potentiellement dégradée
- Code difficilement compréhensible

---

### 2. **Pas de Validation des Dates**
**Sévérité:** Haute
**Localisation:** `TaskModal` - Gestion des dates

**Description:**
Il est possible de définir une `dueDate` (date limite) antérieure à la `startDate` (date de début), ce qui n'a aucun sens logique.

```typescript
// Cas problématique actuellement possible
const task = {
  startDate: '2025-12-01',
  dueDate: '2025-11-15' // Avant la startDate!
};
```

**Impact:**
- Données incohérentes
- Confusion pour l'utilisateur
- Bugs dans les calculs de délais
- Affichage incorrect dans le calendrier

---

### 3. **Pas d'Éditeur Rich Text pour les Notes**
**Sévérité:** Moyenne
**Localisation:** `TaskModal` - Champ notes/description

**Description:**
Le champ de notes est un simple textarea sans formatage possible (gras, italique, listes, liens, etc.).

**Impact:**
- Expérience utilisateur limitée
- Impossible de structurer les notes complexes
- Pas de support pour le markdown
- Difficile de documenter des tâches complexes

---

### 4. **N+1 Queries avec Supabase**
**Sévérité:** Haute
**Localisation:** `src/lib/hooks/useTasks.ts`

**Description:**
Lors du chargement des tâches avec leurs sous-tâches, le code fait une requête par tâche au lieu de faire un seul appel avec jointure.

```typescript
// Code actuel (problématique)
const tasks = await supabase.from('tasks').select('*');
for (const task of tasks.data) {
  const subtasks = await supabase.from('subtasks')
    .select('*')
    .eq('task_id', task.id); // N+1!
}
```

**Impact:**
- Lenteur extrême avec beaucoup de tâches
- Surcharge du serveur Supabase
- Risque de rate limiting
- Mauvaise expérience utilisateur

---

### 5. **Pas de Debouncing pour les Mises à Jour**
**Sévérité:** Moyenne
**Localisation:** `useTasks` hook

**Description:**
Chaque modification d'une tâche (titre, description, etc.) déclenche immédiatement une requête Supabase, même lors de la frappe.

**Impact:**
- Requêtes excessives pendant la frappe
- Charge serveur inutile
- Potentiel de conflits de données
- Risque de rate limiting

---

### 6. **Drag-and-Drop Peu Robuste**
**Sévérité:** Moyenne
**Localisation:** `TaskList` - Implémentation drag-and-drop

**Description:**
L'implémentation actuelle du drag-and-drop peut avoir des bugs sur mobile et ne gère pas bien les erreurs de synchronisation.

**Impact:**
- Expérience mobile dégradée
- Perte d'ordre si erreur réseau
- Pas de feedback visuel clair

---

### 7. **Pas de Support pour les Tâches Récurrentes**
**Sévérité:** Moyenne
**Localisation:** Fonctionnalité absente

**Description:**
Impossible de créer des tâches qui se répètent automatiquement (quotidien, hebdomadaire, mensuel).

**Impact:**
- Utilisateur doit recréer manuellement
- Cas d'usage courants non couverts
- Concurrence avec d'autres apps

---

## 💡 Propositions de Corrections et Améliorations

### Correction 1: Refactoriser TaskModal en Composants Plus Petits

**Priorité:** Haute
**Difficulté:** Haute

**Solution proposée:**
```typescript
// Décomposer en plusieurs sous-composants

// 1. TaskModalBasicInfo.tsx (titre, description)
const TaskModalBasicInfo = ({ task, onChange }) => (
  <div className="basic-info">
    <Input
      label="Titre"
      value={task.title}
      onChange={e => onChange('title', e.target.value)}
      required
    />
    <RichTextEditor
      label="Description"
      value={task.notes}
      onChange={value => onChange('notes', value)}
    />
  </div>
);

// 2. TaskModalDates.tsx (dates et heures)
const TaskModalDates = ({ task, onChange, errors }) => {
  const validateDates = (startDate, dueDate) => {
    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      return 'La date de début doit être avant la date limite';
    }
    return null;
  };

  return (
    <div className="dates-section">
      <DatePicker
        label="Date de début"
        value={task.startDate}
        onChange={date => onChange('startDate', date)}
      />
      <DatePicker
        label="Date limite"
        value={task.dueDate}
        onChange={date => onChange('dueDate', date)}
        minDate={task.startDate} // Empêche les dates incohérentes
      />
      {errors.dates && <ErrorMessage>{errors.dates}</ErrorMessage>}

      <TimePicker
        label="Heure de début"
        value={task.startTime}
        onChange={time => onChange('startTime', time)}
      />
      <TimePicker
        label="Heure de fin"
        value={task.endTime}
        onChange={time => onChange('endTime', time)}
      />
    </div>
  );
};

// 3. TaskModalMetadata.tsx (priorité, tags, domaine)
const TaskModalMetadata = ({ task, onChange, availableTags }) => (
  <div className="metadata-section">
    <Select
      label="Priorité"
      value={task.priority}
      onChange={value => onChange('priority', value)}
      options={[
        { value: 'high', label: 'Haute', color: 'red' },
        { value: 'medium', label: 'Moyenne', color: 'orange' },
        { value: 'low', label: 'Basse', color: 'green' }
      ]}
    />

    <TagSelector
      label="Tags"
      selected={task.tags}
      available={availableTags}
      onChange={tags => onChange('tags', tags)}
      onCreateNew={handleCreateTag}
    />

    <DomainSelector
      label="Domaine de vie"
      value={task.sub_domain}
      onChange={domain => onChange('sub_domain', domain)}
    />
  </div>
);

// 4. TaskModalSubTasks.tsx
const TaskModalSubTasks = ({ subtasks, onChange }) => (
  <div className="subtasks-section">
    <h3>Sous-tâches</h3>
    <SubTaskManager
      subtasks={subtasks}
      onChange={onChange}
    />
  </div>
);

// 5. TaskModal.tsx (orchestrateur simplifié)
const TaskModal = ({ task: initialTask, onSave, onClose }) => {
  const [task, setTask] = useState(initialTask);
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field, value) => {
    setTask(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!task.title?.trim()) {
      newErrors.title = 'Le titre est requis';
    }

    if (task.startDate && task.dueDate &&
        new Date(task.startDate) > new Date(task.dueDate)) {
      newErrors.dates = 'La date de début doit être avant la date limite';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave(task);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="large">
      <ModalHeader>
        {task.id ? 'Éditer' : 'Créer'} une tâche
      </ModalHeader>

      <ModalBody>
        <TaskModalBasicInfo task={task} onChange={handleChange} errors={errors} />
        <TaskModalDates task={task} onChange={handleChange} errors={errors} />
        <TaskModalMetadata task={task} onChange={handleChange} />
        <TaskModalSubTasks
          subtasks={task.subtasks || []}
          onChange={subtasks => handleChange('subtasks', subtasks)}
        />
      </ModalBody>

      <ModalFooter>
        {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}
        <Button variant="secondary" onClick={onClose}>
          Annuler
        </Button>
        <Button onClick={handleSave} loading={isSaving}>
          Sauvegarder
        </Button>
      </ModalFooter>
    </Modal>
  );
};
```

**Bénéfices:**
- Code plus maintenable (6 fichiers de ~150 lignes au lieu de 1 de 883)
- Tests plus faciles
- Réutilisabilité des composants
- Meilleure séparation des responsabilités
- Validation centralisée

---

### Correction 2: Optimiser les Requêtes Supabase (Résoudre N+1)

**Priorité:** Haute
**Difficulté:** Moyenne

**Solution proposée:**
```typescript
// Dans useTasks.ts
const fetchTasksWithSubtasks = async (userId) => {
  // Une seule requête avec jointure
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select(`
      *,
      subtasks:subtasks(*)
    `)
    .eq('user_id', userId)
    .order('order', { ascending: true });

  if (error) throw error;

  return tasks;
};

// Pour des mises à jour en batch
const updateMultipleTasks = async (updates) => {
  // Au lieu de boucler
  const { data, error } = await supabase
    .from('tasks')
    .upsert(updates, { onConflict: 'id' });

  if (error) throw error;
  return data;
};

// Utiliser des transactions pour les opérations complexes
const moveTaskAndReorder = async (taskId, newPosition) => {
  // Utiliser Supabase RPC pour une transaction
  const { data, error } = await supabase.rpc('move_task_atomic', {
    p_task_id: taskId,
    p_new_position: newPosition
  });

  if (error) throw error;
  return data;
};
```

**Fonction SQL côté Supabase:**
```sql
-- Créer une fonction RPC pour les opérations atomiques
CREATE OR REPLACE FUNCTION move_task_atomic(
  p_task_id UUID,
  p_new_position INTEGER
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Déplacer et réordonner en une transaction
  UPDATE tasks
  SET "order" = "order" + 1
  WHERE "order" >= p_new_position
    AND id != p_task_id;

  UPDATE tasks
  SET "order" = p_new_position
  WHERE id = p_task_id;
END;
$$;
```

**Bénéfices:**
- Réduction de 90%+ du nombre de requêtes
- Performances drastiquement améliorées
- Moins de charge serveur
- Expérience utilisateur plus fluide

---

### Correction 3: Ajouter le Debouncing pour les Mises à Jour

**Priorité:** Haute
**Difficulté:** Faible

**Solution proposée:**
```typescript
import { useCallback, useRef, useEffect } from 'react';
import { debounce } from 'lodash';

const useTasks = () => {
  const debouncedUpdateRef = useRef(null);

  // Créer une version debouncée de updateTaskInDB
  useEffect(() => {
    debouncedUpdateRef.current = debounce(
      async (taskId, updates) => {
        const { error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', taskId);

        if (error) throw error;
      },
      1000, // 1 seconde de debounce
      { leading: false, trailing: true }
    );

    return () => {
      debouncedUpdateRef.current?.cancel();
    };
  }, []);

  const updateTask = useCallback((taskId, updates) => {
    // Mise à jour locale immédiate (optimistic update)
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    ));

    // Mise à jour serveur debouncée
    debouncedUpdateRef.current(taskId, updates);
  }, []);

  return { updateTask, /* ... */ };
};
```

**Variante avec annulation:**
```typescript
const updateTask = useCallback((taskId, updates) => {
  // Optimistic update
  setTasks(prev => {
    const oldTasks = prev;
    const newTasks = prev.map(t =>
      t.id === taskId ? { ...t, ...updates } : t
    );

    // Sauvegarder l'état précédent pour rollback
    updateTaskOptimistically(taskId, updates, {
      onError: () => {
        // Rollback en cas d'erreur
        setTasks(oldTasks);
        toast.error('Échec de la mise à jour');
      }
    });

    return newTasks;
  });

  // Debounced server update
  debouncedUpdateRef.current(taskId, updates);
}, []);
```

**Bénéfices:**
- Réduction de 80%+ des requêtes pendant la frappe
- Expérience utilisateur plus fluide (optimistic updates)
- Moins de charge serveur
- Gestion des erreurs avec rollback

---

### Amélioration 4: Ajouter un Éditeur Rich Text

**Priorité:** Moyenne
**Difficulté:** Moyenne

**Solution proposée:**
```typescript
// Utiliser une bibliothèque comme TipTap ou Slate
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div className="rich-text-editor">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} placeholder={placeholder} />
    </div>
  );
};

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="menu-bar">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
      >
        <BoldIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
      >
        <ItalicIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
      >
        <ListIcon />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={editor.isActive('taskList') ? 'is-active' : ''}
      >
        <ChecklistIcon />
      </button>
      <button
        onClick={() => {
          const url = window.prompt('URL:');
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className={editor.isActive('link') ? 'is-active' : ''}
      >
        <LinkIcon />
      </button>
    </div>
  );
};
```

**Installation:**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-task-list @tiptap/extension-task-item
```

**Bénéfices:**
- Notes structurées et formatées
- Support markdown
- Checklists dans les notes
- Liens cliquables
- Expérience utilisateur moderne

---

### Amélioration 5: Implémenter les Tâches Récurrentes

**Priorité:** Moyenne
**Difficulté:** Haute

**Solution proposée:**
```typescript
// Ajouter des champs à la table tasks
interface Task {
  // ... champs existants
  is_recurring: boolean;
  recurrence_pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
  recurrence_interval: number; // Ex: tous les 2 jours
  recurrence_end_date?: string;
  recurrence_days_of_week?: number[]; // 0-6 pour Dim-Sam
  parent_recurring_task_id?: string; // Référence à la tâche parente
}

// Service de récurrence
class RecurrenceService {
  static generateNextOccurrence(task: Task): Task {
    if (!task.is_recurring) return null;

    const nextTask = { ...task };
    delete nextTask.id; // Nouvelle instance
    nextTask.parent_recurring_task_id = task.id;
    nextTask.completed = false;
    nextTask.completed_at = null;

    // Calculer la prochaine date
    const currentDate = new Date(task.due_date || task.start_date);
    let nextDate = new Date(currentDate);

    switch (task.recurrence_pattern) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + task.recurrence_interval);
        break;

      case 'weekly':
        nextDate.setDate(nextDate.getDate() + (7 * task.recurrence_interval));
        break;

      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + task.recurrence_interval);
        break;

      case 'custom':
        // Logique personnalisée basée sur recurrence_days_of_week
        nextDate = this.findNextCustomDate(currentDate, task);
        break;
    }

    // Vérifier la date de fin
    if (task.recurrence_end_date && nextDate > new Date(task.recurrence_end_date)) {
      return null; // Récurrence terminée
    }

    nextTask.start_date = nextDate.toISOString();
    if (task.due_date) {
      const duration = new Date(task.due_date).getTime() - currentDate.getTime();
      nextTask.due_date = new Date(nextDate.getTime() + duration).toISOString();
    }

    return nextTask;
  }

  static findNextCustomDate(currentDate: Date, task: Task): Date {
    let nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);

    // Trouver le prochain jour qui correspond aux jours de la semaine spécifiés
    while (!task.recurrence_days_of_week.includes(nextDate.getDay())) {
      nextDate.setDate(nextDate.getDate() + 1);
    }

    return nextDate;
  }
}

// Hook pour gérer les tâches récurrentes
const useRecurringTasks = () => {
  const { addTask } = useTasks();

  const checkAndCreateNextOccurrences = async (completedTask: Task) => {
    if (!completedTask.is_recurring) return;

    const nextTask = RecurrenceService.generateNextOccurrence(completedTask);

    if (nextTask) {
      await addTask(nextTask);
    }
  };

  return { checkAndCreateNextOccurrences };
};

// Composant UI pour configurer la récurrence
const RecurrenceSelector = ({ task, onChange }) => {
  const [isRecurring, setIsRecurring] = useState(task.is_recurring || false);

  return (
    <div className="recurrence-selector">
      <label>
        <input
          type="checkbox"
          checked={isRecurring}
          onChange={e => {
            setIsRecurring(e.target.checked);
            onChange('is_recurring', e.target.checked);
          }}
        />
        Tâche récurrente
      </label>

      {isRecurring && (
        <>
          <Select
            label="Fréquence"
            value={task.recurrence_pattern}
            onChange={value => onChange('recurrence_pattern', value)}
            options={[
              { value: 'daily', label: 'Quotidien' },
              { value: 'weekly', label: 'Hebdomadaire' },
              { value: 'monthly', label: 'Mensuel' },
              { value: 'custom', label: 'Personnalisé' }
            ]}
          />

          {task.recurrence_pattern === 'custom' && (
            <DaysOfWeekSelector
              selected={task.recurrence_days_of_week || []}
              onChange={days => onChange('recurrence_days_of_week', days)}
            />
          )}

          <Input
            type="number"
            label="Intervalle"
            value={task.recurrence_interval || 1}
            onChange={e => onChange('recurrence_interval', parseInt(e.target.value))}
            min={1}
          />

          <DatePicker
            label="Date de fin (optionnel)"
            value={task.recurrence_end_date}
            onChange={date => onChange('recurrence_end_date', date)}
            minDate={task.start_date}
          />
        </>
      )}
    </div>
  );
};
```

**Bénéfices:**
- Automatisation des tâches répétitives
- Gain de temps énorme
- Fonctionnalité attendue par les utilisateurs
- Compétitivité accrue

---

## 📊 Métriques de Succès

1. **Performance:**
   - Temps de chargement des tâches < 500ms (même avec 100+ tâches)
   - Requêtes Supabase réduites de 80%+
   - Pas de lag pendant la frappe

2. **Expérience Utilisateur:**
   - Taux d'erreur de dates incohérentes = 0%
   - Utilisation de l'éditeur rich text > 60%
   - Création de tâches récurrentes > 20% des tâches

3. **Code Quality:**
   - Tous les composants < 300 lignes
   - Couverture de tests > 80%
   - Pas de duplication de code

---

## 🔗 Fichiers Connexes

- `src/components/tasks/TaskModal.tsx` (883 lignes - À refactoriser!)
- `src/components/tasks/TaskList.tsx`
- `src/lib/hooks/useTasks.ts`
- `src/lib/hooks/useTasksEnhanced.ts`

---

**Dernière mise à jour:** 2025-11-29
**Priorité globale:** Critique
**Effort estimé:** 5-7 jours de développement
