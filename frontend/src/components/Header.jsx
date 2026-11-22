import React from 'react'

export default function Header({ t, lang, setLang, onTryDemo }) {
  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'mr', label: 'मराठी' },
  ]

  return (
    <header className="glass-header text-white sticky top-0 z-40 border-b border-white/10 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-white/12 border border-white/15 flex items-center justify-center shadow-lg shadow-blue-950/10 shrink-0">
            <span className="text-2xl" aria-hidden="true">⚖</span>
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight">{t('app_title')}</h1>
            <p className="text-xs sm:text-sm text-blue-100/75 truncate">{t('app_subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Language switcher */}
          <div className="hidden sm:flex rounded-xl overflow-hidden border border-white/15 bg-white/5 p-1">
            {languages.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  lang === code
                    ? 'bg-white text-[#1a2b4a] shadow-sm'
                    : 'text-blue-100 hover:bg-white/10'
                }`}
                aria-label={`Switch to ${label}`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Try demo button */}
          <button
            onClick={onTryDemo}
            className="px-3.5 sm:px-4 py-2.5 rounded-xl border border-blue-300/30 bg-blue-400/10 text-blue-50 text-sm font-semibold hover:bg-white hover:text-[#1a2b4a] transition-all"
          >
            {t('try_demo')}
          </button>
        </div>
      </div>
    </header>
  )
}
