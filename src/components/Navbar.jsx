// src/components/Navbar.jsx
import { Moon, Sun, Dumbbell } from 'lucide-react'

export default function Navbar({ theme, onToggleTheme, step, onOpenLegal }) {
  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: theme === 'dark'
          ? 'rgba(7,8,13,0.88)'
          : 'rgba(248,249,252,0.88)',
        borderColor: 'var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'var(--accent-faint)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
            <Dumbbell size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <span className="font-bold text-base tracking-tight" style={{ color: 'var(--text)' }}>
            Modus<span style={{ color: 'var(--accent)' }}>Move</span>
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            className="hidden sm:inline-flex text-xs font-semibold transition-colors"
            style={{ color: 'var(--text-2)' }}
            onClick={() => onOpenLegal?.('privacy')}
          >
            Privacy
          </button>
          <button
            type="button"
            className="hidden sm:inline-flex text-xs font-semibold transition-colors"
            style={{ color: 'var(--text-2)' }}
            onClick={() => onOpenLegal?.('terms')}
          >
            Terms
          </button>
          {step > 0 && step < 4 && (
            <span className="text-xs font-mono px-2 py-1 rounded-full border"
                  style={{ color: 'var(--text-3)', borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
              Step {step} / 3
            </span>
          )}
          <button
            onClick={onToggleTheme}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all border"
            style={{
              background: 'var(--surface-2)',
              borderColor: 'var(--border)',
              color: 'var(--text-2)',
            }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>
    </nav>
  )
}
