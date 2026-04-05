import type { MatchLineups } from '@/types/match'
import type { DisplayMode } from '@/types/common'
import { TeamHalf } from './TeamHalf'

interface PitchViewProps {
  lineups: MatchLineups
  displayMode: DisplayMode | string
  matchDate?: string
}

export function PitchView({ lineups, displayMode, matchDate }: PitchViewProps) {
  return (
    <div
      className="relative mx-auto w-full max-w-sm overflow-hidden rounded-2xl px-5 py-3 shadow-sm"
      style={{ background: '#e8fcf3' }}
    >
      {/* Home team header */}
      <div className="flex items-center gap-2.5 px-1 mb-2">
        <img
          src={lineups.homeTeam.team.mediumLogoUrl || lineups.homeTeam.team.logoUrl}
          className="h-7 w-7"
          alt={lineups.homeTeam.team.internationalName}
        />
        <span className="text-gray-800 text-xs font-semibold">
          {lineups.homeTeam.team.internationalName}
        </span>
        {lineups.homeTeam.coaches?.[0] && (
          <span className="text-gray-400 text-[11px] ml-auto italic">
            {lineups.homeTeam.coaches[0].person.translations.name.EN}
          </span>
        )}
      </div>

      {/* Pitch area */}
      <div className="relative">
        {/* Pitch markings */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border border-emerald-700/20 rounded-lg" />
          <div className="absolute left-0 right-0 top-1/2 border-t border-emerald-700/20" />
          <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-700/20" />
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-700/20" />
        </div>

        <TeamHalf lineup={lineups.homeTeam} displayMode={displayMode} matchDate={matchDate} />
        <TeamHalf lineup={lineups.awayTeam} displayMode={displayMode} inverted matchDate={matchDate} />
      </div>

      {/* Away team header */}
      <div className="flex items-center gap-2.5 px-1 mt-2">
        <img
          src={lineups.awayTeam.team.mediumLogoUrl || lineups.awayTeam.team.logoUrl}
          className="h-7 w-7"
          alt={lineups.awayTeam.team.internationalName}
        />
        <span className="text-gray-800 text-xs font-semibold">
          {lineups.awayTeam.team.internationalName}
        </span>
        {lineups.awayTeam.coaches?.[0] && (
          <span className="text-gray-400 text-[11px] ml-auto italic">
            {lineups.awayTeam.coaches[0].person.translations.name.EN}
          </span>
        )}
      </div>
    </div>
  )
}
