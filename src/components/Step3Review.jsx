// src/components/Step3Review.jsx
import { Card, Badge, WarningBox, ReadinessBar, StatCard, SectionLabel } from './ui.jsx'
import { CheckCircle, AlertTriangle, XCircle, TrendingUp } from 'lucide-react'

export default function Step3Review({
  form,
  validation,
  readiness,
  onGenerate,
  isGenerating,
  disclaimerAccepted,
  onDisclaimerChange,
  onOpenLegal,
  generationError,
}) {
  const { assignedLevel, claimedLevel, readinessScore, correctionType, correctionReason } = readiness

  const levelColors = {
    beginner:     { text: 'text-emerald-600 dark:text-emerald-400', badge: 'success' },
    intermediate: { text: 'text-amber-600 dark:text-amber-400',     badge: 'warn' },
    advanced:     { text: 'text-rose-600 dark:text-rose-400',        badge: 'danger' },
  }

  const readinessColor = readinessScore >= 60 ? 'var(--accent)' : readinessScore >= 30 ? 'var(--warn)' : 'var(--danger)'

  const LEVEL_LABELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
  const GOAL_LABELS  = { fat_loss: 'Fat Loss', muscle_gain: 'Muscle Gain', strength: 'Strength', general: 'General Fitness' }
  const SPLIT_LABELS = { full_body: 'Full Body', upper_lower: 'Upper / Lower', ppl: 'Push / Pull / Legs', auto: 'Auto', bro_split: 'Bro Split' }

  const bmi = (form.weight && form.height)
    ? Number(form.weight) / Math.pow(Number(form.height) / 100, 2)
    : null
  const bmiDisplay = bmi ? bmi.toFixed(1) : null
  const bmiCategory = bmi
    ? (bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese')
    : null
  const bmiColor = bmi
    ? (bmi < 18.5 ? 'var(--warn)' : bmi < 25 ? 'var(--accent)' : bmi < 30 ? 'var(--warn)' : 'var(--danger)')
    : 'var(--text-2)'

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          Safety Review
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          The AI has analyzed your profile. Review the results before generating your plan.
        </p>
      </div>

      {/* Validation warnings */}
      {validation.warnings.length > 0 && (
        <div className="space-y-2">
          {validation.warnings.map((w, i) => (
            <WarningBox key={i} type="warn" icon="⚠️" body={w} />
          ))}
        </div>
      )}

      {/* Level Correction Card */}
      {correctionType === 'downgrade' && correctionReason && (
        <Card className="p-5 animate-scale-in" glow>
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle size={20} style={{ color: 'var(--warn)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <h3 className="font-bold text-base mb-1" style={{ color: 'var(--warn)' }}>
                Level Adjustment Applied
              </h3>
              <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                {correctionReason.summary}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--danger-faint)', border: '1px solid color-mix(in srgb, var(--danger) 20%, transparent)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>CLAIMED</p>
              <p className="font-bold" style={{ color: 'var(--danger)' }}>
                <XCircle size={12} className="inline mr-1" />
                {LEVEL_LABELS[claimedLevel]}
              </p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'var(--accent-faint)', border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-3)' }}>ASSIGNED</p>
              <p className="font-bold" style={{ color: 'var(--accent)' }}>
                <CheckCircle size={12} className="inline mr-1" />
                {LEVEL_LABELS[assignedLevel]}
              </p>
            </div>
          </div>

          <p className="text-sm mb-3" style={{ color: 'var(--text-2)' }}>
            {correctionReason.detail}
          </p>

          <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={13} style={{ color: 'var(--accent)' }} />
              <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>PROGRESSION PATH</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-2)' }}>{correctionReason.progression}</p>
          </div>
        </Card>
      )}

      {correctionType === 'accept' && (
        <WarningBox
          type="success"
          icon="✅"
          title="Level Verified"
          body={`Your claimed level (${LEVEL_LABELS[claimedLevel]}) matches your profile. No adjustment needed.`}
        />
      )}

      {/* Readiness Score */}
      <Card className="p-5">
        <SectionLabel>Readiness Score</SectionLabel>
        <ReadinessBar score={readinessScore} label="Overall Training Readiness" color={readinessColor} />
        <p className="text-xs mt-3" style={{ color: 'var(--text-3)' }}>
          Score based on training history, frequency, activity level, recovery, equipment, and injury status.
          Score ≥ 60 = Advanced ready. 30–59 = Intermediate. &lt; 30 = Beginner.
        </p>
      </Card>

      {/* Profile Summary */}
      <Card className="p-5">
        <SectionLabel>Profile Summary</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Goal"     value={GOAL_LABELS[form.goal] || '—'}         icon="🎯" />
          <StatCard label="Level"    value={LEVEL_LABELS[assignedLevel] || '—'}     icon="📊" color={readinessColor} />
          <StatCard label="Days/Wk"  value={`${form.daysPerWeek} days`}              icon="📅" />
          <StatCard label="Location" value={form.location === 'gym' ? 'Gym' : 'Home'} icon={form.location === 'gym' ? '🏋️' : '🏠'} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <StatCard label="Age"      value={`${form.age} yrs`}    icon="👤" color="var(--text-2)" />
          <StatCard label="Weight"   value={`${form.weight} kg`}  icon="⚖️" color="var(--text-2)" />
          <StatCard label="History"  value={form.trainingHistoryMonths ? `${form.trainingHistoryMonths}m` : 'None'} icon="🕐" color="var(--text-2)" />
          <StatCard label="Sleep"    value={form.sleepQuality || '—'} icon="😴" color="var(--text-2)" />
        </div>
        {bmiDisplay && (
          <div
            className="mt-3 rounded-xl p-3 flex items-center gap-3"
            style={{ background: 'color-mix(in srgb, var(--surface-2) 60%, transparent)', border: '1px solid var(--border)' }}
          >
            <span className="text-2xl">📏</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>BMI (Body Mass Index)</p>
              <p className="font-bold text-lg" style={{ color: bmiColor }}>
                {bmiDisplay}
                <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-3)' }}>— {bmiCategory}</span>
              </p>
            </div>
            <p className="text-xs ml-auto text-right" style={{ color: 'var(--text-3)', maxWidth: 140 }}>
              Used by AI to calibrate volume, intensity &amp; nutrition guidance.
            </p>
          </div>
        )}
      </Card>

      {/* Injuries detected */}
      {form.injuriesText && (
        <Card className="p-4">
          <SectionLabel>Injury Safety Filter Active</SectionLabel>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>
            Exercises that conflict with your noted limitations will be automatically excluded or substituted.
          </p>
          <p className="text-xs mt-2 italic" style={{ color: 'var(--text-3)' }}>
            "{form.injuriesText}"
          </p>
        </Card>
      )}

      {/* Generate button */}
      <div className="pt-2">
        {generationError && (
          <WarningBox
            type="danger"
            icon={<XCircle size={16} />}
            title="Plan generation failed"
            body={generationError}
            className="mb-4"
          />
        )}

        <WarningBox
          type="warn"
          icon={<AlertTriangle size={16} />}
          title="Safety disclaimer"
          body="This plan is general fitness guidance, not medical advice. Stop if you feel sharp pain, dizziness, chest pain, or unusual symptoms, and speak with a qualified medical professional."
          className="mb-4"
        />

        <label
          className="flex items-start gap-3 rounded-2xl border p-4 mb-4 cursor-pointer"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <input
            type="checkbox"
            checked={!!disclaimerAccepted}
            onChange={(event) => onDisclaimerChange?.(event.target.checked)}
            className="mt-1 h-5 w-5 accent-[var(--accent)]"
          />
          <span className="text-sm leading-6" style={{ color: 'var(--text-2)' }}>
            I understand this is not medical advice and I will train within my ability, use proper form, and review the{' '}
            <button
              type="button"
              className="font-semibold"
              style={{ color: 'var(--accent)' }}
              onClick={(event) => {
                event.preventDefault()
                onOpenLegal?.('terms')
              }}
            >
              Terms & Safety
            </button>
            {' '}and{' '}
            <button
              type="button"
              className="font-semibold"
              style={{ color: 'var(--accent)' }}
              onClick={(event) => {
                event.preventDefault()
                onOpenLegal?.('privacy')
              }}
            >
              Privacy Policy
            </button>
            .
          </span>
        </label>

        <button
          className="btn-primary w-full text-base py-4"
          onClick={onGenerate}
          disabled={isGenerating || !disclaimerAccepted}
          style={{ fontSize: 16, animation: !isGenerating && disclaimerAccepted ? 'pulseGlow 2.5s ease-in-out 0.5s infinite' : undefined }}
        >
          {isGenerating ? (
            <>
              <div style={{ width: 20, height: 20, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Building Your Plan...
            </>
          ) : (
            '🚀 Generate My Safe Workout Plan'
          )}
        </button>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-3)' }}>
          {disclaimerAccepted
            ? `Your personalized, safety-verified ${LEVEL_LABELS[assignedLevel].toLowerCase()} plan will appear instantly.`
            : 'Please confirm the safety disclaimer to generate your plan.'}
        </p>
      </div>
    </div>
  )
}
