import type { TeamLineup } from '@/types/match'
import type { DisplayMode } from '@/types/common'
import { PlayerNode } from './PlayerNode'

function getPlayerName(player: { clubShirtName: string; internationalName: string }): string {
  return player.clubShirtName || player.internationalName
}

interface TeamHalfProps {
  lineup: TeamLineup
  displayMode: DisplayMode | string
  inverted?: boolean
  matchDate?: string
}

export function TeamHalf({ lineup, displayMode, inverted = false, matchDate }: TeamHalfProps) {
  return (
    <div className="relative w-full" style={{ height: '280px' }}>
      {lineup.field.map((player) => (
        <div
          key={player.player.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            left: `${player.fieldCoordinate.x / 10}%`,
            top: inverted
              ? `${(1000 - player.fieldCoordinate.y) / 10}%`
              : `${player.fieldCoordinate.y / 10}%`,
          }}
        >
          <PlayerNode
            jerseyNumber={player.jerseyNumber}
            name={getPlayerName(player.player)}
            fullName={player.player.internationalName}
            countryCode={player.player.countryCode}
            age={player.player.age}
            birthDate={player.player.birthDate}
            matchDate={matchDate}
            height={player.player.height}
            imageUrl={player.player.imageUrl}
            shirtColor={lineup.shirtColor}
            displayMode={displayMode}
          />
        </div>
      ))}
    </div>
  )
}
