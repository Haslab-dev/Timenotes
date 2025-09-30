# Vibe Code Clean Architecture Template

## Overview
A minimal React starter template featuring a single dashboard to demonstrate clean architecture patterns. Built with React 19 + TypeScript + Vite and designed for feature-driven development with centralized API management.

**Key Features:**
- 🏗️ **Repository Pattern** - Centralized API access through repository classes
- 📊 **Single Dashboard Feature** - Complete example with data fetching and UI
- 🎯 **Clean Architecture** - Clear separation of concerns and dependencies
- 🔧 **Modern Stack** - React 19, TypeScript, Vite, TanStack Query, React Router
- 🎨 **UI Ready** - Tailwind CSS 4 with shadcn/ui components

## Quick Start
```bash
bun install
bun dev
```

### Quality Checks
```bash
bun lint              # ESLint + TypeScript checks
bun type-check         # TypeScript compilation only
```

## Template Structure
```
src/
  app/
    layouts/           # App shell and navigation
    providers/         # React context providers
    router/            # Route definitions
  components/
    ui/                # Reusable UI components (shadcn/ui)
  features/
    dashboard/         # Example feature demonstrating patterns
      api/             # Repository classes for data access
      hooks/           # TanStack Query hooks
      components/      # Feature-specific components
      routes/          # Page components
  lib/
    api/               # Base repository class and utilities
```

## Architecture Patterns

### Repository Pattern
All API calls go through repository classes extending `ApiRepository`:
```typescript
class DashboardRepository extends ApiRepository {
  async getSummary(): Promise<DashboardSummary> {
    // API implementation
  }
}
```

### Data Flow
1. **Page Components** → call custom hooks
2. **Custom Hooks** → use TanStack Query with repository methods
3. **Repository Classes** → handle API communication and data transformation

### Adding Features
1. Study the dashboard feature structure
2. Create new feature folder: `src/features/<feature>/`
3. Follow the established patterns for API, hooks, components, and routes
4. Register routes in `src/app/router/app-router.tsx`

## Documentation
- [`docs/agents.md`](docs/agents.md) - Detailed workflow guide for AI agents and developers
- [`docs/rules.md`](docs/rules.md) - Development rules and architectural constraints
