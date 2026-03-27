import type { OddsApiEvent } from '@/services/oddsApi'

/** Fallback raw events when API fails or `VITE_ODDS_API_KEY` is unset — shape matches The Odds API v4. */
export const MOCK_ODDS_EVENTS: OddsApiEvent[] = [
  {
    id: 'mock-1',
    sport_key: 'baseball_mlb',
    commence_time: new Date().toISOString(),
    away_team: 'New York Yankees',
    home_team: 'Boston Red Sox',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'New York Yankees', price: -142 },
              { name: 'Boston Red Sox', price: 122 },
            ],
          },
          {
            key: 'spreads',
            outcomes: [
              { name: 'New York Yankees', price: -110, point: -1.5 },
              { name: 'Boston Red Sox', price: -110, point: 1.5 },
            ],
          },
          {
            key: 'totals',
            outcomes: [
              { name: 'Over', price: -108, point: 8.5 },
              { name: 'Under', price: -112, point: 8.5 },
            ],
          },
        ],
      },
      {
        key: 'fanduel',
        title: 'FanDuel',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'New York Yankees', price: -138 },
              { name: 'Boston Red Sox', price: 118 },
            ],
          },
          {
            key: 'totals',
            outcomes: [
              { name: 'Over', price: -105, point: 8.5 },
              { name: 'Under', price: -115, point: 8.5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'mock-2',
    sport_key: 'baseball_mlb',
    commence_time: new Date().toISOString(),
    away_team: 'Los Angeles Dodgers',
    home_team: 'Chicago Cubs',
    bookmakers: [
      {
        key: 'draftkings',
        title: 'DraftKings',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Los Angeles Dodgers', price: -155 },
              { name: 'Chicago Cubs', price: 135 },
            ],
          },
          {
            key: 'spreads',
            outcomes: [
              { name: 'Los Angeles Dodgers', price: -115, point: -1.5 },
              { name: 'Chicago Cubs', price: -105, point: 1.5 },
            ],
          },
          {
            key: 'totals',
            outcomes: [
              { name: 'Over', price: -110, point: 9.0 },
              { name: 'Under', price: -110, point: 9.0 },
            ],
          },
        ],
      },
    ],
  },
]
