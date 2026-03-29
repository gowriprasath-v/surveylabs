# SurveyLabs

A next-generation survey intelligence platform with adaptive logic, conversational mode, live pulse analytics, response quality scoring, and auto-generated insights.

## Tech Stack
- **Backend**: Node.js 18+, Express 4, SQLite3 (better-sqlite3), JWT
- **Frontend**: React 18, Vite 5, Tailwind CSS 3

## Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/surveylabs.git
cd surveylabs
```

### 2. Backend setup
```bash
cd backend
cp .env.example .env        # Fill in JWT_SECRET
npm install
npm run dev                  # Starts on http://localhost:3001
```

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev                  # Starts on http://localhost:5173
```

## Default Credentials
- Username: `admin`
- Password: `admin123`

## Project Structure
```
surveylabs/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── middleware/
│   ├── database.js
│   ├── migrations.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── api/
│       └── utils/
└── docs/
    ├── TECH_STACK.md
    ├── DB_SCHEMA.md
    ├── WIREFRAMES.md
    └── diagrams/
```

## Branching Strategy
- `main` — production-ready, protected
- `develop` — integration branch
- `feature/xyz` — feature branches, merge to develop via PR
- `hotfix/xyz` — urgent patches, merge to both main and develop

## API Documentation
See `docs/API.md` or import `docs/postman_collection.json` into Postman.

## Deployment
See Phase 3 deployment notes in `docs/DEPLOYMENT.md`.
