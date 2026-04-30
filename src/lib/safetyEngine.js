import { EXERCISES, getExerciseById, getSafeExercises } from '../data/exercises.js'

const LEVEL_ORDER = { beginner: 0, intermediate: 1, advanced: 2 }

const LEVEL_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const SPLIT_LABELS = {
  full_body: 'Full Body',
  upper_lower: 'Upper / Lower',
  ppl: 'Push / Pull / Legs',
  bro_split: 'Bro Split',
}

const MUSCLE_LABELS = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  triceps: 'Triceps',
  back: 'Back',
  rear_delts: 'Rear Delts',
  biceps: 'Biceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  core: 'Core',
}

const DAY_PATTERNS = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
}

const REQUIRED_MUSCLES = {
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'rear_delts', 'biceps'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
}

const GENERAL_WARMUP = [
  {
    text: '5 min light cardio to raise body temperature',
    demo: 'https://www.youtube.com/results?search_query=5+minute+gym+warm+up+cardio',
  },
  {
    text: 'Joint prep for shoulders, hips, knees, and ankles - 10 slow reps each',
    demo: 'https://www.youtube.com/results?search_query=joint+mobility+warm+up',
  },
]

const WARMUP_BY_DAY = {
  push: [
    { text: 'Band pull-aparts or scapular push-ups - 12 reps', demo: 'https://www.youtube.com/results?search_query=scapular+push+up+warm+up' },
    { text: 'Chest opener swings - 12 reps', demo: 'https://www.youtube.com/results?search_query=dynamic+chest+warm+up' },
    { text: 'Shoulder CARs - 5 circles each side', demo: 'https://www.youtube.com/results?search_query=shoulder+cars+warm+up' },
  ],
  pull: [
    { text: 'Thoracic rotations - 8 reps each side', demo: 'https://www.youtube.com/results?search_query=thoracic+rotation+warm+up' },
    { text: 'Lat prayer stretch pulses - 10 reps', demo: 'https://www.youtube.com/results?search_query=lat+warm+up+mobility' },
    { text: 'Light row activation - 12 reps', demo: 'https://www.youtube.com/results?search_query=row+warm+up+activation' },
  ],
  legs: [
    { text: 'Bodyweight squats - 12 reps', demo: 'https://www.youtube.com/results?search_query=bodyweight+squat+warm+up' },
    { text: 'Leg swings front-to-back - 10 each side', demo: 'https://www.youtube.com/results?search_query=leg+swings+warm+up' },
    { text: 'Glute bridges - 12 reps', demo: 'https://www.youtube.com/results?search_query=glute+bridge+warm+up' },
  ],
  upper: [
    { text: 'Scapular control drill - 10 reps', demo: 'https://www.youtube.com/results?search_query=scapular+warm+up' },
    { text: 'Band or cable rows - 12 reps', demo: 'https://www.youtube.com/results?search_query=band+row+warm+up' },
    { text: 'Arm circles - 20 seconds each direction', demo: 'https://www.youtube.com/results?search_query=arm+circles+warm+up' },
  ],
  lower: [
    { text: 'Walking knee hugs - 8 each side', demo: 'https://www.youtube.com/results?search_query=walking+knee+hug+warm+up' },
    { text: 'Hip hinge reaches - 10 reps', demo: 'https://www.youtube.com/results?search_query=hip+hinge+warm+up' },
    { text: 'Calf pumps - 20 reps', demo: 'https://www.youtube.com/results?search_query=calf+raise+warm+up' },
  ],
  full_body: [
    { text: 'World\'s Greatest Stretch - 4 reps each side', demo: 'https://www.youtube.com/results?search_query=worlds+greatest+stretch+tutorial' },
    { text: 'Dead bug - 6 reps each side', demo: 'https://www.youtube.com/results?search_query=dead+bug+warm+up' },
    { text: 'Bodyweight squat to reach - 10 reps', demo: 'https://www.youtube.com/results?search_query=bodyweight+squat+warm+up' },
  ],
}

const COOLDOWN_BY_MUSCLE = {
  chest: { text: 'Doorway chest stretch - 30s each side', demo: 'https://www.youtube.com/results?search_query=doorway+chest+stretch' },
  shoulders: { text: 'Cross-body shoulder stretch - 30s each side', demo: 'https://www.youtube.com/results?search_query=cross+body+shoulder+stretch' },
  triceps: { text: 'Overhead tricep stretch - 30s each side', demo: 'https://www.youtube.com/results?search_query=overhead+tricep+stretch' },
  back: { text: 'Bench-supported lat stretch - 30s each side', demo: 'https://www.youtube.com/results?search_query=lat+stretch+bench' },
  rear_delts: { text: 'Rear delt hug stretch - 30s', demo: 'https://www.youtube.com/results?search_query=rear+delt+stretch' },
  biceps: { text: 'Wall-assisted bicep stretch - 30s each side', demo: 'https://www.youtube.com/results?search_query=bicep+stretch+wall' },
  quads: { text: 'Standing quad stretch - 30s each side', demo: 'https://www.youtube.com/results?search_query=standing+quad+stretch' },
  hamstrings: { text: 'Lying hamstring stretch - 30s each side', demo: 'https://www.youtube.com/results?search_query=lying+hamstring+stretch' },
  glutes: { text: 'Figure-four glute stretch - 30s each side', demo: 'https://www.youtube.com/results?search_query=figure+four+glute+stretch' },
  calves: { text: 'Wall calf stretch - 30s each side', demo: 'https://www.youtube.com/results?search_query=wall+calf+stretch' },
  core: { text: 'Child\'s pose with long exhales - 45s', demo: 'https://www.youtube.com/results?search_query=childs+pose+stretch' },
}

const SLOT_PATTERNS = {
  chest_compound: ['horizontal_push'],
  chest_iso: ['chest_isolation'],
  shoulder_press: ['vertical_push'],
  shoulder_iso: ['shoulder_isolation'],
  triceps: ['triceps_isolation'],
  vertical_pull: ['vertical_pull'],
  horizontal_pull: ['horizontal_pull'],
  rear_delt: ['rear_delt'],
  biceps: ['elbow_flexion'],
  squat: ['squat'],
  quad_accessory: ['knee_extension', 'lunge', 'squat'],
  hinge: ['hip_hinge'],
  hamstring_iso: ['knee_flexion'],
  glute: ['glute_isolation', 'hip_hinge', 'lunge'],
  calves: ['calf_isolation', 'isolation'],
  core: ['anti_extension', 'anti_rotation', 'core_flexion', 'isometric'],
}

const SLOT_PRIORITY = {
  chest_upper: {
    gym: ['incline_db_press', 'dumbbell_bench_press', 'machine_chest_press', 'band_chest_press', 'incline_push_up'],
    home: ['incline_push_up', 'dumbbell_bench_press', 'band_chest_press', 'push_up', 'knee_push_up'],
    patterns: SLOT_PATTERNS.chest_compound,
  },
  chest_flat: {
    gym: ['barbell_bench_press', 'dumbbell_bench_press', 'machine_chest_press', 'push_up', 'band_chest_press'],
    home: ['push_up', 'dumbbell_bench_press', 'band_chest_press', 'knee_push_up', 'incline_push_up'],
    patterns: SLOT_PATTERNS.chest_compound,
  },
  chest_iso: {
    gym: ['cable_chest_fly', 'dumbbell_chest_fly', 'machine_chest_press', 'band_chest_press'],
    home: ['dumbbell_chest_fly', 'band_chest_press', 'incline_push_up', 'push_up'],
    patterns: SLOT_PATTERNS.chest_iso,
  },
  shoulder_press: {
    gym: ['barbell_overhead_press', 'seated_db_shoulder_press', 'overhead_press_db', 'arnold_press', 'pike_push_up'],
    home: ['overhead_press_db', 'pike_push_up', 'arnold_press', 'seated_db_shoulder_press'],
    patterns: SLOT_PATTERNS.shoulder_press,
  },
  shoulder_iso: {
    gym: ['cable_lateral_raise', 'dumbbell_lateral_raise', 'band_lateral_raise'],
    home: ['dumbbell_lateral_raise', 'band_lateral_raise', 'pike_push_up'],
    patterns: SLOT_PATTERNS.shoulder_iso,
  },
  triceps_primary: {
    gym: ['rope_pushdown', 'overhead_tricep_extension', 'skull_crusher', 'tricep_dips', 'band_tricep_pushdown'],
    home: ['tricep_dips', 'overhead_tricep_extension', 'band_tricep_pushdown', 'push_up'],
    patterns: SLOT_PATTERNS.triceps,
  },
  triceps_secondary: {
    gym: ['skull_crusher', 'overhead_tricep_extension', 'rope_pushdown', 'close_grip_bench_press', 'band_tricep_pushdown'],
    home: ['overhead_tricep_extension', 'band_tricep_pushdown', 'tricep_dips', 'push_up'],
    patterns: SLOT_PATTERNS.triceps,
  },
  vertical_pull: {
    gym: ['lat_pulldown', 'pull_up', 'band_lat_pulldown', 'straight_arm_pulldown', 'band_assisted_pull_up'],
    home: ['pull_up', 'band_assisted_pull_up', 'band_lat_pulldown', 'band_row', 'inverted_row'],
    patterns: SLOT_PATTERNS.vertical_pull,
  },
  horizontal_pull: {
    gym: ['chest_supported_row', 'seated_cable_row', 'barbell_row', 'dumbbell_row', 'band_row'],
    home: ['dumbbell_row', 'band_row', 'inverted_row', 'chest_supported_row'],
    patterns: SLOT_PATTERNS.horizontal_pull,
  },
  back_secondary: {
    gym: ['straight_arm_pulldown', 'seated_cable_row', 'barbell_row', 'lat_pulldown', 'dumbbell_row'],
    home: ['band_lat_pulldown', 'band_row', 'dumbbell_row', 'inverted_row'],
    patterns: [...SLOT_PATTERNS.vertical_pull, ...SLOT_PATTERNS.horizontal_pull],
  },
  rear_delt: {
    gym: ['face_pull', 'reverse_pec_deck', 'rear_delt_fly', 'band_face_pull'],
    home: ['band_face_pull', 'rear_delt_fly', 'face_pull', 'reverse_pec_deck'],
    patterns: SLOT_PATTERNS.rear_delt,
  },
  biceps_primary: {
    gym: ['bicep_curl_db', 'cable_curl', 'hammer_curl', 'preacher_curl', 'band_bicep_curl'],
    home: ['bicep_curl_db', 'hammer_curl', 'band_bicep_curl', 'cable_curl'],
    patterns: SLOT_PATTERNS.biceps,
  },
  biceps_secondary: {
    gym: ['hammer_curl', 'preacher_curl', 'cable_curl', 'bicep_curl_db', 'band_bicep_curl'],
    home: ['hammer_curl', 'band_bicep_curl', 'bicep_curl_db', 'cable_curl'],
    patterns: SLOT_PATTERNS.biceps,
  },
  squat_main: {
    gym: ['barbell_squat', 'front_squat', 'leg_press', 'goblet_squat', 'bodyweight_squat'],
    home: ['goblet_squat', 'bodyweight_squat', 'split_squat', 'reverse_lunge', 'walking_lunge'],
    patterns: SLOT_PATTERNS.squat,
  },
  quad_secondary: {
    gym: ['leg_press', 'leg_extension', 'split_squat', 'reverse_lunge', 'walking_lunge'],
    home: ['split_squat', 'reverse_lunge', 'walking_lunge', 'goblet_squat', 'bodyweight_squat'],
    patterns: SLOT_PATTERNS.quad_accessory,
  },
  hinge_main: {
    gym: ['romanian_deadlift', 'barbell_deadlift', 'stiff_leg_deadlift', 'hip_thrust', 'glute_bridge'],
    home: ['romanian_deadlift', 'hip_thrust', 'glute_bridge', 'single_leg_glute_bridge'],
    patterns: SLOT_PATTERNS.hinge,
  },
  hamstring_iso: {
    gym: ['seated_leg_curl', 'lying_leg_curl', 'romanian_deadlift', 'stiff_leg_deadlift'],
    home: ['romanian_deadlift', 'single_leg_glute_bridge', 'glute_bridge', 'reverse_lunge'],
    patterns: SLOT_PATTERNS.hamstring_iso,
  },
  glute_primary: {
    gym: ['barbell_hip_thrust', 'hip_thrust', 'cable_glute_kickback', 'hip_abduction_machine', 'glute_bridge'],
    home: ['single_leg_glute_bridge', 'glute_bridge', 'split_squat', 'reverse_lunge', 'walking_lunge'],
    patterns: SLOT_PATTERNS.glute,
  },
  glute_secondary: {
    gym: ['cable_pull_through', 'cable_glute_kickback', 'split_squat', 'barbell_hip_thrust', 'glute_bridge'],
    home: ['split_squat', 'reverse_lunge', 'single_leg_glute_bridge', 'walking_lunge', 'glute_bridge'],
    patterns: SLOT_PATTERNS.glute,
  },
  calves: {
    gym: ['seated_calf_raise', 'leg_press_calf_raise', 'calf_raise', 'single_leg_calf_raise', 'bent_knee_calf_raise'],
    home: ['calf_raise', 'single_leg_calf_raise', 'bent_knee_calf_raise', 'seated_calf_raise'],
    patterns: SLOT_PATTERNS.calves,
  },
  core: {
    gym: ['cable_crunch', 'hanging_knee_raise', 'pallof_press', 'plank', 'dead_bug'],
    home: ['dead_bug', 'plank', 'bird_dog', 'pallof_press', 'mountain_climber'],
    patterns: SLOT_PATTERNS.core,
  },
}

const MUSCLE_BLOCK_SLOTS = {
  chest: ['chest_upper', 'chest_flat', 'chest_iso'],
  shoulders: ['shoulder_press', 'shoulder_iso', 'shoulder_press'],
  triceps: ['triceps_primary', 'triceps_secondary', 'triceps_primary'],
  back: ['vertical_pull', 'horizontal_pull', 'back_secondary'],
  rear_delts: ['rear_delt', 'rear_delt', 'rear_delt'],
  biceps: ['biceps_primary', 'biceps_secondary', 'biceps_primary'],
  quads: ['squat_main', 'quad_secondary', 'quad_secondary'],
  hamstrings: ['hinge_main', 'hamstring_iso', 'hinge_main'],
  glutes: ['glute_primary', 'glute_secondary', 'glute_primary'],
  calves: ['calves', 'calves', 'calves'],
  core: ['core', 'core', 'core'],
}

const LEVEL_TEMPLATES = {
  push: {
    beginner: [
      { slot: 'chest_upper', phase: 'compound', muscle: 'chest', emphasis: 'Upper chest compound' },
      { slot: 'chest_flat', phase: 'secondary', muscle: 'chest', emphasis: 'Flat chest press' },
      { slot: 'shoulder_press', phase: 'secondary', muscle: 'shoulders', emphasis: 'Front delt press' },
      { slot: 'shoulder_iso', phase: 'isolation', muscle: 'shoulders', emphasis: 'Lateral delt raise' },
      { slot: 'triceps_primary', phase: 'isolation', muscle: 'triceps', emphasis: 'Tricep lockout work' },
    ],
    intermediate: [
      { slot: 'chest_upper', phase: 'compound', muscle: 'chest', emphasis: 'Upper chest compound' },
      { slot: 'chest_flat', phase: 'secondary', muscle: 'chest', emphasis: 'Flat chest press' },
      { slot: 'shoulder_press', phase: 'secondary', muscle: 'shoulders', emphasis: 'Overhead press' },
      { slot: 'shoulder_iso', phase: 'isolation', muscle: 'shoulders', emphasis: 'Lateral delt raise' },
      { slot: 'triceps_primary', phase: 'isolation', muscle: 'triceps', emphasis: 'Primary tricep builder' },
      { slot: 'chest_iso', phase: 'finisher', muscle: 'chest', emphasis: 'Chest finisher angle' },
    ],
    advanced: [
      { slot: 'chest_upper', phase: 'compound', muscle: 'chest', emphasis: 'Upper chest compound' },
      { slot: 'chest_flat', phase: 'secondary', muscle: 'chest', emphasis: 'Flat chest press' },
      { slot: 'shoulder_press', phase: 'secondary', muscle: 'shoulders', emphasis: 'Heavy shoulder press' },
      { slot: 'chest_iso', phase: 'isolation', muscle: 'chest', emphasis: 'Chest isolation angle' },
      { slot: 'shoulder_iso', phase: 'isolation', muscle: 'shoulders', emphasis: 'Lateral delt raise' },
      { slot: 'triceps_primary', phase: 'isolation', muscle: 'triceps', emphasis: 'Primary tricep builder' },
      { slot: 'triceps_secondary', phase: 'finisher', muscle: 'triceps', emphasis: 'Tricep finisher' },
    ],
  },
  pull: {
    beginner: [
      { slot: 'vertical_pull', phase: 'compound', muscle: 'back', emphasis: 'Vertical pull for lats' },
      { slot: 'horizontal_pull', phase: 'secondary', muscle: 'back', emphasis: 'Horizontal pull for upper back' },
      { slot: 'rear_delt', phase: 'isolation', muscle: 'rear_delts', emphasis: 'Rear delt postural work' },
      { slot: 'biceps_primary', phase: 'isolation', muscle: 'biceps', emphasis: 'Primary bicep curl' },
      { slot: 'biceps_secondary', phase: 'finisher', muscle: 'biceps', emphasis: 'Secondary bicep variation' },
    ],
    intermediate: [
      { slot: 'vertical_pull', phase: 'compound', muscle: 'back', emphasis: 'Vertical pull for lats' },
      { slot: 'horizontal_pull', phase: 'secondary', muscle: 'back', emphasis: 'Horizontal pull for upper back' },
      { slot: 'back_secondary', phase: 'secondary', muscle: 'back', emphasis: 'Extra back density' },
      { slot: 'rear_delt', phase: 'isolation', muscle: 'rear_delts', emphasis: 'Rear delt health' },
      { slot: 'biceps_primary', phase: 'isolation', muscle: 'biceps', emphasis: 'Primary bicep curl' },
      { slot: 'biceps_secondary', phase: 'finisher', muscle: 'biceps', emphasis: 'Secondary bicep variation' },
    ],
    advanced: [
      { slot: 'vertical_pull', phase: 'compound', muscle: 'back', emphasis: 'Primary lat movement' },
      { slot: 'horizontal_pull', phase: 'secondary', muscle: 'back', emphasis: 'Heavy row pattern' },
      { slot: 'back_secondary', phase: 'secondary', muscle: 'back', emphasis: 'Secondary back angle' },
      { slot: 'rear_delt', phase: 'isolation', muscle: 'rear_delts', emphasis: 'Rear delt health' },
      { slot: 'biceps_primary', phase: 'isolation', muscle: 'biceps', emphasis: 'Primary bicep curl' },
      { slot: 'biceps_secondary', phase: 'isolation', muscle: 'biceps', emphasis: 'Secondary bicep variation' },
      { slot: 'rear_delt', phase: 'finisher', muscle: 'rear_delts', emphasis: 'Rear delt finisher' },
    ],
  },
  legs: {
    beginner: [
      { slot: 'squat_main', phase: 'compound', muscle: 'quads', emphasis: 'Main squat pattern' },
      { slot: 'hinge_main', phase: 'secondary', muscle: 'hamstrings', emphasis: 'Main hip hinge' },
      { slot: 'glute_primary', phase: 'secondary', muscle: 'glutes', emphasis: 'Glute builder' },
      { slot: 'calves', phase: 'isolation', muscle: 'calves', emphasis: 'Calf work' },
      { slot: 'quad_secondary', phase: 'finisher', muscle: 'quads', emphasis: 'Quad accessory' },
    ],
    intermediate: [
      { slot: 'squat_main', phase: 'compound', muscle: 'quads', emphasis: 'Main squat pattern' },
      { slot: 'quad_secondary', phase: 'secondary', muscle: 'quads', emphasis: 'Quad accessory' },
      { slot: 'hinge_main', phase: 'secondary', muscle: 'hamstrings', emphasis: 'Main hip hinge' },
      { slot: 'hamstring_iso', phase: 'isolation', muscle: 'hamstrings', emphasis: 'Hamstring isolation' },
      { slot: 'glute_primary', phase: 'isolation', muscle: 'glutes', emphasis: 'Glute builder' },
      { slot: 'calves', phase: 'finisher', muscle: 'calves', emphasis: 'Calf finisher' },
    ],
    advanced: [
      { slot: 'squat_main', phase: 'compound', muscle: 'quads', emphasis: 'Primary squat pattern' },
      { slot: 'quad_secondary', phase: 'secondary', muscle: 'quads', emphasis: 'Secondary quad angle' },
      { slot: 'hinge_main', phase: 'secondary', muscle: 'hamstrings', emphasis: 'Primary hinge' },
      { slot: 'hamstring_iso', phase: 'isolation', muscle: 'hamstrings', emphasis: 'Hamstring isolation' },
      { slot: 'glute_primary', phase: 'isolation', muscle: 'glutes', emphasis: 'Glute builder' },
      { slot: 'glute_secondary', phase: 'isolation', muscle: 'glutes', emphasis: 'Secondary glute angle' },
      { slot: 'calves', phase: 'finisher', muscle: 'calves', emphasis: 'Calf finisher' },
    ],
  },
}

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function parseInjuries(text = '') {
  const value = text.toLowerCase()
  const injuries = new Set()
  if (value.includes('knee') || value.includes('patella') || value.includes('meniscus')) injuries.add('knee')
  if (value.includes('shoulder') || value.includes('rotator') || value.includes('cuff')) injuries.add('shoulder')
  if (value.includes('back') || value.includes('spine') || value.includes('lumbar')) injuries.add('lower_back')
  if (value.includes('ankle') || value.includes('achilles')) injuries.add('ankle')
  if (value.includes('wrist') || value.includes('forearm')) injuries.add('wrist')
  if (value.includes('hip') || value.includes('groin')) injuries.add('hip')
  if (value.includes('elbow')) injuries.add('elbow')
  return [...injuries]
}

export function inferReadinessLevel(profile) {
  const claimedLevel = profile.claimedLevel || 'beginner'
  const safeLevel = determineSafeLevel(profile)
  const finalLevel = minLevel(claimedLevel, safeLevel)
  const readinessScore = calculateReadinessScore(profile, safeLevel)
  const adjusted = finalLevel !== claimedLevel
  const explanation = buildLevelExplanation(profile, claimedLevel, safeLevel, finalLevel)

  return {
    claimedLevel,
    safeLevel,
    finalLevel,
    assignedLevel: finalLevel,
    inferredLevel: safeLevel,
    readinessScore,
    correctionType: adjusted ? 'downgrade' : 'accept',
    correctionReason: adjusted
      ? {
          summary: explanation.summary,
          detail: explanation.detail,
          progression: explanation.progression,
        }
      : null,
    explanation,
  }
}

export function selectOptimalSplit(profile, finalLevel) {
  const requested = profile.preferredSplit || 'auto'
  const days = Number(profile.daysPerWeek) || 3

  if (requested === 'auto') {
    if (days <= 2) return 'full_body'
    if (days === 3) return finalLevel === 'beginner' ? 'full_body' : 'ppl'
    if (days === 4) return 'upper_lower'
    if (days >= 5) return finalLevel === 'advanced' ? 'bro_split' : 'ppl'
  }

  if (requested === 'ppl') {
    if (days < 3) return 'full_body'
    if (finalLevel === 'beginner' && days > 3) return 'full_body'
    return 'ppl'
  }

  if (requested === 'upper_lower') return days < 4 ? 'full_body' : 'upper_lower'
  if (requested === 'bro_split') return finalLevel === 'advanced' && days >= 5 ? 'bro_split' : (days >= 4 ? 'upper_lower' : 'full_body')

  return 'full_body'
}

export function generatePlan(profile, readiness) {
  const injuries = parseInjuries(profile.injuriesText)
  const finalLevel = readiness.finalLevel || readiness.assignedLevel || 'beginner'
  const selectedSplit = selectOptimalSplit(profile, finalLevel)

  const safePool = getSafeExercises({
    level: finalLevel,
    equipment: profile.equipment,
    location: profile.location,
    injuries,
  })

  const weeklyPlan = buildWeeklyPlan({
    profile,
    finalLevel,
    selectedSplit,
    safePool,
    injuries,
  })

  const substitutions = buildSubstitutions(weeklyPlan, safePool, profile.location)
  const progressionPlan = buildProgressionPlan(finalLevel, profile.goal)
  const whyThisPlan = buildWhyThisPlan(profile, readiness, selectedSplit, finalLevel)
  const safetyNotes = buildSafetyNotes(profile, readiness, selectedSplit, injuries)
  const beginnerGuidance = buildBeginnerGuidance(finalLevel)

  return {
    final_level: finalLevel,
    explanation: readiness.explanation,
    selected_split: selectedSplit,
    splitLabel: SPLIT_LABELS[selectedSplit],
    weekly_plan: weeklyPlan,
    substitutions,
    progression_plan: progressionPlan,
    why_this_plan: whyThisPlan,
    safety_notes: safetyNotes,
    beginner_guidance: beginnerGuidance,
    finalLevel,
    assignedLevel: finalLevel,
    split: selectedSplit,
    days: weeklyPlan,
    readiness: {
      ...readiness,
      finalLevel,
      assignedLevel: finalLevel,
    },
    nutritionNote: buildNutritionNote(profile),
    recoveryNote: buildRecoveryNotes(profile, readiness),
    progression: progressionPlan.map((item) => `${item.week}: ${item.focus}`),
    injuries,
  }
}

function determineSafeLevel(profile) {
  const months = Number(profile.trainingHistoryMonths) || 0
  const days = Number(profile.daysPerWeek) || 3
  const sleep = profile.sleepQuality || 'good'
  const activity = profile.activityLevel || 'moderate'
  const injuries = profile.injuries || parseInjuries(profile.injuriesText)

  let level = 'beginner'

  if (months < 3) level = 'beginner'
  else if (months <= 12) level = 'intermediate'
  else level = sleep === 'good' || sleep === 'excellent' ? 'advanced' : 'intermediate'

  if (days <= 2 && level !== 'beginner') level = downgradeLevel(level)
  if (sleep === 'poor') level = downgradeLevel(level)
  if (activity === 'sedentary') level = downgradeLevel(level)
  if (activity === 'light' && level === 'advanced') level = 'intermediate'
  if (injuries.length >= 2) level = 'beginner'
  else if (injuries.length === 1 && level === 'advanced') level = 'intermediate'

  return level
}

function calculateReadinessScore(profile, safeLevel) {
  const months = Number(profile.trainingHistoryMonths) || 0
  const days = Number(profile.daysPerWeek) || 3
  const activityScores = { sedentary: 4, light: 8, moderate: 14, active: 18, very_active: 22 }
  const sleepScores = { poor: 4, fair: 8, good: 14, excellent: 18 }
  const injuryPenalty = (profile.injuries || parseInjuries(profile.injuriesText)).length * 8

  let score = 10
  score += months >= 12 ? 24 : months >= 3 ? 16 : 8
  score += Math.min(days * 5, 25)
  score += activityScores[profile.activityLevel || 'moderate'] ?? 12
  score += sleepScores[profile.sleepQuality || 'good'] ?? 12
  score -= injuryPenalty

  if (safeLevel === 'advanced') score += 10
  if (safeLevel === 'beginner') score -= 8

  return Math.max(0, Math.min(100, score))
}

function buildLevelExplanation(profile, claimedLevel, safeLevel, finalLevel) {
  const reasons = []
  const injuries = profile.injuries || parseInjuries(profile.injuriesText)

  if ((Number(profile.trainingHistoryMonths) || 0) < 3) reasons.push('less than 3 months of training history')
  if ((Number(profile.trainingHistoryMonths) || 0) <= 12 && safeLevel !== 'advanced') reasons.push('not enough training age for advanced programming')
  if ((Number(profile.daysPerWeek) || 0) <= 2) reasons.push('low weekly frequency for high-volume programming')
  if (profile.sleepQuality === 'poor') reasons.push('poor recovery quality')
  if (profile.activityLevel === 'sedentary') reasons.push('very low daily activity outside training')
  if (injuries.length) reasons.push(`active limitation filter: ${injuries.join(', ')}`)

  return {
    adjusted: claimedLevel !== finalLevel,
    summary: claimedLevel === finalLevel
      ? `Your selected level stayed at ${LEVEL_LABELS[finalLevel]}.`
      : `Your selected level was safely adjusted from ${LEVEL_LABELS[claimedLevel]} to ${LEVEL_LABELS[finalLevel]}.`,
    detail: reasons.length
      ? `The planner capped your training level because of ${reasons.join(', ')}.`
      : 'Your current profile supports the selected level.',
    progression: finalLevel === 'beginner'
      ? 'Nail technique, recover well, and add small weekly wins before moving up.'
      : finalLevel === 'intermediate'
        ? 'Build 8-12 solid weeks of consistent training before pushing advanced volume.'
        : 'Your recovery inputs support advanced volume, but intensity should still be earned week to week.',
  }
}

function buildWeeklyPlan({ profile, finalLevel, selectedSplit, safePool, injuries }) {
  const trainingDays = DAY_PATTERNS[Math.min(Math.max(Number(profile.daysPerWeek) || 3, 1), 7)]
  const weeklyPlan = []
  const sequence = getDaySequence(selectedSplit, trainingDays.length)

  DAY_NAMES.forEach((dayName, dayIndex) => {
    const trainingIndex = trainingDays.indexOf(dayIndex)
    if (trainingIndex === -1) {
      weeklyPlan.push(buildRestDay(dayName))
      return
    }

    const dayType = sequence[trainingIndex] || sequence[sequence.length - 1]
    weeklyPlan.push(buildTrainingDay(dayName, dayType, trainingIndex, {
      profile,
      finalLevel,
      safePool,
      injuries,
      selectedSplit,
    }))
  })

  return weeklyPlan
}

function getDaySequence(split, count) {
  if (split === 'ppl') {
    const sequences = {
      3: ['push', 'pull', 'legs'],
      4: ['push', 'pull', 'legs', 'push'],
      5: ['push', 'pull', 'legs', 'push', 'pull'],
      6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
    }
    return sequences[count] || sequences[3]
  }

  if (split === 'upper_lower') {
    const sequences = {
      4: ['upper', 'lower', 'upper', 'lower'],
      5: ['upper', 'lower', 'upper', 'lower', 'full_body'],
      6: ['upper', 'lower', 'upper', 'lower', 'push', 'pull'],
    }
    return sequences[count] || sequences[4]
  }

  if (split === 'bro_split') {
    const sequences = {
      5: ['chest', 'back', 'legs', 'shoulders', 'arms'],
      6: ['chest', 'back', 'legs', 'shoulders', 'arms', 'full_body'],
    }
    return sequences[count] || sequences[5]
  }

  return Array.from({ length: count }, () => 'full_body')
}

function buildTrainingDay(dayName, dayType, dayIndex, context) {
  if (dayType === 'push') return buildStructuredDay(dayName, 'push', dayIndex, context)
  if (dayType === 'pull') return buildStructuredDay(dayName, 'pull', dayIndex, context)
  if (dayType === 'legs') return buildStructuredDay(dayName, 'legs', dayIndex, context)
  if (dayType === 'upper') return buildUpperDay(dayName, dayIndex, context)
  if (dayType === 'lower') return buildLowerDay(dayName, dayIndex, context)
  if (dayType === 'chest') return buildBroPushDay(dayName, dayIndex, context, 'chest')
  if (dayType === 'back') return buildBroPullDay(dayName, dayIndex, context)
  if (dayType === 'shoulders') return buildBroPushDay(dayName, dayIndex, context, 'shoulders')
  if (dayType === 'arms') return buildArmsDay(dayName, dayIndex, context)
  return buildFullBodyDay(dayName, dayIndex, context)
}

function buildStructuredDay(dayName, baseType, dayIndex, context) {
  const template = LEVEL_TEMPLATES[baseType][context.finalLevel]
  const usedIds = new Set()
  const exercises = template
    .map((slotDef, slotIndex) => createExerciseFromSlot(slotDef, {
      ...context,
      dayType: baseType,
      usedIds,
      rotationSeed: dayIndex + slotIndex,
    }))
    .filter(Boolean)

  const completed = ensureCoverage(baseType, exercises, {
    ...context,
    dayType: baseType,
    usedIds,
    rotationSeed: dayIndex + exercises.length,
  })

  return finalizeDay(dayName, baseType, completed, context)
}

function buildUpperDay(dayName, dayIndex, context) {
  const template = [
    { slot: 'chest_flat', phase: 'compound', muscle: 'chest', emphasis: 'Primary upper-body press' },
    { slot: 'vertical_pull', phase: 'compound', muscle: 'back', emphasis: 'Primary vertical pull' },
    { slot: 'horizontal_pull', phase: 'secondary', muscle: 'back', emphasis: 'Upper-back row' },
    { slot: 'shoulder_press', phase: 'secondary', muscle: 'shoulders', emphasis: 'Shoulder press' },
    { slot: 'shoulder_iso', phase: 'isolation', muscle: 'shoulders', emphasis: 'Lateral raise' },
    context.finalLevel === 'beginner'
      ? { slot: 'triceps_primary', phase: 'finisher', muscle: 'triceps', emphasis: 'Arm finisher' }
      : { slot: 'biceps_primary', phase: 'finisher', muscle: 'biceps', emphasis: 'Arm finisher' },
  ]
  const usedIds = new Set()
  const exercises = template
    .map((slotDef, slotIndex) => createExerciseFromSlot(slotDef, {
      ...context,
      dayType: 'upper',
      usedIds,
      rotationSeed: dayIndex + slotIndex,
    }))
    .filter(Boolean)

  return finalizeDay(dayName, 'upper', exercises, context, {
    focus: 'Upper - Press - Pull - Delts',
    whyThisDay: 'This upper day blends pressing and pulling so you can drive frequency without sacrificing shoulder balance.',
    targetMuscles: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  })
}

function buildLowerDay(dayName, dayIndex, context) {
  const template = [
    { slot: 'squat_main', phase: 'compound', muscle: 'quads', emphasis: 'Primary squat pattern' },
    { slot: 'hinge_main', phase: 'secondary', muscle: 'hamstrings', emphasis: 'Primary hinge' },
    { slot: 'quad_secondary', phase: 'secondary', muscle: 'quads', emphasis: 'Quad accessory' },
    { slot: 'glute_primary', phase: 'isolation', muscle: 'glutes', emphasis: 'Glute builder' },
    { slot: 'calves', phase: 'finisher', muscle: 'calves', emphasis: 'Calf finisher' },
    context.finalLevel === 'advanced'
      ? { slot: 'hamstring_iso', phase: 'finisher', muscle: 'hamstrings', emphasis: 'Extra hamstring work' }
      : null,
  ].filter(Boolean)

  const usedIds = new Set()
  const exercises = template
    .map((slotDef, slotIndex) => createExerciseFromSlot(slotDef, {
      ...context,
      dayType: 'lower',
      usedIds,
      rotationSeed: dayIndex + slotIndex,
    }))
    .filter(Boolean)

  return finalizeDay(dayName, 'lower', exercises, context, {
    focus: 'Lower - Quads - Hams - Glutes - Calves',
    whyThisDay: 'This lower day anchors itself around one squat and one hinge so the legs grow without junk volume.',
    targetMuscles: ['quads', 'hamstrings', 'glutes', 'calves'],
  })
}

function buildFullBodyDay(dayName, dayIndex, context) {
  const template = [
    { slot: 'squat_main', phase: 'compound', muscle: 'quads', emphasis: 'Lower-body compound' },
    { slot: 'chest_flat', phase: 'secondary', muscle: 'chest', emphasis: 'Primary press' },
    { slot: 'vertical_pull', phase: 'secondary', muscle: 'back', emphasis: 'Primary pull' },
    { slot: 'hinge_main', phase: 'secondary', muscle: 'hamstrings', emphasis: 'Posterior chain' },
    { slot: 'horizontal_pull', phase: 'isolation', muscle: 'back', emphasis: 'Upper-back support' },
    { slot: 'core', phase: 'finisher', muscle: 'core', emphasis: 'Core stability' },
  ]
  const usedIds = new Set()
  const exercises = template
    .map((slotDef, slotIndex) => createExerciseFromSlot(slotDef, {
      ...context,
      dayType: 'full_body',
      usedIds,
      rotationSeed: dayIndex + slotIndex,
    }))
    .filter(Boolean)

  return finalizeDay(dayName, 'full_body', trimForLevel(exercises, context.finalLevel, 'full_body'), context, {
    focus: 'Full Body - Strength - Skill - Balance',
    whyThisDay: 'Full-body structure is the safest way to build strength and consistency when frequency is limited.',
    targetMuscles: ['quads', 'chest', 'back', 'hamstrings', 'core'],
  })
}

function buildBroPushDay(dayName, dayIndex, context, focus) {
  if (focus === 'chest') {
    const template = [
      { slot: 'chest_upper', phase: 'compound', muscle: 'chest', emphasis: 'Upper chest compound' },
      { slot: 'chest_flat', phase: 'secondary', muscle: 'chest', emphasis: 'Flat chest press' },
      { slot: 'chest_iso', phase: 'isolation', muscle: 'chest', emphasis: 'Chest isolation' },
      { slot: 'shoulder_press', phase: 'secondary', muscle: 'shoulders', emphasis: 'Front delt support' },
      { slot: 'triceps_primary', phase: 'finisher', muscle: 'triceps', emphasis: 'Tricep lockout work' },
    ]
    return finalizeBroDay(dayName, dayIndex, context, template, 'Chest Day - Upper + Mid Chest', ['chest', 'shoulders', 'triceps'])
  }

  const template = [
    { slot: 'shoulder_press', phase: 'compound', muscle: 'shoulders', emphasis: 'Primary shoulder press' },
    { slot: 'shoulder_iso', phase: 'isolation', muscle: 'shoulders', emphasis: 'Lateral delt raise' },
    { slot: 'shoulder_iso', phase: 'finisher', muscle: 'shoulders', emphasis: 'Second delt angle' },
    { slot: 'rear_delt', phase: 'isolation', muscle: 'rear_delts', emphasis: 'Rear delt support' },
    { slot: 'triceps_primary', phase: 'finisher', muscle: 'triceps', emphasis: 'Tricep support' },
  ]
  return finalizeBroDay(dayName, dayIndex, context, template, 'Shoulder Day - Front + Lateral Delts', ['shoulders', 'rear_delts', 'triceps'])
}

function buildBroPullDay(dayName, dayIndex, context) {
  const template = [
    { slot: 'vertical_pull', phase: 'compound', muscle: 'back', emphasis: 'Primary lat movement' },
    { slot: 'horizontal_pull', phase: 'secondary', muscle: 'back', emphasis: 'Upper-back row' },
    { slot: 'back_secondary', phase: 'secondary', muscle: 'back', emphasis: 'Secondary back angle' },
    { slot: 'rear_delt', phase: 'isolation', muscle: 'rear_delts', emphasis: 'Rear delt support' },
    { slot: 'biceps_primary', phase: 'finisher', muscle: 'biceps', emphasis: 'Bicep builder' },
  ]
  return finalizeBroDay(dayName, dayIndex, context, template, 'Back Day - Lats + Upper Back', ['back', 'rear_delts', 'biceps'])
}

function buildArmsDay(dayName, dayIndex, context) {
  const template = [
    { slot: 'biceps_primary', phase: 'compound', muscle: 'biceps', emphasis: 'Primary bicep curl' },
    { slot: 'biceps_secondary', phase: 'isolation', muscle: 'biceps', emphasis: 'Secondary bicep angle' },
    { slot: 'triceps_primary', phase: 'secondary', muscle: 'triceps', emphasis: 'Primary tricep builder' },
    { slot: 'triceps_secondary', phase: 'isolation', muscle: 'triceps', emphasis: 'Secondary tricep angle' },
    { slot: 'shoulder_iso', phase: 'finisher', muscle: 'shoulders', emphasis: 'Shoulder cap finisher' },
  ]
  return finalizeBroDay(dayName, dayIndex, context, template, 'Arms Day - Biceps + Triceps', ['biceps', 'triceps', 'shoulders'])
}

function finalizeBroDay(dayName, dayIndex, context, template, focus, targetMuscles) {
  const usedIds = new Set()
  const exercises = template
    .map((slotDef, slotIndex) => createExerciseFromSlot(slotDef, {
      ...context,
      dayType: 'bro_split',
      usedIds,
      rotationSeed: dayIndex + slotIndex,
    }))
    .filter(Boolean)

  return finalizeDay(dayName, 'bro_split', trimForLevel(exercises, context.finalLevel, 'bro_split'), context, {
    focus,
    whyThisDay: 'This focused split lets you push more targeted volume because the rest of the week protects recovery.',
    targetMuscles,
  })
}

function createExerciseFromSlot(slotDef, context) {
  const exercise = pickExerciseForSlot(slotDef.slot, context)
  if (!exercise) return null

  const prescription = prescribeExercise({
    goal: context.profile.goal,
    level: context.finalLevel,
    phase: slotDef.phase,
    muscle: slotDef.muscle,
  })

  return {
    id: exercise.id,
    name: exercise.name,
    phase: slotDef.phase,
    muscle: slotDef.muscle,
    muscleLabel: MUSCLE_LABELS[slotDef.muscle] || slotDef.muscle,
    emphasis: slotDef.emphasis,
    sets: prescription.sets,
    reps: prescription.reps,
    rest: prescription.rest,
    tips: exercise.tips,
    youtube_link: exercise.demo,
    youtubeLink: exercise.demo,
    thumbnail: exercise.thumbnail,
    images: exercise.images || [],
    equipment: exercise.equipment,
    substitutes: buildExerciseSubstitutions(exercise, context.safePool, context.profile.location, slotDef.muscle),
  }
}

function pickExerciseForSlot(slotKey, context) {
  const slot = SLOT_PRIORITY[slotKey]
  if (!slot) return null

  const location = context.profile.location === 'home' ? 'home' : 'gym'
  const orderedIds = rotate(slot[location], context.rotationSeed)

  for (const id of orderedIds) {
    const found = context.safePool.find((exercise) => exercise.id === id)
    if (found && !context.usedIds.has(found.id)) {
      context.usedIds.add(found.id)
      return found
    }
  }

  const fallback = context.safePool.find((exercise) => {
    if (context.usedIds.has(exercise.id)) return false
    if (!exercise.muscles.includes(getSlotPrimaryMuscle(slotKey))) return false
    return slot.patterns.includes(exercise.pattern)
  })

  if (fallback) {
    context.usedIds.add(fallback.id)
    return fallback
  }

  const broadFallback = context.safePool.find((exercise) => {
    if (context.usedIds.has(exercise.id)) return false
    return exercise.muscles.includes(getSlotPrimaryMuscle(slotKey))
  })

  if (broadFallback) {
    context.usedIds.add(broadFallback.id)
    return broadFallback
  }

  return null
}

function ensureCoverage(dayType, exercises, context) {
  const required = REQUIRED_MUSCLES[dayType] || []
  const missing = required.filter((muscle) => !exercises.some((exercise) => exercise.muscle === muscle))

  const coverageSlots = {
    chest: { slot: 'chest_flat', phase: 'isolation', muscle: 'chest', emphasis: 'Coverage add-on' },
    shoulders: { slot: 'shoulder_iso', phase: 'isolation', muscle: 'shoulders', emphasis: 'Coverage add-on' },
    triceps: { slot: 'triceps_primary', phase: 'finisher', muscle: 'triceps', emphasis: 'Coverage add-on' },
    back: { slot: 'horizontal_pull', phase: 'secondary', muscle: 'back', emphasis: 'Coverage add-on' },
    rear_delts: { slot: 'rear_delt', phase: 'isolation', muscle: 'rear_delts', emphasis: 'Coverage add-on' },
    biceps: { slot: 'biceps_primary', phase: 'finisher', muscle: 'biceps', emphasis: 'Coverage add-on' },
    quads: { slot: 'quad_secondary', phase: 'secondary', muscle: 'quads', emphasis: 'Coverage add-on' },
    hamstrings: { slot: 'hamstring_iso', phase: 'isolation', muscle: 'hamstrings', emphasis: 'Coverage add-on' },
    glutes: { slot: 'glute_primary', phase: 'isolation', muscle: 'glutes', emphasis: 'Coverage add-on' },
    calves: { slot: 'calves', phase: 'finisher', muscle: 'calves', emphasis: 'Coverage add-on' },
  }

  const completed = [...exercises]
  missing.forEach((muscle, index) => {
    const addition = createExerciseFromSlot(coverageSlots[muscle], {
      ...context,
      rotationSeed: context.rotationSeed + index + 7,
    })
    if (addition) completed.push(addition)
  })

  return trimForLevel(completed, context.finalLevel, dayType)
}

function trimForLevel(exercises, level, dayType) {
  const limits = {
    beginner: dayType === 'full_body' ? 5 : 5,
    intermediate: dayType === 'bro_split' ? 6 : 6,
    advanced: dayType === 'full_body' ? 6 : 8,
  }
  return exercises.slice(0, limits[level] || exercises.length)
}

function finalizeDay(dayName, baseType, exercises, context, overrides = {}) {
  const targetMuscles = overrides.targetMuscles || REQUIRED_MUSCLES[baseType] || deriveTargetMuscles(exercises)
  const warmup = buildWarmup(baseType)
  const cooldown = buildCooldown(targetMuscles)
  const sections = buildSections(exercises)
  const muscleBlocks = buildMuscleBlocks(targetMuscles, context)
  const focus = overrides.focus || buildDefaultFocus(baseType)
  const whyThisDay = overrides.whyThisDay || buildDayReason(baseType)
  const duration = estimateDuration(exercises)

  return {
    day: dayName,
    type: 'training',
    focus,
    warmup,
    warmUp: warmup,
    exercises,
    sections,
    muscle_blocks: muscleBlocks,
    muscleBlocks,
    cooldown,
    coolDown: cooldown,
    why_this_day: whyThisDay,
    whyThisDay,
    target_muscles: targetMuscles,
    targetMuscles,
    estimated_duration: duration,
    estimatedDuration: duration,
    beginner_guidance: context.finalLevel === 'beginner'
      ? 'Start every set with control. Stop before form breaks and use the demo links if a movement feels unfamiliar.'
      : null,
    structure: ['Warm-up', 'Compound movement', 'Secondary compound', 'Isolation exercises', 'Optional finisher', 'Cooldown'],
  }
}

function buildMuscleBlocks(targetMuscles, context) {
  return targetMuscles
    .map((muscle, index) => {
      const exercises = recommendExercisesForMuscle(muscle, {
        ...context,
        rotationSeed: (context.rotationSeed || 0) + index * 5 + 11,
      })

      return {
        muscle,
        muscleLabel: MUSCLE_LABELS[muscle] || muscle,
        exercises,
      }
    })
    .filter((block) => block.exercises.length)
}

function recommendExercisesForMuscle(muscle, context) {
  const usedIds = new Set()
  const selected = []
  const slotKeys = MUSCLE_BLOCK_SLOTS[muscle] || []

  slotKeys.forEach((slotKey, index) => {
    const exercise = pickExerciseForMuscleSlot(slotKey, muscle, {
      ...context,
      usedIds,
      rotationSeed: (context.rotationSeed || 0) + index,
    })

    if (exercise) selected.push(exercise)
  })

  context.safePool
    .filter((exercise) => getExercisePrimaryMuscle(exercise) === muscle && !usedIds.has(exercise.id))
    .forEach((exercise) => {
      if (selected.length >= 3) return
      usedIds.add(exercise.id)
      selected.push(exercise)
    })

  for (const exercise of [...selected]) {
    if (selected.length >= 3) break

    for (const id of exercise.substitutes || []) {
      const substitute = getExerciseById(id)
      if (!substitute) continue
      if (!substitute.location.includes(context.profile.location)) continue
      if (getExercisePrimaryMuscle(substitute) !== muscle) continue
      if (usedIds.has(substitute.id)) continue

      usedIds.add(substitute.id)
      selected.push(substitute)

      if (selected.length >= 3) break
    }
  }

  return selected.slice(0, 3).map((exercise, index) => {
    const phase = index === 0 ? 'compound' : index === 1 ? 'secondary' : 'isolation'
    const prescription = prescribeExercise({
      goal: context.profile.goal,
      level: context.finalLevel,
      phase,
      muscle,
    })

    return {
      id: exercise.id,
      name: exercise.name,
      phase,
      muscle,
      muscleLabel: MUSCLE_LABELS[muscle] || muscle,
      sets: prescription.sets,
      reps: prescription.reps,
      rest: prescription.rest,
      tips: exercise.tips,
      youtube_link: exercise.demo,
      youtubeLink: exercise.demo,
      thumbnail: exercise.thumbnail,
      images: exercise.images || [],
      equipment: exercise.equipment,
      substitutes: buildExerciseSubstitutions(exercise, context.safePool, context.profile.location, muscle),
    }
  })
}

function pickExerciseForMuscleSlot(slotKey, muscle, context) {
  const slot = SLOT_PRIORITY[slotKey]
  if (!slot) return null

  const location = context.profile.location === 'home' ? 'home' : 'gym'
  const orderedIds = rotate(slot[location], context.rotationSeed)

  for (const id of orderedIds) {
    const found = context.safePool.find((exercise) => exercise.id === id)
    if (!found || context.usedIds.has(found.id)) continue
    if (getExercisePrimaryMuscle(found) !== muscle) continue

    context.usedIds.add(found.id)
    return found
  }

  const exactPatternFallback = context.safePool.find((exercise) => {
    if (context.usedIds.has(exercise.id)) return false
    if (getExercisePrimaryMuscle(exercise) !== muscle) return false
    return slot.patterns.includes(exercise.pattern)
  })

  if (exactPatternFallback) {
    context.usedIds.add(exactPatternFallback.id)
    return exactPatternFallback
  }

  const exactMuscleFallback = context.safePool.find((exercise) => {
    if (context.usedIds.has(exercise.id)) return false
    return getExercisePrimaryMuscle(exercise) === muscle
  })

  if (exactMuscleFallback) {
    context.usedIds.add(exactMuscleFallback.id)
    return exactMuscleFallback
  }

  return null
}

function buildSections(exercises) {
  const labels = {
    compound: 'Compound Movement',
    secondary: 'Secondary Compound',
    isolation: 'Isolation Work',
    finisher: 'Optional Finisher',
  }

  return ['compound', 'secondary', 'isolation', 'finisher']
    .map((phase) => ({
      phase,
      title: labels[phase],
      exercises: exercises.filter((exercise) => exercise.phase === phase),
    }))
    .filter((section) => section.exercises.length)
}

function buildRestDay(dayName) {
  return {
    day: dayName,
    type: 'rest',
    focus: 'Rest / Active Recovery',
    warmup: [],
    warmUp: [],
    exercises: [],
    sections: [],
    muscle_blocks: [],
    muscleBlocks: [],
    cooldown: [],
    coolDown: [],
    why_this_day: 'Recovery days are part of the plan. Walk, stretch lightly, and let the last training day adapt.',
    target_muscles: [],
    estimated_duration: '20-30 min optional recovery',
    estimatedDuration: '20-30 min optional recovery',
  }
}

function buildWarmup(dayType) {
  const typeKey = dayType === 'bro_split' ? 'upper' : dayType
  return uniqueItems([...GENERAL_WARMUP, ...(WARMUP_BY_DAY[typeKey] || WARMUP_BY_DAY.full_body)]).slice(0, 5)
}

function buildCooldown(targetMuscles) {
  const items = targetMuscles.map((muscle) => COOLDOWN_BY_MUSCLE[muscle]).filter(Boolean)
  items.push({
    text: 'Deep diaphragmatic breathing - 2 minutes',
    demo: 'https://www.youtube.com/results?search_query=diaphragmatic+breathing+exercise',
  })
  return uniqueItems(items).slice(0, 5)
}

function uniqueItems(items) {
  const seen = new Set()
  return items.filter((item) => {
    if (!item || seen.has(item.text)) return false
    seen.add(item.text)
    return true
  })
}

function deriveTargetMuscles(exercises) {
  return [...new Set(exercises.map((exercise) => exercise.muscle))]
}

function prescribeExercise({ goal, level, phase, muscle }) {
  if (goal === 'fat_loss') {
    return { sets: level === 'advanced' ? 3 : 2, reps: phase === 'compound' ? '10-12' : '12-15', rest: phase === 'compound' ? '45-60s' : '30-45s' }
  }

  if (goal === 'strength') {
    if (phase === 'compound') return { sets: level === 'advanced' ? 5 : level === 'intermediate' ? 4 : 3, reps: '4-6', rest: level === 'advanced' ? '120-150s' : '90-120s' }
    if (phase === 'secondary') return { sets: level === 'advanced' ? 4 : 3, reps: '5-8', rest: '90s' }
    return { sets: level === 'advanced' ? 3 : 2, reps: muscle === 'calves' ? '10-15' : '8-12', rest: '60s' }
  }

  if (phase === 'compound') return { sets: level === 'advanced' ? 5 : 3, reps: '6-10', rest: level === 'advanced' ? '90-120s' : '75-90s' }
  if (phase === 'secondary') return { sets: level === 'advanced' ? 4 : 3, reps: '8-12', rest: '60-90s' }
  return { sets: level === 'advanced' ? 4 : 3, reps: muscle === 'calves' ? '12-20' : '10-15', rest: '45-60s' }
}

function buildExerciseSubstitutions(exercise, safePool, location, muscle) {
  const alternatives = []

  exercise.substitutes?.forEach((id) => {
    const substitute = getExerciseById(id)
    if (!substitute) return
    if (!substitute.location.includes(location)) return
    if (!substitute.muscles.includes(muscle)) return
    alternatives.push(substitute.name)
  })

  safePool.forEach((candidate) => {
    if (candidate.id === exercise.id) return
    if (!candidate.muscles.includes(muscle)) return
    if (alternatives.includes(candidate.name)) return
    alternatives.push(candidate.name)
  })

  return alternatives.slice(0, 3)
}

function buildSubstitutions(weeklyPlan, safePool, location) {
  return weeklyPlan
    .filter((day) => day.type === 'training')
    .flatMap((day) => day.exercises.map((exercise) => ({
      day: day.day,
      exercise: exercise.name,
      muscle: exercise.muscleLabel,
      alternatives: buildExerciseSubstitutions(getExerciseById(exercise.id), safePool, location, exercise.muscle),
    })))
}

function buildProgressionPlan(level, goal) {
  const goalLine = goal === 'strength'
    ? 'Prioritize load first, then bar speed and repeat quality.'
    : goal === 'fat_loss'
      ? 'Prioritize density first, then total reps while keeping rest honest.'
      : 'Prioritize clean reps first, then controlled load increases.'

  return [
    { week: 'Week 1', focus: `Baseline week. Learn the flow, log every working set, and leave 1-2 reps in reserve. ${goalLine}` },
    { week: 'Week 2', focus: 'Keep the same exercises and add 1-2 reps across most sets without changing technique.' },
    { week: 'Week 3', focus: 'Increase load slightly on the main compound lifts and keep accessory quality high.' },
    { week: 'Week 4', focus: 'Deload. Cut volume by about 30-40%, keep the movement quality sharp, and recover hard.' },
  ]
}

function buildWhyThisPlan(profile, readiness, selectedSplit, finalLevel) {
  const locationText = profile.location === 'gym' ? 'gym equipment' : 'home equipment'
  return `This plan uses a ${SPLIT_LABELS[selectedSplit]} structure because you train ${profile.daysPerWeek} days per week, your safe level is ${LEVEL_LABELS[finalLevel]}, and the planner can cover each target muscle group properly with your ${locationText}.`
}

function buildSafetyNotes(profile, readiness, selectedSplit, injuries) {
  const notes = []
  if (readiness.claimedLevel !== readiness.finalLevel) notes.push(`Level adjusted from ${LEVEL_LABELS[readiness.claimedLevel]} to ${LEVEL_LABELS[readiness.finalLevel]} to keep volume and intensity realistic.`)
  if ((profile.preferredSplit || 'auto') !== 'auto' && selectedSplit !== profile.preferredSplit) notes.push(`Preferred split changed to ${SPLIT_LABELS[selectedSplit]} because your requested setup was not ideal for your frequency or recovery profile.`)
  if (injuries.length) notes.push(`Injury filter active: movements that could aggravate ${injuries.join(', ')} were removed or replaced.`)
  notes.push(`Environment filter active: the planner kept the same muscle coverage but swapped exercises for your ${profile.location} setup.`)
  if ((profile.daysPerWeek || 0) >= 5 && readiness.finalLevel !== 'advanced') notes.push('High weekly frequency with non-advanced readiness means the planner keeps volume tighter and recovery stricter.')
  return notes
}

function buildBeginnerGuidance(level) {
  if (level !== 'beginner') return null
  return [
    'Use the YouTube links before the first session if any exercise feels unfamiliar.',
    'Keep 1-2 reps in reserve on every set. Form quality matters more than load.',
    'Do not add extra exercises until you can recover well from the planned work.',
  ]
}

function buildNutritionNote(profile) {
  const weight = Number(profile.weight) || 70
  if (profile.goal === 'fat_loss') return `Eat in a modest calorie deficit and keep protein around ${Math.round(weight * 1.8)}-${Math.round(weight * 2.2)}g per day.`
  if (profile.goal === 'strength') return `Fuel hard sessions with enough carbs and keep protein around ${Math.round(weight * 1.8)}-${Math.round(weight * 2)}g per day.`
  return `Aim for a small surplus or maintenance calories with roughly ${Math.round(weight * 1.8)}-${Math.round(weight * 2.2)}g of protein per day.`
}

function buildRecoveryNotes(profile, readiness) {
  const notes = [
    'Use one full rest day to actually recover, not to cram in extra volume.',
    'If soreness or joint irritation spikes, reduce load before adding more sets.',
  ]
  if (profile.sleepQuality === 'poor') notes.unshift('Recovery is your limiting factor right now. Prioritize better sleep before chasing more training volume.')
  if (readiness.finalLevel === 'beginner') notes.push('Beginners adapt fast, but only if technique and recovery stay ahead of ego.')
  return notes
}

function buildDefaultFocus(dayType) {
  const labels = {
    push: 'Push - Chest - Shoulders - Triceps',
    pull: 'Pull - Lats - Upper Back - Rear Delts - Biceps',
    legs: 'Legs - Quads - Hamstrings - Glutes - Calves',
    upper: 'Upper - Press - Pull - Delts',
    lower: 'Lower - Quads - Hams - Glutes - Calves',
    full_body: 'Full Body - Strength - Skill - Balance',
    bro_split: 'Focused Muscle Day',
  }
  return labels[dayType] || 'Training Day'
}

function buildDayReason(dayType) {
  const reasons = {
    push: 'This day starts with chest compounds, then moves into shoulder work and triceps so pressing muscles are trained in a logical sequence.',
    pull: 'This day starts with lats and upper back, then finishes with rear delt and bicep work to keep pull mechanics balanced.',
    legs: 'This day starts with a squat and hinge pattern before moving to glute, hamstring, and calf work so the whole lower body is covered.',
    upper: 'This day balances pressing and pulling volume to build upper-body strength without beating up the shoulders.',
    lower: 'This day organizes lower-body work around a squat, a hinge, and focused accessory work for complete leg development.',
    full_body: 'This day gives you the most return per session by touching the main movement patterns without excess volume.',
    bro_split: 'This day isolates one region more heavily while the weekly structure protects recovery.',
  }
  return reasons[dayType] || 'This day follows a structured trainer-led order instead of random exercise selection.'
}

function estimateDuration(exercises) {
  const totalSets = exercises.reduce((sum, exercise) => sum + Number(exercise.sets || 0), 0)
  const minutes = Math.round(totalSets * 2.7 + 12)
  return `${minutes}-${minutes + 10} min`
}

function minLevel(selected, safe) {
  return LEVEL_ORDER[selected] <= LEVEL_ORDER[safe] ? selected : safe
}

function getExercisePrimaryMuscle(exercise) {
  if (!exercise) return null
  if (exercise.primaryMuscle) return exercise.primaryMuscle
  return exercise.muscles?.find((muscle) => MUSCLE_LABELS[muscle]) || exercise.muscles?.[0] || null
}

function downgradeLevel(level) {
  if (level === 'advanced') return 'intermediate'
  if (level === 'intermediate') return 'beginner'
  return 'beginner'
}

function getSlotPrimaryMuscle(slotKey) {
  const map = {
    chest_upper: 'chest',
    chest_flat: 'chest',
    chest_iso: 'chest',
    shoulder_press: 'shoulders',
    shoulder_iso: 'shoulders',
    triceps_primary: 'triceps',
    triceps_secondary: 'triceps',
    vertical_pull: 'back',
    horizontal_pull: 'back',
    back_secondary: 'back',
    rear_delt: 'rear_delts',
    biceps_primary: 'biceps',
    biceps_secondary: 'biceps',
    squat_main: 'quads',
    quad_secondary: 'quads',
    hinge_main: 'hamstrings',
    hamstring_iso: 'hamstrings',
    glute_primary: 'glutes',
    glute_secondary: 'glutes',
    calves: 'calves',
    core: 'core',
  }
  return map[slotKey]
}

function rotate(items, offset) {
  if (!items?.length) return []
  const normalized = ((offset % items.length) + items.length) % items.length
  return [...items.slice(normalized), ...items.slice(0, normalized)]
}

export { EXERCISES }
