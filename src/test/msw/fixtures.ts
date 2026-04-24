/**
 * API response fixtures shaped to match the TypeScript interfaces in src/types/match.ts.
 * Used by MSW handlers and imported directly in unit tests.
 */
import type { Match, MatchLineups } from '@/types/match'
import type { Ligue1MatchesResponse, Ligue1MatchDetail } from '@/providers/ligue1/types'
import type {
  PLMatchesResponse,
  PLMatchDetail,
  PLLineupsResponse,
  PLEventsResponse,
  PLTeamsResponse,
  PLSquadPlayer,
} from '@/providers/premier-league/types'
import type { FifaCalendarResponse, FifaMatch, FifaPlayer } from '@/providers/fifa/types'

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

// ---------------------------------------------------------------------------
// Premier League API fixtures
// ---------------------------------------------------------------------------

export const PL_MATCH_ID = '2562195'
export const PL_SEASON = 2025

export const plMatchListFixture: PLMatchesResponse = {
  pagination: { _limit: 20, _prev: null, _next: null },
  data: [
    {
      matchId: PL_MATCH_ID,
      kickoff: '2026-03-20 20:00:00',
      kickoffTimezone: 'GMT',
      period: 'FullTime',
      homeTeam: { name: 'Bournemouth', id: '91', shortName: 'Bournemouth', abbr: 'BOU', score: 2 },
      awayTeam: { name: 'Manchester United', id: '1', shortName: 'Man Utd', abbr: 'MUN', score: 2 },
      competition: 'Premier League',
      ground: 'Vitality Stadium, Bournemouth',
    },
    {
      matchId: '2562206',
      kickoff: '2026-04-11 15:00:00',
      kickoffTimezone: 'BST',
      period: 'PreMatch',
      homeTeam: { name: 'Arsenal', id: '3', shortName: 'Arsenal', abbr: 'ARS' },
      awayTeam: { name: 'Everton', id: '11', shortName: 'Everton', abbr: 'EVE' },
      competition: 'Premier League',
      ground: 'Emirates Stadium, London',
    },
  ],
}

export const plMatchDetailFixture: PLMatchDetail = {
  matchId: PL_MATCH_ID,
  kickoff: '2026-03-20 20:00:00',
  kickoffTimezone: 'GMT',
  period: 'FullTime',
  matchWeek: 31,
  competitionId: '8',
  seasonId: '2025',
  clock: '101',
  attendance: 11250,
  ground: 'Vitality Stadium, Bournemouth',
  competition: 'Premier League',
  homeTeam: {
    name: 'Bournemouth',
    id: '91',
    shortName: 'Bournemouth',
    abbr: 'BOU',
    score: 2,
    halfTimeScore: 0,
    redCards: 0,
  },
  awayTeam: {
    name: 'Manchester United',
    id: '1',
    shortName: 'Man Utd',
    abbr: 'MUN',
    score: 2,
    halfTimeScore: 0,
    redCards: 1,
  },
}

export const plLineupsFixture: PLLineupsResponse = {
  home_team: {
    teamId: '91',
    players: [
      {
        firstName: 'Djordje',
        lastName: 'Petrovic',
        shirtNum: '1',
        isCaptain: false,
        id: '457569',
        position: 'Goalkeeper',
      },
      {
        firstName: 'Adam',
        lastName: 'Smith',
        shirtNum: '15',
        isCaptain: false,
        id: '551483',
        position: 'Defender',
      },
      {
        firstName: 'Marcos',
        lastName: 'Senesi',
        shirtNum: '4',
        isCaptain: false,
        id: '463981',
        position: 'Defender',
      },
      {
        firstName: 'Illia',
        lastName: 'Zabarnyi',
        shirtNum: '13',
        isCaptain: false,
        id: '221466',
        position: 'Defender',
      },
      {
        firstName: 'Adrien',
        lastName: 'Truffert',
        shirtNum: '3',
        isCaptain: false,
        id: '494521',
        position: 'Defender',
      },
      {
        firstName: 'Ryan',
        lastName: 'Christie',
        shirtNum: '10',
        isCaptain: false,
        id: '503139',
        position: 'Midfielder',
      },
      {
        firstName: 'Lewis',
        lastName: 'Cook',
        shirtNum: '16',
        isCaptain: true,
        id: '158499',
        position: 'Midfielder',
      },
      {
        firstName: 'Justin',
        lastName: 'Kluivert',
        shirtNum: '17',
        isCaptain: false,
        id: '499604',
        position: 'Forward',
      },
      {
        firstName: 'David',
        lastName: 'Brooks',
        shirtNum: '7',
        isCaptain: false,
        id: '201658',
        position: 'Midfielder',
      },
      {
        firstName: 'Dango',
        lastName: 'Ouattara',
        shirtNum: '11',
        isCaptain: false,
        id: '489888',
        position: 'Forward',
      },
      {
        firstName: 'Evanilson',
        lastName: 'de Barros',
        shirtNum: '9',
        isCaptain: false,
        id: '444102',
        position: 'Forward',
        knownName: 'Evanilson',
      },
      // Subs
      {
        firstName: 'Antoine',
        lastName: 'Semenyo',
        shirtNum: '24',
        isCaptain: false,
        id: '496208',
        position: 'Forward',
      },
      {
        firstName: 'Tyler',
        lastName: 'Adams',
        shirtNum: '14',
        isCaptain: false,
        id: '560262',
        position: 'Midfielder',
      },
    ],
    formation: {
      teamId: '91',
      formation: '4-2-3-1',
      lineup: [
        ['457569'],
        ['551483', '463981', '221466', '494521'],
        ['503139', '158499'],
        ['499604', '201658', '489888'],
        ['444102'],
      ],
      subs: ['496208', '560262'],
    },
  },
  away_team: {
    teamId: '1',
    players: [
      {
        firstName: 'Senne',
        lastName: 'Lammens',
        shirtNum: '31',
        isCaptain: false,
        id: '465247',
        position: 'Goalkeeper',
      },
      {
        firstName: 'José Diogo',
        lastName: 'Dalot Teixeira',
        shirtNum: '2',
        isCaptain: false,
        id: '216051',
        position: 'Defender',
        knownName: 'Diogo Dalot',
      },
      {
        firstName: 'Matthijs',
        lastName: 'de Ligt',
        shirtNum: '4',
        isCaptain: false,
        id: '550864',
        position: 'Defender',
      },
      {
        firstName: 'Harry',
        lastName: 'Maguire',
        shirtNum: '5',
        isCaptain: false,
        id: '95658',
        position: 'Defender',
      },
      {
        firstName: 'Tyrell',
        lastName: 'Malacia',
        shirtNum: '12',
        isCaptain: false,
        id: '106760',
        position: 'Defender',
      },
      {
        firstName: 'Casemiro',
        lastName: 'de Casas',
        shirtNum: '18',
        isCaptain: false,
        id: '61256',
        position: 'Midfielder',
        knownName: 'Casemiro',
      },
      {
        firstName: 'Kobbie',
        lastName: 'Mainoo',
        shirtNum: '37',
        isCaptain: false,
        id: '516895',
        position: 'Midfielder',
      },
      {
        firstName: 'Mason',
        lastName: 'Mount',
        shirtNum: '7',
        isCaptain: false,
        id: '493250',
        position: 'Midfielder',
      },
      {
        firstName: 'Bruno Miguel',
        lastName: 'Borges Fernandes',
        shirtNum: '8',
        isCaptain: true,
        id: '141746',
        position: 'Midfielder',
        knownName: 'Bruno Fernandes',
      },
      {
        firstName: 'Amad',
        lastName: 'Diallo',
        shirtNum: '16',
        isCaptain: false,
        id: '430871',
        position: 'Forward',
      },
      {
        firstName: 'Rasmus',
        lastName: 'Hojlund',
        shirtNum: '11',
        isCaptain: false,
        id: '446008',
        position: 'Forward',
      },
      // Subs
      {
        firstName: 'Marcus',
        lastName: 'Rashford',
        shirtNum: '10',
        isCaptain: false,
        id: '485711',
        position: 'Forward',
      },
    ],
    formation: {
      teamId: '1',
      formation: '4-3-3',
      lineup: [
        ['465247'],
        ['216051', '550864', '95658', '106760'],
        ['61256', '516895', '493250'],
        ['141746', '446008', '430871'],
      ],
      subs: ['485711'],
    },
  },
}

export const plEventsFixture: PLEventsResponse = {
  homeTeam: {
    name: 'Bournemouth',
    id: '91',
    shortName: 'Bournemouth',
    goals: [
      {
        goalType: 'Goal',
        period: 'SecondHalf',
        assistPlayerId: '494521',
        time: '67',
        playerId: '158499',
        timestamp: '20260320T212401+0000',
      },
      {
        goalType: 'Penalty',
        period: 'SecondHalf',
        assistPlayerId: null,
        time: '81',
        playerId: '560262',
        timestamp: '20260320T213723+0000',
      },
    ],
    cards: [
      {
        period: 'SecondHalf',
        time: '59',
        type: 'Yellow',
        playerId: '551483',
        timestamp: '20260320T211608+0000',
      },
    ],
    subs: [
      {
        period: 'SecondHalf',
        playerOnId: '496208',
        playerOffId: '489888',
        time: '73',
        timestamp: '20260320T212942+0000',
      },
    ],
  },
  awayTeam: {
    name: 'Manchester United',
    id: '1',
    shortName: 'Man Utd',
    goals: [
      {
        goalType: 'Penalty',
        period: 'SecondHalf',
        assistPlayerId: null,
        time: '61',
        playerId: '141746',
        timestamp: '20260320T211745+0000',
      },
      {
        goalType: 'Own',
        period: 'SecondHalf',
        assistPlayerId: null,
        time: '71',
        playerId: '463981',
        timestamp: '20260320T212814+0000',
      },
    ],
    cards: [
      {
        period: 'FirstHalf',
        time: '28',
        type: 'Yellow',
        playerId: '61256',
        timestamp: '20260320T202727+0000',
      },
      {
        period: 'SecondHalf',
        time: '78',
        type: 'StraightRed',
        playerId: '95658',
        timestamp: '20260320T213510+0000',
      },
    ],
    subs: [
      {
        period: 'SecondHalf',
        playerOnId: '485711',
        playerOffId: '446008',
        time: '71',
        timestamp: '20260320T212746+0000',
      },
    ],
  },
}

export const plTeamsFixture: PLTeamsResponse = {
  pagination: { _limit: 100 },
  data: Array.from({ length: 20 }, (_, i) => ({
    name: `Team ${i + 1}`,
    id: String(i + 1),
    shortName: `T${i + 1}`,
    abbr: `T${String(i + 1).padStart(2, '0')}`,
  })),
}

export const plSquadFixture: PLSquadPlayer[] = [
  {
    id: '457569',
    name: { first: 'Djordje', last: 'Petrovic', display: 'Djordje Petrovic' },
    position: 'Goalkeeper',
    country: { isoCode: 'RS' },
    dates: { birth: '1999-10-08' },
  },
  {
    id: '158499',
    name: { first: 'Lewis', last: 'Cook', display: 'Lewis Cook' },
    position: 'Midfielder',
    country: { isoCode: 'GB-ENG' },
    dates: { birth: '1997-02-03' },
  },
  {
    id: '444102',
    name: { first: 'Evanilson', last: 'de Barros', display: 'Evanilson' },
    position: 'Forward',
    country: { isoCode: 'BR' },
    dates: { birth: '1999-10-06' },
  },
  {
    id: '551483',
    name: { first: 'Adam', last: 'Smith', display: 'Adam Smith' },
    position: 'Defender',
    country: { isoCode: 'GB-ENG' },
  },
  {
    id: '463981',
    name: { first: 'Marcos', last: 'Senesi', display: 'Marcos Senesi' },
    position: 'Defender',
    country: { isoCode: 'AR' },
  },
  {
    id: '221466',
    name: { first: 'Illia', last: 'Zabarnyi', display: 'Illia Zabarnyi' },
    position: 'Defender',
    country: { isoCode: 'UA' },
  },
  {
    id: '494521',
    name: { first: 'Adrien', last: 'Truffert', display: 'Adrien Truffert' },
    position: 'Defender',
    country: { isoCode: 'FR' },
  },
  {
    id: '503139',
    name: { first: 'Ryan', last: 'Christie', display: 'Ryan Christie' },
    position: 'Midfielder',
    country: { isoCode: 'GB-SCT' },
  },
  {
    id: '499604',
    name: { first: 'Justin', last: 'Kluivert', display: 'Justin Kluivert' },
    position: 'Forward',
    country: { isoCode: 'NL' },
  },
  {
    id: '201658',
    name: { first: 'David', last: 'Brooks', display: 'David Brooks' },
    position: 'Midfielder',
    country: { isoCode: 'GB-WLS' },
  },
  {
    id: '489888',
    name: { first: 'Dango', last: 'Ouattara', display: 'Dango Ouattara' },
    position: 'Forward',
    country: { isoCode: 'BF' },
  },
  {
    id: '496208',
    name: { first: 'Antoine', last: 'Semenyo', display: 'Antoine Semenyo' },
    position: 'Forward',
    country: { isoCode: 'GH' },
  },
  {
    id: '560262',
    name: { first: 'Tyler', last: 'Adams', display: 'Tyler Adams' },
    position: 'Midfielder',
    country: { isoCode: 'US' },
  },
  // Man Utd players
  {
    id: '465247',
    name: { first: 'Senne', last: 'Lammens', display: 'Senne Lammens' },
    position: 'Goalkeeper',
    country: { isoCode: 'BE' },
  },
  {
    id: '216051',
    name: { first: 'José Diogo', last: 'Dalot Teixeira', display: 'Diogo Dalot' },
    position: 'Defender',
    country: { isoCode: 'PT' },
  },
  {
    id: '550864',
    name: { first: 'Matthijs', last: 'de Ligt', display: 'Matthijs de Ligt' },
    position: 'Defender',
    country: { isoCode: 'NL' },
  },
  {
    id: '95658',
    name: { first: 'Harry', last: 'Maguire', display: 'Harry Maguire' },
    position: 'Defender',
    country: { isoCode: 'GB-ENG' },
  },
  {
    id: '106760',
    name: { first: 'Tyrell', last: 'Malacia', display: 'Tyrell Malacia' },
    position: 'Defender',
    country: { isoCode: 'NL' },
  },
  {
    id: '61256',
    name: { first: 'Casemiro', last: 'de Casas', display: 'Casemiro' },
    position: 'Midfielder',
    country: { isoCode: 'BR' },
  },
  {
    id: '516895',
    name: { first: 'Kobbie', last: 'Mainoo', display: 'Kobbie Mainoo' },
    position: 'Midfielder',
    country: { isoCode: 'GB-ENG' },
  },
  {
    id: '493250',
    name: { first: 'Mason', last: 'Mount', display: 'Mason Mount' },
    position: 'Midfielder',
    country: { isoCode: 'GB-ENG' },
  },
  {
    id: '141746',
    name: { first: 'Bruno Miguel', last: 'Borges Fernandes', display: 'Bruno Fernandes' },
    position: 'Midfielder',
    country: { isoCode: 'PT' },
  },
  {
    id: '430871',
    name: { first: 'Amad', last: 'Diallo', display: 'Amad Diallo' },
    position: 'Forward',
    country: { isoCode: 'CI' },
  },
  {
    id: '446008',
    name: { first: 'Rasmus', last: 'Hojlund', display: 'Rasmus Hojlund' },
    position: 'Forward',
    country: { isoCode: 'DK' },
  },
  {
    id: '485711',
    name: { first: 'Marcus', last: 'Rashford', display: 'Marcus Rashford' },
    position: 'Forward',
    country: { isoCode: 'GB-ENG' },
  },
]

// ---------------------------------------------------------------------------
// FIFA World Cup API fixtures
// ---------------------------------------------------------------------------

export const FIFA_MATCH_ID = '400128145'
export const FIFA_SEASON = 2022

// Helper to build FIFA locale description
const fifaLocale = (description: string) => [{ Locale: 'en-GB', Description: description }]

// Helper to build a FIFA player
function fifaPlayer(
  id: string,
  name: string,
  shirtNumber: number,
  position: 0 | 1 | 2 | 3 | 4,
  lineupX: number | null,
  lineupY: number | null,
): FifaPlayer {
  return {
    IdPlayer: id,
    PlayerName: fifaLocale(name),
    ShirtNumber: shirtNumber,
    Position: position,
    LineupX: lineupX,
    LineupY: lineupY,
    IdTeam: 'team-arg',
    IdCountry: 'ARG',
  }
}

function fifaPlayerAway(
  id: string,
  name: string,
  shirtNumber: number,
  position: 0 | 1 | 2 | 3 | 4,
  lineupX: number | null,
  lineupY: number | null,
): FifaPlayer {
  return {
    IdPlayer: id,
    PlayerName: fifaLocale(name),
    ShirtNumber: shirtNumber,
    Position: position,
    LineupX: lineupX,
    LineupY: lineupY,
    IdTeam: 'team-fra',
    IdCountry: 'FRA',
  }
}

// Home team (Argentina) players — 11 starters + 3 bench
// Coord scale: X 2-18, Y 1-12. GK at y=1 (bottom), forwards at y=12 (top).
const argPlayers: FifaPlayer[] = [
  // GK — x=10 (center), y=1 (bottom row)
  fifaPlayer('arg-gk-1', 'Emiliano Martinez', 23, 0, 10, 1),
  // DEF line y=3
  fifaPlayer('arg-def-2', 'Nahuel Molina', 26, 1, 5, 3),
  fifaPlayer('arg-def-3', 'Cristian Romero', 13, 1, 8, 3),
  fifaPlayer('arg-def-4', 'Nicolas Otamendi', 19, 1, 12, 3),
  fifaPlayer('arg-def-5', 'Nicolas Tagliafico', 3, 1, 15, 3),
  // MID line y=6
  fifaPlayer('arg-mid-6', 'Alexis Mac Allister', 20, 2, 7, 6),
  fifaPlayer('arg-mid-7', 'Enzo Fernandez', 24, 2, 10, 6),
  fifaPlayer('arg-mid-8', 'Rodrigo De Paul', 7, 2, 13, 6),
  // FWD line y=10
  // HIT player: Lionel Messi — present in test squad map under 'ARG' with clubName 'Inter Miami'
  fifaPlayer('arg-fwd-9', 'Lionel Messi', 10, 3, 6, 10),
  // PARTIAL player: Julian Alvarez — in squad map (clubName resolved) but club NOT in clubs map
  fifaPlayer('arg-fwd-10', 'Julian Alvarez', 9, 3, 10, 10),
  // MISS player: Angel Di Maria — NOT in squad map
  fifaPlayer('arg-fwd-11', 'Angel Di Maria', 11, 3, 14, 10),
  // Bench — null coords, Position 4
  fifaPlayer('arg-sub-12', 'Geronimo Rulli', 1, 4, null, null),
  fifaPlayer('arg-sub-13', 'Leandro Paredes', 5, 4, null, null),
  fifaPlayer('arg-sub-14', 'Lautaro Martinez', 22, 4, null, null),
]

// Away team (France) players — 11 starters + 3 bench
const fraPlayers: FifaPlayer[] = [
  fifaPlayerAway('fra-gk-1', 'Hugo Lloris', 1, 0, 10, 1),
  fifaPlayerAway('fra-def-2', 'Benjamin Pavard', 5, 1, 5, 3),
  fifaPlayerAway('fra-def-3', 'Raphael Varane', 4, 1, 8, 3),
  fifaPlayerAway('fra-def-4', 'Dayot Upamecano', 15, 1, 12, 3),
  fifaPlayerAway('fra-def-5', 'Theo Hernandez', 22, 1, 15, 3),
  fifaPlayerAway('fra-mid-6', 'Aurelien Tchouameni', 8, 2, 7, 6),
  fifaPlayerAway('fra-mid-7', 'Adrien Rabiot', 14, 2, 10, 6),
  fifaPlayerAway('fra-mid-8', 'Antoine Griezmann', 7, 2, 13, 6),
  fifaPlayerAway('fra-fwd-9', 'Ousmane Dembele', 11, 3, 6, 10),
  fifaPlayerAway('fra-fwd-10', 'Olivier Giroud', 9, 3, 10, 10),
  fifaPlayerAway('fra-fwd-11', 'Kylian Mbappe', 10, 3, 14, 10),
  fifaPlayerAway('fra-sub-12', 'Steve Mandanda', 16, 4, null, null),
  fifaPlayerAway('fra-sub-13', 'Marcus Thuram', 20, 4, null, null),
  fifaPlayerAway('fra-sub-14', 'Kingsley Coman', 21, 4, null, null),
]

// The full match detail fixture — the 2022 WC Final (Argentina vs France)
export const fifaMatchDetailFixture: FifaMatch = {
  IdMatch: FIFA_MATCH_ID,
  IdCompetition: '17',
  IdSeason: '255711',
  IdStage: 'stage-final',
  IdGroup: null,
  StageName: fifaLocale('Final'),
  MatchDay: '1',
  MatchNumber: 64,
  Date: '2022-12-18T15:00:00Z',
  LocalDate: '2022-12-18T19:00:00+04:00',
  MatchTime: '90+3',
  MatchStatus: 0, // FINISHED
  HomeTeamScore: 3,
  AwayTeamScore: 3,
  HomeTeamPenaltyScore: 4,
  AwayTeamPenaltyScore: 2,
  Winner: 'team-arg',
  ResultType: 2,
  Stadium: {
    Name: fifaLocale('Lusail Stadium'),
    CityName: fifaLocale('Lusail'),
    CountryName: fifaLocale('Qatar'),
  },
  HomeTeam: {
    IdTeam: 'team-arg',
    IdCountry: 'ARG',
    TeamName: fifaLocale('Argentina'),
    Tactics: '433',
    Score: 3,
    PictureUrl: 'https://img.fifa.com/teams/argentina.png',
    Abbreviation: 'ARG',
    Players: argPlayers,
    Goals: [
      {
        Type: 1,
        IdPlayer: 'arg-fwd-9',
        Minute: "23'",
        IdAssistPlayer: null,
        Period: 3,
        IdGoal: 'g1',
        IdTeam: 'team-arg',
      },
      {
        Type: 2,
        IdPlayer: 'arg-fwd-9',
        Minute: "108'",
        IdAssistPlayer: null,
        Period: 5,
        IdGoal: 'g2',
        IdTeam: 'team-arg',
      },
      // Penalty shootout goals — Period=11, Type=2
      {
        Type: 2,
        IdPlayer: 'arg-fwd-9',
        Minute: "1'",
        IdAssistPlayer: null,
        Period: 11,
        IdGoal: 'pen-arg-1',
        IdTeam: 'team-arg',
      },
      {
        Type: 2,
        IdPlayer: 'arg-mid-6',
        Minute: "2'",
        IdAssistPlayer: null,
        Period: 11,
        IdGoal: 'pen-arg-2',
        IdTeam: 'team-arg',
      },
      {
        Type: 2,
        IdPlayer: 'arg-mid-7',
        Minute: "3'",
        IdAssistPlayer: null,
        Period: 11,
        IdGoal: 'pen-arg-3',
        IdTeam: 'team-arg',
      },
      {
        Type: 2,
        IdPlayer: 'arg-def-2',
        Minute: "4'",
        IdAssistPlayer: null,
        Period: 11,
        IdGoal: 'pen-arg-4',
        IdTeam: 'team-arg',
      },
    ],
    Bookings: [
      {
        Card: 1, // yellow
        Period: 3,
        IdEvent: 'bk-1',
        EventNumber: 1,
        IdPlayer: 'arg-mid-8',
        IdCoach: null,
        IdTeam: 'team-arg',
        Minute: "37'",
        Reason: null,
      },
    ],
    Substitutions: [
      {
        IdEvent: 'sub-1',
        Period: 3,
        Reason: 0,
        SubstitutePosition: 1,
        IdPlayerOff: 'arg-mid-8',
        IdPlayerOn: 'arg-sub-13',
        PlayerOffName: fifaLocale('Rodrigo De Paul'),
        PlayerOnName: fifaLocale('Leandro Paredes'),
        Minute: "77'",
        IdTeam: 'team-arg',
      },
    ],
  },
  AwayTeam: {
    IdTeam: 'team-fra',
    IdCountry: 'FRA',
    TeamName: fifaLocale('France'),
    Tactics: '4231',
    Score: 3,
    PictureUrl: 'https://img.fifa.com/teams/france.png',
    Abbreviation: 'FRA',
    Players: fraPlayers,
    Goals: [
      {
        Type: 2,
        IdPlayer: 'fra-fwd-11',
        Minute: "80'",
        IdAssistPlayer: null,
        Period: 3,
        IdGoal: 'g3',
        IdTeam: 'team-fra',
      },
      {
        Type: 2,
        IdPlayer: 'fra-fwd-11',
        Minute: "118'",
        IdAssistPlayer: null,
        Period: 5,
        IdGoal: 'g4',
        IdTeam: 'team-fra',
      },
      {
        Type: 2,
        IdPlayer: 'fra-fwd-11',
        Minute: "1'",
        IdAssistPlayer: null,
        Period: 11,
        IdGoal: 'pen-fra-1',
        IdTeam: 'team-fra',
      },
      {
        Type: 2,
        IdPlayer: 'fra-mid-6',
        Minute: "2'",
        IdAssistPlayer: null,
        Period: 11,
        IdGoal: 'pen-fra-2',
        IdTeam: 'team-fra',
      },
    ],
    Bookings: [],
    Substitutions: [],
  },
}

// Calendar response with 3 matches across different gameweeks:
// - Group stage MD1 (gw 1)
// - Round of 16 (gw 4)
// - Final (gw 8)
export const fifaCalendarFixture: FifaCalendarResponse = {
  Results: [
    {
      IdMatch: 'fifa-match-group-md1',
      IdCompetition: '17',
      IdSeason: '255711',
      IdStage: 'stage-group',
      IdGroup: 'group-a',
      StageName: fifaLocale('Group A'),
      MatchDay: '1',
      MatchNumber: 1,
      Date: '2022-11-20T17:00:00Z',
      LocalDate: '2022-11-20T20:00:00+03:00',
      MatchTime: '90',
      MatchStatus: 0,
      HomeTeamScore: 0,
      AwayTeamScore: 0,
      Winner: null,
      ResultType: 0,
      HomeTeam: {
        IdTeam: 'team-qat',
        IdCountry: 'QAT',
        TeamName: fifaLocale('Qatar'),
        Tactics: '541',
        Score: 0,
        Players: [],
        Goals: [],
        Bookings: [],
        Substitutions: [],
        Abbreviation: 'QAT',
      },
      AwayTeam: {
        IdTeam: 'team-ecu',
        IdCountry: 'ECU',
        TeamName: fifaLocale('Ecuador'),
        Tactics: '442',
        Score: 2,
        Players: [],
        Goals: [],
        Bookings: [],
        Substitutions: [],
        Abbreviation: 'ECU',
      },
    },
    {
      IdMatch: 'fifa-match-r16',
      IdCompetition: '17',
      IdSeason: '255711',
      IdStage: 'stage-r16',
      IdGroup: null,
      StageName: fifaLocale('Round of 16'),
      MatchDay: '1',
      MatchNumber: 49,
      Date: '2022-12-03T15:00:00Z',
      LocalDate: '2022-12-03T18:00:00+03:00',
      MatchTime: '90',
      MatchStatus: 0,
      HomeTeamScore: 2,
      AwayTeamScore: 1,
      Winner: null,
      ResultType: 0,
      HomeTeam: {
        IdTeam: 'team-ned',
        IdCountry: 'NED',
        TeamName: fifaLocale('Netherlands'),
        Tactics: '433',
        Score: 2,
        Players: [],
        Goals: [],
        Bookings: [],
        Substitutions: [],
        Abbreviation: 'NED',
      },
      AwayTeam: {
        IdTeam: 'team-usa',
        IdCountry: 'USA',
        TeamName: fifaLocale('United States'),
        Tactics: '4231',
        Score: 1,
        Players: [],
        Goals: [],
        Bookings: [],
        Substitutions: [],
        Abbreviation: 'USA',
      },
    },
    {
      ...fifaMatchDetailFixture,
    },
  ],
  ContinuationToken: null,
}
