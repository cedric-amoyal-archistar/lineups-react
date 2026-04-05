import type { TeamLineup } from '@/types/match'
import type { DisplayMode } from '@/types/common'
import { PlayerNode } from './PlayerNode'

function getPlayerName(player: { clubShirtName: string; internationalName: string }): string {
  return player.clubShirtName || player.internationalName
}

interface BenchListProps {
  lineup: TeamLineup
  displayMode: DisplayMode | string
}

export function BenchList({ lineup, displayMode }: BenchListProps) {
  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5 mb-3">
        <img
          src={lineup.team.mediumLogoUrl || lineup.team.logoUrl}
          className="h-7 w-7"
          alt={lineup.team.internationalName}
        />
        <span className="text-gray-800 text-xs font-semibold">{lineup.team.internationalName}</span>
        <span className="text-gray-400 text-[11px] font-medium tracking-wide uppercase ml-auto">
          Substitutes
        </span>
      </div>
      <div className="grid grid-cols-6 gap-x-1 gap-y-3">
        {lineup.bench.map((player) => (
          <PlayerNode
            key={player.player.id}
            jerseyNumber={player.jerseyNumber}
            name={getPlayerName(player.player)}
            fullName={player.player.internationalName}
            countryCode={player.player.countryCode}
            age={player.player.age}
            height={player.player.height}
            imageUrl={player.player.imageUrl}
            shirtColor={lineup.shirtColor}
            displayMode={displayMode}
          />
        ))}
      </div>
    </div>
  )
}
