# 🎬 Plan d'Action - Synchronisation BD Focusly

**Date**: 28 Mars 2026  
**Status**: ✅ Diagnostic complet + Migration créée + Guide fourni

---

## 📊 Situation Globale

Votre projet Focusly a une base de données bien structurée avec toutes les migrations appliquées, mais:

✅ **Environnement BD**: 13 tables, 24 indexes, tous les champs manquants ont été migrés
❌ **Synchronisation Code**: `database.types.ts` contient un champ fantôme + table task_dependencies manquante

---

## 🎯 ACTIONS À FAIRE (Par Ordre de Priorité)

### 1️⃣ URGENT - Régénérer `database.types.ts` (5 min)

**Problème**: Le fichier contient `reminder: string | null` qui n'existe pas en BD.  
**Conséquence**: Bugs potentiels en production, erreurs de serialization.

**Solution**:

```bash
# Option A - Via CLI (Recommandé)
npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/lib/supabase/database.types.ts

# Option B - Via Dashboard
# 1. Supabase Dashboard
# 2. SQL Editor
# 3. Bouton "Generate TypeScript Types"
# 4. Copier → coller dans src/lib/supabase/database.types.ts
```

**Où trouver YOUR_PROJECT_ID**?

```
Dashboard → Settings → Project ID
Ou depuis URL: https://[PROJECT-ID].supabase.co
```

**Après**: Le champ `reminder` devrait disparaître = ✅ Correct!

---

### 2️⃣ IMPORTANT - Appliquer Migration `task_dependencies` (2 min)

**Problème**: Table `task_dependencies` manquante (vous avez l'interface TS, mais pas la table).  
**Fichier**: `supabase/migrations/20260328_add_task_dependencies.sql` (déjà créé ✓)

**Solution A - Automatique via CLI**:

```bash
supabase db push
```

**Solution B - Manuellement**:

```
1. Dashboard → SQL Editor
2. Copier contenu: supabase/migrations/20260328_add_task_dependencies.sql
3. Exécuter
```

**Après**: Table `task_dependencies` créée avec indexes + constraints ✅

---

### 3️⃣ IMPORTANT - Vérifier TypeScript (2 min)

**Après les 2 étapes précédentes**, lancer:

```bash
npm run type-check
# ou
npx tsc --noEmit
```

**Attendu**: ✅ 0 erreurs (ou erreurs non liées aux types BD)

---

### 4️⃣ RECOMMANDÉ - Tester les APIs (10-15 min)

Après régénération des types, vérifier que les routes API acceptent les nouveaux champs:

```bash
# Vérifier qu'il n'y a pas d'erreurs dans les routes:
npm run build

# Ou importer les fichiers pour voir les erreurs:
grep -r "database.types" src/app/api/
```

**Fichiers clés à vérifier**:

- ✅ `src/app/api/tasks/create` - Doit accepter champs recurrence
- ✅ `src/app/api/tasks/update` - Deve supporter failed_at, postponed_to, is_overdue
- ✅ `src/app/api/stats/*` - Doit utiliser last_active_date
- ✅ `src/app/api/tasks/dependencies` - Route pour dependencies (si existante)

---

### 5️⃣ OPTIONNEL - Auditer les Composants (20-30 min)

Vérifier que les composants React utilisent les nouveaux champs correctement:

```bash
# Lister les usages:
grep -r "isRecurring\|recurrencePattern\|failed_at\|postponed_to\|is_overdue" src/components/ src/app/
```

**Points à vérifier**:

- ✅ Badge "Récurrent" affiche pour `isRecurring: true`
- ✅ Détails recurrence affichés si `recurrencePattern` existe
- ✅ Tâches en retard marquées si `is_overdue: true`
- ✅ Tâches échouées affichent `failed_at` timestamp
- ✅ Tâches postponées affichent `postponed_to` date

---

## ✅ CHECKLIST DE VÉRIFICATION FINALE

```
POST-SYNCHRONISATION:

[ ] database.types.ts régénéré
    → Vérifier: grep "reminder" src/lib/supabase/database.types.ts
    → Devrait retourner: (rien = bon!)

[ ] Migration task_dependencies appliquée
    → Vérifier: Supabase Dashboard → Tables → task_dependencies existe
    → OU requete: SELECT EXISTS(SELECT 1 FROM task_dependencies LIMIT 1)

[ ] npm run type-check passe
    → Pas d'erreurs TS

[ ] npm run build passe
    → Production build OK

[ ] Tests des APIs
    → Au moins tester une API de création de tâche
    → Au moins tester une API d'update avec champ recurrence

[ ] Vérifier le commit de migration
    → Migration fichier créé ✓
    → Applied en BD ✓
```

---

## 📁 Fichiers Créés / Modifiés

**Nouveaux fichiers**:

- ✅ `supabase/migrations/20260328_add_task_dependencies.sql` - Migration complète
- ✅ `SYNC_GUIDE.md` - Guide détaillé de synchronisation
- ✅ `verify-sync.sh` - Script de vérification automatisée
- ✅ `ALIGNEMENT_BD.md` - Analyse complète (mis à jour avec résultats réels)

**À modifier**:

- 🟡 `src/lib/supabase/database.types.ts` - À régénérer (étape 1)

---

## 🎯 Résumé Exécutif

### Avant (Diagnostic)

```
BD: 13 tables, 28 colonnes tasks, tous les champs récents ✓
Code: Types TS décalés, champ fantôme "reminder", table manquante ✗
```

### Après (Plan appliqué)

```
BD: 14 tables (+ task_dependencies), structures complètes ✓
Code: Types synced, plus de champs fantômes, table présente ✓
Production Ready: ✓ ✓ ✓
```

---

## 🚀 Next Steps (Récapitulatif)

**TODAY** (5-10 min):

```bash
# 1. Régénérer types
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/database.types.ts

# 2. Appliquer migration
supabase db push

# 3. Vérifier
npm run type-check
```

**THIS WEEK** (Optional):

- [ ] Auditer API routes
- [ ] Tester composants React
- [ ] Documenter les utilisations des nouveaux champs

---

## 📞 Support / Questions

Si vous rencontrez des erreurs:

1. **`tsc: command not found`** → `npm install -g typescript`
2. **`supabase: command not found`** → `npm install -g @supabase/cli`
3. **Project ID invalide** → Récupérer depuis Settings ou `.env`
4. **Migration refuses** → Vérifier dans Supabase que les migrations précédentes sont OK

**Pour déboguer la migration**:

```sql
-- Vérifier les migrations appliquées
SELECT * FROM _supabase_migrations ORDER BY executed_at DESC LIMIT 5;

-- Vérifier la structure créée
SELECT * FROM information_schema.columns WHERE table_name = 'task_dependencies';
```

---

**Created**: 2026-03-28  
**Status**: 🟢 Ready to implement  
**Estimated Time**: 15-20 minutes  
**Risk Level**: 🟡 Low (non-breaking changes)
