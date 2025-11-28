#!/usr/bin/env node

/**
 * Environment variables validation script for Focusly
 * Checks that all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

// Required environment variables
const REQUIRED_ENV_VARS = {
    // Supabase (Public - can be exposed to client)
    'NEXT_PUBLIC_SUPABASE_URL': {
        description: 'Supabase project URL',
        example: 'https://xxxxx.supabase.co',
        public: true
    },
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
        description: 'Supabase anonymous key (public)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        public: true
    },
    
    // Supabase (Private - server only)
    'SUPABASE_SERVICE_ROLE_KEY': {
        description: 'Supabase service role key (NEVER expose to client)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        public: false,
        critical: true
    },
    
    // NextAuth
    'NEXTAUTH_SECRET': {
        description: 'NextAuth.js secret for signing tokens',
        example: 'run: openssl rand -base64 32',
        public: false,
        critical: true
    },
    'NEXTAUTH_URL': {
        description: 'NextAuth.js canonical URL',
        example: 'http://localhost:3000 or https://yourdomain.com',
        public: false
    },
};

// Optional but recommended
const OPTIONAL_ENV_VARS = {
    'NODE_ENV': {
        description: 'Node environment',
        example: 'development | production | test',
        default: 'development'
    },
    'NEXT_PUBLIC_APP_URL': {
        description: 'Public application URL',
        example: 'http://localhost:3000',
        public: true
    },
};

/**
 * Check if a value looks like a placeholder
 */
function isPlaceholder(value) {
    const placeholders = ['your-', 'example', 'change-me', 'xxx', 'TODO', 'REPLACE'];
    return placeholders.some(p => value.toLowerCase().includes(p.toLowerCase()));
}

/**
 * Validate an environment variable
 */
function validateEnvVar(key, config, value) {
    const issues = [];

    if (!value) {
        issues.push({
            type: 'MISSING',
            severity: config.critical ? 'CRITICAL' : 'ERROR',
            key,
            message: `${key} is not set`,
            description: config.description,
            example: config.example
        });
        return issues;
    }

    // Check for placeholders
    if (isPlaceholder(value)) {
        issues.push({
            type: 'PLACEHOLDER',
            severity: 'ERROR',
            key,
            message: `${key} appears to be a placeholder value`,
            value: value.substring(0, 20) + '...',
            example: config.example
        });
    }

    // Check public variables don't have wrong prefix
    if (config.public && !key.startsWith('NEXT_PUBLIC_')) {
        issues.push({
            type: 'NAMING',
            severity: 'WARNING',
            key,
            message: `${key} is public but doesn't start with NEXT_PUBLIC_`,
            suggestion: `Rename to NEXT_PUBLIC_${key}`
        });
    }

    // Check private variables don't have public prefix
    if (!config.public && key.startsWith('NEXT_PUBLIC_')) {
        issues.push({
            type: 'SECURITY',
            severity: 'CRITICAL',
            key,
            message: `${key} is private but has NEXT_PUBLIC_ prefix (will be exposed to client!)`,
            suggestion: `Remove NEXT_PUBLIC_ prefix or move to client-safe variable`
        });
    }

    // Check minimum length for secrets
    if (config.critical && value.length < 32) {
        issues.push({
            type: 'WEAK',
            severity: 'WARNING',
            key,
            message: `${key} appears to be too short for a secure secret`,
            suggestion: 'Use a longer, cryptographically random value'
        });
    }

    return issues;
}

/**
 * Load .env file manually (for validation purposes)
 */
function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return {};
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const env = {};

    lines.forEach(line => {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || !line.trim()) {
            return;
        }

        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            
            env[key] = value;
        }
    });

    return env;
}

/**
 * Main execution
 */
function main() {
    console.log('🔍 Checking environment variables for Focusly...\n');

    // Load .env.local first (takes precedence), then .env
    const envLocalPath = path.join(process.cwd(), '.env.local');
    const envPath = path.join(process.cwd(), '.env');
    
    const envLocal = loadEnvFile(envLocalPath);
    const env = loadEnvFile(envPath);
    
    // Merge with process.env (highest precedence)
    const allEnv = { ...env, ...envLocal, ...process.env };

    console.log('📁 Environment files checked:');
    console.log(`  .env:       ${fs.existsSync(envPath) ? '✅' : '❌'}`);
    console.log(`  .env.local: ${fs.existsSync(envLocalPath) ? '✅' : '❌'}`);
    console.log('');

    const allIssues = [];

    // Check required variables
    console.log('🔒 REQUIRED VARIABLES:');
    Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
        const value = allEnv[key];
        const issues = validateEnvVar(key, config, value);
        
        if (issues.length === 0) {
            console.log(`  ✅ ${key}`);
        } else {
            console.log(`  ❌ ${key}`);
            allIssues.push(...issues);
        }
    });
    console.log('');

    // Check optional variables
    console.log('💡 OPTIONAL VARIABLES:');
    Object.entries(OPTIONAL_ENV_VARS).forEach(([key, config]) => {
        const value = allEnv[key];
        
        if (value) {
            const issues = validateEnvVar(key, config, value);
            if (issues.length === 0) {
                console.log(`  ✅ ${key}`);
            } else {
                console.log(`  ⚠️  ${key}`);
                allIssues.push(...issues);
            }
        } else {
            console.log(`  ⚪ ${key} (not set, using default: ${config.default || 'none'})`);
        }
    });
    console.log('');

    // Report issues
    if (allIssues.length > 0) {
        console.log('\n❌ ISSUES FOUND:\n');

        const critical = allIssues.filter(i => i.severity === 'CRITICAL');
        const errors = allIssues.filter(i => i.severity === 'ERROR');
        const warnings = allIssues.filter(i => i.severity === 'WARNING');

        if (critical.length > 0) {
            console.error('🚨 CRITICAL:\n');
            critical.forEach(issue => {
                console.error(`  ${issue.key}: ${issue.message}`);
                if (issue.suggestion) console.error(`    → ${issue.suggestion}`);
                if (issue.example) console.error(`    Example: ${issue.example}`);
                console.error('');
            });
        }

        if (errors.length > 0) {
            console.error('❌ ERRORS:\n');
            errors.forEach(issue => {
                console.error(`  ${issue.key}: ${issue.message}`);
                if (issue.description) console.error(`    Description: ${issue.description}`);
                if (issue.example) console.error(`    Example: ${issue.example}`);
                console.error('');
            });
        }

        if (warnings.length > 0) {
            console.warn('⚠️  WARNINGS:\n');
            warnings.forEach(issue => {
                console.warn(`  ${issue.key}: ${issue.message}`);
                if (issue.suggestion) console.warn(`    → ${issue.suggestion}`);
                console.warn('');
            });
        }

        console.log('📊 SUMMARY:');
        console.log(`  Critical: ${critical.length}`);
        console.log(`  Errors:   ${errors.length}`);
        console.log(`  Warnings: ${warnings.length}`);
        console.log('');

        if (critical.length > 0 || errors.length > 0) {
            console.error('❌ Environment validation FAILED!');
            console.error('\n💡 TIP: Copy .env.example to .env.local and fill in your values');
            process.exit(1);
        } else {
            console.warn('⚠️  Environment validation PASSED with warnings');
            process.exit(0);
        }
    } else {
        console.log('✅ All environment variables are properly configured!');
        process.exit(0);
    }
}

main();
