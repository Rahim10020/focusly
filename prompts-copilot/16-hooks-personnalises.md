# Analyse: Hooks Personnalisés

**16 hooks identifiés**

## 📋 Vue d'Ensemble

Hooks critiques:
- `useTasks` - CRUD tâches, sync Supabase
- `useStats` - Statistiques, streaks
- `usePomodoro` - Minuteur
- `useAchievements` - Achievements
- Plus 12 autres utilitaires

## 🐛 Problèmes Transversaux

### 1. Pas de Debouncing dans useTasks
**Sévérité:** Haute
- Chaque modification = requête Supabase immédiate
- Risque de rate limiting

### 2. N+1 Queries dans useTasks
**Sévérité:** Critique
```typescript
// Problème actuel
const tasks = await fetchTasks();
for (const task of tasks) {
  const subtasks = await fetchSubtasks(task.id); // N+1!
}

// Solution
const tasks = await supabase
  .from('tasks')
  .select('*, subtasks:subtasks(*)') // Jointure
  .eq('user_id', userId);
```

### 3. Pas de Versioning/Optimistic Locking
**Sévérité:** Haute
- Risque de conflits concurrents
- Perte de données possible

### 4. Error Handling Inconsistant
**Sévérité:** Moyenne
- Certains hooks throw, d'autres return error
- Pas de retry automatique

### 5. usePomodoro - Pas de Persistence
**Sévérité:** Moyenne
- Minuteur perdu si page refresh
- Utilisateur perd sa session

## 💡 Propositions Globales

### 1. Pattern Standard pour Tous les Hooks
```typescript
// Template pour hooks data-fetching
const useResource = (options) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchData();
      setData(result);
    } catch (err) {
      setError(err);
      // Retry logic
      if (shouldRetry(err)) {
        await retry(() => fetchData());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data,
    loading,
    error,
    refetch: fetch
  };
};
```

### 2. Ajouter Optimistic Locking
```typescript
// Dans useTasks
const updateTask = async (taskId, updates) => {
  const task = tasks.find(t => t.id === taskId);

  // Optimistic update
  setTasks(prev => prev.map(t =>
    t.id === taskId ? { ...t, ...updates, version: t.version + 1 } : t
  ));

  try {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, version: task.version + 1 })
      .eq('id', taskId)
      .eq('version', task.version) // Vérifier version
      .select()
      .single();

    if (error?.code === 'PGRST116') {
      // Conflict détecté
      toast.error('Conflit: la tâche a été modifiée ailleurs');
      await refetchTasks(); // Recharger
    }
  } catch (err) {
    // Rollback
    setTasks(prev => prev.map(t =>
      t.id === taskId ? task : t
    ));
    throw err;
  }
};
```

### 3. Persistence pour usePomodoro
```typescript
const usePomodoro = (options) => {
  const [state, setState] = useState(() => {
    // Restaurer depuis localStorage
    const saved = localStorage.getItem('pomodoro_state');
    return saved ? JSON.parse(saved) : defaultState;
  });

  // Sauvegarder à chaque changement
  useEffect(() => {
    localStorage.setItem('pomodoro_state', JSON.stringify(state));
  }, [state]);

  // Continuer le timer si il était actif
  useEffect(() => {
    if (state.status === 'running') {
      const elapsed = Date.now() - state.startedAt;
      const remaining = state.duration - elapsed;

      if (remaining > 0) {
        // Reprendre le timer
        startTimer(remaining);
      } else {
        // Session terminée pendant l'absence
        handleSessionComplete();
      }
    }
  }, []);
};
```

### 4. Wrapper Universel pour Error Handling
```typescript
const withErrorHandling = (hookFn) => {
  return (...args) => {
    const result = hookFn(...args);

    const [error, setError] = useState(null);

    useEffect(() => {
      if (result.error) {
        // Log to error tracking service
        logError(result.error);

        // Show user-friendly message
        toast.error(getUserMessage(result.error));

        // Retry if applicable
        if (isRetryable(result.error)) {
          setTimeout(() => result.refetch?.(), 2000);
        }
      }
    }, [result.error]);

    return {
      ...result,
      error
    };
  };
};

// Utilisation
const useTasks = withErrorHandling(useTasksBase);
```

## 📊 Priorités par Hook

| Hook | Problèmes | Priorité | Effort |
|------|-----------|----------|--------|
| **useTasks** | N+1, debouncing | 🔴 Critique | 3j |
| **useStats** | Timezone, cache | 🔴 Haute | 2j |
| **usePomodoro** | Persistence | 🟡 Moyenne | 1j |
| **useAchievements** | Déduplication | 🟡 Moyenne | 1j |
| **useNotifications** | Persistence | 🟡 Moyenne | 1j |
| **Autres** | Standardisation | 🟢 Faible | 2j |

## 🔗 Fichiers Connexes

- `src/lib/hooks/*.ts` (16 fichiers)
- Pattern à suivre pour nouveaux hooks

---

**Priorité:** Critique | **Effort total:** 8-10 jours
