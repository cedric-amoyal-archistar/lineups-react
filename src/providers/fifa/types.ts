export interface FifaLocaleDescription {
  Locale: string
  Description: string
}

export interface FifaPlayer {
  IdPlayer: string
  PlayerName: FifaLocaleDescription[]
  ShirtNumber: number
  /** 0=GK 1=DEF 2=MID 3=FWD 4=bench/sub */
  Position: 0 | 1 | 2 | 3 | 4
  LineupX: number | null
  LineupY: number | null
  IdTeam: string
  IdCountry: string | null
}

export interface FifaGoal {
  Type: number
  IdPlayer: string
  Minute: string
  IdAssistPlayer: string | null
  Period: number
  IdGoal: string | null
  IdTeam: string
}

export interface FifaBooking {
  Card: number
  Period: number
  IdEvent: string | null
  EventNumber: number | null
  IdPlayer: string
  IdCoach: string | null
  IdTeam: string
  Minute: string
  Reason: string | null
}

export interface FifaSubstitution {
  IdEvent: string | null
  Period: number
  Reason: number
  SubstitutePosition: number
  IdPlayerOff: string
  IdPlayerOn: string
  PlayerOffName: FifaLocaleDescription[]
  PlayerOnName: FifaLocaleDescription[]
  Minute: string
  IdTeam: string
}

export interface FifaTeam {
  IdTeam: string
  IdCountry: string | null
  TeamName: FifaLocaleDescription[]
  Tactics: string
  Score: number | null
  Players: FifaPlayer[]
  Goals?: FifaGoal[]
  Bookings?: FifaBooking[]
  Substitutions?: FifaSubstitution[]
  PictureUrl?: string
  Abbreviation?: string
}

export interface FifaStadium {
  Name: FifaLocaleDescription[]
  CityName: FifaLocaleDescription[]
  CountryName: FifaLocaleDescription[]
}

export interface FifaMatch {
  IdMatch: string
  IdCompetition: string
  IdSeason: string
  IdStage: string
  IdGroup: string | null
  StageName: FifaLocaleDescription[]
  GroupName?: FifaLocaleDescription[]
  MatchDay: string
  MatchNumber: string | number
  Date: string
  LocalDate: string
  MatchTime: string
  MatchStatus: number
  // Live endpoint (/live/football/:id) returns HomeTeam/AwayTeam with Players.
  // Calendar endpoint (/calendar/matches) returns Home/Away without Players.
  // The provider normalizes Home→HomeTeam at fetch time.
  HomeTeam?: FifaTeam
  AwayTeam?: FifaTeam
  Home?: FifaTeam
  Away?: FifaTeam
  HomeTeamScore: number | null
  AwayTeamScore: number | null
  HomeTeamPenaltyScore?: number | null
  AwayTeamPenaltyScore?: number | null
  Winner: string | null
  ResultType: number | null
  Stadium?: FifaStadium
  Attendance?: string
  BallPossession?: { OverallHome: number; OverallAway: number }
}

export interface FifaCalendarResponse {
  Results: FifaMatch[]
  ContinuationToken: string | null
}
