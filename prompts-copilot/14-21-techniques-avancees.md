# Analyses: Aspects Techniques (14-21)

Analyses des composants UI, utilitaires, intégrations et base de données.

---

## 14-15. Composants UI & Stats

### Composants UI (10+ identifiés)

**Standardisation nécessaire:**
```typescript
// Pattern d'accessibilité
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        aria-disabled={props.disabled}
        role="button"
      >
        {children}
      </button>
    );
  }
);

// Tests systématiques
describe('Button', () => {
  it('should be accessible', async () => {
    const { container } = render(<Button>Click</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });
});
```

### Composants Stats

**Problèmes:** Recharts vs Chart.js (2 libs différentes)
**Solution:** Standardiser sur Recharts (plus moderne)

**Priorité:** Faible | **Effort:** 2 jours

---

## 18. Services Core

### Supabase, Auth, Logger, Cache

**Optimisations:**
```typescript
// Connection pooling pour Supabase
const supabasePool = new SupabasePool({
  min: 2,
  max: 10,
  acquireTimeout: 30000
});

// Logger structuré avec contexte
logger.child({ userId, sessionId }).info('Action completed');

// Cache avec TTL et invalidation
const cache = new MultiLevelCache({
  memory: { ttl: 60000, max: 100 },
  redis: { ttl: 3600000 }
});
```

**Priorité:** Moyenne | **Effort:** 3 jours

---

## 19. Utilitaires

### 8 utilitaires identifiés

**Améliorations clés:**

```typescript
// exportUtils.ts - Streaming pour gros fichiers
const exportLargePDF = async (data) => {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Écrire par chunks
  for (const chunk of data) {
    await writer.write(generatePDFChunk(chunk));
  }

  return stream.readable;
};

// dateUtils.ts - Helpers timezone
export const formatInUserTZ = (date, format) => {
  const tz = getUserTimezone();
  return formatTZ(date, format, { timeZone: tz });
};

// retry.ts - Exponential backoff amélioré
export const retry = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    onRetry
  } = options;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;

      const delay = Math.min(initialDelay * Math.pow(factor, i), maxDelay);

      onRetry?.(err, i + 1, delay);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

**Priorité:** Moyenne | **Effort:** 2 jours

---

## 20. Intégrations Tierces

### Optimisations

**Chart.js & Recharts:**
- ✅ Garder: Recharts (moderne, responsive)
- ❌ Supprimer: Chart.js (duplication)
- Effort: 1 jour

**date-fns:**
- Utiliser imports nommés (tree-shaking)
```typescript
// ❌ Mauvais
import dateFns from 'date-fns';

// ✅ Bon
import { format, addDays } from 'date-fns';
```

**jsPDF:**
- Considérer alternative: pdfmake (plus légère)
- Ou: génération côté serveur


**Priorité:** Moyenne | **Effort:** 3 jours

---