import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PetitionSignForm } from "@/components/petitions/PetitionSignForm";
import type { PetitionDetail } from "@/types/petition";
import type { ApiResponse } from "@/lib/api-response";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPetition(slug: string): Promise<{ petition: PetitionDetail; hasSigned: boolean } | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/v1/petitions/${slug}`, {
      next: { revalidate: 300 },
    });
    if (res.status === 404) return null;
    const result = (await res.json()) as ApiResponse<{ petition: PetitionDetail; hasSigned: boolean }>;
    if (!result.success) return null;
    return result.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPetition(slug);
  if (!data) return { title: "Petition not found" };
  return {
    title: `${data.petition.title} — Congress Do Your Job`,
    description: data.petition.description,
  };
}

export default async function PetitionDetailPage({ params }: Props) {
  const { slug } = await params;
  const data = await getPetition(slug);

  if (!data) notFound();

  const { petition, hasSigned } = data;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      <Link href="/petitions" className="mb-8 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition">
        ← All petitions
      </Link>

      <div className="mt-4 mb-10">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 capitalize">
          {petition.category}
        </span>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{petition.title}</h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">{petition.description}</p>

        {/* Progress */}
        <div className="mt-6">
          {petition.goal ? (
            <>
              <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                <span className="font-semibold text-slate-800">{petition.signatureCount.toLocaleString()} signatures</span>
                <span>Goal: {petition.goal.toLocaleString()}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all"
                  style={{ width: `${petition.progressPercentage}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-slate-800">{petition.signatureCount.toLocaleString()}</span> signatures
            </p>
          )}
        </div>
      </div>

      {/* Letter preview */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Letter template</h2>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-mono">
          {petition.letterTemplate}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          This template is sent on your behalf. You may add a brief personal note below.
        </p>
      </section>

      {/* Sign form */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Add your signature</h2>
        <PetitionSignForm petition={petition} initialHasSigned={hasSigned} />
      </section>
    </main>
  );
}
