const GOAL_LABELS = {
  fat_loss: 'fat loss',
  muscle_gain: 'muscle gain',
  strength: 'strength',
  general: 'general fitness',
}

const SPLIT_LABELS = {
  auto: 'You decide',
  full_body: 'full_body',
  upper_lower: 'upper_lower',
  ppl: 'push_pull_legs',
  bro_split: 'bro_split',
}

const ACTIVITY_LABELS = {
  sedentary: 'sedentary',
  lightly_active: 'lightly active',
  moderately_active: 'moderately active',
  active: 'active',
  very_active: 'very active',
}

export function buildWorkoutPrompt(profile, readiness) {
  const bmi = calculateBMI(profile.weight, profile.height)
  const injuryText = profile.injuriesText?.trim() || 'None'
  const preferredSplit = SPLIT_LABELS[profile.preferredSplit] || 'You decide'
  const claimedLevel = profile.claimedLevel || readiness.claimedLevel || 'beginner'
  const assignedLevel = readiness.finalLevel || readiness.assignedLevel || 'beginner'
  const readinessScore = readiness.readinessScore ?? 70

  return `Create a personalized weekly gym workout plan for this user:

BODY DATA:
- Age: ${profile.age} | Gender: ${profile.gender}
- Height: ${profile.height} cm | Weight: ${profile.weight} kg | BMI: ${bmi ?? 'N/A'}

LIFESTYLE & RECOVERY:
- Activity: ${ACTIVITY_LABELS[profile.activityLevel] || profile.activityLevel}
- Sleep: ${profile.sleepQuality}
- Training history: ${profile.trainingHistoryMonths || 0} months

SAFETY ENGINE:
- Readiness score: ${readinessScore}/100
- Assigned level: ${assignedLevel} (user claimed: ${claimedLevel})
- Injuries: ${injuryText}
- Adjustment reason: ${readiness.correctionReason || 'none'}

GOAL & PREFERENCES:
- Goal: ${GOAL_LABELS[profile.goal] || profile.goal}
- Target training days: ${profile.daysPerWeek} (match this exactly unless readiness forces a cap)
- Preferred split: ${preferredSplit}

GENDER NOTE: Do not stereotype. For female users with body-composition goals, bias toward balanced programming (glutes, posterior chain, posture, core) while still training the full body. Exercise selection must follow goal, readiness, and injury notes first.

Return JSON with this exact structure (include all 7 days of the week):
{
  "recommended_training_days": <number>,
  "selected_split": "<full_body|upper_lower|ppl|bro_split>",
  "split_label": "<string>",
  "decision_summary": "<why this split/frequency/intensity>",
  "why_this_plan": "<expected outcome>",
  "body_context": {
    "bmi": ${bmi ?? 0},
    "training_readiness": "${readinessScore >= 70 ? 'good' : readinessScore >= 50 ? 'moderate' : 'low'}",
    "recovery_risk": "${readinessScore >= 70 ? 'low' : readinessScore >= 50 ? 'moderate' : 'high'}",
    "recovery_notes": "<string>"
  },
  "weekly_plan": [
    {
      "day_label": "<Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday>",
      "session_name": "<string>",
      "is_rest_day": <true|false>,
      "rest_activity": "<string, rest days only>",
      "primary_muscles": ["<string>"],
      "estimated_duration_minutes": <number>,
      "why_today": "<string>",
      "warm_up": { "exercises": [{ "name": "<string>", "reps": "<string>" }] },
      "exercises": [
        { "name": "<string>", "sets": <number>, "reps": "<string>", "rest_seconds": <number>, "muscle_group": "<string>", "notes": "<string>" }
      ],
      "cooldown": { "exercises": [{ "name": "<string>", "duration": "<string>" }] }
    }
  ],
  "nutrition_note": "<string>",
  "recovery_tips": ["<string>", "<string>"],
  "safety_notes": ["<string>"],
  "beginner_guidance": [],
  "weekly_progression": ["Week 1: ...", "Week 2: ...", "Week 3: ...", "Week 4: ..."]
}`
}

function calculateBMI(weight, height) {
  const kg = Number(weight)
  const cm = Number(height)
  if (!kg || !cm) return null
  return Math.round((kg / ((cm / 100) ** 2)) * 10) / 10
}
