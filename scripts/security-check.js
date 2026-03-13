#!/usr/bin/env node

/**
 * Security check script
 * Scans the codebase for potential security issues based on config
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
/* eslint-enable @typescript-eslint/no-require-imports */

const DEFAULT_CONFIG = {
    includeExtensions: ['.ts', '.tsx', '.js', '.jsx', '.sql'],
    excludeDirs: ['node_modules', '.next', '.git', 'dist', 'build', 'coverage'],
    patterns: [
        {
            pattern: /localStorage\.(setItem|getItem).*token/i,
            exclude: ['node_modules'],
            message: '⚠️  Tokens should not be stored in localStorage (use httpOnly cookies)',
            severity: 'HIGH'
        },
        {
            pattern: /sessionStorage\.(setItem|getItem).*token/i,
            exclude: ['node_modules'],
            message: '⚠️  Tokens should not be stored in sessionStorage',
            severity: 'HIGH'
        },
        {
            pattern: /password\s*=\s*['"][^'"]{8,}['"]/i,
            exclude: ['node_modules', 'test', 'spec'],
            message: '⚠️  Potential hardcoded password detected',
            severity: 'HIGH'
        },
        {
            pattern: /(api[_-]?key|secret|token)\s*=\s*['"][^'"]{16,}['"]/i,
            exclude: ['node_modules', 'test', 'spec'],
            message: '⚠️  Potential hardcoded secret detected',
            severity: 'HIGH'
        },
        {
            pattern: /AKIA[0-9A-Z]{16}/,
            exclude: ['node_modules', 'test', 'spec'],
            message: '🚨 Potential AWS access key detected',
            severity: 'CRITICAL'
        },
        {
            pattern: /-----BEGIN (?:RSA|DSA|EC|OPENSSH) PRIVATE KEY-----/,
            exclude: ['node_modules', 'test', 'spec'],
            message: '🚨 Private key material detected in repository',
            severity: 'CRITICAL'
        },
        {
            pattern: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/,
            exclude: ['node_modules', 'test', 'spec'],
            message: '⚠️  Possible JWT token detected',
            severity: 'MEDIUM'
        }
    ]
};

function parseArgs() {
    const args = process.argv.slice(2);
    let rootDir;
    let configPath;

    for (let i = 0; i < args.length; i += 1) {
        const arg = args[i];
        if (arg === '--root') {
            rootDir = args[i + 1];
            i += 1;
            continue;
        }
        if (arg === '--config') {
            configPath = args[i + 1];
            i += 1;
            continue;
        }

        if (!rootDir && fs.existsSync(arg) && fs.statSync(arg).isDirectory()) {
            rootDir = arg;
            continue;
        }

        if (!configPath) {
            configPath = arg;
        }
    }

    return { rootDir, configPath };
}

function loadConfig() {
    const { configPath, rootDir } = parseArgs();
    const candidates = [
        configPath,
        path.join(process.cwd(), 'security-check.config.json'),
        path.join(process.cwd(), 'scripts', 'security-check.config.json')
    ].filter(Boolean);

    const normalizePatterns = (patterns) => {
        if (!Array.isArray(patterns)) {
            return DEFAULT_CONFIG.patterns;
        }

        return patterns.map((entry) => {
            if (entry && typeof entry.pattern === 'string') {
                return {
                    ...entry,
                    pattern: new RegExp(entry.pattern, entry.flags || undefined)
                };
            }
            return entry;
        });
    };

    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            const raw = fs.readFileSync(candidate, 'utf-8');
            const parsed = JSON.parse(raw);
            return {
                ...DEFAULT_CONFIG,
                ...parsed,
                patterns: normalizePatterns(parsed.patterns || DEFAULT_CONFIG.patterns),
                rootDir: rootDir || parsed.rootDir
            };
        }
    }

    return {
        ...DEFAULT_CONFIG,
        patterns: normalizePatterns(DEFAULT_CONFIG.patterns),
        rootDir
    };
}

/**
 * Check if a file path should be excluded
 */
function shouldExclude(filePath, excludePatterns) {
    if (!excludePatterns || excludePatterns.length === 0) {
        return false;
    }
    return excludePatterns.some(pattern => filePath.includes(pattern));
}

/**
 * Scan a directory recursively
 */
function scanDirectory(dir, config) {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    const issues = [];

    files.forEach(file => {
        const filePath = path.join(dir, file.name);
        
        // Skip excluded directories
        if (file.isDirectory()) {
            if (config.excludeDirs.includes(file.name)) {
                return;
            }
            issues.push(...scanDirectory(filePath, config));
        } else if (file.isFile() && config.includeExtensions.some(ext => file.name.endsWith(ext))) {
            try {
                const content = fs.readFileSync(filePath, 'utf-8');
                const lines = content.split('\n');
                
                config.patterns.forEach(({ pattern, exclude: patternExclude, message, severity }) => {
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
    console.log('🔍 Running security checks...\n');

    const config = loadConfig();
    const rootDir = config.rootDir
        ? path.resolve(process.cwd(), config.rootDir)
        : (fs.existsSync(path.join(process.cwd(), 'src'))
            ? path.join(process.cwd(), 'src')
            : process.cwd());

    if (!fs.existsSync(rootDir)) {
        console.error(' Scan directory not found. Are you in the project root?');
        process.exit(1);
    }

    const issues = scanDirectory(rootDir, config);
    const grouped = groupBySeverity(issues);

    const hasIssues = printIssues(grouped);

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`  Critical: ${grouped.CRITICAL.length}`);
    console.log(`  High:     ${grouped.HIGH.length}`);
    console.log(`  Medium:   ${grouped.MEDIUM.length}`);
    console.log(`  Total:    ${issues.length}\n`);

    if (grouped.CRITICAL.length > 0) {
        console.error(' Security check FAILED - Critical issues found!');
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
