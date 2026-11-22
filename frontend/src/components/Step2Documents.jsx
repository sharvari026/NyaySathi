import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { extractDocument, checkDocuments } from '../api/index.js'

const DOC_TYPES = [
  { value: '712_extract', label: '7/12 Extract (Satbara)' },
  { value: 'sale_deed', label: 'Sale Deed' },
  { value: 'id_proof', label: 'ID Proof (Aadhaar/PAN)' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'bank_return_memo', label: 'Bank Return Memo' },
  { value: 'agreement', label: 'Agreement / Contract' },
  { value: 'other', label: 'Other Document' },
]

function StatusDot({ status }) {
  const colors = { red: 'bg-red-500', yellow: 'bg-amber-400', green: 'bg-green-500' }
  return (
    <span className={`inline-block w-3 h-3 rounded-full flex-shrink-0 mt-1 ${colors[status] || 'bg-gray-300'}`} />
  )
}

function FileIcon({ file }) {
  const isImage = file.type?.startsWith('image/')
  const isPdf = file.type === 'application/pdf'
  if (isImage && file.preview) {
    return <img src={file.preview} alt={file.name} className="w-14 h-14 object-cover rounded border border-gray-200" />
  }
  return (
    <div className={`w-14 h-14 rounded border flex items-center justify-center text-2xl ${isPdf ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
      {isPdf ? '📄' : '🖼️'}
    </div>
  )
}

function ExtractedFieldsTable({ fields, onChange }) {
  if (!fields) return null
  const editable = {}
  if (fields.person_names?.length) editable['Names'] = fields.person_names.join(', ')
  if (fields.dates?.length) editable['Dates'] = fields.dates.join(', ')
  if (fields.amounts?.length) editable['Amounts'] = fields.amounts.join(', ')
  if (fields.identifiers) {
    Object.entries(fields.identifiers).forEach(([k, v]) => {
      if (v) editable[k.replace(/_/g, ' ')] = v
    })
  }
  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Extracted Fields</p>
      <table className="w-full text-sm border-collapse">
        <tbody>
          {Object.entries(editable).map(([label, val]) => (
            <tr key={label} className="border-b border-gray-100">
              <td className="py-1 pr-2 text-gray-500 font-medium w-28 capitalize">{label}</td>
              <td className="py-1">
                <input
                  type="text"
                  defaultValue={val}
                  onChange={(e) => onChange(label, e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function Step2Documents({ t, caseForm, isDemoMode, demoData, onNext, onBack }) {
  const [files, setFiles] = useState([]) // { file, preview, docType, extracted, corrections }
  const [checking, setChecking] = useState(false)
  const [checklist, setChecklist] = useState(null)
  const [checkError, setCheckError] = useState('')
  const [draftLoading, setDraftLoading] = useState(false)

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles
      .filter((f) => f.size <= 10 * 1024 * 1024) // 10MB max
      .map((f) => ({
        id: Math.random().toString(36).slice(2),
        file: f,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
        docType: 'other',
        extracted: null,
        corrections: {},
      }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 20,
  })

  const removeFile = (id) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.id === id)
      if (removed?.preview) URL.revokeObjectURL(removed.preview)
      return prev.filter((f) => f.id !== id)
    })
  }

  const setDocType = (id, docType) => {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, docType } : f))
  }

  const updateCorrection = (id, label, val) => {
    setFiles((prev) =>
      prev.map((f) => f.id === id ? { ...f, corrections: { ...f.corrections, [label]: val } } : f)
    )
  }

  const handleCheckDocs = async () => {
    setChecking(true)
    setCheckError('')
    setChecklist(null)

    try {
      if (isDemoMode && demoData) {
        // Use demo data
        await new Promise((r) => setTimeout(r, 800))
        setFiles(
          demoData.extractedDocs.map((d, i) => ({
            id: `demo-${i}`,
            file: null,
            preview: null,
            docType: d.doc_type,
            extracted: d.fields,
            corrections: {},
            filename: d.filename,
          }))
        )
        setChecklist(demoData.checklistItems)
      } else {
        // Extract each file
        const updatedFiles = [...files]
        for (let i = 0; i < updatedFiles.length; i++) {
          const f = updatedFiles[i]
          try {
            const res = await extractDocument(f.file, f.docType)
            updatedFiles[i] = { ...f, extracted: res.data }
          } catch {
            updatedFiles[i] = { ...f, extracted: { error: 'Extraction failed – check manually.' } }
          }
        }
        setFiles(updatedFiles)

        const extractedDocs = updatedFiles.map((f) => ({
          doc_type: f.docType,
          filename: f.file?.name || f.filename,
          fields: f.extracted,
        }))

        const checkRes = await checkDocuments(extractedDocs, caseForm)
        setChecklist(checkRes.data.items || checkRes.data)
      }
    } catch (err) {
      setCheckError('Document check failed. Please try again or proceed with caution.')
    } finally {
      setChecking(false)
    }
  }

  const redCount = checklist ? checklist.filter((c) => c.status === 'red').length : 0
  const yellowCount = checklist ? checklist.filter((c) => c.status === 'yellow').length : 0
  const greenCount = checklist ? checklist.filter((c) => c.status === 'green').length : 0

  const handleCreateDraft = () => {
    if (redCount > 0) {
      const confirmed = window.confirm(
        `There are ${redCount} problem(s) that need attention. Do you want to proceed anyway? The draft may have issues.`
      )
      if (!confirmed) return
    }

    const docData = files.map((f) => {
      const fields = { ...(f.extracted || {}) }
      for (const [label, value] of Object.entries(f.corrections || {})) {
        const key = label.toLowerCase().replace(/\s+/g, '_')
        if (key === 'names') fields.person_names = value.split(',').map((v) => v.trim()).filter(Boolean)
        else if (key === 'dates') fields.dates = value.split(',').map((v) => v.trim()).filter(Boolean)
        else if (key === 'amounts') fields.amounts = value.split(',').map((v) => v.trim()).filter(Boolean)
        else if (fields.identifiers) fields.identifiers = { ...fields.identifiers, [key]: value }
      }
      return {
        doc_type: f.docType,
        filename: f.file?.name || f.filename,
        fields,
        corrections: f.corrections,
      }
    })

    onNext({ documents: docData, checklist })
  }

  const hasFiles = files.length > 0 || (isDemoMode && demoData)
  const canCheck = isDemoMode ? true : files.length > 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h2 className="text-[22px] font-bold text-[#1a2b4a]">{t('step2_title')}</h2>

      {/* Demo badge */}
      {isDemoMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-blue-800 text-sm font-medium">
          🧪 {t('demo_badge')}
        </div>
      )}

      {/* Dropzone */}
      {!isDemoMode && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('upload_docs')}</h3>

          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <p className="text-4xl mb-3">📁</p>
            <p className="text-gray-700 font-medium text-base">
              {isDragActive ? 'Drop files here…' : 'Drag & drop files here, or click to select'}
            </p>
            <p className="text-gray-500 text-sm mt-1">JPG, PNG or PDF — max 10MB each</p>
          </div>

          {/* Mobile camera */}
          <div className="mt-3 text-center">
            <label className="inline-flex items-center gap-2 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-4 py-2 rounded-lg text-sm transition-colors">
              📷 Capture Photo
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) onDrop(Array.from(e.target.files))
                }}
              />
            </label>
          </div>
        </div>
      )}

      {/* Uploaded files list */}
      {files.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Uploaded Documents</h3>
          {files.map((f) => (
            <div key={f.id} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-4">
                <FileIcon file={f.file || { name: f.filename, type: 'application/pdf' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{f.file?.name || f.filename}</p>
                  {f.file && <p className="text-sm text-gray-500">{(f.file.size / 1024).toFixed(0)} KB</p>}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <label className="text-sm text-gray-600 font-medium">Type:</label>
                    <select
                      value={f.docType}
                      onChange={(e) => setDocType(f.id, e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      {DOC_TYPES.map((dt) => (
                        <option key={dt.value} value={dt.value}>{dt.label}</option>
                      ))}
                    </select>
                    {!isDemoMode && (
                      <button
                        onClick={() => removeFile(f.id)}
                        className="ml-auto text-red-500 hover:text-red-700 text-sm font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {f.extracted && !f.extracted.error && (
                <ExtractedFieldsTable
                  fields={f.extracted}
                  onChange={(label, val) => updateCorrection(f.id, label, val)}
                />
              )}
              {f.extracted?.error && (
                <p className="text-red-600 text-sm">{f.extracted.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state when no demo and no files */}
      {!isDemoMode && files.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">No documents uploaded yet.</p>
          <p className="text-sm mt-1">Upload documents above to verify them before creating the draft.</p>
        </div>
      )}

      {/* Check Documents Button */}
      {canCheck && !checklist && (
        <div>
          <button
            onClick={handleCheckDocs}
            disabled={checking}
            className="w-full sm:w-auto bg-[#1a2b4a] hover:bg-[#2d4a7a] disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg text-base transition-colors shadow-sm flex items-center gap-2"
          >
            {checking ? (
              <>
                <span className="animate-spin">⏳</span> Checking documents…
              </>
            ) : (
              <>{t('check_docs')} →</>
            )}
          </button>
          {checkError && <p className="mt-2 text-red-600 text-sm">{checkError}</p>}
        </div>
      )}

      {/* Checklist */}
      {checklist && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-gray-800">Document Checklist</h3>
            <div className="text-sm font-medium flex gap-3">
              {redCount > 0 && <span className="text-red-600">🔴 {redCount} problem{redCount !== 1 ? 's' : ''}</span>}
              {yellowCount > 0 && <span className="text-amber-600">🟡 {yellowCount} to check</span>}
              {greenCount > 0 && <span className="text-green-600">🟢 {greenCount} ok</span>}
            </div>
          </div>

          <ul className="space-y-3">
            {checklist.map((item, i) => (
              <li key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                item.status === 'red' ? 'bg-red-50 border border-red-200' :
                item.status === 'yellow' ? 'bg-amber-50 border border-amber-200' :
                'bg-green-50 border border-green-200'
              }`}>
                <StatusDot status={item.status} />
                <div>
                  <p className={`text-sm font-medium ${
                    item.status === 'red' ? 'text-red-800' :
                    item.status === 'yellow' ? 'text-amber-800' :
                    'text-green-800'
                  }`}>{item.message}</p>
                  {item.doc_ref && (
                    <p className="text-xs text-gray-500 mt-0.5">📎 {item.doc_ref}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>

          {/* Re-check */}
          <button
            onClick={() => setChecklist(null)}
            className="text-sm text-blue-600 hover:underline"
          >
            ↩ Re-upload or re-check documents
          </button>
        </div>
      )}

      {/* Privacy note */}
      <p className="text-sm text-gray-500 text-center">
        🔒 {t('privacy_note')}
      </p>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <button
          onClick={onBack}
          className="bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-6 rounded-lg text-base border border-gray-300 transition-colors"
        >
          ← {t('back_btn')}
        </button>
        <button
          onClick={handleCreateDraft}
          disabled={!checklist && !isDemoMode}
          className="bg-[#2d6cdf] hover:bg-[#1e40af] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-8 rounded-lg text-base transition-colors shadow-sm"
        >
          {t('create_draft')} →
        </button>
      </div>
    </div>
  )
}
