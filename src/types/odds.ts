/** Single book’s lines for one MLB event (American odds). */
export type BookLineRow = {
  bookKey: string
  bookTitle: string
  awayMl: number | null
  homeMl: number | null
  awaySpreadPts: number | null
  awaySpreadPrice: number | null
  homeSpreadPts: number | null
  homeSpreadPrice: number | null
  totalPts: number | null
  overPrice: number | null
  underPrice: number | null
}

export type BestPrice = { price: number; bookKey: string }

export type BestSpreadSide = { point: number; price: number; bookKey: string }

export type BestTotalSide = { point: number; price: number; bookKey: string }

/** Transformed odds for one game — best lines, consensus total, devig probs. */
export type GameOdds = {
  eventId: string
  awayAbbr: string
  homeAbbr: string
  commenceTime: string
  bookRows: BookLineRow[]
  bestAwayMl: BestPrice | null
  bestHomeMl: BestPrice | null
  bestAwaySpread: BestSpreadSide | null
  bestHomeSpread: BestSpreadSide | null
  bestOver: BestTotalSide | null
  bestUnder: BestTotalSide | null
  consensusTotal: number | null
  /** Vig-adjusted win probability (same-scale as home; sum ≈ 1). */
  impliedAway: number
  impliedHome: number
}
