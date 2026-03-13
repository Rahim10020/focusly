# Scripts usage

These scripts are generic and configurable. Copy the files into any project and adjust the config JSON as needed.

## check-env.js

Validate environment variables based on a config file.

Run:

```bash
node scripts/check-env.js
```

Optional config path:

```bash
node scripts/check-env.js --config ./env-check.config.json
```

Config file (env-check.config.json):

```json
{
  "required": {
    "DATABASE_URL": {
      "description": "Database connection string",
      "example": "postgres://user:pass@host:5432/db",
      "public": false,
      "critical": true
    },
    "NEXT_PUBLIC_API_URL": {
      "description": "Public API base URL",
      "example": "https://api.example.com",
      "public": true
    }
  },
  "optional": {
    "NODE_ENV": {
      "description": "Node environment",
      "example": "development | production | test",
      "default": "development"
    }
  },
  "envFiles": [".env", ".env.local"]
}
```

## security-check.js

Scan the codebase for common security red flags. By default it scans `src` if it exists, otherwise the project root.

Run:

```bash
node scripts/security-check.js
```

Optional root and config:

```bash
node scripts/security-check.js --root src --config ./security-check.config.json
```

Config file (security-check.config.json):

```json
{
  "includeExtensions": [".ts", ".tsx", ".js", ".jsx"],
  "excludeDirs": ["node_modules", ".git", "dist", "build"],
  "patterns": [
    {
      "pattern": "(api[_-]?key|secret|token)\\s*=\\s*['\"]{1}[^'\"]{16,}['\"]{1}",
      "flags": "i",
      "exclude": ["test", "spec"],
      "message": "Potential hardcoded secret detected",
      "severity": "HIGH"
    }
  ]
}
```

Notes:

- Regex patterns in JSON must be strings; the script will convert them to regular expressions.
- Optional `flags` can be provided (e.g. `"i"` for case-insensitive).
- Severity values: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
