import { AnimatePresence, motion } from 'framer-motion'
import { ShieldAlert, X } from 'lucide-react'

const LEGAL_COPY = {
  privacy: {
    title: 'Privacy Policy',
    body: [
      'ModusMove stores your onboarding inputs, generated plan, and workout progress locally in your browser so you can resume after refresh. That data is not uploaded to a backend in the current version.',
      'If you clear site data, switch browsers, or use private browsing, your saved plan may be removed.',
      'Do not enter sensitive medical records. Only share fitness-relevant limitations you are comfortable storing on this device.',
    ],
  },
  terms: {
    title: 'Terms & Safety Disclaimer',
    body: [
      'ModusMove provides general fitness guidance and is not medical advice, physical therapy, or a diagnosis tool.',
      'Stop immediately if you feel sharp pain, dizziness, chest pain, or unusual symptoms, and consult a qualified medical professional.',
      'You are responsible for using appropriate load, safe technique, and a suitable training environment.',
    ],
  },
}

export default function LegalModal({ topic, onClose }) {
  const copy = topic ? LEGAL_COPY[topic] : null

  return (
    <AnimatePresence>
      {copy && (
        <motion.div
          className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm px-4 py-6 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="card glass-panel w-full max-w-xl p-5 sm:p-6 rounded-[28px]"
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-start gap-3">
                <span
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'var(--warn-faint)',
                    border: '1px solid color-mix(in srgb, var(--warn) 24%, transparent)',
                    color: 'var(--warn)',
                  }}
                >
                  <ShieldAlert size={18} />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] mb-1" style={{ color: 'var(--text-3)' }}>
                    ModusMove
                  </p>
                  <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                    {copy.title}
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0"
                style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
                aria-label="Close legal modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {copy.body.map((item) => (
                <p key={item} className="text-sm leading-7" style={{ color: 'var(--text-2)' }}>
                  {item}
                </p>
              ))}
            </div>

            <button type="button" className="btn-primary w-full mt-6" onClick={onClose}>
              I Understand
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
