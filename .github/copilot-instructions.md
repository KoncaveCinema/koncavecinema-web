# GitHub Copilot Custom Instructions: Koncave Cinema Web

## Mandatory Development Rules

1. **Strict Approval Workflow**:
   - Initial review is strictly read-only.
   - Propose code changes first (inline for minor fixes, `implementation_plan.md` for refactoring or multi-file changes).
   - Wait for explicit user confirmation before writing files or running terminal scripts.

2. **Windows Shell Rule**:
   - Run terminal commands directly; no wrapper is needed.

3. **Git Standards**:
   - Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).
   - Each line must remain strictly under 100 characters.
   - Focus on functional system changes, avoiding code-level implementation details.
   - Only generate commits when explicitly requested.

4. **Architecture & Standards**:
   - Next.js 16 App Router, React 19, TypeScript strict mode.
   - Tailwind CSS v4 with design tokens in `src/app/globals.css`; shadcn/ui primitives in `src/components/ui`.
   - axios client in `src/lib/api/` for every call to `koncavecinema-api`; TanStack Query for server state.
   - React Hook Form + Zod for forms; Zustand for client state; Motion for animation.
