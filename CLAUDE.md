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

## Workflow

Every task in this repo **must** follow this workflow — no exceptions:

### 1. Team of Agents (mandatory)

Always use the SDLC agent team (`TeamCreate` with name `sdlc`). Spawn the **Distinguished Architect** first, then all relevant Principal agents for the task. Even small tasks need the Architect + relevant domain agents.

### 2. Plan First (mandatory)

Before any code is written or modified, the team must collaboratively produce a plan:

- The Architect leads the planning, all spawned agents contribute from their domain expertise.
- Present the complete plan to the user in a structured format (numbered steps, files to change, rationale).
- **End the plan with a clear approval prompt**, exactly like this:

  > **Plan ready for review.** Please reply with:
  >
  > - **"go"** or **"approved"** to start execution
  > - Or any comments/changes you'd like before we proceed

- Do **not** start any code changes until the user explicitly approves.
- If the user requests changes to the plan, revise and re-present with the same approval prompt.

### 3. Execute the Plan

Once the user approves, the team executes. Follow the plan — mid-course changes go through the Architect.

- **All execution agents must be spawned with `mode: "acceptEdits"`** so that file edits (Write, Edit) are applied without prompting the user for each change. The user already approved the plan — individual file-level confirmations are unnecessary friction.
- Non-edit actions that are destructive or affect shared systems (git push, deleting files, etc.) still require user confirmation as usual.

### 4. Run All Checks (mandatory — every task)

After execution is complete, **always** run the full check suite:

```bash
npm run format && npm run lint && npm run type-check && npm run test
```

- If any **tests fail**, report to the user:
  - Which test(s) failed (file path + test name)
  - The failure reason (assertion error, type error, runtime error, etc.)
  - A recommendation: whether the **test logic should be updated** (e.g. the test expectations are outdated after the change) or the **code should be fixed** (e.g. the implementation has a bug)
- Do **not** silently skip or ignore failing tests. The task is not complete until all checks pass or the user has reviewed and approved the failing tests.

## Rules

- When adding or modifying tests, update `QA_TEST.md` at the project root to reflect the change (add new entries, update descriptions, or remove deleted tests).
- Prefer editing existing files over creating new ones.
- Use path alias `@/` for imports from `src/`.
- New components go in `src/components/<domain>/` with co-located `__tests__/` directory.
- New hooks go in `src/hooks/`, new types in `src/types/`, new utilities in `src/lib/`.
- API hooks use React Query with the patterns established in `src/hooks/useApi.ts`.
- New competition providers go in `src/providers/<name>/`, implement `CompetitionProvider` from `src/providers/types.ts`, and are registered in `src/providers/registry.ts`.

## Adding a New Competition

There are two provider patterns depending on how the competition API paginates matches:

- **Offset-based** (`paginationMode: 'offset'`) — for tournaments like UEFA Champions League where you fetch pages of matches. Reference: `src/providers/uefa/index.ts`
- **Gameweek-based** (`paginationMode: 'gameweek'`) — for national leagues (Ligue 1, Premier League, etc.) where matches are organized by matchday. Reference: `src/providers/ligue1/index.ts`

### Steps common to both patterns

1. **Create the provider folder**: `src/providers/<name>/`
2. **Define raw API types** (if the API shape differs from canonical types): `src/providers/<name>/types.ts`
3. **Implement the provider**: `src/providers/<name>/index.ts`
   - Export a `CompetitionProvider` object implementing the interface from `src/providers/types.ts`
   - Set `paginationMode` to `'offset'` or `'gameweek'`
   - `fetchMatches`, `fetchMatch`, `fetchMatchLineups` — fetch from the API and map to canonical `Match` / `MatchLineups` types from `src/types/match.ts`
   - Normalize lineup coordinates to the 0–1000 scale inside `fetchMatchLineups`
   - Map all player name variants to the canonical `internationalName` / `clubShirtName` fields
   - `getExternalUrl` — return a link to the match on the competition's website
   - `getSeasons` — return available season years (newest first). The first supported season **must be determined empirically** — probe the API to find the earliest year that returns data (e.g. binary search or backward scan until 404). Do **not** guess or hardcode an arbitrary start year.
   - `getDefaultSeason` — return the current active season
   - `seasonLabel` — format a season year for display (e.g. `"2024/25"`)
4. **Register the provider**: import it in `src/providers/registry.ts` and add one entry to the `providers` object
5. **Add a dev proxy**: add an entry in `vite.config.ts` under `server.proxy` for the new API base URL
6. **No changes needed** to hooks, pages, or components — they are provider-agnostic. The HomePage automatically renders a "Load more" button (offset) or a gameweek selector (gameweek) based on `paginationMode`.

### Additional steps for gameweek-based providers

Gameweek providers must also implement three optional methods:

- `fetchMatchesByGameweek(seasonYear, gameweek, signal)` — fetch all matches for a specific matchday
- `getTotalGameweeks(seasonYear, signal)` — return the total number of matchdays in the season. Derive from the API (e.g. standings endpoint: `(numTeams - 1) * 2` for round-robin leagues). Do **not** hardcode this value — it varies by league, season, and format changes.
- `getDefaultGameweek(seasonYear, signal)` — return the current or latest played matchday. Use a lightweight endpoint (e.g. standings) rather than scanning gameweeks one-by-one.

The base `fetchMatches` method can simply delegate to `fetchMatchesByGameweek` with gameweek 1.

### Additional steps for providers without coordinates

If the API doesn't provide pitch coordinates but gives a formation string (e.g. `"433"`) and a position index per player (e.g. `formationPlace` 1-11):

- Create a `src/providers/<name>/formations.ts` file that maps `(formation, positionIndex)` → `{ x, y }` on the 0–1000 scale. See `src/providers/ligue1/formations.ts` as reference — it handles 18+ formations with a dynamic fallback for unknown ones.
- Positions are numbered sequentially: 1 = GK, then defenders L→R, midfielders L→R, forwards L→R.

### Match ID types

Match IDs can be `number` (UEFA) or `string` (Ligue 1). The canonical `Match.id` and `MatchLineups.matchId` types are `number | string`. All hooks, pages, and components handle both.
