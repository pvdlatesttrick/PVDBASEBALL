import { useCallback, useEffect, useMemo, useState } from 'react'
import { PLAYERS } from '@/data/players'
import { BigBoard } from '@/components/BigBoard'
import { ConsensusBoard } from '@/components/ConsensusBoard'
import { MatchupAnalyzer } from '@/components/MatchupAnalyzer'
import { PlayerCard } from '@/components/PlayerCard'
import { useDraftState } from '@/hooks/useDraftState'
import { useRotoRankings } from '@/hooks/useRotoRankings'
import { useTeamOptionsForLeague, type PlayerAvailFilter } from '@/hooks/useFilteredPlayers'
import { NewsProvider, useNews } from '@/context/NewsContext'
import { OddsProvider } from '@/context/OddsContext'
import { PredictionProvider } from '@/context/PredictionContext'
import { AIScoreboard } from '@/components/AIScoreboard'
import { OddsMonitor } from '@/components/OddsMonitor'
import { NewsMailbox } from '@/components/NewsMailbox'
import { NewsPanel } from '@/components/NewsPanel'

type View = 'draft' | 'consensus' | 'matchup' | 'aiScoreboard'

function AppShell() {
  const { unreadCount } = useNews()
  const [newsOpen, setNewsOpen] = useState(false)
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
  } = useDraftState()

  const [view, setView] = useState<View>('draft')
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('all')
  const [leagueFilter, setLeagueFilter] = useState<'all' | 'AL' | 'NL'>('all')
  const [positionTab, setPositionTab] = useState('all')
  const [availFilter, setAvailFilter] = useState<PlayerAvailFilter>('all')
  const [highlightPlayerId, setHighlightPlayerId] = useState<number | null>(null)

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  )

  const allTeams = useMemo(() => [...new Set(PLAYERS.map((p) => p.team))].sort(), [])
  const teams = useTeamOptionsForLeague(allTeams, leagueFilter)

  useEffect(() => {
    setTeamFilter('all')
  }, [leagueFilter])

  const toggleDark = useCallback(() => {
    setDark((d) => {
      const next = !d
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }, [])

  useEffect(() => {
    if (!highlightPlayerId) return
    const t = window.setTimeout(() => setHighlightPlayerId(null), 2800)
    return () => window.clearTimeout(t)
  }, [highlightPlayerId])

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

  const onViewOnBoard = useCallback((playerId: number) => {
    setView('draft')
    setHighlightPlayerId(playerId)
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 pb-28 dark:bg-zinc-950">
      <div className="mx-auto max-w-[1600px] space-y-4">
        <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
            <button
              type="button"
              onClick={() => setView('draft')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                view === 'draft'
                  ? 'bg-blue-600 text-white dark:bg-blue-600'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Draft board
            </button>
            <button
              type="button"
              onClick={() => setView('consensus')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                view === 'consensus'
                  ? 'bg-blue-600 text-white dark:bg-blue-600'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Consensus board
            </button>
            <button
              type="button"
              onClick={() => setView('matchup')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                view === 'matchup'
                  ? 'bg-blue-600 text-white dark:bg-blue-600'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              Matchup analyzer
            </button>
            <button
              type="button"
              onClick={() => setView('aiScoreboard')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                view === 'aiScoreboard'
                  ? 'bg-blue-600 text-white dark:bg-blue-600'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
              }`}
            >
              AI Scoreboard
            </button>
          </div>
          <div className="flex items-center gap-2">
            <NewsMailbox unreadCount={unreadCount} onClick={() => setNewsOpen((o) => !o)} />
            <button
              type="button"
              onClick={toggleDark}
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {dark ? 'Light mode' : 'Dark mode'}
            </button>
          </div>
        </div>
        {newsOpen && (
          <NewsPanel
            onClose={() => setNewsOpen(false)}
            boardTeamFilter={teamFilter}
            teams={allTeams}
            playersById={playersById}
            onViewPlayerOnBoard={(id) => {
              setNewsOpen(false)
              setView('draft')
              setSelectedId(id)
              setHighlightPlayerId(id)
            }}
          />
        )}
        </div>

        {view === 'matchup' ? (
          <MatchupAnalyzer />
        ) : view === 'aiScoreboard' ? (
          <AIScoreboard />
        ) : view === 'draft' ? (
          <BigBoard
            playersById={playersById}
            order={order}
            poolIds={poolIds}
            excludeDraftedFromPool={excludeDraftedFromPool}
            setExcludeDraftedFromPool={setExcludeDraftedFromPool}
            draftedMap={draftedMap}
            toggleDrafted={toggleDrafted}
            onOpenPlayer={setSelectedId}
            search={search}
            onSearchChange={setSearch}
            teamFilter={teamFilter}
            onTeamFilterChange={setTeamFilter}
            leagueFilter={leagueFilter}
            onLeagueFilterChange={setLeagueFilter}
            teams={teams}
            positionTab={positionTab}
            onPositionTabChange={setPositionTab}
            availFilter={availFilter}
            onAvailFilterChange={setAvailFilter}
            highlightPlayerId={highlightPlayerId}
          />
        ) : view === 'consensus' ? (
          <ConsensusBoard
            search={search}
            onSearchChange={setSearch}
            teamFilter={teamFilter}
            onTeamFilterChange={setTeamFilter}
            leagueFilter={leagueFilter}
            onLeagueFilterChange={setLeagueFilter}
            teams={teams}
            positionTab={positionTab}
            onPositionTabChange={setPositionTab}
            availFilter={availFilter}
            onAvailFilterChange={setAvailFilter}
            playersById={playersById}
            order={order}
            draftedMap={draftedMap}
            toggleDrafted={toggleDrafted}
            rotoMap={rotoMap}
            onViewOnBoard={onViewOnBoard}
          />
        ) : null}
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
      <OddsMonitor />
    </div>
  )
}

export default function App() {
  return (
    <OddsProvider>
      <NewsProvider>
        <PredictionProvider>
          <AppShell />
        </PredictionProvider>
      </NewsProvider>
    </OddsProvider>
  )
}
