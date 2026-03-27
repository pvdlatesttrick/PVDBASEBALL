/** Map The Odds API (and common) full team names → 3-letter abbreviations used in-app. */
const FULL_NAME_TO_ABBR: Record<string, string> = {
  'arizona diamondbacks': 'ARI',
  'atlanta braves': 'ATL',
  'baltimore orioles': 'BAL',
  'boston red sox': 'BOS',
  'chicago cubs': 'CHC',
  'chicago white sox': 'CWS',
  'cincinnati reds': 'CIN',
  'cleveland guardians': 'CLE',
  'cleveland indians': 'CLE',
  'colorado rockies': 'COL',
  'detroit tigers': 'DET',
  'houston astros': 'HOU',
  'kansas city royals': 'KC',
  'los angeles angels': 'LAA',
  'los angeles dodgers': 'LAD',
  'miami marlins': 'MIA',
  'milwaukee brewers': 'MIL',
  'minnesota twins': 'MIN',
  'new york mets': 'NYM',
  'new york yankees': 'NYY',
  'oakland athletics': 'OAK',
  'philadelphia phillies': 'PHI',
  'pittsburgh pirates': 'PIT',
  'san diego padres': 'SD',
  'san francisco giants': 'SF',
  'seattle mariners': 'SEA',
  'st louis cardinals': 'STL',
  'st. louis cardinals': 'STL',
  'tampa bay rays': 'TB',
  'texas rangers': 'TEX',
  'toronto blue jays': 'TOR',
  'washington nationals': 'WSH',
}

/** Already-short codes pass through if recognized. */
const KNOWN_ABBR = new Set([
  'ARI', 'ATL', 'BAL', 'BOS', 'CHC', 'CWS', 'CIN', 'CLE', 'COL', 'DET', 'HOU', 'KC', 'LAA', 'LAD',
  'MIA', 'MIL', 'MIN', 'NYM', 'NYY', 'OAK', 'PHI', 'PIT', 'SD', 'SF', 'SEA', 'STL', 'TB', 'TEX', 'TOR',
  'WSH',
])

export function normalizeTeamToAbbr(raw: string): string | null {
  const t = raw.trim()
  if (KNOWN_ABBR.has(t.toUpperCase())) return t.toUpperCase()
  const key = t.toLowerCase()
  return FULL_NAME_TO_ABBR[key] ?? null
}
