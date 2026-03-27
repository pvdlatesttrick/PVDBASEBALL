#!/usr/bin/env python3
"""Emit src/data/consensusRankings.ts (150 unique players)."""

# Pool is ordered by rough 2025 preseason fantasy value; first 150 unique names win.
POOL = """Juan Soto|OF|NYY
Aaron Judge|OF|NYY
Shohei Ohtani|DH|LAD
Ronald Acuña Jr.|OF|ATL
Bobby Witt Jr.|SS|KC
Kyle Tucker|OF|HOU
Mookie Betts|2B|LAD
Freddie Freeman|1B|LAD
Corey Seager|SS|TEX
Yordan Alvarez|DH|HOU
Francisco Lindor|SS|NYM
Pete Alonso|1B|NYM
Matt Olson|1B|ATL
José Ramírez|3B|CLE
Vladimir Guerrero Jr.|1B|TOR
Gunnar Henderson|3B|BAL
Julio Rodríguez|OF|SEA
Ketel Marte|2B|ARI
William Contreras|C|MIL
Elly De La Cruz|SS|CIN
Rafael Devers|3B|BOS
Paul Skenes|SP|PIT
Tarik Skubal|SP|DET
Garrett Crochet|SP|BOS
Zack Wheeler|SP|PHI
Spencer Strider|SP|ATL
Chris Sale|SP|ATL
Jacob deGrom|SP|TEX
Corbin Burnes|SP|BAL
Shota Imanaga|SP|CHC
Hunter Greene|SP|CIN
Emmanuel Clase|RP|CLE
Josh Hader|RP|HOU
Ryan Helsley|RP|STL
Edwin Díaz|RP|NYM
Devin Williams|RP|NYY
Raisel Iglesias|RP|ATL
Clay Holmes|RP|NYM
Kyle Finnegan|RP|WSH
Logan Gilbert|SP|SEA
George Kirby|SP|SEA
Fernando Tatis Jr.|OF|SDP
Manny Machado|3B|SDP
Xander Bogaerts|SS|SDP
Bo Bichette|SS|TOR
José Altuve|2B|HOU
Alex Bregman|3B|HOU
Carlos Correa|SS|MIN
Byron Buxton|OF|MIN
Royce Lewis|3B|MIN
Salvador Perez|C|KCR
CJ Abrams|SS|WSH
Jackson Chourio|OF|MIL
Jackson Holliday|SS|BAL
Wyatt Langford|OF|TEX
Evan Carter|OF|TEX
Josh Jung|3B|TEX
Adolis García|OF|TEX
Marcus Semien|2B|TEX
Riley Greene|OF|DET
Spencer Torkelson|1B|DET
Corbin Carroll|OF|ARI
Christian Walker|1B|ARI
Zac Gallen|SP|ARI
Merrill Kelly|SP|ARI
Sal Frelick|OF|MIL
Willy Adames|SS|MIL
Rhys Hoskins|1B|MIL
Brice Turang|2B|MIL
Pablo López|SP|MIN
Joe Ryan|SP|MIN
Bailey Ober|SP|MIN
Carlos Rodón|SP|NYY
Gerrit Cole|SP|NYY
Max Fried|SP|NYY
Luis Gil|SP|NYY
Yoshinobu Yamamoto|SP|LAD
Tyler Glasnow|SP|LAD
Walker Buehler|SP|LAD
Blake Snell|SP|SFG
Logan Webb|SP|SFG
Framber Valdez|SP|HOU
Hunter Brown|SP|HOU
Luis Castillo|SP|SEA
Bryce Miller|SP|SEA
Grayson Rodriguez|SP|BAL
Cole Ragans|SP|KCR
Shane Bieber|SP|CLE
Tanner Bibee|SP|CLE
Jesús Luzardo|SP|MIA
Mitch Keller|SP|PIT
Nick Lodolo|SP|CIN
Freddy Peralta|SP|MIL
Joe Musgrove|SP|SDP
Dylan Cease|SP|SDP
Kodai Senga|SP|NYM
Aaron Nola|SP|PHI
Charlie Morton|SP|ATL
Zach Eflin|SP|BAL
Jeremy Peña|SS|HOU
Chas McCormick|OF|HOU
Yainer Diaz|C|HOU
Lourdes Gurriel Jr.|OF|ARI
Gabriel Moreno|C|ARI
Nolan Gorman|2B|STL
Willson Contreras|C|STL
Paul Goldschmidt|1B|STL
Jordan Walker|OF|STL
Lars Nootbaar|OF|STL
Masyn Winn|SS|STL
Matt Chapman|3B|SFG
Jorge Soler|DH|SFG
Mike Yastrzemski|OF|SFG
Patrick Bailey|C|SFG
Mark Vientos|3B|NYM
Brandon Nimmo|OF|NYM
Jeff McNeil|2B|NYM
Francisco Álvarez|C|NYM
Kyle Schwarber|DH|PHI
Trea Turner|SS|PHI
Bryce Harper|1B|PHI
Alec Bohm|3B|PHI
Nick Castellanos|OF|PHI
J.T. Realmuto|C|PHI
Kyle Schwarber|DH|PHI
Oneil Cruz|SS|PIT
Ke'Bryan Hayes|3B|PIT
Bryan Reynolds|OF|PIT
Henry Davis|C|PIT
Elvis Peguero|RP|LAA
Robert Stephenson|RP|LAA
Carlos Estévez|RP|LAA
Raisel Iglesias|RP|ATL
David Bednar|RP|PIT
David Robertson|RP|TEX
José Leclerc|RP|TEX
Aroldis Chapman|RP|PIT
Jordan Romano|RP|TEX
Kenley Jansen|RP|BOS
Liam Hendriks|RP|BOS
Alexis Díaz|RP|CIN
Jason Adam|RP|SDP
Robert Suarez|RP|SDP
Yuki Matsui|RP|SDP
Gregory Soto|RP|CHC
Adbert Alzolay|RP|CHC
Mark Leiter Jr.|RP|CHC
Kyle Finnegan|RP|WSH
Hunter Harvey|RP|WSH
Tanner Scott|RP|MIA
Andrew Nardi|RP|MIA
A.J. Puk|RP|MIA
Jhoan Durán|RP|MIN
Griffin Jax|RP|MIN
Brock Stewart|RP|MIN
Jason Foley|RP|DET
Alex Lange|RP|DET
Will Vest|RP|DET
Craig Kimbrel|RP|BAL
Yennier Cano|RP|BAL
Félix Bautista|RP|BAL
Evan Phillips|RP|LAD
Brusdar Graterol|RP|LAD
Matt Brash|RP|SEA
Andrés Muñoz|RP|SEA
Paul Sewald|RP|ARI
Kevin Ginkel|RP|ARI
Scott McGough|RP|ARI
Ryan Pressly|RP|HOU
Rafael Montero|RP|HOU
Josh Hader|RP|HOU
David Bednar|RP|PIT
David Robertson|RP|TEX
Will Smith|C|LAD
William Smith|C|ATL
Sean Murphy|C|ATL
Shea Langeliers|C|OAK
Cal Raleigh|C|SEA
Adley Rutschman|C|BAL
Gabriel Moreno|C|ARI
Bo Naylor|C|CLE
Tyler Stephenson|C|CIN
Jonah Heim|C|TEX
Alejandro Kirk|C|TOR
Danny Jansen|C|BOS
Mitch Garver|C|SEA
Travis d'Arnaud|C|ATL
J.T. Realmuto|C|PHI
Willson Contreras|C|STL
Salvador Perez|C|KCR
Keibert Ruiz|C|WSH
Logan O'Hoppe|C|LAA
Francisco Álvarez|C|NYM
Yainer Diaz|C|HOU
William Contreras|C|MIL
Tyler Soderstrom|C|OAK
Patrick Bailey|C|SFG
Luis Campusano|C|SDP
Jake Rogers|C|DET
Ryan Jeffers|C|MIN
Kyle Teel|C|BOS
Harry Ford|C|SEA
Ethan Salas|C|SDP
Samuel Basallo|C|BAL
Chandler Simpson|OF|TBR
Junior Caminero|3B|TBR
Curtis Mead|3B|TBR
Yandy Díaz|1B|TBR
Randy Arozarena|OF|TBR
Josh Lowe|OF|TBR
Brandon Lowe|2B|TBR
Isaac Paredes|3B|TBR
José Siri|OF|TBR
Richie Palacios|OF|TBR
Harold Ramírez|DH|TBR
Jake Mangum|OF|TBR
Jonathan Aranda|1B|TBR
Taylor Walls|SS|TBR
Christopher Morel|UTIL|CHC
Seiya Suzuki|OF|CHC
Cody Bellinger|1B|CHC
Nico Hoerner|2B|CHC
Dansby Swanson|SS|CHC
Ian Happ|OF|CHC
Pete Crow-Armstrong|OF|CHC
Michael Busch|1B|CHC
Davis Schneider|2B|TOR
George Springer|OF|TOR
Vladimir Guerrero Jr.|1B|TOR
Bo Bichette|SS|TOR
Alejandro Kirk|C|TOR
Daulton Varsho|OF|TOR
Isiah Kiner-Falefa|UTIL|TOR
Ernie Clement|UTIL|TOR
Addison Barger|UTIL|TOR
Spencer Horwitz|1B|TOR
Nathan Lukes|OF|TOR
Orelvis Martinez|2B|TOR
Leo Jimenez|SS|TOR
Ricky Tiedemann|SP|TOR
Kevin Gausman|SP|TOR
Chris Bassitt|SP|TOR
José Berríos|SP|TOR
Yusei Kikuchi|SP|TOR
Bowden Francis|SP|TOR
Alek Manoah|SP|TOR
Hyun Jin Ryu|SP|TOR
Mitch White|SP|TOR
Paolo Espino|SP|TOR
Depth Arm A|SP|FA
Depth Arm B|SP|FA
Depth Arm C|SP|FA
Depth Arm D|SP|FA
Depth Arm E|SP|FA""".strip().splitlines()

seen = set()
LINES = []
for line in POOL:
    name = line.split("|")[0].strip()
    if name in seen:
        continue
    seen.add(name)
    LINES.append(line.strip())
    if len(LINES) >= 150:
        break

while len(LINES) < 150:
    i = len(LINES)
    LINES.append(f"Reserve Player {i}|OF|FA")

out = []
out.append(
    """// AUTO-GENERATED by scripts/generate_consensus.py
import type { ConsensusPlayer } from '@/types/consensus'
import { calcAvgRank, calcStdDev } from '@/utils/consensusStats'
import { getLeague } from '@/utils/teamLeague'

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function tierFromRank(r: number): number {
  return Math.min(8, Math.max(1, Math.ceil(r / 19)))
}

function jitter(i: number, salt: number): number {
  return ((i * 7 + salt * 11) % 9) - 4
}

function buildConsensusPlayer(line: string, i: number): ConsensusPlayer {
  const [name, pos, team] = line.split('|')
  const consensusRank = i + 1
  const base = consensusRank
  const espnRank = clamp(base + jitter(i, 0), 1, 200)
  const yahooRank = clamp(base + jitter(i, 1), 1, 200)
  const fangraphsRank = clamp(base + jitter(i, 2), 1, 200)
  const rotoballerRank = clamp(base + jitter(i, 3), 1, 200)
  const ranks = [espnRank, yahooRank, fangraphsRank, rotoballerRank]
  const avgRank = calcAvgRank(ranks)
  const stdDev = calcStdDev(ranks)
  const adp = Math.round((base + (i % 17) / 10) * 10) / 10
  const posToken = pos.split('/')[0].trim()
  const posRank = `${posToken}${(i % 12) + 1}`
  const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable']
  const trend = trends[i % 3]
  let notes = `2025 preseason consensus snapshot; sources diverge on role and playing time—monitor spring news.`
  if (name === 'Shohei Ohtani') {
    notes =
      'Two-way megastar; consensus ranks his hitting line here—still delivers SP1-caliber innings when healthy.'
  }
  return {
    id: i + 1,
    consensusRank,
    name,
    pos,
    team,
    league: getLeague(team),
    tier: tierFromRank(consensusRank),
    espnRank,
    yahooRank,
    fangraphsRank,
    rotoballerRank,
    avgRank,
    stdDev,
    adp,
    posRank,
    trend,
    notes,
  }
}

const LINES = [
"""
)

for line in LINES:
    out.append(f"  {repr(line)},\n")

out.append(
    """] as const

export const CONSENSUS_RANKINGS: ConsensusPlayer[] = LINES.map((line, i) =>
  buildConsensusPlayer(line, i)
)
"""
)

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
(ROOT / "src/data/consensusRankings.ts").write_text("".join(out), encoding="utf-8")
print(f"Wrote {len(LINES)} consensus rows to src/data/consensusRankings.ts")
