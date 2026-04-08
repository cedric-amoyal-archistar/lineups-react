import { Link } from 'react-router-dom'
import { getAllProviders } from '@/providers/registry'

export function CompetitionPage() {
  const providers = getAllProviders()

  return (
    <div className="mx-auto max-w-lg py-8 px-0">
      <div className="text-center mb-8">
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          Choose a competition
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a competition to browse matches and lineups
        </p>
      </div>

      <div className="grid gap-3">
        {providers.map((provider) => (
          <Link key={provider.id} to={`/competition/${provider.id}`} className="group block">
            <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all group-hover:shadow-md group-hover:border-border/80 group-active:scale-[0.99]">
              <img
                src={provider.logoUrl}
                alt={provider.name}
                className="h-14 w-20 object-contain"
              />
              <div>
                <span className="text-sm font-semibold text-foreground">{provider.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">Browse matches and lineups</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
