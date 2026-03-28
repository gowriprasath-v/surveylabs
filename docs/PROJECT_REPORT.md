# SurveyLabs — Project Report

## 1. Executive Summary
SurveyLabs is a next-generation survey intelligence platform built as a full-stack web application. Unlike traditional survey tools (Google Forms, Typeform), SurveyLabs integrates adaptive conditional logic, conversational survey mode, real-time response analytics, algorithmic quality scoring, and auto-generated insights — all without relying on paid external APIs.

## 2. Problem Statement
Existing survey tools suffer from: static question flow with no branching, boring form-like UX with high abandonment, no real-time feedback for survey creators, inability to detect spam or low-effort responses, and no automatic insight generation from results.

## 3. Objectives
- Build a production-ready survey platform with clean layered architecture
- Implement 5 innovative features using only free, client-side algorithms
- Achieve responsive, accessible UI comparable to commercial SaaS tools
- Deploy to public hosting with CI/CD pipeline

## 4. System Architecture
[Reference docs/diagrams/system-flow.svg]

The system follows a strict layered architecture:
- **Presentation Layer**: React SPA with Vite dev server
- **API Gateway**: Express router with JWT middleware
- **Business Logic**: Service layer (no DB access, no HTTP knowledge)
- **Data Access**: Repository layer (SQL only, no business logic)
- **Persistence**: SQLite with WAL mode and strategic indexes

## 5. Database Design
[Reference docs/DB_SCHEMA.md and docs/diagrams/er-diagram.html]

Five normalized tables: users, surveys, questions, responses, answers. Foreign key relationships enforce referential integrity. JSON columns (options, logic_rules, quality_flags) provide schema flexibility for variable-length data.

## 6. Innovative Features

### 6.1 Adaptive Conditional Logic
Questions dynamically show/hide based on previous answers. Implemented as a client-side engine (useSurveyEngine.js) that evaluates JSON-encoded rules on every answer change. Supports: equals, contains, greater_than, less_than, is_empty conditions.

### 6.2 Conversational Survey Mode
A Typeform-style one-question-at-a-time interface (ConversationalSurveyPage.jsx) with CSS slide animations, progress bar, and keyboard navigation. Activates based on survey.mode field.

### 6.3 Live Response Pulse
ResultsPage polls a dedicated /pulse endpoint every 5 seconds. Velocity computed by comparing last-hour vs prior-hour counts. Recent open-ended answers stream into a live feed with slide-in animation.

### 6.4 Response Quality Scoring
Four algorithmic detectors: speed (< 8s = suspect), straight-lining (all same answers), gibberish text (no vowels), mass skipping (> 70% empty). Scored 0–100, labeled good/suspect/spam.

### 6.5 Auto-Insights Engine
Pure JavaScript statistics on results: majority consensus detection, divided opinion detection, rating sentiment classification, keyword frequency extraction (stopword-filtered), completion rate warnings.

## 7. Security Implementation
[Reference docs/SECURITY.md]

## 8. Testing
Unit tests for quality scoring and insight engine. Manual integration testing via Postman collection.

## 9. Deployment
Backend: Render.com free tier. Frontend: Vercel free tier. CI: GitHub Actions runs tests on every push to main.

## 10. Challenges & Solutions
- **SQLite concurrency**: Solved with WAL mode enabling concurrent reads
- **Real-time without WebSockets**: Solved with 5-second polling + animation on diff
- **Adaptive logic complexity**: Solved with immutable question array + mutable visible-set pattern
- **No paid AI**: Solved with algorithmic pattern matching achieving similar UX value

## 11. Future Enhancements
- PostgreSQL migration for production scale
- WebSocket upgrade for true real-time
- OAuth2 login (Google, GitHub)
- Survey templates library
- Email notification on response milestones
- PDF report export
