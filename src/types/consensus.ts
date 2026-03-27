export type ConsensusPlayer = {
  id: number
  consensusRank: number
  name: string
  pos: string
  team: string
  league: 'AL' | 'NL'
  tier: number
  espnRank: number
  yahooRank: number
  fangraphsRank: number
  rotoballerRank: number
  avgRank: number
  stdDev: number
  adp: number
  posRank: string
  trend: 'up' | 'down' | 'stable'
  notes: string
}
