import type { ReactNode } from 'react'

export const POSITION_TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sp', label: 'SP' },
  { id: 'rp', label: 'RP' },
  { id: 'p', label: 'P' },
  { id: 'c', label: 'C' },
  { id: '1b', label: '1B' },
  { id: '2b', label: '2B' },
  { id: '3b', label: '3B' },
  { id: 'ss', label: 'SS' },
  { id: 'of', label: 'OF' },
  { id: 'dh', label: 'DH' },
  { id: 'if', label: 'IF' },
]

type LeagueFilter = 'all' | 'AL' | 'NL'

type Props = {
  search: string
  onSearchChange: (v: string) => void
  teamFilter: string
  onTeamFilterChange: (v: string) => void
  teams: string[]
  leagueFilter: LeagueFilter
  onLeagueFilterChange: (v: LeagueFilter) => void
  positionTab: string
  onPositionTabChange: (id: string) => void
  children?: ReactNode
}

const LEAGUE_SEGMENTS: { id: LeagueFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'AL', label: 'AL' },
  { id: 'NL', label: 'NL' },
]

export function FilterBar({
  search,
  onSearchChange,
  teamFilter,
  onTeamFilterChange,
  teams,
  leagueFilter,
  onLeagueFilterChange,
  positionTab,
  onPositionTabChange,
  children,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-1 overflow-x-auto pb-1">
        {POSITION_TABS.map((tab) => {
          const active = positionTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onPositionTabChange(tab.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-600'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Search name…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="min-w-[180px] flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <select
          value={teamFilter}
          onChange={(e) => onTeamFilterChange(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="all">All teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="inline-flex shrink-0 rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
          {LEAGUE_SEGMENTS.map((seg) => {
            const active = leagueFilter === seg.id
            return (
              <button
                key={seg.id}
                type="button"
                onClick={() => onLeagueFilterChange(seg.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white dark:bg-blue-600'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                }`}
              >
                {seg.label}
              </button>
            )
          })}
        </div>
        {children}
      </div>
    </div>
  )
}
