import { mapFreeExerciseDB } from './exerciseMapper.js'
import { mergeExternalExercises } from '../data/exercises.js'

const CACHE_KEY = 'fdb-exercises-v1'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
const FDB_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json'

// Returns { count, source } — 'cache', 'network', or 'failed'
export async function loadExternalExercises() {
  try {
    const cached = readCache()
    if (cached) {
      mergeExternalExercises(cached)
      return { count: cached.length, source: 'cache' }
    }

    const res = await fetch(FDB_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const raw = await res.json()
    const mapped = raw.map(mapFreeExerciseDB)

    writeCache(mapped)
    mergeExternalExercises(mapped)

    return { count: mapped.length, source: 'network' }
  } catch (err) {
    console.warn('[ModusMove] Exercise DB load failed, using local exercises:', err.message)
    return { count: 0, source: 'failed' }
  }
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {
    // Storage quota exceeded — silently skip, cache miss is acceptable
  }
}

export function clearExerciseCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    // ignore
  }
}
