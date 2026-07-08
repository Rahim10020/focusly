# Plan : Suppression propre du dark mode (Focusly)

But : retirer entièrement le dark mode de l'app (UI, logique client, API, schéma,
et colonne BDD). L'app devient forcée en mode clair, sans détection
`prefers-color-scheme`, sans script anti-flash.

## Décisions validées
- Portée : **tout retirer** (UI + client + API + schéma + colonne BDD via migration).
- Visuel : **forcer le clair** (pas de logique de détection, script anti-flash supprimé).
- Fichiers dédiés thème : **supprimés** (ThemeToggle, ThemeProvider, hooks/useTheme).

## 1. CSS / Tailwind
- `src/app/globals.css`
  - Supprimer `@custom-variant dark (&:is(.dark *));` (l.4).
  - Supprimer le bloc `.dark { ... }` (l.78–139).
  - Garder `:root` tel quel (devient la valeur unique claire).
- `tailwind.config.ts` : retirer `darkMode: 'class'` (l.9–10).

## 2. Layout / script anti-flash
- `src/app/layout.tsx`
  - Supprimer le `<script>` inline anti-flash (l.78–90).
  - Retirer import + usage `ThemeProvider` (l.4, 99, 103) ; envelopper `children`
    directement dans `ToastProvider`/`NotificationsProvider`.
  - Retirer `STORAGE_KEYS` si devenu inutilisé dans le layout.

## 3. Suppression des fichiers dédiés thème
- Supprimer `src/components/shared/ThemeToggle.tsx`
- Supprimer `src/components/providers/ThemeProvider.tsx`
- Supprimer `src/hooks/useTheme.ts`

## 4. Nettoyage des références UI
- `src/components/layout/Header.tsx` : retirer `import ThemeToggle` (l.6) et les 2
  usages (l.62, 82).
- `src/app/how-to-use/page.tsx` : retirer `import ThemeToggle` (l.6) + `<ThemeToggle />`
  (l.14) ; réécrire la doc qui mentionne le thème (l.181, 509–510).
- `src/types/user.ts` : supprimer `export type Theme = 'light' | 'dark'`.

## 5. Backend / API
- `src/lib/api/schemas/user.ts` : retirer `theme: z.enum([...])` (l.11).
- `src/app/api/users/preferences/route.ts` :
  - Retirer `theme` des réponses/exemples (l.40, 78, 102) ; mettre à jour le JSDoc.
  - Retirer l'invalidation de cache `theme-preference:*` (l.168) si orpheline.
- `src/constants/storage.ts` : supprimer `THEME: "focusly_theme"` (l.21).
- `src/lib/domain/services/StorageService.ts` : retirer `"theme"` de `keysToKeep`
  (l.76).

## 6. Base de données
- Nouvelle migration `supabase/migrations/20260708_remove_theme_preference.sql` :
  ```sql
  ALTER TABLE user_preferences DROP COLUMN IF EXISTS theme;
  ALTER TABLE user_preferences DROP COLUMN IF EXISTS theme_preference;
  ```
- `src/lib/supabase/database.types.ts` : retirer `theme`/`theme_preference`
  (l.494–495, 508–509, 522–523). Régénérer via `npm run supabase:types` si creds
  dispo, sinon édition manuelle.

## 7. À NE PAS toucher (faux positifs)
- `theme: "grid"` dans `pdf-helpers.ts`, `exportUtils.ts`, `PDFExportService.ts` →
  thème des graphiques Recharts, sans rapport.
- Mentions "themes" dans `DomainEvolutionChart.tsx` / `AdvancedProductivityChart.tsx`
  (commentaires sur les tokens CSS, sans logique dark).
- Commentaire d'exemple `useLocalStorage.ts:21` (cosmétique, aucun impact).

## 8. Vérification
- `npm run lint` + `npm run type-check` → aucune référence orpheline
  (`useTheme`, `ThemeToggle`, `ThemeProvider`, `Theme`, `THEME`).
- `npm run dev` : app en clair sans flash, header sans bouton,
  `GET/POST /api/users/preferences` fonctionne sans `theme`.
- Exécuter la migration sur la BDD cible.

## Risques
- `user_preferences` peut ne pas être défini dans les migrations locales (table
  existante en prod) : la migration `DROP COLUMN IF EXISTS` reste sûre.
- `database.types.ts` est généré ; édition manuelle à synchroniser si `supabase:types`
  est relancé plus tard.
