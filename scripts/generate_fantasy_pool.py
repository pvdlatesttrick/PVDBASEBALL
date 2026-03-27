#!/usr/bin/env python3
"""Generates src/data/rawRoster.ts — ~560 draftable MLB fantasy players."""
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src/data/rawRoster.ts"

MLB = [
    "NYY", "BOS", "TOR", "TB", "BAL",
    "CLE", "MIN", "CWS", "KC", "DET",
    "HOU", "SEA", "TEX", "OAK", "LAA",
    "NYM", "ATL", "PHI", "MIA", "WSH",
    "CHC", "STL", "MIL", "CIN", "PIT",
    "LAD", "SD", "SF", "ARI", "COL",
]

FIRST = [
    "Juan", "Aaron", "Ronald", "Bobby", "Mookie", "Freddie", "Corey", "Yordan", "Francisco", "Pete",
    "Matt", "José", "Vladimir", "Gunnar", "Julio", "Ketel", "William", "Elly", "Rafael", "Paul",
    "Tarik", "Garrett", "Zack", "Spencer", "Chris", "Jacob", "Corbin", "Shota", "Hunter", "Emmanuel",
    "Josh", "Ryan", "Edwin", "Devin", "Raisel", "Clay", "Kyle", "Logan", "George", "Luis",
    "Manny", "Xander", "Bo", "Alex", "Carlos", "Byron", "Royce", "Salvador", "CJ", "Jackson",
    "Wyatt", "Evan", "Marcus", "Riley", "Christian", "Zac", "Merrill", "Sal", "Willy", "Rhys",
    "Brice", "Pablo", "Joe", "Bailey", "Gerrit", "Max", "Cody", "Trea", "Bryce", "Nick",
    "Austin", "Randy", "Teoscar", "Seiya", "Ian", "Michael", "Brandon", "Nolan", "Trevor", "Oneil",
    "Jazz", "Starling", "Tommy", "Lane", "Tyler", "Justin", "Walker", "Jordan", "Hayden", "Grayson",
    "Dylan", "Framber", "Jesus", "Nestor", "Clarke", "Tanner", "Robert", "Kodai", "Yoshinobu", "Blake",
    "Mason", "Hurston", "Chase", "Andrew", "Charlie", "Jack", "Brayan", "Keibert", "Will", "Adley",
    "J.T.", "Sean", "Cal", "Gabriel", "Danny", "Shea", "Patrick", "James", "Ethan", "Roman",
    "Junior", "Ezequiel", "Heliot", "Jarred", "Taylor", "Lars", "Daulton", "Gavin", "Ha-Seong", "Lars",
]

LAST = [
    "Soto", "Judge", "Acuña Jr.", "Witt Jr.", "Betts", "Freeman", "Seager", "Alvarez", "Lindor", "Alonso",
    "Olson", "Ramírez", "Guerrero Jr.", "Henderson", "Rodríguez", "Marte", "Contreras", "De La Cruz", "Devers", "Skenes",
    "Skubal", "Crochet", "Wheeler", "Strider", "Sale", "deGrom", "Burnes", "Imanaga", "Greene", "Clase",
    "Hader", "Helsley", "Díaz", "Williams", "Iglesias", "Holmes", "Finnegan", "Gilbert", "Kirby", "Castillo",
    "Machado", "Bogaerts", "Bichette", "Bregman", "Correa", "Buxton", "Lewis", "Pérez", "Abrams", "Chourio",
    "Holliday", "Langford", "Carter", "Jung", "García", "Semien", "Greene", "Torkelson", "Carroll", "Walker",
    "Gallen", "Kelly", "Frelick", "Adames", "Hoskins", "Turang", "López", "Ryan", "Ober", "Rodón",
    "Cole", "Fried", "Gil", "Bellinger", "Turner", "Castellanos", "Riley", "Arozarena", "Hernández", "Suzuki",
    "Happ", "Harris II", "Jones", "Arenado", "Story", "McNeil", "Cruz", "Yelich", "Robert Jr.", "Jiménez",
    "Edman", "Donovan", "Gorman", "Neto", "Volpe", "Perdomo", "Morel", "Rutschman", "Realmuto", "Murphy",
    "Smith", "Heim", "Raleigh", "Álvarez", "Moreno", "Campusano", "Naylor", "Vaughn", "Bell", "Rizzo",
    "Mountcastle", "Muncy", "Casas", "France", "Drury", "Busch", "Chapman", "Hayes", "Moncada", "Caminero",
    "Stott", "Hoerner", "Giménez", "Anderson", "Polanco", "McNeil", "Lowe", "Raley", "Suwinski", "McCarthy",
]


def build_slots():
    slots = []
    def push(primary, pos, n):
        for _ in range(n):
            slots.append({"primaryPos": primary, "pos": pos})
    push("SP", "SP", 174)
    push("RP", "RP", 96)
    push("OF", "OF", 121)
    push("C", "C", 28)
    push("1B", "1B", 35)
    push("3B", "3B", 30)
    push("2B", "2B", 32)
    push("SS", "SS", 34)
    push("DH", "DH", 9)
    return slots


def esc(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def main():
    rng = random.Random(20250327)
    slots = build_slots()
    assert len(slots) == 559, len(slots)
    rng.shuffle(slots)

    used = {"Shohei Ohtani"}
    rows = []

    def unique_name(i):
        for attempt in range(5000):
            fi = rng.randrange(len(FIRST))
            li = rng.randrange(len(LAST))
            n = f"{FIRST[fi]} {LAST[li]}"
            if attempt % 71 == 0:
                n += " Jr."
            if n not in used:
                used.add(n)
                return n
            n = f"{FIRST[fi]} {LAST[li]} {attempt}"
            if n not in used:
                used.add(n)
                return n
        fb = f"Player {i}"
        used.add(fb)
        return fb

    for i, s in enumerate(slots):
        team = MLB[i % len(MLB)]
        rows.append({
            "primaryPos": s["primaryPos"],
            "pos": s["pos"],
            "team": team,
            "name": unique_name(i),
        })

    rows.append({
        "primaryPos": "SP",
        "pos": "SP/DH",
        "team": "LAD",
        "name": "Shohei Ohtani",
    })

    def pos_weight(p):
        return {
            "SP": 1.0, "RP": 0.92, "OF": 0.95, "SS": 0.94, "C": 0.88,
            "1B": 0.9, "3B": 0.9, "2B": 0.9, "DH": 0.89,
        }.get(p, 0.9)

    for i, r in enumerate(rows):
        rr = random.Random(i + len(r["name"]) * 13).random()
        if r["name"] == "Shohei Ohtani":
            r["_score"] = 10000.0
        else:
            r["_score"] = pos_weight(r["primaryPos"]) * 50 + rr * 8

    rows.sort(key=lambda x: -x["_score"])
    total = len(rows)

    for i, r in enumerate(rows):
        rank = i + 1
        base = 1 + ((rank - 1) * 498) / max(1, total - 1)
        noise = (random.Random(rank * 7919).random() - 0.5) * 0.85
        r["adp"] = round(base + noise, 1)
        if r["name"] == "Shohei Ohtani":
            r["adp"] = 1.2

    by_prim = {}
    for r in rows:
        by_prim.setdefault(r["primaryPos"], []).append(r)
    for grp in by_prim.values():
        grp.sort(key=lambda x: x["adp"])
        for i, r in enumerate(grp):
            r["posRank"] = f"{r['primaryPos']}{i + 1}"

    lines = [
        "import type { RawPlayer } from './rawPlayer'",
        "",
        "/** ~560 draftable players — generated by scripts/generate_fantasy_pool.py */",
        "export const RAW_ROSTER: RawPlayer[] = [",
    ]
    for r in rows:
        lines.append(
            "  { name: '%s', pos: '%s', primaryPos: '%s', team: '%s', adp: %s, posRank: '%s' },"
            % (esc(r["name"]), esc(r["pos"]), r["primaryPos"], r["team"], r["adp"], esc(r["posRank"]))
        )
    lines.append("]")
    lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {len(rows)} players to {OUT}")


if __name__ == "__main__":
    main()
