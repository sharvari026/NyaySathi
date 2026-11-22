import React, { useState, useEffect, useRef } from 'react'
import { jsPDF } from 'jspdf'
import { generateDraft, exportPdf, exportDocx, saveCase } from '../api/index.js'
import AiBanner from './AiBanner.jsx'

function SectionTag({ section, act, explanation }) {
  return (
    <div className="border border-blue-100 rounded-lg p-3 bg-blue-50">
      <p className="font-semibold text-[#1a2b4a] text-sm">{section}</p>
      <p className="text-xs text-gray-600 font-medium">{act}</p>
      <p className="text-xs text-gray-500 mt-1">{explanation}</p>
    </div>
  )
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function Step3Draft({ t, caseForm, documents, isDemoMode, demoData, onBack }) {
  const [draftText, setDraftText] = useState('')
  const [clientSummary, setClientSummary] = useState('')
  const [suggestedSections, setSuggestedSections] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [exportStatus, setExportStatus] = useState('')
  const [copied, setCopied] = useState(false)
  const [saveDone, setSaveDone] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const synthRef = useRef(null)

  useEffect(() => {
    if (isDemoMode && demoData) {
      setDraftText(demoData.draftText || '')
      setClientSummary(demoData.clientSummary || '')
      setSuggestedSections(demoData.suggestedSections || [])
      return
    }
    // Fetch draft from backend
    setLoading(true)
    setLoadError('')
    generateDraft(caseForm, documents)
      .then((res) => {
        setDraftText(res.data.draft_text || '')
        setClientSummary(res.data.client_summary || '')
        setSuggestedSections(res.data.suggested_sections || [])
      })
      .catch(() => {
        setLoadError('Failed to generate draft. Please check your connection and try again.')
      })
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRegenerate = () => {
    setLoading(true)
    setLoadError('')
    setSaveDone(false)
    if (isDemoMode && demoData) {
      setTimeout(() => {
        setDraftText(demoData.draftText || '')
        setLoading(false)
      }, 800)
      return
    }
    generateDraft(caseForm, documents)
      .then((res) => {
        setDraftText(res.data.draft_text || '')
        setClientSummary(res.data.client_summary || '')
        setSuggestedSections(res.data.suggested_sections || [])
      })
      .catch(() => setLoadError('Regeneration failed. Please try again.'))
      .finally(() => setLoading(false))
  }

  const handleDownloadPdf = async () => {
    setExportStatus('Generating PDF…')
    try {
      const res = await exportPdf(draftText, caseForm)
      downloadBlob(res.data, 'nyay-saathi-draft.pdf')
      setExportStatus('')
    } catch {
      // Fallback to jsPDF
      try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
        const pageWidth = doc.internal.pageSize.getWidth()
        const margin = 20
        const maxWidth = pageWidth - margin * 2
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)
        const lines = doc.splitTextToSize(draftText, maxWidth)
        let y = margin
        lines.forEach((line) => {
          if (y > 270) { doc.addPage(); y = margin }
          doc.text(line, margin, y)
          y += 6
        })
        doc.save('nyay-saathi-draft.pdf')
        setExportStatus('PDF downloaded (offline mode).')
      } catch (e2) {
        setExportStatus('PDF export failed. Please copy the text manually.')
      }
    }
  }

  const handleDownloadDocx = async () => {
    setExportStatus('Generating DOCX…')
    try {
      const res = await exportDocx(draftText, caseForm)
      downloadBlob(res.data, 'nyay-saathi-draft.docx')
      setExportStatus('')
    } catch {
      setExportStatus('DOCX export failed. Please download via PDF or copy text.')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(draftText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSaveCase = async () => {
    setSaveError('')
    setSaveDone(false)
    try {
      await saveCase({
        client_name: caseForm?.client_name || 'Unknown',
        case_type: caseForm?.case_type || 'other',
        draft_text: draftText,
        case_form: caseForm,
        documents: documents || [],
        client_summary: clientSummary,
      })
      setSaveDone(true)
    } catch {
      setSaveError('Could not save case. Please try again.')
    }
  }

  const handlePlayAudio = () => {
    if (!clientSummary) return
    if (!window.speechSynthesis) {
      alert('Speech synthesis is not supported in this browser.')
      return
    }
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(clientSummary)
    // Try to find a Hindi voice
    const voices = window.speechSynthesis.getVoices()
    const hiVoice = voices.find((v) => v.lang === 'hi-IN') || voices.find((v) => v.lang.startsWith('hi'))
    if (hiVoice) utter.voice = hiVoice
    utter.lang = 'hi-IN'
    utter.onend = () => setIsPlaying(false)
    utter.onerror = () => setIsPlaying(false)
    synthRef.current = utter
    window.speechSynthesis.speak(utter)
    setIsPlaying(true)
  }

  const handleStopAudio = () => {
    window.speechSynthesis?.cancel()
    setIsPlaying(false)
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20">
        <span className="text-5xl animate-spin inline-block mb-4">⚖️</span>
        <p className="text-gray-600 text-lg font-medium">Generating your legal draft…</p>
        <p className="text-gray-400 text-sm mt-2">This may take 10–30 seconds</p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700 font-semibold text-lg mb-3">⚠ {loadError}</p>
          <button
            onClick={handleRegenerate}
            className="bg-[#2d6cdf] text-white font-semibold py-3 px-6 rounded-lg"
          >
            Try Again
          </button>
          <button onClick={onBack} className="ml-3 text-gray-600 underline">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <h2 className="text-[22px] font-bold text-[#1a2b4a]">{t('step3_title')}</h2>

      {/* AI disclaimer */}
      <AiBanner t={t} />

      {/* Demo badge */}
      {isDemoMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-800 text-sm font-medium">
          🧪 {t('demo_badge')}
        </div>
      )}

      {/* Main 2-col layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Draft panel */}
        <div className="flex-1 min-w-0 bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-gray-800">Draft</h3>
            <span className="text-xs text-gray-400">{draftText.length} characters</span>
          </div>

          <textarea
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y leading-relaxed"
            style={{ minHeight: '420px' }}
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            spellCheck={false}
          />

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadPdf}
              className="bg-[#1a2b4a] hover:bg-[#2d4a7a] text-white font-semibold py-3 px-5 rounded-lg text-sm transition-colors"
            >
              ⬇ {t('download_pdf')}
            </button>
            <button
              onClick={handleDownloadDocx}
              className="bg-[#1a2b4a] hover:bg-[#2d4a7a] text-white font-semibold py-3 px-5 rounded-lg text-sm transition-colors"
            >
              ⬇ {t('download_docx')}
            </button>
            <button
              onClick={handleCopy}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-5 rounded-lg text-sm transition-colors"
            >
              {copied ? '✓ Copied!' : `📋 ${t('copy_text')}`}
            </button>
            <button
              onClick={handleRegenerate}
              disabled={loading}
              className="bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 font-semibold py-3 px-5 rounded-lg text-sm transition-colors"
            >
              🔄 {t('regenerate')}
            </button>
            <button
              onClick={handleSaveCase}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-5 rounded-lg text-sm transition-colors"
            >
              💾 {t('save_case')}
            </button>
          </div>

          {/* Status messages */}
          {exportStatus && <p className="text-blue-700 text-sm">{exportStatus}</p>}
          {saveDone && <p className="text-green-700 text-sm font-medium">✓ Case saved successfully.</p>}
          {saveError && <p className="text-red-600 text-sm">{saveError}</p>}

          {/* Client Summary */}
          {clientSummary && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3">
              <h4 className="font-semibold text-gray-800 text-base">
                Client Explanation <span className="text-sm text-gray-500 font-normal">(Hindi/Marathi)</span>
              </h4>
              <p className="text-gray-700 text-sm leading-relaxed">{clientSummary}</p>
              <div className="flex gap-2">
                {!isPlaying ? (
                  <button
                    onClick={handlePlayAudio}
                    className="flex items-center gap-2 bg-[#2d6cdf] hover:bg-[#1e40af] text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    🔊 {t('play_audio')}
                  </button>
                ) : (
                  <button
                    onClick={handleStopAudio}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors"
                  >
                    ⏹ {t('stop_audio')}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Suggested sections sidebar */}
        {suggestedSections.length > 0 && (
          <div className="lg:w-72 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Suggested Law Sections</h3>
              <p className="text-xs text-amber-600 font-medium mt-1">⚠ {t('suggested_verify')}</p>
            </div>
            <div className="space-y-3">
              {suggestedSections.map((s, i) => (
                <SectionTag key={i} section={s.section} act={s.act} explanation={s.explanation} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg text-base border border-gray-300 transition-colors"
        >
          ← {t('back_btn')}
        </button>
      </div>
    </div>
  )
}
