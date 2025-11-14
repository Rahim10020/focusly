#!/usr/bin/env node

/**
 * Script de migration de la base de données Supabase
 * Ce script vérifie les options disponibles et guide l'utilisateur
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Migration de la base de données Supabase\n');

// Vérifier si Supabase CLI est installé
function checkSupabaseCLI() {
    try {
        execSync('supabase --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Vérifier si psql est installé
function checkPsql() {
    try {
        execSync('psql --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

// Méthode 1: Utiliser Supabase CLI (recommandé)
if (checkSupabaseCLI()) {
    console.log('✅ Supabase CLI détecté\n');
    console.log('📝 Pour migrer avec Supabase CLI:');
    console.log('   1. Assurez-vous d\'être connecté: supabase login');
    console.log('   2. Liez votre projet: supabase link --project-ref YOUR_PROJECT_REF');
    console.log('   3. Appliquez le schéma: supabase db push\n');
    console.log('   Ou exécutez directement:');
    console.log('   supabase db push --db-url "postgresql://..." < supabase-schema.sql\n');
} else {
    console.log('ℹ️  Supabase CLI non installé');
    console.log('   Installez-le avec: npm install -g supabase\n');
}

// Méthode 2: Utiliser psql
if (checkPsql()) {
    console.log('✅ psql détecté\n');
    console.log('📝 Pour migrer avec psql:');
    console.log('   1. Définissez SUPABASE_DB_URL:');
    console.log('      export SUPABASE_DB_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"');
    console.log('   2. Exécutez: npm run db:migrate:bash\n');
} else {
    console.log('ℹ️  psql non installé');
    console.log('   Installez PostgreSQL client pour utiliser cette méthode\n');
}

// Méthode 3: SQL Editor dans Supabase Dashboard
console.log('📝 Méthode manuelle (toujours disponible):');
console.log('   1. Allez dans Supabase Dashboard > SQL Editor');
console.log('   2. Copiez le contenu de supabase-schema.sql');
console.log('   3. Collez et exécutez dans l\'éditeur SQL\n');

// Vérifier si le fichier de schéma existe
const schemaPath = path.join(__dirname, 'supabase-schema.sql');
if (fs.existsSync(schemaPath)) {
    const stats = fs.statSync(schemaPath);
    console.log(`✅ Fichier supabase-schema.sql trouvé (${(stats.size / 1024).toFixed(2)} KB)\n`);
} else {
    console.log('❌ Erreur: supabase-schema.sql introuvable\n');
    process.exit(1);
}

// Si les variables d'environnement sont définies, proposer d'exécuter automatiquement
const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (dbUrl && checkPsql()) {
    console.log('🔍 SUPABASE_DB_URL détecté dans les variables d\'environnement');
    console.log('   Voulez-vous exécuter la migration maintenant? (y/n)');
    console.log('   Répondez "y" pour continuer, ou utilisez: npm run db:migrate:bash\n');
} else if (!dbUrl) {
    console.log('💡 Astuce: Définissez SUPABASE_DB_URL pour une migration automatique\n');
}

console.log('✨ Pour plus d\'informations, consultez:');
console.log('   https://supabase.com/docs/guides/cli\n');
