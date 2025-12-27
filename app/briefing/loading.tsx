export default function LoadingBriefing() {
  return (
    <main className="min-h-screen px-4 pb-16 pt-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="h-8 w-48 animate-pulse rounded-full bg-slate-200" />
        <div className="h-48 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    </main>
  )
}
