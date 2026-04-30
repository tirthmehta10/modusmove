import { Brain, Dumbbell, Shield, Zap } from 'lucide-react'

const FEATURES = [
  { icon: <Shield size={18} />, label: 'Safety-First Engine', desc: 'Overrides unsafe level selections automatically.' },
  { icon: <Brain size={18} />, label: 'Smart Readiness AI', desc: 'Infers true training level from your full profile.' },
  { icon: <Dumbbell size={18} />, label: 'Gym & Home Plans', desc: 'Adapts to your equipment and environment.' },
  { icon: <Zap size={18} />, label: 'Coach-Style Structure', desc: 'Builds push, pull, and leg days with better training logic.' },
]

const TEST_CASES = [
  { scenario: 'Beginner selects Advanced', result: 'Auto-downgraded to Beginner', type: 'danger' },
  { scenario: 'Knee pain + risky movement', result: 'Removed, safer alternative given', type: 'warn' },
  { scenario: 'Home user + gym-only exercise', result: 'Auto-substituted to home setup', type: 'warn' },
  { scenario: 'Recovered advanced lifter', result: 'Higher-volume split unlocked', type: 'success' },
]

export default function Hero({ onStart, onResume, hasSavedPlan, onOpenLegal }) {
  return (
    <div className="space-y-12">
      <div className="text-center pt-10 pb-4 space-y-6">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold animate-slide-up"
          style={{
            background: 'var(--accent-faint)',
            borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
            color: 'var(--accent)',
          }}
        >
          <Shield size={14} />
          Safety-First AI Workout Planner
        </div>

        <h1
          className="text-4xl sm:text-6xl font-bold leading-tight animate-slide-up delay-100"
          style={{ color: 'var(--text)', fontFamily: 'DM Sans, system-ui, sans-serif' }}
        >
          The Workout Planner
          <br />
          <span className="gradient-text">That Protects You</span>
        </h1>

        <p
          className="text-lg max-w-xl mx-auto leading-relaxed animate-slide-up delay-200"
          style={{ color: 'var(--text-2)' }}
        >
          ModusMove analyzes your real readiness and builds a structured plan for your body, goal, injuries, and equipment.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up delay-300">
          <button className="btn-primary text-base px-8 py-4 animate-pulse-glow" onClick={onStart}>
            Build My Safe Plan
          </button>

          {hasSavedPlan && (
            <button type="button" className="btn-secondary text-base px-8 py-4" onClick={onResume}>
              Resume Saved Plan
            </button>
          )}

          <span className="text-sm" style={{ color: 'var(--text-3)' }}>
            No account needed. Instant results.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-slide-up delay-400">
        {FEATURES.map((feature) => (
          <div key={feature.label} className="card p-4 flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--accent-faint)',
                color: 'var(--accent)',
                border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)',
              }}
            >
              {feature.icon}
            </div>
            <div>
              <p className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text)' }}>
                {feature.label}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                {feature.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="animate-slide-up delay-500">
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-4 text-center"
          style={{ color: 'var(--text-3)' }}
        >
          How the safety engine handles real scenarios
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TEST_CASES.map((testCase) => {
            const colors = {
              danger: {
                bg: 'var(--danger-faint)',
                border: 'color-mix(in srgb, var(--danger) 25%, transparent)',
                text: 'var(--danger)',
              },
              warn: {
                bg: 'var(--warn-faint)',
                border: 'color-mix(in srgb, var(--warn) 25%, transparent)',
                text: 'var(--warn)',
              },
              success: {
                bg: 'var(--accent-faint)',
                border: 'color-mix(in srgb, var(--accent) 25%, transparent)',
                text: 'var(--accent)',
              },
            }
            const color = colors[testCase.type]

            return (
              <div
                key={testCase.scenario}
                className="rounded-xl p-4"
                style={{ background: color.bg, border: `1px solid ${color.border}` }}
              >
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
                  {testCase.scenario}
                </p>
                <p className="text-xs font-semibold" style={{ color: color.text }}>
                  {testCase.result}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-center animate-slide-up delay-500 pb-6">
        <button className="btn-secondary px-8" onClick={onStart}>
          Get Started
        </button>

        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            type="button"
            className="text-xs font-semibold"
            style={{ color: 'var(--text-3)' }}
            onClick={() => onOpenLegal?.('privacy')}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            className="text-xs font-semibold"
            style={{ color: 'var(--text-3)' }}
            onClick={() => onOpenLegal?.('terms')}
          >
            Terms & Safety
          </button>
        </div>
      </div>
    </div>
  )
}
