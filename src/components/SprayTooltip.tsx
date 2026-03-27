import type { BattedBallEvent } from '@/data/sprayChartData'

const TYPE_COLOR: Record<BattedBallEvent['type'], string> = {
  single: '#3b82f6',
  double: '#10b981',
  triple: '#f59e0b',
  hr: '#ef4444',
  lineout: '#64748b',
  flyout: '#94a3b8',
  groundout: '#78716c',
  popout: '#cbd5e1',
}

const TYPE_LABEL: Record<BattedBallEvent['type'], string> = {
  single: 'Single',
  double: 'Double',
  triple: 'Triple',
  hr: 'HR',
  lineout: 'Line out',
  flyout: 'Fly out',
  groundout: 'Ground out',
  popout: 'Pop out',
}

type Props = {
  event: BattedBallEvent
  /** Percent positions within chart wrapper (0–100) */
  anchorPct: { left: number; top: number }
  onClose: () => void
}

export function SprayTooltip({ event, anchorPct, onClose }: Props) {
  const [yr, mo, d] = event.date.split('-')
  const dateLabel = `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(mo) - 1] ?? 'Apr'} ${Number(d)}, ${yr}`

  return (
    <div
      className="pointer-events-auto absolute z-20 min-w-[220px] max-w-[min(92vw,280px)] rounded-lg border border-zinc-200 bg-white p-3 text-xs shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
      style={{
        left: `${anchorPct.left}%`,
        top: `${anchorPct.top}%`,
        transform: 'translate(-50%, calc(-100% - 10px))',
      }}
      role="dialog"
    >
      <div className="mb-2 flex items-start gap-2">
        <span
          className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: TYPE_COLOR[event.type] }}
          title={TYPE_LABEL[event.type]}
        />
        <div className="font-medium text-zinc-900 dark:text-zinc-100">
          {dateLabel} {event.opponent}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto shrink-0 rounded px-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <p className="text-zinc-600 dark:text-zinc-300">
        Exit velo: {event.exitVelo.toFixed(1)} mph · Launch angle: {event.launchAngle.toFixed(0)}° · Distance:{' '}
        {event.distance} ft
      </p>
      <hr className="my-2 border-zinc-200 dark:border-zinc-700" />
      <p className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200">{event.gameBoxScore.playerLine}</p>
      <p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
        {event.gameBoxScore.teamScore.replace(',', ' ·')}
      </p>
    </div>
  )
}
