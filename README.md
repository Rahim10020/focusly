# 🔧 Scripts Focusly

Ce dossier contient les scripts utilitaires pour la validation, la sécurité et la maintenance du projet Focusly.

## 📋 Scripts Disponibles

### 🔒 security-check.js

**Description:** Scanne le code source pour détecter les problèmes de sécurité potentiels.

**Usage:**
```bash
npm run test:security
# ou
node scripts/security-check.js
```

**Ce qu'il vérifie:**
- ✅ Exposition de `SUPABASE_SERVICE_ROLE_KEY` dans le code client
- ✅ Tokens stockés dans `localStorage` (vulnérabilité XSS)
- ✅ Création directe de clients Supabase avec SERVICE_ROLE hors API routes
- ✅ Mots de passe hardcodés dans le code
- ✅ Clés API hardcodées
- ✅ Problèmes potentiels dans les policies RLS

**Niveaux de sévérité:**
- 🚨 **CRITICAL:** Bloque le CI/CD, doit être corrigé immédiatement
- ⚠️ **HIGH:** Warning, devrait être corrigé
- 💡 **MEDIUM:** Suggestion d'amélioration

**Exemple de sortie:**
```
🚨 CRITICAL SECURITY ISSUES:

  src/components/TaskManager.tsx:42
  🚨 SERVICE_ROLE_KEY found in client-accessible file
  Code: const client = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY)

📊 SUMMARY:
  Critical: 1
  High:     0
  Medium:   0
  Total:    1

❌ Security check FAILED - Critical issues found!
```

---

### 🌍 check-env.js

**Description:** Valide que toutes les variables d'environnement requises sont correctement configurées.

**Usage:**
```bash
npm run check:env
# ou
node scripts/check-env.js
```

**Ce qu'il vérifie:**
- ✅ Présence de toutes les variables requises
- ✅ Détection de valeurs placeholder (ex: "your-key-here")
- ✅ Préfixes corrects (`NEXT_PUBLIC_` pour variables publiques)
- ✅ Longueur minimale pour les secrets
- ✅ Cohérence entre `.env` et `.env.local`

**Variables vérifiées:**

**Requises:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

**Optionnelles:**
- `NODE_ENV`
- `NEXT_PUBLIC_APP_URL`

**Exemple de sortie:**
```
🔍 Checking environment variables for Focusly...

📁 Environment files checked:
  .env:       ✅
  .env.local: ✅

🔒 REQUIRED VARIABLES:
  ✅ NEXT_PUBLIC_SUPABASE_URL
  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
  ❌ SUPABASE_SERVICE_ROLE_KEY

❌ ISSUES FOUND:

❌ ERRORS:

  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY is not set
    Description: Supabase service role key (NEVER expose to client)
    Example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

📊 SUMMARY:
  Critical: 0
  Errors:   1
  Warnings: 0

❌ Environment validation FAILED!

💡 TIP: Copy .env.example to .env.local and fill in your values
```

---

## 🚀 Utilisation dans le Workflow

### Pendant le développement

```bash
# Avant de committer
npm run validate

# Cela exécute:
# - npm run lint
# - npm run type-check
# - npm run test:security
# - npm run check:env
```

### Dans CI/CD

Ajouter à `.github/workflows/ci.yml`:

```yaml
name: CI

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run validation
        run: npm run validate
        env:
          # Définir les variables d'env pour le check
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
```

### Pre-commit Hook

Ajouter à `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Exécuter les vérifications de sécurité
npm run test:security || exit 1

# Vérifier les types
npm run type-check || exit 1
```

---

## 🔧 Personnalisation

### Ajouter des patterns de sécurité

Éditer `scripts/security-check.js`:

```javascript
const DANGEROUS_PATTERNS = [
    // ... patterns existants
    {
        pattern: /votre-pattern-regex/,
        exclude: ['dossiers', 'à', 'exclure'],
        message: 'Votre message d\'erreur',
        severity: 'CRITICAL' // ou 'HIGH', 'MEDIUM', 'LOW'
    }
];
```

### Ajouter des variables d'environnement

Éditer `scripts/check-env.js`:

```javascript
const REQUIRED_ENV_VARS = {
    // ... variables existantes
    'VOTRE_VARIABLE': {
        description: 'Description de la variable',
        example: 'Exemple de valeur',
        public: false, // true si NEXT_PUBLIC_
        critical: true // true si critique pour la sécurité
    }
};
```

---

## 🐛 Dépannage

### Le script de sécurité ne trouve rien

**Problème:** Aucune erreur n'est détectée même avec des problèmes évidents.

**Solutions:**
1. Vérifier que vous êtes dans le dossier racine du projet
2. Vérifier que `src/` existe
3. Augmenter la verbosité en modifiant le script

### Le script d'environnement échoue toujours

**Problème:** Variables non détectées même si elles sont dans `.env.local`.

**Solutions:**
1. Vérifier le format du fichier `.env.local` (pas d'espaces avant `=`)
2. Vérifier les guillemets (supprimer si présents)
3. Redémarrer le terminal

### Permission denied

**Problème:** `Permission denied` lors de l'exécution.

**Solution:**
```bash
chmod +x scripts/*.js
```

---

## 📚 Ressources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

## 📝 Notes

- Les scripts sont écrits en JavaScript vanilla (pas de dépendances) pour une exécution rapide
- Ils peuvent être exécutés directement avec Node.js sans build
- Les chemins sont relatifs au dossier racine du projet
- Les scripts retournent des exit codes appropriés pour CI/CD :
  - `0` = succès
  - `1` = échec

---

## 🆘 Support

Si vous rencontrez des problèmes avec les scripts :

1. Vérifier les logs de sortie
2. Exécuter avec Node.js en mode verbose : `node --trace-warnings scripts/security-check.js`
3. Consulter ce README
4. Vérifier que Node.js ≥ 18 est installé

---

**Dernière mise à jour:** 28 novembre 2024
