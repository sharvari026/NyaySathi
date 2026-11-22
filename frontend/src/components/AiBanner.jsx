import React from 'react'

export default function AiBanner({ t }) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl px-4 sm:px-5 py-3.5 flex items-start gap-3 shadow-sm">
      <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center text-sm flex-shrink-0">⚠</span>
      <p className="text-amber-900/80 text-sm font-semibold leading-6">
        {t('ai_disclaimer')}
      </p>
    </div>
  )
}
