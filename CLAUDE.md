# CLAUDE.md

## Project

Multi-competition football lineup viewer — React 19 + TypeScript 5.9 + Vite 8 + Tailwind CSS 4 + Headless UI + TanStack React Query. Supports multiple competition APIs via a provider/adapter pattern.

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
├── providers/           # Competition providers (adapter pattern)
│   ├── types.ts         # CompetitionProvider interface
│   ├── registry.ts      # Provider registry
│   └── uefa/            # UEFA Champions League provider
├── contexts/            # LayoutContext (displayMode, season, provider selection)
├── hooks/               # useApi (provider-agnostic React Query hooks), useCountryFlag
├── lib/                 # Pure utilities (formatters, lineupCoordinates, utils)
├── types/               # TypeScript interfaces (match.ts, common.ts)
├── pages/               # HomePage, MatchDetailPage
├── test/                # Vitest setup + MSW server/handlers/fixtures
└── App.tsx              # Router & provider setup
```

## Architecture

- **Routing**: React Router DOM v7 — `/` (HomePage) and `/match/:id` (MatchDetailPage)
- **Provider pattern**: Each competition API has a provider in `src/providers/` implementing `CompetitionProvider` interface. Providers handle fetching and mapping raw API responses to canonical types.
- **Data fetching**: Provider-agnostic React Query hooks in `src/hooks/useApi.ts` — `useMatches()`, `useMatch()`, `useMatchLineups()`, `useCompetition()`. The active provider is selected via `LayoutContext`.
- **API proxy**: Dev server proxies `/uefa-api/*` to UEFA match API. Each new provider adds its own proxy entry in `vite.config.ts`.
- **State**: React Query for server state; React Context (`LayoutContext`) for UI state (season, display mode, selected provider)
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

**Pre-commit hook** (Husky + lint-staged): runs ESLint and Prettier on staged `.ts`/`.tsx` files before every commit. Blocks the commit if there are lint errors or formatting issues.

**GitHub Actions CI** (`.github/workflows/ci.yml`) triggers on push/PR to `main` and `develop`:

1. **CI job** (Node 22): install → type-check → lint → format:check → test
2. **Build job**: runs only after CI passes

## Rules

- When adding or modifying tests, update `QA_TEST.md` at the project root to reflect the change (add new entries, update descriptions, or remove deleted tests).
- Run `npm run format`, `npm run lint`, `npm run type-check`, and `npm run test` before considering work complete.
- Prefer editing existing files over creating new ones.
- Use path alias `@/` for imports from `src/`.
- New components go in `src/components/<domain>/` with co-located `__tests__/` directory.
- New hooks go in `src/hooks/`, new types in `src/types/`, new utilities in `src/lib/`.
- API hooks use React Query with the patterns established in `src/hooks/useApi.ts`.
- New competition providers go in `src/providers/<name>/`, implement `CompetitionProvider` from `src/providers/types.ts`, and are registered in `src/providers/registry.ts`.

## Adding a New Competition

1. **Create the provider folder**: `src/providers/<name>/`
2. **Define raw API types** (if the API shape differs from canonical types): `src/providers/<name>/types.ts`
3. **Implement the provider**: `src/providers/<name>/index.ts`
   - Export a `CompetitionProvider` object (see `src/providers/uefa/index.ts` as reference)
   - `fetchMatches`, `fetchMatch`, `fetchMatchLineups` — fetch from the API and map the response to canonical `Match` / `MatchLineups` types from `src/types/match.ts`
   - Normalize coordinates to the 0–1000 scale inside `fetchMatchLineups`
   - Map all player name variants (`name`, `fullName`, `full_name`, etc.) to the canonical `internationalName` / `clubShirtName` fields
   - `getExternalUrl` — return a link to the match on the competition's website
   - `getSeasons` — return available season years (newest first)
   - `seasonLabel` — format a season year for display (e.g. `"2024/25"`)
4. **Register the provider**: import it in `src/providers/registry.ts` and add one entry to the `providers` object
5. **Add a dev proxy**: add an entry in `vite.config.ts` under `server.proxy` for the new API base URL
6. **No changes needed** to hooks, pages, or components — they are provider-agnostic
