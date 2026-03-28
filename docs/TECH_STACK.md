# SurveyLabs — Tech Stack Justification

## Selected Stack: MERN-variant (Node/Express + React + SQLite)

### Why Node.js + Express (Backend)
- Non-blocking I/O ideal for concurrent survey submissions
- Single language across stack (JavaScript) reduces context switching
- Express middleware pattern maps cleanly to our layered architecture:
  Routes → Controllers → Services → Repositories
- Lightweight enough for SQLite in development, portable to PostgreSQL in production

### Why React (Frontend)
- Component-driven: survey builder, question renderer, charts are all reusable atoms
- Hooks-based state (useState, useReducer, useContext) sufficient for MVP — no Redux overhead
- Vite dev server for instant HMR during rapid iteration

### Why SQLite (Database)
- Zero-config for local dev and evaluation environments
- WAL mode enables concurrent reads without locking
- Schema is portable: same SQL runs on PostgreSQL with minimal changes
- Sufficient for thousands of survey responses in evaluation context

### Why JWT (Auth)
- Stateless: no server-side session store needed
- Bearer token in Authorization header works uniformly across REST endpoints
- 7-day expiry with refresh path ready to add in Phase 3

## System Flow Diagram
[See docs/diagrams/system-flow.svg]
