const groupClass = (pos: string): string => {
  const p = pos.toUpperCase()
  if (p.includes('SP')) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-800'
  if (p.includes('RP')) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
  if (p === 'C' || p.startsWith('C/')) return 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-800'
  if (p.includes('OF') || p.includes('DH'))
    return 'bg-teal-100 text-teal-900 border-teal-200 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-800'
  return 'bg-violet-100 text-violet-900 border-violet-200 dark:bg-violet-950/60 dark:text-violet-200 dark:border-violet-800'
}

export function PositionPill({ pos }: { pos: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${groupClass(pos)}`}
    >
      {pos}
    </span>
  )
}
