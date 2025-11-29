# Analyses: Fonctionnalités Diverses (6-13)

Ce fichier regroupe les analyses des fonctionnalités secondaires pour optimiser la documentation.

---

## 6. Système Amis

**Fichier:** `src/app/friends/page.tsx` (323 lignes)

### 🐛 Problèmes
1. **Pas de fonction de recherche** - Impossible de trouver des utilisateurs à ajouter
2. **Pas de suppression d'amis** - Relation permanente
3. **Validation limitée** - Peut s'ajouter soi-même

### 💡 Solutions
```typescript
// Barre de recherche
const SearchUsers = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = debounce(async (q) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${q}%`)
      .limit(10);
    setResults(data);
  }, 300);

  return (
    <Input
      placeholder="Rechercher des utilisateurs..."
      onChange={e => search(e.target.value)}
    />
  );
};

// Suppression d'ami
const removeFriend = async (friendshipId) => {
  await supabase.from('friends').delete().eq('id', friendshipId);
};
```

**Priorité:** Moyenne | **Effort:** 2 jours

---

## 7. Leaderboard

**Fichier:** `src/app/leaderboard/page.tsx` (601 lignes)

### 🐛 Problèmes
1. **Stats incohérentes** - Ne correspondent pas toujours aux vraies stats
2. **Cache statique 10min** - Pas de reflet temps réel
3. **Design mobile cassé** - Podium ne s'affiche pas bien

### 💡 Solutions
```typescript
// Filtres temporels
const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

const fetchLeaderboard = async (filter) => {
  let query = supabase.from('leaderboard_view').select('*');

  if (filter === 'month') {
    query = query.gte('created_at', startOfMonth(new Date()));
  } else if (filter === 'week') {
    query = query.gte('created_at', startOfWeek(new Date()));
  }

  return query.order('score', { ascending: false }).limit(100);
};

// Design responsive
<div className="podium grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Podium adaptatif */}
</div>
```

**Priorité:** Moyenne | **Effort:** 2 jours

---

## 8. Calendrier

**Fichier:** `src/app/calendar/page.tsx` (92 lignes)

### 🐛 Problèmes
1. **Pas de création depuis calendrier** - Doit aller sur page tasks
2. **Pas de drag-and-drop** - Impossible de replanifier visuellement
3. **Vue unique (mensuelle)** - Pas de vue hebdo/journalière

### 💡 Solutions
```typescript
// Création inline
const handleDateClick = (date) => {
  setNewTask({
    startDate: date,
    dueDate: date
  });
  setShowQuickAdd(true);
};

// Drag and drop avec react-big-calendar
import { Calendar, momentLocalizer } from 'react-big-calendar';

const CalendarView = () => {
  const handleEventDrop = async ({ event, start, end }) => {
    await updateTask(event.id, {
      start_date: start,
      due_date: end
    });
  };

  return (
    <Calendar
      events={tasks}
      onEventDrop={handleEventDrop}
      onSelectSlot={handleDateClick}
      views={['month', 'week', 'day']}
    />
  );
};
```

**Priorité:** Moyenne | **Effort:** 3 jours

---

## 9. Notifications

**Fichier:** `src/app/notifications/page.tsx` (218 lignes)

### 🐛 Problèmes
1. **Pas de persistence long-terme** - Stockées en session
2. **Pas de sons** - Notifications silencieuses
3. **Pas de push notifications** - Seulement in-app

### 💡 Solutions
```typescript
// Push notifications avec service worker
const requestPushPermission = async () => {
  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });

    // Envoyer au serveur
    await fetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription)
    });
  }
};

// Sons configurables
const playNotificationSound = (type) => {
  const sounds = {
    achievement: '/sounds/achievement.mp3',
    task: '/sounds/task.mp3',
    friend: '/sounds/friend.mp3'
  };

  const audio = new Audio(sounds[type]);
  audio.play();
};
```

**Priorité:** Haute | **Effort:** 4 jours

---

## 10. Profil Utilisateur

**Fichier:** `src/app/profile/page.tsx` (394 lignes)

### 🐛 Problèmes
1. **Pas d'optimisation images** - Upload brut sans compression
2. **Pas de vérification email** - Changement non sécurisé
3. **Stats non synchronisées** - Peuvent être obsolètes

### 💡 Solutions
```typescript
// Compression d'images
import imageCompression from 'browser-image-compression';

const handleAvatarUpload = async (file) => {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 400,
    useWebWorker: true
  };

  const compressed = await imageCompression(file, options);

  // Upload vers Supabase
  const { data } = await supabase.storage
    .from('avatars')
    .upload(`${userId}/${Date.now()}.jpg`, compressed);
};

// Vérification email
const updateEmail = async (newEmail) => {
  const { error } = await supabase.auth.updateUser({
    email: newEmail
  }, {
    emailRedirectTo: `${window.location.origin}/auth/verify`
  });

  if (!error) {
    toast.info('Email de vérification envoyé!');
  }
};
```

**Priorité:** Moyenne | **Effort:** 2 jours

---

## 11. Paramètres

**Fichier:** `src/app/settings/page.tsx` + `src/components/settings/Settings.tsx`

### 🐛 Problèmes
1. **Pas de validation serveur** - Settings acceptés sans vérification
2. **Pas de profils prédéfinis** - Ex: "Mode Ultra Focus" (45min work)

### 💡 Solutions
```typescript
// Profils prédéfinis
const PRESET_PROFILES = {
  classic: {
    name: 'Classique',
    workDuration: 1500, // 25min
    shortBreak: 300,
    longBreak: 900
  },
  ultraFocus: {
    name: 'Ultra Focus',
    workDuration: 2700, // 45min
    shortBreak: 600,
    longBreak: 1800
  },
  sprints: {
    name: 'Sprints Courts',
    workDuration: 900, // 15min
    shortBreak: 180,
    longBreak: 600
  }
};

const SettingsPresets = () => (
  <div className="presets">
    {Object.entries(PRESET_PROFILES).map(([key, profile]) => (
      <Button
        key={key}
        onClick={() => applyPreset(profile)}
      >
        {profile.name}
      </Button>
    ))}
  </div>
);
```

**Priorité:** Faible | **Effort:** 1 jour

---

## 12-13. Composants (Tâches & Pomodoro)

### Composants Tâches
**11 composants identifiés**

Problèmes principaux:
- **TaskModal trop gros** (883 lignes) → Refactoring urgent
- **Drag-and-drop bugs** → Tests et robustesse
- **Performance lists** → Virtualisation pour 100+ items

Solution clé: Refactoring (voir 03-gestion-taches.md)

### Composants Pomodoro
**5 composants identifiés**

Problèmes:
- **Pas de persistence** → LocalStorage
- **Pas de notifications système** → Notification API
- **Pas de mode zen** → Fullscreen + minimal UI

**Priorité:** Voir fichiers dédiés | **Effort:** 6 jours combinés

---

## 🎯 Résumé des Priorités

| Fonctionnalité | Priorité | Effort | Impact |
|----------------|----------|--------|--------|
| Notifications Push | 🔴 Haute | 4j | Engagement +++ |
| Calendrier Interactif | 🟡 Moyenne | 3j | UX ++ |
| Recherche Amis | 🟡 Moyenne | 2j | Social ++ |
| Leaderboard Filtres | 🟡 Moyenne | 2j | Compétition + |
| Profil Optimisé | 🟡 Moyenne | 2j | Performance ++ |
| Settings Presets | 🟢 Faible | 1j | Confort + |

**Total effort:** 14 jours

---

**Dernière mise à jour:** 2025-11-29
