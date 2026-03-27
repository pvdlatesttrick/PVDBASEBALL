import type { PlayerStatLine } from '@/types/playerStatLine'
import { RAW_ROSTER } from '@/data/rawRoster'
import { buildStatLine } from '@/data/statLineBuilder'

/** Projections keyed by player name — derived from `RAW_ROSTER` + `buildStatLine`. */
export const PLAYER_STATS: Record<string, PlayerStatLine> = Object.fromEntries(
  RAW_ROSTER.map((r) => [r.name, buildStatLine(r)])
)
