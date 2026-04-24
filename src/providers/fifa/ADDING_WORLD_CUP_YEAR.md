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

## Step 4a — (Optional) Curate shootout sequences in `shootouts.json`

FIFA's public API only reports **scored** shootout kicks (Goals with `Period=11`); missed kicks are absent, and even the order of scored kicks is only loosely conveyed via `Minute` values. For an accurate shootout display with all kicks in the correct order, add an entry to `src/providers/fifa/shootouts.json` with the full ordered `kicks[]` sequence. When a match has this entry, the provider uses it as the **sole source of truth** for `penaltyScorers`.

Shape:

```json
{
  "<IdMatch>": {
    "description": "2022 Final — Argentina 3-3 France (4-2 pens)",
    "kicks": [
      { "idTeam": "43946", "playerName": "Kylian Mbappe", "result": "SCORED" },
      { "idTeam": "43922", "playerName": "Lionel Messi", "result": "SCORED" },
      { "idTeam": "43946", "playerName": "Kingsley Coman", "result": "MISSED" },
      { "idTeam": "43922", "playerName": "Paulo Dybala", "result": "SCORED" }
    ]
  }
}
```

Field rules:

- `IdMatch` (JSON key): FIFA match ID string.
- `idTeam` (required): FIFA team ID — find it via the live endpoint's `HomeTeam.IdTeam` / `AwayTeam.IdTeam`.
- `playerName` (required): unnormalized Latinized form (no diacritics — matches FIFA's player names). This string is what renders in the UI.
- `idPlayer` (optional): FIFA player ID. When present, the provider resolves the player via the roster for richer data.
- `result` (required): `"SCORED"` or `"MISSED"`.
- Order the `kicks[]` array in **real shootout order** — team A's kick 1, team B's kick 1, team A's kick 2, … If a kick wasn't taken (team already won before their 5th), don't include it.

### Shootout matches currently curated

| Year | Match ID    | Description                               |
| ---- | ----------- | ----------------------------------------- |
| 2018 | `300331498` | R16 — Croatia 1-1 Denmark (3-2 pens)      |
| 2018 | `300331504` | QF — Russia 2-2 Croatia (3-4 pens)        |
| 2018 | `300331517` | R16 — Spain 1-1 Russia (3-4 pens)         |
| 2018 | `300331542` | R16 — Colombia 1-1 England (3-4 pens)     |
| 2022 | `400128132` | R16 — Japan 1-1 Croatia (1-3 pens)        |
| 2022 | `400128137` | R16 — Morocco 0-0 Spain (3-0 pens)        |
| 2022 | `400128139` | QF — Netherlands 2-2 Argentina (3-4 pens) |
| 2022 | `400128141` | QF — Croatia 1-1 Brazil (4-2 pens)        |
| 2022 | `400128145` | Final — Argentina 3-3 France (4-2 pens)   |

To find shootout matches for a new WC year, filter the calendar response by non-zero `HomeTeamPenaltyScore` or `AwayTeamPenaltyScore`:

```bash
curl -s 'https://api.fifa.com/api/v3/calendar/matches?idCompetition=17&idSeason=<SEASON_ID>&language=en&count=200' \
  | jq '.Results[] | select((.HomeTeamPenaltyScore // 0) > 0 or (.AwayTeamPenaltyScore // 0) > 0) | {IdMatch, stage: .StageName[0].Description, home: .Home.TeamName[0].Description, away: .Away.TeamName[0].Description, pens: "\(.HomeTeamPenaltyScore)-\(.AwayTeamPenaltyScore)"}'
```

### Authoritative source for kick sequences

**Don't guess the sequence from memory.** Use the Wikipedia knockout-stage page for the tournament — it encodes each shootout's kicks chronologically with standardised icons:

- `2018 FIFA World Cup knockout stage` → `https://en.wikipedia.org/wiki/2018_FIFA_World_Cup_knockout_stage`
- `2022 FIFA World Cup knockout stage` → `https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_knockout_stage`
- For future years: `https://en.wikipedia.org/wiki/YYYY_FIFA_World_Cup_knockout_stage`

On each shootout, Wikipedia shows a two-column list under the `Penalties` header:

- **Left column** (`<td class="fhgoal">`): home team kicks, chronological top→bottom
- **Right column** (`<td class="fagoal">`): away team kicks, chronological top→bottom
- Each entry has a player name anchor and one of two standardised icons:
  - `Soccerball_shad_check.svg` (`title="Penalty scored"`) → `"result": "SCORED"`
  - `Soccerball_shade_cross.svg` (`title="Penalty missed"`) → `"result": "MISSED"`

To reconstruct the real alternating kick order, interleave the two columns: `home[0]`, `away[0]`, `home[1]`, `away[1]`, … UNLESS the away team kicked first (rare — e.g. France in the 2022 Final) in which case swap. Check the match article's "Penalty shoot-out" prose section when it's ambiguous.

**Verification rule**: after interleaving, the SCORED count per team must match the `HomeTeamPenaltyScore` / `AwayTeamPenaltyScore` you got from FIFA. If not, you mis-parsed — redo.

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
