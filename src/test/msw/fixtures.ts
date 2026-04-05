/**
 * UEFA API response fixtures shaped to match the TypeScript interfaces in src/types/match.ts.
 * Used by MSW handlers and imported directly in unit tests.
 */
import type { Match, MatchLineups } from '@/types/match'

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
