# ModusMove

**Safety-First AI Workout Planner** — generates structured, personalized weekly gym training plans based on your goal, experience level, recovery, body data, and injury notes.

Live: [modusmove.vercel.app](https://modusmove.vercel.app)

---

## What It Does

ModusMove takes your full profile and builds a complete weekly gym plan — the right number of days, the right split, the right exercises, sets, reps, rest, warm-up, and cooldown. Everything is tailored to you, not copy-pasted from a template.

**Safety engine runs before AI.** Before OpenAI touches your profile, a local readiness engine calculates your true training level from sleep quality, activity level, training history, and injury notes. If you select Advanced but your profile says Beginner, the engine quietly corrects it. The AI is then told to trust the assigned level and never upgrade it.

**AI decides the plan structure.** OpenAI (GPT-4o-mini) reads your full profile — including the safety engine's readiness score — and decides:
- How many days per week to train (matching your selected days unless readiness prevents it)
- Which split fits best (full body, upper/lower, push/pull/legs, bro split)
- Which exercises, in what order, with what volume
- Warm-up, cooldown, recovery tips, and a 4-week progression plan

**Local fallback when AI fails.** If the OpenAI call times out, hits a quota, or returns invalid data, the app silently falls back to a local rule-based engine using an 873-exercise database. Users always get a complete plan — they never see a generation failure.

**Exercise videos.** The YouTube Data API resolves real embeddable exercise demo videos for each exercise. If a video cannot be loaded (quota, missing key, API failure), a direct YouTube search link opens the right result in a new tab. Exercise thumbnails from the local database are shown immediately while the video loads.

---

## Features

- Personalized plan from a 3-step profile wizard
- Safety engine that auto-corrects unrealistic level claims
- Injury filter — removes exercises that conflict with listed injuries (knee, back, shoulder, wrist, ankle, hip, elbow)
- AI-selected training days, split, and volume matched to your readiness score
- Full 7-day weekly plan including rest days with recovery guidance
- Embedded YouTube exercise demos with search fallback
- Swipe navigation between exercises on mobile
- Rest timer with set counter and chime
- Weekly and daily completion rings
- 4-week progression plan
- Dark / light mode
- Saves plan to browser `localStorage` — resume on the same device
- Vercel Analytics built in

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| AI plan generation | OpenAI GPT-4o-mini via Vercel Serverless Function |
| Exercise videos | YouTube Data API v3 via Vercel Serverless Function |
| Local exercise database | 873-exercise pool (curated + free-exercise-db) |
| Hosting | Vercel |
| Analytics | Vercel Analytics |

---

## Run Locally

```bash
npm install
```

Create `.env.local` in the project root:

```
OPENAI_API_KEY=your_openai_key
YOUTUBE_API_KEY=your_youtube_key
OPENAI_MODEL=gpt-4o-mini
```

Then run with Vercel dev (required for the serverless API routes):

```bash
npx vercel dev
```

Open `http://localhost:3000`. Plain `npm run dev` works for the UI but the AI and YouTube API routes will not respond without `vercel dev`.

---

## Deploy to Vercel

1. Push the repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com) — Vite is auto-detected
3. Add environment variables in **Settings → Environment Variables**:

```
OPENAI_API_KEY     your OpenAI secret key
YOUTUBE_API_KEY    your YouTube Data API v3 key
OPENAI_MODEL       gpt-4o-mini
```

4. Deploy — `vercel.json` handles SPA routing and API routing automatically

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Powers AI plan generation |
| `YOUTUBE_API_KEY` | Yes | Resolves exercise demo videos |
| `OPENAI_MODEL` | No | Defaults to `gpt-4o-mini` |

**YouTube API setup:** Enable **YouTube Data API v3** in Google Cloud Console for your key. The free tier provides 10,000 units/day. Each video lookup costs 100 units. Videos are cached in browser `localStorage` (cache key versioned) to avoid repeat calls.

**If keys are missing:** The app still works. OpenAI missing → local engine generates the plan. YouTube missing → YouTube search links open in browser instead of embedded video.

---

## Data & Privacy

- No user accounts, no backend database
- All profile data and plans are stored in browser `localStorage` only
- Data does not sync across devices or browsers
- Clearing browser storage removes saved plans
- The OpenAI and YouTube API calls are server-side (Vercel Functions) — your keys are never exposed to the browser

---

## Project Structure

```
api/
  generate-plan.js     OpenAI serverless function
  youtube-video.js     YouTube video lookup serverless function
src/
  components/          React UI components
  data/                Exercise database (curated + free-exercise-db)
  lib/
    aiPlanGenerator.js Maps AI response to app plan format + local fallback
    promptBuilder.js   Builds the OpenAI user prompt from profile
    safetyEngine.js    Local readiness engine + plan generator
    validators.js      Profile validation
    exerciseLoader.js  Runtime exercise loader with localStorage cache
public/
  favicon.svg
vercel.json            SPA fallback + API routing
```

---

## Disclaimer

ModusMove provides general fitness guidance only and is not a substitute for medical advice. Consult a qualified professional before starting any new exercise program. Stop exercising immediately if you experience pain, dizziness, chest pain, or any unusual symptoms.
