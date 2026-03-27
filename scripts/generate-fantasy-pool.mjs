/**
 * Generates src/data/rawRoster.ts — ~560 draftable MLB fantasy players.
 * Run: node scripts/generate-fantasy-pool.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outPath = path.join(root, 'src/data/rawRoster.ts')

const MLB = [
  'NYY', 'BOS', 'TOR', 'TB', 'BAL',
  'CLE', 'MIN', 'CWS', 'KC', 'DET',
  'HOU', 'SEA', 'TEX', 'OAK', 'LAA',
  'NYM', 'ATL', 'PHI', 'MIA', 'WSH',
  'CHC', 'STL', 'MIL', 'CIN', 'PIT',
  'LAD', 'SD', 'SF', 'ARI', 'COL',
]

const FIRST = [
  'Juan', 'Aaron', 'Ronald', 'Bobby', 'Mookie', 'Freddie', 'Corey', 'Yordan', 'Francisco', 'Pete',
  'Matt', 'José', 'Vladimir', 'Gunnar', 'Julio', 'Ketel', 'William', 'Elly', 'Rafael', 'Paul',
  'Tarik', 'Garrett', 'Zack', 'Spencer', 'Chris', 'Jacob', 'Corbin', 'Shota', 'Hunter', 'Emmanuel',
  'Josh', 'Ryan', 'Edwin', 'Devin', 'Raisel', 'Clay', 'Kyle', 'Logan', 'George', 'Luis',
  'Shohei', 'Manny', 'Xander', 'Bo', 'Alex', 'Carlos', 'Byron', 'Royce', 'Salvador', 'CJ',
  'Jackson', 'Wyatt', 'Evan', 'Josh', 'Marcus', 'Riley', 'Spencer', 'Corbin', 'Christian', 'Zac',
  'Merrill', 'Sal', 'Willy', 'Rhys', 'Brice', 'Pablo', 'Joe', 'Bailey', 'Carlos', 'Gerrit',
  'Max', 'Luis', 'Cody', 'Trea', 'Bryce', 'Kyle', 'Nick', 'Austin', 'Randy', 'Teoscar',
  'Seiya', 'Ian', 'Michael', 'Brandon', 'Nolan', 'Trevor', 'Pete', 'Oneil', 'Jazz', 'Starling',
  'Tommy', 'Lane', 'Tyler', 'Justin', 'Walker', 'Jordan', 'Hayden', 'Grayson', 'Hunter', 'Dylan',
  'Framber', 'Pablo', 'Jesus', 'Luis', 'Nestor', 'Clarke', 'Tanner', 'Robert', 'Kodai', 'Yoshinobu',
  'Blake', 'Mason', 'Hurston', 'Chase', 'Andrew', 'Charlie', 'Jack', 'Brayan', 'Keibert', 'Will',
  'Adley', 'J.T.', 'Sean', 'Tyler', 'Cal', 'Gabriel', 'Danny', 'Shea', 'Patrick', 'James',
  'Ethan', 'Roman', 'Junior', 'Ezequiel', 'Heliot', 'Jarred', 'Taylor', 'Lars', 'Alex', 'Daulton',
]

const LAST = [
  'Soto', 'Judge', 'Acuña Jr.', 'Witt Jr.', 'Betts', 'Freeman', 'Seager', 'Alvarez', 'Lindor', 'Alonso',
  'Olson', 'Ramírez', 'Guerrero Jr.', 'Henderson', 'Rodríguez', 'Marte', 'Contreras', 'De La Cruz', 'Devers', 'Skenes',
  'Skubal', 'Crochet', 'Wheeler', 'Strider', 'Sale', 'deGrom', 'Burnes', 'Imanaga', 'Greene', 'Clase',
  'Hader', 'Helsley', 'Díaz', 'Williams', 'Iglesias', 'Holmes', 'Finnegan', 'Gilbert', 'Kirby', 'Castillo',
  'Ohtani', 'Machado', 'Bogaerts', 'Bichette', 'Bregman', 'Correa', 'Buxton', 'Lewis', 'Pérez', 'Abrams',
  'Chourio', 'Holliday', 'Langford', 'Carter', 'Jung', 'García', 'Semien', 'Greene', 'Torkelson', 'Carroll',
  'Walker', 'Gallen', 'Kelly', 'Frelick', 'Adames', 'Hoskins', 'Turang', 'López', 'Ryan', 'Ober',
  'Rodón', 'Cole', 'Fried', 'Gil', 'Bellinger', 'Turner', 'Castellanos', 'Riley', 'Riley', 'Arozarena',
  'Hernández', 'Suzuki', 'Happ', 'Harris II', 'Jones', 'Arenado', 'Story', 'McNeil', 'Cruz', 'Marte',
  'Pham', 'Thomas', 'Soderstrom', 'McCarthy', 'India', 'Chisholm Jr.', 'Marte', 'Yelich', 'Robert Jr.', 'Jiménez',
  'Edman', 'Donovan', 'Gorman', 'Walker', 'Neto', 'Volpe', 'Perdomo', 'Morel', 'Rutschman', 'Realmuto',
  'Murphy', 'Smith', 'Heim', 'Raleigh', 'Álvarez', 'Moreno', 'Díaz', 'Campusano', 'Naylor', 'Vaughn',
  'Bell', 'Rizzo', 'Mountcastle', 'Muncy', 'Smith', 'Casas', 'France', 'Drury', 'Busch', 'Busch',
  'Chapman', 'Hayes', 'Devers', 'Riley', 'Witt', 'Devers', 'Jung', 'Moncada', 'Royce', 'Caminero',
]

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildSlots() {
  const slots = []
  const push = (primary, pos, n) => {
    for (let i = 0; i < n; i++) slots.push({ primaryPos: primary, pos })
  }
  push('SP', 'SP', 174)
  push('RP', 'RP', 96)
  push('OF', 'OF', 121)
  push('C', 'C', 28)
  push('1B', '1B', 35)
  push('3B', '3B', 30)
  push('2B', '2B', 32)
  push('SS', 'SS', 34)
  push('DH', 'DH', 9)
  return slots
}

function main() {
  const rand = mulberry32(20250327)
  const slots = buildSlots()
  if (slots.length !== 559) throw new Error(`expected 559 slots, got ${slots.length}`)

  // Fisher–Yates shuffle slots
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[slots[i], slots[j]] = [slots[j], slots[i]]
  }

  const usedNames = new Set(['Shohei Ohtani'])
  const names = []

  function uniqueName(seed) {
    let attempt = 0
    while (attempt < 5000) {
      const fi = Math.floor(rand() * FIRST.length)
      const li = Math.floor(rand() * LAST.length)
      let n = `${FIRST[fi]} ${LAST[li]}`
      if (attempt % 71 === 0) n += ' Jr.'
      if (!usedNames.has(n)) {
        usedNames.add(n)
        return n
      }
      attempt++
      n = `${FIRST[fi]} ${LAST[li]} ${attempt}`
      if (!usedNames.has(n)) {
        usedNames.add(n)
        return n
      }
    }
    const fallback = `Player ${seed}`
    usedNames.add(fallback)
    return fallback
  }

  let idx = 0
  const rows = []
  for (const s of slots) {
    const team = MLB[idx % MLB.length]
    idx++
    rows.push({
      primaryPos: s.primaryPos,
      pos: s.pos,
      team,
      name: uniqueName(idx),
    })
  }

  // Ohtani row
  rows.push({
    primaryPos: 'SP',
    pos: 'SP/DH',
    team: 'LAD',
    name: 'Shohei Ohtani',
  })

  // Quality score for ADP ordering (stars first, then random tiebreak)
  const posWeight = (p) =>
    p === 'SP' ? 1.0 : p === 'RP' ? 0.92 : p === 'OF' ? 0.95 : p === 'SS' ? 0.94 : p === 'C' ? 0.88 : 0.9

  rows.forEach((r, i) => {
    const rng = mulberry32(i + r.name.length * 13)
    r._score =
      (r.name === 'Shohei Ohtani' ? 10000 : posWeight(r.primaryPos) * 50) + rng() * 8
  })

  rows.sort((a, b) => b._score - a._score)

  const total = rows.length
  rows.forEach((r, i) => {
    const rank = i + 1
    const base = 1 + ((rank - 1) * 498) / Math.max(1, total - 1)
    const noise = (mulberry32(rank * 7919)() - 0.5) * 0.85
    r.adp = Math.round((base + noise) * 10) / 10
    if (r.name === 'Shohei Ohtani') r.adp = 1.2
  })

  // posRank by primary position
  const byPrim = {}
  for (const r of rows) {
    const k = r.primaryPos
    if (!byPrim[k]) byPrim[k] = []
    byPrim[k].push(r)
  }
  for (const k of Object.keys(byPrim)) {
    byPrim[k].sort((a, b) => a.adp - b.adp)
    byPrim[k].forEach((r, i) => {
      r.posRank = `${k}${i + 1}`
    })
  }

  const raw = rows.map((r) => ({
    name: r.name,
    pos: r.pos,
    primaryPos: r.primaryPos,
    team: r.team,
    adp: r.adp,
    posRank: r.posRank,
  }))

  const lines = []
  lines.push(`import type { RawPlayer } from './rawPlayer'`)
  lines.push(``)
  lines.push(`/** ~560 draftable players — generated by scripts/generate-fantasy-pool.mjs */`)
  lines.push(`export const RAW_ROSTER: RawPlayer[] = [`)

  for (const p of raw) {
    const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    lines.push(
      `  { name: '${esc(p.name)}', pos: '${esc(p.pos)}', primaryPos: '${p.primaryPos}', team: '${p.team}', adp: ${p.adp}, posRank: '${esc(p.posRank)}' },`
    )
  }
  lines.push(`]`)
  lines.push(``)

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8')
  console.log(`Wrote ${raw.length} players to ${outPath}`)
}

main()
