import type { LineupSlot, MLBGame } from '@/types/matchup'

const SCHEDULE = 'https://statsapi.mlb.com/api/v1/schedule'

type ScheduleJson = {
  dates?: { games?: ScheduleGame[] }[]
}

type ScheduleGame = {
  gamePk: number
  gameDate: string
  lineups?: {
    awayPlayers?: PersonStub[]
    homePlayers?: PersonStub[]
  }
  teams: {
    away: TeamSide
    home: TeamSide
  }
  venue?: { name?: string }
}

type TeamSide = {
  team: { id: number; abbreviation: string; name?: string }
  probablePitcher?: { id: number; fullName?: string }
}

type PersonStub = {
  id: number
  fullName?: string
  primaryPosition?: { abbreviation?: string }
}

type Person = {
  id: number
  fullName?: string
  batSide?: { code?: string }
  pitchHand?: { code?: string }
  primaryPosition?: { abbreviation?: string }
}

function todayYmdET(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  return `${y}-${m}-${d}`
}

function fmtTimeEt(iso: string): string {
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return '—'
  const t = dt.toLocaleTimeString('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: '2-digit',
  })
  return `${t} ET`
}

function batCode(code: string | undefined): 'L' | 'R' | 'S' {
  if (code === 'L' || code === 'R' || code === 'S') return code
  return 'R'
}

async function fetchPeopleMap(ids: number[]): Promise<Map<number, Person>> {
  const map = new Map<number, Person>()
  const uniq = [...new Set(ids)].filter((n) => n > 0)
  for (let i = 0; i < uniq.length; i += 50) {
    const chunk = uniq.slice(i, i + 50)
    const url = new URL('https://statsapi.mlb.com/api/v1/people')
    url.searchParams.set('personIds', chunk.join(','))
    const res = await fetch(url.toString())
    if (!res.ok) continue
    const j = (await res.json()) as { people?: Person[] }
    for (const p of j.people ?? []) {
      map.set(p.id, p)
    }
  }
  return map
}

function lineupFromStubs(
  players: PersonStub[] | undefined,
  people: Map<number, Person>
): LineupSlot[] {
  if (!players?.length) return []
  return players.slice(0, 9).map((pl, i) => {
    const full = people.get(pl.id)
    const name = pl.fullName ?? full?.fullName ?? `Player ${pl.id}`
    const pos = pl.primaryPosition?.abbreviation ?? full?.primaryPosition?.abbreviation ?? 'DH'
    const bats = batCode(full?.batSide?.code)
    return {
      battingOrder: i + 1,
      playerName: name,
      pos,
      bats,
    }
  })
}

export async function fetchMlbGamesForDate(date: string): Promise<MLBGame[]> {
  const url = new URL(SCHEDULE)
  url.searchParams.set('sportId', '1')
  url.searchParams.set('date', date)
  url.searchParams.set(
    'hydrate',
    'team,probablePitcher,venue,lineups,linescore,flags,seriesStatus'
  )

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Schedule ${res.status}`)
  const json = (await res.json()) as ScheduleJson
  const games = json.dates?.[0]?.games ?? []
  if (games.length === 0) return []

  const ids: number[] = []
  for (const g of games) {
    const ap = g.teams.away.probablePitcher?.id
    const hp = g.teams.home.probablePitcher?.id
    if (ap) ids.push(ap)
    if (hp) ids.push(hp)
    const aply = g.lineups?.awayPlayers
    const hply = g.lineups?.homePlayers
    for (const p of aply ?? []) ids.push(p.id)
    for (const p of hply ?? []) ids.push(p.id)
  }

  const people = await fetchPeopleMap(ids)

  const out: MLBGame[] = []
  for (const g of games) {
    const awayAbbr = g.teams.away.team.abbreviation
    const homeAbbr = g.teams.home.team.abbreviation
    const ap = g.teams.away.probablePitcher
    const hp = g.teams.home.probablePitcher
    const apFull = ap?.id ? people.get(ap.id) : undefined
    const hpFull = hp?.id ? people.get(hp.id) : undefined
    const awayName = ap?.fullName ?? 'TBD'
    const homeName = hp?.fullName ?? 'TBD'
    const awayHand = batCode(apFull?.pitchHand?.code)
    const homeHand = batCode(hpFull?.pitchHand?.code)

    const awayLineup = lineupFromStubs(g.lineups?.awayPlayers, people)
    const homeLineup = lineupFromStubs(g.lineups?.homePlayers, people)

    out.push({
      id: g.gamePk,
      gameTime: fmtTimeEt(g.gameDate),
      awayTeam: awayAbbr,
      homeTeam: homeAbbr,
      awayStarter: awayName,
      homeStarter: homeName,
      awayStarterHand: awayHand,
      homeStarterHand: homeHand,
      venue: g.venue?.name ?? 'TBD',
      awayLineup: awayLineup.length ? awayLineup : placeholderLineup('Away'),
      homeLineup: homeLineup.length ? homeLineup : placeholderLineup('Home'),
    })
  }

  return out
}

function placeholderLineup(label: string): LineupSlot[] {
  return Array.from({ length: 9 }, (_, i) => ({
    battingOrder: i + 1,
    playerName: `${label} batter ${i + 1}`,
    pos: 'DH',
    bats: 'R' as const,
  }))
}

export { todayYmdET }
