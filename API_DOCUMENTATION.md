API Champions League, Europa League and Conference League:

Official website "https://www.uefa.com/"

List of match with this type of url:
https://www.uefa.com/uefachampionsleague/fixtures-results/#/d/2026-03-19

This api call gets you the list of games:
Request URL
https://match.uefa.com/v5/matches?competitionId=1&fromDate=2026-03-18&limit=30&offset=0&order=ASC&phase=ALL&seasonYear=2026&toDate=2026-03-18&utcOffset=11
Request Method
GET

To get the details for a specific game you go to this page:
https://www.uefa.com/uefachampionsleague/match/2048059--barcelona-vs-newcastle/

The api call that gives you the details is:
Request URL
https://match.uefa.com/v5/matches?matchId=2048063
Request Method
GET

This api call gets you the lineups
Request URL
https://match.uefa.com/v5/matches/2048059/lineups
Request Method GET

Competion details and ID:

export const uefaUclProvider = createUefaProvider({
id: 'uefa-ucl',
name: 'UEFA Champions League',
logoUrl: '/competitions-logos/ucl.png',
competitionId: '1',
externalUrlPath: 'uefachampionsleague',
firstSeason: 1956,
})

export const uefaUelProvider = createUefaProvider({
id: 'uefa-uel',
name: 'UEFA Europa League',
logoUrl: '/competitions-logos/uel.svg',
competitionId: '14',
externalUrlPath: 'uefaeuropaleague',
firstSeason: 1972,
})

export const uefaUeclProvider = createUefaProvider({
id: 'uefa-uecl',
name: 'UEFA Conference League',
logoUrl: '/competitions-logos/uecl.svg',
competitionId: '2019',
externalUrlPath: 'uefaeuropaconferenceleague',
firstSeason: 2022,
})

---

API Ligue 1 Competition:

Official website "https://ligue1.com/en"

For the current season you get a game-week with this type of url:
"https://ligue1.com/fr/competitions/ligue1mcdonalds/results?gameweek=28"

This api call gets you the list of games:
"Request URL
https://ma-api.ligue1.fr/championship-matches/championship/1/game-week/28?season=2025
Request Method
GET"

To get the details for a specific game you go to this page:
"https://ligue1.com/fr/match-sheet/l1_championship_match_73367/summary"

The api call that gives you the details is:
"Request URL
https://ma-api.ligue1.fr/championship-match/l1_championship_match_73367
Request Method
GET"

---

API Premier League Competition:

Official website "https://www.premierleague.com/en"

For the current season you get a gameWeek with this type of url:
"https://www.premierleague.com/en/matches/premier-league/2025-26/matchweek-32"

This api call gets you the games for that gameWeek
"Request URL
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/competitions/8/seasons/2025/matchweeks/32/matches?_limit=20
Request Method
GET"

To get the details for a specific game you go to this page:
"https://www.premierleague.com/en/match/2562195/bournemouth-vs-manchester-united/overview"

The api call that gives you the details is:
"Request URL
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v2/matches/2562195
Request Method
GET"

They also have a lineup endpoint:
"Request URL
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v3/matches/2562195/lineups
Request Method
GET"

The api call that gives you the squad details is:
"Request URL
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v2/competitions/8/seasons/2025/teams/1/squad
Request Method
GET"

The api call that gives you the events details is:
"Request URL
https://sdp-prem-prod.premier-league-prod.pulselive.com/api/v1/matches/2562195/events
Request Method
GET"

The api call that gives you the players photo seems to be:
"Request URL
https://resources.premierleague.com/premierleague25/photos/players/40x40/496208.png
Request Method
GET"
