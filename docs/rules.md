# Development Rules

## Architecture Principles

### Repository Pattern (Required)
- **All API calls** must go through repository classes
- Extend `ApiRepository` base class for consistent error handling
- One repository per feature or domain concept
- Example: `DashboardRepository extends ApiRepository`

### Feature Structure (Mandatory)
Each feature must follow this exact structure:
```
src/features/<feature>/
├── api/              # Repository classes only
├── hooks/            # TanStack Query hooks only
├── components/       # Feature-specific UI components
└── routes/           # Page-level route components
```

### Data Flow (Enforced)
1. **Components** → call hooks
2. **Hooks** → call repository methods
3. **Repository** → handle API communication
4. **Never** bypass this flow

## Code Quality Standards

### TypeScript
- Zero `any` types allowed
- All API responses must be typed
- Export types from repository files
- Use strict mode settings

### File Organization
- One repository per file
- One hook per file
- Export main entity from each file
- Use barrel exports for public APIs

### Naming Conventions
- Repository: `<Feature>Repository` class, `<feature>Repository` instance
- Hooks: `use<Feature><Action>` (e.g., `useDashboardSummary`)
- Types: `<Entity>` for main types, `<Action><Entity>Request/Response` for API

### Import Rules
- Features cannot import from other features
- Use absolute imports with `@/` prefix
- Import UI components from `@/components/ui`
- Import utilities from `@/lib`

## Development Workflow
1. Always run `bun lint` before commits
2. Check TypeScript compilation with `bun type-check`
3. Test the feature manually before committing
4. Update route registration if adding new pages
