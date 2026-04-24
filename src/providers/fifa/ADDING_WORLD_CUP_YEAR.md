# Adding a FIFA World Cup Year

This document is a step-by-step checklist for adding a new FIFA World Cup tournament year to the FIFA provider. Audience: future Claude sessions or a human teammate.

## Quick reference

- [ ] Find the FIFA season ID for the new year
- [ ] Register in `seasons.ts`
- [ ] Scrape Wikipedia `YYYY_FIFA_World_Cup_squads` and write `squads/YYYY.json`
- [ ] Extend `clubs.json` with any new clubs (append only; don't mutate)
- [ ] Wire into `index.ts` (import, `squadsByYear`, `getSeasons`, `seasonLabel`)
- [ ] Add regression tests in `fifa.test.ts` + update `QA_TEST.md`

---

## Step 1 — Find the FIFA season ID

FIFA's API uses `idCompetition=17` for the men's World Cup. Each tournament year has a distinct `idSeason`.

List known World Cup season IDs:

```bash
curl -s 'https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&language=en&count=200' \
  | jq -r '.Results[] | .SeasonName[0].Description + " → " + .IdSeason' \
  | sort -u
```

Or do a targeted search by iterating candidate IDs until one returns matches.

Verified IDs:

- 2022 Qatar → `255711`
- 2018 Russia → `254645`

---

## Step 2 — Register in `seasons.ts`

Add the new year to the `FIFA_SEASON_IDS` map:

```ts
export const FIFA_SEASON_IDS: Record<number, string> = {
  2018: '254645',
  2022: '255711',
  // add new year here:
  // 2026: '...',
}
```

---

## Step 3 — Scrape Wikipedia squads

Source: `https://en.wikipedia.org/wiki/YYYY_FIFA_World_Cup_squads`

Output shape (2-level nested JSON):

```json
{
  "FRA": {
    "antoine griezmann": { "clubName": "Atlético Madrid" }
  }
}
```

### Key rules

- **Level-1 key: FIFA 3-letter country code** (NOT IOC, NOT ISO). Verify against the calendar API response's `IdCountry` field. FIFA uses:
  - `GER` (not `DEU`)
  - `ENG` (not `GBR`)
  - `POR` (not `PRT`)
  - `SUI` (not `CHE`)
  - `CRO` (not `HRV`)
  - `KSA` (not `SAU`)
  - `KOR` for South Korea
- **Level-2 key: normalized player name**, matching the provider's `normalizeName()` in `src/providers/fifa/index.ts`. Keys MUST round-trip (`normalizeName(key) === key`) — this is enforced by a test.

  The normalizer does four things, in order:
  1. Lowercase + NFD + strip combining marks (`ć → c`, `é → e`, `ñ → n`).
  2. Substitute non-decomposable characters: `æ → ae`, `ð → d`, `ø → o`, `þ → th`, `ł → l` (NFD can't decompose these, so they must be listed explicitly).
  3. Drop any trailing Wikipedia disambiguation suffix, e.g. ` (footballer, born 1988)`.
  4. Trim.

  Examples:
  - `"Luka Modrić"` → `"luka modric"`
  - `"Wojciech Szczęsny"` → `"wojciech szczesny"`
  - `"Simon Kjær"` → `"simon kjaer"`
  - `"Gylfi Sigurðsson"` → `"gylfi sigurdsson"`
  - `"Willian (footballer, born 1988)"` → `"willian"`

- **Value: `{ clubName: string }`** — take the club name from the Wikipedia wikilink text for the club cell. Preserve natural diacritics (e.g. `"Atlético Madrid"`, `"Paris Saint-Germain"`).

Write the output to `src/providers/fifa/squads/YYYY.json`.

### Typical squad sizes

| Year          | Per team | Teams | Total |
| ------------- | -------- | ----- | ----- |
| 2018 & before | 23       | 32    | 736   |
| 2022          | 26       | 32    | 832   |
| 2026          | 26       | 48    | 1248  |

---

## Step 4 — Extend `clubs.json`

`clubs.json` is shared across all tournament years.

### Rules

- **Read existing entries first.**
- **Append only.** Do not reorder, rename, or remove existing keys.
- For every unique `clubName` in the new `squads/YYYY.json`:
  - If the key is already in `clubs.json` → skip.
  - Otherwise, fetch the club's Wikipedia infobox and extract the full-size crest URL. SVG preferred over PNG. Use full-size `upload.wikimedia.org/wikipedia/(en|commons)/...` URLs, NOT thumbnail URLs.
- If a club's crest can't be resolved → omit the entry. The UI falls back to a monogram from `clubName`. Currently known intentional misses: `Chorrillo` (2018 Panama), `Lokeren` (2018 Belgium) — both Wikipedia infoboxes have kit colors only, no crest image.

### Thumbnail vs full-size image URLs

Wikipedia infoboxes often render a `/thumb/` URL. You want the full-size original — strip the `/thumb/` path segment and the trailing `/NNNpx-...` suffix.

- Thumbnail (wrong): `https://upload.wikimedia.org/wikipedia/en/thumb/7/77/FC_Red_Bull_Salzburg_logo.svg/200px-FC_Red_Bull_Salzburg_logo.svg.png`
- Full-size (right): `https://upload.wikimedia.org/wikipedia/en/7/77/FC_Red_Bull_Salzburg_logo.svg`

---

## Step 5 — Wire into `index.ts`

Four edits required:

### 5.1 Add the import

```ts
import squadsYYYY from './squads/YYYY.json'
```

### 5.2 Extend `squadsByYear`

```ts
const squadsByYear: Record<number, SquadMap> = {
  2018: squads2018 as SquadMap,
  2022: squads2022 as SquadMap,
  YYYY: squadsYYYY as SquadMap,
}
```

### 5.3 Update `getSeasons()`

Include the new year — **newest first** (descending).

### 5.4 Update `seasonLabel()`

```ts
seasonLabel(year) {
  if (year === 2022) return 'Qatar 2022'
  if (year === 2018) return 'Russia 2018'
  if (year === YYYY) return 'HostCountry YYYY'
  return String(year)
}
```

Label format: `'<Host> <Year>'` — e.g. `"Russia 2018"`, `"Qatar 2022"`, `"Canada/Mexico/USA 2026"`.

### Note on `getDefaultSeason()`

Usually **do NOT** update `getDefaultSeason()`. Default should point at the most recent **completed** tournament. Change only when a new tournament finishes.

---

## Step 6 — Tests + `QA_TEST.md`

In `src/providers/fifa/__tests__/fifa.test.ts`, add:

- `FIFA_SEASON_IDS[YYYY]` equals the known ID (regression guard for `seasons.ts` edits).
- `getSeasons()` contains `YYYY` in newest-first order.
- `seasonLabel(YYYY)` equals the host-year label.
- `fetchMatchLineups` with a mocked `IdSeason: '<new-id>'` resolves clubs from the new year's squad map — mock `squads/YYYY.json` via `vi.mock`.
- `getExternalUrl` for a match whose `kickOffTime.date` falls in year YYYY → URL contains the new season ID.

Append entries to `QA_TEST.md` under the FIFA provider inventory.

---

## Common pitfalls

- **FIFA 3-letter codes ≠ IOC/ISO.** Always verify against the calendar API's `IdCountry` field.
- **Diacritics and non-ASCII chars.** `normalizeName()` handles them (NFD + explicit `æ/ð/ø/þ/ł` substitutions). Your scraper must feed level-2 keys through the same function — the `squad JSON files are pre-normalized` test in `fifa.test.ts` enforces this.
- **Wikipedia disambiguation suffixes.** Names in the squads article are often wikilinks like `Willian (footballer, born 1988)`. `normalizeName()` strips the trailing ` (...)` — your scraper should too, so the level-2 key is just `"willian"`.
- **Don't mutate `clubs.json`.** Append-only. Reordering or renaming keys will break other years.
- **Don't change `getDefaultSeason()` casually.** It points at the most recent **completed** tournament; only bump after the new tournament finishes.
- **Wikipedia thumbnail URLs ≠ full-size.** Strip `/thumb/` from the path and remove the `/NNNpx-...` suffix to get the full-size URL.
- **Club names must match between `squads/YYYY.json` values and `clubs.json` keys.** A mismatch silently drops the logo.

---

## Manual smoke test (after shipping)

Run `npm run dev`, navigate to `/competition/fifa-wc`, pick the new year from the season dropdown. Open the tournament final (or any marquee match). Confirm:

- Team flags render in the match cards.
- Lineups render on the pitch.
- For players known to be at famous clubs (e.g. Messi at Barcelona in 2018), the correct crest shows in `Club` display mode.
- `getExternalUrl` opens the correct FIFA.com match-centre page.
