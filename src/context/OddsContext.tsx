import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { GameOdds } from '@/types/odds'
import { getOddsApiKey } from '@/config/env'
import { fetchMlbOdds } from '@/services/oddsApi'
import { transformOddsEvents } from '@/utils/oddsTransform'
import { MOCK_ODDS_EVENTS } from '@/data/mockOdds'

const STORAGE_KEY = 'pvdb-odds-cache-v1'
const CACHE_TTL_MS = 20 * 60 * 1000
const MIN_REFRESH_GAP_MS = 10 * 60 * 1000

type CachedPayload = {
  savedAt: number
  games: GameOdds[]
  requestsUsed: number | null
  requestsRemaining: number | null
  source: 'live' | 'mock'
}

function readCache(): CachedPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as CachedPayload
    if (!p || typeof p.savedAt !== 'number' || !Array.isArray(p.games)) return null
    const age = Date.now() - p.savedAt
    if (age > CACHE_TTL_MS) return null
    return p
  } catch {
    return null
  }
}

function writeCache(p: CachedPayload): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
  } catch {
    /* ignore quota */
  }
}

export type OddsContextValue = {
  games: GameOdds[]
  loading: boolean
  error: string | null
  lastFetchedAt: number | null
  source: 'live' | 'mock'
  requestsUsed: number | null
  requestsRemaining: number | null
  /** Fetches odds; warns if last fetch was &lt; 10 min ago unless `force` is true. */
  refresh: (force?: boolean) => void
}

const OddsContext = createContext<OddsContextValue | null>(null)

export function OddsProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<GameOdds[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchedAt, setLastFetchedAt] = useState<number | null>(null)
  const [source, setSource] = useState<'live' | 'mock'>('mock')
  const [requestsUsed, setRequestsUsed] = useState<number | null>(null)
  const [requestsRemaining, setRequestsRemaining] = useState<number | null>(null)
  const fetchingRef = useRef(false)

  const applyPayload = useCallback((payload: CachedPayload) => {
    setGames(payload.games)
    setLastFetchedAt(payload.savedAt)
    setSource(payload.source)
    setRequestsUsed(payload.requestsUsed)
    setRequestsRemaining(payload.requestsRemaining)
    setError(null)
  }, [])

  const fetchLive = useCallback(async (): Promise<CachedPayload> => {
    const key = getOddsApiKey()
    if (!key) {
      const games = transformOddsEvents(MOCK_ODDS_EVENTS)
      return {
        savedAt: Date.now(),
        games,
        requestsUsed: null,
        requestsRemaining: null,
        source: 'mock',
      }
    }
    const { events, meta } = await fetchMlbOdds(key)
    const games = transformOddsEvents(events)
    return {
      savedAt: Date.now(),
      games,
      requestsUsed: meta.requestsUsed,
      requestsRemaining: meta.requestsRemaining,
      source: 'live',
    }
  }, [])

  const fetchWithFallback = useCallback(async (): Promise<CachedPayload> => {
    try {
      return await fetchLive()
    } catch (e) {
      const games = transformOddsEvents(MOCK_ODDS_EVENTS)
      return {
        savedAt: Date.now(),
        games,
        requestsUsed: null,
        requestsRemaining: null,
        source: 'mock',
      }
    }
  }, [fetchLive])

  const runFetch = useCallback(async () => {
    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    setError(null)
    try {
      let payload = await fetchWithFallback()
      if (payload.games.length === 0) {
        payload = {
          ...payload,
          games: transformOddsEvents(MOCK_ODDS_EVENTS),
          source: 'mock',
        }
        setError('No odds returned from API; showing mock data.')
      }
      applyPayload(payload)
      writeCache(payload)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Odds fetch failed'
      setError(msg)
      const fallback: CachedPayload = {
        savedAt: Date.now(),
        games: transformOddsEvents(MOCK_ODDS_EVENTS),
        requestsUsed: null,
        requestsRemaining: null,
        source: 'mock',
      }
      applyPayload(fallback)
      writeCache(fallback)
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [applyPayload, fetchWithFallback])

  useEffect(() => {
    const cached = readCache()
    if (cached) {
      applyPayload(cached)
      setLoading(false)
      return
    }
    void runFetch()
  }, [applyPayload, runFetch])

  const refresh = useCallback(
    (force?: boolean) => {
      if (lastFetchedAt != null && !force) {
        const elapsed = Date.now() - lastFetchedAt
        if (elapsed < MIN_REFRESH_GAP_MS) {
          const mins = Math.round(elapsed / 60000)
          const ok = window.confirm(
            `You refreshed ${mins || '<1'} minute(s) ago. The Odds API quota is limited. Refresh anyway?`
          )
          if (!ok) return
        }
      }
      void runFetch()
    },
    [lastFetchedAt, runFetch]
  )

  const value = useMemo<OddsContextValue>(
    () => ({
      games,
      loading,
      error,
      lastFetchedAt,
      source,
      requestsUsed,
      requestsRemaining,
      refresh,
    }),
    [games, loading, error, lastFetchedAt, source, requestsUsed, requestsRemaining, refresh]
  )

  return <OddsContext.Provider value={value}>{children}</OddsContext.Provider>
}

export function useOdds(): OddsContextValue {
  const ctx = useContext(OddsContext)
  if (!ctx) throw new Error('useOdds must be used within OddsProvider')
  return ctx
}

export function findGameOdds(awayAbbr: string, homeAbbr: string, games: GameOdds[]): GameOdds | undefined {
  return games.find((g) => g.awayAbbr === awayAbbr && g.homeAbbr === homeAbbr)
}
