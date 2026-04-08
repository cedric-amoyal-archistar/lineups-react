// Matches by gameweek response
export interface PLMatchesResponse {
  pagination: { _limit: number; _prev: string | null; _next: string | null }
  data: PLMatchSummary[]
}

export interface PLMatchSummary {
  matchId: string
  kickoff: string // "2026-04-11 12:30:00"
  kickoffTimezone: string // "BST" | "GMT"
  period: string // "PreMatch" | "FullTime" | "FirstHalf" | "SecondHalf"
  clock?: string // present for live matches
  homeTeam: PLTeamRef
  awayTeam: PLTeamRef
  competition: string
  ground: string // "Emirates Stadium, London"
}

export interface PLTeamRef {
  name: string
  id: string
  shortName: string
  abbr?: string
  score?: number
  halfTimeScore?: number
  redCards?: number
}

// Match detail (v2)
export interface PLMatchDetail {
  matchId: string
  kickoff: string
  kickoffTimezone: string
  period: string
  matchWeek: number
  competitionId: string
  seasonId: string
  clock?: string
  attendance?: number
  ground: string
  competition: string
  homeTeam: PLMatchDetailTeam
  awayTeam: PLMatchDetailTeam
}

export interface PLMatchDetailTeam extends PLTeamRef {
  score: number
  halfTimeScore: number
  redCards: number
}

// Lineups (v3)
export interface PLLineupsResponse {
  home_team: PLTeamLineup
  away_team: PLTeamLineup
}

export interface PLTeamLineup {
  teamId: string
  players: PLPlayer[]
  formation: PLFormation
}

export interface PLPlayer {
  firstName: string
  lastName: string
  shirtNum: string // string, needs Number() conversion
  isCaptain: boolean
  id: string
  position: string // "Goalkeeper" | "Defender" | "Midfielder" | "Forward"
  knownName?: string
}

export interface PLFormation {
  teamId: string
  formation: string // "4-2-3-1" (hyphenated)
  lineup: string[][] // 2D array: [[GK], [DEF...], [MID...], [FWD...]]
  subs: string[]
}

// Events (v1)
export interface PLEventsResponse {
  homeTeam: PLEventsSide
  awayTeam: PLEventsSide
}

export interface PLEventsSide {
  name: string
  id: string
  shortName: string
  goals: PLGoalEvent[]
  cards: PLCardEvent[]
  subs: PLSubEvent[]
}

export interface PLGoalEvent {
  goalType: string // "Goal" | "Penalty" | "Own"
  period: string
  assistPlayerId?: string | null
  time: string
  playerId: string
  timestamp: string
}

export interface PLCardEvent {
  period: string
  time: string
  type: string // "Yellow" | "StraightRed" | "Red"
  playerId: string
  timestamp: string
}

export interface PLSubEvent {
  period: string
  playerOnId: string
  playerOffId: string
  time: string
  timestamp: string
}

// Teams endpoint
export interface PLTeamsResponse {
  pagination: { _limit: number }
  data: PLTeam[]
}

export interface PLTeam {
  name: string
  id: string
  shortName: string
  abbr: string
  stadium?: { name: string; city: string; country: string; capacity: number }
}

// Squad endpoint
export interface PLSquadPlayer {
  id: string
  name: { first: string; last: string; display: string }
  position: string
  country: { isoCode: string }
  dates?: { birth?: string }
}
