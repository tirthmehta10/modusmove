// src/components/Step1Profile.jsx
import { useState } from 'react'
import { SectionLabel, WarningBox, UnitToggle } from './ui.jsx'

// ── Constants ─────────────────────────────────────────────────────────────────
const GENDERS = [
  { value: 'male',   label: 'Male',   emoji: '♂' },
  { value: 'female', label: 'Female', emoji: '♀' },
  { value: 'other',  label: 'Other',  emoji: '⚥' },
]

const ACTIVITY_LEVELS = [
  { value: 'sedentary',   label: 'Sedentary',        sub: 'Desk job, little movement outside',       icon: '🪑' },
  { value: 'light',       label: 'Lightly Active',   sub: 'Light walks, on feet sometimes',          icon: '🚶' },
  { value: 'moderate',    label: 'Moderately Active',sub: 'Regular movement, casual exercise',        icon: '🏃' },
  { value: 'active',      label: 'Active',           sub: 'Exercise 3–4x/week consistently',         icon: '🏋️' },
  { value: 'very_active', label: 'Very Active',      sub: 'Physical job or daily intense training',  icon: '🔥' },
]

const SLEEP_LEVELS = [
  { value: 'poor',      label: 'Poor',      emoji: '😴', sub: '< 5 hrs or restless' },
  { value: 'fair',      label: 'Fair',      emoji: '😐', sub: '5–6 hrs, okay quality' },
  { value: 'good',      label: 'Good',      emoji: '🙂', sub: '7–8 hrs most nights' },
  { value: 'excellent', label: 'Excellent', emoji: '😁', sub: '8+ hrs, consistent' },
]

// ── Unit conversion helpers ───────────────────────────────────────────────────
const round1 = n => Math.round(n * 10) / 10
const kgToLbs = kg => round1(parseFloat(kg) * 2.2046)
const lbsToKg = lbs => round1(parseFloat(lbs) / 2.2046)
const cmToIn  = cm  => Math.round(parseFloat(cm) / 2.54)
const inToCm  = i   => Math.round(parseFloat(i) * 2.54)

// ── SelectCard — reusable interactive option card ────────────────────────────
function SelectCard({ selected, onClick, children, center = false, horizontal = false, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-2xl border-2 transition-all duration-200 w-full text-left ${
        center    ? 'text-center p-4' :
        horizontal ? 'flex items-center gap-3 px-4 py-3' :
                    'p-4'
      } ${className}`}
      style={{
        borderColor: selected ? 'var(--accent)' : 'var(--border)',
        background:  selected ? 'var(--accent-faint)' : 'var(--surface)',
        boxShadow:   selected
          ? '0 0 0 3px color-mix(in srgb,var(--accent) 14%,transparent), 0 4px 12px color-mix(in srgb,var(--accent) 8%,transparent)'
          : '0 1px 4px rgba(0,0,0,0.04)',
        transform: selected ? 'translateY(-2px)' : undefined,
      }}
    >
      {/* Checkmark badge */}
      {selected && (
        <span
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'var(--accent)' }}
          aria-hidden="true"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5 5-5" stroke="#fff" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      {children}
    </button>
  )
}

// ── NumberInput — input with inline unit label ────────────────────────────────
function NumberInput({ label, unitToggle, value, onChange, placeholder, min, max, error, hint, icon }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold flex items-center gap-1.5"
               style={{ color: 'var(--text-2)' }}>
          <span>{icon}</span> {label}
        </label>
        {unitToggle}
      </div>
      <div className="relative">
        <input
          type="number"
          className="num-input"
          style={{ paddingRight: 52 }}
          placeholder={placeholder}
          value={value}
          min={min}
          max={max}
          onChange={e => onChange(e.target.value)}
        />
        {/* Unit label overlay */}
        <span
          className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold pointer-events-none select-none"
          style={{ color: 'var(--accent)' }}
        >
          {unitToggle?.props?.value ?? ''}
        </span>
      </div>
      {hint && !error && (
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-3)' }}>{hint}</p>
      )}
      {error && (
        <p className="text-xs mt-1.5 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
          <span>⚠</span>{error}
        </p>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Step1Profile({ form, onChange, errors }) {
  // Unit preferences live in local state — form always stores metric values
  const [weightUnit, setWeightUnit] = useState('kg')
  const [heightUnit, setHeightUnit] = useState('cm')

  function set(key, val) {
    onChange({ ...form, [key]: val })
  }

  // ── Displayed values (converted from stored metric) ───────────────────────
  const displayWeight = form.weight !== ''
    ? (weightUnit === 'kg' ? form.weight : (isNaN(parseFloat(form.weight)) ? '' : kgToLbs(form.weight)))
    : ''

  const displayHeight = form.height !== ''
    ? (heightUnit === 'cm' ? form.height : (isNaN(parseFloat(form.height)) ? '' : cmToIn(form.height)))
    : ''

  // ── Input handlers — always store metric internally ───────────────────────
  function handleWeightChange(val) {
    if (val === '' || val === undefined) { set('weight', ''); return }
    const n = parseFloat(val)
    if (isNaN(n)) { set('weight', ''); return }
    set('weight', weightUnit === 'kg' ? val : round1(lbsToKg(n)))
  }

  function handleHeightChange(val) {
    if (val === '' || val === undefined) { set('height', ''); return }
    const n = parseFloat(val)
    if (isNaN(n)) { set('height', ''); return }
    set('height', heightUnit === 'cm' ? val : inToCm(n))
  }

  // ── When unit changes, displayed value auto-converts (stored value unchanged)
  function switchWeightUnit(newUnit) {
    setWeightUnit(newUnit)
  }
  function switchHeightUnit(newUnit) {
    setHeightUnit(newUnit)
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          Tell us about yourself
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
          Used for safety analysis and plan personalization. Your data is saved only in this browser so you can resume later.
        </p>
      </div>

      {/* ── BASIC MEASUREMENTS ───────────────────────────────────────────── */}
      <div>
        <SectionLabel>Basic Information</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Age */}
          <NumberInput
            label="Age"
            icon="🎂"
            placeholder="e.g. 28"
            value={form.age}
            min={12}
            max={100}
            onChange={val => set('age', val)}
            error={errors.age}
            hint="Years old — used for age-based safety caps"
          />

          {/* Training History */}
          <NumberInput
            label="Training History"
            icon="🕐"
            placeholder="e.g. 6  (0 = none)"
            value={form.trainingHistoryMonths}
            min={0}
            max={240}
            onChange={val => set('trainingHistoryMonths', val)}
            hint="Months of consistent training (0 = never trained)"
          />

          {/* Weight with unit toggle */}
          <NumberInput
            label="Weight"
            icon="⚖️"
            placeholder={weightUnit === 'kg' ? 'e.g. 75' : 'e.g. 165'}
            value={displayWeight}
            min={weightUnit === 'kg' ? 30 : 66}
            max={weightUnit === 'kg' ? 300 : 660}
            onChange={handleWeightChange}
            error={errors.weight}
            unitToggle={
              <UnitToggle
                options={['kg', 'lbs']}
                value={weightUnit}
                onChange={switchWeightUnit}
              />
            }
          />

          {/* Height with unit toggle */}
          <NumberInput
            label="Height"
            icon="📏"
            placeholder={heightUnit === 'cm' ? 'e.g. 175' : 'e.g. 69'}
            value={displayHeight}
            min={heightUnit === 'cm' ? 100 : 39}
            max={heightUnit === 'cm' ? 250 : 98}
            onChange={handleHeightChange}
            error={errors.height}
            hint={heightUnit === 'in' ? '69 in ≈ 5\'9" — enter total inches' : undefined}
            unitToggle={
              <UnitToggle
                options={['cm', 'in']}
                value={heightUnit}
                onChange={switchHeightUnit}
              />
            }
          />
        </div>
      </div>

      {/* ── GENDER ───────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Gender</SectionLabel>
        <div className="grid grid-cols-3 gap-3">
          {GENDERS.map(g => (
            <SelectCard
              key={g.value}
              selected={form.gender === g.value}
              onClick={() => set('gender', g.value)}
              center
            >
              <div className="text-2xl mb-1">{g.emoji}</div>
              <div className="text-sm font-bold"
                   style={{ color: form.gender === g.value ? 'var(--accent)' : 'var(--text)' }}>
                {g.label}
              </div>
            </SelectCard>
          ))}
        </div>
        {errors.gender && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
            <span>⚠</span>{errors.gender}
          </p>
        )}
      </div>

      {/* ── ACTIVITY LEVEL ───────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Daily Activity Level <span style={{ color: 'var(--text-3)', fontWeight: 400 }}>(outside training)</span></SectionLabel>
        <div className="space-y-2">
          {ACTIVITY_LEVELS.map(a => (
            <SelectCard
              key={a.value}
              selected={form.activityLevel === a.value}
              onClick={() => set('activityLevel', a.value)}
              horizontal
            >
              <span className="text-xl flex-shrink-0">{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold"
                     style={{ color: form.activityLevel === a.value ? 'var(--accent)' : 'var(--text)' }}>
                  {a.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{a.sub}</div>
              </div>
            </SelectCard>
          ))}
        </div>
        {errors.activityLevel && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
            <span>âš </span>{errors.activityLevel}
          </p>
        )}
      </div>

      {/* ── SLEEP QUALITY ────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Sleep Quality & Recovery</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SLEEP_LEVELS.map(s => (
            <SelectCard
              key={s.value}
              selected={form.sleepQuality === s.value}
              onClick={() => set('sleepQuality', s.value)}
              center
            >
              <div className="text-3xl mb-1.5">{s.emoji}</div>
              <div className="text-sm font-bold"
                   style={{ color: form.sleepQuality === s.value ? 'var(--accent)' : 'var(--text)' }}>
                {s.label}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.sub}</div>
            </SelectCard>
          ))}
        </div>
        {errors.sleepQuality && (
          <p className="text-xs mt-2 flex items-center gap-1" style={{ color: 'var(--danger)' }}>
            <span>âš </span>{errors.sleepQuality}
          </p>
        )}
      </div>

      {/* ── INJURIES ─────────────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Injuries / Physical Limitations</SectionLabel>
        <textarea
          className="text-input min-h-[88px]"
          placeholder="e.g. Left knee pain, lower back stiffness... (leave blank if none)"
          value={form.injuriesText}
          onChange={e => set('injuriesText', e.target.value)}
          rows={3}
        />
        <div className="flex items-start gap-2 mt-2">
          <span className="text-sm flex-shrink-0">🛡️</span>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
            Exercises that aggravate detected injuries are automatically excluded or substituted.
            Parsed keywords: knee, shoulder, back, ankle, wrist.
          </p>
        </div>
      </div>

      {/* ── PRIVACY NOTE ─────────────────────────────────────────────────── */}
      <WarningBox
        type="info"
        icon="🔒"
        title="Private by default - saved only in your browser"
        body="Your profile and plan stay in this browser's local storage and are not sent to a backend in this version. ModusMove is not a substitute for medical advice - consult a doctor before starting any program if you have health conditions."
      />
    </div>
  )
}
