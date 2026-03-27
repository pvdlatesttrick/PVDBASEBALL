export type LineupSlot = {
  battingOrder: number
  playerName: string
  pos: string
  bats: 'L' | 'R' | 'S'
}

export type MLBGame = {
  id: number
  gameTime: string
  awayTeam: string
  homeTeam: string
  awayStarter: string
  homeStarter: string
  awayStarterHand: 'L' | 'R' | 'S'
  homeStarterHand: 'L' | 'R' | 'S'
  venue: string
  awayLineup: LineupSlot[]
  homeLineup: LineupSlot[]
}
