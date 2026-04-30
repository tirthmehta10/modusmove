// Maps free-exercise-db format → ModusMove exercise format

const MUSCLE_MAP = {
  abdominals: 'core',
  abductors: 'glutes',
  adductors: 'quads',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'back',
  'lower back': 'lower_back',
  'middle back': 'back',
  neck: 'neck',
  quadriceps: 'quads',
  shoulders: 'shoulders',
  traps: 'traps',
  triceps: 'triceps',
}

const EQUIPMENT_MAP = {
  'body only': ['none'],
  dumbbell: ['dumbbells'],
  barbell: ['full_gym'],
  cable: ['full_gym'],
  machine: ['full_gym'],
  kettlebells: ['dumbbells'],
  bands: ['bands'],
  'e-z curl bar': ['full_gym'],
  'medicine ball': ['none'],
  'exercise ball': ['none'],
  'foam roll': ['none'],
  other: ['none'],
  bench: ['bench'],
  'pull-up bar': ['pullup_bar'],
}

const IMAGE_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/'

const LEVEL_MAP = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  expert: 'advanced',
  advanced: 'advanced',
}

function mapMuscles(arr) {
  if (!arr) return []
  return [...new Set(arr.map((m) => MUSCLE_MAP[m]).filter(Boolean))]
}

function mapEquipment(eq) {
  return EQUIPMENT_MAP[eq] || ['none']
}

function detectLocation(equipment) {
  if (equipment.includes('full_gym')) return ['gym']
  return ['home', 'gym']
}

function detectCategory(ex) {
  const cat = ex.category
  if (cat === 'cardio' || cat === 'plyometrics') return 'cardio'
  if (cat === 'stretching') return 'mobility'

  const primary = ex.primaryMuscles || []
  const pushMuscles = ['chest', 'shoulders', 'triceps']
  const pullMuscles = ['lats', 'middle back', 'lower back', 'biceps', 'traps', 'forearms']
  const legMuscles = ['quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors']
  const coreMuscles = ['abdominals']

  const scores = {
    push: primary.filter((m) => pushMuscles.includes(m)).length,
    pull: primary.filter((m) => pullMuscles.includes(m)).length,
    legs: primary.filter((m) => legMuscles.includes(m)).length,
    core: primary.filter((m) => coreMuscles.includes(m)).length,
  }

  const max = Math.max(...Object.values(scores))
  if (max === 0) return 'push'
  return Object.entries(scores).find(([, v]) => v === max)?.[0] || 'push'
}

function detectPattern(ex) {
  const primary = ex.primaryMuscles || []
  const secondary = ex.secondaryMuscles || []
  const allMuscles = [...primary, ...secondary]
  const force = ex.force
  const cat = ex.category
  const mechanic = ex.mechanic
  const name = (ex.name || '').toLowerCase()

  if (cat === 'cardio' || cat === 'plyometrics') return 'cardio'
  if (cat === 'stretching') return 'mobility'

  const hasChest = primary.includes('chest')
  const hasShoulders = primary.includes('shoulders')
  const hasTriceps = primary.includes('triceps')
  const hasLats = primary.includes('lats')
  const hasBack = primary.includes('middle back') || primary.includes('lower back')
  const hasBiceps = primary.includes('biceps')
  const hasQuads = primary.includes('quadriceps')
  const hasGlutes = primary.includes('glutes')
  const hasHams = primary.includes('hamstrings')
  const hasCore = primary.includes('abdominals')
  const hasCalves = primary.includes('calves')
  const hasRearDeltCue =
    name.includes('rear delt') ||
    name.includes('reverse fly') ||
    name.includes('reverse flye') ||
    name.includes('face pull')
  const hasShoulderIsolationCue =
    name.includes('lateral raise') ||
    name.includes('front raise') ||
    name.includes('deltoid raise') ||
    name.includes('shoulder raise')
  const hasLungeCue = name.includes('lunge') || name.includes('step up') || name.includes('split squat')

  if (force === 'push') {
    if (hasChest) return mechanic === 'isolation' ? 'chest_isolation' : 'horizontal_push'
    if (hasRearDeltCue) return 'rear_delt'
    if (hasShoulders) return mechanic === 'isolation' || hasShoulderIsolationCue ? 'shoulder_isolation' : 'vertical_push'
    if (hasQuads) return hasLungeCue ? 'lunge' : 'squat'
    if (hasTriceps) return 'triceps_isolation'
    return 'horizontal_push'
  }

  if (force === 'pull') {
    if (hasLats) return 'vertical_pull'
    if (hasBack) return 'horizontal_pull'
    if (hasBiceps) return 'elbow_flexion'
    if (hasHams) return 'knee_flexion'
    if (hasGlutes) return 'glute_isolation'
    return 'horizontal_pull'
  }

  if (force === 'static') {
    if (hasCore) return 'isometric'
    return 'anti_extension'
  }

  if (hasRearDeltCue || (allMuscles.includes('shoulders') && name.includes('rear'))) return 'rear_delt'
  if (hasShoulders && (mechanic === 'isolation' || hasShoulderIsolationCue)) return 'shoulder_isolation'
  if (hasQuads && !hasGlutes) return hasLungeCue ? 'lunge' : mechanic === 'compound' ? 'squat' : 'knee_extension'
  if (hasGlutes || hasHams) return 'hip_hinge'
  if (hasCalves) return 'calf_isolation'
  if (hasCore) return 'core_flexion'
  if (hasLats) return 'vertical_pull'
  if (hasChest) return mechanic === 'isolation' ? 'chest_isolation' : 'horizontal_push'
  if (hasShoulders) return 'vertical_push'
  if (hasBiceps) return 'elbow_flexion'
  if (hasTriceps) return 'triceps_isolation'

  return mechanic === 'compound' ? 'compound' : 'isolation'
}

function detectGoals(ex) {
  if (ex.category === 'cardio' || ex.category === 'stretching') return ['fat_loss', 'general']
  if (['powerlifting', 'strongman', 'olympic weightlifting'].includes(ex.category)) return ['strength']
  if (ex.mechanic === 'compound') return ['muscle_gain', 'strength']
  return ['muscle_gain', 'general']
}

function detectInjuryCaution(ex) {
  const cautions = []
  const all = [...(ex.primaryMuscles || []), ...(ex.secondaryMuscles || [])]
  if (all.includes('shoulders') && ex.force === 'push') cautions.push('shoulder')
  if (all.includes('lower back')) cautions.push('lower_back')
  if (
    (all.includes('quadriceps') || all.includes('hamstrings')) &&
    ['barbell', 'machine'].includes(ex.equipment)
  ) cautions.push('knee')
  return [...new Set(cautions)]
}

function assignVolume(ex) {
  if (ex.category === 'cardio') {
    return {
      sets: { beginner: 3, intermediate: 3, advanced: 4 },
      reps: { beginner: '30s', intermediate: '45s', advanced: '60s' },
      rest: { beginner: '60s', intermediate: '45s', advanced: '30s' },
    }
  }
  if (ex.category === 'stretching') {
    return {
      sets: { beginner: 1, intermediate: 1, advanced: 1 },
      reps: { beginner: '30s', intermediate: '45s', advanced: '60s' },
      rest: { beginner: '0', intermediate: '0', advanced: '0' },
    }
  }
  if (['powerlifting', 'olympic weightlifting', 'strongman'].includes(ex.category)) {
    return {
      sets: { beginner: 3, intermediate: 4, advanced: 5 },
      reps: { beginner: '5', intermediate: '3-5', advanced: '1-3' },
      rest: { beginner: '180s', intermediate: '180s', advanced: '240s' },
    }
  }
  if (ex.mechanic === 'compound') {
    return {
      sets: { beginner: 3, intermediate: 4, advanced: 5 },
      reps: { beginner: '8-10', intermediate: '6-10', advanced: '4-8' },
      rest: { beginner: '120s', intermediate: '90s', advanced: '120s' },
    }
  }
  return {
    sets: { beginner: 3, intermediate: 3, advanced: 4 },
    reps: { beginner: '12-15', intermediate: '12-15', advanced: '15-20' },
    rest: { beginner: '60s', intermediate: '45s', advanced: '30s' },
  }
}

export function mapFreeExerciseDB(ex) {
  const equipment = mapEquipment(ex.equipment)
  const location = detectLocation(equipment)
  const muscles = mapMuscles(ex.primaryMuscles)
  const secondaryMuscles = mapMuscles(ex.secondaryMuscles)
  const volume = assignVolume(ex)
  const firstImage = ex.images?.[0]
  const imageUrls = Array.isArray(ex.images)
    ? ex.images.map((image) => IMAGE_BASE + image)
    : []
  const searchName = encodeURIComponent(ex.name + ' exercise form tutorial')

  return {
    id: 'fdb_' + ex.id.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    name: ex.name,
    category: detectCategory(ex),
    muscles: muscles.length > 0 ? muscles : ['core'],
    secondaryMuscles,
    level: LEVEL_MAP[ex.level] || 'beginner',
    equipment,
    location,
    goals: detectGoals(ex),
    pattern: detectPattern(ex),
    injuryCaution: detectInjuryCaution(ex),
    tips: ex.instructions?.slice(0, 2).join(' ') || '',
    substitutes: [],
    demo: `https://www.youtube.com/results?search_query=${searchName}`,
    thumbnail: firstImage ? IMAGE_BASE + firstImage : null,
    images: imageUrls,
    sourceId: ex.id,
    ...volume,
    _source: 'free-exercise-db',
  }
}
