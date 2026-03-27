import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import type { Player } from '@/types/player'
import {
  BALLPARKS,
  ballparkForTeam,
  getOutfieldWallPath,
  getWarningTrackPath,
  angleDegFromPoint,
  wallDistanceAtAngle,
  polarToSvg,
  HOME_PLATE,
} from '@/data/ballparks'
import type { Ballpark } from '@/data/ballparks'
import { getSprayEventsForPlayer, type BattedBallEvent } from '@/data/sprayChartData'
import { SprayTooltip } from '@/components/SprayTooltip'

/**
 * Interactive spray chart — SVG field `viewBox="0 0 500 460"`, home plate (250, 420).
 * Batted-ball data is derived per player in `getSprayEventsForPlayer` (memoized by `player`).
 */
export type SprayChartProps = {
  player: Player
}

const DOT: Record<BattedBallEvent['type'], string> = {
  single: '#3b82f6',
  double: '#10b981',
  triple: '#f59e0b',
  hr: '#ef4444',
  lineout: '#64748b',
  flyout: '#94a3b8',
  groundout: '#78716c',
  popout: '#cbd5e1',
}

type FilterMode = 'all' | 'hits' | 'hard' | 'hr'
type HandFilter = 'all' | 'L' | 'R'

function fairGrassPolygonPath(park: Ballpark): string {
  const steps = 48
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const angleDeg = 45 - t * 90
    const d = wallDistanceAtAngle(park, angleDeg)
    pts.push(polarToSvg(d, angleDeg))
  }
  return `M ${HOME_PLATE.x} ${HOME_PLATE.y} ${pts.map((p) => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')} Z`
}

function isHit(t: BattedBallEvent['type']): boolean {
  return t === 'single' || t === 'double' || t === 'triple' || t === 'hr'
}

function countHrCleared(hrEvents: BattedBallEvent[], park: Ballpark): number {
  return hrEvents.filter((e) => {
    const ang = angleDegFromPoint(e.x, e.y)
    const need = wallDistanceAtAngle(park, ang)
    return e.distance >= need * 0.96
  }).length
}

export function SprayChart({ player }: SprayChartProps) {
  const clipUid = useId().replace(/:/g, '')
  const homePark = useMemo(() => ballparkForTeam(player.team), [player.team])
  const [viewParkId, setViewParkId] = useState(homePark.id)
  const viewPark = BALLPARKS.find((b) => b.id === viewParkId) ?? homePark

  useEffect(() => {
    setViewParkId(homePark.id)
  }, [player.id, homePark.id])

  const events = useMemo(() => getSprayEventsForPlayer(player), [player])
  const [filter, setFilter] = useState<FilterMode>('all')
  const [hand, setHand] = useState<HandFilter>('all')
  const [selected, setSelected] = useState<BattedBallEvent | null>(null)

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (hand !== 'all' && e.pitcherHand !== hand) return false
      if (filter === 'hits' && !isHit(e.type)) return false
      if (filter === 'hard' && e.exitVelo < 95) return false
      if (filter === 'hr' && e.type !== 'hr') return false
      return true
    })
  }, [events, filter, hand])

  const hrEvents = useMemo(() => events.filter((e) => e.type === 'hr'), [events])
  const hrHome = useMemo(() => countHrCleared(hrEvents, homePark), [hrEvents, homePark])
  const hrView = useMemo(() => countHrCleared(hrEvents, viewPark), [hrEvents, viewPark])
  const hrDelta = hrView - hrHome

  const fairPath = useMemo(() => fairGrassPolygonPath(homePark), [homePark])
  const wallPath = useMemo(() => getOutfieldWallPath(homePark), [homePark])
  const warnPath = useMemo(() => getWarningTrackPath(homePark), [homePark])
  const overlayWall = useMemo(() => {
    if (viewPark.id === homePark.id) return null
    return getOutfieldWallPath(viewPark)
  }, [viewPark, homePark])

  const onSvgPointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const el = e.target as Element
    if (el.closest('[data-spray-dot="1"]')) return
    setSelected(null)
  }, [])

  const lfLine = polarToSvg(360, 45)
  const rfLine = polarToSvg(360, -45)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">Viewing in:</span>
        <select
          value={viewParkId}
          onChange={(e) => setViewParkId(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900"
        >
          {BALLPARKS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.id === homePark.id ? " (player's home)" : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-1.5 text-xs">
        {(['all', 'hits', 'hard', 'hr'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setFilter(m)}
            className={`rounded-full border px-2.5 py-1 font-medium ${
              filter === m
                ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-600'
                : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
            }`}
          >
            {m === 'all' ? 'All' : m === 'hits' ? 'Hits only' : m === 'hard' ? 'Hard hit' : 'HR'}
          </button>
        ))}
        <span className="mx-1 text-zinc-300 dark:text-zinc-600">|</span>
        <span className="self-center text-zinc-500">PA split:</span>
        {(['all', 'L', 'R'] as const).map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => setHand(h)}
            className={`rounded-full border px-2.5 py-1 font-medium ${
              hand === h
                ? 'border-amber-600 bg-amber-500 text-white dark:border-amber-500 dark:bg-amber-600'
                : 'border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
            }`}
          >
            {h === 'all' ? 'All' : h === 'L' ? 'vs LHP' : 'vs RHP'}
          </button>
        ))}
      </div>

      {viewPark.id !== homePark.id && (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
          <span className="inline-block h-0.5 w-8 align-middle border-t-2 border-amber-500" /> Home wall
          <span className="mx-2 inline-block h-0.5 w-8 align-middle border-t-2 border-dashed border-amber-500" />{' '}
          {viewPark.name}
        </p>
      )}

      <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-900 dark:border-zinc-700">
        <svg
          viewBox="0 0 500 460"
          className="block w-full max-w-full touch-manipulation"
          onPointerDown={onSvgPointerDown}
          role="img"
          aria-label="Hit spray chart"
        >
          <defs>
            <clipPath id={`sprayClip-${clipUid}`}>
              <rect x="0" y="0" width="500" height="460" />
            </clipPath>
          </defs>

          <g clipPath={`url(#sprayClip-${clipUid})`}>
            <rect x="0" y="0" width="500" height="460" fill="#1e3d10" />

            <path d={fairPath} fill="#2d5a1b" stroke="none" />

            <path d={warnPath} fill="none" stroke="#a0714f" strokeWidth={10} strokeLinejoin="round" opacity={0.85} />

            <path d={wallPath} fill="none" stroke="#ffffff" strokeWidth={2} opacity={0.9} />

            {overlayWall && (
              <path
                d={overlayWall}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="6 3"
                opacity={0.95}
              />
            )}

            <path
              d="M 250 418 L 200 360 L 250 295 L 300 360 Z"
              fill="#c4883a"
              stroke="#a07030"
              strokeWidth={1}
              opacity={0.95}
            />

            <path
              d="M 250 418 L 180 330 L 250 250 L 320 330 Z"
              fill="none"
              stroke="#c4883a"
              strokeWidth={14}
              strokeLinejoin="round"
              opacity={0.35}
            />

            <line
              x1={HOME_PLATE.x}
              y1={HOME_PLATE.y}
              x2={lfLine.x}
              y2={lfLine.y}
              stroke="#ffffff"
              strokeWidth={1}
              opacity={0.85}
            />
            <line
              x1={HOME_PLATE.x}
              y1={HOME_PLATE.y}
              x2={rfLine.x}
              y2={rfLine.y}
              stroke="#ffffff"
              strokeWidth={1}
              opacity={0.85}
            />

            <ellipse cx={250} cy={338} rx={18} ry={10} fill="#b87a32" stroke="#a07030" strokeWidth={1} opacity={0.95} />

            <circle cx={250} cy={355} r={11} fill="#c4883a" stroke="#a07030" strokeWidth={1} />

            <rect x={246} y={412} width={8} height={8} fill="#ffffff" stroke="#ccc" strokeWidth={0.5} transform="rotate(45 250 416)" />

            {[[300, 360], [250, 295], [200, 360]].map(([x, y], i) => (
              <rect key={i} x={x - 4} y={y - 4} width={8} height={8} fill="#ffffff" stroke="#ccc" strokeWidth={0.5} rx={1} />
            ))}

            {filtered.map((e) => {
              const hit = isHit(e.type)
              const r = e.type === 'hr' ? 9 : hit ? 7 : 5
              const hard = e.hardHit || e.exitVelo >= 95
              const stroke = hard ? '#ffffff' : 'transparent'
              const sw = hard ? 1.5 : 0
              return (
                <circle
                  key={e.id}
                  data-spray-dot="1"
                  cx={e.x}
                  cy={e.y}
                  r={r}
                  fill={DOT[e.type]}
                  stroke={stroke}
                  strokeWidth={sw}
                  className="cursor-pointer"
                  onPointerDown={(ev) => {
                    ev.stopPropagation()
                    setSelected(e)
                  }}
                />
              )
            })}
          </g>
        </svg>

        {selected && (
          <SprayTooltip
            event={selected}
            anchorPct={{ left: (selected.x / 500) * 100, top: (selected.y / 460) * 100 }}
            onClose={() => setSelected(null)}
          />
        )}
      </div>

      {events.some((e) => e.type === 'hr') && (
        <p className="text-center text-[11px] text-zinc-600 dark:text-zinc-400">
          In <span className="font-medium text-zinc-800 dark:text-zinc-200">{homePark.name}</span>: {hrHome} HR → In{' '}
          <span className="font-medium text-zinc-800 dark:text-zinc-200">{viewPark.name}</span>: {hrView} HR
          {viewPark.id !== homePark.id && (
            <span className={hrDelta >= 0 ? ' text-emerald-600' : ' text-rose-600'}>
              {' '}
              ({hrDelta >= 0 ? '+' : ''}
              {hrDelta} vs home-park wall)
            </span>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-600 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#3b82f6]" /> Single
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#10b981]" /> Double
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> Triple
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#ef4444]" /> HR
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#64748b]" /> Line out
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#94a3b8]" /> Fly out
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#78716c]" /> Ground out
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-[#cbd5e1]" /> Pop out
        </span>
        <span className="text-zinc-500">◎ = Hard hit (95+ mph)</span>
      </div>
    </div>
  )
}
