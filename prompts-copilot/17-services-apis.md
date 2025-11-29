# Analyse: Services & APIs

**9+ routes API identifiées**

## 📋 Routes Principales

| Route | Méthode | Fichier | Fonction |
|-------|---------|---------|----------|
| `/api/auth/[...nextauth]` | * | `route.ts` | NextAuth endpoints |
| `/api/friends` | GET/POST | `route.ts` | Relations d'amitié |
| `/api/friends/[id]` | PUT | `[id]/route.ts` | Accept/Reject |
| `/api/leaderboard` | GET | `route.ts` | Classement global |
| `/api/notifications` | GET | `route.ts` | Notifications |
| `/api/notifications/[id]` | PUT/DEL | `[id]/route.ts` | Update/Delete |
| `/api/user/preferences` | GET/PUT | `route.ts` | Préférences |
| `/api/tasks/failed` | GET | `route.ts` | Tâches échouées |
| `/api/users/[userId]` | GET | `[userId]/route.ts` | Profil public |

## 🐛 Problèmes Identifiés

### 1. Validation Insuffisante
**Sévérité:** Haute
- Pas de validation Zod systématique
- Input non sanitisés
- Types TypeScript mais pas runtime

```typescript
// Problème actuel
export async function POST(req: Request) {
  const body = await req.json();
  // Pas de validation!
  const result = await supabase.from('friends').insert(body);
}
```

### 2. Rate Limiting Limité
**Sévérité:** Moyenne
- Seulement sur `/api/leaderboard`
- Pas de protection sur les autres endpoints
- Vulnérable aux abus

### 3. Pas de Pagination Uniforme
**Sévérité:** Moyenne
- Certains endpoints paginent, d'autres non
- Paramètres inconsistants (`page` vs `offset`)

### 4. Gestion d'Erreurs Incohérente
**Sévérité:** Moyenne
```typescript
// Inconsistance dans les réponses d'erreur
// Endpoint 1
return NextResponse.json({ error: 'Failed' }, { status: 500 });

// Endpoint 2
return new Response('Error', { status: 500 });

// Endpoint 3
throw new Error('Failed');
```

### 5. Pas de Logging Structuré
**Sévérité:** Faible
- Console.log dispersés
- Pas de traçabilité des requêtes
- Debug difficile

## 💡 Propositions

### Correction 1: Validation Universelle avec Zod
```typescript
import { z } from 'zod';
import { withValidation } from '@/lib/api/middleware';

// Schémas de validation
const CreateFriendRequestSchema = z.object({
  receiver_id: z.string().uuid()
});

const AcceptFriendRequestSchema = z.object({
  action: z.enum(['accept', 'reject'])
});

// Middleware de validation
export const withValidation = (schema: z.ZodSchema) => {
  return (handler) => async (req: Request, context) => {
    try {
      const body = await req.json();
      const validated = schema.parse(body);

      // Passer les données validées au handler
      return handler(req, context, validated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Validation failed',
          details: err.errors
        }, { status: 400 });
      }
      throw err;
    }
  };
};

// Utilisation
export const POST = withValidation(CreateFriendRequestSchema)(
  async (req, context, data) => {
    // data est typé et validé!
    const { receiver_id } = data;

    const result = await supabase
      .from('friends')
      .insert({ receiver_id, sender_id: session.user.id });

    return NextResponse.json(result);
  }
);
```

### Correction 2: Rate Limiting Universel
```typescript
// src/lib/api/middleware/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const rateLimiters = {
  standard: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 req/10s
  }),

  strict: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 req/min
  }),

  generous: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(100, '60 s'), // 100 req/min
  })
};

export const withRateLimit = (tier: 'standard' | 'strict' | 'generous' = 'standard') => {
  return (handler) => async (req: Request, context) => {
    const identifier = getClientIdentifier(req); // IP ou user ID

    const { success, limit, remaining, reset } = await rateLimiters[tier].limit(
      identifier
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString()
          }
        }
      );
    }

    const response = await handler(req, context);

    // Ajouter headers à toutes les réponses
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());

    return response;
  };
};

// Utilisation
export const GET = withRateLimit('strict')(async (req) => {
  // ...
});
```

### Correction 3: Pagination Standardisée
```typescript
// src/lib/api/utils/pagination.ts
import { z } from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const paginate = async (
  query: SupabaseQueryBuilder,
  params: URLSearchParams
) => {
  const { page, limit } = PaginationSchema.parse({
    page: params.get('page'),
    limit: params.get('limit')
  });

  const offset = (page - 1) * limit;

  // Compter le total
  const { count } = await query.count();

  // Récupérer les données
  const { data, error } = await query
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return {
    data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit),
      hasNext: page < Math.ceil(count / limit),
      hasPrev: page > 1
    }
  };
};

// Utilisation
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const result = await paginate(
    supabase.from('tasks').select('*'),
    searchParams
  );

  return NextResponse.json(result);
}
```

### Correction 4: Middleware Compositionnels
```typescript
// src/lib/api/middleware/compose.ts
export const compose = (...middlewares) => {
  return (handler) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
};

// Utilisation
export const GET = compose(
  withAuth,
  withRateLimit('standard'),
  withValidation(QuerySchema),
  withLogging,
  withErrorHandling
)(async (req, context, data) => {
  // Handler avec toutes les protections!
  const results = await fetchData(data);
  return NextResponse.json(results);
});
```

### Correction 5: Logging Structuré
```typescript
// src/lib/api/middleware/logging.ts
import { logger } from '@/lib/logger';

export const withLogging = (handler) => {
  return async (req: Request, context) => {
    const requestId = crypto.randomUUID();
    const start = Date.now();

    logger.info('API Request', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent')
    });

    try {
      const response = await handler(req, context);
      const duration = Date.now() - start;

      logger.info('API Response', {
        requestId,
        status: response.status,
        duration
      });

      response.headers.set('X-Request-ID', requestId);

      return response;
    } catch (error) {
      const duration = Date.now() - start;

      logger.error('API Error', {
        requestId,
        error: error.message,
        stack: error.stack,
        duration
      });

      throw error;
    }
  };
};
```

## 📊 Standards à Adopter

### Response Format Standard
```typescript
// Success
{
  "data": { /* résultats */ },
  "pagination": { /* si applicable */ },
  "meta": {
    "timestamp": "2025-11-29T12:00:00Z",
    "requestId": "uuid"
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-11-29T12:00:00Z",
    "requestId": "uuid"
  }
}
```

### HTTP Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

## 🔗 Fichiers à Créer

- `src/lib/api/middleware/index.ts` - Exports tous les middlewares
- `src/lib/api/utils/response.ts` - Helpers de réponse
- `src/lib/api/schemas/` - Tous les schémas Zod

---

**Priorité:** Haute | **Effort:** 4-5 jours
