import { MemberProfiles } from '@/components/landing/MemberProfiles'
import { getOfficials } from '@/components/landing/data'

export default async function OfficialsPage() {
  const officials = await getOfficials()

  return (
    <main className="min-h-screen px-4 pb-16 pt-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <MemberProfiles officials={officials} />
      </div>
    </main>
  )
}
