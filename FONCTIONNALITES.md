# Répertoire des Fonctionnalités - Focusly

> Documentation complète de toutes les fonctionnalités implémentées dans le projet Focusly
>
> **Dernière mise à jour:** 2025-11-29
> **Version:** 1.0
> **Fichiers analysés:** 109 fichiers TypeScript/TSX

---

## 📋 Table des Matières

1. [Présentation du Projet](#présentation-du-projet)
2. [Pages et Routes](#pages-et-routes)
3. [Composants React](#composants-react)
4. [Hooks Personnalisés](#hooks-personnalisés)
5. [Services et APIs](#services-et-apis)
6. [Utilitaires](#utilitaires)
7. [Intégrations Tierces](#intégrations-tierces)
8. [Base de Données](#base-de-données)
9. [Statut des Fonctionnalités](#statut-des-fonctionnalités)

---

## 🎯 Présentation du Projet

**Focusly** est une application web de productivité et de gestion des tâches basée sur la technique Pomodoro.

### Technologies Principales
- **Frontend:** Next.js 16, React 19, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Authentification:** NextAuth.js + Supabase Credentials
- **Graphiques:** Chart.js, Recharts
- **Export:** jsPDF, jsPDF-autotable, ics (iCal)
- **Dates:** date-fns, date-fns-tz

---

## 📄 Pages et Routes

### 1.1 Page d'Accueil / Landing Page
**Fichier:** `src/app/page.tsx` (743 lignes)

**Fonctionnalités:**
- Dashboard pour utilisateurs authentifiés
- Affichage des 5 tâches imminentes
- Tâches récemment complétées
- Minuteur Pomodoro intégré
- Vue d'ensemble des statistiques
- Notifications en temps réel
- Raccourcis clavier

**Composants utilisés:** StatsOverview, TasksView, QuickAddTask, PomodoroTimer, AchievementNotification

**[➜ Voir l'analyse détaillée](./prompts-copilot/01-page-accueil.md)**

---

### 1.2 Tableau de Bord Analytique
**Fichier:** `src/app/dashboard/page.tsx` (320 lignes)

**Fonctionnalités:**
- Statistiques complètes (tâches totales, complétées, taux de complétion, streaks)
- Graphiques de productivité (7 et 30 jours)
- Évolution par domaine de vie
- Insights et recommandations
- Export multi-formats (CSV, PDF, iCal)

**Composants utilisés:** AdvancedProductivityChart, DomainEvolutionChart

**[➜ Voir l'analyse détaillée](./prompts-copilot/02-dashboard-analytique.md)**

---

### 1.3 Gestion des Tâches
**Fichier:** `src/app/tasks/page.tsx` (198 lignes)

**Fonctionnalités:**
- CRUD complet des tâches
- Gestion des sous-tâches
- Support des tags et priorités
- Drag-and-drop pour réorganisation
- Tri et filtrage

**Composants utilisés:** TasksView, QuickAddTask

**[➜ Voir l'analyse détaillée](./prompts-copilot/03-gestion-taches.md)**

---

### 1.4 Page de Statistiques
**Fichier:** `src/app/stats/page.tsx` (249 lignes)

**Fonctionnalités:**
- Vue d'ensemble des statistiques
- Graphiques de productivité hebdomadaire
- Sessions récentes (dernières 10)
- Historique des tâches (complétées et échouées)
- Statistiques par domaine de vie
- Achievements déverrouillés et verrouillés

**Composants utilisés:** StatsOverview, ProductivityChart, AchievementsList, TaskHistoryList, DomainStats

**[➜ Voir l'analyse détaillée](./prompts-copilot/04-page-statistiques.md)**

---

### 1.5 Authentification

#### 1.5.1 Sign In
**Fichier:** `src/app/auth/signin/page.tsx` (120 lignes)

**Fonctionnalités:**
- Formulaire d'authentification email/password
- Gestion des erreurs (email non confirmé, identifiants incorrects)
- Lien vers sign up
- État de chargement

**[➜ Voir l'analyse détaillée](./prompts-copilot/05-authentification.md)**

---

### 1.6 Système Social

#### 1.6.1 Amis (Friends)
**Fichier:** `src/app/friends/page.tsx` (323 lignes)

**Fonctionnalités:**
- Affichage des demandes d'amitié en attente
- Accepter/Rejeter les demandes
- Liste des amis acceptés
- Navigation vers les profils des amis

**APIs utilisées:** GET/PUT `/api/friends`

**[➜ Voir l'analyse détaillée](./prompts-copilot/06-systeme-amis.md)**

---

#### 1.6.2 Leaderboard
**Fichier:** `src/app/leaderboard/page.tsx` (601 lignes)

**Fonctionnalités:**
- Classement global des utilisateurs (pagination 20 par page)
- 3 onglets de tri: Tâches, Temps focus, Streaks
- Podium pour les 3 premiers
- Envoi de demandes d'amitié directement depuis le leaderboard
- Navigation vers les profils utilisateurs

**APIs utilisées:** GET `/api/leaderboard`, POST `/api/friends`

**[➜ Voir l'analyse détaillée](./prompts-copilot/07-leaderboard.md)**

---

### 1.7 Calendrier
**Fichier:** `src/app/calendar/page.tsx` (92 lignes)

**Fonctionnalités:**
- Vue mensuelle du calendrier
- Affichage des tâches planifiées par date
- Modal détaillé pour chaque tâche
- Édition directe depuis la vue calendrier
- Support des sous-tâches

**Composants utilisés:** CalendarView

**[➜ Voir l'analyse détaillée](./prompts-copilot/08-calendrier.md)**

---

### 1.8 Notifications
**Fichier:** `src/app/notifications/page.tsx` (218 lignes)

**Fonctionnalités:**
- Affichage de toutes les notifications
- Filtrage (All/Unread)
- Types de notifications: Friend requests, Task completed, Task overdue, Achievement, Info
- Marquer comme lues/non lues
- Supprimer les notifications

**[➜ Voir l'analyse détaillée](./prompts-copilot/09-notifications.md)**

---

### 1.9 Profil Utilisateur
**Fichier:** `src/app/profile/page.tsx` (394 lignes)

**Fonctionnalités:**
- Affichage et édition du profil (nom, email, avatar)
- Upload d'avatar vers Supabase Storage
- Statistiques utilisateur (sessions, tâches complétées, temps focus, streaks)
- Distribution des tâches par domaine de vie

**APIs utilisées:** supabase.auth.updateUser, supabase.storage

**[➜ Voir l'analyse détaillée](./prompts-copilot/10-profil-utilisateur.md)**

---

### 1.10 Paramètres
**Fichier:** `src/app/settings/page.tsx` (47 lignes)
**Composant:** `src/components/settings/Settings.tsx`

**Fonctionnalités:**
- Configuration durées Pomodoro (travail, pause courte, pause longue)
- Cycles avant pause longue
- Auto-start des sessions
- Notifications audio
- Visibilité des stats aux amis
- Reset aux paramètres par défaut

**[➜ Voir l'analyse détaillée](./prompts-copilot/11-parametres.md)**

---

## 🧩 Composants React

### 2.1 Composants de Tâches

| Composant | Fichier | Responsabilités |
|-----------|---------|----------------|
| **TasksView** | `src/components/tasks/TasksView.tsx` | Vue principale, tri, filtrage, liste/kanban |
| **TaskItem** | `src/components/tasks/TaskItem.tsx` (353 lignes) | Affichage d'une tâche, checkbox, options |
| **TaskList** | `src/components/tasks/TaskList.tsx` (353 lignes) | Liste complète avec drag-and-drop |
| **TaskModal** | `src/components/tasks/TaskModal.tsx` (883 lignes) | Formulaire de création/édition |
| **TaskDetailsModal** | `src/components/tasks/TaskDetailsModal.tsx` (810 lignes) | Affichage détaillé d'une tâche |
| **TaskBoardView** | `src/components/tasks/TaskBoardView.tsx` | Vue Kanban (To Do, In Progress, Done) |
| **QuickAddTask** | `src/components/tasks/QuickAddTask.tsx` | Ajout rapide de tâche |
| **TaskSelector** | `src/components/tasks/TaskSelector.tsx` | Sélection pour Pomodoro |
| **SubTaskList** | `src/components/tasks/SubTaskList.tsx` | Affichage des sous-tâches |
| **SubTaskManager** | `src/components/tasks/SubTaskManager.tsx` | Gestion complète des sous-tâches |
| **TaskHistoryList** | `src/components/tasks/TaskHistoryList.tsx` | Historique des tâches |

**[➜ Voir l'analyse détaillée](./prompts-copilot/12-composants-taches.md)**

---

### 2.2 Composants Pomodoro

| Composant | Fichier | Responsabilités |
|-----------|---------|----------------|
| **PomodoroTimer** | `src/components/pomodoro/PomodoroTimer.tsx` | Orchestration du minuteur |
| **TimerDisplay** | `src/components/pomodoro/TimerDisplay.tsx` | Affichage du temps (MM:SS) |
| **TimerControls** | `src/components/pomodoro/TimerControls.tsx` | Boutons Start/Pause/Reset/Skip |
| **ProgressRing** | `src/components/pomodoro/ProgressRing.tsx` | Anneau SVG de progression |
| **SessionIndicator** | `src/components/pomodoro/SessionIndicator.tsx` | Nombre de cycles complétés |

**[➜ Voir l'analyse détaillée](./prompts-copilot/13-composants-pomodoro.md)**

---

### 2.3 Composants de Statistiques

| Composant | Fichier | Responsabilités |
|-----------|---------|----------------|
| **StatsOverview** | `src/components/stats/StatsOverview.tsx` | Vue d'ensemble des stats |
| **ProductivityChart** | `src/components/stats/ProductivityChart.tsx` | Graphique hebdomadaire (Chart.js) |
| **AdvancedProductivityChart** | `src/components/stats/AdvancedProductivityChart.tsx` | Graphique avancé (Recharts) |
| **DomainEvolutionChart** | `src/components/stats/DomainEvolutionChart.tsx` | Évolution par domaine |
| **DomainStats** | `src/components/stats/DomainStats.tsx` | Stats détaillées par domaine |
| **StatsCard** | `src/components/stats/StatsCard.tsx` | Carte de stat réutilisable |

**[➜ Voir l'analyse détaillée](./prompts-copilot/14-composants-stats.md)**

---

### 2.4 Composants UI

| Composant | Fichier | Type |
|-----------|---------|------|
| **Card** | `src/components/ui/Card.tsx` | Container |
| **Button** | `src/components/ui/Button.tsx` | Bouton avec variantes |
| **Input** | `src/components/ui/Input.tsx` | Input réutilisable |
| **Modal** | `src/components/ui/Modal.tsx` | Dialog réutilisable |
| **Toast** | `src/components/ui/Toast.tsx` | Notification toast |
| **ToastContainer** | `src/components/ui/ToastContainer.tsx` | Container de toasts |
| **ThemeToggle** | `src/components/ui/ThemeToggle.tsx` | Toggle light/dark |
| **KeyboardShortcutsModal** | `src/components/ui/KeyboardShortcutsModal.tsx` | Modal raccourcis clavier |
| **Badges** | `src/components/ui/` | DueDateBadge, PriorityBadge, TagBadge |
| **UserMenu** | `src/components/ui/UserMenu.tsx` | Menu utilisateur dropdown |

**[➜ Voir l'analyse détaillée](./prompts-copilot/15-composants-ui.md)**

---

### 2.5 Autres Composants

| Composant | Fichier | Responsabilités |
|-----------|---------|----------------|
| **Header** | `src/components/layout/Header.tsx` | En-tête global |
| **ErrorBoundary** | `src/components/ErrorBoundary.tsx` | Gestion des erreurs React |
| **CalendarView** | `src/components/calendar/CalendarView.tsx` | Calendrier mensuel |
| **AchievementNotification** | `src/components/achievements/AchievementNotification.tsx` | Notification achievement |
| **AchievementsList** | `src/components/achievements/AchievementsList.tsx` | Liste des achievements |

---

## 🪝 Hooks Personnalisés

| Hook | Fichier | Responsabilités |
|------|---------|----------------|
| **useTasks** | `src/lib/hooks/useTasks.ts` | CRUD des tâches, sync Supabase |
| **useStats** | `src/lib/hooks/useStats.ts` | Gestion des statistiques, streaks |
| **useAchievements** | `src/lib/hooks/useAchievements.ts` | Vérification et déverrouillage |
| **usePomodoro** | `src/lib/hooks/usePomodoro.ts` | Gestion du minuteur Pomodoro |
| **useSettings** | `src/lib/hooks/useSettings.ts` | Paramètres utilisateur |
| **useNotifications** | `src/lib/hooks/useNotifications.ts` | Gestion des notifications |
| **useSound** | `src/lib/hooks/useSound.ts` | Lecture des sons |
| **useTags** | `src/lib/hooks/useTags.ts` | CRUD des tags |
| **useLocalStorage** | `src/lib/hooks/useLocalStorage.ts` | Wrapper localStorage |
| **useKeyboardShortcuts** | `src/lib/hooks/useKeyboardShortcuts.ts` | Raccourcis clavier |
| **useTaskNotifications** | `src/lib/hooks/useTaskNotifications.ts` | Notifications de tâches |
| **useSecureStorage** | `src/lib/hooks/useSecureStorage.ts` | Stockage sécurisé |
| **useToast** | `src/lib/hooks/useToast.ts` | Interface toast |
| **useStatVisibility** | `src/lib/hooks/useStatVisibility.ts` | Visibilité des stats |
| **useSupabaseSync** | `src/lib/hooks/useSupabaseSync.ts` | Sync générique Supabase |
| **useTasksEnhanced** | `src/lib/hooks/useTasksEnhanced.ts` | Version améliorée de useTasks |

**[➜ Voir l'analyse détaillée](./prompts-copilot/16-hooks-personnalises.md)**

---

## 🔌 Services et APIs

### API Routes

| Route | Méthode | Fichier | Fonctionnalité |
|-------|---------|---------|---------------|
| `/api/auth/[...nextauth]` | GET/POST | `src/app/api/auth/[...nextauth]/route.ts` | NextAuth endpoints |
| `/api/friends` | GET | `src/app/api/friends/route.ts` | Liste des relations |
| `/api/friends` | POST | `src/app/api/friends/route.ts` | Envoyer demande |
| `/api/friends/[id]` | PUT | `src/app/api/friends/[id]/route.ts` | Accepter/Rejeter |
| `/api/leaderboard` | GET | `src/app/api/leaderboard/route.ts` | Classement global |
| `/api/notifications` | GET | `src/app/api/notifications/route.ts` | Liste notifications |
| `/api/notifications/[id]` | PUT/DELETE | `src/app/api/notifications/[id]/route.ts` | Update/Delete |
| `/api/user/preferences` | GET/PUT | `src/app/api/user/preferences/route.ts` | Préférences |
| `/api/tasks/failed` | GET | `src/app/api/tasks/failed/route.ts` | Tâches échouées |
| `/api/users/[userId]` | GET | `src/app/api/users/[userId]/route.ts` | Profil public |

**[➜ Voir l'analyse détaillée](./prompts-copilot/17-services-apis.md)**

---

### Services Core

| Service | Fichier | Responsabilités |
|---------|---------|----------------|
| **Authentication** | `src/lib/auth.ts` | NextAuth config, JWT |
| **Supabase Client** | `src/lib/supabase/client.ts` | Client Supabase |
| **Supabase Server** | `src/lib/supabase/server.ts` | Server Supabase |
| **Logger** | `src/lib/logger.ts` | Logging structuré |
| **Cache** | `src/lib/cache.ts` | Caching in-memory |
| **Rate Limit** | `src/lib/rateLimit.ts` | Rate limiting |

**[➜ Voir l'analyse détaillée](./prompts-copilot/18-services-core.md)**

---

## 🛠️ Utilitaires

| Utilitaire | Fichier | Fonctions |
|------------|---------|-----------|
| **Calendar Integration** | `src/lib/utils/calendarIntegration.ts` | exportTasksToICS |
| **Date Utils** | `src/lib/utils/dateUtils.ts` | Manipulation dates |
| **Error Handler** | `src/lib/utils/errorHandler.ts` | Gestion erreurs |
| **Export Utils** | `src/lib/utils/exportUtils.ts` | CSV/PDF exports |
| **Retry** | `src/lib/utils/retry.ts` | Retry avec backoff |
| **Supabase Timeout** | `src/lib/utils/supabaseWithTimeout.ts` | Wrapper timeout |
| **Time** | `src/lib/utils/time.ts` | formatTime, getProgress |
| **Time Validation** | `src/lib/utils/timeValidation.ts` | Validation temps |

**[➜ Voir l'analyse détaillée](./prompts-copilot/19-utilitaires.md)**

---

## 🔗 Intégrations Tierces

### Authentification & Backend
- **Supabase** (Auth, Database, Storage, Real-time)
- **NextAuth.js** v4.24.13 (JWT strategy)

### UI & Visualisation
- **Tailwind CSS** v4
- **Lucide React** v0.554.0 (icons)
- **Chart.js** v4.5.1
- **Recharts** v3.4.1

### Utilitaires
- **date-fns** v4.1.0 & **date-fns-tz** v3.2.0
- **jsPDF** v3.0.3 & **jspdf-autotable** v5.0.2
- **ics** v3.8.1 (iCal export)
- **Zod** v4.1.12 (validation)

### Analytics
- **@vercel/analytics** v1.5.0

**[➜ Voir l'analyse détaillée](./prompts-copilot/20-integrations-tierces.md)**

---

## 🗄️ Base de Données

### Tables Principales

| Table | Description | Colonnes clés |
|-------|-------------|--------------|
| **tasks** | Tâches utilisateur | id, user_id, title, completed, priority, tags, due_date, pomodoro_count |
| **subtasks** | Sous-tâches | id, task_id, title, completed |
| **sessions** | Sessions Pomodoro | id, user_id, task_id, duration, type, completed |
| **stats** | Statistiques utilisateur | user_id, total_sessions, completed_tasks, streak, total_focus_time |
| **tags** | Tags/labels | id, user_id, name, color |
| **achievements** | Achievements déverrouillés | user_id, achievement_id, unlocked_at |
| **profiles** | Profils utilisateurs | id, username, avatar_url |
| **friends** | Relations d'amitié | sender_id, receiver_id, status |
| **stat_visibility** | Visibilité des stats | user_id, stat_field, visible_to_friends |
| **notifications** | Notifications | user_id, type, title, message, read |
| **cache** | Cache système | cache_key, data, expires_at |
| **rate_limits** | Limites de taux | identifier, count, reset_time |

**[➜ Voir le schéma complet](./prompts-copilot/21-base-de-donnees.md)**

---

## 📊 Statut des Fonctionnalités

### ✅ Fonctionnalités Complètes

- Gestion des tâches (CRUD, sous-tâches, priorités, tags, drag-and-drop)
- Minuteur Pomodoro (cycles, auto-transition, sons)
- Statistiques et analytics (sessions, focus time, streaks, graphiques)
- Système d'achievements (21+ achievements)
- Système social (amis, demandes, leaderboard)
- Authentification (email/password)
- Calendrier (vue mensuelle)
- Notifications (système interne)
- Profil utilisateur (édition, stats)
- Paramètres (durées, préférences)
- Exports (CSV, PDF, iCal)
- Thème light/dark
- Raccourcis clavier

### ⚠️ Fonctionnalités Partielles

- Notifications (pas de persistence long-terme, pas de push)
- Insights (statiques, non dynamiques)
- Mobile responsive (pas optimisé)
- Real-time sync (technologie disponible mais peu utilisée)

### ❌ Fonctionnalités Non Implémentées

- Application mobile native
- OAuth providers (Google, GitHub)
- Internationalisation (i18n)
- Tâches récurrentes
- Dépendances entre tâches
- Temps estimé vs réel
- Intégrations tierces (Google Calendar, Slack)
- Fonctionnalités IA
- Mode offline

---

## 📈 Statistiques du Projet

- **Total de fichiers TypeScript/TSX:** 109
- **Pages principales:** 11
- **Composants React:** 50+
- **Hooks personnalisés:** 16
- **API routes:** 9+
- **Utilitaires:** 8

### Fichiers les plus volumineux
- `src/components/tasks/TaskModal.tsx` (883 lignes)
- `src/components/tasks/TaskDetailsModal.tsx` (810 lignes)
- `src/app/page.tsx` (743 lignes)
- `src/app/leaderboard/page.tsx` (601 lignes)

---

## 🔗 Liens Rapides vers les Analyses

1. [Page d'Accueil](./prompts-copilot/01-page-accueil.md)
2. [Dashboard Analytique](./prompts-copilot/02-dashboard-analytique.md)
3. [Gestion des Tâches](./prompts-copilot/03-gestion-taches.md)
4. [Page Statistiques](./prompts-copilot/04-page-statistiques.md)
5. [Authentification](./prompts-copilot/05-authentification.md)
6. [Système Amis](./prompts-copilot/06-systeme-amis.md)
7. [Leaderboard](./prompts-copilot/07-leaderboard.md)
8. [Calendrier](./prompts-copilot/08-calendrier.md)
9. [Notifications](./prompts-copilot/09-notifications.md)
10. [Profil Utilisateur](./prompts-copilot/10-profil-utilisateur.md)
11. [Paramètres](./prompts-copilot/11-parametres.md)
12. [Composants Tâches](./prompts-copilot/12-composants-taches.md)
13. [Composants Pomodoro](./prompts-copilot/13-composants-pomodoro.md)
14. [Composants Stats](./prompts-copilot/14-composants-stats.md)
15. [Composants UI](./prompts-copilot/15-composants-ui.md)
16. [Hooks Personnalisés](./prompts-copilot/16-hooks-personnalises.md)
17. [Services & APIs](./prompts-copilot/17-services-apis.md)
18. [Services Core](./prompts-copilot/18-services-core.md)
19. [Utilitaires](./prompts-copilot/19-utilitaires.md)
20. [Intégrations Tierces](./prompts-copilot/20-integrations-tierces.md)
21. [Base de Données](./prompts-copilot/21-base-de-donnees.md)

---

**Documentation générée automatiquement le 2025-11-29**
