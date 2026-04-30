import { motion } from 'framer-motion'
import { Dumbbell, Home, UserRound, Settings2, ShieldCheck, FileText, Moon, Sun } from 'lucide-react'
import { Badge } from './ui.jsx'

const SCREEN_ITEMS = [
  { key: 'step1', label: 'Profile', icon: UserRound },
  { key: 'step2', label: 'Training', icon: Settings2 },
  { key: 'step3', label: 'Safety', icon: ShieldCheck },
  { key: 'plan', label: 'Plan', icon: FileText },
]

export default function AppSidebar({ screen, currentStep, form, plan, theme, onToggleTheme, onNavigate }) {
  const highestStep = plan ? 4 : currentStep

  return (
    <aside className="sidebar-shell glass-panel lg:sticky lg:top-6 h-fit overflow-hidden">
      <div className="relative p-5 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                 style={{ background: 'color-mix(in srgb,var(--accent) 18%,transparent)', border: '1px solid color-mix(in srgb,var(--accent) 28%,transparent)' }}>
              <Dumbbell size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>ModusMove</p>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Trainer-grade planner</p>
            </div>
          </div>

          <button
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 hover:-translate-y-0.5"
            style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb,var(--surface) 82%,transparent)', color: 'var(--text-2)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        <div className="rounded-2xl p-4" style={{ background: 'color-mix(in srgb,var(--surface) 84%,transparent)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>Journey</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {screen === 'plan' ? 'Your plan is ready' : `Step ${Math.min(currentStep, 3)} of 3`}
              </p>
            </div>
            <Badge variant="success">{plan ? 'Live Plan' : 'Setup'}</Badge>
          </div>

          <div className="space-y-2">
            {SCREEN_ITEMS.map((item, index) => {
              const Icon = item.icon
              const isActive = screen === item.key
              const enabled = index < highestStep

              return (
                <motion.button
                  key={item.key}
                  whileHover={enabled ? { x: 4 } : undefined}
                  whileTap={enabled ? { scale: 0.98 } : undefined}
                  onClick={() => enabled && onNavigate(item.key)}
                  className="w-full rounded-2xl px-3 py-3 flex items-center gap-3 text-left transition-all duration-300"
                  style={{
                    background: isActive ? 'color-mix(in srgb,var(--accent) 16%,transparent)' : 'transparent',
                    border: `1px solid ${isActive ? 'color-mix(in srgb,var(--accent) 26%,transparent)' : 'transparent'}`,
                    color: enabled ? 'var(--text)' : 'var(--text-3)',
                    opacity: enabled ? 1 : 0.55,
                  }}
                  disabled={!enabled}
                >
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: isActive ? 'color-mix(in srgb,var(--accent) 20%,transparent)' : 'var(--surface-2)' }}>
                    <Icon size={16} style={{ color: isActive ? 'var(--accent)' : 'var(--text-2)' }} />
                  </span>
                  <span className="flex-1 text-sm font-semibold">{item.label}</span>
                  <span className="text-xs" style={{ color: isActive ? 'var(--accent)' : 'var(--text-3)' }}>
                    {index + 1}
                  </span>
                </motion.button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl p-4 space-y-3"
             style={{ background: 'color-mix(in srgb,var(--surface) 82%,transparent)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <Home size={15} style={{ color: 'var(--accent)' }} />
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Current Setup</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Summary label="Goal" value={form.goal ? form.goal.replace('_', ' ') : 'Pending'} />
            <Summary label="Location" value={form.location || 'Pending'} />
            <Summary label="Days" value={form.daysPerWeek ? `${form.daysPerWeek}/wk` : 'Pending'} />
            <Summary label="Level" value={plan?.final_level || form.claimedLevel || 'Pending'} />
          </div>
        </div>
      </div>
    </aside>
  )
}

function Summary({ label, value }) {
  return (
    <div className="rounded-xl px-3 py-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <p className="text-[11px] uppercase tracking-[0.16em]" style={{ color: 'var(--text-3)' }}>{label}</p>
      <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}
