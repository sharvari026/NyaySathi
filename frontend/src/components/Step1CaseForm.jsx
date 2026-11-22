import React, { useState, useCallback } from 'react'

const DRAFT_TYPES = ['Legal Notice', 'Reply to Notice', 'Application']
const CASE_TYPES = [
  { value: 'cheque_bounce', label: 'Cheque Bounce (Sec 138 NI Act)' },
  { value: 'property_dispute', label: 'Property Dispute' },
  { value: 'money_recovery', label: 'Money Recovery' },
  { value: 'consumer_complaint', label: 'Consumer Complaint' },
  { value: 'family_matter', label: 'Family Matter' },
  { value: 'other', label: 'Other' },
]
const DRAFT_LANGUAGES = ['English', 'Hindi', 'Marathi']

const REQUIRED_FIELDS = [
  'draft_type', 'case_type', 'client_name', 'client_address',
  'opp_name', 'opp_address', 'key_facts', 'demand',
]

const INITIAL_FORM = {
  draft_type: '',
  case_type: '',
  client_name: '',
  client_address: '',
  opp_name: '',
  opp_address: '',
  key_facts: '',
  demand: '',
  time_limit: 15,
  draft_language: 'English',
}

function FieldError({ msg }) {
  if (!msg) return null
  return <p className="mt-1 text-red-600 text-sm">{msg}</p>
}

function Label({ children, required }) {
  return (
    <label className="block text-[18px] font-semibold text-gray-800 mb-1">
      {children}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
}

const inputCls = "w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2d6cdf] focus:border-transparent bg-white"
const selectCls = "w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2d6cdf] focus:border-transparent bg-white"
const textareaCls = "w-full border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2d6cdf] focus:border-transparent bg-white resize-y"

export default function Step1CaseForm({ t, initialForm, onNext }) {
  const [form, setForm] = useState(initialForm || INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const validate = useCallback((f) => {
    const errs = {}
    REQUIRED_FIELDS.forEach((field) => {
      if (!f[field] || !String(f[field]).trim()) {
        errs[field] = 'This field is required.'
      }
    })
    if (!f.time_limit || Number(f.time_limit) < 1) {
      errs.time_limit = 'Enter a valid number of days (minimum 1).'
    }
    return errs
  }, [])

  const handleChange = (field) => (e) => {
    const val = e.target.value
    setForm((prev) => ({ ...prev, [field]: val }))
    if (submitted) {
      setErrors((prev) => {
        const next = { ...prev }
        if (val.trim()) delete next[field]
        else next[field] = 'This field is required.'
        return next
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      onNext({
        ...form,
        opposite_party_name: form.opp_name,
        opposite_party_address: form.opp_address,
        language: form.draft_language,
        time_limit_days: Number(form.time_limit),
      })
    } else {
      const firstErrField = document.querySelector('[data-field-error]')
      firstErrField?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-4xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2d6cdf] mb-2">New legal draft</p>
          <h2 className="text-2xl sm:text-[28px] font-bold text-[#17233c]">{t('step1_title')}</h2>
          <p className="text-sm text-slate-500 mt-1.5">Enter the matter details to prepare a tailored workspace.</p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
          * Required fields
        </div>
      </div>

      <div className="surface-card bg-white/95 rounded-[22px] border border-slate-200/70 p-5 sm:p-7 space-y-7">

        {/* Draft Type */}
        <div data-field-error={errors.draft_type}>
          <Label required>{t('draft_type')}</Label>
          <select
            className={`${selectCls} ${errors.draft_type ? 'border-red-400 ring-red-200' : ''}`}
            value={form.draft_type}
            onChange={handleChange('draft_type')}
          >
            <option value="">— Select draft type —</option>
            {DRAFT_TYPES.map((dt) => <option key={dt} value={dt}>{dt}</option>)}
          </select>
          <FieldError msg={errors.draft_type} />
        </div>

        {/* Case Type */}
        <div data-field-error={errors.case_type}>
          <Label required>{t('case_type')}</Label>
          <select
            className={`${selectCls} ${errors.case_type ? 'border-red-400' : ''}`}
            value={form.case_type}
            onChange={handleChange('case_type')}
          >
            <option value="">— Select case type —</option>
            {CASE_TYPES.map((ct) => <option key={ct.value} value={ct.value}>{ct.label}</option>)}
          </select>
          <FieldError msg={errors.case_type} />
        </div>

        {/* Client Name + Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div data-field-error={errors.client_name}>
            <Label required>{t('client_name')}</Label>
            <input
              type="text"
              className={`${inputCls} ${errors.client_name ? 'border-red-400' : ''}`}
              value={form.client_name}
              onChange={handleChange('client_name')}
              placeholder="e.g. Ramesh Patil"
            />
            <FieldError msg={errors.client_name} />
          </div>
          <div data-field-error={errors.client_address}>
            <Label required>{t('client_address')}</Label>
            <textarea
              rows={3}
              className={`${textareaCls} ${errors.client_address ? 'border-red-400' : ''}`}
              value={form.client_address}
              onChange={handleChange('client_address')}
              placeholder="Full address including city and PIN"
            />
            <FieldError msg={errors.client_address} />
          </div>
        </div>

        {/* Opposite Party Name + Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div data-field-error={errors.opp_name}>
            <Label required>{t('opp_name')}</Label>
            <input
              type="text"
              className={`${inputCls} ${errors.opp_name ? 'border-red-400' : ''}`}
              value={form.opp_name}
              onChange={handleChange('opp_name')}
              placeholder="e.g. Suresh Sharma"
            />
            <FieldError msg={errors.opp_name} />
          </div>
          <div data-field-error={errors.opp_address}>
            <Label required>{t('opp_address')}</Label>
            <textarea
              rows={3}
              className={`${textareaCls} ${errors.opp_address ? 'border-red-400' : ''}`}
              value={form.opp_address}
              onChange={handleChange('opp_address')}
              placeholder="Full address including city and PIN"
            />
            <FieldError msg={errors.opp_address} />
          </div>
        </div>

        {/* Key Facts */}
        <div data-field-error={errors.key_facts}>
          <Label required>{t('key_facts')}</Label>
          <textarea
            rows={5}
            className={`${textareaCls} ${errors.key_facts ? 'border-red-400' : ''}`}
            value={form.key_facts}
            onChange={handleChange('key_facts')}
            placeholder="e.g. The opposite party issued a cheque for Rs. 1,50,000/- dated 10-Sep-2024 which was returned dishonoured with reason 'Insufficient Funds' on 15-Sep-2024."
          />
          <FieldError msg={errors.key_facts} />
        </div>

        {/* Demand */}
        <div data-field-error={errors.demand}>
          <Label required>{t('demand')}</Label>
          <input
            type="text"
            className={`${inputCls} ${errors.demand ? 'border-red-400' : ''}`}
            value={form.demand}
            onChange={handleChange('demand')}
            placeholder="e.g. Pay Rs. 1,50,000/- with interest within 15 days"
          />
          <FieldError msg={errors.demand} />
        </div>

        {/* Time Limit + Draft Language */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div data-field-error={errors.time_limit}>
            <Label required>{t('time_limit')}</Label>
            <input
              type="number"
              min={1}
              className={`${inputCls} ${errors.time_limit ? 'border-red-400' : ''}`}
              value={form.time_limit}
              onChange={handleChange('time_limit')}
            />
            <FieldError msg={errors.time_limit} />
          </div>
          <div>
            <Label>{t('language')}</Label>
            <select
              className={selectCls}
              value={form.draft_language}
              onChange={handleChange('draft_language')}
            >
              {DRAFT_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="bg-[#2d6cdf] hover:bg-[#1e40af] text-white font-semibold py-3 px-8 rounded-lg text-base transition-colors shadow-sm"
        >
          {t('next_btn')} →
        </button>
      </div>
    </form>
  )
}
