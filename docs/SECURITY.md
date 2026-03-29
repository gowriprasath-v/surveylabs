# SurveyLabs — Security Implementation

## Server-Side Validation (middleware/validate.js)
- All POST/PUT body fields validated before reaching controllers
- String fields: trimmed, length-checked
- Survey title: 3–200 chars
- Question text: 1–500 chars
- Password: minimum 6 chars (bcrypt hash stored, never plaintext)

## Authentication
- JWT signed with HS256, 7-day expiry
- Secret loaded from .env (never hardcoded)
- Bearer token required on all /api/admin/* routes
- Token validation failure returns 401, not 500

## HTTP Security Headers (helmet.js)
```js
import helmet from 'helmet';
app.use(helmet());          // Sets X-Content-Type-Options, X-Frame-Options, etc.
app.use(helmet.hsts(...));  // Strict-Transport-Security in production
```

## CORS
- Whitelist: http://localhost:5173 (dev), production URL (prod)
- Credentials: false (token in header, not cookie)

## Input Sanitization
- express-validator or manual trim + type-check on all inputs
- SQL injection: prevented by parameterized queries (never string concatenation)
- XSS: React escapes all rendered values by default

## Error Logging
- All errors caught in errorHandler middleware
- Logged to console with timestamp: `[2025-01-15T14:32:00Z] ERROR: ...`
- Stack traces only in NODE_ENV=development
- User never sees internal error details in production
