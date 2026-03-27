import { PLAYERS } from '@/data/players'
import { AL_TEAMS, NL_TEAMS } from '@/utils/leagueUtils'
import type { NewsCategory, NewsImpact, NewsItem } from '@/types/news'

const RSS_TO_JSON = 'https://api.rss2json.com/v1/api.json?rss_url='

const ALL_ABBR = new Set<string>([...AL_TEAMS, ...NL_TEAMS])

/** Sorted longest-first for greedy name match in headlines */
const PLAYER_NAMES_SORTED = [...new Set(PLAYERS.map((p) => p.name))].sort((a, b) => b.length - a.length)

export const RSS_FEEDS = [
  { name: 'MLB Trade Rumors', url: 'https://www.mlbtraderumors.com/feed', category: 'transactions' as const },
  { name: 'Rotowire MLB', url: 'https://www.rotowire.com/rss/news.php?sport=MLB', category: 'injuries' as const },
  { name: 'ESPN MLB', url: 'https://www.espn.com/espn/rss/mlb/news', category: 'news' as const },
  { name: 'Baseball America', url: 'https://www.baseballamerica.com/feed/', category: 'prospects' as const },
]

export function stripHTML(str: string): string {
  return str
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractPlayerName(headline: string, description = ''): string | null {
  const text = `${headline} ${description}`
  const lower = text.toLowerCase()
  for (const name of PLAYER_NAMES_SORTED) {
    if (lower.includes(name.toLowerCase())) return name
  }
  return null
}

export function extractTeam(headline: string): string | null {
  const re = /\b([A-Z]{2,3})\b/g
  let m: RegExpExecArray | null
  while ((m = re.exec(headline)) !== null) {
    const abbr = m[1]
    if (ALL_ABBR.has(abbr)) return abbr
  }
  return null
}

const HIGH = /\b(IL|injured|injury|surgery|season-?ending|Tommy John|trade|traded|DFA|closer|demoted|promoted)\b/i
const MEDIUM = /\b(day-?to-?day|recalled|optioned|rehab|activation|bullpen|rotation|extension)\b/i

export function classifyImpact(title: string, body: string): NewsImpact {
  const t = `${title} ${body}`
  if (HIGH.test(t)) return 'high'
  if (MEDIUM.test(t)) return 'medium'
  return 'low'
}

function mapFeedCategory(cat: string): NewsCategory {
  switch (cat) {
    case 'transactions':
      return 'transaction'
    case 'injuries':
      return 'injury'
    case 'prospects':
      return 'prospect'
    case 'news':
    default:
      return 'news'
  }
}

/** MLB transaction typeCode → our category */
export function classifyTransaction(typeCode: string | undefined): NewsCategory {
  const c = (typeCode ?? '').toUpperCase()
  if (/^IL|^IL7|^IL10|^IL15|^IL60|^INJ|^INJURY|^ST|^SUS/i.test(c)) return 'injury'
  if (/^TR|^TRD|^WA|^WAI|^DF|^DFA|^REL|^SIGN|^OPT|^REC|^OUT|^PUR|^DES/i.test(c)) return 'transaction'
  if (/^AU|^ROST|^ADD|^REM|^CAL|^OPT/i.test(c)) return 'roster'
  return 'transaction'
}

export function classifyTransactionImpact(typeCode: string | undefined): NewsImpact {
  const cat = classifyTransaction(typeCode)
  if (cat === 'injury') return 'high'
  const c = (typeCode ?? '').toUpperCase()
  if (/TR|DFA|WA|TRADE|SIGN/i.test(c)) return 'high'
  if (/OPT|REC|IL/i.test(c)) return 'medium'
  return 'low'
}

type RssItem = {
  guid?: string | { _: string }
  title: string
  description?: string
  link?: string
  pubDate?: string
}

function rssItemId(item: RssItem, source: string, title: string): string {
  const g = item.guid
  const guidStr = typeof g === 'string' ? g : g && typeof g === 'object' && '_' in g ? String((g as { _: string })._) : ''
  const base = guidStr || item.link || `${source}-${title}`
  return String(base).slice(0, 220)
}

async function fetchRSSFeed(feedUrl: string, source: string, feedCategory: string): Promise<NewsItem[]> {
  const res = await fetch(`${RSS_TO_JSON}${encodeURIComponent(feedUrl)}`)
  if (!res.ok) throw new Error(`RSS ${res.status}`)
  const data = (await res.json()) as { status?: string; items?: RssItem[] }
  if (data.status !== 'ok' || !Array.isArray(data.items)) return []
  const cat = mapFeedCategory(feedCategory)
  return data.items.map((item) => {
    const desc = stripHTML(item.description ?? '')
    const title = stripHTML(item.title ?? '')
    const summary = desc.slice(0, 200) || title.slice(0, 200)
    const id = rssItemId(item, source, title)
    return {
      id,
      headline: title.slice(0, 300),
      summary,
      source,
      category: cat,
      playerName: extractPlayerName(title, desc),
      team: extractTeam(title) ?? extractTeam(desc),
      publishedAt: new Date(item.pubDate ?? Date.now()),
      url: item.link ?? '#',
      isRead: false,
      impact: classifyImpact(title, desc),
    }
  })
}

type MlbTransaction = {
  id?: number
  date?: string
  typeCode?: string
  description?: string
  person?: { fullName?: string }
  fromTeam?: { name?: string; abbreviation?: string }
  toTeam?: { name?: string; abbreviation?: string }
}

export async function fetchMLBTransactions(): Promise<NewsItem[]> {
  const today = new Date().toISOString().split('T')[0]!
  const res = await fetch(
    `https://statsapi.mlb.com/api/v1/transactions?startDate=${today}&endDate=${today}&sportId=1`
  )
  if (!res.ok) return []
  const data = (await res.json()) as { transactions?: MlbTransaction[] }
  const list = data.transactions ?? []
  return list.map((t) => {
    const from = t.fromTeam?.abbreviation ?? t.fromTeam?.name ?? ''
    const to = t.toTeam?.abbreviation ?? t.toTeam?.name ?? ''
    const summary = [from && to ? `${from} → ${to}` : '', t.description].filter(Boolean).join(' · ').slice(0, 200)
    return {
      id: `mlb-tx-${t.id ?? `${t.date}-${t.person?.fullName}`}`,
      headline: t.description ?? 'MLB transaction',
      summary: summary || (t.description ?? '').slice(0, 200),
      source: 'MLB Official',
      category: classifyTransaction(t.typeCode),
      playerName: t.person?.fullName ?? null,
      team: t.toTeam?.abbreviation ?? t.fromTeam?.abbreviation ?? null,
      publishedAt: new Date(t.date ?? today),
      url: 'https://www.mlb.com',
      isRead: false,
      impact: classifyTransactionImpact(t.typeCode),
    }
  })
}

type MlbInjury = {
  id?: number
  date?: string
  description?: string
  player?: { fullName?: string }
  person?: { fullName?: string }
  team?: { name?: string; abbreviation?: string }
}

export async function fetchMLBInjuries(): Promise<NewsItem[]> {
  try {
    const res = await fetch('https://statsapi.mlb.com/api/v1/injuries?sportId=1')
    if (!res.ok) return []
    const data = (await res.json()) as { injuries?: MlbInjury[]; teams?: { injuries?: MlbInjury[] }[] }
    let rows: MlbInjury[] = []
    if (Array.isArray(data.injuries)) rows = data.injuries
    else if (Array.isArray(data.teams)) {
      for (const tm of data.teams) {
        if (Array.isArray(tm.injuries)) rows.push(...tm.injuries)
      }
    }
    return rows.map((inj, i) => {
      const name = inj.player?.fullName ?? inj.person?.fullName ?? null
      const desc = inj.description ?? 'Injury update'
      return {
        id: `mlb-inj-${inj.id ?? i}-${name ?? ''}`,
        headline: desc.slice(0, 200),
        summary: desc.slice(0, 200),
        source: 'MLB Official',
        category: 'injury' as const,
        playerName: name,
        team: inj.team?.abbreviation ?? null,
        publishedAt: new Date(inj.date ?? Date.now()),
        url: 'https://www.mlb.com',
        isRead: false,
        impact: classifyImpact(desc, '') as NewsImpact,
      }
    })
  } catch {
    return []
  }
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  const rssPromises = RSS_FEEDS.map((f) => fetchRSSFeed(f.url, f.name, f.category))
  const results = await Promise.allSettled([
    fetchMLBTransactions(),
    fetchMLBInjuries(),
    ...rssPromises,
  ])

  const all: NewsItem[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  return all
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, 100)
}
