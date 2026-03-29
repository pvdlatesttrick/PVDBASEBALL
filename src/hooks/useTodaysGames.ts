import { useEffect, useState } from 'react'
import type { MLBGame } from '@/types/matchup'
import { fetchTodaysGames, getTodaysGamesSync } from '@/data/todaysGames'

/** Loads today’s schedule from MLB Stats API (CORS OK); falls back to static slate. */
export function useTodaysGames() {
  const [games, setGames] = useState<MLBGame[]>(() => getTodaysGamesSync())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchTodaysGames()
      .then((g) => {
        if (!cancelled) setGames(g)
      })
      .catch(() => {
        if (!cancelled) setGames(getTodaysGamesSync())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { games, loading }
}
