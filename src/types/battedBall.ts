/** Statcast-style batted-ball point for spray chart tooling. */
export type BattedBallEvent = {
  id: number
  playerId: number
  date: string
  opponent: string
  x: number
  y: number
  type:
    | 'single'
    | 'double'
    | 'triple'
    | 'hr'
    | 'lineout'
    | 'flyout'
    | 'groundout'
    | 'popout'
  exitVelo: number
  launchAngle: number
  distance: number
  hardHit: boolean
  pitcherHand: 'L' | 'R'
  gameBoxScore: {
    playerLine: string
    teamScore: string
  }
}
