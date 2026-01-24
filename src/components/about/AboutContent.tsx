'use client'

import { useEffect, useId, useMemo, useState } from 'react'
import { BackButton } from '@/components/ui'
import { latoFont } from '@/styles/fonts'
import { AboutCTA } from '@/components/about/AboutCTA'
import { AboutHero } from '@/components/about/AboutHero'
import { AboutIntroGrid } from '@/components/about/AboutIntroGrid'
import { AboutModal } from '@/components/about/AboutModal'
import { AboutSectionCard } from '@/components/about/AboutSectionCard'
import { sections, type ModalContent } from '@/components/about/about-data'

export function AboutContent() {
  const [activeModal, setActiveModal] = useState<ModalContent | null>(null)
  const modalId = useId()
  const activeLabelId = useMemo(() => `${modalId}-title`, [modalId])

  useEffect(() => {
    if (!activeModal) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveModal(null)
      }
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKey)
    }
  }, [activeModal])

  return (
    <main
      className={`relative min-h-screen overflow-hidden bg-gradient-to-br from-[#e7f1f9] via-white to-[#fde7dd] ${latoFont.className}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-24 h-64 w-64 rounded-full bg-amber-100/50 blur-3xl" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-slate-200/40 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(148,163,184,0.2)_1px,transparent_1px)] bg-[size:22px_22px] opacity-50" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12 md:py-16">
        <BackButton href="/">Back to Dashboard</BackButton>

        <AboutHero />
        <AboutIntroGrid />

        <section className="mt-14 space-y-8">
          {sections.map((section, index) => (
            <AboutSectionCard key={section.id} index={index} section={section} onOpen={setActiveModal} />
          ))}
        </section>
        <AboutCTA />
      </div>
      <AboutModal modal={activeModal} labelId={activeLabelId} onClose={() => setActiveModal(null)} />
    </main>
  )
}
