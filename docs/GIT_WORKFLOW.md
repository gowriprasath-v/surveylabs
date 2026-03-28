# SurveyLabs — Git Workflow

## Branch Naming
| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code only |
| `develop` | Integration branch, all features merge here first |
| `feature/backend-api` | Backend routes, controllers, services |
| `feature/frontend-ui` | React components and pages |
| `feature/auth` | JWT authentication |
| `feature/adaptive-logic` | Conditional question branching |
| `feature/conversational-mode` | Chat-style survey UI |
| `feature/live-pulse` | Real-time polling dashboard |
| `feature/quality-scoring` | Response spam detection |
| `feature/insights` | Auto-generated analytics |
| `hotfix/xyz` | Emergency production fixes |

## Workflow
1. Branch from `develop`: `git checkout -b feature/my-feature develop`
2. Commit with conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
3. Push and open PR to `develop`
4. After review, merge to `develop`
5. When release-ready, merge `develop` → `main` with version tag

## Commit Message Convention
```
feat(auth): add JWT refresh token endpoint
fix(surveys): handle empty questions array gracefully
docs(readme): add deployment instructions
refactor(db): extract query logic to repository layer
```
