export function validateProfile(form) {
  const errors = {}

  const age = Number(form.age)
  if (!form.age || Number.isNaN(age)) errors.age = 'Age is required'
  else if (age < 16) errors.age = 'ModusMove is designed for ages 16+. Younger athletes should work with a coach.'
  else if (age > 80) errors.age = 'Please enter age between 16 and 80'

  const weight = Number(form.weight)
  if (!form.weight || Number.isNaN(weight)) errors.weight = 'Weight is required'
  else if (weight < 30 || weight > 300) errors.weight = 'Please enter weight between 30-300 kg'

  const height = Number(form.height)
  if (!form.height || Number.isNaN(height)) errors.height = 'Height is required'
  else if (height < 100 || height > 250) errors.height = 'Please enter height in cm (100-250)'

  const days = Number(form.daysPerWeek)
  if (!form.daysPerWeek || Number.isNaN(days)) errors.daysPerWeek = 'Days per week is required'
  else if (days < 2 || days > 7) errors.daysPerWeek = 'Choose between 2 and 7 days'

  if (!form.gender) errors.gender = 'Select your gender'
  if (!form.activityLevel) errors.activityLevel = 'Select your daily activity level'
  if (!form.sleepQuality) errors.sleepQuality = 'Select your sleep quality'
  if (!form.goal) errors.goal = 'Select a fitness goal'
  if (!form.claimedLevel) errors.level = 'Select your experience level'

  const warnings = []

  if (Number(form.daysPerWeek) >= 6 && form.claimedLevel === 'beginner') {
    warnings.push('6-7 days/week is very high for a beginner. The AI trainer may recommend fewer days to protect recovery.')
  }

  if (form.claimedLevel === 'advanced' && Number(form.trainingHistoryMonths || 0) < 12) {
    warnings.push('Advanced level typically requires 12+ months of consistent training. The safety engine will assess your readiness.')
  }

  return { errors, warnings, isValid: Object.keys(errors).length === 0 }
}

export function sanitizeProfile(form) {
  return {
    ...form,
    age: Number(form.age),
    weight: Number(form.weight),
    height: Number(form.height),
    daysPerWeek: Number(form.daysPerWeek),
    trainingHistoryMonths: Number(form.trainingHistoryMonths || 0),
    location: 'gym',
    equipment: ['full_gym'],
  }
}
