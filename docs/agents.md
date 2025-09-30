# Agents Playbook

## Purpose
This template provides a clean, minimal React starter with a single dashboard feature to demonstrate the architectural patterns. It's designed to help AI agents and developers understand the structure before building additional features.

## Template Overview
- **Single Feature**: Dashboard feature with summary cards demonstrating data fetching patterns
- **Centralized API**: All API calls go through repository classes extending `ApiRepository`
- **Clean Architecture**: Feature-driven development with clear separation of concerns

## Workflow for Adding New Features
1. **Understand the Pattern**: Study the dashboard feature structure first
2. **Create Feature Structure**: Follow the pattern: `src/features/<feature>/`
   - `api/` - Repository classes for data access
   - `hooks/` - TanStack Query hooks for data fetching
   - `components/` - Feature-specific UI components
   - `routes/` - Page-level components
3. **API Repository Pattern**: Extend `ApiRepository` base class for consistent error handling and loading states
4. **Register Routes**: Add new routes in `src/app/router/app-router.tsx`
5. **Update Navigation**: Add nav items in `src/app/layouts/main-layout.tsx`

## Coding Principles
- **Repository Pattern**: All data access through repository classes
- **Feature Encapsulation**: Keep feature code self-contained
- **Consistent Hooks**: Use TanStack Query for all async operations
- **Type Safety**: Maintain strict TypeScript throughout
- **UI Consistency**: Use shadcn/ui components for consistent design

## Quality Gates
- Run `bun lint` before committing
- Ensure TypeScript compilation passes
- Follow established folder structure
- Document API contracts and types
