import type { GameOdds, BookLineRow, BestPrice, BestSpreadSide, BestTotalSide } from '@/types/odds'
import type { OddsApiEvent, OddsApiBookmaker } from '@/services/oddsApi'
import { normalizeTeamToAbbr } from '@/utils/teamNormalizer'

export function americanToImpliedProb(american: number): number {
  if (american > 0) return 100 / (american + 100)
  return Math.abs(american) / (Math.abs(american) + 100)
}

/** Lower implied prob = better price for the bettor. */
function pickBestPrice(candidates: { price: number; bookKey: string }[]): BestPrice | null {
  if (candidates.length === 0) return null
  return candidates.reduce((best, c) =>
    americanToImpliedProb(c.price) < americanToImpliedProb(best.price) ? c : best
  )
}

function mean(nums: number[]): number {
  if (nums.length === 0) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function parseBookRow(book: OddsApiBookmaker, awayTeam: string, homeTeam: string): BookLineRow {
  const row: BookLineRow = {
    bookKey: book.key,
    bookTitle: book.title,
    awayMl: null,
    homeMl: null,
    awaySpreadPts: null,
    awaySpreadPrice: null,
    homeSpreadPts: null,
    homeSpreadPrice: null,
    totalPts: null,
    overPrice: null,
    underPrice: null,
  }

  const h2h = book.markets.find((m) => m.key === 'h2h')
  if (h2h) {
    for (const o of h2h.outcomes) {
      if (o.name === awayTeam) row.awayMl = o.price
      if (o.name === homeTeam) row.homeMl = o.price
    }
  }

  const spreads = book.markets.find((m) => m.key === 'spreads')
  if (spreads) {
    for (const o of spreads.outcomes) {
      if (o.point === undefined) continue
      if (o.name === awayTeam) {
        row.awaySpreadPts = o.point
        row.awaySpreadPrice = o.price
      }
      if (o.name === homeTeam) {
        row.homeSpreadPts = o.point
        row.homeSpreadPrice = o.price
      }
    }
  }

  const totals = book.markets.find((m) => m.key === 'totals')
  if (totals) {
    let totalPoint: number | null = null
    for (const o of totals.outcomes) {
      if (o.point != null) totalPoint = o.point
      if (o.name === 'Over') row.overPrice = o.price
      if (o.name === 'Under') row.underPrice = o.price
    }
    if (totalPoint != null) row.totalPts = totalPoint
  }

  return row
}

function pickBestSpread(
  rows: BookLineRow[],
  side: 'away' | 'home'
): BestSpreadSide | null {
  const candidates: BestSpreadSide[] = []
  for (const r of rows) {
    if (side === 'away' && r.awaySpreadPts != null && r.awaySpreadPrice != null) {
      candidates.push({
        point: r.awaySpreadPts,
        price: r.awaySpreadPrice,
        bookKey: r.bookKey,
      })
    }
    if (side === 'home' && r.homeSpreadPts != null && r.homeSpreadPrice != null) {
      candidates.push({
        point: r.homeSpreadPts,
        price: r.homeSpreadPrice,
        bookKey: r.bookKey,
      })
    }
  }
  if (candidates.length === 0) return null
  return candidates.reduce((best, c) =>
    americanToImpliedProb(c.price) < americanToImpliedProb(best.price) ? c : best
  )
}

function pickBestTotal(
  rows: BookLineRow[],
  ou: 'over' | 'under'
): BestTotalSide | null {
  const candidates: BestTotalSide[] = []
  for (const r of rows) {
    if (r.totalPts == null) continue
    const price = ou === 'over' ? r.overPrice : r.underPrice
    if (price == null) continue
    candidates.push({ point: r.totalPts, price, bookKey: r.bookKey })
  }
  if (candidates.length === 0) return null
  return candidates.reduce((best, c) =>
    americanToImpliedProb(c.price) < americanToImpliedProb(best.price) ? c : best
  )
}

/** Devig two implied probs from possibly different books. */
function devigPair(pAway: number, pHome: number): { away: number; home: number } {
  const s = pAway + pHome
  if (s <= 0) return { away: 0.5, home: 0.5 }
  return { away: pAway / s, home: pHome / s }
}

export function transformOddsEvent(event: OddsApiEvent): GameOdds | null {
  const awayAbbr = normalizeTeamToAbbr(event.away_team)
  const homeAbbr = normalizeTeamToAbbr(event.home_team)
  if (!awayAbbr || !homeAbbr) return null

  const bookRows = event.bookmakers.map((b) => parseBookRow(b, event.away_team, event.home_team))

  const awayMlCands: { price: number; bookKey: string }[] = []
  const homeMlCands: { price: number; bookKey: string }[] = []
  for (const r of bookRows) {
    if (r.awayMl != null) awayMlCands.push({ price: r.awayMl, bookKey: r.bookKey })
    if (r.homeMl != null) homeMlCands.push({ price: r.homeMl, bookKey: r.bookKey })
  }

  const bestAwayMl = pickBestPrice(awayMlCands)
  const bestHomeMl = pickBestPrice(homeMlCands)

  const pAwayRaw = bestAwayMl ? americanToImpliedProb(bestAwayMl.price) : 0.5
  const pHomeRaw = bestHomeMl ? americanToImpliedProb(bestHomeMl.price) : 0.5
  const { away: impliedAway, home: impliedHome } = devigPair(pAwayRaw, pHomeRaw)

  const totalPoints: number[] = []
  for (const r of bookRows) {
    if (r.totalPts != null) totalPoints.push(r.totalPts)
  }
  const consensusTotal = totalPoints.length > 0 ? Math.round(mean(totalPoints) * 100) / 100 : null

  return {
    eventId: event.id,
    awayAbbr,
    homeAbbr,
    commenceTime: event.commence_time,
    bookRows,
    bestAwayMl,
    bestHomeMl,
    bestAwaySpread: pickBestSpread(bookRows, 'away'),
    bestHomeSpread: pickBestSpread(bookRows, 'home'),
    bestOver: pickBestTotal(bookRows, 'over'),
    bestUnder: pickBestTotal(bookRows, 'under'),
    consensusTotal,
    impliedAway,
    impliedHome,
  }
}

export function transformOddsEvents(events: OddsApiEvent[]): GameOdds[] {
  return events.map(transformOddsEvent).filter((g): g is GameOdds => g != null)
}
