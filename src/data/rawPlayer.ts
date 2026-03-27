/** Lightweight roster entry — identity + ADP seed; stats/writeups are layered separately. */
export type RawPlayer = {
  name: string
  pos: string
  primaryPos: string
  team: string
  adp: number
  posRank: string
}
