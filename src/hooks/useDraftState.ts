import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Player } from '@/types/player'
import { PLAYERS } from '@/data/players'

const STORAGE_ORDER = 'roto-draft:order'
const STORAGE_DRAFTED = 'roto-draft:drafted'
const STORAGE_WATCH = 'roto-draft:watchlist'
const STORAGE_NOTES = 'roto-draft:notes'
const STORAGE_EXCLUDE = 'roto-draft:excludeDrafted'

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

const initialOrder = (): number[] => {
  const fromPlayers = [...PLAYERS].sort((a, b) => a.rank - b.rank).map((p) => p.id)
  const saved = loadJson<number[] | null>(STORAGE_ORDER, null)
  if (!saved?.length) return fromPlayers
  const savedSet = new Set(saved)
  const missing = fromPlayers.filter((id) => !savedSet.has(id))
  return missing.length ? [...saved, ...missing] : saved
}

export function useDraftState() {
  const [order, setOrder] = useState<number[]>(initialOrder)
  const [draftedMap, setDraftedMap] = useState<Record<number, boolean>>(() =>
    loadJson(STORAGE_DRAFTED, Object.fromEntries(PLAYERS.map((p) => [p.id, p.drafted])))
  )
  const [watchlist, setWatchlist] = useState<Set<number>>(() => {
    const arr = loadJson<number[]>(STORAGE_WATCH, [])
    return new Set(arr)
  })
  const [notes, setNotes] = useState<Record<number, string>>(() =>
    loadJson(STORAGE_NOTES, {})
  )
  const [excludeDraftedFromPool, setExcludeDraftedFromPool] = useState(() =>
    loadJson(STORAGE_EXCLUDE, false)
  )

  useEffect(() => {
    saveJson(STORAGE_ORDER, order)
  }, [order])

  useEffect(() => {
    saveJson(STORAGE_DRAFTED, draftedMap)
  }, [draftedMap])

  useEffect(() => {
    saveJson(STORAGE_WATCH, [...watchlist])
  }, [watchlist])

  useEffect(() => {
    saveJson(STORAGE_NOTES, notes)
  }, [notes])

  useEffect(() => {
    saveJson(STORAGE_EXCLUDE, excludeDraftedFromPool)
  }, [excludeDraftedFromPool])

  const playersById = useMemo(() => {
    const m = new Map<number, Player>()
    for (const p of PLAYERS) {
      m.set(p.id, { ...p, drafted: draftedMap[p.id] ?? p.drafted })
    }
    return m
  }, [draftedMap])

  const toggleDrafted = useCallback((id: number) => {
    setDraftedMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const setDrafted = useCallback((id: number, drafted: boolean) => {
    setDraftedMap((prev) => ({ ...prev, [id]: drafted }))
  }, [])

  const toggleWatchlist = useCallback((id: number) => {
    setWatchlist((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const setNote = useCallback((id: number, text: string) => {
    setNotes((prev) => ({ ...prev, [id]: text }))
  }, [])

  const moveInOrder = useCallback((id: number, dir: -1 | 1) => {
    setOrder((prev) => {
      const idx = prev.indexOf(id)
      if (idx < 0) return prev
      const nidx = idx + dir
      if (nidx < 0 || nidx >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[nidx]] = [next[nidx], next[idx]]
      return next
    })
  }, [])

  return {
    order,
    setOrder,
    playersById,
    draftedMap,
    toggleDrafted,
    setDrafted,
    watchlist,
    toggleWatchlist,
    notes,
    setNote,
    excludeDraftedFromPool,
    setExcludeDraftedFromPool,
    moveInOrder,
  }
}
