import type { RawPlayer } from '@/data/rawPlayer'
import type { PlayerStatLine } from '@/types/playerStatLine'
import type {
  Player,
  PlayerRole,
  RotoValues,
  HittingStats,
  PitchingStats,
  HittingAdvanced,
  PitchingAdvanced,
} from '@/types/player'
import { getPlayerType } from '@/types/player'
import { getLeague } from '@/utils/teamLeague'

function rv(
  obp: number,
  slg: number,
  hr: number,
  netSb: number,
  kbbPct: number,
  whip: number,
  era: number,
  svH: number
): RotoValues {
  return { obp, slg, hr, netSb, kbbPct, whip, era, svH }
}

function toHitting(s: PlayerStatLine): HittingStats {
  const obp = s.obp ?? 0.32
  const slg = s.slg ?? 0.42
  return {
    pa: s.pa ?? 550,
    avg: s.avg ?? 0.265,
    obp,
    slg,
    ops: obp + slg,
    hr: s.hr ?? 15,
    rbi: s.rbi ?? 65,
    sb: s.sb ?? 8,
    cs: s.cs ?? 2,
    bbPct: s.bbPct ?? 9,
    kPct: s.kPct ?? 22,
  }
}

function toHittingAdv(s: PlayerStatLine): HittingAdvanced {
  return {
    kind: 'hitter',
    babip: s.babip ?? 0.29,
    hardHitPct: s.hardHitPct ?? 42,
    barrelPct: s.barrelPct ?? 9,
    xba: s.xba ?? 0.26,
    xslg: s.xslg ?? 0.44,
    exitVeloAvg: s.exitVelo ?? 88,
    launchAngleAvg: s.launchAngle ?? 12,
    sprintSpeed: s.sprintSpeed ?? 27,
    pullPct: s.pullPct ?? 40,
    oppoPct: s.oppoPct ?? 24,
    centerPct: s.centerPct ?? 36,
    chasePct: s.chasePct ?? 28,
    contactPct: s.contactPct ?? 75,
    swStrPct: s.swstrPct ?? 10,
  }
}

function toPitching(s: PlayerStatLine): PitchingStats {
  return {
    ip: s.ip ?? 150,
    era: s.era ?? 3.8,
    whip: s.whip ?? 1.2,
    k9: s.k9 ?? 8.5,
    bb9: s.bb9 ?? 3,
    kbbPct: s.kbbPct ?? 16,
    fip: s.fip ?? 3.9,
    xfip: s.xfip ?? 4,
    sv: s.sv ?? 0,
    holds: s.holds ?? 0,
  }
}

function toPitchingAdv(s: PlayerStatLine): PitchingAdvanced {
  return {
    kind: 'pitcher',
    fip: s.fip ?? 3.8,
    xfip: s.xfip ?? 4,
    siera: s.siera ?? 3.9,
    stuffPlus: s.stuffPlus ?? 105,
    locationPlus: s.locationPlus ?? 102,
    cswPct: s.cswPct ?? 28,
    gbPct: s.gbPct ?? 42,
    fbPct: s.fbPct ?? 38,
    hrfbPct: s.hrFbPct ?? 11,
    babipAllowed: s.babipAllowed ?? 0.28,
    hardHitAllowedPct: s.hardHitAllowed ?? 36,
    barrelAllowedPct: s.barrelAllowed ?? 9,
    exitVeloAllowed: s.exitVeloAllowed ?? 88,
    spinRateFastball: s.spinRate ?? 2300,
    veloFastball: s.fastballVelo ?? 94,
  }
}

export function buildPlayer(raw: RawPlayer, id: number, stats: PlayerStatLine, writeup: string): Player {
  const pt = getPlayerType(raw.pos, raw.name)
  const role: PlayerRole = pt === 'pitcher' ? 'pitcher' : 'hitter'
  const league = getLeague(raw.team)

  if (pt === 'two-way') {
    const h = toHitting(stats)
    const p = toPitching(stats)
    const netSb = h.sb - h.cs
    const svH = p.sv + p.holds
    return {
      id,
      rank: raw.adp,
      name: raw.name,
      pos: raw.pos,
      team: raw.team,
      league,
      adp: raw.adp,
      posRank: raw.posRank,
      drafted: false,
      fWAR: stats.fWAR ?? 8,
      writeup,
      role: 'hitter',
      injury: null,
      hitting: h,
      pitching: p,
      advanced: toHittingAdv(stats),
      pitchingAdvanced: toPitchingAdv(stats),
      roto: rv(h.obp, h.slg, h.hr, netSb, p.kbbPct, p.whip, p.era, svH),
    }
  }

  if (pt === 'pitcher') {
    const p = toPitching(stats)
    const svH = p.sv + p.holds
    return {
      id,
      rank: raw.adp,
      name: raw.name,
      pos: raw.pos,
      team: raw.team,
      league,
      adp: raw.adp,
      posRank: raw.posRank,
      drafted: false,
      fWAR: stats.fWAR ?? 2,
      writeup,
      role: 'pitcher',
      injury: null,
      pitching: p,
      advanced: toPitchingAdv(stats),
      roto: rv(0, 0, 0, 0, p.kbbPct, p.whip, p.era, svH),
    }
  }

  const h = toHitting(stats)
  const netSb = h.sb - h.cs
  return {
    id,
    rank: raw.adp,
    name: raw.name,
    pos: raw.pos,
    team: raw.team,
    league,
    adp: raw.adp,
    posRank: raw.posRank,
    drafted: false,
    fWAR: stats.fWAR ?? 2,
    writeup,
    role: 'hitter',
    injury: null,
    hitting: h,
    advanced: toHittingAdv(stats),
    roto: rv(h.obp, h.slg, h.hr, netSb, 0, 99, 99, 0),
  }
}
