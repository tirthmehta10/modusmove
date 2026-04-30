/**
 * Local development API server.
 * Vite does NOT serve the /api folder — this fills that gap.
 * Run via: node api/dev-server.mjs (started automatically by `npm run dev`)
 */
import http from 'http'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ── Load .env.local ────────────────────────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '..', '.env.local')
try {
  readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const eqIdx = line.indexOf('=')
      if (eqIdx < 1) return
      const key = line.slice(0, eqIdx).trim()
      const val = line.slice(eqIdx + 1).trim()
      if (key && !(key in process.env)) process.env[key] = val
    })
  console.log('[API Dev] Loaded .env.local')
} catch {
  console.warn('[API Dev] No .env.local found — using system environment')
}

// ── Import handlers (dynamic so they pick up updated process.env) ──────────────
const { default: generatePlan } = await import('./generate-plan.js')
const { default: youtubeVideo } = await import('./youtube-video.js')

const ROUTES = {
  '/api/generate-plan': generatePlan,
  '/api/youtube-video': youtubeVideo,
}

// ── Request helpers ────────────────────────────────────────────────────────────
async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  const raw = Buffer.concat(chunks).toString()
  try { return JSON.parse(raw) } catch { return {} }
}

function makeRes() {
  let _status = 200
  let _body = ''
  const res = {
    status(code) { _status = code; return res },
    json(data) { _body = JSON.stringify(data) },
    get _status() { return _status },
    get _body() { return _body },
  }
  // expose via closure so getters return live values
  return { res, getStatus: () => _status, getBody: () => _body }
}

// ── Server ─────────────────────────────────────────────────────────────────────
const PORT = 3001

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const handler = ROUTES[req.url]
  if (!handler) {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end(`[API Dev] Unknown route: ${req.url}`)
    return
  }

  const body = await readBody(req)
  const fakeReq = { method: req.method, body, headers: req.headers }
  const { res: fakeRes, getStatus, getBody } = makeRes()

  try {
    await handler(fakeReq, fakeRes)
  } catch (err) {
    console.error(`[API Dev] Handler error on ${req.url}:`, err.message)
    fakeRes.status(500).json({ error: 'Internal server error', detail: err.message })
  }

  res.writeHead(getStatus(), { 'Content-Type': 'application/json' })
  res.end(getBody())
})

server.listen(PORT, () => {
  console.log(`[API Dev] Listening on http://localhost:${PORT}`)
  console.log(`[API Dev] Routes: ${Object.keys(ROUTES).join(', ')}`)
})
