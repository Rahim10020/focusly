# Analyse: Authentification

**Fichier principal:** `src/app/auth/signin/page.tsx` + `src/lib/auth.ts`

## 📋 Description

Système d'authentification basé sur NextAuth.js avec Supabase :
- Sign in avec email/password
- JWT strategy
- Refresh token automatique
- Pages personnalisées (signin, signout)

## 🐛 Problèmes Identifiés

### 1. Pas de OAuth Providers (Google, GitHub)
**Sévérité:** Moyenne
- Limite l'adoption (utilisateurs préfèrent OAuth)
- Concurrence désavantagée

### 2. Pas de "Remember Me"
**Sévérité:** Faible
- Utilisateur doit se reconnecter fréquemment

### 3. Pas de "Forgot Password"
**Sévérité:** Haute
- Utilisateurs bloqués en cas d'oubli

### 4. Messages d'Erreur Vagues
**Sévérité:** Moyenne
- "Failed to sign in" peu informatif
- Pas de distinction email non vérifié vs mauvais credentials

### 5. Token Refresh Race Conditions
**Sévérité:** Haute (dans auth.ts)
- Plusieurs requêtes simultanées peuvent causer des refreshes multiples

## 💡 Propositions

### Correction 1: Ajouter OAuth Providers
```typescript
// src/lib/auth.ts
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';

export const authOptions = {
  providers: [
    CredentialsProvider({ /* existing */ }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Créer le profil dans Supabase si OAuth
      if (account.provider !== 'credentials') {
        await createUserProfile(user);
      }
      return true;
    }
  }
};
```

### Correction 2: Implémenter "Forgot Password"
```typescript
// src/app/auth/forgot-password/page.tsx
const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (!error) setSent(true);
  };

  return sent ? (
    <p>Email de réinitialisation envoyé!</p>
  ) : (
    <form onSubmit={handleReset}>
      <Input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Votre email"
      />
      <Button type="submit">Réinitialiser</Button>
    </form>
  );
};
```

### Correction 3: Meilleurs Messages d'Erreur
```typescript
const getErrorMessage = (error: string) => {
  const errors = {
    'CredentialsSignin': 'Email ou mot de passe incorrect',
    'EmailNotVerified': 'Veuillez vérifier votre email avant de vous connecter',
    'AccountNotFound': 'Aucun compte trouvé avec cet email',
    'TooManyRequests': 'Trop de tentatives. Réessayez dans quelques minutes'
  };

  return errors[error] || 'Erreur lors de la connexion';
};
```

### Correction 4: Sémaphore pour Token Refresh
```typescript
let refreshTokenPromise = null;

async function refreshAccessToken(token) {
  // Si un refresh est déjà en cours, attendre
  if (refreshTokenPromise) {
    return await refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: token.refreshToken })
      });

      const refreshed = await response.json();

      return {
        ...token,
        accessToken: refreshed.access_token,
        accessTokenExpires: Date.now() + refreshed.expires_in * 1000,
        refreshToken: refreshed.refresh_token ?? token.refreshToken
      };
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return await refreshTokenPromise;
}
```

## 📊 Métriques de Succès

- Taux de conversion sign up +30% (avec OAuth)
- Taux d'abandon password reset < 5%
- Support requests liés à auth -50%

---

**Priorité:** Haute | **Effort:** 3-4 jours
