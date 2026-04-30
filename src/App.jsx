import { useEffect, useState, useRef } from 'react'
import { useTheme } from './lib/useTheme.js'
import { validateProfile, sanitizeProfile } from './lib/validators.js'
import { inferReadinessLevel, parseInjuries } from './lib/safetyEngine.js'
import { generateAIPlan } from './lib/aiPlanGenerator.js'
import { loadExternalExercises } from './lib/exerciseLoader.js'
import Navbar from './components/Navbar.jsx'
import AppSidebar from './components/AppSidebar.jsx'
import StepProgress from './components/StepProgress.jsx'
import Hero from './components/Hero.jsx'
import Step1Profile from './components/Step1Profile.jsx'
import Step2Training from './components/Step2Training.jsx'
import Step3Review from './components/Step3Review.jsx'
import WorkoutPlan from './components/WorkoutPlan.jsx'
import LegalModal from './components/LegalModal.jsx'

const APP_STORAGE_KEY = 'modusmove-app-state-v1'

const DEFAULT_FORM = {
  age: '',
  weight: '',
  height: '',
  gender: '',
  trainingHistoryMonths: '',
  activityLevel: '',
  sleepQuality: '',
  injuriesText: '',
  goal: '',
  claimedLevel: '',
  daysPerWeek: 4,
  location: 'gym',
  equipment: ['full_gym'],
  preferredSplit: 'auto',
}

export default function App() {
  const { theme, toggle } = useTheme()
  const [screen, setScreen] = useState('home')
  const [form, setForm] = useState(DEFAULT_FORM)
  const [errors, setErrors] = useState({})
  const [warnings, setWarnings] = useState([])
  const [readiness, setReadiness] = useState(null)
  const [plan, setPlan] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false)
  const [legalDoc, setLegalDoc] = useState(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [dbStatus, setDbStatus] = useState({ loaded: false, count: 0, source: null })

  const currentStep = { home: 0, step1: 1, step2: 2, step3: 3, plan: 4 }[screen] ?? 0

  // Load 800+ exercises from free-exercise-db into the pool on startup
  useEffect(() => {
    loadExternalExercises().then((result) => {
      setDbStatus({ loaded: true, count: result.count, source: result.source })
    })
  }, [])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(APP_STORAGE_KEY)
      if (!raw) {
        setIsHydrated(true)
        return
      }

      const saved = JSON.parse(raw)
      if (saved.form) setForm({ ...DEFAULT_FORM, ...saved.form })
      if (saved.errors) setErrors(saved.errors)
      if (saved.warnings) setWarnings(saved.warnings)
      if (saved.readiness) setReadiness(saved.readiness)
      if (saved.plan) setPlan(saved.plan)
      if (typeof saved.disclaimerAccepted === 'boolean') setDisclaimerAccepted(saved.disclaimerAccepted)

      setScreen('home')
    } catch {
      window.localStorage.removeItem(APP_STORAGE_KEY)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    const payload = {
      form,
      errors,
      warnings,
      readiness,
      plan,
      screen,
      disclaimerAccepted,
    }

    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(payload))
  }, [form, errors, warnings, readiness, plan, screen, disclaimerAccepted, isHydrated])

  function goTo(next) {
    setScreen(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleStep1Next() {
    const { errors: validationErrors } = validateProfile({ ...form, goal: 'fat_loss', claimedLevel: 'beginner', location: 'home', equipment: ['none'] })
    const nextErrors = {}
    if (validationErrors.age) nextErrors.age = validationErrors.age
    if (validationErrors.weight) nextErrors.weight = validationErrors.weight
    if (validationErrors.height) nextErrors.height = validationErrors.height
    if (validationErrors.gender) nextErrors.gender = validationErrors.gender
    if (validationErrors.activityLevel) nextErrors.activityLevel = validationErrors.activityLevel
    if (validationErrors.sleepQuality) nextErrors.sleepQuality = validationErrors.sleepQuality
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)
    setErrors({})
    goTo('step2')
  }

  function handleStep2Next() {
    const gymOnlyForm = { ...form, location: 'gym', equipment: ['full_gym'] }
    const { errors: validationErrors, warnings: nextWarnings } = validateProfile(gymOnlyForm)
    const nextErrors = {}
    if (validationErrors.goal) nextErrors.goal = validationErrors.goal
    if (validationErrors.level) nextErrors.level = validationErrors.level
    if (validationErrors.daysPerWeek) nextErrors.daysPerWeek = validationErrors.daysPerWeek
    if (Object.keys(nextErrors).length) return setErrors(nextErrors)

    const sanitized = sanitizeProfile(gymOnlyForm)
    const injuries = parseInjuries(sanitized.injuriesText)
    const nextReadiness = inferReadinessLevel({ ...sanitized, injuries })

    setWarnings(nextWarnings)
    setErrors({})
    setReadiness(nextReadiness)
    goTo('step3')
  }

  async function handleGenerate() {
    setIsGenerating(true)
    setGenerationError('')
    try {
      const sanitized = sanitizeProfile({ ...form, location: 'gym', equipment: ['full_gym'] })
      const injuries = parseInjuries(sanitized.injuriesText)
      const generated = await generateAIPlan({ ...sanitized, injuries }, readiness)
      setPlan({
        ...generated,
        planInstanceId: `plan-${Date.now()}`,
      })
      goTo('plan')
    } catch (err) {
      console.error('[ModusMove] Plan generation failed:', err)
      setGenerationError('Plan generation failed. Please try again, or edit your training setup and regenerate.')
    } finally {
      setIsGenerating(false)
    }
  }

  function handleReset() {
    setForm(DEFAULT_FORM)
    setErrors({})
    setWarnings([])
    setReadiness(null)
    setPlan(null)
    setDisclaimerAccepted(false)
    setGenerationError('')
    window.localStorage.removeItem(APP_STORAGE_KEY)
    window.localStorage.removeItem('formfit-ai-app-state-v2')
    window.localStorage.removeItem('formfit-ai-workout-session-v1')
    goTo('home')
  }

  function handleStartFresh() {
    setForm(DEFAULT_FORM)
    setErrors({})
    setWarnings([])
    setReadiness(null)
    setPlan(null)
    setDisclaimerAccepted(false)
    setGenerationError('')
    window.localStorage.removeItem(APP_STORAGE_KEY)
    window.localStorage.removeItem('formfit-ai-app-state-v2')
    window.localStorage.removeItem('formfit-ai-workout-session-v1')
    goTo('step1')
  }

  return (
    <div className="min-h-screen mesh-bg depth-grid overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      {isGenerating && <GeneratingOverlay />}
      <div className="fixed inset-0 grid-pattern opacity-35 pointer-events-none" style={{ zIndex: 0 }} />

      {screen === 'home' ? (
        <div className="relative" style={{ zIndex: 1 }}>
          <Navbar theme={theme} onToggleTheme={toggle} step={currentStep} onOpenLegal={setLegalDoc} />
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <Hero
              onStart={handleStartFresh}
              onResume={() => plan && goTo('plan')}
              hasSavedPlan={!!plan}
              onOpenLegal={setLegalDoc}
            />
          </main>
        </div>
      ) : screen === 'plan' && plan ? (
        <div className="relative px-2 sm:px-5 py-3 sm:py-6" style={{ zIndex: 1 }}>
          <WorkoutPlan
            key={plan.planInstanceId || 'active-plan'}
            plan={plan}
            form={form}
            onReset={handleReset}
            theme={theme}
            onToggleTheme={toggle}
            onOpenLegal={setLegalDoc}
          />
        </div>
      ) : (
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 lg:py-8 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6" style={{ zIndex: 1 }}>
          <AppSidebar
            screen={screen}
            currentStep={currentStep}
            form={form}
            plan={plan}
            theme={theme}
            onToggleTheme={toggle}
            onNavigate={(target) => {
              if (target === 'plan' && !plan) return
              if (target === 'step3' && !readiness) return
              goTo(target)
            }}
          />

          <main className="min-w-0">
            {screen !== 'plan' && <StepProgress current={Math.min(currentStep, 3)} />}

            {screen === 'step1' && (
              <div>
                <Step1Profile form={form} onChange={setForm} errors={errors} />
                <div className="flex gap-3 mt-8">
                  <button className="btn-secondary" onClick={() => goTo('home')}>← Back</button>
                  <button className="btn-primary flex-1" onClick={handleStep1Next}>Continue →</button>
                </div>
              </div>
            )}

            {screen === 'step2' && (
              <div>
                <Step2Training form={form} onChange={setForm} errors={errors} />
                <div className="flex gap-3 mt-8">
                  <button className="btn-secondary" onClick={() => goTo('step1')}>← Back</button>
                  <button className="btn-primary flex-1" onClick={handleStep2Next}>Review Safety →</button>
                </div>
              </div>
            )}

            {screen === 'step3' && readiness && (
              <div>
                <Step3Review
                  form={form}
                  validation={{ warnings }}
                  readiness={readiness}
                  onGenerate={handleGenerate}
                  isGenerating={isGenerating}
                  disclaimerAccepted={disclaimerAccepted}
                  onDisclaimerChange={setDisclaimerAccepted}
                  onOpenLegal={setLegalDoc}
                  generationError={generationError}
                />
                <div className="mt-4">
                  <button className="btn-secondary w-full" onClick={() => goTo('step2')}>← Edit Training Setup</button>
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      <LegalModal topic={legalDoc} onClose={() => setLegalDoc(null)} />
    </div>
  )
}

const LOADING_MESSAGES = [
  { icon: '🧠', text: 'Analyzing your profile...' },
  { icon: '⚡', text: 'Calculating training readiness...' },
  { icon: '🏋️', text: 'Building your personalized plan...' },
  { icon: '🎯', text: 'Selecting exercises for your goals...' },
  { icon: '🛡️', text: 'Running safety checks...' },
  { icon: '📊', text: 'Calibrating volume and intensity...' },
  { icon: '🎉', text: 'Almost ready...' },
]

function GeneratingOverlay() {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const indexRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        indexRef.current = (indexRef.current + 1) % LOADING_MESSAGES.length
        setIndex(indexRef.current)
        setVisible(true)
      }, 280)
    }, 2400)
    return () => clearInterval(id)
  }, [])

  const msg = LOADING_MESSAGES[index]

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="flex flex-col items-center gap-8 max-w-xs w-full text-center">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="absolute inset-0 animate-spin" style={{ animationDuration: '1.2s' }} viewBox="0 0 112 112" fill="none">
            <circle cx="56" cy="56" r="50" stroke="var(--border)" strokeWidth="6" />
            <circle cx="56" cy="56" r="50" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round"
              strokeDasharray="314" strokeDashoffset="220" />
          </svg>
          <svg className="absolute inset-3 animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} viewBox="0 0 88 88" fill="none">
            <circle cx="44" cy="44" r="38" stroke="color-mix(in srgb,var(--accent) 35%,transparent)" strokeWidth="5" strokeLinecap="round"
              strokeDasharray="239" strokeDashoffset="180" />
          </svg>
          <div className="relative z-10 text-4xl" style={{ transition: 'opacity 0.28s', opacity: visible ? 1 : 0 }}>
            {msg.icon}
          </div>
        </div>

        <div style={{ transition: 'opacity 0.28s', opacity: visible ? 1 : 0 }}>
          <p className="text-xl font-black tracking-tight" style={{ color: 'var(--text)' }}>{msg.text}</p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-3)' }}>Building something great for you</p>
        </div>

        <div className="flex gap-2 items-center">
          {LOADING_MESSAGES.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-400"
              style={{
                width: i === index ? 20 : 6,
                height: 6,
                background: i === index ? 'var(--accent)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        <p className="text-xs" style={{ color: 'var(--text-3)' }}>Usually takes 10–15 seconds</p>
      </div>
    </div>
  )
}
