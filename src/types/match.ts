export interface Match {
  id: number | string
  homeTeam: TeamInMatch
  awayTeam: TeamInMatch
  kickOffTime: {
    date: string
    dateTime: string
    utcOffsetInHours: number
  }
  score?: {
    total: { home: number; away: number }
    regular: { home: number; away: number }
    aggregate?: { home: number; away: number }
    penalty?: { home: number; away: number }
  }
  winner?: {
    match?: { reason: string; team?: { id: string } }
    aggregate?: { reason: string; team?: { id: string } }
  }
  status: 'UPCOMING' | 'LIVE' | 'FINISHED'
  round: {
    metaData: {
      name: string
      type: string
    }
    phase: string
  }
  matchday: {
    longName: string
    name: string
    dateFrom: string
    dateTo: string
  }
  stadium?: {
    id: number
    translations: {
      officialName?: Record<string, string>
    }
    city: {
      translations: {
        name: Record<string, string>
      }
    }
  }
  competition: {
    id: string
    metaData: {
      name: string
    }
  }
  type?: string
  lineupStatus?: string
  leg?: {
    number: number
    translations?: {
      name: Record<string, string>
    }
  }
  playerEvents?: {
    scorers?: MatchEvent[]
    redCards?: MatchEvent[]
    penaltyScorers?: PenaltyEvent[]
  }
}

export interface MatchEvent {
  id: string
  phase: string
  teamId: string
  time: {
    minute: number
    second: number
    injuryMinute?: number
  }
  goalType?: string
  player: {
    clubShirtName: string
    internationalName: string
    countryCode: string
  }
}

export interface PenaltyEvent {
  id: string
  penaltyType: 'SCORED' | 'MISSED'
  phase: string
  teamId: string
  player: {
    clubShirtName?: string
    internationalName?: string
  }
}

export interface TeamInMatch {
  id: string
  internationalName: string
  logoUrl: string
  mediumLogoUrl: string
  bigLogoUrl: string
  countryCode: string
  teamCode: string
  translations: {
    displayName: Record<string, string>
    displayOfficialName: Record<string, string>
  }
}

export interface MatchLineups {
  matchId: number | string
  lineupStatus: string
  homeTeam: TeamLineup
  awayTeam: TeamLineup
}

export interface TeamLineup {
  team: {
    id: string
    internationalName: string
    logoUrl: string
    mediumLogoUrl: string
    bigLogoUrl: string
  }
  coaches?: Coach[]
  field: LineupPlayer[]
  bench: BenchPlayer[]
  shirtColor?: string
  kitImageUrl?: string
}

export interface LineupPlayer {
  jerseyNumber: number
  fieldCoordinate: { x: number; y: number }
  fspFieldCoordinate: { x: number; y: number }
  isBooked: boolean
  type: string
  player: PlayerInfo
}

export interface BenchPlayer {
  jerseyNumber: number
  isBooked: boolean
  type: string
  player: PlayerInfo
}

export interface PlayerInfo {
  id: string
  internationalName: string
  clubShirtName: string
  countryCode?: string
  fieldPosition: string
  nationalFieldPosition?: string
  detailedFieldPosition: string
  imageUrl: string
  age?: string | number
  birthDate?: string
  height?: string | number
  translations: {
    shortName: Record<string, string>
    name: Record<string, string>
  }
}

export interface Coach {
  person: {
    id: string
    countryCode: string
    translations: {
      name: Record<string, string>
      shortName: Record<string, string>
    }
  }
  imageUrl: string
}
