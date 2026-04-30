import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Clock3,
  Dumbbell,
  Flame,
  Home,
  Minus,
  Moon,
  Pause,
  PlayCircle,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sun,
  TimerReset,
  Trophy,
  UserRound,
} from 'lucide-react'
import { Badge, ReadinessBar, SectionLabel, TiltCard, WarningBox } from './ui.jsx'
import { EXERCISES } from '../data/exercises.js'

const APP_TABS = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'workout', label: 'Workout', icon: Dumbbell },
  { key: 'progress', label: 'Progress', icon: Activity },
  { key: 'profile', label: 'Profile', icon: UserRound },
]

const VIDEO_CACHE_KEY = 'modusmove-youtube-cache-v8'

export default function WorkoutPlan({ plan, form, onReset, theme, onToggleTheme, onOpenLegal }) {
  const trainingDays = useMemo(() => plan.weekly_plan.filter((day) => day.type === 'training'), [plan])
  const [appTab, setAppTab] = useState('home')
  const [dayIndex, setDayIndex] = useState(0)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [completedExercises, setCompletedExercises] = useState({})
  const [openDays, setOpenDays] = useState(() => ({ 0: true }))
  const [videoCache, setVideoCache] = useState(() => readVideoCache())
  const [showWeekComplete, setShowWeekComplete] = useState(false)
  const [currentSet, setCurrentSet] = useState(1)
  const prefetchedKeys = useRef(new Set())

  const currentDay = trainingDays[dayIndex] || trainingDays[0]
  const currentExerciseQueue = useMemo(() => buildWorkoutQueue(currentDay), [currentDay])
  const currentExercise = currentExerciseQueue[exerciseIndex] || null
  const currentExerciseVideo = useMemo(() => getExerciseVideo(currentExercise, videoCache), [currentExercise, videoCache])
  const isPrepOrRecoveryStep = currentExercise?.muscle === 'warmup' || currentExercise?.muscle === 'cooldown'
  const currentBlock = currentDay?.muscle_blocks?.find((block) => block.muscle === currentExercise?.muscle) || null
  const currentBlockIndex = currentBlock?.exercises?.findIndex((exercise) => exercise.id === currentExercise?.id) ?? -1
  const nextExercise = currentExerciseQueue[exerciseIndex + 1] || null
  const totalExercises = trainingDays.reduce((sum, day) => sum + buildWorkoutQueue(day).length, 0)
  const completedCount = Object.keys(completedExercises).length
  const weeklyPercent = totalExercises ? Math.min(100, Math.round((completedCount / totalExercises) * 100)) : 0
  const todayTotal = currentExerciseQueue.length
  const todayPercent = todayTotal
    ? Math.round((countCompleted(currentDay, completedExercises) / todayTotal) * 100)
    : 0
  const completedDays = trainingDays.filter((day) => {
    const queueLength = buildWorkoutQueue(day).length
    return queueLength > 0 && countCompleted(day, completedExercises) === queueLength
  }).length
  const streak = completedDays ? `${completedDays} day streak` : 'Ready to start'
  const weekIsDone = completedDays === trainingDays.length && trainingDays.length > 0

  useEffect(() => {
    if (weekIsDone) setShowWeekComplete(true)
  }, [weekIsDone])

  useEffect(() => {
    setExerciseIndex(0)
  }, [dayIndex])

  // Prefetch only the first 2 exercises on day load to conserve YouTube API quota.
  useEffect(() => {
    if (!currentDay) return
    const queue = buildWorkoutQueue(currentDay)
    queue.slice(0, 2).forEach((exercise) => {
      const isBlock = exercise.isVideoBlock === true
      if ((exercise.muscle === 'warmup' || exercise.muscle === 'cooldown') && !isBlock) return
      const cacheKey = getVideoCacheKey(exercise)
      if (prefetchedKeys.current.has(cacheKey)) return
      prefetchedKeys.current.add(cacheKey)
      const body = isBlock
        ? { exerciseName: exercise.videoQuery, muscle: exercise.muscle, duration: 'medium' }
        : { exerciseName: exercise.name, muscle: exercise.muscle }
      fetch('/api/youtube-video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((data) => {
          if (!data?.embedUrl) throw new Error('empty')
          setVideoCache((c) => { const n = { ...c, [cacheKey]: data }; writeVideoCache(n); return n })
        })
        .catch(() => {})
    })
  }, [currentDay])

  useEffect(() => {
    setTimerRunning(false)
    setSecondsLeft(parseRestToSeconds(currentExercise?.rest))
    setCurrentSet(1)
  }, [currentExercise])

  useEffect(() => {
    if (!timerRunning || secondsLeft <= 0) return
    const timer = window.setInterval(() => setSecondsLeft((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [timerRunning, secondsLeft])

  useEffect(() => {
    if (secondsLeft !== 0 || !timerRunning) return
    setTimerRunning(false)
    playChime()
    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
    const total = parseTotalSets(currentExercise?.sets)
    if (currentSet < total) {
      setCurrentSet((s) => s + 1)
      setTimeout(() => setSecondsLeft(parseRestToSeconds(currentExercise?.rest)), 600)
    }
  }, [secondsLeft, timerRunning])

  useEffect(() => {
    if (!currentExercise?.name) return

    const isBlock = currentExercise.isVideoBlock === true
    if ((currentExercise.muscle === 'warmup' || currentExercise.muscle === 'cooldown') && !isBlock) return

    const cacheKey = getVideoCacheKey(currentExercise)
    if (videoCache[cacheKey]?.embedUrl || videoCache[cacheKey]?.failed) return

    let cancelled = false

    async function loadVideo() {
      try {
        const body = isBlock
          ? { exerciseName: currentExercise.videoQuery, muscle: currentExercise.muscle, duration: 'medium' }
          : { exerciseName: currentExercise.name, muscle: currentExercise.muscle }

        const result = await fetch('/api/youtube-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!result.ok) {
          let detail = `YOUTUBE_LOOKUP_${result.status}`
          try {
            const errorPayload = await result.json()
            detail = errorPayload.detail || errorPayload.error || detail
          } catch {
            // Keep the status-based message if the server did not return JSON.
          }
          throw new Error(detail)
        }

        const data = await result.json()
        if (!data?.embedUrl) throw new Error('YOUTUBE_LOOKUP_EMPTY')
        if (cancelled) return

        setVideoCache((cache) => {
          const next = { ...cache, [cacheKey]: data }
          writeVideoCache(next)
          return next
        })
      } catch (error) {
        if (cancelled) return

        setVideoCache((cache) => {
          const next = { ...cache, [cacheKey]: { failed: true, error: error.message } }
          writeVideoCache(next)
          return next
        })
      }
    }

    loadVideo()

    return () => {
      cancelled = true
    }
  }, [currentExercise, videoCache])

  function goToWorkout(targetDayIndex = dayIndex) {
    setDayIndex(targetDayIndex)
    setExerciseIndex(0)
    setAppTab('workout')
  }

  function handleCompleteAndNext() {
    if (!currentDay || !currentExercise) return
    const key = makeExerciseKey(currentDay.day, exerciseIndex)
    setCompletedExercises((prev) => ({ ...prev, [key]: true }))

    if (exerciseIndex < currentExerciseQueue.length - 1) {
      setExerciseIndex((value) => value + 1)
      return
    }

    if (dayIndex < trainingDays.length - 1) {
      setDayIndex((value) => value + 1)
      setExerciseIndex(0)
      return
    }

    setAppTab('progress')
  }

  function goToExercise(direction) {
    if (!currentDay) return
    setExerciseIndex((value) => {
      const next = value + direction
      if (next < 0 || next >= currentExerciseQueue.length) return value
      return next
    })
  }

  function retryCurrentVideo() {
    if (!currentExercise?.name) return
    const cacheKey = getVideoCacheKey(currentExercise)
    setVideoCache((cache) => {
      const next = { ...cache }
      delete next[cacheKey]
      writeVideoCache(next)
      return next
    })
  }

  return (
    <>
    {/* ── Week-Complete Re-engagement Modal ─────────────────────────────── */}
    {showWeekComplete && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      >
        <div
          className="w-full max-w-sm rounded-[28px] p-7 text-center space-y-5 animate-scale-in"
          style={{ background: 'var(--surface)', border: '2px solid color-mix(in srgb, var(--accent) 35%, transparent)', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}
        >
          <div className="text-6xl">🏆</div>
          <div>
            <h2 className="text-2xl font-black mb-1" style={{ color: 'var(--text)' }}>
              Week Complete!
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
              You finished all <strong>{trainingDays.length} training days</strong> this week.
              This is how consistency compounds — show up again next week and your body
              will thank you.
            </p>
          </div>

          <div
            className="rounded-2xl p-4 text-left space-y-2"
            style={{ background: 'var(--accent-faint)', border: '1px solid color-mix(in srgb, var(--accent) 25%, transparent)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Your next step
            </p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>
              Rest 1–2 days, then rebuild your plan with slightly more weight or an extra set to keep progressing.
            </p>
          </div>

          <div className="space-y-3">
            <button
              className="btn-primary w-full text-base py-3"
              onClick={() => { setShowWeekComplete(false); onReset?.() }}
            >
              🔄 Build Next Week's Plan
            </button>
            <button
              className="btn-secondary w-full text-base py-3"
              onClick={() => setShowWeekComplete(false)}
            >
              Keep Reviewing This Week
            </button>
          </div>

          <p className="text-xs" style={{ color: 'var(--text-3)' }}>
            💡 Tip: Share your streak with a friend — accountability doubles results.
          </p>
        </div>
      </div>
    )}

    <div className="max-w-6xl mx-auto px-0 sm:px-4 workout-safe-pad overflow-x-hidden">
      <div className="sticky top-0 z-20 backdrop-blur-xl border-b px-3 sm:px-5 py-4 mb-4 sm:mb-5 rounded-b-[22px] sm:rounded-b-[28px]"
           style={{ background: 'color-mix(in srgb, var(--bg) 82%, transparent)', borderColor: 'var(--border)' }}>
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.22em]" style={{ color: 'var(--text-3)' }}>ModusMove</p>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Workout Studio</h1>
              <Badge variant="success">{plan.splitLabel || 'Training Plan'}</Badge>
              <Badge variant="neutral">{titleize(plan.final_level || plan.finalLevel)}</Badge>
              {plan.aiSource === 'openai' && (
                <Badge variant="info">{plan.aiModel || 'OpenAI'}</Badge>
              )}
              {plan.aiSource === 'local' && (
                <Badge variant="neutral">Local Engine</Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="w-11 h-11 rounded-2xl border flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button className="btn-secondary hidden sm:inline-flex" onClick={onReset}>
              <RotateCcw size={16} />
              Rebuild Plan
            </button>
          </div>
        </div>
      </div>

      <WarningBox
        type="warn"
        icon={<ShieldAlert size={16} />}
        title="Train safely"
        body="Use loads you can control, stop if pain or dizziness appears, and consult a qualified medical professional when needed."
        className="mb-5 mx-1 sm:mx-0"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={appTab}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="space-y-5"
        >
          {appTab === 'home' && (
            <>
              <TiltCard className="p-5 sm:p-7 overflow-hidden" glow>
                <div className="grid lg:grid-cols-[1.4fr_0.9fr] gap-5 sm:gap-6 items-center">
                  <div className="space-y-4">
                    <Badge variant="info">Today&apos;s Workout</Badge>
                    <div>
                      <h2 className="text-3xl sm:text-5xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                        {currentDay?.focus || 'Your next session is ready'}
                      </h2>
                      <p className="text-sm sm:text-base mt-3 max-w-2xl" style={{ color: 'var(--text-2)' }}>
                        {currentDay?.why_this_day || plan.why_this_plan}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 min-[440px]:grid-cols-3 gap-3">
                      <MetricCard label="Duration" value={currentDay?.estimated_duration || '45-60 min'} />
                      <MetricCard label="Difficulty" value={titleize(plan.final_level || plan.finalLevel)} />
                      <MetricCard label="AI Frequency" value={`${plan.recommended_training_days || trainingDays.length} days/wk`} />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button className="btn-primary" onClick={() => goToWorkout(dayIndex)}>
                        <PlayCircle size={18} />
                        Start Workout
                      </button>
                      <button className="btn-secondary sm:hidden" onClick={onReset}>
                        <RotateCcw size={16} />
                        Edit Setup
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <RingCard label="Weekly" value={weeklyPercent} tone="var(--accent)" />
                    <RingCard label="Today" value={todayPercent} tone="var(--info)" />
                    <SummaryCard icon={<Flame size={16} />} label="Streak" value={streak} />
                    <SummaryCard icon={<Trophy size={16} />} label="Split" value={plan.splitLabel || titleize(plan.selected_split)} />
                  </div>
                </div>
              </TiltCard>

              <div className="grid xl:grid-cols-[1.15fr_0.85fr] gap-5">
                <TiltCard className="p-5">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                      <SectionLabel>Weekly Plan</SectionLabel>
                      <h3 className="text-xl font-bold" style={{ color: 'var(--text)' }}>Structured weekly program</h3>
                    </div>
                    <Badge variant="neutral">{trainingDays.length} training days</Badge>
                  </div>

                  <div className="space-y-3">
                    {plan.weekly_plan.map((day, index) => {
                      const open = !!openDays[index]
                      const isTraining = day.type === 'training'
                      return (
                        <div key={day.day} className="rounded-[24px] border overflow-hidden"
                             style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                          <button
                            onClick={() => setOpenDays((prev) => ({ ...prev, [index]: !prev[index] }))}
                            className="w-full px-4 py-4 flex items-start sm:items-center justify-between gap-3 text-left"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-base" style={{ color: 'var(--text)' }}>{day.day}</p>
                              <p className="text-sm" style={{ color: 'var(--text-2)' }}>{day.focus}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Badge variant={isTraining ? 'success' : 'neutral'}>
                                {isTraining ? `${day.exercises.length} exercises` : 'Recovery'}
                              </Badge>
                              <ChevronDown size={18} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                            </div>
                          </button>

                          {open && (
                            <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
                              <p className="text-sm pt-3" style={{ color: 'var(--text-2)' }}>{day.why_this_day}</p>
                              {isTraining ? (
                                <>
                                <div className="flex flex-wrap gap-2">
                                  {(day.target_muscles || []).map((muscle) => (
                                    <Badge key={muscle} variant="neutral">{titleize(muscle.replace('_', ' '))}</Badge>
                                  ))}
                                  </div>
                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {(day.muscle_blocks || []).map((block) => (
                                      <div key={block.muscle} className="rounded-[20px] border p-3"
                                           style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                                        <p className="text-sm font-bold mb-2" style={{ color: 'var(--text)' }}>{block.muscleLabel}</p>
                                        <div className="space-y-1.5">
                                          {block.exercises.map((exercise) => (
                                            <p key={exercise.id} className="text-sm" style={{ color: 'var(--text-2)' }}>
                                              {exercise.name}
                                            </p>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <button className="btn-secondary" onClick={() => goToWorkout(trainingDays.findIndex((item) => item.day === day.day))}>
                                    Open Workout
                                  </button>
                                </>
                              ) : (
                                <p className="text-sm" style={{ color: 'var(--text-2)' }}>Light walking, mobility, and breathing only.</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </TiltCard>

                <TiltCard className="p-5 h-fit">
                  <SectionLabel>Why This Plan</SectionLabel>
                  {plan.aiDecisionSummary && (
                    <p className="text-sm leading-7 mb-3 font-semibold" style={{ color: 'var(--text)' }}>{plan.aiDecisionSummary}</p>
                  )}
                  <p className="text-sm leading-7 mb-4" style={{ color: 'var(--text-2)' }}>{plan.why_this_plan}</p>
                  {plan.bodyMetrics && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <MetricCard label="BMI" value={plan.bodyMetrics.bmi ? Number(plan.bodyMetrics.bmi).toFixed(1) : 'N/A'} />
                      <MetricCard label="Recovery Risk" value={titleize(plan.bodyMetrics.recovery_risk || 'reviewed')} />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {(currentDay?.target_muscles || []).map((muscle) => (
                      <Badge key={muscle} variant="success">{titleize(muscle.replace('_', ' '))}</Badge>
                    ))}
                  </div>
                </TiltCard>
              </div>
            </>
          )}

          {appTab === 'workout' && currentDay && (
            <div className="max-w-4xl mx-auto space-y-4">
              <TiltCard className="p-4 sm:p-5">
                <div className="flex gap-2 overflow-x-auto pb-1 plan-scroll-row">
                  {trainingDays.map((day, index) => (
                    <button
                      key={day.day}
                      className={`day-tab ${index === dayIndex ? 'active' : ''}`}
                      onClick={() => setDayIndex(index)}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>
              </TiltCard>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentDay.day}-${exerciseIndex}`}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x <= -80) goToExercise(1)
                    if (info.offset.x >= 80) goToExercise(-1)
                  }}
                  initial={{ opacity: 0, x: 22 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -22 }}
                  transition={{ duration: 0.24 }}
                >
                  <TiltCard className="p-5 sm:p-6" glow>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-3)' }}>
                          Step {exerciseIndex + 1} of {currentExerciseQueue.length}
                        </p>
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                          {currentExercise?.name}
                        </h2>
                        {currentBlock && (
                          <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>
                            {currentBlock.muscleLabel} block • Exercise {Math.max(1, currentBlockIndex + 1)} of {currentBlock.exercises.length}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="btn-secondary px-4 py-2 text-xs"
                          onClick={() => goToExercise(-1)}
                          disabled={exerciseIndex === 0}
                        >
                          <ChevronLeft size={14} />
                          Back Exercise
                        </button>
                        <Badge variant="success">{currentExercise?.muscleLabel}</Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3">
                        <MetricCard label="Sets" value={currentExercise?.sets} />
                        <MetricCard label="Reps" value={currentExercise?.reps} />
                        <MetricCard label={isPrepOrRecoveryStep ? 'Timer' : 'Rest'} value={currentExercise?.rest} />
                      </div>

                      <div className="rounded-[24px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                        {isPrepOrRecoveryStep ? (
                          /* Warmup / cooldown block — 5-min video inline */
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{currentExercise?.muscle === 'warmup' ? '🔥' : '🧊'}</span>
                                <SectionLabel>{currentExercise?.muscle === 'warmup' ? 'Warmup Video' : 'Cooldown Video'}</SectionLabel>
                              </div>
                              {currentExerciseVideo?.watchUrl && (
                                <a href={currentExerciseVideo.watchUrl} target="_blank" rel="noreferrer"
                                   className="text-[11px] font-semibold" style={{ color: 'var(--text-3)' }}>YouTube ↗</a>
                              )}
                            </div>

                            <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/9', background: 'var(--surface-2)' }}>
                              {currentExerciseVideo?.embedUrl ? (
                                <iframe
                                  key={currentExerciseVideo.embedUrl}
                                  src={`${currentExerciseVideo.embedUrl}?rel=0&modestbranding=1`}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  title={currentExercise?.name}
                                />
                              ) : currentExerciseVideo?.failed ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                                  <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Video unavailable</p>
                                  <a
                                    href={currentExerciseVideo.watchUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-5 py-2.5 rounded-2xl text-sm font-bold"
                                    style={{ background: 'var(--accent)', color: 'white' }}
                                  >
                                    Watch on YouTube →
                                  </a>
                                  <button
                                    type="button"
                                    onClick={retryCurrentVideo}
                                    className="px-4 py-2 rounded-2xl text-xs font-bold"
                                    style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                  >
                                    Retry
                                  </button>
                                </div>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                                     style={{ background: 'linear-gradient(135deg, var(--surface-2), color-mix(in srgb,var(--accent) 8%,var(--surface)))' }}>
                                  <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                                  <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Finding best video…</p>
                                </div>
                              )}
                            </div>

                            <p className="text-sm leading-7" style={{ color: 'var(--text-2)' }}>{currentExercise?.tips}</p>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <SectionLabel>Exercise Demo</SectionLabel>
                              {currentExerciseVideo?.embedUrl && currentExerciseVideo?.watchUrl && (
                                <a
                                  href={currentExerciseVideo.watchUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[11px] font-semibold"
                                  style={{ color: 'var(--text-3)' }}
                                >
                                  YouTube ↗
                                </a>
                              )}
                            </div>

                            {/* Inline video — plays right here */}
                            <div className="relative w-full rounded-2xl overflow-hidden mb-4" style={{ aspectRatio: '16/9', background: 'var(--surface-2)' }}>
                              {currentExerciseVideo?.embedUrl ? (
                                <iframe
                                  key={currentExerciseVideo.embedUrl}
                                  src={`${currentExerciseVideo.embedUrl}?rel=0&modestbranding=1`}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  title={currentExercise?.name}
                                />
                              ) : currentExerciseVideo?.failed ? (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                                  <Dumbbell size={36} style={{ color: 'var(--text-3)', opacity: 0.35 }} />
                                  <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Video unavailable</p>
                                  <a
                                    href={currentExerciseVideo.watchUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-5 py-2.5 rounded-2xl text-sm font-bold"
                                    style={{ background: 'var(--accent)', color: 'white' }}
                                  >
                                    Watch on YouTube →
                                  </a>
                                  <button
                                    type="button"
                                    onClick={retryCurrentVideo}
                                    className="px-4 py-2 rounded-2xl text-xs font-bold"
                                    style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                                  >
                                    Retry
                                  </button>
                                </div>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                                     style={{ background: 'linear-gradient(135deg, var(--surface-2), color-mix(in srgb,var(--accent) 8%,var(--surface)))' }}>
                                  <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                                  <p className="text-xs font-semibold" style={{ color: 'var(--text-3)' }}>Loading video…</p>
                                </div>
                              )}
                            </div>

                            <p className="text-sm leading-7" style={{ color: 'var(--text-2)' }}>
                              {currentExercise?.tips}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="rounded-[24px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>
                            {isPrepOrRecoveryStep ? `${currentExercise?.muscleLabel || 'Workout'} Timer` : 'Rest Timer'}
                          </p>
                          {!isPrepOrRecoveryStep && (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                                 style={{ background: 'var(--accent-faint)', color: 'var(--accent)' }}>
                              Set {currentSet} / {parseTotalSets(currentExercise?.sets)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-3 mb-4">
                          <p className="text-4xl font-black tracking-tighter tabular-nums" style={{ color: timerRunning ? 'var(--accent)' : 'var(--text)' }}>
                            {formatSeconds(secondsLeft)}
                          </p>
                          <div className="flex gap-2">
                            <button
                              className="w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold"
                              onClick={() => setSecondsLeft((s) => Math.max(5, s - 15))}
                              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)' }}
                              aria-label="Subtract 15 seconds"
                            >
                              <Minus size={14} />15
                            </button>
                            <button
                              className="w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold"
                              onClick={() => setSecondsLeft((s) => s + 15)}
                              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)' }}
                              aria-label="Add 15 seconds"
                            >
                              <Plus size={14} />15
                            </button>
                            <button
                              className="w-10 h-10 rounded-2xl border flex items-center justify-center"
                              onClick={() => { setSecondsLeft(parseRestToSeconds(currentExercise?.rest)); setTimerRunning(false) }}
                              style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
                              aria-label="Reset timer"
                            >
                              <TimerReset size={16} />
                            </button>
                          </div>
                        </div>

                        <button
                          className="btn-primary w-full"
                          onClick={() => setTimerRunning((value) => !value)}
                        >
                          {timerRunning ? <><Pause size={16} /> Pause</> : <><Clock3 size={16} /> Start Rest Timer</>}
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="rounded-[24px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                          <SectionLabel>Current Block</SectionLabel>
                          <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                            {currentBlock?.muscleLabel || currentExercise?.muscleLabel || 'Workout'}
                          </p>
                          <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>
                            {(currentBlock?.exercises || []).map((exercise) => exercise.name).join(' -> ')}
                          </p>
                        </div>

                        <div className="rounded-[24px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                          <SectionLabel>Next Exercise</SectionLabel>
                          <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>
                            {nextExercise?.name || 'Day complete after this step'}
                          </p>
                          <p className="text-sm mt-2" style={{ color: 'var(--text-2)' }}>
                            {nextExercise?.muscleLabel || 'Finish your log, then tap Complete.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col min-[440px]:flex-row min-[440px]:items-center justify-between gap-3 mt-5">
                      <button className="btn-secondary w-full min-[440px]:w-auto" onClick={() => goToExercise(-1)} disabled={exerciseIndex === 0}>
                        <ChevronLeft size={16} />
                        Previous
                      </button>
                      <div className="h-2 flex-1 w-full rounded-full overflow-hidden order-first min-[440px]:order-none" style={{ background: 'var(--border)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${((exerciseIndex + 1) / Math.max(1, currentExerciseQueue.length)) * 100}%`,
                            background: 'var(--accent)',
                          }}
                        />
                      </div>
                      <button className="btn-primary w-full min-[440px]:w-auto" onClick={handleCompleteAndNext}>
                        <CheckCircle2 size={16} />
                        {exerciseIndex === currentExerciseQueue.length - 1 ? 'Finish Day' : 'Complete'}
                      </button>
                    </div>
                  </TiltCard>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {appTab === 'progress' && (
            <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-5">
              <TiltCard className="p-5 space-y-5">
                <div>
                  <SectionLabel>Progress</SectionLabel>
                  <h3 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>Weekly momentum</h3>
                </div>
                <RingCard label="Weekly completion" value={weeklyPercent} tone="var(--accent)" tall />
                <ReadinessBar score={plan.readiness?.readinessScore || 70} label="Readiness score" />
                <SummaryCard icon={<Flame size={16} />} label="Completed days" value={`${completedDays}/${trainingDays.length}`} />
              </TiltCard>

              <TiltCard className="p-5">
                <SectionLabel>4-Week Progression</SectionLabel>
                <div className="space-y-3">
                  {(plan.progression_plan || []).map((item) => (
                    <div key={item.week} className="rounded-[24px] border p-4"
                         style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <p className="font-bold" style={{ color: 'var(--text)' }}>{item.week}</p>
                        <Badge variant="info">Phase</Badge>
                      </div>
                      <p className="text-sm leading-7" style={{ color: 'var(--text-2)' }}>{item.focus}</p>
                    </div>
                  ))}
                </div>
              </TiltCard>
            </div>
          )}

          {appTab === 'profile' && (
            <div className="grid xl:grid-cols-2 gap-5">
              <TiltCard className="p-5 space-y-4">
                <SectionLabel>Safety Notes</SectionLabel>
                {(plan.safety_notes || []).map((note) => (
                  <WarningBox key={note} type="warn" icon={<ShieldAlert size={16} />} body={note} />
                ))}
              </TiltCard>

              <div className="space-y-5">
                <TiltCard className="p-5">
                  <SectionLabel>Coach Notes</SectionLabel>
                  <p className="text-sm leading-7" style={{ color: 'var(--text-2)' }}>{plan.why_this_plan}</p>
                  {plan.beginner_guidance?.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {plan.beginner_guidance.map((item) => (
                        <div key={item} className="rounded-2xl border px-4 py-3 text-sm"
                             style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </TiltCard>

                <TiltCard className="p-5">
                  <SectionLabel>Recovery + Nutrition</SectionLabel>
                  <p className="text-sm leading-7 mb-3" style={{ color: 'var(--text-2)' }}>{plan.nutritionNote}</p>
                  <div className="space-y-2">
                    {(plan.recoveryNote || []).map((item) => (
                      <div key={item} className="rounded-2xl border px-4 py-3 text-sm"
                           style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
                        {item}
                      </div>
                    ))}
                  </div>
                </TiltCard>

                <TiltCard className="p-5">
                  <SectionLabel>Legal + Data</SectionLabel>
                  <p className="text-sm leading-7 mb-4" style={{ color: 'var(--text-2)' }}>
                    Your plan, exercise swaps, and workout logs are saved in this browser only so you can resume later.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="btn-secondary flex-1" type="button" onClick={() => onOpenLegal?.('privacy')}>
                      Privacy Policy
                    </button>
                    <button className="btn-secondary flex-1" type="button" onClick={() => onOpenLegal?.('terms')}>
                      Terms & Safety
                    </button>
                  </div>
                </TiltCard>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Sticky mini-timer (visible when timer running and user scrolls) ── */}
      {timerRunning && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-20 animate-scale-in"
          style={{ bottom: 96 }}
        >
          <div
            className="flex items-center gap-3 rounded-[20px] px-4 py-2.5 shadow-xl"
            style={{ background: 'var(--accent)', color: 'white', minWidth: 220 }}
          >
            <Clock3 size={15} style={{ flexShrink: 0, opacity: 0.9 }} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold truncate" style={{ opacity: 0.8 }}>{currentExercise?.name}</p>
              <p className="text-base font-black leading-tight">{formatSeconds(secondsLeft)}</p>
            </div>
            <button onClick={() => setTimerRunning(false)} style={{ opacity: 0.8 }} aria-label="Pause timer">
              <Pause size={15} />
            </button>
          </div>
        </div>
      )}

      <nav className="fixed left-1/2 -translate-x-1/2 z-30 w-[calc(100%-16px)] sm:w-[calc(100%-20px)] max-w-xl rounded-[24px] sm:rounded-[28px] border p-1.5 sm:p-2 flex items-center justify-between gap-1 sm:gap-2 glass-panel workout-bottom-nav"
           style={{ borderColor: 'var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        {APP_TABS.map((item) => {
          const Icon = item.icon
          const active = item.key === appTab
          return (
            <button
              key={item.key}
              onClick={() => setAppTab(item.key)}
              className="flex-1 rounded-[18px] sm:rounded-[20px] px-2 sm:px-3 py-2.5 sm:py-3 flex flex-col items-center gap-1 transition-all duration-300 min-h-[56px]"
              style={{
                background: active ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text-3)',
              }}
            >
              <Icon size={18} />
              <span className="text-[11px] font-bold tracking-[0.12em] uppercase">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
    </>
  )
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-[22px] border px-4 py-3 min-w-0" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <p className="text-[11px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-3)' }}>{label}</p>
      <p className="text-lg font-black tracking-tight mt-1 break-words" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="rounded-[22px] border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--accent)' }}>{icon}<span className="text-xs uppercase tracking-[0.18em]">{label}</span></div>
      <p className="text-lg font-bold" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}

function RingCard({ label, value, tone, tall = false }) {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  const dash = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <div className={`rounded-[22px] border p-4 ${tall ? 'min-h-[220px] flex flex-col justify-center' : ''}`}
         style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
      <p className="text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: 'var(--text-3)' }}>{label}</p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <svg width="88" height="88" viewBox="0 0 88 88" className="shrink-0">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={tone}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dash}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div>
          <p className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>{value}%</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>Completion so far</p>
        </div>
      </div>
    </div>
  )
}

function parseRestToSeconds(value) {
  if (!value) return 60

  const text = String(value).toLowerCase()
  const minuteMatch = text.match(/(\d+)\s*(?:min|minute|minutes)\b/)
  if (minuteMatch) return Number(minuteMatch[1]) * 60

  const secondMatch = text.match(/(\d+)\s*(?:s|sec|secs|second|seconds)\b/)
  if (secondMatch) return Number(secondMatch[1])

  const firstNumber = text.match(/(\d+)/)
  return firstNumber ? Number(firstNumber[1]) : 60
}

function formatSeconds(total) {
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function countCompleted(day, completedExercises) {
  return buildWorkoutQueue(day).reduce((sum, _, index) => (
    sum + (completedExercises[makeExerciseKey(day.day, index)] ? 1 : 0)
  ), 0)
}

function makeExerciseKey(dayName, index) {
  return `${dayName}-${index}`
}

function titleize(value = '') {
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getExerciseVideo(exercise, videoCache = {}) {
  if (!exercise) return null
  if ((exercise.muscle === 'warmup' || exercise.muscle === 'cooldown') && !exercise.isVideoBlock) return null

  const cached = videoCache[getVideoCacheKey(exercise)]
  if (cached?.embedUrl) return cached
  if (cached?.failed) {
    const query = getYouTubeSearchQuery(exercise.youtube_link || exercise.demo) || `${exercise.name} exercise form tutorial`
    return {
      embedUrl: '',
      watchUrl: exercise.youtube_link || exercise.demo || `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      title: '',
      failed: true,
      error: cached.error,
    }
  }

  const directEmbed = getDirectYouTubeEmbed(exercise.youtube_link || exercise.youtubeLink || exercise.demo)
  if (directEmbed) {
    return {
      embedUrl: directEmbed,
      watchUrl: exercise.youtube_link || exercise.youtubeLink || exercise.demo,
      title: '',
    }
  }

  const normalizedId = normalizeKey(exercise.id)
  const normalizedName = normalizeKey(exercise.name)
  const match = EXERCISES.find((candidate) =>
    normalizeKey(candidate.id) === normalizedId ||
    normalizeKey(candidate.name) === normalizedName
  )

  const fallbackEmbed = getDirectYouTubeEmbed(match?.demo)
  if (fallbackEmbed) {
    return {
      embedUrl: fallbackEmbed,
      watchUrl: match.demo,
      title: '',
    }
  }

  const query = getYouTubeSearchQuery(exercise.youtube_link || match?.demo) || `${exercise.name} exercise form tutorial`

  return {
    embedUrl: '',
    watchUrl: exercise.youtube_link || match?.demo || `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    title: '',
  }
}

function getVideoCacheKey(exercise) {
  return normalizeKey(`${exercise?.name || ''}-${exercise?.muscle || ''}`)
}

function readVideoCache() {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.localStorage.getItem(VIDEO_CACHE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeVideoCache(cache) {
  try {
    window.localStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Cache failures should never block the workout UI.
  }
}

function getDirectYouTubeEmbed(value = '') {
  if (!value) return null

  try {
    const url = new URL(value)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = url.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }

    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname.startsWith('/embed/')) {
        return `https://www.youtube-nocookie.com${url.pathname}${url.search}`
      }

      if (url.pathname.startsWith('/shorts/')) {
        const id = url.pathname.split('/').filter(Boolean)[1]
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
      }

      const id = url.searchParams.get('v')
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
  } catch {
    return null
  }

  return null
}

function getYouTubeSearchQuery(value = '') {
  if (!value) return ''

  try {
    const url = new URL(value)
    return url.searchParams.get('search_query') || url.searchParams.get('q') || ''
  } catch {
    return ''
  }
}

function normalizeKey(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const notes = [880, 1108, 1320]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.13)
      gain.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.13)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.13 + 0.45)
      osc.start(ctx.currentTime + i * 0.13)
      osc.stop(ctx.currentTime + i * 0.13 + 0.5)
    })
  } catch { /* Web Audio API not available */ }
}

function parseTotalSets(value) {
  if (!value) return 3
  const n = Number(String(value).split('-')[0].split('x')[0].trim())
  return isNaN(n) || n < 1 ? 3 : Math.min(n, 10)
}

function buildBlockVideoQuery(day, type) {
  const focus = (day?.focus || '').toLowerCase()
  if (type === 'warmup') {
    if (focus.includes('push') || focus.includes('chest') || focus.includes('shoulder')) return '5 minute push day chest shoulders warmup routine'
    if (focus.includes('pull') || focus.includes('back')) return '5 minute pull day back warmup routine'
    if (focus.includes('leg') || focus.includes('lower')) return '5 minute leg day warmup routine'
    if (focus.includes('upper')) return '5 minute upper body warmup routine'
    return '5 minute full body warmup routine workout'
  }
  if (focus.includes('push') || focus.includes('chest') || focus.includes('shoulder')) return '5 minute chest shoulders cooldown stretching'
  if (focus.includes('pull') || focus.includes('back')) return '5 minute back cooldown stretching routine'
  if (focus.includes('leg') || focus.includes('lower')) return '5 minute leg day cooldown stretching routine'
  if (focus.includes('upper')) return '5 minute upper body cooldown stretching'
  return '5 minute full body cooldown stretching routine'
}

function buildWorkoutQueue(day) {
  if (!day) return []

  const warmupStep = {
    id: 'warmup-block',
    name: '5-Min Warmup',
    muscle: 'warmup',
    muscleLabel: 'Warm-up',
    sets: 1,
    reps: '5 min',
    rest: '300s',
    tips: 'Follow along with the full warmup to raise your heart rate and prepare your joints before lifting.',
    isVideoBlock: true,
    videoQuery: buildBlockVideoQuery(day, 'warmup'),
    videoDuration: 'medium',
  }

  const exercises = (day.muscle_blocks || []).flatMap((block) => block.exercises || [])
  const mainQueue = exercises.length ? exercises : (day.exercises || [])

  const cooldownStep = {
    id: 'cooldown-block',
    name: '5-Min Cooldown',
    muscle: 'cooldown',
    muscleLabel: 'Cool-down',
    sets: 1,
    reps: '5 min',
    rest: '300s',
    tips: 'Follow along with the full cooldown. Slow breathing, gentle stretches — this speeds up recovery.',
    isVideoBlock: true,
    videoQuery: buildBlockVideoQuery(day, 'cooldown'),
    videoDuration: 'medium',
  }

  return [warmupStep, ...mainQueue, cooldownStep]
}
