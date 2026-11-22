import React, { useState } from 'react'
import { useI18n } from './hooks/useI18n.js'
import Header from './components/Header.jsx'
import ProgressBar from './components/ProgressBar.jsx'
import AiBanner from './components/AiBanner.jsx'
import Step1CaseForm from './components/Step1CaseForm.jsx'
import Step2Documents from './components/Step2Documents.jsx'
import Step3Draft from './components/Step3Draft.jsx'
import DemoModeCard from './components/DemoModeCard.jsx'

export default function App() {
  const { lang, setLang, t } = useI18n()
  const [step, setStep] = useState(1)
  const [caseForm, setCaseForm] = useState(null)
  const [docData, setDocData] = useState(null) // { documents, checklist }
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [demoData, setDemoData] = useState(null)
  const [showDemoModal, setShowDemoModal] = useState(false)

  // Step 1 → 2
  const handleStep1Next = (form) => {
    setCaseForm(form)
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step 2 → 3
  const handleStep2Next = (data) => {
    setDocData(data)
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Demo mode: load demo data and jump to step 3
  const handleSelectDemo = (data) => {
    setIsDemoMode(true)
    setDemoData(data)
    setCaseForm(data.caseForm)
    setDocData({ documents: data.extractedDocs, checklist: data.checklistItems })
    setShowDemoModal(false)
    setStep(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBack = () => {
    setStep((s) => Math.max(1, s - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleTryDemo = () => {
    setShowDemoModal(true)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header t={t} lang={lang} setLang={setLang} onTryDemo={handleTryDemo} />
      <ProgressBar currentStep={step} t={t} />

      <main className="subtle-grid flex-1 max-w-6xl mx-auto w-full px-4 lg:px-6 py-7 sm:py-9 space-y-6">
        {/* AI disclaimer on steps 2 and 3 */}
        {step >= 2 && <AiBanner t={t} />}

        {/* Demo banner */}
        {isDemoMode && step < 3 && (
          <div className="bg-blue-50/90 border border-blue-200 rounded-2xl px-4 py-3 text-blue-800 text-sm font-semibold flex items-center gap-2 shadow-sm">
            <span className="w-8 h-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center">🧪</span>
            <span>{t('demo_badge')}</span>
            <button
              onClick={() => { setIsDemoMode(false); setDemoData(null); setStep(1) }}
              className="ml-auto px-3 py-1.5 rounded-lg text-blue-700 bg-white border border-blue-100 hover:border-blue-300 text-xs"
            >
              Exit demo
            </button>
          </div>
        )}

        {step === 1 && (
          <Step1CaseForm
            t={t}
            initialForm={caseForm || undefined}
            onNext={handleStep1Next}
          />
        )}

        {step === 2 && (
          <Step2Documents
            t={t}
            caseForm={caseForm}
            isDemoMode={isDemoMode}
            demoData={demoData}
            onNext={handleStep2Next}
            onBack={handleBack}
          />
        )}

        {step === 3 && (
          <Step3Draft
            t={t}
            caseForm={caseForm}
            documents={docData?.documents}
            isDemoMode={isDemoMode}
            demoData={demoData}
            onBack={handleBack}
          />
        )}
      </main>

      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur py-5 px-4 text-center">
        <p className="text-xs text-slate-400">
          Nyay Saathi <span className="mx-2 text-slate-300">•</span> AI-assisted drafting for Indian advocates
        </p>
        <p className="text-[11px] text-slate-400 mt-1">Not a substitute for professional legal judgment</p>
      </footer>

      {showDemoModal && (
        <DemoModeCard
          t={t}
          onSelectDemo={handleSelectDemo}
          onClose={() => setShowDemoModal(false)}
        />
      )}
    </div>
  )
}
