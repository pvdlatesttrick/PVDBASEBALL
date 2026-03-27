/** MLB ballpark outfield dimensions (approx. 2024–2025; feet). */
export type Ballpark = {
  id: string
  name: string
  team: string
  leftField: number
  leftCenter: number
  center: number
  rightCenter: number
  rightField: number
}

/** px per foot for mapping distances into viewBox space (home plate at bottom center). */
export const SPRAY_PX_PER_FT = 0.78

/** Home plate center in spray chart SVG coordinates. */
export const HOME_PLATE = { x: 250, y: 420 } as const

/**
 * Angles in degrees from center field toward LF (+) / RF (−). LF line ≈ +45°, CF = 0°, RF ≈ −45°.
 */
const WALL_ANGLES = [45, 22.5, 0, -22.5, -45] as const

export function wallDistanceAtAngle(park: Ballpark, angleDeg: number): number {
  const a = Math.max(-45, Math.min(45, angleDeg))
  const dists = [park.leftField, park.leftCenter, park.center, park.rightCenter, park.rightField]
  for (let i = 0; i < WALL_ANGLES.length - 1; i++) {
    const a0 = WALL_ANGLES[i]
    const a1 = WALL_ANGLES[i + 1]
    if (a <= a0 && a >= a1) {
      const t = (a - a0) / (a1 - a0)
      return dists[i] + t * (dists[i + 1] - dists[i])
    }
  }
  return park.center
}

export function polarToSvg(dFt: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  const s = SPRAY_PX_PER_FT
  return {
    x: HOME_PLATE.x - dFt * s * Math.sin(rad),
    y: HOME_PLATE.y - dFt * s * Math.cos(rad),
  }
}

/** Smooth outfield wall path (fair-territory arc from LF to RF foul lines). */
export function getOutfieldWallPath(park: Ballpark): string {
  const steps = 48
  const parts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const angleDeg = 45 - t * 90
    const d = wallDistanceAtAngle(park, angleDeg)
    const { x, y } = polarToSvg(d, angleDeg)
    parts.push(i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return parts.join(' ')
}

/** Warning track ~8–12 ft inside the wall (visual only). */
export function getWarningTrackPath(park: Ballpark): string {
  const steps = 48
  const parts: string[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const angleDeg = 45 - t * 90
    const d = Math.max(250, wallDistanceAtAngle(park, angleDeg) - 10)
    const { x, y } = polarToSvg(d, angleDeg)
    parts.push(i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `L ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return parts.join(' ')
}

export const BALLPARKS: Ballpark[] = [
  { id: 'ari', name: 'Chase Field', team: 'ARI', leftField: 328, leftCenter: 413, center: 407, rightCenter: 413, rightField: 328 },
  { id: 'atl', name: 'Truist Park', team: 'ATL', leftField: 335, leftCenter: 385, center: 400, rightCenter: 375, rightField: 325 },
  { id: 'bal', name: 'Oriole Park at Camden Yards', team: 'BAL', leftField: 333, leftCenter: 373, center: 400, rightCenter: 373, rightField: 318 },
  { id: 'bos', name: 'Fenway Park', team: 'BOS', leftField: 310, leftCenter: 379, center: 390, rightCenter: 380, rightField: 302 },
  { id: 'chc', name: 'Wrigley Field', team: 'CHC', leftField: 355, leftCenter: 368, center: 400, rightCenter: 368, rightField: 353 },
  { id: 'chw', name: 'Guaranteed Rate Field', team: 'CWS', leftField: 330, leftCenter: 375, center: 400, rightCenter: 375, rightField: 335 },
  { id: 'cin', name: 'Great American Ball Park', team: 'CIN', leftField: 328, leftCenter: 379, center: 404, rightCenter: 370, rightField: 325 },
  { id: 'cle', name: 'Progressive Field', team: 'CLE', leftField: 325, leftCenter: 370, center: 405, rightCenter: 375, rightField: 325 },
  { id: 'col', name: 'Coors Field', team: 'COL', leftField: 347, leftCenter: 390, center: 415, rightCenter: 381, rightField: 350 },
  { id: 'det', name: 'Comerica Park', team: 'DET', leftField: 345, leftCenter: 370, center: 420, rightCenter: 365, rightField: 330 },
  { id: 'hou', name: 'Daikin Park', team: 'HOU', leftField: 315, leftCenter: 409, center: 409, rightCenter: 373, rightField: 326 },
  { id: 'kc', name: 'Kauffman Stadium', team: 'KC', leftField: 330, leftCenter: 387, center: 410, rightCenter: 387, rightField: 330 },
  { id: 'laa', name: 'Angel Stadium', team: 'LAA', leftField: 347, leftCenter: 390, center: 396, rightCenter: 382, rightField: 350 },
  { id: 'lad', name: 'Dodger Stadium', team: 'LAD', leftField: 330, leftCenter: 375, center: 395, rightCenter: 375, rightField: 330 },
  { id: 'mia', name: 'loanDepot park', team: 'MIA', leftField: 344, leftCenter: 386, center: 407, rightCenter: 392, rightField: 335 },
  { id: 'mil', name: 'American Family Field', team: 'MIL', leftField: 344, leftCenter: 371, center: 400, rightCenter: 374, rightField: 345 },
  { id: 'min', name: 'Target Field', team: 'MIN', leftField: 339, leftCenter: 377, center: 404, rightCenter: 367, rightField: 328 },
  { id: 'nym', name: 'Citi Field', team: 'NYM', leftField: 335, leftCenter: 379, center: 408, rightCenter: 398, rightField: 330 },
  { id: 'nyy', name: 'Yankee Stadium', team: 'NYY', leftField: 318, leftCenter: 399, center: 408, rightCenter: 385, rightField: 314 },
  { id: 'oak', name: 'Oakland Coliseum', team: 'OAK', leftField: 330, leftCenter: 388, center: 400, rightCenter: 388, rightField: 330 },
  { id: 'phi', name: 'Citizens Bank Park', team: 'PHI', leftField: 329, leftCenter: 374, center: 401, rightCenter: 369, rightField: 330 },
  { id: 'pit', name: 'PNC Park', team: 'PIT', leftField: 325, leftCenter: 383, center: 399, rightCenter: 375, rightField: 320 },
  { id: 'sd', name: 'Petco Park', team: 'SD', leftField: 336, leftCenter: 367, center: 396, rightCenter: 382, rightField: 322 },
  { id: 'sea', name: 'T-Mobile Park', team: 'SEA', leftField: 331, leftCenter: 378, center: 401, rightCenter: 381, rightField: 326 },
  { id: 'sf', name: 'Oracle Park', team: 'SF', leftField: 339, leftCenter: 382, center: 391, rightCenter: 415, rightField: 309 },
  { id: 'stl', name: 'Busch Stadium', team: 'STL', leftField: 336, leftCenter: 375, center: 400, rightCenter: 375, rightField: 335 },
  { id: 'tb', name: 'George M. Steinbrenner Field', team: 'TB', leftField: 315, leftCenter: 370, center: 404, rightCenter: 370, rightField: 314 },
  { id: 'tex', name: 'Globe Life Field', team: 'TEX', leftField: 329, leftCenter: 372, center: 407, rightCenter: 374, rightField: 326 },
  { id: 'tor', name: 'Rogers Centre', team: 'TOR', leftField: 328, leftCenter: 375, center: 404, rightCenter: 375, rightField: 328 },
  { id: 'wsh', name: 'Nationals Park', team: 'WSH', leftField: 336, leftCenter: 377, center: 402, rightCenter: 370, rightField: 335 },
]

const TEAM_TO_PARK: Record<string, string> = {
  ARI: 'ari', ATL: 'atl', BAL: 'bal', BOS: 'bos', CHC: 'chc', CWS: 'chw', CHW: 'chw', CIN: 'cin', CLE: 'cle',
  COL: 'col', DET: 'det', HOU: 'hou', KC: 'kc', KCR: 'kc', LAA: 'laa', LAD: 'lad', MIA: 'mia', MIL: 'mil',
  MIN: 'min', NYM: 'nym', NYY: 'nyy', OAK: 'oak', ATH: 'oak', PHI: 'phi', PIT: 'pit', SD: 'sd', SDP: 'sd',
  SEA: 'sea', SF: 'sf', SFG: 'sf', STL: 'stl', TB: 'tb', TBR: 'tb', TEX: 'tex', TOR: 'tor', WSH: 'wsh', WSN: 'wsh',
}

export function ballparkForTeam(team: string): Ballpark {
  const id = TEAM_TO_PARK[team] ?? 'lad'
  return BALLPARKS.find((b) => b.id === id) ?? BALLPARKS[0]
}

/** Angle (deg, CF=0, LF line ≈ +45°, RF ≈ −45°) from a batted-ball point (bird's-eye, pull = +). */
export function angleDegFromPoint(x: number, y: number): number {
  const dx = x - HOME_PLATE.x
  const dy = HOME_PLATE.y - y
  if (dy <= 0.001) return 0
  return (Math.atan2(-dx, dy) * 180) / Math.PI
}

/** Approximate straight-line distance in feet from home plate to landing point (from SVG). */
export function distanceFtFromPoint(x: number, y: number): number {
  const dx = x - HOME_PLATE.x
  const dy = HOME_PLATE.y - y
  const px = Math.hypot(dx, dy)
  return px / SPRAY_PX_PER_FT
}
