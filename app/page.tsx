import { BriefingSection } from '@/components/landing/BriefingSection'
import { ChoresSection } from '@/components/landing/ChoresSection'
import { CivicActionsSection } from '@/components/landing/CivicActionsSection'
import { Hero } from '@/components/landing/Hero'
import { MemberProfiles } from '@/components/landing/MemberProfiles'
import { NewsletterSection } from '@/components/landing/NewsletterSection'
import { ProductivitySection } from '@/components/landing/ProductivitySection'
import {
  getBriefingData,
  getChoreList,
  getCivicActions,
  getOfficials,
  getProductivityMetrics,
} from '@/components/landing/data'

export default async function Home() {
  const [briefing, chores, metrics, officialList, civicActions] = await Promise.all([
    getBriefingData(),
    getChoreList(),
    getProductivityMetrics(),
    getOfficials(),
    getCivicActions(),
  ])

  return (
    <main className="min-h-screen px-4 pb-20 pt-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <Hero />
        <BriefingSection items={briefing.items} deadlines={briefing.deadlines} />
        <ChoresSection chores={chores} />
        <ProductivitySection metrics={metrics} />
        <MemberProfiles officials={officialList} />
        <CivicActionsSection actions={civicActions} />
        <NewsletterSection />
      </div>
    </main>
  )
}
