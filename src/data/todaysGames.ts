import type { LineupSlot, MLBGame } from '@/types/matchup'
import { fetchMlbGamesForDate, todayYmdET } from '@/services/mlbSchedule'

export type { LineupSlot, MLBGame } from '@/types/matchup'

function lu(...rows: readonly [string, string, 'L' | 'R' | 'S'][]): LineupSlot[] {
  return rows.map((r, i) => ({
    battingOrder: i + 1,
    playerName: r[0],
    pos: r[1],
    bats: r[2],
  }))
}

/**
 * Static slate — swap `fetchTodaysGames` implementation to call MLB Stats API when ready:
 * `GET https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=YYYY-MM-DD`
 * (no API key). Map `games[].teams` + probable pitchers + lineups from `live` feed or gameday.
 */
export const STATIC_TODAYS_GAMES: MLBGame[] = [
  {
    id: 1,
    gameTime: '1:10 PM ET',
    awayTeam: 'NYY',
    homeTeam: 'BOS',
    awayStarter: 'Gerrit Cole',
    homeStarter: 'Chris Sale',
    awayStarterHand: 'R',
    homeStarterHand: 'L',
    venue: 'Fenway Park',
    awayLineup: lu(
      ['DJ LeMahieu', '2B', 'R'],
      ['Aaron Judge', 'RF', 'R'],
      ['Juan Soto', 'LF', 'L'],
      ['Giancarlo Stanton', 'DH', 'R'],
      ['Anthony Rizzo', '1B', 'L'],
      ['Gleyber Torres', 'SS', 'R'],
      ['Alex Verdugo', 'CF', 'L'],
      ['Jose Trevino', 'C', 'R'],
      ['Oswaldo Cabrera', '3B', 'S']
    ),
    homeLineup: lu(
      ['Jarren Duran', 'LF', 'L'],
      ['Rafael Devers', '3B', 'L'],
      ['Trevor Story', 'SS', 'R'],
      ['Tyler O\'Neill', 'RF', 'R'],
      ['Masataka Yoshida', 'DH', 'L'],
      ['Connor Wong', 'C', 'R'],
      ['Ceddanne Rafaela', 'CF', 'R'],
      ['Dominic Smith', '1B', 'L'],
      ['David Hamilton', '2B', 'L']
    ),
  },
  {
    id: 2,
    gameTime: '2:20 PM ET',
    awayTeam: 'LAD',
    homeTeam: 'CHC',
    awayStarter: 'Walker Buehler',
    homeStarter: 'Justin Steele',
    awayStarterHand: 'R',
    homeStarterHand: 'L',
    venue: 'Wrigley Field',
    awayLineup: lu(
      ['Mookie Betts', '2B', 'R'],
      ['Shohei Ohtani', 'DH', 'L'],
      ['Freddie Freeman', '1B', 'L'],
      ['Will Smith', 'C', 'R'],
      ['Teoscar Hernández', 'RF', 'R'],
      ['Max Muncy', '3B', 'L'],
      ['James Outman', 'CF', 'L'],
      ['Enrique Hernández', 'LF', 'R'],
      ['Miguel Rojas', 'SS', 'R']
    ),
    homeLineup: lu(
      ['Ian Happ', 'LF', 'L'],
      ['Seiya Suzuki', 'RF', 'R'],
      ['Cody Bellinger', 'CF', 'L'],
      ['Christopher Morel', 'DH', 'R'],
      ['Dansby Swanson', 'SS', 'R'],
      ['Michael Busch', '1B', 'L'],
      ['Nico Hoerner', '2B', 'R'],
      ['Matt Shaw', '3B', 'R'],
      ['Miguel Amaya', 'C', 'R']
    ),
  },
  {
    id: 3,
    gameTime: '2:35 PM ET',
    awayTeam: 'HOU',
    homeTeam: 'TEX',
    awayStarter: 'Framber Valdez',
    homeStarter: 'Jon Gray',
    awayStarterHand: 'L',
    homeStarterHand: 'R',
    venue: 'Globe Life Field',
    awayLineup: lu(
      ['Jose Altuve', '2B', 'R'],
      ['Yordan Alvarez', 'DH', 'L'],
      ['Kyle Tucker', 'RF', 'L'],
      ['Yainer Diaz', 'C', 'R'],
      ['Alex Bregman', '3B', 'R'],
      ['Jose Abreu', '1B', 'R'],
      ['Chas McCormick', 'CF', 'R'],
      ['Jake Meyers', 'LF', 'R'],
      ['Jeremy Peña', 'SS', 'R']
    ),
    homeLineup: lu(
      ['Marcus Semien', '2B', 'R'],
      ['Corey Seager', 'SS', 'L'],
      ['Josh Jung', '3B', 'R'],
      ['Adolis García', 'RF', 'R'],
      ['Evan Carter', 'LF', 'L'],
      ['Jonah Heim', 'C', 'S'],
      ['Nathaniel Lowe', '1B', 'L'],
      ['Wyatt Langford', 'CF', 'R'],
      ['Josh Smith', 'DH', 'L']
    ),
  },
  {
    id: 4,
    gameTime: '4:05 PM ET',
    awayTeam: 'ATL',
    homeTeam: 'PHI',
    awayStarter: 'Max Fried',
    homeStarter: 'Zack Wheeler',
    awayStarterHand: 'L',
    homeStarterHand: 'R',
    venue: 'Citizens Bank Park',
    awayLineup: lu(
      ['Ronald Acuña Jr.', 'RF', 'R'],
      ['Ozzie Albies', '2B', 'S'],
      ['Austin Riley', '3B', 'R'],
      ['Matt Olson', '1B', 'L'],
      ['Marcell Ozuna', 'DH', 'R'],
      ['Michael Harris II', 'CF', 'L'],
      ['Sean Murphy', 'C', 'R'],
      ['Jarred Kelenic', 'LF', 'L'],
      ['Orlando Arcia', 'SS', 'R']
    ),
    homeLineup: lu(
      ['Kyle Schwarber', 'DH', 'L'],
      ['Trea Turner', 'SS', 'R'],
      ['Bryce Harper', '1B', 'L'],
      ['Nick Castellanos', 'RF', 'R'],
      ['J.T. Realmuto', 'C', 'R'],
      ['Bryson Stott', '2B', 'L'],
      ['Brandon Marsh', 'LF', 'L'],
      ['Alec Bohm', '3B', 'R'],
      ['Johan Rojas', 'CF', 'R']
    ),
  },
  {
    id: 5,
    gameTime: '4:15 PM ET',
    awayTeam: 'SD',
    homeTeam: 'SF',
    awayStarter: 'Yu Darvish',
    homeStarter: 'Logan Webb',
    awayStarterHand: 'R',
    homeStarterHand: 'R',
    venue: 'Oracle Park',
    awayLineup: lu(
      ['Xander Bogaerts', 'SS', 'R'],
      ['Fernando Tatis Jr.', 'RF', 'R'],
      ['Luis Arraez', '2B', 'L'],
      ['Manny Machado', '3B', 'R'],
      ['Jake Cronenworth', '1B', 'L'],
      ['Ha-Seong Kim', 'DH', 'R'],
      ['Jackson Merrill', 'CF', 'L'],
      ['Luis Campusano', 'C', 'R'],
      ['Jurickson Profar', 'LF', 'S']
    ),
    homeLineup: lu(
      ['LaMonte Wade Jr.', 'LF', 'L'],
      ['Jung Hoo Lee', 'CF', 'L'],
      ['Matt Chapman', '3B', 'R'],
      ['Wilmer Flores', 'DH', 'R'],
      ['Mike Yastrzemski', 'RF', 'L'],
      ['Patrick Bailey', 'C', 'S'],
      ['Tyler Fitzgerald', 'SS', 'R'],
      ['Heliot Ramos', 'RF', 'R'],
      ['Casey Schmitt', '2B', 'R']
    ),
  },
  {
    id: 6,
    gameTime: '6:35 PM ET',
    awayTeam: 'TB',
    homeTeam: 'BAL',
    awayStarter: 'Shane McClanahan',
    homeStarter: 'Grayson Rodriguez',
    awayStarterHand: 'L',
    homeStarterHand: 'R',
    venue: 'Oriole Park at Camden Yards',
    awayLineup: lu(
      ['Yandy Díaz', '1B', 'R'],
      ['Brandon Lowe', '2B', 'L'],
      ['Randy Arozarena', 'LF', 'R'],
      ['Isaac Paredes', '3B', 'R'],
      ['Josh Lowe', 'RF', 'L'],
      ['José Caballero', 'SS', 'R'],
      ['Jonathan Aranda', 'DH', 'L'],
      ['Curtis Mead', '3B', 'R'],
      ['Rene Pinto', 'C', 'R']
    ),
    homeLineup: lu(
      ['Gunnar Henderson', 'SS', 'L'],
      ['Adley Rutschman', 'C', 'S'],
      ['Anthony Santander', 'RF', 'S'],
      ['Ryan Mountcastle', '1B', 'R'],
      ['Ryan O\'Hearn', 'DH', 'L'],
      ['Jordan Westburg', '2B', 'R'],
      ['Cedric Mullins', 'CF', 'L'],
      ['Colton Cowser', 'LF', 'L'],
      ['Ramón Urías', '3B', 'R']
    ),
  },
  {
    id: 7,
    gameTime: '7:15 PM ET',
    awayTeam: 'MIL',
    homeTeam: 'STL',
    awayStarter: 'Freddy Peralta',
    homeStarter: 'Miles Mikolas',
    awayStarterHand: 'R',
    homeStarterHand: 'R',
    venue: 'Busch Stadium',
    awayLineup: lu(
      ['William Contreras', 'C', 'R'],
      ['Willy Adames', 'SS', 'R'],
      ['Christian Yelich', 'LF', 'L'],
      ['Rhys Hoskins', '1B', 'R'],
      ['Sal Frelick', 'RF', 'L'],
      ['Brice Turang', '2B', 'L'],
      ['Joey Ortiz', '3B', 'R'],
      ['Blake Perkins', 'CF', 'S'],
      ['Oliver Dunn', 'DH', 'L']
    ),
    homeLineup: lu(
      ['Brendan Donovan', '2B', 'L'],
      ['Willson Contreras', 'C', 'R'],
      ['Paul Goldschmidt', '1B', 'R'],
      ['Nolan Gorman', 'DH', 'L'],
      ['Alec Burleson', 'LF', 'L'],
      ['Lars Nootbaar', 'RF', 'L'],
      ['Nolan Arenado', '3B', 'R'],
      ['Masyn Winn', 'SS', 'R'],
      ['Victor Scott II', 'CF', 'L']
    ),
  },
  {
    id: 8,
    gameTime: '7:40 PM ET',
    awayTeam: 'CLE',
    homeTeam: 'MIN',
    awayStarter: 'Shane Bieber',
    homeStarter: 'Pablo López',
    awayStarterHand: 'R',
    homeStarterHand: 'R',
    venue: 'Target Field',
    awayLineup: lu(
      ['Steven Kwan', 'LF', 'L'],
      ['José Ramírez', '3B', 'S'],
      ['Josh Naylor', '1B', 'L'],
      ['Kyle Manzardo', 'DH', 'L'],
      ['Will Brennan', 'RF', 'L'],
      ['Andrés Giménez', '2B', 'L'],
      ['Bo Naylor', 'C', 'L'],
      ['Gabriel Arias', 'SS', 'R'],
      ['Tyler Freeman', 'CF', 'R']
    ),
    homeLineup: lu(
      ['Byron Buxton', 'DH', 'R'],
      ['Carlos Correa', 'SS', 'R'],
      ['Royce Lewis', '3B', 'R'],
      ['Matt Wallner', 'RF', 'L'],
      ['Ryan Jeffers', 'C', 'R'],
      ['Edouard Julien', '2B', 'L'],
      ['Carlos Santana', '1B', 'S'],
      ['Max Kepler', 'LF', 'L'],
      ['Austin Martin', 'CF', 'R']
    ),
  },
  {
    id: 9,
    gameTime: '9:40 PM ET',
    awayTeam: 'SEA',
    homeTeam: 'OAK',
    awayStarter: 'George Kirby',
    homeStarter: 'JP Sears',
    awayStarterHand: 'R',
    homeStarterHand: 'L',
    venue: 'Oakland Coliseum',
    awayLineup: lu(
      ['J.P. Crawford', 'SS', 'L'],
      ['Julio Rodríguez', 'CF', 'R'],
      ['Cal Raleigh', 'C', 'S'],
      ['Jorge Polanco', '2B', 'S'],
      ['Mitch Garver', 'DH', 'R'],
      ['Luke Raley', 'LF', 'L'],
      ['Dominic Canzone', 'RF', 'L'],
      ['Ty France', '1B', 'R'],
      ['Josh Rojas', '3B', 'L']
    ),
    homeLineup: lu(
      ['Brent Rooker', 'DH', 'R'],
      ['Shea Langeliers', 'C', 'R'],
      ['JJ Bleday', 'LF', 'L'],
      ['Zack Gelof', '2B', 'R'],
      ['Lawrence Butler', 'RF', 'L'],
      ['Darell Hernaiz', 'SS', 'R'],
      ['Tyler Soderstrom', '1B', 'L'],
      ['Max Schuemann', '3B', 'R'],
      ['Denzel Clarke', 'CF', 'R']
    ),
  },
]

export type TodaysGamesSource = 'static' | 'statsapi'

export function getTodaysGamesSync(): MLBGame[] {
  return STATIC_TODAYS_GAMES
}

/**
 * Async boundary for MLB Stats API — replace body with `fetch` to
 * `statsapi.mlb.com/api/v1/schedule` + box/lineup endpoints; map into `MLBGame[]`.
 */
export async function fetchTodaysGames(_opts?: {
  source?: TodaysGamesSource
  date?: string
}): Promise<MLBGame[]> {
  if (_opts?.source === 'static') return getTodaysGamesSync()
  const date = _opts?.date ?? todayYmdET()
  try {
    const live = await fetchMlbGamesForDate(date)
    return live.length ? live : getTodaysGamesSync()
  } catch {
    return getTodaysGamesSync()
  }
}
