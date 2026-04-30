// src/components/StepProgress.jsx
import { clsx } from 'clsx'
import { Check } from 'lucide-react'

const STEPS = [
  { label: 'Profile', sub: 'Basic info' },
  { label: 'Training', sub: 'Goals & setup' },
  { label: 'Review', sub: 'Safety check' },
]

export default function StepProgress({ current }) {
  return (
    <div className="flex items-center mb-10">
      {STEPS.map((step, i) => {
        const done   = i < current - 1
        const active = i === current - 1
        return (
          <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1' : 'none' }}>
            <div className="flex flex-col items-center">
              {/* Dot */}
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 flex-shrink-0',
                  done   && 'shadow-sm',
                  active && 'shadow-md',
                )}
                style={{
                  background: done ? 'var(--accent)' : active ? 'var(--accent-faint)' : 'var(--surface-2)',
                  border: `2px solid ${done || active ? 'var(--accent)' : 'var(--border)'}`,
                  color: done ? '#fff' : active ? 'var(--accent)' : 'var(--text-3)',
                  boxShadow: active ? '0 0 0 4px color-mix(in srgb, var(--accent) 15%, transparent)' : undefined,
                }}
              >
                {done ? <Check size={14} /> : i + 1}
              </div>
              {/* Label */}
              <div className="mt-1.5 text-center hidden sm:block">
                <p className="text-xs font-semibold" style={{ color: active ? 'var(--accent)' : done ? 'var(--text-2)' : 'var(--text-3)' }}>
                  {step.label}
                </p>
              </div>
            </div>
            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2 transition-all duration-500"
                style={{ background: done ? 'var(--accent)' : 'var(--border)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
