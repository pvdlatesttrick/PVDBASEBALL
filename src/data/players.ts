import { RAW_ROSTER } from '@/data/rawRoster'
import { PLAYER_STATS } from '@/data/playerStats'
import { PLAYER_WRITEUPS } from '@/data/playerWriteups'
import { buildStatLine } from '@/data/statLineBuilder'
import { buildPlayer } from '@/data/buildPlayer'
import type { Player } from '@/types/player'

export const PLAYERS: Player[] = RAW_ROSTER.map((raw, i) => {
  const stats = PLAYER_STATS[raw.name] ?? buildStatLine(raw)
  const writeup = PLAYER_WRITEUPS[raw.name] ?? ''
  return buildPlayer(raw, i + 1, stats, writeup)
})
