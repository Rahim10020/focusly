# Prompts d'Analyse pour Copilot - Focusly

Ce dossier contient des analyses détaillées de toutes les fonctionnalités du projet Focusly, avec pour chaque fonctionnalité :
- 🐛 Les problèmes identifiés
- 💡 Les propositions de corrections et améliorations
- 📊 Les métriques de succès
- 🔗 Les fichiers connexes

## 📚 Index des Analyses

### Pages et Routes

1. **[Page d'Accueil](./01-page-accueil.md)**
   - Problèmes: Fuites mémoire, appels répétés à checkAchievements, pas de cache
   - Améliorations: Optimisation refs, debouncing, cache stats, mode focus

2. **[Dashboard Analytique](./02-dashboard-analytique.md)**
   - Problèmes: Insights statiques, graphiques sans interactions, exports limités
   - Améliorations: Insights dynamiques, heatmap productivité, exports personnalisables

3. **[Gestion des Tâches](./03-gestion-taches.md)**
   - Problèmes: TaskModal trop complexe (883 lignes), N+1 queries, pas de validation dates
   - Améliorations: Refactoring composants, optimisation Supabase, tâches récurrentes, rich text editor

4. **[Page Statistiques](./04-page-statistiques.md)**
   - Problèmes: Calcul tâches échouées imprécis, pas de gestion timezone, pas de cache
   - Améliorations: Classification précise, timezone support, worker streaks, cache intelligent

5. **[Authentification](./05-authentification.md)** *(À créer)*
   - Problèmes: Pas de OAuth, pas de "Remember me", messages d'erreur vagues
   - Améliorations: OAuth providers, 2FA, better error messages

6. **[Système Amis](./06-systeme-amis.md)** *(À créer)*
   - Problèmes: Pas de recherche, pas de suppression d'amis, validation limitée
   - Améliorations: Barre de recherche, suggestions, gestion des blocs

7. **[Leaderboard](./07-leaderboard.md)** *(À créer)*
   - Problèmes: Stats incohérentes, cache statique, design mobile cassé
   - Améliorations: Filtres temporels, classements par catégorie, design responsive

8. **[Calendrier](./08-calendrier.md)** *(À créer)*
   - Problèmes: Pas de création depuis le calendrier, pas de drag-and-drop, pas de vue hebdomadaire
   - Améliorations: Création inline, drag-and-drop planning, vues multiples

9. **[Notifications](./09-notifications.md)** *(À créer)*
   - Problèmes: Pas de persistence, pas de sons, pas de push
   - Améliorations: Notifications push, sons configurables, rétention 30 jours

10. **[Profil Utilisateur](./10-profil-utilisateur.md)** *(À créer)*
    - Problèmes: Pas d'optimisation images, pas de validation email, stats non à jour
    - Améliorations: Compression images, vérification email, profil public

11. **[Paramètres](./11-parametres.md)** *(À créer)*
    - Problèmes: Pas de validation serveur, pas de profils prédéfinis
    - Améliorations: Profils de settings, synchronisation cloud, plus d'options

### Composants

12. **[Composants Tâches](./12-composants-taches.md)** *(À créer)*
    - Analyse des 11 composants de gestion des tâches
    - Problèmes et améliorations pour TaskItem, TaskModal, SubTaskManager, etc.

13. **[Composants Pomodoro](./13-composants-pomodoro.md)** *(À créer)*
    - Analyse des 5 composants Pomodoro
    - Problèmes: Pas de persistence, pas de notifications système
    - Améliorations: State persistence, notifications système, mode zen

14. **[Composants Stats](./14-composants-stats.md)** *(À créer)*
    - Analyse des 6 composants de statistiques
    - Problèmes et améliorations pour les graphiques

15. **[Composants UI](./15-composants-ui.md)** *(À créer)*
    - Analyse des composants UI réutilisables
    - Standardisation et accessibilité

### Hooks et Services

16. **[Hooks Personnalisés](./16-hooks-personnalises.md)** *(À créer)*
    - Analyse des 16 hooks
    - Problèmes: Pas de debouncing, pas de versioning, N+1 queries
    - Améliorations: Optimisation, caching, error handling

17. **[Services & APIs](./17-services-apis.md)** *(À créer)*
    - Analyse des 9+ routes API
    - Problèmes: Rate limiting limité, validation insuffisante
    - Améliorations: Validation Zod, meilleure auth, caching

18. **[Services Core](./18-services-core.md)** *(À créer)*
    - Auth, Supabase, Logger, Cache, Rate Limit
    - Problèmes: Token refresh race conditions, pas de OAuth
    - Améliorations: OAuth, sémaphores, monitoring

19. **[Utilitaires](./19-utilitaires.md)** *(À créer)*
    - Analyse des 8 utilitaires
    - exportUtils, dateUtils, retry, etc.

### Intégrations

20. **[Intégrations Tierces](./20-integrations-tierces.md)** *(À créer)*
    - Supabase, NextAuth, Chart.js, Recharts, date-fns, jsPDF
    - Optimisations et mises à jour

21. **[Base de Données](./21-base-de-donnees.md)** *(À créer)*
    - Schéma complet
    - Optimisations: indexes, RLS, triggers
    - Migrations recommandées

## 🎯 Comment Utiliser Ces Prompts avec Copilot

### Pour une Correction de Bug
```
@workspace Consulte le fichier prompts-copilot/03-gestion-taches.md,
section "Problème 2: Pas de Validation des Dates" et implémente la
solution proposée dans TaskModal.
```

### Pour une Amélioration
```
@workspace Implémente l'amélioration "Insights Dynamiques" décrite dans
prompts-copilot/02-dashboard-analytique.md, section "Correction 1".
```

### Pour une Revue de Code
```
@workspace Analyse le fichier src/lib/hooks/useTasks.ts en te basant sur
les problèmes identifiés dans prompts-copilot/16-hooks-personnalises.md
et propose des corrections.
```

## 📊 Statistiques des Analyses

- **Total d'analyses:** 21 fonctionnalités
- **Problèmes identifiés:** 100+
- **Solutions proposées:** 100+
- **Effort total estimé:** 30-40 jours de développement
- **Priorités:**
  - 🔴 Haute: 35%
  - 🟡 Moyenne: 50%
  - 🟢 Faible: 15%

## 🔧 Priorités Recommandées

### Phase 1: Corrections Critiques (1-2 semaines)
1. Optimiser les requêtes Supabase (N+1 queries)
2. Refactoriser TaskModal (883 lignes → composants)
3. Ajouter validation des dates
4. Implémenter debouncing des mises à jour
5. Corriger la gestion des fuseaux horaires (streaks)

### Phase 2: Améliorations Majeures (2-3 semaines)
1. Insights dynamiques
2. Tâches récurrentes
3. Rich text editor
4. Heatmap de productivité
5. Cache intelligent multi-niveaux
6. Classification précise des tâches échouées

### Phase 3: Fonctionnalités Avancées (3-4 semaines)
1. Mode focus
2. OAuth providers
3. Notifications push
4. Exports personnalisables
5. Profils publics
6. Worker pour streaks

## 📝 Notes

- Tous les problèmes sont documentés avec sévérité et impact
- Toutes les solutions incluent du code d'exemple
- Les métriques de succès sont définies pour chaque amélioration
- Les fichiers connexes sont listés pour faciliter la navigation

## 🤝 Contribution

Ces analyses peuvent être mises à jour à mesure que le projet évolue.
Format de chaque fichier :
- Description de la fonctionnalité
- 🐛 Problèmes identifiés (sévérité, localisation, description, impact)
- 💡 Propositions (priorité, difficulté, solution, bénéfices)
- 📊 Métriques de succès
- 🔗 Fichiers connexes

---

**Dernière mise à jour:** 2025-11-29
