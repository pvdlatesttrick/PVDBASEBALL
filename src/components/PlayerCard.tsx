import { useEffect, useMemo, useState } from 'react'
import type { Player } from '@/types/player'
import { getPlayerType, getRotoDisplayKeys } from '@/types/player'
import { PositionPill } from '@/components/PositionPill'
import { StatGrid } from '@/components/StatGrid'
import { RotoBar } from '@/components/RotoBar'
import type { RotoBreakdown } from '@/hooks/useRotoRankings'

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
}

const sectionLabel = 'text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-4 first:mt-0 mb-2'

type Props = {
  player: Player | null
  open: boolean
  onClose: () => void
  boardRank: number | null
  rotoBreakdown: RotoBreakdown | null
  note: string
  onNoteChange: (text: string) => void
  drafted: boolean
  onToggleDrafted: () => void
  onMoveRank: (dir: -1 | 1) => void
  onWatchlistToggle: () => void
  onWatchlist: boolean
}

export function PlayerCard({
  player,
  open,
  onClose,
  boardRank,
  rotoBreakdown,
  note,
  onNoteChange,
  drafted,
  onToggleDrafted,
  onMoveRank,
  onWatchlistToggle,
  onWatchlist,
}: Props) {
  const [localNote, setLocalNote] = useState(note)

  useEffect(() => {
    setLocalNote(note)
  }, [note, player?.id])

  const reachValue = useMemo(() => {
    if (!player || boardRank === null) return null
    if (boardRank < player.adp) return 'reach' as const
    if (boardRank > player.adp) return 'value' as const
    return 'neutral' as const
  }, [player, boardRank])

  if (!player || !open) return null

  const playerType = getPlayerType(player.pos, player.name)
  const showHitting = playerType === 'hitter' || playerType === 'two-way'
  const showPitching = playerType === 'pitcher' || playerType === 'two-way'
  const rotoKeys = getRotoDisplayKeys(playerType)

  const hittingStandard =
    showHitting && player.hitting ? (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 font-mono text-sm tabular-nums dark:border-zinc-800 dark:bg-zinc-900/50 sm:grid-cols-3">
        <div>PA {player.hitting.pa}</div>
        <div>AVG {player.hitting.avg.toFixed(3)}</div>
        <div>OBP {player.hitting.obp.toFixed(3)}</div>
        <div>SLG {player.hitting.slg.toFixed(3)}</div>
        <div>OPS {player.hitting.ops.toFixed(3)}</div>
        <div>HR {player.hitting.hr}</div>
        <div>RBI {player.hitting.rbi}</div>
        <div>SB {player.hitting.sb}</div>
        <div>CS {player.hitting.cs}</div>
        <div>BB% {player.hitting.bbPct.toFixed(1)}</div>
        <div>K% {player.hitting.kPct.toFixed(1)}</div>
      </div>
    ) : null

  const pitchingStandard =
    showPitching && player.pitching ? (
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 font-mono text-sm tabular-nums dark:border-zinc-800 dark:bg-zinc-900/50 sm:grid-cols-3">
        <div>IP {player.pitching.ip.toFixed(1)}</div>
        <div>ERA {player.pitching.era.toFixed(2)}</div>
        <div>WHIP {player.pitching.whip.toFixed(2)}</div>
        <div>K/9 {player.pitching.k9.toFixed(1)}</div>
        <div>BB/9 {player.pitching.bb9.toFixed(1)}</div>
        <div>K-BB% {player.pitching.kbbPct.toFixed(1)}</div>
        <div>FIP {player.pitching.fip.toFixed(2)}</div>
        <div>xFIP {player.pitching.xfip.toFixed(2)}</div>
        <div>Sv {player.pitching.sv}</div>
        <div>Holds {player.pitching.holds}</div>
      </div>
    ) : null

  const hittingAdvanced =
    showHitting && player.advanced.kind === 'hitter' ? <StatGrid advanced={player.advanced} /> : null

  const pitchingAdvanced =
    showPitching && player.pitchingAdvanced ? (
      <StatGrid advanced={player.pitchingAdvanced} />
    ) : showPitching && player.advanced.kind === 'pitcher' ? (
      <StatGrid advanced={player.advanced} />
    ) : null

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-opacity dark:bg-black/50 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden
        onClick={onClose}
      />
      <aside
        className={`fixed z-50 flex h-full w-full flex-col border-zinc-200 bg-white shadow-2xl transition-transform duration-300 dark:border-zinc-800 dark:bg-zinc-950 md:inset-y-0 md:right-0 md:left-auto md:h-auto md:max-w-lg md:rounded-l-xl md:border-l ${
          open ? 'inset-0 translate-x-0' : 'inset-0 translate-x-full md:inset-y-0 md:right-0 md:left-auto'
        }`}
        role="dialog"
        aria-modal
        aria-labelledby="player-card-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-200 p-5 dark:border-zinc-800">
          <div className="flex gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-lg font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {initials(player.name)}
            </div>
            <div>
              <h2 id="player-card-title" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                {player.name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <PositionPill pos={player.pos} />
                <span className="text-sm text-zinc-500 dark:text-zinc-400">{player.team}</span>
                {boardRank !== null && (
                  <span className="text-sm tabular-nums text-zinc-600 dark:text-zinc-300">
                    Board #{boardRank}
                  </span>
                )}
                {reachValue === 'value' && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">vs ADP: value</span>
                )}
                {reachValue === 'reach' && (
                  <span className="text-xs font-medium text-rose-600 dark:text-rose-400">vs ADP: reach</span>
                )}
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-900">
                <span className="font-medium text-zinc-600 dark:text-zinc-400">fWAR</span>
                <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">{player.fWAR.toFixed(1)}</span>
              </div>
              {player.injury && (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
                  Injury: {player.injury}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">{player.writeup}</p>

          <section className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              2024 standard line
            </h3>
            {playerType === 'two-way' ? (
              <>
                {hittingStandard && (
                  <>
                    <h4 className={sectionLabel}>Hitting</h4>
                    {hittingStandard}
                  </>
                )}
                {pitchingStandard && (
                  <>
                    <h4 className={sectionLabel}>Pitching</h4>
                    {pitchingStandard}
                  </>
                )}
              </>
            ) : (
              <>
                {hittingStandard}
                {pitchingStandard}
              </>
            )}
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Advanced analytics
            </h3>
            {playerType === 'two-way' ? (
              <>
                {hittingAdvanced && (
                  <>
                    <h4 className={sectionLabel}>Hitting</h4>
                    {hittingAdvanced}
                  </>
                )}
                {pitchingAdvanced && (
                  <>
                    <h4 className={sectionLabel}>Pitching</h4>
                    {pitchingAdvanced}
                  </>
                )}
              </>
            ) : (
              <>
                {hittingAdvanced}
                {pitchingAdvanced}
              </>
            )}
          </section>

          <section className="mt-6">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Roto category ranks (pool)
            </h3>
            {rotoBreakdown ? (
              <RotoBar byCategory={rotoBreakdown.byCategory} keys={rotoKeys} />
            ) : (
              <p className="text-sm text-zinc-500">
                Not in current roto pool (e.g. drafted while &quot;exclude drafted&quot; is on).
              </p>
            )}
          </section>

          <section className="mt-6">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Scouting note
            </label>
            <textarea
              value={localNote}
              onChange={(e) => {
                setLocalNote(e.target.value)
                onNoteChange(e.target.value)
              }}
              rows={4}
              className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Your notes persist locally…"
            />
          </section>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onToggleDrafted}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium dark:border-zinc-600"
            >
              {drafted ? 'Mark available' : 'Mark drafted'}
            </button>
            <button
              type="button"
              onClick={() => onMoveRank(-1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600"
            >
              Rank ↑
            </button>
            <button
              type="button"
              onClick={() => onMoveRank(1)}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm dark:border-zinc-600"
            >
              Rank ↓
            </button>
            <button
              type="button"
              onClick={onWatchlistToggle}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                onWatchlist
                  ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-200'
                  : 'border-zinc-200 dark:border-zinc-600'
              }`}
            >
              {onWatchlist ? 'On watchlist' : 'Add to watchlist'}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
