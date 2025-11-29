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

**NextAuth:**
- Mettre à jour vers v5 (alpha stable)
- Meilleure intégration Edge Runtime

**Priorité:** Moyenne | **Effort:** 3 jours

---

## 21. Base de Données

### Schéma Actuel

**12 tables principales:**
- tasks, subtasks, sessions, stats
- tags, achievements, profiles, friends
- stat_visibility, notifications
- cache, rate_limits

### Optimisations Recommandées

#### 1. Indexes Manquants
```sql
-- Performance des requêtes fréquentes
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE completed = false;
CREATE INDEX idx_sessions_user_date ON sessions(user_id, created_at DESC);
CREATE INDEX idx_friends_status ON friends(receiver_id, status);

-- Full-text search pour tâches
CREATE INDEX idx_tasks_search ON tasks USING GIN(to_tsvector('french', title || ' ' || COALESCE(notes, '')));
```

#### 2. Row Level Security (RLS)
```sql
-- Activer RLS sur toutes les tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Politique: utilisateur voit seulement ses tâches
CREATE POLICY tasks_select_policy ON tasks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: utilisateur modifie seulement ses tâches
CREATE POLICY tasks_update_policy ON tasks
  FOR UPDATE
  USING (auth.uid() = user_id);
```

#### 3. Triggers pour Automatisation
```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment version (optimistic locking)
CREATE OR REPLACE FUNCTION increment_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_version
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION increment_version();
```

#### 4. Vues Matérialisées pour Stats
```sql
-- Vue pour leaderboard (refresh toutes les 10 min)
CREATE MATERIALIZED VIEW leaderboard_view AS
SELECT
  p.id,
  p.username,
  p.avatar_url,
  s.total_sessions,
  s.completed_tasks,
  s.total_focus_time,
  s.streak,
  s.longest_streak,
  -- Score composite
  (
    s.completed_tasks * 10 +
    s.total_focus_time / 60 +
    s.streak * 50 +
    s.longest_streak * 20
  ) as score
FROM profiles p
JOIN stats s ON s.user_id = p.id
ORDER BY score DESC;

CREATE UNIQUE INDEX ON leaderboard_view (id);

-- Refresh automatique avec cron
SELECT cron.schedule(
  'refresh-leaderboard',
  '*/10 * * * *', -- toutes les 10 min
  $$ REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard_view; $$
);
```

#### 5. Partitionnement pour Sessions
```sql
-- Partitionner par mois pour meilleures performances
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- ... autres colonnes
) PARTITION BY RANGE (created_at);

-- Créer partitions pour chaque mois
CREATE TABLE sessions_2025_11 PARTITION OF sessions
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE sessions_2025_12 PARTITION OF sessions
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Script pour auto-créer les partitions futures
CREATE OR REPLACE FUNCTION create_monthly_partitions()
RETURNS void AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  partition_name TEXT;
BEGIN
  start_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
  end_date := start_date + INTERVAL '1 month';
  partition_name := 'sessions_' || TO_CHAR(start_date, 'YYYY_MM');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF sessions FOR VALUES FROM (%L) TO (%L)',
    partition_name,
    start_date,
    end_date
  );
END;
$$ LANGUAGE plpgsql;

-- Exécuter mensuellement
SELECT cron.schedule(
  'create-partitions',
  '0 0 1 * *', -- 1er de chaque mois
  $$ SELECT create_monthly_partitions(); $$
);
```

#### 6. Migrations Recommandées

**Ajouter colonnes manquantes:**
```sql
-- Sur tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'
  CHECK (status IN ('active', 'completed', 'failed', 'postponed', 'cancelled'));
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;

-- Sur stats
ALTER TABLE stats ADD COLUMN IF NOT EXISTS last_active_date TIMESTAMPTZ;

-- Sur notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
```

### Monitoring & Observabilité

```sql
-- Vue pour identifier les requêtes lentes
CREATE VIEW slow_queries AS
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- Plus de 100ms en moyenne
ORDER BY mean_time DESC;

-- Alertes sur croissance tables
CREATE OR REPLACE FUNCTION check_table_sizes()
RETURNS TABLE (
  table_name TEXT,
  size_mb BIGINT,
  row_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    schemaname || '.' || tablename AS table_name,
    pg_total_relation_size(schemaname || '.' || tablename) / 1024 / 1024 AS size_mb,
    n_live_tup AS row_count
  FROM pg_stat_user_tables
  ORDER BY size_mb DESC;
END;
$$ LANGUAGE plpgsql;
```

---

## 📊 Impact Global des Optimisations DB

| Optimisation | Gain Performance | Effort |
|--------------|------------------|--------|
| Indexes | 50-200x sur queries | 1h |
| RLS | Sécurité++ | 2h |
| Triggers | Maintenance auto | 1h |
| Vues matérialisées | 10-50x leaderboard | 2h |
| Partitionnement | 5-10x sessions | 3h |
| Monitoring | Visibilité++ | 1h |

**Total effort:** 2 jours
**Gains:** Performance critique améliorée, sécurité renforcée

---

## 🔗 Scripts à Créer

1. `db/migrations/001_add_indexes.sql`
2. `db/migrations/002_enable_rls.sql`
3. `db/migrations/003_add_triggers.sql`
4. `db/migrations/004_create_materialized_views.sql`
5. `db/migrations/005_partition_sessions.sql`
6. `db/migrations/006_add_missing_columns.sql`

---

**Priorité:** Haute (DB) | **Effort total:** 10 jours (tout combiné)
**ROI:** Très élevé - Performance, sécurité, scalabilité
