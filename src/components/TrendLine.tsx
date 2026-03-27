type TrendLineProps = {
  data: number[]
  color: string
}

export function TrendLine({ data, color }: TrendLineProps) {
  if (data.length === 0) {
    return (
      <svg viewBox="0 0 400 90" width="100%" height={72} className="text-zinc-300 dark:text-zinc-600">
        <line x1="0" y1="80" x2="400" y2="80" stroke="currentColor" strokeWidth="0.5" />
      </svg>
    )
  }
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const denom = Math.max(1, data.length - 1)
  const points = data.map((v, i) => ({
    x: (i / denom) * 400,
    y: 80 - ((v - min) / range) * 70,
  }))
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last = points[points.length - 1]
  return (
    <svg viewBox="0 0 400 90" width="100%" height={72}>
      <line
        x1="0"
        y1="80"
        x2="400"
        y2="80"
        stroke="var(--tw-prose-invert, rgb(228 228 231))"
        className="stroke-zinc-300 dark:stroke-zinc-600"
        strokeWidth="0.5"
      />
      <path d={d} fill="none" stroke={color} strokeWidth="2" />
      <circle cx={last.x} cy={last.y} r="3" fill={color} />
    </svg>
  )
}
