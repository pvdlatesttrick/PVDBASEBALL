import type { AdvancedStats } from '@/types/player'

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/50">
      <div className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className="mt-0.5 font-mono text-sm tabular-nums text-zinc-900 dark:text-zinc-100">
        {value}
      </div>
    </div>
  )
}

function pct(n: number) {
  return `${n.toFixed(1)}%`
}

export function StatGrid({ advanced }: { advanced: AdvancedStats }) {
  if (advanced.kind === 'hitter') {
    const a = advanced
    return (
      <div className="grid grid-cols-2 gap-2">
        <Card label="BABIP" value={a.babip.toFixed(3)} />
        <Card label="Hard hit %" value={pct(a.hardHitPct)} />
        <Card label="Barrel %" value={pct(a.barrelPct)} />
        <Card label="xBA" value={a.xba.toFixed(3)} />
        <Card label="xSLG" value={a.xslg.toFixed(3)} />
        <Card label="Exit velo (avg)" value={`${a.exitVeloAvg.toFixed(1)} mph`} />
        <Card label="Launch angle (avg)" value={`${a.launchAngleAvg.toFixed(1)}°`} />
        <Card label="Sprint speed" value={`${a.sprintSpeed.toFixed(1)} ft/s`} />
        <Card label="Pull %" value={pct(a.pullPct)} />
        <Card label="Oppo %" value={pct(a.oppoPct)} />
        <Card label="Center %" value={pct(a.centerPct)} />
        <Card label="Chase %" value={pct(a.chasePct)} />
        <Card label="Contact %" value={pct(a.contactPct)} />
        <Card label="SwStr%" value={pct(a.swStrPct)} />
      </div>
    )
  }

  const a = advanced
  return (
    <div className="grid grid-cols-2 gap-2">
      <Card label="FIP" value={a.fip.toFixed(2)} />
      <Card label="xFIP" value={a.xfip.toFixed(2)} />
      <Card label="SIERA" value={a.siera.toFixed(2)} />
      <Card label="Stuff+" value={a.stuffPlus.toFixed(0)} />
      <Card label="Location+" value={a.locationPlus.toFixed(0)} />
      <Card label="CSW%" value={pct(a.cswPct)} />
      <Card label="GB%" value={pct(a.gbPct)} />
      <Card label="FB%" value={pct(a.fbPct)} />
      <Card label="HR/FB%" value={pct(a.hrfbPct)} />
      <Card label="BABIP allowed" value={a.babipAllowed.toFixed(3)} />
      <Card label="Hard hit % allowed" value={pct(a.hardHitAllowedPct)} />
      <Card label="Barrel % allowed" value={pct(a.barrelAllowedPct)} />
      <Card label="Avg exit velo allowed" value={`${a.exitVeloAllowed.toFixed(1)} mph`} />
      <Card label="FB spin rate" value={`${a.spinRateFastball} rpm`} />
      <Card label="FB velocity (avg)" value={`${a.veloFastball.toFixed(1)} mph`} />
    </div>
  )
}
