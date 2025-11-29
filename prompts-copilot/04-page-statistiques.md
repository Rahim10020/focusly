# Analyse: Page de Statistiques

**Fichier principal:** `src/app/stats/page.tsx` (249 lignes)

## 📋 Description de la Fonctionnalité

Page dédiée aux statistiques détaillées avec plusieurs onglets :
- **Overview:** Vue d'ensemble des statistiques principales
- **Achievements:** Achievements déverrouillés et verrouillés avec progression
- **Tasks:** Historique des tâches complétées et échouées
- **Domains:** Statistiques par domaine de vie

Composants utilisés (lazy-loaded):
- `StatsOverview`
- `ProductivityChart`
- `AchievementsList`
- `TaskHistoryList`
- `DomainStats`

## 🐛 Problèmes Identifiés

### 1. **Calcul des Tâches Échouées Imprécis**
**Sévérité:** Haute
**Localisation:** Logic de calcul des `failedTasks`

**Description:**
Les tâches sont marquées comme "échouées" uniquement si leur `dueDate` est dépassée. Il n'y a pas de marquage explicite par l'utilisateur ni de distinction entre :
- Tâches en retard mais toujours actives
- Tâches abandonnées volontairement
- Tâches reportées

```typescript
// Code actuel simplifié
const failedTasks = tasks.filter(t =>
  !t.completed && t.due_date && new Date(t.due_date) < new Date()
);
```

**Impact:**
- Classification incorrecte des tâches
- Fausses statistiques d'échec
- Pas de distinction entre retard et abandon
- Démotivation de l'utilisateur (taux d'échec gonflé)

---

### 2. **Pas de Lien vers les Tâches Échouées pour Correction**
**Sévérité:** Moyenne
**Localisation:** Affichage de l'historique

**Description:**
L'historique affiche les tâches échouées mais ne permet pas de naviguer vers elles pour les modifier, reporter ou compléter.

**Impact:**
- Pas d'action possible depuis la page stats
- Navigation complexe pour corriger
- Opportunités de récupération manquées

---

### 3. **Pas de Gestion de Fuseau Horaire pour les Streaks**
**Sévérité:** Haute
**Localisation:** `src/lib/hooks/useStats.ts` - Calcul des streaks

**Description:**
Le calcul des streaks ne prend pas en compte le fuseau horaire de l'utilisateur. Un utilisateur peut perdre son streak à cause du décalage horaire.

```typescript
// Problème: utilise l'heure du serveur, pas celle de l'utilisateur
const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
```

**Impact:**
- Streaks perdus injustement
- Frustration utilisateur
- Incohérence internationale

---

### 4. **Streaks Non Réinitialisés Automatiquement à Minuit**
**Sévérité:** Moyenne
**Localisation:** Logique de mise à jour des streaks

**Description:**
Si l'utilisateur ne complète pas de tâche un jour donné, le streak n'est réinitialisé que la prochaine fois qu'il se connecte.

**Impact:**
- Streaks "gelés" pendant plusieurs jours
- Statistiques non à jour
- Pas de feedback immédiat

---

### 5. **Pas de Cache des Sessions par Date**
**Sévérité:** Moyenne
**Localisation:** Requêtes des sessions récentes

**Description:**
Chaque affichage de la page stats requête toutes les sessions sans cache, même si elles sont récentes.

**Impact:**
- Requêtes répétées
- Performance dégradée
- Charge serveur inutile

---

## 💡 Propositions de Corrections et Améliorations

### Correction 1: Améliorer la Classification des Tâches Échouées

**Priorité:** Haute
**Difficulté:** Moyenne

**Solution proposée:**
```typescript
// Ajouter un nouveau champ à la table tasks
interface Task {
  // ... champs existants
  status: 'active' | 'completed' | 'failed' | 'postponed' | 'cancelled';
  postponed_to?: string; // Nouvelle date si reportée
  failure_reason?: string; // Raison de l'échec
}

// Logique améliorée
const categorize Tasks = (tasks: Task[]) => {
  const now = new Date();

  return {
    active: tasks.filter(t => t.status === 'active'),
    completed: tasks.filter(t => t.status === 'completed'),

    // Tâches vraiment échouées (marquées explicitement)
    failed: tasks.filter(t => t.status === 'failed'),

    // Tâches en retard mais toujours actives
    overdue: tasks.filter(t =>
      t.status === 'active' &&
      t.due_date &&
      new Date(t.due_date) < now
    ),

    // Tâches reportées
    postponed: tasks.filter(t => t.status === 'postponed'),

    // Tâches annulées
    cancelled: tasks.filter(t => t.status === 'cancelled')
  };
};

// Composant pour marquer une tâche comme échouée
const FailTaskModal = ({ task, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [action, setAction] = useState<'fail' | 'postpone' | 'cancel'>('fail');

  const handleConfirm = () => {
    switch (action) {
      case 'fail':
        onConfirm({
          ...task,
          status: 'failed',
          failure_reason: reason
        });
        break;

      case 'postpone':
        const newDate = prompt('Nouvelle date?');
        onConfirm({
          ...task,
          status: 'postponed',
          postponed_to: newDate
        });
        break;

      case 'cancel':
        onConfirm({
          ...task,
          status: 'cancelled'
        });
        break;
    }
  };

  return (
    <Modal>
      <h2>Que voulez-vous faire avec cette tâche ?</h2>

      <RadioGroup value={action} onChange={setAction}>
        <Radio value="fail">Marquer comme échouée</Radio>
        <Radio value="postpone">Reporter à une autre date</Radio>
        <Radio value="cancel">Annuler définitivement</Radio>
      </RadioGroup>

      {action === 'fail' && (
        <Textarea
          label="Raison de l'échec (optionnel)"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Ex: Manque de temps, priorités changées..."
        />
      )}

      <Button onClick={handleConfirm}>Confirmer</Button>
    </Modal>
  );
};

// Statistiques améliorées
const calculateAccurateStats = (tasks: Task[]) => {
  const categorized = categorizeTasks(tasks);

  return {
    total: tasks.length,
    completed: categorized.completed.length,
    failed: categorized.failed.length,
    overdue: categorized.overdue.length,
    postponed: categorized.postponed.length,

    // Taux de complétion réel (sans compter les annulées)
    completionRate: (
      categorized.completed.length /
      (tasks.length - categorized.cancelled.length)
    ) * 100,

    // Taux d'échec réel
    failureRate: (
      categorized.failed.length /
      (tasks.length - categorized.cancelled.length)
    ) * 100
  };
};
```

**Bénéfices:**
- Statistiques précises et honnêtes
- Distinction claire entre types de non-complétion
- Insights plus riches (ex: "Vous reportez souvent, essayez de définir des objectifs plus réalistes")

---

### Correction 2: Ajouter des Actions Rapides depuis l'Historique

**Priorité:** Moyenne
**Difficulté:** Faible

**Solution proposée:**
```typescript
const TaskHistoryList = ({ tasks }) => {
  const { updateTask, deleteTask } = useTasks();
  const navigate = useNavigate();

  const QuickActions = ({ task }) => (
    <div className="quick-actions">
      {task.status === 'failed' && (
        <>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => updateTask(task.id, {
              status: 'active',
              failure_reason: null
            })}
          >
            <ReplayIcon /> Réactiver
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const newDate = prompt('Nouvelle date limite?');
              if (newDate) {
                updateTask(task.id, {
                  status: 'active',
                  due_date: newDate,
                  postponed_to: newDate
                });
              }
            }}
          >
            <CalendarIcon /> Reporter
          </Button>
        </>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={() => navigate(`/tasks/${task.id}`)}
      >
        <EditIcon /> Éditer
      </Button>

      {task.status === 'completed' && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => updateTask(task.id, {
            completed: false,
            status: 'active',
            completed_at: null
          })}
        >
          <UndoIcon /> Rouvrir
        </Button>
      )}

      <Button
        size="sm"
        variant="ghost"
        onClick={() => {
          if (confirm('Supprimer cette tâche?')) {
            deleteTask(task.id);
          }
        }}
      >
        <TrashIcon /> Supprimer
      </Button>
    </div>
  );

  return (
    <div className="task-history">
      {tasks.map(task => (
        <Card key={task.id} className={`task-history-item ${task.status}`}>
          <div className="task-info">
            <h4>{task.title}</h4>
            <div className="metadata">
              <StatusBadge status={task.status} />
              <span>{formatDate(task.completed_at || task.updated_at)}</span>
              {task.failure_reason && (
                <Tooltip content={task.failure_reason}>
                  <InfoIcon />
                </Tooltip>
              )}
            </div>
          </div>
          <QuickActions task={task} />
        </Card>
      ))}
    </div>
  );
};
```

**Bénéfices:**
- Actions directes sans navigation
- Récupération facile des tâches échouées
- Meilleure productivité

---

### Correction 3: Gestion Correcte du Fuseau Horaire pour les Streaks

**Priorité:** Haute
**Difficulté:** Moyenne

**Solution proposée:**
```typescript
import { utcToZonedTime, zonedTimeToUtc, format } from 'date-fns-tz';

// Service de gestion des streaks avec timezone
class StreakService {
  static getUserTimezone(): string {
    // Tenter de récupérer depuis les settings utilisateur
    const savedTimezone = localStorage.getItem('userTimezone');
    if (savedTimezone) return savedTimezone;

    // Sinon utiliser le timezone du navigateur
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  static getTodayInUserTimezone(): Date {
    const timezone = this.getUserTimezone();
    return utcToZonedTime(new Date(), timezone);
  }

  static getStartOfDayInUserTimezone(date?: Date): Date {
    const timezone = this.getUserTimezone();
    const targetDate = date || new Date();
    const zonedDate = utcToZonedTime(targetDate, timezone);

    zonedDate.setHours(0, 0, 0, 0);

    return zonedTimeToUtc(zonedDate, timezone);
  }

  static calculateStreak(sessions: Session[]): {
    current: number;
    longest: number;
    lastActiveDate: Date;
  } {
    if (!sessions.length) {
      return { current: 0, longest: 0, lastActiveDate: null };
    }

    const timezone = this.getUserTimezone();

    // Grouper les sessions par jour (dans le timezone utilisateur)
    const sessionsByDay = new Map<string, Session[]>();

    sessions.forEach(session => {
      const zonedDate = utcToZonedTime(new Date(session.completed_at), timezone);
      const dayKey = format(zonedDate, 'yyyy-MM-dd', { timeZone: timezone });

      if (!sessionsByDay.has(dayKey)) {
        sessionsByDay.set(dayKey, []);
      }
      sessionsByDay.get(dayKey).push(session);
    });

    // Trier les dates
    const sortedDays = Array.from(sessionsByDay.keys()).sort().reverse();

    // Calculer le streak actuel
    let currentStreak = 0;
    const today = format(this.getTodayInUserTimezone(), 'yyyy-MM-dd', {
      timeZone: timezone
    });

    let checkDate = today;
    let dayIndex = 0;

    while (dayIndex < sortedDays.length && sortedDays[dayIndex] === checkDate) {
      currentStreak++;
      dayIndex++;

      // Passer au jour précédent
      const prevDate = new Date(checkDate);
      prevDate.setDate(prevDate.getDate() - 1);
      checkDate = format(
        utcToZonedTime(prevDate, timezone),
        'yyyy-MM-dd',
        { timeZone: timezone }
      );
    }

    // Calculer le longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let expectedDate = sortedDays[0];

    for (const day of sortedDays) {
      if (day === expectedDate) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);

        // Calculer la date précédente attendue
        const prevDate = new Date(day);
        prevDate.setDate(prevDate.getDate() - 1);
        expectedDate = format(
          utcToZonedTime(prevDate, timezone),
          'yyyy-MM-dd',
          { timeZone: timezone }
        );
      } else {
        tempStreak = 1;
        expectedDate = format(
          utcToZonedTime(new Date(day).setDate(new Date(day).getDate() - 1), timezone),
          'yyyy-MM-dd',
          { timeZone: timezone }
        );
      }
    }

    return {
      current: currentStreak,
      longest: longestStreak,
      lastActiveDate: sortedDays[0] ? new Date(sortedDays[0]) : null
    };
  }
}

// Hook amélioré
const useStats = () => {
  const [stats, setStats] = useState(null);

  const refreshStats = useCallback(async () => {
    const sessions = await fetchSessions();
    const streakData = StreakService.calculateStreak(sessions);

    setStats(prev => ({
      ...prev,
      streak: streakData.current,
      longestStreak: streakData.longest,
      lastActiveDate: streakData.lastActiveDate
    }));
  }, []);

  return { stats, refreshStats };
};
```

**Bénéfices:**
- Streaks justes pour tous les utilisateurs
- Pas de perte injuste due au timezone
- Support international

---

### Amélioration 4: Implémenter un Worker pour Réinitialiser les Streaks

**Priorité:** Moyenne
**Difficulté:** Haute

**Solution proposée:**
```typescript
// Service Worker ou Cron Job côté serveur

// Option 1: Service Worker (côté client)
// sw.js
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-streak') {
    event.waitUntil(checkAndResetStreak());
  }
});

async function checkAndResetStreak() {
  const lastActiveDate = await getLastActiveDate();
  const today = StreakService.getTodayInUserTimezone();

  const daysSinceLastActive = Math.floor(
    (today.getTime() - new Date(lastActiveDate).getTime()) /
    (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastActive > 1) {
    // Streak perdu
    await updateStreak(0);
    await showNotification('Streak perdu', {
      body: 'Votre streak a été réinitialisé. Commencez-en un nouveau!',
      icon: '/icons/streak-lost.png'
    });
  }
}

// Option 2: Supabase Edge Function (côté serveur) - RECOMMANDÉ
// supabase/functions/check-streaks/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );

  // Récupérer tous les utilisateurs actifs
  const { data: users } = await supabase
    .from('stats')
    .select('user_id, streak, last_active_date')
    .gt('streak', 0);

  const updates = [];

  for (const user of users) {
    const lastActive = new Date(user.last_active_date);
    const now = new Date();

    const daysDiff = Math.floor(
      (now.getTime() - lastActive.getTime()) /
      (1000 * 60 * 60 * 24)
    );

    if (daysDiff > 1) {
      // Streak perdu
      updates.push({
        user_id: user.user_id,
        streak: 0
      });

      // Créer une notification
      await supabase.from('notifications').insert({
        user_id: user.user_id,
        type: 'streak_lost',
        title: 'Streak perdu',
        message: `Votre streak de ${user.streak} jours a été réinitialisé.`,
        read: false
      });
    }
  }

  if (updates.length > 0) {
    await supabase
      .from('stats')
      .upsert(updates, { onConflict: 'user_id' });
  }

  return new Response(
    JSON.stringify({ updated: updates.length }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

// Configurer un cron pour exécuter cette fonction quotidiennement
// Dans Supabase Dashboard: Edge Functions > check-streaks > Cron
// Schedule: 0 0 * * * (minuit tous les jours)
```

**Bénéfices:**
- Streaks toujours à jour
- Notifications proactives
- Pas de dépendance à la connexion utilisateur

---

### Amélioration 5: Implémenter un Cache Intelligent

**Priorité:** Moyenne
**Difficulté:** Moyenne

**Solution proposée:**
```typescript
// Hook avec cache multi-niveaux
const useCachedSessions = (timeRange: number = 30) => {
  const [sessions, setSessions] = useState([]);
  const cacheKey = `sessions_${timeRange}days`;

  useEffect(() => {
    const fetchWithCache = async () => {
      // Niveau 1: Cache mémoire (React state)
      if (sessions.length > 0) {
        return;
      }

      // Niveau 2: IndexedDB (persistant côté client)
      const cachedData = await getCachedSessions(cacheKey);

      if (cachedData && !isCacheExpired(cachedData.timestamp, 5 * 60 * 1000)) {
        setSessions(cachedData.data);
        return;
      }

      // Niveau 3: Serveur
      const freshData = await fetchSessionsFromServer(timeRange);
      setSessions(freshData);

      // Mettre à jour le cache IndexedDB
      await cacheSessions(cacheKey, freshData);
    };

    fetchWithCache();
  }, [timeRange]);

  const invalidateCache = useCallback(async () => {
    await deleteCachedSessions(cacheKey);
    setSessions([]);
  }, [cacheKey]);

  return { sessions, invalidateCache };
};

// Service de cache IndexedDB
const CacheService = {
  async get(key: string) {
    const db = await this.openDB();
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');
    return await store.get(key);
  },

  async set(key: string, data: any) {
    const db = await this.openDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    await store.put({
      key,
      data,
      timestamp: Date.now()
    });
  },

  async delete(key: string) {
    const db = await this.openDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    await store.delete(key);
  },

  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('FocuslyCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('cache')) {
          db.createObjectStore('cache', { keyPath: 'key' });
        }
      };
    });
  }
};
```

**Bénéfices:**
- Performance drastiquement améliorée
- Moins de requêtes serveur
- Expérience offline partielle

---

## 📊 Métriques de Succès

1. **Précision:**
   - Taux d'erreur de classification = 0%
   - Streaks corrects pour 100% des utilisateurs

2. **Performance:**
   - Temps de chargement stats < 300ms (avec cache)
   - 70% des requêtes servies par le cache

3. **Engagement:**
   - Taux d'utilisation des actions rapides > 40%
   - Tâches récupérées depuis l'historique > 15%

---

## 🔗 Fichiers Connexes

- `src/components/stats/StatsOverview.tsx`
- `src/components/stats/TaskHistoryList.tsx`
- `src/lib/hooks/useStats.ts`

---

**Dernière mise à jour:** 2025-11-29
**Priorité globale:** Haute
**Effort estimé:** 3-4 jours de développement
