import React from 'react'

const steps = [
  { num: 1, labelKey: 'step1_title' },
  { num: 2, labelKey: 'step2_title' },
  { num: 3, labelKey: 'step3_title' },
]

export default function ProgressBar({ currentStep, t }) {
  return (
    <div className="bg-white/80 border-b border-slate-200/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-3">
        <ol className="flex items-center">
          {steps.map((step, idx) => {
            const isActive = step.num === currentStep
            const isDone = step.num < currentStep
            return (
              <React.Fragment key={step.num}>
                <li className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold border transition-all ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                        : isActive
                        ? 'bg-[#2d6cdf] border-[#2d6cdf] text-white shadow-[0_6px_16px_rgba(45,108,223,0.25)]'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {isDone ? '✓' : step.num}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-semibold hidden md:inline ${
                      isActive
                        ? 'text-[#2d6cdf]'
                        : isDone
                        ? 'text-[#1a2b4a]'
                        : 'text-gray-400'
                    }`}
                  >
                    {t(step.labelKey)}
                  </span>
                </li>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      step.num < currentStep ? 'bg-[#1a2b4a]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </React.Fragment>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
