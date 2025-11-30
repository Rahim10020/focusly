# Supabase Edge Function: check-streaks

Cette fonction Edge vérifie et réinitialise automatiquement les streaks des utilisateurs chaque jour.

## Configuration

### Déploiement

```bash
# Déployer la fonction
supabase functions deploy check-streaks

# Configurer les variables d'environnement
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Configuration du Cron

Dans le dashboard Supabase :
1. Allez dans **Edge Functions** > **check-streaks**
2. Cliquez sur **Add Cron Trigger**
3. Configurez l'expression cron : `0 0 * * *` (minuit tous les jours)
4. Sauvegardez

## Fonctionnement

1. S'exécute quotidiennement à minuit (UTC par défaut)
2. Récupère tous les utilisateurs avec un streak actif
3. Vérifie la date de dernière activité
4. Si > 1 jour d'inactivité :
   - Réinitialise le streak à 0
   - Crée une notification pour l'utilisateur
5. Retourne un rapport d'exécution

## Réponse

```json
{
  "success": true,
  "message": "Streak check completed",
  "stats": {
    "usersChecked": 150,
    "streaksReset": 23,
    "notificationsSent": 23
  }
}
```

## Test manuel

```bash
# Tester localement
supabase functions serve check-streaks

# Invoquer manuellement
curl -X POST http://localhost:54321/functions/v1/check-streaks \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Permissions requises

La fonction utilise la clé de service (SERVICE_ROLE_KEY) qui a accès complet à la base de données.
