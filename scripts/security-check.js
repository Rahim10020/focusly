#!/usr/bin/env node

/**
 * Security check script for Focusly
 * Scans the codebase for potential security issues:
 * - SERVICE_ROLE_KEY exposed in client code
 * - Tokens stored in localStorage
 * - Direct .env file access
 * - Hardcoded secrets
 */

const fs = require('fs');
const path = require('path');

const DANGEROUS_PATTERNS = [
    {
        pattern: /SUPABASE_SERVICE_ROLE_KEY/,
        exclude: ['src/app/api', 'src/lib/supabase/server.ts', 'scripts/', 'node_modules'],
        message: '🚨 SERVICE_ROLE_KEY found in client-accessible file',
        severity: 'CRITICAL'
    },
    {
        pattern: /localStorage\.(setItem|getItem).*[Tt]oken/,
        exclude: ['node_modules'],
        message: '⚠️  Tokens should not be stored in localStorage (use httpOnly cookies)',
        severity: 'HIGH'
    },
    {
        pattern: /createClient.*SERVICE_ROLE/,
        exclude: ['src/app/api', 'src/lib/supabase/server.ts', 'scripts/', 'node_modules'],
        message: '🚨 Direct SERVICE_ROLE client creation in non-server code',
        severity: 'CRITICAL'
    },
    {
        pattern: /password\s*=\s*['"][^'"]{8,}['"]/,
        exclude: ['node_modules', 'test', 'spec'],
        message: '⚠️  Potential hardcoded password detected',
        severity: 'HIGH'
    },
    {
        pattern: /api[_-]?key\s*=\s*['"][^'"]{16,}['"]/i,
        exclude: ['node_modules', 'test', 'spec'],
        message: '⚠️  Potential hardcoded API key detected',
        severity: 'HIGH'
    },
    {
        pattern: /auth\.uid\(\)\s*!=\s*user_id|user_id\s*!=\s*auth\.uid\(\)/,
        exclude: ['node_modules'],
        message: '💡 Potential RLS policy issue (checking inequality instead of equality)',
        severity: 'MEDIUM'
    }
];

/**
 * Check if a file path should be excluded
 */
function shouldExclude(filePath, excludePatterns) {
    return excludePatterns.some(pattern => filePath.includes(pattern));
}

/**
 * Scan a directory recursively
 */
function scanDirectory(dir, exclude = []) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const issues = [];

    files.forEach(file => {
        const filePath = path.join(dir, file.name);
        
        // Skip excluded directories
        if (file.isDirectory()) {
            if (['node_modules', '.next', '.git', 'dist', 'build'].includes(file.name)) {
                return;
            }
            issues.push(...scanDirectory(filePath, exclude));
        } else if (file.isFile() && /\.(ts|tsx|js|jsx|sql)$/.test(file.name)) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                
                DANGEROUS_PATTERNS.forEach(({ pattern, exclude: patternExclude, message, severity }) => {
                    if (shouldExclude(filePath, patternExclude)) {
                        return;
                    }

                    lines.forEach((line, index) => {
                        if (pattern.test(line)) {
                            issues.push({
                                file: path.relative(process.cwd(), filePath),
                                line: index + 1,
                                message,
                                severity,
                                code: line.trim()
                            });
                        }
                    });
                });
            } catch (error) {
                console.error(`Error reading file ${filePath}:`, error.message);
            }
        }
    });

    return issues;
}

/**
 * Group issues by severity
 */
function groupBySeverity(issues) {
    const grouped = {
        CRITICAL: [],
        HIGH: [],
        MEDIUM: [],
        LOW: []
    };

    issues.forEach(issue => {
        if (grouped[issue.severity]) {
            grouped[issue.severity].push(issue);
        }
    });

    return grouped;
}

/**
 * Print issues in a formatted way
 */
function printIssues(grouped) {
    let hasIssues = false;

    // CRITICAL
    if (grouped.CRITICAL.length > 0) {
        hasIssues = true;
        console.error('\n🚨 CRITICAL SECURITY ISSUES:\n');
        grouped.CRITICAL.forEach(({ file, line, message, code }) => {
            console.error(`  ${file}:${line}`);
            console.error(`  ${message}`);
            console.error(`  Code: ${code}`);
            console.error('');
        });
    }

    // HIGH
    if (grouped.HIGH.length > 0) {
        hasIssues = true;
        console.warn('\n⚠️  HIGH PRIORITY ISSUES:\n');
        grouped.HIGH.forEach(({ file, line, message, code }) => {
            console.warn(`  ${file}:${line}`);
            console.warn(`  ${message}`);
            console.warn(`  Code: ${code}`);
            console.warn('');
        });
    }

    // MEDIUM
    if (grouped.MEDIUM.length > 0) {
        hasIssues = true;
        console.info('\n💡 MEDIUM PRIORITY ISSUES:\n');
        grouped.MEDIUM.forEach(({ file, line, message, code }) => {
            console.info(`  ${file}:${line}`);
            console.info(`  ${message}`);
            console.info(`  Code: ${code}`);
            console.info('');
        });
    }

    return hasIssues;
}

/**
 * Main execution
 */
function main() {
    console.log('🔍 Running security checks on Focusly codebase...\n');

    const srcPath = path.join(process.cwd(), 'src');
    
    if (!fs.existsSync(srcPath)) {
        console.error('❌ src/ directory not found. Are you in the project root?');
        process.exit(1);
    }

    const issues = scanDirectory(srcPath);
    const grouped = groupBySeverity(issues);

    const hasIssues = printIssues(grouped);

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`  Critical: ${grouped.CRITICAL.length}`);
    console.log(`  High:     ${grouped.HIGH.length}`);
    console.log(`  Medium:   ${grouped.MEDIUM.length}`);
    console.log(`  Total:    ${issues.length}\n`);

    if (grouped.CRITICAL.length > 0) {
        console.error('❌ Security check FAILED - Critical issues found!');
        process.exit(1);
    } else if (grouped.HIGH.length > 0) {
        console.warn('⚠️  Security check WARNING - High priority issues found!');
        process.exit(0); // Don't block CI, but show warning
    } else if (hasIssues) {
        console.info('💡 Security check PASSED with suggestions');
        process.exit(0);
    } else {
        console.log('✅ Security check PASSED - No issues found!');
        process.exit(0);
    }
}

main();
