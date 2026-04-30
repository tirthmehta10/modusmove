import { buildWorkoutPrompt } from './promptBuilder.js'
import { generatePlan } from './safetyEngine.js'
import { EXERCISES } from '../data/exercises.js'

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const ytLink = (query) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`

export async function generateAIPlan(profile, readiness) {
  const localPlan = generatePlan(profile, readiness)

  try {
    const prompt = buildWorkoutPrompt(profile, readiness)
    const response = await fetch('/api/generate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || payload?.error || `API_${response.status}`)
    }

    if (!isValidAIPlan(payload.plan)) {
      throw new Error('INVALID_PLAN_SHAPE')
    }

    return {
      ...mapAIPlanToWorkoutPlan(payload.plan, localPlan),
      aiSource: 'openai',
      aiModel: payload.model_used || 'gpt-4o-mini',
    }
  } catch (error) {
    console.warn('[ModusMove] OpenAI failed, using local engine:', error.message)
    return { ...localPlan, aiSource: 'local', aiModel: 'local-engine' }
  }
}

function mapAIPlanToWorkoutPlan(aiPlan, localPlan) {
  const aiDays = Array.isArray(aiPlan.weekly_plan) ? aiPlan.weekly_plan : []

  const weekly_plan = DAY_NAMES.map((dayName) => {
    const aiDay = aiDays.find((day) => normalizeDayName(day.day_label) === dayName)

    if (!aiDay || aiDay.is_rest_day) {
      return {
        day: dayName,
        type: 'rest',
        focus: aiDay?.session_name || 'Rest Day',
        why_this_day: aiDay?.rest_activity || 'Recovery day. Walk, stretch lightly, or rest fully.',
        exercises: [],
        muscle_blocks: [],
        target_muscles: [],
        estimated_duration: aiDay?.rest_activity || '20-30 min optional walking',
        warmUp: [],
        coolDown: [],
      }
    }

    const exercises = (aiDay.exercises || []).map((exercise) => {
      const matched = findExerciseMetadata(exercise.name, localPlan)
      const muscle = normalizeMuscle(exercise.muscle_group || exercise.primary_muscle)
      return {
        id: sanitizeId(exercise.name),
        name: exercise.name,
        muscle,
        muscleLabel: exercise.muscle_group || titleize(muscle),
        sets: exercise.sets,
        reps: exercise.reps,
        rest: `${Number(exercise.rest_seconds) || 60}s`,
        tips: exercise.notes || exercise.why_this_exercise || '',
        safety_note: exercise.safety_note || null,
        youtube_link: ytLink(`${exercise.name} proper form tutorial`),
        thumbnail: matched?.thumbnail || null,
        images: matched?.images || [],
        equipment: matched?.equipment || ['full_gym'],
      }
    })

    const muscle_blocks = groupByMuscle(exercises)

    return {
      day: dayName,
      type: 'training',
      focus: aiDay.session_name,
      why_this_day: aiDay.why_today || '',
      estimated_duration: aiDay.estimated_duration_minutes
        ? `${aiDay.estimated_duration_minutes} min`
        : '45-60 min',
      target_muscles: Array.isArray(aiDay.primary_muscles) ? aiDay.primary_muscles.map(normalizeMuscle) : [],
      muscle_blocks,
      exercises,
      warmUp: normalizeWarmCool(aiDay.warm_up, 'warmup'),
      coolDown: normalizeWarmCool(aiDay.cooldown, 'cooldown'),
    }
  })

  const progression = Array.isArray(aiPlan.weekly_progression)
    ? aiPlan.weekly_progression
    : []

  const actualTrainingDays = weekly_plan.filter((day) => day.type === 'training').length
  const claimedDays = Number(aiPlan.recommended_training_days) || actualTrainingDays
  if (import.meta.env.DEV && claimedDays !== actualTrainingDays) {
    console.warn(`[ModusMove] Day count mismatch: AI said ${claimedDays} training days but weekly_plan has ${actualTrainingDays}`)
  }

  return {
    ...localPlan,
    recommended_training_days: actualTrainingDays,
    selected_split: normalizeSplit(aiPlan.selected_split),
    split: normalizeSplit(aiPlan.selected_split),
    splitLabel: aiPlan.split_label || titleize(aiPlan.selected_split),
    aiDecisionSummary: aiPlan.decision_summary || '',
    bodyMetrics: aiPlan.body_context || null,
    weekly_plan,
    why_this_plan: aiPlan.why_this_plan || '',
    nutrition_note: aiPlan.nutrition_note || '',
    nutritionNote: aiPlan.nutrition_note || '',
    recovery_tips: aiPlan.recovery_tips || [],
    recoveryNote: aiPlan.recovery_tips || [],
    safety_notes: aiPlan.safety_notes || [],
    beginner_guidance: aiPlan.beginner_guidance || [],
    progression_plan: progression.map((item, index) => ({
      week: `Phase ${index + 1}`,
      focus: String(item),
    })),
    progression,
  }
}

function groupByMuscle(exercises) {
  const blocks = []
  exercises.forEach((exercise) => {
    let block = blocks.find((item) => item.muscle === exercise.muscle)
    if (!block) {
      block = {
        muscle: exercise.muscle,
        muscleLabel: exercise.muscleLabel,
        exercises: [],
      }
      blocks.push(block)
    }
    block.exercises.push(exercise)
  })
  return blocks
}

function normalizeWarmCool(section, type) {
  const items = Array.isArray(section?.exercises) ? section.exercises : []
  return items.map((item) => {
    const text = [
      item.name || 'Mobility Drill',
      item.duration || item.reps || '',
    ].filter(Boolean).join(' - ')

    return {
      text,
      demo: ytLink(`${item.name || type} gym ${type === 'warmup' ? 'warm up routine' : 'cooldown stretching'}`),
    }
  })
}

function findExerciseMetadata(name, localPlan) {
  const normalizedName = normalizeName(name)
  if (!normalizedName) return null

  const localMatch = (localPlan?.weekly_plan || [])
    .flatMap((day) => day.exercises || [])
    .find((exercise) => normalizeName(exercise.name) === normalizedName)
  if (localMatch) return localMatch

  const exact = EXERCISES.find((exercise) => normalizeName(exercise.name) === normalizedName)
  if (exact) return exact

  let best = null
  let bestScore = 0
  const aiTokens = tokenize(name)

  EXERCISES.forEach((exercise) => {
    const dbTokens = new Set(tokenize(exercise.name))
    const matched = aiTokens.filter((token) => dbTokens.has(token)).length
    const score = aiTokens.length ? matched / aiTokens.length : 0
    if (score > bestScore) {
      best = exercise
      bestScore = score
    }
  })

  if (bestScore >= 0.6) return best
  if (import.meta.env.DEV) console.info('[ModusMove] Exercise metadata miss:', name)
  return null
}

function isValidAIPlan(plan) {
  if (!plan || typeof plan !== 'object') return false
  if (!Array.isArray(plan.weekly_plan) || plan.weekly_plan.length < 1) return false
  // Accept is_rest_day: false, null, 0, or undefined — just need at least one day with exercises
  return plan.weekly_plan.some(
    (day) => day && !day.is_rest_day && Array.isArray(day.exercises) && day.exercises.length > 0
  )
}

function normalizeDayName(value = '') {
  return DAY_NAMES.find((day) => String(value).toLowerCase().includes(day.toLowerCase())) || ''
}

function normalizeSplit(value = '') {
  const split = String(value).trim().toLowerCase()
  if (split === 'push_pull_legs') return 'ppl'
  if (['full_body', 'upper_lower', 'ppl', 'bro_split', 'hybrid'].includes(split)) return split
  return 'hybrid'
}

function normalizeMuscle(value = '') {
  return String(value || 'general').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'general'
}

function normalizeName(name = '') {
  return String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ')
}

function tokenize(name = '') {
  return normalizeName(name).split(/\s+/).filter(Boolean)
}

function sanitizeId(name = '') {
  return normalizeName(name).replace(/\s+/g, '_').replace(/^_|_$/g, '')
}

function titleize(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
