import { BriefingSection } from '@/components/landing/BriefingSection'
import { getBriefingData } from '@/components/landing/data'

export default async function BriefingPage() {
  const briefing = await getBriefingData()

  return (
    <main className="min-h-screen px-4 pb-16 pt-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <BriefingSection items={briefing.items} deadlines={briefing.deadlines} />
      </div>
    </main>
  )
}
