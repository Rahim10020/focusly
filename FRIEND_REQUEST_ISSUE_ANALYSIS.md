# Analyse du Problème "Friend Request Not Found"

## Diagnostic

L'erreur "Friend request not found" se produit probablement lors de l'acceptation d'une demande d'ami pour l'une des raisons suivantes:

### 1. **Problème de RLS (Row Level Security) - CAUSE LA PLUS PROBABLE**

Les politiques RLS de Supabase peuvent empêcher l'utilisateur d'accéder à la friend request. Le code actuel utilise:

```typescript
// Dans /src/app/api/friends/[id]/route.ts (ligne 102-106)
const { data: friendRequestData, error: fetchError } = await supabaseWithAuth
    .from('friends')
    .select('receiver_id, status')
    .eq('id', friendId)
    .single();
```

**Solution:** Vérifier que les RLS policies permettent au receiver de lire les friend requests qui lui sont destinées.

### 2. **Double-click sur le bouton Accept**

Si l'utilisateur clique deux fois rapidement sur "Accept", la première requête change le status à 'accepted', et la deuxième requête ne trouve plus de request avec status 'pending'.

**Solution déjà implémentée:** Le code utilise déjà `processingRequests` pour désactiver le bouton pendant le traitement.

### 3. **ID incorrect dans la notification**

Les notifications stockent `friend_request_id` dans le champ `data`, mais il est possible que cet ID ne corresponde pas à l'ID réel de la friend request.

**Solution:** Vérifier que l'ID stocké dans la notification est correct.

## Vérifications Nécessaires

### 1. Vérifier les RLS Policies dans Supabase

Assurez-vous que la table `friends` a les policies suivantes:

```sql
-- Policy pour lire les friend requests
CREATE POLICY "Users can view friend requests they sent or received"
ON friends FOR SELECT
USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
);

-- Policy pour mettre à jour les friend requests
CREATE POLICY "Users can update friend requests they received"
ON friends FOR UPDATE
USING (
    auth.uid() = receiver_id AND status = 'pending'
);
```

### 2. Amélioration du Code de l'API

Le code actuel pourrait être amélioré pour fournir des messages d'erreur plus spécifiques:

```typescript
// Proposition d'amélioration
const { data: friendRequestData, error: fetchError } = await supabaseWithAuth
    .from('friends')
    .select('receiver_id, status, sender_id')
    .eq('id', friendId)
    .single();

if (fetchError || !friendRequestData) {
    console.error('Friend request fetch error:', {
        error: fetchError,
        friendId,
        userId,
    });
    return NextResponse.json({
        error: 'Friend request not found',
        details: fetchError?.message
    }, { status: 404 });
}
```

### 3. Log des Erreurs

Ajouter des logs plus détaillés pour déboguer:

```typescript
console.log('Attempting to accept friend request:', {
    friendId,
    userId,
    receiverId: friendRequestData?.receiver_id,
    status: friendRequestData?.status,
});
```

## Actions Recommandées

1. **Vérifier les RLS policies dans Supabase** - Le plus important!
2. **Tester avec des logs détaillés** pour identifier exactement où le problème se produit
3. **Vérifier que les IDs dans les notifications sont corrects**
4. **S'assurer que l'authentification Supabase est correctement configurée**

## Note Importante

L'erreur se produit probablement à cause des RLS policies. Vérifiez que:
- Le receiver peut lire la friend request
- Le receiver peut mettre à jour la friend request
- L'authentification Supabase utilise bien le bon access token
