# SurveyLabs — Deployment Guide

## Backend → Render.com (Free Tier)

1. Push code to GitHub
2. Go to render.com → New Web Service
3. Connect your GitHub repo
4. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Environment: Node
5. Environment Variables (set in Render dashboard):
   - `JWT_SECRET` = (generate 64-char random string)
   - `NODE_ENV` = production
   - `PORT` = 3001 (Render sets this automatically)
6. SQLite persists on Render's ephemeral disk — for production, migrate to PostgreSQL by swapping the DB driver (schema is compatible)

## Frontend → Vercel (Free Tier)

1. Go to vercel.com → New Project
2. Import GitHub repo
3. Settings:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Environment Variables:
   - `VITE_API_URL` = your Render backend URL (e.g. https://surveylabs-api.onrender.com)
5. Update `frontend/src/api/client.js` baseURL: `import.meta.env.VITE_API_URL`

## CORS Update for Production
In `backend/server.js`, update CORS origin:
```js
origin: process.env.NODE_ENV === 'production' 
  ? 'https://your-app.vercel.app'
  : 'http://localhost:5173'
```

## CI/CD
Both Render and Vercel auto-deploy on push to `main` branch — no additional CI config needed for MVP. For GitHub Actions CI:
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with: { node-version: '18' }
      - run: cd backend && npm install && npm test
```
