#!/usr/bin/env node

/**
 * Environment variables validation script
 * Checks that required environment variables are set based on config
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
/* eslint-enable @typescript-eslint/no-require-imports */

const DEFAULT_CONFIG = {
    required: {},
    optional: {},
    envFiles: ['.env', '.env.local']
};

function parseArgs() {
    const args = process.argv.slice(2);
    let configPath;

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '--config') {
            configPath = args[i + 1];
            i += 1;
            continue;
        }
        if (!configPath) {
            configPath = arg;
        }
    }

    return { configPath };
}

function loadConfig() {
    const { configPath } = parseArgs();
    const candidates = [
        configPath,
        path.join(process.cwd(), 'env-check.config.json'),
        path.join(process.cwd(), 'scripts', 'env-check.config.json')
    ].filter(Boolean);

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            const raw = fs.readFileSync(candidate, 'utf-8');
            return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
        }
    }

    return DEFAULT_CONFIG;
}

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
    console.log('🔍 Checking environment variables...\n');

    const config = loadConfig();
    const requiredEnvVars = config.required || {};
    const optionalEnvVars = config.optional || {};
    const envFiles = Array.isArray(config.envFiles) && config.envFiles.length > 0
        ? config.envFiles
        : DEFAULT_CONFIG.envFiles;

    const loadedEnvFiles = envFiles.map((fileName) => {
        const envPath = path.join(process.cwd(), fileName);
        return {
            fileName,
            envPath,
            exists: fs.existsSync(envPath),
            values: loadEnvFile(envPath)
        };
    });

    const mergedEnv = loadedEnvFiles.reduce((acc, entry) => ({
        ...acc,
        ...entry.values
    }), {});

    const allEnv = { ...mergedEnv, ...process.env };

    console.log('📁 Environment files checked:');
    loadedEnvFiles.forEach((entry) => {
        console.log(`  ${entry.fileName}: ${entry.exists ? 'good' : 'no'}`);
    });
    console.log('');

    const allIssues = [];

    // Check required variables
    console.log('🔒 REQUIRED VARIABLES:');
    if (Object.keys(requiredEnvVars).length === 0) {
        console.log('  ⚪ No required variables configured');
    }

    Object.entries(requiredEnvVars).forEach(([key, config]) => {
        const value = allEnv[key];
        const issues = validateEnvVar(key, config, value);
        
        if (issues.length === 0) {
            console.log(`  good ${key}`);
        } else {
            console.log(`  no ${key}`);
            allIssues.push(...issues);
        }
    });
    console.log('');

    // Check optional variables
    console.log('💡 OPTIONAL VARIABLES:');
    if (Object.keys(optionalEnvVars).length === 0) {
        console.log('  ⚪ No optional variables configured');
    }

    Object.entries(optionalEnvVars).forEach(([key, config]) => {
        const value = allEnv[key];
        
        if (value) {
            const issues = validateEnvVar(key, config, value);
            if (issues.length === 0) {
                console.log(`  good ${key}`);
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
        console.log('\nno ISSUES FOUND:\n');

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
            console.error('no ERRORS:\n');
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
            console.error('no Environment validation FAILED!');
            console.error('\n💡 TIP: Copy .env.example to .env.local and fill in your values');
            process.exit(1);
        } else {
            console.warn('⚠️  Environment validation PASSED with warnings');
            process.exit(0);
        }
    } else {
        console.log('good All environment variables are properly configured!');
        process.exit(0);
    }
}

main();
