import type { NewsItem } from '@/types/news'
import type { GamePrediction, PredictionFactor } from '@/types/prediction'
import type { MLBGame } from '@/types/matchup'
import type { PitcherPlatoonSplits, PlatoonSplitRow } from '@/data/pitcherSplits'
import { getPitcherSplits } from '@/data/pitcherSplits'
import type { TeamOffensiveStats } from '@/data/teamStats'
import { getTeamStats } from '@/data/teamStats'
import { blendedEraVsLineup, getParkFactorForVenue } from '@/utils/runProjection'
import { countBatterHands } from '@/utils/lineupUtils'
import type { WeatherData } from '@/services/weatherService'

const LEAGUE_ERA = 4.2
const BASELINE = 9.0
const EDGE_THRESHOLD = 0.75

function row(): PlatoonSplitRow {
  return {
    era: 4.2,
    obp: 0.32,
    slg: 0.42,
    kPct: 22,
    bbPct: 8,
    hardHitPct: 35,
    exitVeloAllowed: 88,
  }
}

const DEFAULT_SPLITS: PitcherPlatoonSplits = {
  vsLHH: row(),
  vsRHH: row(),
}

export function resolvePitcherSplits(name: string): PitcherPlatoonSplits {
  return getPitcherSplits(name) ?? DEFAULT_SPLITS
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

export function calcPitcherAdjustment(
  splits: PitcherPlatoonSplits,
  opposingOffense: TeamOffensiveStats,
  opposingLineup: MLBGame['awayLineup']
): number {
  const blended = blendedEraVsLineup(opposingLineup, splits)
  const eraRunImpact = (blended - LEAGUE_ERA) * 0.45
  const kbb =
    (splits.vsLHH.kPct -
      splits.vsLHH.bbPct +
      (splits.vsRHH.kPct - splits.vsRHH.bbPct)) /
    2
  const kbbImpact = (14 - kbb) * 0.025
  const hh = (splits.vsLHH.hardHitPct + splits.vsRHH.hardHitPct) / 2
  const hhImpact = (hh - 35) * 0.02
  const offenseScale = (opposingOffense.wrcPlus - 100) * 0.012
  return clamp(eraRunImpact + kbbImpact + hhImpact + offenseScale, -3, 3)
}

export function buildPitcherDescription(
  splits: PitcherPlatoonSplits,
  opposingOffense: TeamOffensiveStats
): string {
  const avgEra = (splits.vsLHH.era + splits.vsRHH.era) / 2
  const lhh = splits.vsLHH
  return `ERA ${avgEra.toFixed(2)} vs league ${LEAGUE_ERA}; vs LHH ${lhh.era.toFixed(2)} ERA / ${lhh.obp.toFixed(3)} OBP — offense wRC+ ${opposingOffense.wrcPlus}`
}

export function calcWeatherAdjustment(weather: WeatherData): number {
  if (weather.isRoofClosed) return 0
  let adj = 0
  if (weather.windSpeed > 15 && weather.windDirection === 'out') adj += 0.8
  if (weather.windSpeed > 15 && weather.windDirection === 'in') adj -= 0.8
  if (weather.tempF < 45) adj -= 0.6
  if (weather.tempF > 85) adj += 0.3
  return adj
}

export function buildWeatherDescription(weather: WeatherData): string {
  if (weather.isRoofClosed) return 'Roof closed or indoor — weather neutralized'
  return `${Math.round(weather.tempF)}°F, wind ${Math.round(weather.windSpeed)} mph (${weather.windDirection}), ${weather.precipProbability}% precip`
}

export function calcNewsAdjustment(news: NewsItem[], game: MLBGame): number {
  let adj = 0
  const gameTeams = [game.homeTeam, game.awayTeam]
  const relevantNews = news.filter(
    (n) => n.team && gameTeams.includes(n.team) && n.impact === 'high'
  )
  relevantNews.forEach((item) => {
    if (item.category === 'injury' && item.playerName) {
      adj -= 0.5
    }
    if (item.headline.toLowerCase().includes('lineup')) {
      adj -= 0.3
    }
  })
  return clamp(adj, -2, 2)
}

export function buildNewsDescription(news: NewsItem[], game: MLBGame): string {
  const gameTeams = [game.homeTeam, game.awayTeam]
  const rel = news.filter((n) => n.team && gameTeams.includes(n.team) && n.impact === 'high')
  if (rel.length === 0) return 'No high-impact team news matched for this slate'
  return rel
    .slice(0, 3)
    .map((n) => n.headline)
    .join(' · ')
}

export function calcSplitAdjustment(
  homePitcherSplits: PitcherPlatoonSplits,
  awayPitcherSplits: PitcherPlatoonSplits,
  game: MLBGame
): number {
  const homePvsAway = blendedEraVsLineup(game.awayLineup, homePitcherSplits)
  const awayPvsHome = blendedEraVsLineup(game.homeLineup, awayPitcherSplits)
  const combined = (homePvsAway + awayPvsHome) / 2
  return clamp((combined - LEAGUE_ERA) * 0.4, -2.5, 2.5)
}

export function buildSplitDescription(adj: number, game: MLBGame): string {
  const ah = countBatterHands(game.awayLineup)
  const hh = countBatterHands(game.homeLineup)
  return `Away lineup ${ah.lhh}L/${ah.rhh}R vs home SP; home ${hh.lhh}L/${hh.rhh}R vs away SP — blended platoon ERA edge ${adj >= 0 ? '+' : ''}${adj.toFixed(2)}`
}

export function calcOffensiveAdjustment(home: TeamOffensiveStats, away: TeamOffensiveStats): number {
  const sumWrc = home.wrcPlus + away.wrcPlus
  return clamp((sumWrc - 200) * 0.018, -2.5, 2.5)
}

export function calcBullpenAdjustment(home: TeamOffensiveStats, away: TeamOffensiveStats): number {
  const league = 4.0
  const avgBull = (home.bullpenEra + away.bullpenEra) / 2
  return clamp((avgBull - league) * 0.35, -2, 2)
}

export function buildBullpenDescription(home: TeamOffensiveStats, away: TeamOffensiveStats): string {
  return `Bullpen ERAs ${home.bullpenEra.toFixed(2)} (${home.team}) / ${away.bullpenEra.toFixed(2)} (${away.team}); WHIPs ${home.bullpenWhip.toFixed(2)} / ${away.bullpenWhip.toFixed(2)}`
}

type BallparkLite = { name: string; parkFactor: number }

export function generatePrediction(
  game: MLBGame,
  homePitcherSplits: PitcherPlatoonSplits,
  awayPitcherSplits: PitcherPlatoonSplits,
  homeTeamStats: TeamOffensiveStats,
  awayTeamStats: TeamOffensiveStats,
  ballpark: BallparkLite,
  weather: WeatherData,
  newsItems: NewsItem[],
  ouLine: number,
  overOdds: number,
  underOdds: number,
  gameDate: string,
  mlbGamePk: number | null
): GamePrediction {
  const factors: PredictionFactor[] = []

  const homePitcherAdj = calcPitcherAdjustment(homePitcherSplits, awayTeamStats, game.awayLineup)
  factors.push({
    name: 'Home starter',
    impact: homePitcherAdj,
    direction: homePitcherAdj < 0 ? 'bearish' : homePitcherAdj > 0 ? 'bullish' : 'neutral',
    description: buildPitcherDescription(homePitcherSplits, awayTeamStats),
    weight: 0.22,
  })

  const awayPitcherAdj = calcPitcherAdjustment(awayPitcherSplits, homeTeamStats, game.homeLineup)
  factors.push({
    name: 'Away starter',
    impact: awayPitcherAdj,
    direction: awayPitcherAdj < 0 ? 'bearish' : awayPitcherAdj > 0 ? 'bullish' : 'neutral',
    description: buildPitcherDescription(awayPitcherSplits, homeTeamStats),
    weight: 0.22,
  })

  const parkAdj = (ballpark.parkFactor - 1.0) * 9.0
  factors.push({
    name: 'Ballpark',
    impact: parkAdj,
    direction: parkAdj > 0.3 ? 'bullish' : parkAdj < -0.3 ? 'bearish' : 'neutral',
    description: `${ballpark.name} park factor ${ballpark.parkFactor.toFixed(3)} — ${parkAdj > 0 ? 'hitter friendly' : 'pitcher friendly'}`,
    weight: 0.12,
  })

  const splitAdj = calcSplitAdjustment(homePitcherSplits, awayPitcherSplits, game)
  factors.push({
    name: 'Platoon splits',
    impact: splitAdj,
    direction: splitAdj > 0 ? 'bullish' : splitAdj < 0 ? 'bearish' : 'neutral',
    description: buildSplitDescription(splitAdj, game),
    weight: 0.15,
  })

  const offAdj = calcOffensiveAdjustment(homeTeamStats, awayTeamStats)
  factors.push({
    name: 'Offensive strength',
    impact: offAdj,
    direction: offAdj > 0 ? 'bullish' : offAdj < 0 ? 'bearish' : 'neutral',
    description: `Combined wRC+ ${homeTeamStats.wrcPlus + awayTeamStats.wrcPlus} — league avg 200`,
    weight: 0.12,
  })

  const weatherAdj = calcWeatherAdjustment(weather)
  factors.push({
    name: 'Weather',
    impact: weatherAdj,
    direction: weatherAdj > 0 ? 'bullish' : weatherAdj < 0 ? 'bearish' : 'neutral',
    description: buildWeatherDescription(weather),
    weight: 0.08,
  })

  const newsAdj = calcNewsAdjustment(newsItems, game)
  factors.push({
    name: 'News & injuries',
    impact: newsAdj,
    direction: newsAdj > 0 ? 'bullish' : newsAdj < 0 ? 'bearish' : 'neutral',
    description: buildNewsDescription(newsItems, game),
    weight: 0.09,
  })

  const bullpenAdj = calcBullpenAdjustment(homeTeamStats, awayTeamStats)
  factors.push({
    name: 'Bullpen',
    impact: bullpenAdj,
    direction: bullpenAdj < 0 ? 'bearish' : bullpenAdj > 0 ? 'bullish' : 'neutral',
    description: buildBullpenDescription(homeTeamStats, awayTeamStats),
    weight: 0.1,
  })

  const totalAdj = factors.reduce((sum, f) => sum + f.impact * f.weight, 0)
  const predictedTotal = Math.max(2, Math.min(20, BASELINE + totalAdj))
  const edge = predictedTotal - ouLine

  const call =
    Math.abs(edge) < EDGE_THRESHOLD ? 'PASS' : edge > 0 ? 'OVER' : 'UNDER'

  const confidence: GamePrediction['confidence'] =
    Math.abs(edge) > 2.0 ? 'high' : Math.abs(edge) > 1.25 ? 'medium' : 'low'

  return {
    gameId: `slate-${game.id}`,
    date: gameDate,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeStarter: game.homeStarter,
    awayStarter: game.awayStarter,
    venue: game.venue,
    ouLine,
    overOdds,
    underOdds,
    predictedTotal: Math.round(predictedTotal * 10) / 10,
    predictedHomeRuns: Math.round(predictedTotal * 0.52 * 10) / 10,
    predictedAwayRuns: Math.round(predictedTotal * 0.48 * 10) / 10,
    call,
    edge: Math.round(edge * 10) / 10,
    confidence,
    factors,
    actualTotal: null,
    actualHomeRuns: null,
    actualAwayRuns: null,
    result: 'PENDING',
    gradedAt: null,
    mlbGamePk,
  }
}

export function buildBallparkForGame(venue: string): BallparkLite {
  return { name: venue, parkFactor: getParkFactorForVenue(venue) }
}
