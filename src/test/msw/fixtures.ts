/**
 * API response fixtures shaped to match the TypeScript interfaces in src/types/match.ts.
 * Used by MSW handlers and imported directly in unit tests.
 */
import type { Match, MatchLineups } from '@/types/match'
import type { Ligue1MatchesResponse, Ligue1MatchDetail } from '@/providers/ligue1/types'

export const MATCH_ID = 2035839
export const MATCH_ID_STR = String(MATCH_ID)
export const SEASON_YEAR = '2024'

const homeTeam: Match['homeTeam'] = {
  id: 'h1',
  internationalName: 'Real Madrid',
  logoUrl: 'https://img.uefa.com/real-madrid-logo.png',
  mediumLogoUrl: 'https://img.uefa.com/real-madrid-logo-m.png',
  bigLogoUrl: 'https://img.uefa.com/real-madrid-logo-l.png',
  countryCode: 'ESP',
  teamCode: 'RMA',
  translations: {
    displayName: { en: 'Real Madrid' },
    displayOfficialName: { en: 'Real Madrid CF' },
  },
}

const awayTeam: Match['awayTeam'] = {
  id: 'a1',
  internationalName: 'FC Barcelona',
  logoUrl: 'https://img.uefa.com/barcelona-logo.png',
  mediumLogoUrl: 'https://img.uefa.com/barcelona-logo-m.png',
  bigLogoUrl: 'https://img.uefa.com/barcelona-logo-l.png',
  countryCode: 'ESP',
  teamCode: 'BAR',
  translations: {
    displayName: { en: 'FC Barcelona' },
    displayOfficialName: { en: 'Futbol Club Barcelona' },
  },
}

export const matchFixture: Match = {
  id: MATCH_ID,
  homeTeam,
  awayTeam,
  kickOffTime: {
    date: '2025-04-01',
    dateTime: '2025-04-01T19:00:00Z',
    utcOffsetInHours: 0,
  },
  score: {
    total: { home: 2, away: 1 },
    regular: { home: 2, away: 1 },
  },
  status: 'FINISHED',
  round: {
    metaData: { name: 'Quarter-finals', type: 'KNOCKOUT' },
    phase: 'KNOCKOUT',
  },
  matchday: { longName: 'Matchday 6', name: 'MD6', dateFrom: '2025-03-29', dateTo: '2025-04-02' },
  competition: { id: '1', metaData: { name: 'UEFA Champions League' } },
  type: 'FIRST_LEG',
  playerEvents: {
    scorers: [
      {
        id: 'evt-1',
        phase: 'FIRST_HALF',
        teamId: 'h1',
        time: { minute: 45, second: 0 },
        goalType: 'NORMAL',
        player: {
          clubShirtName: 'Vinicius Jr',
          internationalName: 'V. Junior',
          countryCode: 'BRA',
        },
      },
      {
        id: 'evt-2',
        phase: 'SECOND_HALF',
        teamId: 'h1',
        time: { minute: 90, second: 0, injuryMinute: 3 },
        goalType: 'NORMAL',
        player: {
          clubShirtName: 'Bellingham',
          internationalName: 'J. Bellingham',
          countryCode: 'ENG',
        },
      },
      {
        id: 'evt-3',
        phase: 'SECOND_HALF',
        teamId: 'a1',
        time: { minute: 78, second: 0 },
        goalType: 'PENALTY',
        player: {
          clubShirtName: 'Yamal',
          internationalName: 'L. Yamal',
          countryCode: 'ESP',
        },
      },
    ],
  },
}

// Second match for list tests (different ID, upcoming status)
export const matchFixture2: Match = {
  ...matchFixture,
  id: 9999999,
  status: 'UPCOMING',
  homeTeam: { ...homeTeam, internationalName: 'Bayern Munich', teamCode: 'BAY' },
  awayTeam: { ...awayTeam, internationalName: 'PSG', teamCode: 'PSG' },
  score: undefined,
  type: 'SECOND_LEG',
}

export const matchListFixture: Match[] = [matchFixture, matchFixture2]

export const lineupsFixture: MatchLineups = {
  matchId: MATCH_ID,
  lineupStatus: 'CONFIRMED',
  homeTeam: {
    team: {
      id: 'h1',
      internationalName: 'Real Madrid',
      logoUrl: '',
      mediumLogoUrl: '',
      bigLogoUrl: '',
    },
    field: [
      {
        jerseyNumber: 1,
        fieldCoordinate: { x: 50, y: 5 },
        fspFieldCoordinate: { x: 50, y: 5 },
        isBooked: false,
        type: 'GOALKEEPER',
        player: {
          id: 'p-10',
          internationalName: 'Courtois',
          clubShirtName: 'Courtois',
          countryCode: 'BEL',
          fieldPosition: 'G',
          detailedFieldPosition: 'GK',
          imageUrl: '',
          translations: { shortName: { en: 'Courtois' }, name: { en: 'Thibaut Courtois' } },
        },
      },
      {
        jerseyNumber: 7,
        fieldCoordinate: { x: 20, y: 75 },
        fspFieldCoordinate: { x: 20, y: 75 },
        isBooked: false,
        type: 'FORWARD',
        player: {
          id: 'p-1',
          internationalName: 'V. Junior',
          clubShirtName: 'Vinicius Jr',
          countryCode: 'BRA',
          fieldPosition: 'F',
          detailedFieldPosition: 'LW',
          imageUrl: '',
          translations: { shortName: { en: 'Vini Jr' }, name: { en: 'Vinicius Junior' } },
        },
      },
    ],
    bench: [
      {
        jerseyNumber: 21,
        isBooked: false,
        type: 'MIDFIELDER',
        player: {
          id: 'p-5',
          internationalName: 'Brahim',
          clubShirtName: 'Brahim',
          countryCode: 'ESP',
          fieldPosition: 'M',
          detailedFieldPosition: 'CAM',
          imageUrl: '',
          translations: { shortName: { en: 'Brahim' }, name: { en: 'Brahim Diaz' } },
        },
      },
    ],
    shirtColor: '#FFFFFF',
  },
  awayTeam: {
    team: {
      id: 'a1',
      internationalName: 'FC Barcelona',
      logoUrl: '',
      mediumLogoUrl: '',
      bigLogoUrl: '',
    },
    field: [
      {
        jerseyNumber: 1,
        fieldCoordinate: { x: 50, y: 95 },
        fspFieldCoordinate: { x: 50, y: 95 },
        isBooked: false,
        type: 'GOALKEEPER',
        player: {
          id: 'p-20',
          internationalName: 'Szczesny',
          clubShirtName: 'Szczesny',
          countryCode: 'POL',
          fieldPosition: 'G',
          detailedFieldPosition: 'GK',
          imageUrl: '',
          translations: { shortName: { en: 'Szczesny' }, name: { en: 'Wojciech Szczesny' } },
        },
      },
      {
        jerseyNumber: 19,
        fieldCoordinate: { x: 80, y: 75 },
        fspFieldCoordinate: { x: 80, y: 75 },
        isBooked: false,
        type: 'FORWARD',
        player: {
          id: 'p-3',
          internationalName: 'L. Yamal',
          clubShirtName: 'Yamal',
          countryCode: 'ESP',
          fieldPosition: 'F',
          detailedFieldPosition: 'RW',
          imageUrl: '',
          translations: { shortName: { en: 'Yamal' }, name: { en: 'Lamine Yamal' } },
        },
      },
    ],
    bench: [],
    shirtColor: '#A50044',
  },
}

// ---------------------------------------------------------------------------
// Ligue 1 API fixtures
// ---------------------------------------------------------------------------

export const LIGUE1_MATCH_ID = 'l1_championship_match_99001'
export const LIGUE1_SEASON = 2025

const l1ClubIdentity = (name: string, trigram: string, color: string) => ({
  id: `l1_club_${trigram}`,
  name,
  trigram,
  primaryColor: color,
  assets: {
    logo: {
      small: `https://img.ligue1.fr/${trigram}-s.png`,
      medium: `https://img.ligue1.fr/${trigram}-m.png`,
      large: `https://img.ligue1.fr/${trigram}-l.png`,
    },
  },
})

const l1Player = (
  id: string,
  firstName: string,
  lastName: string,
  shirtNumber: number,
  position: number,
  formationPlace: number,
  startedMatch: boolean,
) => ({
  id,
  formationPlace,
  startedMatch,
  sub: startedMatch ? 0 : 1,
  position,
  playerIdentity: {
    firstName,
    lastName,
    jerseyNumber: shirtNumber,
    countryName: 'France',
    countryShortCode: 'FRA',
    birthDate: '1998-01-15',
    assets: {
      facePictures: {
        small: `https://img.ligue1.fr/${id}-s.png`,
        medium: `https://img.ligue1.fr/${id}-m.png`,
        large: `https://img.ligue1.fr/${id}-l.png`,
      },
    },
  },
  goals: 0,
  ownGoals: 0,
  shirtNumber,
})

export const ligue1MatchListFixture: Ligue1MatchesResponse = {
  matches: [
    {
      matchId: LIGUE1_MATCH_ID,
      championshipId: 1,
      gameWeekNumber: 28,
      date: '2026-04-03T18:45:00.000Z',
      period: 'fullTime',
      matchTime: "90' +4",
      isLive: false,
      home: {
        clubId: 'club_psg',
        score: 3,
        clubIdentity: l1ClubIdentity('Paris Saint-Germain', 'PSG', '#004070'),
      },
      away: {
        clubId: 'club_tou',
        score: 1,
        clubIdentity: l1ClubIdentity('Toulouse FC', 'TOU', '#3E2B57'),
      },
    },
    {
      matchId: 'l1_championship_match_99002',
      championshipId: 1,
      gameWeekNumber: 28,
      date: '2026-04-10T18:00:00.000Z',
      period: 'preMatch',
      matchTime: '',
      isLive: false,
      home: {
        clubId: 'club_lil',
        score: 0,
        clubIdentity: l1ClubIdentity('LOSC Lille', 'LIL', '#E41B13'),
      },
      away: {
        clubId: 'club_len',
        score: 0,
        clubIdentity: l1ClubIdentity('RC Lens', 'LEN', '#C51315'),
      },
    },
  ],
}

const makeL1Side = (
  clubId: string,
  name: string,
  trigram: string,
  color: string,
  score: number,
  formation: string,
  managerFirst: string,
  managerLast: string,
) => ({
  clubId,
  score,
  clubIdentity: l1ClubIdentity(name, trigram, color),
  formation,
  manager: { firstName: managerFirst, lastName: managerLast },
  goals: [] as Ligue1MatchDetail['home']['goals'],
  substitutions: [] as Ligue1MatchDetail['home']['substitutions'],
  bookings: [] as Ligue1MatchDetail['home']['bookings'],
  penaltyShots: [] as Ligue1MatchDetail['home']['penaltyShots'],
  players: {} as Record<string, ReturnType<typeof l1Player>>,
})

export const ligue1MatchDetailFixture: Ligue1MatchDetail = (() => {
  const home = makeL1Side(
    'club_psg',
    'Paris Saint-Germain',
    'PSG',
    '#004070',
    3,
    '433',
    'Luis Enrique',
    'Martinez',
  )
  // Add starter players (formationPlace 1-11)
  home.players = {
    p1: l1Player('p1', 'Gianluigi', 'Donnarumma', 1, 1, 1, true),
    p2: l1Player('p2', 'Achraf', 'Hakimi', 2, 2, 2, true),
    p3: l1Player('p3', 'Marquinhos', 'Correia', 5, 2, 3, true),
    p4: l1Player('p4', 'Lucas', 'Hernandez', 21, 2, 4, true),
    p5: l1Player('p5', 'Nuno', 'Mendes', 25, 2, 5, true),
    p6: l1Player('p6', 'Warren', 'Zaire-Emery', 33, 3, 6, true),
    p7: l1Player('p7', 'Vitinha', 'Ferreira', 17, 3, 7, true),
    p8: l1Player('p8', 'Fabian', 'Ruiz', 8, 3, 8, true),
    p9: l1Player('p9', 'Ousmane', 'Dembele', 10, 4, 9, true),
    p10: l1Player('p10', 'Randal', 'Kolo Muani', 23, 4, 10, true),
    p11: l1Player('p11', 'Bradley', 'Barcola', 29, 4, 11, true),
    p12: l1Player('p12', 'Keylor', 'Navas', 30, 1, 0, false), // bench
  }
  home.goals = [
    { scorerId: 'p9', time: "23'", timestamp: 1000001, type: 'goal', side: 'home' },
    { scorerId: 'p10', time: "55'", timestamp: 1000002, type: 'penalty', side: 'home' },
  ]
  home.bookings = [
    { playerId: 'p6', type: 'yellow', time: "37'", timestamp: 1000003, side: 'home' },
    { playerId: 'p12', type: 'red', time: "80'", timestamp: 1000004, side: 'home' },
  ]

  const away = makeL1Side(
    'club_tou',
    'Toulouse FC',
    'TOU',
    '#3E2B57',
    1,
    '3421',
    'Carles',
    'Martinez',
  )
  away.players = {
    a1: l1Player('a1', 'Guillaume', 'Restes', 1, 1, 1, true),
    a2: l1Player('a2', 'Djibril', 'Sidibe', 19, 2, 2, true),
    a3: l1Player('a3', 'Dayann', 'Methalie', 24, 3, 3, true),
    a4: l1Player('a4', 'Rasmus', 'Nicolaisen', 2, 2, 4, true),
    a5: l1Player('a5', 'Seny', 'Koumbassa', 35, 2, 5, true),
    a6: l1Player('a6', 'Mark', 'Mckenzie', 3, 2, 6, true),
    a7: l1Player('a7', 'Cristian', 'Casseres', 23, 3, 7, true),
    a8: l1Player('a8', 'Pape', 'Diop', 18, 3, 8, true),
    a9: l1Player('a9', 'Emersonn', 'Correia', 20, 4, 9, true),
    a10: l1Player('a10', 'Aron', 'Donnum', 15, 4, 10, true),
    a11: l1Player('a11', 'Yann', 'Gboho', 10, 4, 11, true),
    a12: l1Player('a12', 'Warren', 'Kamanzi', 12, 2, 0, false), // bench
  }
  away.goals = [{ scorerId: 'a11', time: "27'", timestamp: 1000005, type: 'goal', side: 'away' }]

  return {
    id: LIGUE1_MATCH_ID,
    championshipId: 1,
    season: LIGUE1_SEASON,
    gameWeekNumber: 28,
    date: '2026-04-03T18:45:00.000Z',
    period: 'fullTime',
    matchTime: "90' +4",
    stadium: { name: 'PARC DES PRINCES', address: { city: 'PARIS' } },
    home,
    away,
  }
})()

export const ligue1StandingsFixture = {
  competitionType: 'championship',
  season: LIGUE1_SEASON,
  standings: Object.fromEntries(
    Array.from({ length: 18 }, (_, i) => [
      String(i + 1),
      {
        clubId: `club_${i + 1}`,
        played: i < 10 ? 28 : 27,
      },
    ]),
  ),
}
