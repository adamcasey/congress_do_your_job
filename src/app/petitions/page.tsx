import type { Metadata } from "next";
import { PetitionCard } from "@/components/petitions/PetitionCard";
import type { PetitionSummary } from "@/types/petition";
import type { ApiResponse } from "@/lib/api-response";

export const metadata: Metadata = {
  title: "Petitions — Congress Do Your Job",
  description: "Send neutral, pre-written letters to your representatives. Make your voice heard without the theater.",
};

async function getPetitions(): Promise<PetitionSummary[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/v1/petitions`, {
      next: { revalidate: 300 }, // 5 minutes
    });
    const result = (await res.json()) as ApiResponse<{ petitions: PetitionSummary[] }>;
    if (!result.success) return [];
    return result.data.petitions;
  } catch {
    return [];
  }
}

export default async function PetitionsPage() {
  const petitions = await getPetitions();

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Petitions</h1>
        <p className="mt-3 text-lg text-slate-500">
          Pre-written, neutral letters to your representatives. No drama — just requests to do the job.
        </p>
      </div>

      {petitions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-20 text-center">
          <p className="text-slate-500">No active petitions right now. Check back soon.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {petitions.map((petition) => (
            <PetitionCard key={petition.id} petition={petition} />
          ))}
        </div>
      )}
    </main>
  );
}
