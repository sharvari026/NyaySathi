import React from 'react'
import { demoCase1, demoCase2 } from '../data/demoData.js'

const demos = [
  {
    id: 1,
    icon: '🏦',
    titleKey: 'demo_case_1',
    description: 'Cheque No. 004521 for ₹2,50,000 returned dishonoured – Legal notice under Section 138 NI Act.',
    tags: ['Cheque Bounce', 'Section 138', 'Legal Notice'],
    data: demoCase1,
  },
  {
    id: 2,
    icon: '🏘️',
    titleKey: 'demo_case_2',
    description: 'Survey No. 45, Kothrud – Reply to false ownership claim supported by registered Sale Deed.',
    tags: ['Property Dispute', 'Transfer of Property Act', 'Reply'],
    data: demoCase2,
  },
]

export default function DemoModeCard({ t, onSelectDemo, onClose }) {
  return (
    <div className="fixed inset-0 bg-[#0f1f3d]/55 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-[24px] shadow-[0_24px_80px_rgba(15,31,61,0.28)] max-w-3xl w-full p-5 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-xl">🧪</div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1a2b4a]">Try a demo case</h2>
              <p className="text-slate-500 text-sm mt-1">Choose a realistic workflow to explore the workspace.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-2xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {demos.map((demo) => (
            <button
              key={demo.id}
              onClick={() => onSelectDemo(demo.data)}
              className="text-left border border-slate-200 hover:border-blue-300 rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(45,108,223,0.12)] group bg-gradient-to-b from-white to-slate-50/70"
            >
              <div className="text-4xl mb-3">{demo.icon}</div>
              <h3 className="font-bold text-[#1a2b4a] text-base group-hover:text-[#2d6cdf] transition-colors">
                {t(demo.titleKey)}
              </h3>
              <p className="text-gray-600 text-sm mt-2 leading-relaxed">{demo.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {demo.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-[#2d6cdf] font-semibold text-sm mt-4 group-hover:underline">
                Load this demo →
              </p>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 text-center">
          Demo data is fictional and for illustration only. No real legal advice is provided.
        </p>
      </div>
    </div>
  )
}
