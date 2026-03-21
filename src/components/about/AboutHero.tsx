"use client";

import { freePressFont } from "@/styles/fonts";

export function AboutHero() {
  return (
    <header className="mt-10">
      <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">About</p>
      <h1 className={`${freePressFont.className} mt-4 text-4xl text-slate-900 md:text-5xl lg:text-[3.6rem] lg:leading-[1.05]`}>
        Congress Do Your Job
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-slate-600 text-balance md:text-xl">
        A calm, nonpartisan place to track what Congress did this week and what still needs finishing.
      </p>
      <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
        <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1">Source-linked</span>
        <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1">Plain English</span>
        <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1">Nonpartisan</span>
      </div>
    </header>
  );
}
