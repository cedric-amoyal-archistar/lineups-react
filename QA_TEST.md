# QA & Test Documentation

## Test Stack

| Library                     | Version | Purpose                                  |
| --------------------------- | ------- | ---------------------------------------- |
| Vitest                      | 4.1.2   | Test runner and assertion framework      |
| @testing-library/react      | 16.3.2  | Component rendering and DOM queries      |
| @testing-library/jest-dom   | 6.9.1   | DOM matchers (`toBeInTheDocument`, etc.) |
| @testing-library/user-event | 14.6.1  | User interaction simulation              |
| MSW                         | 2.12.14 | HTTP request interception and mocking    |
| jsdom                       | 29.0.1  | DOM environment for Node.js              |

## Configuration

- **Config file**: `vitest.config.ts`
- **Environment**: jsdom
- **Setup file**: `src/test/setup.ts` (starts MSW server, resets handlers between tests)
- **Test pattern**: `src/**/*.{test,spec}.{ts,tsx}`
- **Coverage**: v8 provider, reporters: text + lcov

## Scripts

| Command                 | Description                |
| ----------------------- | -------------------------- |
| `npm run test`          | Single run (CI mode)       |
| `npm run test:watch`    | Watch mode for development |
| `npm run test:coverage` | Run with coverage report   |

## When Tests Trigger

**GitHub Actions CI** (`.github/workflows/ci.yml`):

- On push to `main` or `develop`
- On pull request to `main` or `develop`
- Pipeline: install → type-check → lint → format:check → **test** → build

**Pre-commit hook** (Husky + lint-staged):

- Runs ESLint (`--max-warnings 0`) and Prettier check on staged `*.ts`/`*.tsx` files
- Runs Prettier check on staged `*.json`/`*.md`/`*.css` files
- Blocks commit on any lint error or formatting issue

## Test Inventory

### Unit Tests — Utilities & Libraries

| File                                | What it tests                                                                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/utils.test.ts`             | `cn()` utility — class name merging with Tailwind conflict resolution                                                         |
| `src/lib/formatters.test.ts`        | Formatting utilities (dates, scores, etc.)                                                                                    |
| `src/lib/lineupCoordinates.test.ts` | `fixInvalidCoordinates()` — role-based pitch positioning when coordinates are missing; verifies GK < DEF < MID < FWD ordering |
| `src/lib/playerAge.test.ts`         | `computeMatchDayAge()` — exact age from birthDate, approximate from currentAge, fallback, and 15–60 clamping                  |

### Unit Tests — Hooks

| File                               | What it tests                                                                                                                                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/hooks/useCountryFlag.test.ts` | Country flag URL resolution                                                                                                                                                                                                                 |
| `src/hooks/useApi.test.tsx`        | `useMatches()`, `useMatch()`, `useMatchLineups()`, `useMatchesByGameweek()`, `useDefaultGameweek()` via provider-agnostic hooks — query params, error/loading states, disabled states for falsy match IDs (0, empty string), retry behavior |

### Unit Tests — Providers

| File                                                | What it tests                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/providers/ligue1/__tests__/formations.test.ts` | Formation-to-coordinate mapping: known formations (433, 3421, 4231), GK/forward y positions, even X distribution, 0-1000 range, cache behavior, unknown formation fallback                                                                                      |
| `src/providers/ligue1/__tests__/index.test.ts`      | Ligue 1 provider: match list/detail/lineup mapping via MSW, status mapping, string IDs, goal types, scorer sorting, stadium, red cards, field/bench split, coordinates, bookings, coach, gameweek helpers (default GW from standings, total GW from team count) |

### Component Tests — Match

| File                                                       | What it tests                                                                                               |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/components/match/__tests__/MatchCard.test.tsx`        | Team names/logos, scores, penalty scores, round info, routing links                                         |
| `src/components/match/__tests__/MatchEvents.test.tsx`      | Match event rendering (goals, cards)                                                                        |
| `src/components/match/__tests__/PenaltyShootout.test.tsx`  | Penalty shootout display                                                                                    |
| `src/components/match/__tests__/GameweekSelector.test.tsx` | Gameweek navigation: matchday label, prev/next button behavior, disabled at bounds, loading state, onChange |

### Component Tests — Lineup

| File                                                  | What it tests                                                           |
| ----------------------------------------------------- | ----------------------------------------------------------------------- |
| `src/components/lineup/__tests__/PitchView.test.tsx`  | Pitch visualization, player positioning, coach display                  |
| `src/components/lineup/__tests__/PlayerNode.test.tsx` | Individual player node rendering (jersey, name, colors)                 |
| `src/components/lineup/__tests__/BenchList.test.tsx`  | Bench player list display                                               |
| `src/components/lineup/__tests__/TeamHalf.test.tsx`   | Team half positioning, coordinate inversion for away team, shirt colors |

### Component Tests — Layout

| File                                                     | What it tests            |
| -------------------------------------------------------- | ------------------------ |
| `src/components/layout/__tests__/DefaultLayout.test.tsx` | Layout wrapper rendering |

### Page Tests

| File                                           | What it tests                                                                                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/__tests__/HomePage.test.tsx`        | Loading states, match list rendering, team filtering (name/code/case-insensitive), date grouping, error/empty states, load-more pagination |
| `src/pages/__tests__/MatchDetailPage.test.tsx` | Match detail page rendering with lineup data                                                                                               |

### Infrastructure Tests

| File                              | What it tests                                              |
| --------------------------------- | ---------------------------------------------------------- |
| `src/test/infrastructure.test.ts` | Smoke tests verifying MSW, jsdom, and jest-dom are working |

## Test Helpers

| File                       | Purpose                                                                                             |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `src/test/setup.ts`        | Global setup — starts MSW, resets handlers between tests, closes server after suite                 |
| `src/test/msw/server.ts`   | MSW server instance with all handlers                                                               |
| `src/test/msw/handlers.ts` | HTTP GET handlers for UEFA API proxy routes (`/uefa-api/v5/matches`, etc.)                          |
| `src/test/msw/fixtures.ts` | Test data — Real Madrid vs Barcelona match, Bayern vs PSG match, lineup data with field coordinates |

---

## Integration Tests

Integration tests hit **real provider APIs** and are excluded from CI. Run manually only.

### Scripts

| Command                                  | Description                         |
| ---------------------------------------- | ----------------------------------- |
| `npm run test:integration`               | Run with a random seed (Date.now()) |
| `SEED=<number> npm run test:integration` | Reproduce a specific run exactly    |

The seed is printed at the start of every run. Copy it to reproduce a failure.

### Configuration

- **Config file**: `vitest.integration.config.ts`
- **Environment**: node (no jsdom, no MSW)
- **Setup**: `src/test/integration/setup.ts` — patches `globalThis.fetch` to rewrite proxy paths to real external URLs
- **Timeout**: 60 s per test, 120 s per `beforeAll` hook

### Test File

| File                                                 | What it tests                                     |
| ---------------------------------------------------- | ------------------------------------------------- |
| `src/test/integration/providers.integration.test.ts` | TC-1 through TC-5 across all registered providers |

### Test Cases

| ID   | Name                      | Description                                                                                                                                                  |
| ---- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TC-1 | Match list completeness   | Every picked match has critical fields (id, status, kickOffTime, homeTeam, awayTeam, round); finished matches have numeric scores; IDs are unique per season |
| TC-2 | Match detail completeness | Fetched detail has all critical fields including mediumLogoUrl; detail ID matches requested ID                                                               |
| TC-3 | Lineup completeness       | Available lineups have 10–11 field players per side; coordinates in [0, 1000]; at least one name field per player; home/away coordinates differ              |
| TC-4 | Bench completeness        | Bench players have id, jerseyNumber > 0, and at least one name field                                                                                         |
| TC-5 | Optional field coverage   | Logs hit rates for score, scorers, lineups, bench, stadium — visibility only, no assertions                                                                  |

### Season Selection Strategy

For each provider, the test picks:

- The **first available season** (oldest)
- The **current season** (newest)
- **One random season per decade** in between (seeded, reproducible)

### Match Selection Strategy

- **Offset providers** (UEFA UCL, UEL, UECL): fetches first 100 matches, prefers FINISHED, picks 5 randomly
- **Gameweek providers** (Ligue 1): picks 5 random gameweeks, pools all matches from those gameweeks, picks 5 randomly

### Integration Test Helpers

| File                                 | Purpose                                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/test/integration/setup.ts`      | Patches `globalThis.fetch` to rewrite `/uefa-api` and `/ligue1-api` prefixes to real external URLs                                                                                         |
| `src/test/integration/random.ts`     | Mulberry32 PRNG, `getSeed`, `pickTestSeasons`, `pickN`, `randInt`, `logSelections`                                                                                                         |
| `src/test/integration/validators.ts` | `validateMatchCritical`, `validateFinishedMatchScore`, `validateMatchDetailCritical`, `validateLineupCritical`, `validateBenchCritical`, `collectCoverage`, `mergeCoverage`, `logCoverage` |
