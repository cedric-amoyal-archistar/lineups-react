# CLAUDE.md

## Project

UEFA Champions League Lineup Viewer — React 19 + TypeScript 5.9 + Vite 8 + Tailwind CSS 4 + Headless UI + TanStack React Query.

## Dev Commands

- `npm run dev` — start dev server (proxies `/uefa-api` to `https://match.uefa.com`)
- `npm run build` — TypeScript check + Vite production build
- `npm run preview` — preview production build locally
- `npm run test` — run tests (vitest, single run)
- `npm run test:watch` — tests in watch mode
- `npm run test:coverage` — tests with v8 coverage
- `npm run type-check` — `tsc --noEmit`
- `npm run lint` — ESLint
- `npm run lint:fix` — ESLint with auto-fix
- `npm run format` — Prettier write
- `npm run format:check` — Prettier check

## Project Structure

```
src/
├── components/          # UI components organized by domain
│   ├── layout/          # DefaultLayout
│   ├── match/           # MatchCard, MatchEvents, PenaltyShootout
│   └── lineup/          # PitchView, TeamHalf, PlayerNode, BenchList
├── contexts/            # LayoutContext (displayMode, season, UI toggles)
├── hooks/               # useUefaApi (React Query), useCountryFlag
├── lib/                 # Pure utilities (formatters, lineupCoordinates, utils)
├── types/               # TypeScript interfaces (match.ts, common.ts)
├── pages/               # HomePage, MatchDetailPage
├── test/                # Vitest setup + MSW server/handlers/fixtures
└── App.tsx              # Router & provider setup
```

## Architecture

- **Routing**: React Router DOM v7 — `/` (HomePage) and `/match/:id` (MatchDetailPage)
- **Data fetching**: TanStack React Query hooks in `src/hooks/useUefaApi.ts` — `useMatches()`, `useMatch()`, `useMatchLineups()`. Default staleTime 5min, retry 1.
- **API proxy**: Dev server proxies `/uefa-api/*` to UEFA match API, stripping the prefix
- **State**: React Query for server state; React Context (`LayoutContext`) for UI state (season, display mode)
- **Styling**: Tailwind CSS with OKLCH color variables, `cn()` utility (clsx + tailwind-merge)
- **Components**: Headless UI for accessible primitives, lucide-react for icons, class-variance-authority for variants

## Code Style

- **No semicolons**, single quotes, trailing commas, 2-space indent, 100 char line width (see `.prettierrc`)
- **Consistent type imports**: `import type { Foo }` enforced by ESLint
- **No `any`**: `@typescript-eslint/no-explicit-any: error` (relaxed in test files)
- **No console.log**: only `console.warn` and `console.error` allowed
- **Unused vars**: underscore-prefix allowed (`_unused`)

## Testing

- **Runner**: Vitest with jsdom environment
- **Libraries**: @testing-library/react, @testing-library/jest-dom, @testing-library/user-event
- **API mocking**: MSW (Mock Service Worker) — handlers in `src/test/msw/handlers.ts`, fixtures in `src/test/msw/fixtures.ts`
- **Setup**: `src/test/setup.ts` starts MSW server, resets handlers between tests
- **Pattern**: Tests co-located in `__tests__/` subdirectories or alongside source files
- **Full inventory**: See `QA_TEST.md` at project root

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) triggers on push/PR to `main` and `develop`:
1. **CI job** (Node 22): install → type-check → lint → format:check → test
2. **Build job**: runs only after CI passes

## Rules

- When adding or modifying tests, update `QA_TEST.md` at the project root to reflect the change (add new entries, update descriptions, or remove deleted tests).
- Run `npm run type-check` and `npm run test` before considering work complete.
- Prefer editing existing files over creating new ones.
- Use path alias `@/` for imports from `src/`.
- New components go in `src/components/<domain>/` with co-located `__tests__/` directory.
- New hooks go in `src/hooks/`, new types in `src/types/`, new utilities in `src/lib/`.
- API hooks use React Query with the patterns established in `useUefaApi.ts`.
