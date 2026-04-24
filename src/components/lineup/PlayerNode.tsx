import { memo, useState } from 'react'
import { getFlagUrl } from '@/hooks/useCountryFlag'
import type { DisplayMode } from '@/types/common'

function isLightColor(hex: string): boolean {
  const c = hex.replace('#', '')
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  // Relative luminance (sRGB)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6
}

import { computeMatchDayAge } from '@/lib/playerAge'

interface PlayerNodeProps {
  jerseyNumber: number
  name: string
  fullName: string
  countryCode?: string
  age?: string | number
  birthDate?: string
  matchDate?: string
  height?: string | number
  imageUrl?: string
  clubName?: string
  clubLogoUrl?: string
  shirtColor?: string
  displayMode?: DisplayMode
}

export const PlayerNode = memo(function PlayerNode({
  jerseyNumber,
  name,
  fullName,
  countryCode,
  age,
  birthDate,
  matchDate,
  height,
  imageUrl,
  clubName,
  clubLogoUrl,
  shirtColor,
  displayMode,
}: PlayerNodeProps) {
  const displayAge = computeMatchDayAge({ birthDate, matchDate, currentAge: age })
  const flagUrl = countryCode ? getFlagUrl(countryCode) : ''
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(fullName)}`

  const [clubLogoErrorUrl, setClubLogoErrorUrl] = useState<string | undefined>(undefined)
  const clubLogoError = clubLogoErrorUrl === clubLogoUrl

  const isFlag = displayMode === 'countryCode'
  const isPhoto = displayMode === 'imageUrl'
  const isClubLogo = displayMode === 'clubLogo'
  const showLight = isFlag || isPhoto || isClubLogo

  const bgColor = showLight ? '#e5e7eb' : (shirtColor ?? '#1a2a4a')
  const needsDarkText = !showLight && isLightColor(bgColor)
  const borderClass = isClubLogo
    ? 'border-gray-300'
    : showLight
      ? 'border-white/80'
      : 'border-white/60'

  const clubLogoTitle = isClubLogo ? (clubName ? `${fullName} — ${clubName}` : fullName) : undefined

  function getClubInitials(name: string): string {
    const parts = name.trim().split(/\s+/)
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  function renderInner() {
    if (isClubLogo) {
      if (clubLogoUrl && !clubLogoError) {
        return (
          <img
            src={clubLogoUrl}
            alt={`${clubName || 'Club'} logo`}
            className="h-full w-full object-contain p-0.5"
            onError={() => setClubLogoErrorUrl(clubLogoUrl)}
          />
        )
      }
      if (clubName) {
        return (
          <div className="flex items-center justify-center h-full w-full">
            <span className="text-[10px] font-bold tracking-wide text-gray-700">
              {getClubInitials(clubName)}
            </span>
          </div>
        )
      }
      if (countryCode && flagUrl) {
        return <img src={flagUrl} alt={countryCode} className="h-full w-full object-cover" />
      }
      return <span>{jerseyNumber}</span>
    }

    if (isFlag && flagUrl) {
      return <img src={flagUrl} alt={countryCode} className="h-full w-full object-cover" />
    }
    if (isFlag) {
      return <span>{jerseyNumber}</span>
    }
    if (isPhoto && imageUrl) {
      return <img src={imageUrl} alt={fullName} className="h-full w-full object-cover" />
    }
    if (displayMode === 'clubJerseyNumber') {
      return <span>{jerseyNumber}</span>
    }
    if (displayMode === 'age') {
      return <span>{displayAge ?? '-'}</span>
    }
    if (displayMode === 'height') {
      return <span>{height ?? '-'}</span>
    }
    return <span>{jerseyNumber}</span>
  }

  return (
    <a
      href={searchUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center gap-0.5 w-14 cursor-pointer no-underline group/player"
    >
      <div
        title={clubLogoTitle}
        className={`flex items-center justify-center rounded-full border-2 font-bold h-9 w-9 text-xs overflow-hidden shadow-sm transition-transform group-hover/player:scale-110 ${needsDarkText ? 'text-gray-900' : 'text-white'} ${borderClass}`}
        style={{ backgroundColor: bgColor }}
      >
        {renderInner()}
      </div>
      <span className="text-center leading-tight truncate w-full text-[10px] font-medium text-gray-600">
        {name}
      </span>
    </a>
  )
})
