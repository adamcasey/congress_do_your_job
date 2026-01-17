import Image from 'next/image'

export type RepresentativeCardData = {
  id: string
  name: string
  area: string
  phone?: string
  url?: string
  photoURL?: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function RepresentativeCard({
  rep,
  isPlaceholder = false,
}: {
  rep: RepresentativeCardData
  isPlaceholder?: boolean
}) {
  return (
    <div
      className={`flex h-[200px] items-center rounded-2xl border border-slate-200/80 p-4 shadow-sm ${
        isPlaceholder ? 'bg-slate-50/80' : 'bg-white'
      }`}
    >
      <div className="flex w-full items-center gap-4">
        {rep.photoURL ? (
          <Image
            src={rep.photoURL}
            alt={rep.name}
            width={56}
            height={56}
            unoptimized
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
            {getInitials(rep.name)}
          </div>
        )}
        <div className="flex-1">
          <h4 className="font-semibold text-slate-900">{rep.name}</h4>
          <p className="text-sm text-slate-600">{rep.area}</p>
          {rep.phone && <p className="mt-2 text-sm text-slate-700">{rep.phone}</p>}
          {rep.url ? (
            <a
              href={rep.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm text-amber-600 hover:text-amber-700"
            >
              Visit Website -&gt;
            </a>
          ) : (
            <p className="mt-1 text-xs text-slate-400">Example profile</p>
          )}
        </div>
      </div>
    </div>
  )
}
