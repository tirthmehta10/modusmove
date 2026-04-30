const OPENAI_BASE = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

const SYSTEM_PROMPT = `You are a certified personal trainer with 15 years of commercial gym experience. Create safe, effective, personalized weekly workout plans.

Equipment available: Full commercial gym — barbells, dumbbells, cables, machines, benches, squat racks, pull-up bars.

RULES:
1. Never use exercises that conflict with listed injuries:
   knee: no deep squats, leg extensions, jumping
   back: no heavy deadlifts, loaded spinal flexion
   shoulder: no behind-neck press, upright rows, limit overhead volume
   wrist: prefer neutral grip, no heavy barbell curls
   ankle: no box jumps, heavy calf raises
   hip: no deep lunges, sumo stance
   elbow: no skull crushers, limit heavy tricep isolation
2. Trust the safety engine assigned level. Never upgrade it.
3. Training days: match the user's selected days exactly. Only reduce if readiness < 50 (cap at 3) or readiness < 30 (cap at 2). If user selected 5 days, give 5 training days — not 3 or 4.
4. Every training day must include warm_up and cooldown sections.
5. Explain split, frequency, and intensity choices in decision_summary.
6. Sets per session: beginner 12-16, intermediate 16-20, advanced 18-24.
7. Rest: strength=120-180s, hypertrophy=60-90s, fat_loss=30-60s, general=60-90s.
8. Use common YouTube-searchable exercise names only.
9. Include estimated_duration_minutes for each training day.
10. Return ONLY valid JSON. No markdown fences, no text outside the JSON.`

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ success: false, error: 'method_not_allowed' })
    return
  }

  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt : ''
  if (!prompt.trim()) {
    response.status(400).json({ success: false, error: 'prompt_required' })
    return
  }

  const openAiKey = process.env.OPENAI_API_KEY
  if (!openAiKey) {
    response.status(503).json({ success: false, error: 'openai_api_key_missing' })
    return
  }

  try {
    const plan = await callOpenAI(prompt, openAiKey)
    response.status(200).json({
      success: true,
      model_used: OPENAI_MODEL,
      plan,
    })
  } catch (error) {
    console.warn('[ModusMove API] OpenAI failed:', error.message)
    response.status(502).json({
      success: false,
      error: 'openai_generation_failed',
      message: error.message,
    })
  }
}

async function callOpenAI(prompt, key) {
  const result = await fetch(OPENAI_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 3000,
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(45_000),
  })

  if (!result.ok) {
    const err = await buildOpenAIError(result)
    // Retry once on rate limit
    if (result.status === 429) {
      await sleep(2000)
      return callOpenAI(prompt, key)
    }
    throw new Error(err)
  }

  const data = await result.json()
  const rawText = data?.choices?.[0]?.message?.content || ''
  const parsed = parseJsonSafely(rawText)
  if (!parsed) throw new Error('OPENAI_INVALID_JSON')
  return parsed
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function buildOpenAIError(result) {
  try {
    const data = await result.json()
    const code = data?.error?.code
    const type = data?.error?.type
    const message = data?.error?.message
    const detail = [code || type, message].filter(Boolean).join(': ')
    return detail ? `OPENAI_HTTP_${result.status}: ${detail}` : `OPENAI_HTTP_${result.status}`
  } catch {
    return `OPENAI_HTTP_${result.status}`
  }
}

function parseJsonSafely(text) {
  if (!text || typeof text !== 'string') return null

  try {
    return JSON.parse(text)
  } catch {
    const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (fenceMatch) {
      try { return JSON.parse(fenceMatch[1].trim()) } catch { /* fall through */ }
    }

    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start !== -1 && end !== -1 && end > start) {
      try { return JSON.parse(text.slice(start, end + 1)) } catch { /* fall through */ }
    }
  }

  return null
}
