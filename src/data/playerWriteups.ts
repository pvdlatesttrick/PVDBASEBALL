import type { RawPlayer } from '@/data/rawPlayer'
import { RAW_ROSTER } from '@/data/rawRoster'
import { primaryPosFromPos } from '@/utils/primaryPos'

/** 1–2 sentence 2025 outlook keyed by player `name`. */
export function buildWriteup(raw: RawPlayer): string {
  if (raw.name === 'Shohei Ohtani') {
    return (
      'Ohtani remains a unicorn: elite power and patience at the plate with ace-level run prevention when he takes the mound. ' +
      'His two-way workload is managed carefully, but the ceiling in both hitting and pitching categories is unmatched in fantasy.'
    )
  }

  const tier =
    raw.adp <= 12
      ? 'early-round'
      : raw.adp <= 72
        ? 'solid'
        : raw.adp <= 200
          ? 'mid-draft'
          : raw.adp <= 350
            ? 'late-round'
            : 'deep-league'

  const pos = primaryPosFromPos(raw.pos)
  if (pos === 'SP') {
    return `${raw.name} projects as a ${tier} rotation arm for ${raw.team} in 2025 with innings and strikeout volume that play in roto. Monitor spring velo and role.`
  }
  if (pos === 'RP') {
    return `${raw.name} is in the saves-plus-holds mix for ${raw.team}; leverage and health will determine fantasy payoff.`
  }
  if (pos === 'OF' || pos === 'DH') {
    return `${raw.name} offers counting-stat upside in the ${raw.team} lineup; plate discipline and playing time drive the 2025 range of outcomes.`
  }
  if (pos === 'C') {
    return `${raw.name} is part of the ${tier} catcher pool—playing time and batting order slot matter as much as the slash line.`
  }
  if (pos === '1B' || pos === '3B') {
    return `${raw.name} profiles for power and RBI chances in ${raw.team}'s offense; OBP formats reward the walk rate if it holds.`
  }
  if (pos === '2B' || pos === 'SS') {
    return `${raw.name} mixes contact and speed in the middle infield; health and lineup spot set the fantasy floor.`
  }
  return `${raw.name} is on the ${raw.team} radar for 2025 drafts as a ${tier} option—track spring role and playing time.`
}

export const PLAYER_WRITEUPS: Record<string, string> = Object.fromEntries(
  RAW_ROSTER.map((r) => [r.name, buildWriteup(r)])
)
