// src/components/ui.jsx
// Reusable atomic components

import { motion } from 'framer-motion'
import { clsx } from 'clsx'

export function Badge({ children, variant = 'default', size = 'sm', className }) {
  const variants = {
    default:      'bg-[var(--accent-faint)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_30%,transparent)]',
    warn:         'bg-[var(--warn-faint)] text-[var(--warn)] border-[color-mix(in_srgb,var(--warn)_30%,transparent)]',
    danger:       'bg-[var(--danger-faint)] text-[var(--danger)] border-[color-mix(in_srgb,var(--danger)_30%,transparent)]',
    info:         'bg-[var(--info-faint)] text-[var(--info)] border-[color-mix(in_srgb,var(--info)_30%,transparent)]',
    neutral:      'bg-[var(--surface-2)] text-[var(--text-2)] border-[var(--border)]',
    success:      'bg-[var(--accent-faint)] text-[var(--accent)] border-[color-mix(in_srgb,var(--accent)_30%,transparent)]',
  }
  return (
    <span className={clsx(
      'badge',
      variants[variant],
      size === 'lg' && 'text-sm px-3 py-1',
      className
    )}>
      {children}
    </span>
  )
}

export function WarningBox({ type = 'info', icon, title, body, className }) {
  const styles = {
    danger: {
      bg: 'bg-[var(--danger-faint)]',
      border: 'border border-[color-mix(in_srgb,var(--danger)_25%,transparent)]',
      title: 'text-[var(--danger)]',
    },
    warn: {
      bg: 'bg-[var(--warn-faint)]',
      border: 'border border-[color-mix(in_srgb,var(--warn)_25%,transparent)]',
      title: 'text-[var(--warn)]',
    },
    info: {
      bg: 'bg-[var(--info-faint)]',
      border: 'border border-[color-mix(in_srgb,var(--info)_25%,transparent)]',
      title: 'text-[var(--info)]',
    },
    success: {
      bg: 'bg-[var(--accent-faint)]',
      border: 'border border-[color-mix(in_srgb,var(--accent)_25%,transparent)]',
      title: 'text-[var(--accent)]',
    },
  }
  const s = styles[type] || styles.info
  return (
    <div className={clsx('warn-box', s.bg, s.border, 'rounded-xl animate-scale-in', className)}>
      {icon && <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>}
      <div>
        {title && <p className={clsx('font-semibold text-sm mb-1', s.title)}>{title}</p>}
        {body && <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{body}</p>}
      </div>
    </div>
  )
}

export function Spinner({ size = 24, color = 'var(--accent)' }) {
  return (
    <div
      style={{
        width: size, height: size,
        border: `3px solid var(--border)`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

export function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold tracking-widest mb-3 uppercase"
       style={{ color: 'var(--text-3)' }}>
      {children}
    </p>
  )
}

export function Divider({ className }) {
  return <hr className={clsx('border-0 border-t h-px', className)} style={{ borderColor: 'var(--border)' }} />
}

export function ReadinessBar({ score, label, color = 'var(--accent)' }) {
  const pct = Math.min(100, Math.max(0, score))
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm" style={{ color: 'var(--text-2)' }}>{label}</span>
        <span className="font-mono font-bold text-sm" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, background: color, '--target-w': `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function StatCard({ label, value, icon, color = 'var(--accent)', dim = false }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className="text-base">{icon}</span>}
        <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-3)' }}>{label}</span>
      </div>
      <span className={clsx('font-bold text-lg', dim && 'opacity-60')} style={{ color }}>
        {value}
      </span>
    </div>
  )
}

export function ExerciseChip({ name, muscle, level }) {
  const levelColors = {
    beginner:     'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    intermediate: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    advanced:     'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
  }
  return (
    <div className="flex items-center gap-2 py-1">
      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{name}</span>
      <span className="text-xs" style={{ color: 'var(--text-3)' }}>· {muscle}</span>
      <span className={clsx('badge ml-auto', levelColors[level])}>{level}</span>
    </div>
  )
}

export function Card({ children, className, glow = false, ...props }) {
  return (
    <div className={clsx('card', glow && 'card-hi', className)} {...props}>
      {children}
    </div>
  )
}

export function TiltCard({ children, className, glow = false, disabled = false, ...props }) {
  return (
    <motion.div
      className={clsx('card glass-panel premium-tilt', glow && 'card-hi', className)}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// ── UnitToggle ─────────────────────────────────────────────────────────────
// Inline pill-style toggle between two measurement units (e.g. kg / lbs)
export function UnitToggle({ options, value, onChange }) {
  return (
    <div
      className="inline-flex items-center rounded-full p-0.5 gap-0.5"
      style={{ background: 'var(--surface-2)', border: '1.5px solid var(--border)' }}
      role="group"
      aria-label="Unit selector"
    >
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className="px-3 py-1 rounded-full text-xs font-bold transition-all duration-200"
          style={{
            background: value === opt ? 'var(--accent)'  : 'transparent',
            color:      value === opt ? '#fff'           : 'var(--text-3)',
            boxShadow:  value === opt ? '0 1px 4px rgba(20,184,138,0.3)' : undefined,
          }}
          aria-pressed={value === opt}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

export function GlowButton({ children, onClick, disabled, loading, className, variant = 'primary' }) {
  if (variant === 'primary') {
    return (
      <button
        className={clsx('btn-primary', !disabled && 'animate-pulse-glow', className)}
        onClick={onClick}
        disabled={disabled || loading}
      >
        {loading && <Spinner size={18} color="#fff" />}
        {children}
      </button>
    )
  }
  return (
    <button
      className={clsx('btn-secondary', className)}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
