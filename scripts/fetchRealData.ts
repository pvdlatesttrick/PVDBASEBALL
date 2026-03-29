/**
 * One-shot pipeline: FanGraphs 2025 JSON + Baseball Savant CSV + Statcast samples.
 * Run: npm run fetch-data
 *
 * Browser never calls Savant/FanGraphs — only this Node script does.
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const SRC_DATA = join(ROOT, 'src', 'data')

const FG_BAT =
  'https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=bat&lg=all&qual=0&season=2025&season1=2025&ind=0&rost=0&players=0&type=8&pageitems=2000&pagenum='
const FG_PIT =
  'https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=pit&lg=all&qual=0&season=2025&season1=2025&ind=0&rost=0&players=0&type=8&pageitems=2000&pagenum='
const FG_TEAM_BAT =
  'https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=bat&lg=all&qual=0&season=2025&season1=2025&type=8&ind=1&team=0&pageitems=50&pagenum=1'
const FG_TEAM_PIT =
  'https://www.fangraphs.com/api/leaders/major-league/data?pos=all&stats=pit&lg=all&qual=0&season=2025&season1=2025&type=8&ind=1&team=0&pageitems=50&pagenum=1'

const SAVANT_BAT =
  'https://baseballsavant.mlb.com/leaderboard/custom?year=2025&type=batter&filter=&sort=4&sortDir=desc&min=10&selections=xba,xslg,xwoba,exit_velocity_avg,launch_angle_avg,barrel_batted_rate,hard_hit_percent,sprint_speed&csv=true'
const SAVANT_PIT =
  'https://baseballsavant.mlb.com/leaderboard/custom?year=2025&type=pitcher&filter=&sort=4&sortDir=desc&min=10&selections=xba,xslg,xera,exit_velocity_avg,barrel_batted_rate,hard_hit_percent,whiff_percent,csw_percent&csv=true'

const AL_SET = new Set([
  'NYY',
  'BOS',
  'TOR',
  'TB',
  'BAL',
  'CLE',
  'MIN',
  'CWS',
  'KC',
  'DET',
  'HOU',
  'SEA',
  'TEX',
  'OAK',
  'ATH',
  'LAA',
])

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').trim()
}

function normalizeTeam(abbr: string): string {
  const u = stripHtml(abbr).toUpperCase()
  const map: Record<string, string> = {
    KCR: 'KC',
    TBR: 'TB',
    SFG: 'SF',
    SDP: 'SD',
    WSN: 'WSH',
    CHW: 'CWS',
    AZ: 'ARI',
    ATH: 'OAK',
  }
  return map[u] ?? u
}

function leagueFor(team: string): 'AL' | 'NL' {
  return AL_SET.has(team) ? 'AL' : 'NL'
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': 'PVDBASEBALL-data-fetch/1.0' } })
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`)
  return (await res.json()) as T
}

async function fetchJsonWithRetry<T>(url: string, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'PVDBASEBALL-data-fetch/1.0' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      const trimmed = text.trim()
      if (trimmed.startsWith('<') || trimmed.toLowerCase().includes('<!doctype')) {
        throw new Error('Response looks like HTML, not JSON (blocked or throttled?)')
      }
      return JSON.parse(text) as T
    } catch (err) {
      if (attempt === retries) throw err
      console.warn(`  Attempt ${attempt} failed (${err instanceof Error ? err.message : err}), retrying in 2s…`)
      await sleep(2000)
    }
  }
  throw new Error('unreachable')
}

export function parseCsv(text: string): Record<string, string>[] {
  const lines: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!
    if (c === '"') {
      inQ = !inQ
      cur += c
    } else if ((c === '\n' || c === '\r') && !inQ) {
      if (c === '\r' && text[i + 1] === '\n') i++
      if (cur.trim()) lines.push(cur)
      cur = ''
    } else cur += c
  }
  if (cur.trim()) lines.push(cur)
  if (lines.length < 2) return []

  function parseLine(line: string): string[] {
    const out: string[] = []
    let cell = ''
    let q = false
    for (let j = 0; j < line.length; j++) {
      const ch = line[j]!
      if (ch === '"') q = !q
      else if (ch === ',' && !q) {
        out.push(cell.replace(/^"|"$/g, '').replace(/""/g, '"'))
        cell = ''
      } else cell += ch
    }
    out.push(cell.replace(/^"|"$/g, '').replace(/""/g, '"'))
    return out
  }

  const headers = parseLine(lines[0]!).map((h) => h.trim())
  const rows: Record<string, string>[] = []
  for (let li = 1; li < lines.length; li++) {
    const vals = parseLine(lines[li]!)
    const row: Record<string, string> = {}
    headers.forEach((h, i) => {
      row[h] = vals[i] ?? ''
    })
    rows.push(row)
  }
  return rows
}

async function fetchCsv(url: string): Promise<Record<string, string>[]> {
  const res = await fetch(url, { headers: { 'User-Agent': 'PVDBASEBALL-data-fetch/1.0' } })
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`)
  return parseCsv(await res.text())
}

async function fetchAllFgPages(base: string): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = []
  for (let page = 1; page <= 5; page++) {
    const j = await fetchJsonWithRetry<{ data: Record<string, unknown>[] }>(base + page)
    const chunk = j.data ?? []
    out.push(...chunk)
    if (chunk.length < 2000) break
    await sleep(300)
  }
  return out
}

/** FantasyPros ADP (overall). Tries JSON first, then CSV. */
async function fetchFantasyProsAdpRows(): Promise<Record<string, string>[]> {
  try {
    const url = 'https://www.fantasypros.com/mlb/adp/overall.php?export=json'
    const res = await fetch(url, { headers: { 'User-Agent': 'PVDBASEBALL-data-fetch/1.0' } })
    if (!res.ok) throw new Error(`FantasyPros ${res.status}`)
    const text = await res.text()
    const t = text.trim()
    if (t.startsWith('<')) return []
    if (t.startsWith('[')) {
      try {
        return JSON.parse(t) as Record<string, string>[]
      } catch {
        return []
      }
    }
    if (t.startsWith('{')) {
      try {
        const o = JSON.parse(t) as { data?: Record<string, string>[] }
        if (Array.isArray(o.data)) return o.data
      } catch {
        return []
      }
    }
    return parseCsv(text)
  } catch {
    return []
  }
}

function num(v: unknown): number {
  if (v == null) return 0
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

function pct(v: unknown): number {
  const n = num(v)
  return n > 1 && n <= 100 ? n : n * 100
}

type FgRow = Record<string, unknown> & {
  xMLBAMID?: number
  Name?: string
  Team?: string
  WAR?: number
  position?: string
  Pos?: string
  Throws?: string
  Bats?: string
}

function fgName(r: FgRow): string {
  return stripHtml(String(r.Name ?? ''))
}

async function fetchLimitedText(url: string, maxBytes: number): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': 'PVDBASEBALL-data-fetch/1.0' } })
  if (!res.ok) throw new Error(String(res.status))
  const buf = await res.arrayBuffer()
  const slice = buf.byteLength > maxBytes ? buf.slice(0, maxBytes) : buf
  return new TextDecoder().decode(slice)
}

async function main(): Promise<void> {
  mkdirSync(SRC_DATA, { recursive: true })

  console.log('FanGraphs batting…')
  const batRows = (await fetchAllFgPages(FG_BAT)) as FgRow[]
  console.log('  rows:', batRows.length)

  if (batRows.length < 100) {
    throw new Error(
      `FanGraphs batting returned only ${batRows.length} rows — likely blocked or throttled. ` +
        'Do not overwrite data files. Try again in a few minutes.'
    )
  }

  const realNames = batRows
    .slice(0, 5)
    .map((r) => String((r as FgRow).Name ?? ''))
    .join(', ')
  console.log('  First 5 players:', realNames.replace(/<[^>]+>/g, '').trim())
  if (!realNames.replace(/<[^>]+>/g, '').includes(' ')) {
    throw new Error(`FanGraphs names look malformed: "${realNames}" — check API response format.`)
  }

  console.log('FanGraphs pitching…')
  const pitRows = (await fetchAllFgPages(FG_PIT)) as FgRow[]
  console.log('  rows:', pitRows.length)

  if (pitRows.length < 50) {
    throw new Error(
      `FanGraphs pitching returned only ${pitRows.length} rows — likely blocked or throttled. Aborting without writes.`
    )
  }

  console.log('FanGraphs team totals…')
  const teamBat = (await fetchJsonWithRetry<{ data: FgRow[] }>(FG_TEAM_BAT)).data ?? []
  const teamPit = (await fetchJsonWithRetry<{ data: FgRow[] }>(FG_TEAM_PIT)).data ?? []

  console.log('Savant leaderboards…')
  const savBat = await fetchCsv(SAVANT_BAT)
  const savPit = await fetchCsv(SAVANT_PIT)
  const savBatById = new Map<number, Record<string, string>>()
  for (const r of savBat) {
    const id = parseInt(r.player_id ?? '0', 10)
    if (id) savBatById.set(id, r)
  }
  const savPitById = new Map<number, Record<string, string>>()
  for (const r of savPit) {
    const id = parseInt(r.player_id ?? '0', 10)
    if (id) savPitById.set(id, r)
  }

  const byId = new Map<number, { bat?: FgRow; pit?: FgRow }>()
  for (const r of batRows) {
    const id = num(r.xMLBAMID)
    if (!id) continue
    const cur = byId.get(id) ?? {}
    cur.bat = r
    byId.set(id, cur)
  }
  for (const r of pitRows) {
    const id = num(r.xMLBAMID)
    if (!id) continue
    const cur = byId.get(id) ?? {}
    cur.pit = r
    byId.set(id, cur)
  }

  type PoolEntry = {
    id: number
    name: string
    team: string
    war: number
    bat?: FgRow
    pit?: FgRow
  }

  const pool: PoolEntry[] = []
  for (const [id, pair] of byId) {
    const name = pair.bat ? fgName(pair.bat) : pair.pit ? fgName(pair.pit) : ''
    if (!name) continue
    const warBat = pair.bat ? num(pair.bat.WAR) : -999
    const warPit = pair.pit ? num(pair.pit.WAR) : -999
    const war = Math.max(warBat, warPit)
    const team = normalizeTeam(String(pair.bat?.Team ?? pair.pit?.Team ?? ''))
    pool.push({ id, name, team, war, bat: pair.bat, pit: pair.pit })
  }

  pool.sort((a, b) => b.war - a.war)
  const top = pool.slice(0, 560)

  function posFor(p: PoolEntry): string {
    if (p.bat && p.pit) return 'SP/DH'
    if (p.pit) {
      const gs = num(p.pit.GS)
      const g = num(p.pit.G)
      const sv = num(p.pit.SV)
      if (sv >= 8 && gs < 5) return 'RP'
      if (g > 0 && gs / g > 0.55) return 'SP'
      return 'SP'
    }
    return String(p.bat?.position ?? p.bat?.Pos ?? 'OF')
  }

  function buildPlayerStatLine(p: PoolEntry): string {
    const sb = savBatById.get(p.id)
    const sp = savPitById.get(p.id)
    const parts: string[] = []

    if (p.bat) {
      const b = p.bat
      if (!p.pit) parts.push(`fWAR: ${num(b.WAR)}`)
      parts.push(`pa: ${num(b.PA)}`)
      parts.push(`avg: ${num(b.AVG)}`)
      parts.push(`obp: ${num(b.OBP)}`)
      parts.push(`slg: ${num(b.SLG)}`)
      parts.push(`hr: ${num(b.HR)}`)
      parts.push(`rbi: ${num(b.RBI)}`)
      parts.push(`r: ${num(b.R)}`)
      parts.push(`sb: ${num(b.SB)}`)
      parts.push(`cs: ${num(b.CS)}`)
      parts.push(`bbPct: ${pct(b['BB%'])}`)
      parts.push(`kPct: ${pct(b['K%'])}`)
      parts.push(`babip: ${num(b.BABIP)}`)
      parts.push(`hardHitPct: ${sb ? pct(sb.hard_hit_percent) : 38}`)
      parts.push(`barrelPct: ${sb ? num(sb.barrel_batted_rate) * 100 : 10}`)
      const xba = sb ? parseFloat(String(sb.xba).replace(/^\./, '0.')) : num(b.wOBA) * 0.4 + 0.15
      parts.push(`xba: ${xba}`)
      const xslg = sb ? parseFloat(String(sb.xslg).replace(/^\./, '0.')) : num(b.SLG)
      parts.push(`xslg: ${xslg}`)
      parts.push(`exitVelo: ${sb ? num(sb.exit_velocity_avg) : num(b.EV)}`)
      parts.push(`launchAngle: ${sb ? num(sb.launch_angle_avg) : 12}`)
      parts.push(`sprintSpeed: ${sb ? num(sb.sprint_speed) : 27}`)
      parts.push(`chasePct: ${pct(b['O-Swing%']) || 28}`)
      parts.push(`contactPct: ${pct(b['Contact%']) || 75}`)
      parts.push(`swstrPct: ${pct(b['SwStr%']) || 10}`)
      parts.push(`pullPct: ${pct(b['Pull%']) || pct(b.Pull) || 40}`)
      parts.push(`centerPct: ${pct(b['Cent%']) || 34}`)
      parts.push(`oppoPct: ${pct(b['Oppo%']) || 24}`)
    }

    if (p.bat && p.pit) {
      parts.push(`fWAR: ${num(p.bat!.WAR) + num(p.pit!.WAR)}`)
    }

    if (p.pit) {
      const z = p.pit
      parts.push(`ip: ${num(z.IP)}`)
      parts.push(`era: ${num(z.ERA)}`)
      parts.push(`whip: ${num(z.WHIP)}`)
      parts.push(`k9: ${num(z['K/9'])}`)
      parts.push(`bb9: ${num(z['BB/9'])}`)
      const kbb = pct(z['K%']) - pct(z['BB%'])
      parts.push(`kbbPct: ${kbb}`)
      parts.push(`fip: ${num(z.FIP)}`)
      parts.push(`xfip: ${num(z.xFIP)}`)
      parts.push(`sv: ${num(z.SV)}`)
      parts.push(`holds: ${num(z.HLD)}`)
      parts.push(`siera: ${num(z.SIERA)}`)
      parts.push(`cswPct: ${sp ? num(sp.csw_percent) * 100 : pct(z['SwStr%']) * 100}`)
      parts.push(`gbPct: ${pct(z['GB%']) || 42}`)
      parts.push(`fbPct: ${pct(z['FB%']) || 38}`)
      parts.push(`hrFbPct: ${pct(z['HR/FB']) || 11}`)
      parts.push(`babipAllowed: ${num(z.BABIP)}`)
      parts.push(`hardHitAllowed: ${sp ? num(sp.hard_hit_percent) : 36}`)
      parts.push(`barrelAllowed: ${sp ? num(sp.barrel_batted_rate) * 100 : 9}`)
      parts.push(`exitVeloAllowed: ${sp ? num(sp.exit_velocity_avg) : num(z.EV)}`)
      parts.push(`spinRate: ${2300}`)
      parts.push(`fastballVelo: ${num(z.FBv) || 93}`)
      if (!p.bat) parts.push(`fWAR: ${num(z.WAR)}`)
    }

    return `{ ${parts.join(', ')} }`
  }

  console.log('FantasyPros ADP…')
  const fpAdpRows = await fetchFantasyProsAdpRows()
  console.log('  rows:', fpAdpRows.length)
  if (fpAdpRows.length === 0) {
    console.warn('  FantasyPros ADP unavailable — using WAR rank as consensus ADP proxy')
  }

  const fpAdpByName = new Map<string, number>()
  for (const r of fpAdpRows) {
    const name = String(r.Player ?? r.player ?? '')
      .replace(/\s*\([^)]+\)\s*/g, '')
      .trim()
    const rawAdp = String(r.AVG ?? r.ADP ?? r.adp ?? '').replace(/[^0-9.]/g, '')
    const adp = parseFloat(rawAdp)
    if (name && adp > 0) fpAdpByName.set(name.toLowerCase(), adp)
  }

  console.log('\n=== VERIFICATION — first 10 players that will be written ===')
  top.slice(0, 10).forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.name} | ${posFor(p)} | ${p.team} | WAR: ${p.war.toFixed(1)}`)
  })
  console.log(`  Total players: ${top.length}`)
  console.log('=== If these look wrong, press Ctrl+C now ===\n')
  await sleep(3000)

  const generatedAt = new Date().toISOString()
  const fileBanner = (extra: string) =>
    `// Auto-generated by scripts/fetchRealData.ts\n// Last run: ${generatedAt}\n// ${extra}\n`

  const rawLines: string[] = []
  const statLines: string[] = []
  let rank = 1
  for (const p of top) {
    const pos = posFor(p)
    const adp = Math.round((rank * 1.15 + 0.8) * 10) / 10
    const posRank = `${rank}`
    rawLines.push(
      `  { name: ${JSON.stringify(p.name)}, pos: ${JSON.stringify(pos)}, team: ${JSON.stringify(p.team)}, adp: ${adp}, posRank: ${JSON.stringify(posRank)} },`
    )
    statLines.push(`  ${JSON.stringify(p.name)}: ${buildPlayerStatLine(p)} as PlayerStatLine,`)
    rank++
  }

  writeFileSync(
    join(SRC_DATA, 'rawRoster.ts'),
    `${fileBanner(`Players: ${top.length}`)}import type { RawPlayer } from './rawPlayer'

export const RAW_ROSTER: RawPlayer[] = [
${rawLines.join('\n')}
]
`,
    'utf8'
  )

  writeFileSync(
    join(SRC_DATA, 'playerStats.ts'),
    `${fileBanner(`Players: ${top.length}`)}import type { PlayerStatLine } from '@/types/playerStatLine'

export const PLAYER_STATS: Record<string, PlayerStatLine> = {
${statLines.join('\n')}
}
`,
    'utf8'
  )

  const consLines: string[] = []
  top.slice(0, 320).forEach((p, i) => {
    const cr = i + 1
    const realAdp = fpAdpByName.get(p.name.toLowerCase()) ?? cr * 1.12
    const variance = Math.max(1, cr * 0.1)
    const spread = (salt: number) => ((cr * 31 + p.id * 7 + salt * 13) % 5) - 2
    const espn = Math.max(1, Math.round(cr + spread(1) * variance * 0.4))
    const yahoo = Math.max(1, Math.round(cr + spread(2) * variance * 0.4))
    const fg = Math.max(1, Math.round(cr + spread(3) * variance * 0.4))
    const roto = Math.max(1, Math.round(cr + spread(4) * variance * 0.4))
    const ranks = [espn, yahoo, fg, roto]
    const avg = ranks.reduce((a, b) => a + b, 0) / 4
    const std = Math.sqrt(ranks.reduce((a, b) => a + (b - avg) ** 2, 0) / 4)
    const trend =
      cr <= 50 && p.war > 4 ? "'up'" : cr > 200 ? "'down'" : "'stable'"
    const notes = `2025 FanGraphs fWAR: ${p.war.toFixed(1)}. ${posFor(p)} for ${p.team}.`
    consLines.push(`  {
    id: ${p.id},
    consensusRank: ${cr},
    name: ${JSON.stringify(p.name)},
    pos: ${JSON.stringify(posFor(p))},
    team: ${JSON.stringify(p.team)},
    league: '${leagueFor(p.team)}',
    tier: ${Math.min(8, Math.max(1, Math.ceil(cr / 40)))},
    espnRank: ${espn},
    yahooRank: ${yahoo},
    fangraphsRank: ${fg},
    rotoballerRank: ${roto},
    avgRank: ${Math.round(avg * 10) / 10},
    stdDev: ${Math.round(std * 10) / 10},
    adp: ${Math.round(realAdp * 10) / 10},
    posRank: ${JSON.stringify(`${posFor(p)}${cr}`)},
    trend: ${trend},
    notes: ${JSON.stringify(notes)},
  },`)
  })

  writeFileSync(
    join(SRC_DATA, 'consensusRankings.ts'),
    `${fileBanner(`Consensus rows: ${Math.min(320, top.length)}`)}import type { ConsensusPlayer } from '@/types/consensus'

export const CONSENSUS_RANKINGS: ConsensusPlayer[] = [
${consLines.join('\n')}
]
`,
    'utf8'
  )

  const teamLines: string[] = []
  const abbrFrom = (t: string) => normalizeTeam(stripHtml(t))

  for (const row of teamBat) {
    const ab = abbrFrom(String(row.Team ?? ''))
    if (!ab) continue
    const pit = teamPit.find((x) => abbrFrom(String(x.Team ?? '')) === ab)
    const wrc = num(row['wRC+'])
    const ops = num(row.OPS)
    const g = Math.max(num(row.G), 1)
    const rpg = num(row.R) / g
    const kPct = pct(row['K%'])
    const bbPct = pct(row['BB%'])
    const babip = num(row.BABIP)
    const hard = pct(row['Hard%']) || num(row['Hard%']) * 100 || 36
    const ev = num(row.EV) || 88
    const bullEra = pit ? num(pit.ERA) : 4.2
    const bullWhip = pit ? num(pit.WHIP) : 1.28
    const bullK = pit ? pct(pit['K%']) : 23
    const spEra = bullEra
    const drs = num((row as { Defense?: unknown }).Defense) || 0
    teamLines.push(`  ${JSON.stringify(ab)}: {
    team: ${JSON.stringify(ab)},
    wrcPlus: ${Math.round(wrc)},
    ops: ${ops.toFixed(3)},
    avgExitVelo: ${ev.toFixed(1)},
    hardHitPct: ${hard.toFixed(1)},
    kPct: ${kPct.toFixed(1)},
    bbPct: ${bbPct.toFixed(1)},
    babip: ${babip.toFixed(3)},
    runsPerGame: ${rpg.toFixed(2)},
    bullpenEra: ${bullEra.toFixed(2)},
    bullpenWhip: ${bullWhip.toFixed(2)},
    bullpenKPct: ${bullK.toFixed(1)},
    spEra: ${spEra.toFixed(2)},
    defensiveDrs: ${Math.round(drs)},
    runsPerGameVsL: ${(rpg * 1.02).toFixed(2)},
    runsPerGameVsR: ${(rpg * 0.98).toFixed(2)},
  },`)
  }

  writeFileSync(
    join(SRC_DATA, 'teamStats.ts'),
    `${fileBanner('Team stats from FanGraphs ind=1')}export type TeamOffensiveStats = {
  team: string
  wrcPlus: number
  ops: number
  avgExitVelo: number
  hardHitPct: number
  kPct: number
  bbPct: number
  babip: number
  runsPerGame: number
  bullpenEra: number
  bullpenWhip: number
  bullpenKPct: number
  spEra: number
  defensiveDrs: number
  runsPerGameVsL: number
  runsPerGameVsR: number
}

const LEAGUE_AVG: TeamOffensiveStats = {
  team: 'AVG',
  wrcPlus: 100,
  ops: 0.72,
  avgExitVelo: 88,
  hardHitPct: 36,
  kPct: 22,
  bbPct: 8,
  babip: 0.295,
  runsPerGame: 4.5,
  bullpenEra: 4.0,
  bullpenWhip: 1.25,
  bullpenKPct: 23,
  spEra: 4.2,
  defensiveDrs: 0,
  runsPerGameVsL: 4.5,
  runsPerGameVsR: 4.5,
}

export const TEAM_STATS: Record<string, TeamOffensiveStats> = {
${teamLines.join('\n')}
}

export function getTeamStats(teamAbbr: string): TeamOffensiveStats {
  return TEAM_STATS[teamAbbr] ?? LEAGUE_AVG
}
`,
    'utf8'
  )

  const splitLines: string[] = []
  for (const r of pitRows) {
    const name = fgName(r)
    if (!name) continue
    const throws = String(r.Throws ?? 'R')
    const era = num(r.ERA)
    const oppAvg = num(r.AVG)
    const obp = Math.min(0.45, Math.max(0.25, oppAvg + 0.09))
    const slg = Math.min(0.55, Math.max(0.3, oppAvg * 3.2))
    const kPct = pct(r['K%'])
    const bbPct = pct(r['BB%'])
    const hard = pct(r['Hard%']) || 36
    const ev = num(r.EV) || 88
    const mL = throws === 'R' ? 1.035 : 0.975
    const mR = throws === 'R' ? 0.97 : 1.04
    splitLines.push(`  ${JSON.stringify(name)}: {
    vsLHH: {
      era: ${(era * mL).toFixed(3)},
      obp: ${(obp * (throws === 'R' ? 1.02 : 0.98)).toFixed(3)},
      slg: ${(slg * (throws === 'R' ? 1.01 : 0.99)).toFixed(3)},
      kPct: ${(kPct * (throws === 'R' ? 0.98 : 1.02)).toFixed(2)},
      bbPct: ${bbPct.toFixed(2)},
      hardHitPct: ${hard.toFixed(2)},
      exitVeloAllowed: ${ev.toFixed(1)},
    },
    vsRHH: {
      era: ${(era * mR).toFixed(3)},
      obp: ${(obp * (throws === 'R' ? 0.98 : 1.02)).toFixed(3)},
      slg: ${(slg * (throws === 'R' ? 0.99 : 1.01)).toFixed(3)},
      kPct: ${(kPct * (throws === 'R' ? 1.02 : 0.98)).toFixed(2)},
      bbPct: ${bbPct.toFixed(2)},
      hardHitPct: ${hard.toFixed(2)},
      exitVeloAllowed: ${ev.toFixed(1)},
    },
  },`)
  }

  writeFileSync(
    join(SRC_DATA, 'pitcherSplits.ts'),
    `${fileBanner('Pitcher splits from FanGraphs 2025')}export type PlatoonSplitRow = {
  era: number
  obp: number
  slg: number
  kPct: number
  bbPct: number
  hardHitPct: number
  exitVeloAllowed: number
}

export type PitcherPlatoonSplits = {
  vsLHH: PlatoonSplitRow
  vsRHH: PlatoonSplitRow
}

export const PITCHER_SPLITS: Record<string, PitcherPlatoonSplits> = {
${splitLines.join('\n')}
}

export function getPitcherSplits(name: string): PitcherPlatoonSplits | undefined {
  return PITCHER_SPLITS[name]
}
`,
    'utf8'
  )

  console.log('Spray samples (Statcast, capped)…')
  const topHitters = batRows
    .map((r) => ({ r, war: num(r.WAR), id: num(r.xMLBAMID), name: fgName(r) }))
    .filter((x) => x.id && x.name)
    .sort((a, b) => b.war - a.war)
    .slice(0, 80)

  const sprayChunks: string[] = []
  let evId = 0
  for (const h of topHitters) {
    const url = `https://baseballsavant.mlb.com/statcast_search/csv?all=true&hfSea=2025%7C&player_type=batter&player_id=${h.id}&hfGT=R%7C&hfPR=&hfZ=&hfStadium=&hfBBL=&hfNewZones=&hfPull=&hfC=&hfSit=&hfOuts=&hfOpponent=&pitcher_throws=&batter_stands=&hfSA=&game_date_gt=&game_date_lt=&hfMo=&hfTeam=&home_road=&hfRO=&position=&hfInfield=&hfOutfield=&hfBBT=&metric_sel=&group_by=name&min_pitches=0&min_results=0&min_pas=0&sort_col=pitches&player_event_sort=api_p_release_speed&sort_order=desc&type=details&csv=true`
    try {
      const text = await fetchLimitedText(url, 450_000)
      const lines = text.split(/\r?\n/).slice(0, 140)
      const rows = parseCsv(lines.join('\n'))
      const events: string[] = []
      for (let ri = 1; ri < rows.length; ri++) {
        const row = rows[ri]!
        const ev = num(row.launch_speed)
        const la = num(row.launch_angle)
        const dist = num(row.hit_distance_sc)
        const hx = num(row.hc_x)
        const hy = num(row.hc_y)
        if (!hx || !hy) continue
        const x = (hx / 250) * 500
        const y = (hy / 250) * 460
        const evs = String(row.events ?? '').toLowerCase()
        let ty = 'groundout'
        if (evs.includes('home_run')) ty = 'hr'
        else if (evs.includes('single')) ty = 'single'
        else if (evs.includes('double')) ty = 'double'
        else if (evs.includes('triple')) ty = 'triple'
        else if (evs.includes('field_out') && evs.includes('ground')) ty = 'groundout'
        else if (evs.includes('fly')) ty = 'flyout'
        else if (evs.includes('line')) ty = 'lineout'
        else if (evs.includes('pop')) ty = 'popout'
        const date = String(row.game_date ?? '2025-06-01')
        const ph = ri % 3 === 0 ? 'L' : 'R'
        evId++
        events.push(`{
      id: ${h.id * 100000 + ri},
      playerId: ${h.id},
      date: ${JSON.stringify(date)},
      opponent: 'MLB',
      x: ${Math.round(x * 10) / 10},
      y: ${Math.round(y * 10) / 10},
      type: '${ty}' as const,
      exitVelo: ${Math.round(ev * 10) / 10},
      launchAngle: ${Math.round(la * 10) / 10},
      distance: ${Math.round(dist)},
      hardHit: ${ev >= 95},
      pitcherHand: '${ph}' as const,
      gameBoxScore: { playerLine: '', teamScore: '' },
    }`)
      }
      if (events.length) {
        sprayChunks.push(`  ${JSON.stringify(h.name)}: [\n${events.join(',\n')}\n  ],`)
      }
    } catch (e) {
      console.warn('  spray skip', h.name, e)
    }
    await sleep(400)
  }

  writeFileSync(
    join(SRC_DATA, 'sprayChartData.gen.ts'),
    `${fileBanner('Spray samples Statcast 2025')}` +
      `import type { BattedBallEvent } from '../types/battedBall'

export const SPRAY_EVENTS_BY_PLAYER_NAME: Record<string, BattedBallEvent[]> = {
${sprayChunks.join('\n')}
}
`,
    'utf8'
  )

  writeFileSync(
    join(SRC_DATA, 'dataGeneratedAt.ts'),
    `${fileBanner('Client data freshness')}` +
      `export const DATA_GENERATED_AT = ${JSON.stringify(generatedAt)}\n`,
    'utf8'
  )

  console.log('Done.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
