/** Raw shapes from https://the-odds-api.com/liveapi/guides/v4/ */
export type OddsApiOutcome = {
  name: string
  price: number
  point?: number
}

export type OddsApiMarket = {
  key: string
  outcomes: OddsApiOutcome[]
}

export type OddsApiBookmaker = {
  key: string
  title: string
  markets: OddsApiMarket[]
}

export type OddsApiEvent = {
  id: string
  sport_key: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: OddsApiBookmaker[]
}

export type OddsFetchMeta = {
  requestsUsed: number | null
  requestsRemaining: number | null
}

function readQuotaHeaders(res: Response): OddsFetchMeta {
  const used = res.headers.get('x-requests-used')
  const remaining = res.headers.get('x-requests-remaining')
  const requestsUsed = used != null ? Number(used) : null
  const requestsRemaining = remaining != null ? Number(remaining) : null
  // eslint-disable-next-line no-console -- required by spec
  console.log('[Odds API] x-requests-remaining:', remaining, 'x-requests-used:', used)
  return {
    requestsUsed: Number.isFinite(requestsUsed as number) ? requestsUsed : null,
    requestsRemaining: Number.isFinite(requestsRemaining as number) ? requestsRemaining : null,
  }
}

/**
 * Live MLB odds (US books, h2h / totals / spreads, American odds, ISO dates).
 * Key must come from `import.meta.env.VITE_ODDS_API_KEY` (see `getOddsApiKey`).
 */
export async function fetchMlbOdds(apiKey: string): Promise<{
  events: OddsApiEvent[]
  meta: OddsFetchMeta
}> {
  const url = new URL('https://api.the-odds-api.com/v4/sports/baseball_mlb/odds')
  url.searchParams.set('apiKey', apiKey)
  url.searchParams.set('regions', 'us')
  url.searchParams.set('markets', 'h2h,totals,spreads')
  url.searchParams.set('oddsFormat', 'american')
  url.searchParams.set('dateFormat', 'iso')

  const res = await fetch(url.toString())
  const meta = readQuotaHeaders(res)

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Odds API ${res.status}: ${text.slice(0, 200)}`)
  }

  const data = (await res.json()) as OddsApiEvent[]
  return { events: Array.isArray(data) ? data : [], meta }
}
