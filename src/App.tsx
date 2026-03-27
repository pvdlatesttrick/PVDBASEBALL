import { useCallback, useMemo, useState } from 'react'
import { PLAYERS } from '@/data/players'
import { BigBoard } from '@/components/BigBoard'
import { PlayerCard } from '@/components/PlayerCard'
import { useDraftState } from '@/hooks/useDraftState'
import { useRotoRankings } from '@/hooks/useRotoRankings'

export default function App() {
  const {
    order,
    playersById,
    draftedMap,
    toggleDrafted,
    watchlist,
    toggleWatchlist,
    notes,
    setNote,
    excludeDraftedFromPool,
    setExcludeDraftedFromPool,
    moveInOrder,
    reorderDrag,
  } = useDraftState()

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  )

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  const poolIds = useMemo(() => {
    const all = PLAYERS.map((p) => p.id)
    if (!excludeDraftedFromPool) return all
    return all.filter((id) => {
      const p = playersById.get(id)
      const d = draftedMap[id] ?? p?.drafted
      return !d
    })
  }, [excludeDraftedFromPool, draftedMap, playersById])

  const rotoMap = useRotoRankings(playersById, poolIds)

  const selected = selectedId ? playersById.get(selectedId) ?? null : null

  const boardRank = useMemo(() => {
    if (!selectedId) return null
    const i = order.indexOf(selectedId)
    return i >= 0 ? i + 1 : null
  }, [order, selectedId])

  const rotoBreakdown = selectedId ? rotoMap.get(selectedId) ?? null : null

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={toggleDark}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
        <BigBoard
          playersById={playersById}
          order={order}
          poolIds={poolIds}
          excludeDraftedFromPool={excludeDraftedFromPool}
          setExcludeDraftedFromPool={setExcludeDraftedFromPool}
          draftedMap={draftedMap}
          toggleDrafted={toggleDrafted}
          reorderDrag={reorderDrag}
          onOpenPlayer={setSelectedId}
        />
      </div>

      <PlayerCard
        player={selected}
        open={selected !== null}
        onClose={() => setSelectedId(null)}
        boardRank={boardRank}
        rotoBreakdown={rotoBreakdown}
        note={selectedId ? notes[selectedId] ?? '' : ''}
        onNoteChange={(text) => selectedId && setNote(selectedId, text)}
        drafted={selectedId ? draftedMap[selectedId] ?? false : false}
        onToggleDrafted={() => {
          if (!selectedId) return
          toggleDrafted(selectedId)
        }}
        onMoveRank={(dir) => {
          if (!selectedId) return
          moveInOrder(selectedId, dir)
        }}
        onWatchlistToggle={() => {
          if (!selectedId) return
          toggleWatchlist(selectedId)
        }}
        onWatchlist={selectedId ? watchlist.has(selectedId) : false}
      />
    </div>
  )
}
