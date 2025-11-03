# 🎯 Focusly - Améliorations v2.0

## 📋 Résumé des Nouvelles Fonctionnalités

Voici les **3 fonctionnalités majeures** qui ont été ajoutées à ton app Focusly :

### 1. 🔔 **Notifications + Sons**
- ✅ Sons personnalisés à la fin de chaque session
- ✅ Notifications browser natives
- ✅ Toggle pour activer/désactiver dans les settings
- ✅ Sons générés avec Web Audio API (pas de fichiers audio)

### 2. 🔗 **Lier Tâches aux Pomodoros**
- ✅ Sélectionner une tâche active avant le timer
- ✅ Auto-incrémentation du compteur pomodoro
- ✅ Affichage de la tâche en cours dans le timer
- ✅ Badge "Active" sur la tâche sélectionnée
- ✅ Boutons "Set Active" / "Unset" dans la liste

### 3. ⚙️ **Paramètres Timer Personnalisables**
- ✅ Nouvelle page Settings
- ✅ Durées personnalisables (work, short break, long break)
- ✅ Nombre de cycles avant long break configurable
- ✅ Auto-start breaks et pomodoros
- ✅ Reset to default
- ✅ Persistance des settings dans localStorage


## 🚀 Installation Rapide

### Option 1: Installation Manuelle

```bash
# 1. Créer les dossiers
mkdir -p src/components/settings
mkdir -p src/app/settings

# 2. Copier les nouveaux hooks
cp useNotifications.ts src/lib/hooks/
cp useSound.ts src/lib/hooks/
cp useSettings.ts src/lib/hooks/

# 3. Remplacer les hooks
cp usePomodoro-updated.ts src/lib/hooks/usePomodoro.ts
cp useTasks-updated.ts src/lib/hooks/useTasks.ts

# 4. Copier les nouveaux composants
cp Settings.tsx src/components/settings/
cp TaskSelector.tsx src/components/tasks/

# 5. Remplacer les composants
cp PomodoroTimer-updated.tsx src/components/pomodoro/PomodoroTimer.tsx
cp SessionIndicator-updated.tsx src/components/pomodoro/SessionIndicator.tsx
cp TaskList-updated.tsx src/components/tasks/TaskList.tsx
cp TaskItem-updated.tsx src/components/tasks/TaskItem.tsx
cp Header-updated.tsx src/components/layout/Header.tsx

# 6. Remplacer/Créer les pages
cp page-updated.tsx src/app/page.tsx
cp settings-page.tsx src/app/settings/page.tsx

# 7. Redémarrer
npm run dev
```

### Option 2: Script d'Installation

Crée un fichier `install.sh` :

```bash
#!/bin/bash

echo "🚀 Installation des nouvelles fonctionnalités Focusly..."

# Créer les dossiers
mkdir -p src/components/settings
mkdir -p src/app/settings

# Hooks
cp useNotifications.ts src/lib/hooks/
cp useSound.ts src/lib/hooks/
cp useSettings.ts src/lib/hooks/
cp usePomodoro-updated.ts src/lib/hooks/usePomodoro.ts
cp useTasks-updated.ts src/lib/hooks/useTasks.ts

# Composants
cp Settings.tsx src/components/settings/
cp TaskSelector.tsx src/components/tasks/
cp PomodoroTimer-updated.tsx src/components/pomodoro/PomodoroTimer.tsx
cp SessionIndicator-updated.tsx src/components/pomodoro/SessionIndicator.tsx
cp TaskList-updated.tsx src/components/tasks/TaskList.tsx
cp TaskItem-updated.tsx src/components/tasks/TaskItem.tsx
cp Header-updated.tsx src/components/layout/Header.tsx

# Pages
cp page-updated.tsx src/app/page.tsx
cp settings-page.tsx src/app/settings/page.tsx

echo "✅ Installation terminée !"
echo "📝 Redémarre le serveur avec: npm run dev"
```

Puis exécute :
```bash
chmod +x install.sh
./install.sh
```

---

## 🎮 Guide d'Utilisation

### Première Utilisation

1. **Lance l'app** : `npm run dev`
2. **Va sur Settings** (lien dans le header)
3. **Configure tes préférences** :
   - Durées du timer
   - Auto-start
   - Sons
4. **Retourne sur la page principale**
5. **Crée des tâches**
6. **Clique "Set Active"** sur une tâche
7. **Démarre le timer** → Autorise les notifications
8. **Focus!** 🎯


## 🔧 Configuration Avancée

### Personnaliser les Sons

Édite `src/lib/hooks/useSound.ts` :

```typescript
// Changer les fréquences
createBeepSound(440, 150);  // La (A)
createBeepSound(554, 150);  // Do# (C#)
createBeepSound(659, 300);  // Mi (E)
```

### Ajouter des Settings

Édite `src/lib/hooks/useSettings.ts` :

```typescript
interface TimerSettings {
    // ... existants
    showProgressBar: boolean;
    enableKeyboardShortcuts: boolean;
}
```

### Modifier les Notifications

Édite `src/components/pomodoro/PomodoroTimer.tsx` :

```typescript
showNotification('✅ Session terminée !', {
    body: 'Tu as mérité une pause !',
    icon: '/tomato-icon.png',
})
```

---

## 📊 Statistiques

### Avant les Améliorations
- ❌ Pas de sons/notifications
- ❌ Pas de lien entre tâches et pomodoros
- ❌ Durées fixes non modifiables
- ❌ Pas d'auto-start
- ❌ Pas de page settings

### Après les Améliorations ✨
- ✅ Sons + Notifications
- ✅ Tâches liées aux pomodoros
- ✅ Durées personnalisables
- ✅ Auto-start configurable
- ✅ Page settings complète
- ✅ Toggle sons
- ✅ Badge "Active" sur tâches
- ✅ Compteur pomodoro par tâche

---

## 🎯 Roadmap Future

### Phase suivante suggérée :

1. **📊 Graphiques & Visualisations**
   - Charts de productivité
   - Heatmap calendrier
   - Trends hebdomadaires

2. **🏷️ Tags & Catégories**
   - Organiser les tâches
   - Filtrer par catégorie
   - Statistiques par tag

3. **📱 PWA**
   - Installer comme app
   - Mode offline
   - Icon sur écran d'accueil

4. **⌨️ Keyboard Shortcuts**
   - Space = Start/Pause
   - R = Reset
   - S = Skip
   - N = New task

5. **🎨 Mode Focus**
   - Plein écran
   - Distractions minimales
   - Animations zen

---

## 🐛 Bugs Connus & Fixes

### Bug: Notifications ne s'affichent pas
**Fix:** Vérifie les permissions du navigateur

### Bug: Sons ne jouent pas
**Fix:** Clique sur Start une première fois (interaction requise)

### Bug: Settings ne se sauvegardent pas
**Fix:** Vérifie que localStorage est autorisé

---

## 🤝 Contribution

Si tu veux améliorer le projet :

1. Fork le repo
2. Crée une branche feature
3. Commit tes changements
4. Push et crée une Pull Request

---

## 📝 Notes de Version

### v2.0.0 - Améliorations Majeures

**Nouvelles Features:**
- ✨ Notifications + Sons
- ✨ Tâches actives liées aux pomodoros
- ✨ Settings personnalisables
- ✨ Page Settings
- ✨ Auto-start configurable

**Améliorations:**
- 🔧 Hooks refactorisés
- 🎨 UI améliorée pour les tâches
- 📱 Meilleure expérience mobile

**Fixes:**
- 🐛 Fix timer reset
- 🐛 Fix localStorage
- 🐛 Fix dark mode

---

## 📞 Support

Questions ? Problèmes ?

- 📖 Lis le [GUIDE_INSTALLATION.md]
- 🐛 Ouvre une issue
- 💬 Contacte-moi

---

**🎉 Bon focus avec Focusly v2.0 ! 🍅**

Made with ❤️ and lots of ☕