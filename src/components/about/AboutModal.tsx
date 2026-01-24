"use client"

import { freePressFont } from '@/styles/fonts'
import type { ModalContent } from '@/components/about/about-data'

type AboutModalProps = {
  modal: ModalContent | null
  labelId: string
  onClose: () => void
}

export function AboutModal({ modal, labelId, onClose }: AboutModalProps) {
  if (!modal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6 py-10">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        className="relative w-full max-w-2xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-900/20"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
        >
          Close
        </button>
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Learn more</p>
        <h3 id={labelId} className={`${freePressFont.className} mt-3 text-2xl text-slate-900`}>
          {modal.title}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{modal.description}</p>
        {modal.bullets && (
          <ul className="mt-6 space-y-3 text-sm text-slate-700">
            {modal.bullets.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
