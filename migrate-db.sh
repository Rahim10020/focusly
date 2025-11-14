#!/bin/bash

# Script de migration de la base de données Supabase
# Ce script applique le schéma SQL à votre base de données Supabase

set -e

echo "🚀 Démarrage de la migration de la base de données..."

# Vérifier si les variables d'environnement sont définies
if [ -z "$SUPABASE_DB_URL" ] && [ -z "$DATABASE_URL" ]; then
    echo "❌ Erreur: SUPABASE_DB_URL ou DATABASE_URL doit être défini"
    echo ""
    echo "Options:"
    echo "1. Définir SUPABASE_DB_URL avec votre connection string Supabase"
    echo "   Format: postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"
    echo ""
    echo "2. Ou utiliser Supabase CLI:"
    echo "   supabase db push"
    echo ""
    exit 1
fi

# Utiliser SUPABASE_DB_URL ou DATABASE_URL
DB_URL="${SUPABASE_DB_URL:-$DATABASE_URL}"

# Vérifier si psql est installé
if ! command -v psql &> /dev/null; then
    echo "❌ Erreur: psql n'est pas installé"
    echo "Installez PostgreSQL client pour utiliser ce script"
    echo "Ou utilisez Supabase CLI: supabase db push"
    exit 1
fi

# Vérifier si le fichier de schéma existe
if [ ! -f "supabase-schema.sql" ]; then
    echo "❌ Erreur: supabase-schema.sql introuvable"
    exit 1
fi

echo "📝 Application du schéma SQL..."
echo ""

# Appliquer le schéma
psql "$DB_URL" -f supabase-schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration réussie!"
    echo ""
    echo "Le schéma a été appliqué avec succès à votre base de données."
else
    echo ""
    echo "❌ Erreur lors de la migration"
    exit 1
fi

