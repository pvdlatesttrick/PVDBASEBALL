import { getVenueCoordinate, type VenueCoordinate } from '@/data/venueCoordinates'

export type WeatherData = {
  tempF: number
  windSpeed: number
  /** Degrees wind comes FROM (Open-Meteo). */
  windFromDeg: number
  windDirection: 'in' | 'out' | 'cross' | 'dome'
  precipProbability: number
  isRoofClosed: boolean
}

const CACHE_PREFIX = 'mlb_weather_cache:'
const CACHE_TTL_MS = 30 * 60 * 1000

type CachedWeather = { savedAt: number; data: WeatherData }

function readCache(venue: string): CachedWeather | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + venue)
    if (!raw) return null
    const p = JSON.parse(raw) as CachedWeather
    if (!p?.savedAt || !p.data) return null
    if (Date.now() - p.savedAt > CACHE_TTL_MS) return null
    return p
  } catch {
    return null
  }
}

function writeCache(venue: string, data: WeatherData): void {
  try {
    const payload: CachedWeather = { savedAt: Date.now(), data }
    localStorage.setItem(CACHE_PREFIX + venue, JSON.stringify(payload))
  } catch {
    /* quota */
  }
}

/** Smallest angle between two bearings (0–180). */
function angleDiffDeg(a: number, b: number): number {
  const d = Math.abs(((a - b + 540) % 360) - 180)
  return d
}

/**
 * Wind blows TOWARD this bearing (meteorological FROM + 180).
 * Classify vs stadium CF bearing: aligned = out, opposite = in.
 */
function classifyWindOutIn(windFromDeg: number, homeToCenter: number): 'in' | 'out' | 'cross' {
  const windToward = (windFromDeg + 180) % 360
  const d = angleDiffDeg(windToward, homeToCenter)
  if (d < 50) return 'out'
  if (d > 130) return 'in'
  return 'cross'
}

function neutralDomeWeather(): WeatherData {
  return {
    tempF: 72,
    windSpeed: 0,
    windFromDeg: 0,
    windDirection: 'dome',
    precipProbability: 0,
    isRoofClosed: true,
  }
}

function roofLikelyClosed(meta: VenueCoordinate, tempF: number, precip: number): boolean {
  if (meta.isFixedDome) return true
  if (!meta.isRoofCloseable) return false
  return precip >= 55 || tempF < 38 || tempF > 92
}

async function fetchOpenMeteo(lat: number, lng: number): Promise<{
  tempF: number
  windSpeed: number
  windFromDeg: number
  precip: number
}> {
  const hour = new Date().getHours()
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lng))
  url.searchParams.set('hourly', 'temperature_2m,wind_speed_10m,wind_direction_10m,precipitation_probability')
  url.searchParams.set('temperature_unit', 'fahrenheit')
  url.searchParams.set('wind_speed_unit', 'mph')
  url.searchParams.set('forecast_days', '1')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`)
  const json = (await res.json()) as {
    hourly: {
      temperature_2m: number[]
      wind_speed_10m: number[]
      wind_direction_10m: number[]
      precipitation_probability: number[]
    }
  }
  const h = json.hourly
  const idx = Math.min(Math.max(hour, 0), (h.temperature_2m?.length ?? 1) - 1)
  return {
    tempF: h.temperature_2m[idx] ?? 70,
    windSpeed: h.wind_speed_10m[idx] ?? 5,
    windFromDeg: h.wind_direction_10m[idx] ?? 0,
    precip: h.precipitation_probability[idx] ?? 0,
  }
}

export async function getGameWeather(venue: string): Promise<WeatherData> {
  const cached = readCache(venue)
  if (cached) return cached.data

  const meta = getVenueCoordinate(venue)
  if (!meta) {
    const fallback: WeatherData = {
      tempF: 72,
      windSpeed: 6,
      windFromDeg: 220,
      windDirection: 'cross',
      precipProbability: 15,
      isRoofClosed: false,
    }
    writeCache(venue, fallback)
    return fallback
  }

  if (meta.isFixedDome) {
    const w = neutralDomeWeather()
    writeCache(venue, w)
    return w
  }

  try {
    const o = await fetchOpenMeteo(meta.lat, meta.lng)
    const closed = roofLikelyClosed(meta, o.tempF, o.precip)
    if (closed && meta.isRoofCloseable) {
      const w = neutralDomeWeather()
      writeCache(venue, w)
      return w
    }

    const dir = closed ? 'dome' : classifyWindOutIn(o.windFromDeg, meta.homeToCenter)

    const data: WeatherData = {
      tempF: Math.round(o.tempF * 10) / 10,
      windSpeed: Math.round(o.windSpeed * 10) / 10,
      windFromDeg: o.windFromDeg,
      windDirection: dir === 'dome' ? 'cross' : dir,
      precipProbability: o.precip,
      isRoofClosed: closed,
    }
    writeCache(venue, data)
    return data
  } catch {
    const fallback: WeatherData = {
      tempF: 72,
      windSpeed: 6,
      windFromDeg: 220,
      windDirection: 'cross',
      precipProbability: 15,
      isRoofClosed: false,
    }
    writeCache(venue, fallback)
    return fallback
  }
}
