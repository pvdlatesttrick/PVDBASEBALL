export const AL_TEAMS = [
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
  'LAA',
] as const

export const NL_TEAMS = [
  'NYM',
  'ATL',
  'PHI',
  'MIA',
  'WSH',
  'CHC',
  'STL',
  'MIL',
  'CIN',
  'PIT',
  'LAD',
  'SD',
  'SF',
  'ARI',
  'COL',
] as const

const AL_SET = new Set<string>(AL_TEAMS)

export function getLeague(team: string): 'AL' | 'NL' {
  return AL_SET.has(team) ? 'AL' : 'NL'
}

/** Unique teams from data, alphabetically sorted; when a league is selected, only that league’s teams. */
export function teamsForLeague(allTeamsSorted: string[], league: 'all' | 'AL' | 'NL'): string[] {
  if (league === 'all') return allTeamsSorted
  return allTeamsSorted.filter((t) => getLeague(t) === league)
}
