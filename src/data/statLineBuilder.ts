import type { RawPlayer } from '@/data/rawPlayer'
import type { PlayerStatLine } from '@/types/playerStatLine'

function hashName(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** 0 = elite, 1 = deep */
function tierFromAdp(adp: number): number {
  return Math.min(1, Math.max(0, (adp - 1) / 520))
}

function jitter(seed: number, lo: number, hi: number): number {
  const u = Math.abs((Math.sin(seed) * 10000) % 1)
  const x = Number.isFinite(u) ? u : (hashName(String(seed)) % 1000) / 1000
  return lo + (hi - lo) * x
}

function isPitcherPos(pos: string): boolean {
  const u = pos.toUpperCase()
  return u.includes('SP') || u.includes('RP') || u === 'P'
}

export function buildStatLine(raw: RawPlayer): PlayerStatLine {
  if (raw.name === 'Shohei Ohtani') {
    return {
      fWAR: 9.4,
      pa: 542,
      avg: 0.298,
      obp: 0.382,
      slg: 0.588,
      hr: 38,
      rbi: 96,
      r: 102,
      sb: 14,
      cs: 3,
      bbPct: 14.2,
      kPct: 18.4,
      ip: 132,
      era: 2.65,
      whip: 0.95,
      k9: 11.2,
      bb9: 2.1,
      kbbPct: 21.5,
      fip: 2.78,
      xfip: 2.92,
      sv: 0,
      holds: 0,
      svh: 0,
      babip: 0.302,
      hardHitPct: 52.4,
      barrelPct: 17.8,
      xba: 0.288,
      xslg: 0.562,
      exitVelo: 94.1,
      launchAngle: 14.8,
      sprintSpeed: 28.4,
      chasePct: 24.2,
      contactPct: 74.2,
      swstrPct: 11.4,
      pullPct: 41,
      oppoPct: 25,
      centerPct: 34,
      siera: 2.85,
      stuffPlus: 132,
      locationPlus: 110,
      cswPct: 34.2,
      gbPct: 42,
      fbPct: 36,
      hrFbPct: 9.2,
      babipAllowed: 0.268,
      hardHitAllowed: 32.8,
      barrelAllowed: 7.2,
      exitVeloAllowed: 86.2,
      spinRate: 2520,
      fastballVelo: 97.8,
    }
  }

  const t = tierFromAdp(raw.adp)
  const h = hashName(raw.name)
  const seed = h % 9973

  if (isPitcherPos(raw.primaryPos)) {
    const isRp = raw.primaryPos === 'RP'
    const ip = Math.round(jitter(seed, 175, 195) - t * 95)
    const era = 2.4 + t * 3.2 + jitter(seed + 1, -0.35, 0.35)
    const whip = 0.88 + t * 0.38 + jitter(seed + 2, -0.06, 0.06)
    const k9 = 10.8 - t * 3.5 + jitter(seed + 3, -0.4, 0.4)
    const bb9 = 2.0 + t * 1.8 + jitter(seed + 4, -0.2, 0.2)
    const kbbPct = Math.max(8, Math.min(28, k9 * 2.1 - bb9 * 2.4 + jitter(seed + 5, -2, 2)))
    const sv = isRp ? Math.round(jitter(seed + 6, 8, 42) * (1 - t)) : 0
    const holds = isRp ? Math.round(jitter(seed + 7, 12, 28) * (1 - t * 0.5)) : 0
    const svh = sv + holds
    const fip = era + jitter(seed + 8, -0.35, 0.35)
    const xfip = fip + jitter(seed + 9, -0.2, 0.25)

    return {
      fWAR: Math.max(0.2, 6.2 - t * 5.5 + jitter(seed, -0.4, 0.4)),
      ip: Math.max(40, ip),
      era: Math.round(era * 100) / 100,
      whip: Math.round(whip * 100) / 100,
      k9: Math.round(k9 * 10) / 10,
      bb9: Math.round(bb9 * 10) / 10,
      kbbPct: Math.round(kbbPct * 10) / 10,
      fip: Math.round(fip * 100) / 100,
      xfip: Math.round(xfip * 100) / 100,
      sv: Math.round(sv),
      holds: Math.round(holds),
      svh: Math.round(svh),
      siera: Math.round((fip + 0.15) * 100) / 100,
      stuffPlus: Math.round(118 - t * 28 + jitter(seed + 10, -4, 4)),
      locationPlus: Math.round(108 - t * 15 + jitter(seed + 11, -3, 3)),
      cswPct: Math.round((30 - t * 6 + jitter(seed + 12, -1.5, 1.5)) * 10) / 10,
      gbPct: Math.round(42 + jitter(seed + 13, -6, 6)),
      fbPct: Math.round(38 + jitter(seed + 14, -5, 5)),
      hrFbPct: Math.round((9 + t * 4 + jitter(seed + 15, -1.2, 1.2)) * 10) / 10,
      babipAllowed: Math.round((0.268 + t * 0.04 + jitter(seed + 16, -0.012, 0.012)) * 1000) / 1000,
      hardHitAllowed: Math.round(34 + t * 8 + jitter(seed + 17, -2, 2)),
      barrelAllowed: Math.round(8 + t * 4 + jitter(seed + 18, -1, 1)),
      exitVeloAllowed: Math.round((87 + t * 2.5 + jitter(seed + 19, -0.6, 0.6)) * 10) / 10,
      spinRate: Math.round(2280 + t * 80 + jitter(seed + 20, -40, 40)),
      fastballVelo: Math.round((95 + t * 1.2 + jitter(seed + 21, -0.5, 0.5)) * 10) / 10,
    }
  }

  const pa = Math.round(680 - t * 260 + jitter(seed, -18, 18))
  const hr = Math.max(4, Math.round(42 - t * 36 + jitter(seed + 1, -4, 4)))
  const obp = Math.min(0.45, Math.max(0.28, 0.3 + (1 - t) * 0.12 + jitter(seed + 2, -0.018, 0.018)))
  const slg = Math.min(0.62, Math.max(0.35, 0.38 + (1 - t) * 0.2 + jitter(seed + 3, -0.028, 0.028)))
  const avg = Math.min(0.33, Math.max(0.21, obp - 0.055 + jitter(seed + 4, -0.012, 0.012)))
  const sb = Math.max(0, Math.round(38 - t * 34 + jitter(seed + 5, -4, 4)))
  const cs = Math.max(0, Math.round(sb * 0.12 + jitter(seed + 6, 0, 3)))
  const rbi = Math.round(110 - t * 72 + jitter(seed + 7, -10, 10))
  const r = Math.round(rbi * 0.95 + jitter(seed + 8, -8, 12))
  const bbPct = Math.min(18, Math.max(5, 7 + (1 - t) * 9 + jitter(seed + 9, -1.2, 1.2)))
  const kPct = Math.min(32, Math.max(12, 22 - (1 - t) * 6 + jitter(seed + 10, -2, 2)))

  return {
    fWAR: Math.max(0.1, 6.5 - t * 5.8 + jitter(seed + 11, -0.35, 0.35)),
    pa,
    avg: Math.round(avg * 1000) / 1000,
    obp: Math.round(obp * 1000) / 1000,
    slg: Math.round(slg * 1000) / 1000,
    hr,
    rbi,
    r,
    sb,
    cs,
    bbPct: Math.round(bbPct * 10) / 10,
    kPct: Math.round(kPct * 10) / 10,
    babip: Math.round((0.28 + (1 - t) * 0.05 + jitter(seed + 12, -0.012, 0.012)) * 1000) / 1000,
    hardHitPct: Math.round(52 - t * 18 + jitter(seed + 13, -3, 3)),
    barrelPct: Math.round(16 - t * 11 + jitter(seed + 14, -2, 2)),
    xba: Math.round((avg - 0.012 + jitter(seed + 15, -0.01, 0.01)) * 1000) / 1000,
    xslg: Math.round((slg - 0.02 + jitter(seed + 16, -0.015, 0.015)) * 1000) / 1000,
    exitVelo: Math.round((93 - t * 6 + jitter(seed + 17, -0.8, 0.8)) * 10) / 10,
    launchAngle: Math.round(14 - t * 4 + jitter(seed + 18, -2, 2)),
    sprintSpeed: Math.round((28.8 - t * 3.5 + jitter(seed + 19, -0.6, 0.6)) * 10) / 10,
    chasePct: Math.round(28 - t * 8 + jitter(seed + 20, -2, 2)),
    contactPct: Math.round(74 + (1 - t) * 8 + jitter(seed + 21, -2, 2)),
    swstrPct: Math.round(11 + t * 3 + jitter(seed + 22, -1.2, 1.2)),
    pullPct: Math.round(42 + jitter(seed + 23, -6, 6)),
    oppoPct: Math.round(24 + jitter(seed + 24, -4, 4)),
    centerPct: Math.round(34 + jitter(seed + 25, -3, 3)),
  }
}
