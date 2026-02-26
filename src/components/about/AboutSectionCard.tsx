"use client";

import { freePressFont } from "@/styles/fonts";
import type { AboutSection, ModalContent } from "@/components/about/about-data";

type AboutSectionCardProps = {
  section: AboutSection;
  index: number;
  onOpen: (modal: ModalContent) => void;
};

export function AboutSectionCard({ section, index, onOpen }: AboutSectionCardProps) {
  return (
    <article className="rounded-[36px] border border-slate-200/80 bg-white/90 p-8 shadow-2xl shadow-slate-200/40">
      <div className={`grid gap-8 lg:grid-cols-[1.1fr_0.9fr] ${index % 2 ? "lg:grid-cols-[0.9fr_1.1fr]" : ""}`}>
        <div className={index % 2 ? "lg:order-2" : ""}>
          <div className="flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${section.accent}`} aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">{section.eyebrow}</p>
          </div>
          <h2 className={`${freePressFont.className} mt-4 text-3xl text-slate-900`}>{section.title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{section.summary}</p>
        </div>

        <div className={`rounded-3xl border border-slate-200/70 bg-slate-50/90 p-6 ${index % 2 ? "lg:order-1" : ""}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{section.panelTitle}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {section.panelItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onOpen(section.modal)}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white shadow-sm shadow-slate-900/30 transition hover:-translate-y-[1px] hover:bg-slate-800"
          >
            Learn more
            <span aria-hidden>&rarr;</span>
          </button>
        </div>
      </div>
    </article>
  );
}
