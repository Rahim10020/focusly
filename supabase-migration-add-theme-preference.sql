-- Créer une table pour stocker les préférences utilisateur
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme_preference VARCHAR(5) DEFAULT 'light',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- Créer un trigger pour ajouter automatiquement une entrée dans user_preferences lors de la création d'un utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Créer le trigger si ce n'est pas déjà fait
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- Activer le RLS sur la table
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 1. Politique de lecture : Les utilisateurs peuvent voir uniquement leurs propres préférences
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. Politique d'insertion : Les utilisateurs peuvent créer leurs propres préférences
CREATE POLICY "Users can create their own preferences"
    ON public.user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 3. Politique de mise à jour : Les utilisateurs peuvent modifier uniquement leurs propres préférences
CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 4. Politique de suppression : Les utilisateurs peuvent supprimer leurs propres préférences
CREATE POLICY "Users can delete their own preferences"
    ON public.user_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Politique d'administration : L'administrateur peut tout faire
CREATE POLICY "Admin full access"
    ON public.user_preferences
    USING (auth.uid() IN (
        SELECT id FROM auth.users 
        WHERE raw_user_meta_data->>'role' = 'admin'
    ));