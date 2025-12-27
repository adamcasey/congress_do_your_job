import { CivicActionsSection } from '@/components/landing/CivicActionsSection'
import { getCivicActions } from '@/components/landing/data'

export default async function ActionsPage() {
  const actions = await getCivicActions()

  return (
    <main className="min-h-screen px-4 pb-16 pt-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <CivicActionsSection actions={actions} />
      </div>
    </main>
  )
}
