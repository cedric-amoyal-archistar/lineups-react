export interface Ligue1MatchesResponse {
  matches: Ligue1Match[]
}

export interface Ligue1ClubIdentity {
  id: string
  name: string
  trigram: string
  primaryColor: string
  assets: {
    logo: { small: string; medium: string; large: string }
  }
}

export interface Ligue1MatchListSide {
  clubId: string
  score: number
  clubIdentity: Ligue1ClubIdentity
  bookings?: Ligue1Booking[]
}

export interface Ligue1Match {
  matchId: string
  championshipId: number
  gameWeekNumber: number
  date: string
  period: string
  matchTime: string
  isLive: boolean
  home: Ligue1MatchListSide
  away: Ligue1MatchListSide
}

export interface Ligue1MatchDetail {
  id: string
  championshipId: number
  season: number
  gameWeekNumber: number
  date: string
  period: string
  matchTime: string
  stadium?: {
    name: string
    address?: { city?: string }
  }
  home: Ligue1MatchSide
  away: Ligue1MatchSide
}

export interface Ligue1MatchSide {
  clubId: string
  score: number
  clubIdentity: Ligue1ClubIdentity
  formation: string
  manager: { firstName: string; lastName: string }
  goals: Ligue1Goal[]
  substitutions: Ligue1Substitution[]
  bookings: Ligue1Booking[]
  penaltyShots: Ligue1PenaltyShot[]
  players: Record<string, Ligue1Player>
}

export interface Ligue1Player {
  id: string
  formationPlace: number
  startedMatch: boolean
  sub: number
  position: number
  playerIdentity: {
    firstName: string
    lastName: string
    jerseyNumber: number
    countryName: string
    countryShortCode: string
    birthDate?: string
    assets?: {
      facePictures?: { small: string; medium: string; large: string }
    }
  }
  goals: number
  ownGoals: number
  shirtNumber: number
}

export interface Ligue1Goal {
  scorerId: string
  time: string
  timestamp: number
  type: string
  side: string
}

export interface Ligue1Substitution {
  subOffId: string
  subOnId: string
  time: string
  timestamp: number
  side: string
}

export interface Ligue1Booking {
  playerId: string
  type: string
  time: string
  timestamp: number
  side: string
}

export interface Ligue1PenaltyShot {
  playerId: string
  scored: boolean
  side: string
}
