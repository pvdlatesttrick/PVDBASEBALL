/**
 * Data quality check after `npm run fetch-data`.
 * Run: npm run verify-data
 */
import { RAW_ROSTER } from '../src/data/rawRoster'
import { PLAYER_STATS } from '../src/data/playerStats'

const fakeNamePatterns = [/^[A-Z][a-z]+ [A-Z][a-z]+ \d+$/, /^Player \d+$/]

let fakeCount = 0
for (const p of RAW_ROSTER) {
  if (fakeNamePatterns.some((re) => re.test(p.name))) {
    console.warn('FAKE PLAYER DETECTED:', p.name)
    fakeCount++
  }
}

const withStats = RAW_ROSTER.filter((p) => PLAYER_STATS[p.name])
const withoutStats = RAW_ROSTER.filter((p) => !PLAYER_STATS[p.name])

console.log(`Total players: ${RAW_ROSTER.length}`)
console.log(`With real stats: ${withStats.length}`)
console.log(`Missing stats: ${withoutStats.length}`)
console.log(`Fake names detected: ${fakeCount}`)

if (fakeCount > 0 || RAW_ROSTER.length < 200) {
  console.error('\nDATA QUALITY FAILURE — re-run npm run fetch-data')
  process.exit(1)
} else {
  console.log('\nData looks real and complete.')
}
