# Plan: Suppression propre du feature "Keyboard Shortcuts"

## Objectif
Supprimer le **feature dédié** de keyboard shortcuts (raccourcis de navigation globaux, modal liste, bouton hint flottant, hook partagé, constantes, doc) tout en **gardant** les comportements clavier de base :
- `Modal.tsx` : Escape pour fermer (accessibilité, inchangé)
- `QuickAddTask.tsx` : Enter/Escape (UX formulaire, inchangé)
- Home page : raccourcis timer (Espace = start/pause, R = reset, S = skip, N = focus input) — **conservés** mais réimplémentés sans le hook partagé

## Fichiers à supprimer
1. `src/hooks/useKeyboardShortcuts.ts` — hook `useKeyboardShortcuts` + `GLOBAL_SHORTCUTS` (plus utilisé après migration de la home)
2. `src/components/providers/KeyboardShortcutsProvider.tsx` — provider des raccourcis globaux (navigation Ctrl+1..4, theme, show shortcuts)
3. `src/components/shared/KeyboardShortcutsModal.tsx` — modal listant les raccourcis
4. `src/app/(app)/home/_components/KeyboardShortcutHint.tsx` — bouton flottant "shortcuts"

## Fichiers à modifier
5. `src/app/layout.tsx` (lignes 5, 102-104) — retirer import + wrapper `<KeyboardShortcutsProvider>`. Garder `ThemeProvider`/`ToastProvider`/`NotificationsProvider`.
6. `src/types/user.ts` (lignes 3-11) — supprimer l'interface `KeyboardShortcut` (uniquement consommée par le hook supprimé).
7. `src/app/(app)/home/page.tsx` :
   - Retirer imports : `KeyboardShortcutHint` (l.17), dynamic `KeyboardShortcutsModal` (l.21-24), `useKeyboardShortcuts` + `GLOBAL_SHORTCUTS` (l.29-32).
   - Retirer `const [showShortcuts, setShowShortcuts] = useState(false)` (l.47).
   - Remplacer le bloc `useKeyboardShortcuts([...])` (l.224-260) par un `useEffect` local qui écoute `window.keydown` et gère uniquement : ` ` (start/pause via `timerRef`), `r` (reset), `s` (skip), `n` (focus `taskInputRef`). Inliner les touches littérales (`' '`, `'r'`, `'s'`, `'n'`). Exclure `SHOW_SHORTCUTS`. Inclure la garde "ignore INPUT/TEXTAREA/contentEditable" et le cleanup `removeEventListener`.
   - JSX : supprimer `<KeyboardShortcutsModal ... />` (l.377-379) et `<KeyboardShortcutHint ... />` (l.382).
8. `src/app/how-to-use/page.tsx` :
   - Supprimer la section `<section id="shortcuts">` (l.573+) dédiée aux keyboard shortcuts.
   - Supprimer le lien d'ancrage `href="#shortcuts"` (l.719) et ajuster les références prose "Press ?" (l.263-264, l.442-443) pour ne plus mentionner les raccourcis/le raccourci `?`.

## Comportements à conserver (non touchés)
- `Modal.tsx` `handleEscape` (Escape to close)
- `QuickAddTask.tsx` Enter/Escape
- Raccourcis timer de la home (réimplémentés en local)

## Risques / Points de vigilance
- S'assurer qu'après suppression du hook, **aucune** autre page n'importe `useKeyboardShortcuts` / `GLOBAL_SHORTCUTS` / `KeyboardShortcut` (grep déjà vérifié : seuls `home/page.tsx`, `KeyboardShortcutsProvider`, `useKeyboardShortcuts.ts` les utilisent).
- Le `toggleTheme` utilisé par le provider vient de `ThemeProvider` et reste disponible ailleurs ; pas de régression de thème.
- La home doit toujours ignorer les raccourcis quand on tape dans un input (copier la garde du hook supprimé).

## Validation
- `grep -rn` pour confirmer l'absence totale de `useKeyboardShortcuts`, `GLOBAL_SHORTCUTS`, `KeyboardShortcut`, `KeyboardShortcutsProvider`, `KeyboardShortcutsModal`, `KeyboardShortcutHint`.
- `npm run lint` et `npm run typecheck` (ou équivalent du projet) passent sans erreur.
- `npm run build` réussit.
- Test manuel : sur la home, Espace/R/S/N fonctionnent toujours ; pas de modal ni de bouton flottant ; Ctrl+1..4 ne naviguent plus ; `?` ne fait plus rien ; Escape ferme toujours les modales ouvertes.
