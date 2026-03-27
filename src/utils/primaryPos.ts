/** Primary fantasy position token for projections/writeups (first of SP/RP, else first slot). */
export function primaryPosFromPos(pos: string): string {
  const tokens = pos
    .split(/[/,]/)
    .map((s) => s.trim())
    .filter(Boolean)
  const arm = tokens.find((t) => t === 'SP' || t === 'RP')
  if (arm) return arm
  return tokens[0] ?? 'DH'
}
