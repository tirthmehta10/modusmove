const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search'
const YOUTUBE_VIDEOS_URL = 'https://www.googleapis.com/youtube/v3/videos'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    response.status(503).json({ error: 'YouTube API key is not configured' })
    return
  }

  const exerciseName = typeof request.body?.exerciseName === 'string'
    ? request.body.exerciseName.trim()
    : typeof request.body?.exercise === 'string'
      ? request.body.exercise.trim()
    : ''
  const muscle = typeof request.body?.muscle === 'string'
    ? request.body.muscle.trim()
    : ''
  const duration = ['short', 'medium', 'long', 'any'].includes(request.body?.duration)
    ? request.body.duration
    : 'short'

  if (!exerciseName) {
    response.status(400).json({ error: 'Exercise name is required' })
    return
  }

  try {
    const queries = buildSearchQueries(exerciseName, muscle)
    const searchResults = await searchYouTubeCandidates(queries, key, duration)
    const videoIds = searchResults
      .map((item) => item?.id?.videoId)
      .filter(Boolean)

    if (!videoIds.length) {
      response.status(404).json({ error: 'No matching videos found' })
      return
    }

    const queryById = new Map(searchResults.map((item) => [item?.id?.videoId, item?.query]).filter(([id]) => id))
    const videos = (await getVideoDetails(videoIds, key))
      .map((item) => ({ ...item, query: queryById.get(item.id) || queries[0] }))
    const selected = selectBestShortVideo(videos, exerciseName)

    if (!selected?.id) {
      response.status(404).json({ error: 'No embeddable videos found' })
      return
    }

    response.status(200).json({
      videoId: selected.id,
      title: selected.snippet?.title || exerciseName,
      channelTitle: selected.snippet?.channelTitle || '',
      viewCount: Number(selected.statistics?.viewCount || 0),
      durationSeconds: selected.durationSeconds || parseYouTubeDuration(selected.contentDetails?.duration),
      embedUrl: `https://www.youtube-nocookie.com/embed/${selected.id}`,
      watchUrl: `https://www.youtube.com/watch?v=${selected.id}`,
      query: selected.query || queries[0],
    })
  } catch (error) {
    console.warn('[ModusMove API] YouTube video lookup failed:', error.message)
    response.status(502).json({
      error: 'YouTube video lookup failed',
      detail: error.message,
    })
  }
}

function buildSearchQueries(exerciseName, muscle) {
  const muscleText = muscle && muscle !== 'warmup' && muscle !== 'cooldown' ? ` ${muscle}` : ''
  // Single query instead of 3 — YouTube Data API costs 100 units per search call
  return [`${exerciseName}${muscleText} proper form`]
}

async function searchYouTubeCandidates(queries, key, duration = 'short') {
  const allResults = await Promise.all(queries.map((query) => searchYouTube(query, key, duration).then((items) => items.map((item) => ({ ...item, query })))))
  const seen = new Set()
  return allResults.flat().filter((item) => {
    const id = item?.id?.videoId
    if (!id || seen.has(id)) return false
    seen.add(id)
    return true
  })
}

async function searchYouTube(query, key, duration = 'short') {
  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    videoEmbeddable: 'true',
    videoDuration: duration === 'any' ? undefined : duration,
    videoSyndicated: 'true',
    order: 'relevance',
    safeSearch: 'strict',
    relevanceLanguage: 'en',
    maxResults: '10',
    q: query,
    key,
  })
  if (duration === 'any') params.delete('videoDuration')

  const result = await fetch(`${YOUTUBE_SEARCH_URL}?${params}`, {
    signal: AbortSignal.timeout(10_000),
  })

  if (!result.ok) {
    throw new Error(`YOUTUBE_SEARCH_HTTP_${result.status}_${await getErrorDetail(result)}`)
  }

  const data = await result.json()
  return Array.isArray(data.items) ? data.items : []
}

async function getVideoDetails(videoIds, key) {
  const params = new URLSearchParams({
    part: 'snippet,status,contentDetails,statistics',
    id: videoIds.join(','),
    key,
  })

  const result = await fetch(`${YOUTUBE_VIDEOS_URL}?${params}`, {
    signal: AbortSignal.timeout(10_000),
  })

  if (!result.ok) {
    throw new Error(`YOUTUBE_VIDEOS_HTTP_${result.status}_${await getErrorDetail(result)}`)
  }

  const data = await result.json()
  return Array.isArray(data.items) ? data.items : []
}

function titleRelevanceScore(videoTitle = '', exerciseName = '') {
  const title = videoTitle.toLowerCase()
  const keywords = exerciseName.toLowerCase().split(/\s+/).filter((w) => w.length > 2)
  if (!keywords.length) return 0
  const matched = keywords.filter((kw) => title.includes(kw)).length
  return matched / keywords.length
}

function selectBestShortVideo(videos, exerciseName = '') {
  const embeddable = videos
    .filter((item) => item?.status?.embeddable && item?.status?.privacyStatus === 'public')
    .map((item) => ({
      ...item,
      durationSeconds: parseYouTubeDuration(item.contentDetails?.duration),
      viewCount: Number(item.statistics?.viewCount || 0),
      relevance: titleRelevanceScore(item.snippet?.title, exerciseName),
      query: item.query,
    }))

  if (!embeddable.length) return null

  // Prefer videos whose title actually mentions the exercise keywords
  const relevant = embeddable.filter((item) => item.relevance >= 0.4)
  const pool = relevant.length ? relevant : embeddable

  const shorts = pool
    .filter((item) => item.durationSeconds > 0 && item.durationSeconds <= 180)
    .sort((a, b) => b.relevance - a.relevance || a.durationSeconds - b.durationSeconds)

  if (shorts.length) return shorts[0]

  return pool.sort((a, b) => b.relevance - a.relevance || (a.durationSeconds || 9999) - (b.durationSeconds || 9999))[0]
}

function parseYouTubeDuration(duration = '') {
  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return 0

  const hours = Number(match[1] || 0)
  const minutes = Number(match[2] || 0)
  const seconds = Number(match[3] || 0)
  return hours * 3600 + minutes * 60 + seconds
}

async function getErrorDetail(result) {
  try {
    const data = await result.json()
    return data?.error?.message || data?.error?.status || 'unknown'
  } catch {
    return 'unknown'
  }
}
