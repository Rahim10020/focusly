# Analyse: Page d'Accueil / Landing Page

**Fichier principal:** `src/app/page.tsx` (743 lignes)

## 📋 Description de la Fonctionnalité

La page d'accueil sert de dashboard principal pour les utilisateurs authentifiés. Elle combine plusieurs fonctionnalités clés :
- Affichage des 5 prochaines tâches imminentes
- Tâches récemment complétées
- Minuteur Pomodoro intégré et actif
- Vue d'ensemble des statistiques (sessions, tâches, temps focus, streaks)
- Notifications en temps réel pour les achievements
- Raccourcis clavier pour contrôler le minuteur

**Composants utilisés:**
- `StatsOverview` (chargement dynamique)
- `TasksView`
- `QuickAddTask`
- `PomodoroTimer`
- `AchievementNotification`
- `KeyboardShortcutsModal`

## 🐛 Problèmes Identifiés

### 1. **Gestion des Refs et Fuites Mémoire Potentielles**
**Sévérité:** Moyenne
**Localisation:** `src/app/page.tsx` - useCallback du Pomodoro

**Description:**
Le code utilise plusieurs refs dans un useCallback pour gérer le minuteur Pomodoro, ce qui peut créer des fuites mémoire si les références ne sont pas correctement nettoyées.

```typescript
const pomodoroCallbacks = useCallback({
  onWorkComplete: handleWorkComplete,
  onBreakComplete: handleBreakComplete
}, [stats, tasks]);
```

**Impact:**
- Fuites mémoire possibles lors de longues sessions
- Accumulation de références non nettoyées
- Performance dégradée au fil du temps

---

### 2. **Appels Répétés à checkAchievements**
**Sévérité:** Moyenne
**Localisation:** `src/app/page.tsx` - Multiples endroits

**Description:**
La fonction `checkAchievements` est appelée plusieurs fois dans différents callbacks (completion de tâche, fin de session Pomodoro, etc.), ce qui peut entraîner des appels API redondants.

```typescript
// Appelé dans handleWorkComplete
await checkAchievements();

// Appelé dans handleTaskComplete
await checkAchievements();

// Potentiellement appelé plusieurs fois par session
```

**Impact:**
- Requêtes Supabase inutiles et répétées
- Augmentation de la charge serveur
- Latence accrue

---

### 3. **Absence de Pagination pour les Tâches**
**Sévérité:** Faible
**Localisation:** `src/app/page.tsx` - Affichage des tâches imminentes

**Description:**
Si un utilisateur a plus de 5 tâches imminentes, seules les 5 premières sont affichées sans possibilité de voir les suivantes.

**Impact:**
- Perte de visibilité sur les tâches importantes
- Expérience utilisateur limitée pour les utilisateurs actifs

---

### 4. **Pas de Cache pour les Statistiques**
**Sévérité:** Moyenne
**Localisation:** Appels à `useStats()`

**Description:**
Les statistiques sont rechargées à chaque render sans mécanisme de cache côté client, même si elles n'ont pas changé.

**Impact:**
- Requêtes répétées inutiles
- Performance dégradée
- Augmentation de la charge Supabase

---

### 5. **Mode Focus Non Implémenté**
**Sévérité:** Faible
**Localisation:** Concept général de la page

**Description:**
Il n'existe pas de mode "focus" qui masquerait les distractions (statistiques, notifications) pour se concentrer uniquement sur le minuteur et la tâche en cours.

**Impact:**
- Distractions possibles pendant les sessions de travail
- Expérience utilisateur moins optimale pour la concentration

---

## 💡 Propositions de Corrections et Améliorations

### Correction 1: Optimiser la Gestion des Refs et useCallback

**Priorité:** Haute
**Difficulté:** Moyenne

**Solution proposée:**
```typescript
// Utiliser useRef pour les valeurs qui changent fréquemment
const statsRef = useRef(stats);
const tasksRef = useRef(tasks);

useEffect(() => {
  statsRef.current = stats;
  tasksRef.current = tasks;
}, [stats, tasks]);

// Mémoriser les callbacks avec des dépendances stables
const pomodoroCallbacks = useMemo(() => ({
  onWorkComplete: async () => {
    // Utiliser statsRef.current au lieu de stats
    await handleWorkComplete(statsRef.current);
  },
  onBreakComplete: async () => {
    await handleBreakComplete();
  }
}), []); // Pas de dépendances
```

**Bénéfices:**
- Élimine les fuites mémoire potentielles
- Améliore la performance
- Code plus propre et maintenable

---

### Correction 2: Débouncer et Optimiser checkAchievements

**Priorité:** Haute
**Difficulté:** Moyenne

**Solution proposée:**
```typescript
import { debounce } from 'lodash';

// Créer une version debouncée de checkAchievements
const debouncedCheckAchievements = useMemo(
  () => debounce(async () => {
    await checkAchievements();
  }, 1000, { leading: false, trailing: true }),
  [checkAchievements]
);

// Utiliser la version debouncée dans les callbacks
const handleWorkComplete = async () => {
  // ... logique existante
  debouncedCheckAchievements();
};

// Cleanup
useEffect(() => {
  return () => {
    debouncedCheckAchievements.cancel();
  };
}, []);
```

**Alternative: Batching des vérifications**
```typescript
// Accumuler les événements et vérifier une seule fois
const [achievementCheckPending, setAchievementCheckPending] = useState(false);

useEffect(() => {
  if (achievementCheckPending) {
    const timer = setTimeout(async () => {
      await checkAchievements();
      setAchievementCheckPending(false);
    }, 2000);

    return () => clearTimeout(timer);
  }
}, [achievementCheckPending]);

// Marquer comme pending au lieu d'appeler directement
const triggerAchievementCheck = () => {
  setAchievementCheckPending(true);
};
```

**Bénéfices:**
- Réduit drastiquement le nombre d'appels API
- Améliore la performance
- Réduit la charge serveur

---

### Amélioration 3: Ajouter la Pagination pour les Tâches

**Priorité:** Moyenne
**Difficulté:** Faible

**Solution proposée:**
```typescript
const [showAllUpcomingTasks, setShowAllUpcomingTasks] = useState(false);
const upcomingTasks = getUpcomingTasks(); // Toutes les tâches
const displayedTasks = showAllUpcomingTasks
  ? upcomingTasks
  : upcomingTasks.slice(0, 5);

return (
  <Card>
    <CardHeader>
      <CardTitle>Tâches Imminentes ({upcomingTasks.length})</CardTitle>
    </CardHeader>
    <CardContent>
      <TasksView tasks={displayedTasks} />
      {upcomingTasks.length > 5 && (
        <Button
          variant="ghost"
          onClick={() => setShowAllUpcomingTasks(!showAllUpcomingTasks)}
        >
          {showAllUpcomingTasks ? 'Voir moins' : `Voir ${upcomingTasks.length - 5} de plus`}
        </Button>
      )}
    </CardContent>
  </Card>
);
```

**Bénéfices:**
- Meilleure visibilité sur toutes les tâches
- Interface plus flexible
- Expérience utilisateur améliorée

---

### Amélioration 4: Implémenter un Cache pour les Statistiques

**Priorité:** Haute
**Difficulté:** Moyenne

**Solution proposée:**
```typescript
// Créer un hook personnalisé avec cache
const useCachedStats = () => {
  const [cachedStats, setCachedStats] = useState(null);
  const [cacheTimestamp, setCacheTimestamp] = useState(0);
  const CACHE_DURATION = 30000; // 30 secondes

  const { stats, ...statsHook } = useStats();

  useEffect(() => {
    const now = Date.now();

    // Utiliser le cache si valide
    if (cachedStats && (now - cacheTimestamp < CACHE_DURATION)) {
      return;
    }

    // Sinon mettre à jour le cache
    if (stats) {
      setCachedStats(stats);
      setCacheTimestamp(now);
    }
  }, [stats]);

  return {
    stats: cachedStats || stats,
    ...statsHook,
    invalidateCache: () => setCacheTimestamp(0)
  };
};

// Utiliser dans le composant
const { stats, invalidateCache } = useCachedStats();

// Invalider le cache après une action importante
const handleTaskComplete = async (taskId) => {
  await toggleTask(taskId);
  invalidateCache(); // Force le rechargement des stats
};
```

**Bénéfices:**
- Réduit les appels Supabase
- Améliore la réactivité de l'interface
- Réduit la charge réseau

---

### Amélioration 5: Implémenter un Mode Focus

**Priorité:** Moyenne
**Difficulté:** Moyenne

**Solution proposée:**
```typescript
const [focusMode, setFocusMode] = useState(false);

// Raccourci clavier pour activer le mode focus
useKeyboardShortcuts({
  'f': () => setFocusMode(!focusMode)
});

return (
  <div className={focusMode ? 'focus-mode' : ''}>
    {!focusMode && (
      <>
        <StatsOverview stats={stats} />
        <TasksView tasks={upcomingTasks} />
      </>
    )}

    <div className={focusMode ? 'focus-mode-timer' : ''}>
      <PomodoroTimer
        activeTaskId={activeTask?.id}
        onWorkComplete={handleWorkComplete}
        onBreakComplete={handleBreakComplete}
      />
    </div>

    <Button
      onClick={() => setFocusMode(!focusMode)}
      className="focus-mode-toggle"
    >
      {focusMode ? 'Quitter' : 'Activer'} Mode Focus
    </Button>
  </div>
);
```

**CSS associé:**
```css
.focus-mode {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.focus-mode-timer {
  transform: scale(1.5);
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}
```

**Bénéfices:**
- Améliore la concentration
- Réduit les distractions
- Expérience utilisateur premium

---

## 📊 Métriques de Succès

Pour mesurer l'efficacité des améliorations :

1. **Performance:**
   - Réduction de 50%+ des appels API redondants
   - Temps de chargement initial < 1s
   - Mémoire stable même après 2h d'utilisation

2. **Expérience Utilisateur:**
   - Taux d'utilisation du mode focus > 30%
   - Satisfaction utilisateur +20%
   - Réduction des plaintes de lenteur

3. **Technique:**
   - Aucune fuite mémoire détectée
   - Lighthouse score > 90
   - Zero layout shifts (CLS)

---

## 🔗 Fichiers Connexes

- `src/components/pomodoro/PomodoroTimer.tsx`
- `src/components/stats/StatsOverview.tsx`
- `src/components/tasks/TasksView.tsx`
- `src/lib/hooks/useStats.ts`
- `src/lib/hooks/useAchievements.ts`
- `src/lib/hooks/useTasks.ts`

---

**Dernière mise à jour:** 2025-11-29
**Priorité globale:** Haute
**Effort estimé:** 2-3 jours de développement
