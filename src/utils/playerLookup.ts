import type { Player } from '@/types/player'

export function normalizePlayerName(name: string): string {
  return name.trim().toLowerCase()
}

export function findPlayerIdByName(
  playersById: Map<number, Player>,
  name: string
): number | undefined {
  const n = normalizePlayerName(name)
  for (const p of playersById.values()) {
    if (normalizePlayerName(p.name) === n) return p.id
  }
  return undefined
}
