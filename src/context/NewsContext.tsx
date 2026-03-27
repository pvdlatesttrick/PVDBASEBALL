import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { NewsItem } from '@/types/news'
import { fetchAllNews } from '@/services/newsService'

const CACHE_KEY = 'mlb_news_cache'
const READ_IDS_KEY = 'mlb_news_read_ids'
const TTL_MS = 15 * 60 * 1000
const REFRESH_MS = 15 * 60 * 1000

type CachedPayload = {
  savedAt: number
  items: SerializedNewsItem[]
}

type SerializedNewsItem = Omit<NewsItem, 'publishedAt'> & { publishedAt: string }

function serializeItems(items: NewsItem[]): SerializedNewsItem[] {
  return items.map((i) => ({
    ...i,
    publishedAt: i.publishedAt.toISOString(),
  }))
}

function deserializeItems(rows: SerializedNewsItem[]): NewsItem[] {
  return rows.map((r) => ({
    ...r,
    publishedAt: new Date(r.publishedAt),
  }))
}

function readCache(): { items: NewsItem[]; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as CachedPayload
    if (!p?.savedAt || !Array.isArray(p.items)) return null
    if (Date.now() - p.savedAt > TTL_MS) return null
    return { items: deserializeItems(p.items), savedAt: p.savedAt }
  } catch {
    return null
  }
}

function writeCache(items: NewsItem[]): void {
  try {
    const payload: CachedPayload = {
      savedAt: Date.now(),
      items: serializeItems(items),
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* quota */
  }
}

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_IDS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<string>): void {
  try {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]))
  } catch {
    /* */
  }
}

function applyReadIds(items: NewsItem[], readIds: Set<string>): NewsItem[] {
  return items.map((i) => ({ ...i, isRead: readIds.has(i.id) }))
}

export type NewsContextValue = {
  items: NewsItem[]
  unreadCount: number
  loading: boolean
  error: string | null
  lastFetched: Date | null
  markRead: (id: string) => void
  markAllRead: () => void
  refresh: () => void
  filterByCategory: (cat: 'all' | NewsItem['category']) => NewsItem[]
  filterByPlayer: (name: string) => NewsItem[]
  filterByTeam: (team: string) => NewsItem[]
}

const NewsContext = createContext<NewsContextValue | null>(null)

export function NewsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<NewsItem[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)

  const mergedItems = useMemo(() => applyReadIds(items, readIds), [items, readIds])

  const unreadCount = useMemo(
    () => mergedItems.filter((i) => !i.isRead).length,
    [mergedItems]
  )

  const runFetch = useCallback(async (silent: boolean) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const next = await fetchAllNews()
      setItems(next)
      setLastFetched(new Date())
      writeCache(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'News fetch failed')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cached = readCache()
    if (cached?.items.length) {
      setItems(cached.items)
      setLastFetched(new Date(cached.savedAt))
      setLoading(false)
      void runFetch(true)
    } else {
      void runFetch(false)
    }
  }, [runFetch])

  useEffect(() => {
    const id = window.setInterval(() => {
      void runFetch(true)
    }, REFRESH_MS)
    return () => window.clearInterval(id)
  }, [runFetch])

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      const n = new Set(prev)
      n.add(id)
      saveReadIds(n)
      return n
    })
  }, [])

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const n = new Set(prev)
      for (const it of items) n.add(it.id)
      saveReadIds(n)
      return n
    })
  }, [items])

  const refresh = useCallback(() => {
    void runFetch(false)
  }, [runFetch])

  const filterByCategory = useCallback(
    (cat: 'all' | NewsItem['category']) => {
      if (cat === 'all') return mergedItems
      if (cat === 'transaction') {
        return mergedItems.filter((i) => i.category === 'transaction' || i.category === 'roster')
      }
      return mergedItems.filter((i) => i.category === cat)
    },
    [mergedItems]
  )

  const filterByPlayer = useCallback(
    (name: string) => {
      const q = name.trim().toLowerCase()
      if (!q) return []
      const parts = q.split(/\s+/)
      const last = parts[parts.length - 1] ?? q
      return mergedItems.filter((i) => {
        const h = i.headline.toLowerCase()
        const s = i.summary.toLowerCase()
        if (i.playerName) {
          const pn = i.playerName.toLowerCase()
          if (pn.includes(q) || q.includes(pn) || pn.includes(last)) return true
        }
        return h.includes(q) || h.includes(last) || s.includes(last)
      })
    },
    [mergedItems]
  )

  const filterByTeam = useCallback(
    (team: string) => {
      if (team === 'all') return mergedItems
      return mergedItems.filter((i) => i.team === team)
    },
    [mergedItems]
  )

  const value = useMemo<NewsContextValue>(
    () => ({
      items: mergedItems,
      unreadCount,
      loading,
      error,
      lastFetched,
      markRead,
      markAllRead,
      refresh,
      filterByCategory,
      filterByPlayer,
      filterByTeam,
    }),
    [
      mergedItems,
      unreadCount,
      loading,
      error,
      lastFetched,
      markRead,
      markAllRead,
      refresh,
      filterByCategory,
      filterByPlayer,
      filterByTeam,
    ]
  )

  return <NewsContext.Provider value={value}>{children}</NewsContext.Provider>
}

export function useNews(): NewsContextValue {
  const ctx = useContext(NewsContext)
  if (!ctx) throw new Error('useNews must be used within NewsProvider')
  return ctx
}
