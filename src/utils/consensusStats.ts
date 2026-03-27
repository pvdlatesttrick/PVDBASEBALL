export function calcStdDev(ranks: number[]): number {
  if (ranks.length === 0) return 0
  const mean = ranks.reduce((a, b) => a + b, 0) / ranks.length
  return Math.sqrt(ranks.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ranks.length)
}

export function calcAvgRank(ranks: number[]): number {
  if (ranks.length === 0) return 0
  return ranks.reduce((a, b) => a + b, 0) / ranks.length
}
