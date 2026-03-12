"use client";

export default function PetitionsError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h2 className="text-xl font-semibold text-slate-900">Could not load petitions</h2>
      <p className="mt-2 text-sm text-slate-500">There was a problem loading petition data. Please try again.</p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Try again
      </button>
    </div>
  );
}
