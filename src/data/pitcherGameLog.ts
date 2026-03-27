/** One 2024 regular-season start for a pitcher — includes opponent lineup handedness mix. */
export type PitcherGameLogEntry = {
  date: string
  opponent: string
  lineupLhh: number
  lineupRhh: number
  lineupSh: number
  ip: number
  er: number
  h: number
  bb: number
  k: number
}

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

/** Deterministic pseudo-random in [0, 1) from seed. */
function rnd(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
}

/** ~24 starts per pitcher — stable across reloads; use for historical comps. */
export function buildPitcherGameLog(pitcherName: string): PitcherGameLogEntry[] {
  const r = rnd(hashString(pitcherName))
  const n = 24
  const out: PitcherGameLogEntry[] = []
  const months = [4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 9, 9, 9]
  const days = [3, 10, 17, 2, 9, 16, 23, 1, 8, 22, 29, 5, 12, 19, 26, 2, 9, 16, 30, 6, 13, 20, 27, 29]

  for (let i = 0; i < n; i++) {
    const lineupLhh = 2 + Math.floor(r() * 4)
    const lineupRhh = 3 + Math.floor(r() * 4)
    const lineupSh = Math.max(0, 9 - lineupLhh - lineupRhh)
    const ip = 5 + Math.floor(r() * 4) + (r() > 0.85 ? 1 : 0)
    const er = Math.max(0, Math.floor(r() * 2.2 + (r() > 0.7 ? 2 : 0)))
    const h = Math.max(er, Math.floor(ip * 0.85 + r() * 4))
    const bb = Math.floor(r() * 3)
    const k = Math.floor(ip * r() * 2.2 + 3)
    out.push({
      date: `2024-${String(months[i]).padStart(2, '0')}-${String(days[i % days.length]).padStart(2, '0')}`,
      opponent: `OPP${(i % 15) + 1}`,
      lineupLhh,
      lineupRhh,
      lineupSh,
      ip,
      er,
      h,
      bb,
      k,
    })
  }
  return out
}

const CACHE = new Map<string, PitcherGameLogEntry[]>()

/** ~24 starts per pitcher — deterministic from name; used for historical comps. */
export function getPitcherGameLog(pitcherName: string): PitcherGameLogEntry[] {
  let g = CACHE.get(pitcherName)
  if (!g) {
    g = buildPitcherGameLog(pitcherName)
    CACHE.set(pitcherName, g)
  }
  return g
}
