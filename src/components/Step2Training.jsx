import { useEffect, useRef } from 'react'
import { SectionLabel, WarningBox } from './ui.jsx'

const GOALS = [
  { value: 'fat_loss', icon: '🔥', label: 'Fat Loss', sub: 'Preserve muscle while reducing body fat' },
  { value: 'muscle_gain', icon: '💪', label: 'Muscle Gain', sub: 'Build size with progressive overload' },
  { value: 'strength', icon: '🏋️', label: 'Strength', sub: 'Prioritize compound lift performance' },
  { value: 'general', icon: '⚡', label: 'General Fitness', sub: 'Balanced strength, mobility, and conditioning' },
]

const LEVELS = [
  { value: 'beginner', icon: '🌱', label: 'Beginner', sub: 'Less than 6 months consistent training' },
  { value: 'intermediate', icon: '📈', label: 'Intermediate', sub: '6 months to 2 years consistent training' },
  { value: 'advanced', icon: '🏆', label: 'Advanced', sub: '2+ years structured training' },
]

const SPLITS = [
  { value: 'auto', icon: '🤖', label: 'AI Decides', sub: 'Let OpenAI choose the best split' },
  { value: 'full_body', icon: '🔁', label: 'Full Body', sub: 'All major muscle groups each session' },
  { value: 'upper_lower', icon: '↕️', label: 'Upper / Lower', sub: 'Alternating upper and lower days' },
  { value: 'ppl', icon: '📅', label: 'Push / Pull / Legs', sub: 'Classic gym split' },
  { value: 'bro_split', icon: '🎯', label: 'Bro Split', sub: 'Body-part focused training' },
]

function suggestTrainingDays(form) {
  const months = Number(form.trainingHistoryMonths) || 0
  const activity = form.activityLevel || ''
  const sleep = form.sleepQuality || ''
  const goal = form.goal || ''

  let base = months < 3 ? 2 : months < 12 ? 3 : months < 24 ? 4 : 5
  if (['active', 'very_active'].includes(activity)) base = Math.min(base + 1, 5)
  if (activity === 'sedentary') base = Math.max(base - 1, 2)
  if (sleep === 'poor') base = Math.max(base - 1, 2)
  if (sleep === 'excellent') base = Math.min(base + 1, 5)
  if (goal === 'strength') base = Math.min(base, 4)
  if (goal === 'fat_loss') base = Math.max(base, 3)

  return Math.min(Math.max(base, 2), 5)
}

export default function Step2Training({ form, onChange, errors }) {
  const daysVal = Number(form.daysPerWeek) || 4
  const suggestedDays = suggestTrainingDays(form)
  const autoApplied = useRef(false)

  function set(key, val) {
    onChange({
      ...form,
      [key]: val,
      location: 'gym',
      equipment: ['full_gym'],
    })
  }

  // Auto-set the slider to the suggested days on first render.
  // Requires at least activityLevel + sleepQuality from Step 1.
  useEffect(() => {
    if (autoApplied.current) return
    if (!form.activityLevel || !form.sleepQuality) return
    autoApplied.current = true
    set('daysPerWeek', suggestedDays)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          Training Setup
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          ModusMove v1 is gym-only. We assume full commercial gym access and let OpenAI make the final plan decision.
        </p>
      </div>

      <div>
        <SectionLabel>Primary Fitness Goal</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {GOALS.map((goal) => {
            const selected = form.goal === goal.value
            return (
              <button
                key={goal.value}
                type="button"
                onClick={() => set('goal', goal.value)}
                className="relative rounded-2xl border-2 p-4 text-left transition-all duration-200 w-full"
                style={{
                  borderColor: selected ? 'var(--accent)' : 'var(--border)',
                  background: selected ? 'var(--accent-faint)' : 'var(--surface)',
                }}
              >
                <div className="font-bold text-sm flex items-center gap-2" style={{ color: selected ? 'var(--accent)' : 'var(--text)' }}>
                  <span aria-hidden="true">{goal.icon}</span>
                  <span>{goal.label}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{goal.sub}</div>
              </button>
            )
          })}
        </div>
        {errors.goal && <ErrorText>{errors.goal}</ErrorText>}
      </div>

      <div>
        <SectionLabel>Self-Assessed Experience Level</SectionLabel>
        <WarningBox
          type="warn"
          body="The safety engine may downgrade this level based on training history, sleep, activity, and injuries. It never upgrades your level."
          className="mb-3"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LEVELS.map((level) => {
            const selected = form.claimedLevel === level.value
            return (
              <button
                key={level.value}
                type="button"
                onClick={() => set('claimedLevel', level.value)}
                className="rounded-2xl border-2 p-4 text-left transition-all duration-200 w-full"
                style={{
                  borderColor: selected ? 'var(--accent)' : 'var(--border)',
                  background: selected ? 'var(--accent-faint)' : 'var(--surface)',
                }}
              >
                <div className="font-bold text-sm flex items-center gap-2" style={{ color: selected ? 'var(--accent)' : 'var(--text)' }}>
                  <span aria-hidden="true">{level.icon}</span>
                  <span>{level.label}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{level.sub}</div>
              </button>
            )
          })}
        </div>
        {errors.level && <ErrorText>{errors.level}</ErrorText>}
      </div>

      <div>
        <SectionLabel>Gym Availability</SectionLabel>
        {form.activityLevel && form.sleepQuality && (
          <button
            type="button"
            onClick={() => set('daysPerWeek', suggestedDays)}
            className="w-full flex items-center justify-between rounded-xl px-4 py-3 mb-3 text-left transition-all duration-200"
            style={{
              background: 'color-mix(in srgb, var(--accent) 8%, transparent)',
              border: '1.5px dashed color-mix(in srgb, var(--accent) 35%, transparent)',
            }}
          >
            <div>
              <p className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--accent)' }}>
                <span aria-hidden="true">💡</span>
                <span>Based on your profile</span>
              </p>
              <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text)' }}>
                Pre-set to {suggestedDays} days/week based on your experience and recovery.
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                Adjust the slider below if needed. OpenAI makes the final call.
              </p>
            </div>
            <div className="text-3xl font-black ml-4" style={{ color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>
              {suggestedDays}
            </div>
          </button>
        )}

        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--surface)', border: '1.5px solid var(--border)' }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                How many days can you make it to the gym?
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                The AI may recommend fewer days based on your recovery profile.
              </p>
            </div>
            <div className="flex items-end gap-2">
              <span className="font-mono font-black text-4xl" style={{ color: 'var(--accent)' }}>{daysVal}</span>
              <span className="text-sm pb-1" style={{ color: 'var(--text-3)' }}>days</span>
            </div>
          </div>

          <input
            type="range"
            min="2"
            max="7"
            value={daysVal}
            onChange={(event) => set('daysPerWeek', event.target.value)}
            aria-label="Available gym days per week"
            style={{
              background: `linear-gradient(to right, var(--accent) ${(daysVal - 2) / 5 * 100}%, var(--border) ${(daysVal - 2) / 5 * 100}%)`,
            }}
          />

          <div className="flex justify-between">
            {[2, 3, 4, 5, 6, 7].map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => set('daysPerWeek', day)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-150"
                style={{
                  background: day === daysVal ? 'var(--accent)' : 'var(--surface-2)',
                  color: day === daysVal ? '#fff' : 'var(--text-3)',
                  border: day === daysVal ? '2px solid var(--accent)' : '2px solid var(--border)',
                }}
              >
                {day}
              </button>
            ))}
          </div>

          {daysVal >= 6 && (
            <WarningBox
              type="warn"
              body={`${daysVal} days/week is your maximum availability, not a target. OpenAI may reduce it if recovery does not support it.`}
            />
          )}
        </div>
        {errors.daysPerWeek && <ErrorText>{errors.daysPerWeek}</ErrorText>}
      </div>

      <div>
        <SectionLabel>Preferred Training Split</SectionLabel>
        <p className="text-xs mb-3" style={{ color: 'var(--text-3)' }}>
          AI Decides is recommended. Your preference is a signal, not a command.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SPLITS.map((split) => {
            const selected = form.preferredSplit === split.value
            return (
              <button
                key={split.value}
                type="button"
                onClick={() => set('preferredSplit', split.value)}
                className="rounded-xl border-2 p-3.5 text-left transition-all duration-200 w-full"
                style={{
                  borderColor: selected ? 'var(--accent)' : 'var(--border)',
                  background: selected ? 'var(--accent-faint)' : 'var(--surface)',
                }}
              >
                <div className="font-semibold text-sm flex items-center gap-2" style={{ color: selected ? 'var(--accent)' : 'var(--text)' }}>
                  <span aria-hidden="true">{split.icon}</span>
                  <span>{split.label}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{split.sub}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ErrorText({ children }) {
  return (
    <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
      <span>!</span>{children}
    </p>
  )
}
