"use client";

import { freePressFont } from "@/styles/fonts";

const whyTags = ["Source-linked", "Nonpartisan", "Plain English", "Built for busy people"];

export function AboutIntroGrid() {
  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="space-y-6">
        <div className="rounded-[32px] border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-200/40">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">Why we built this</p>
          <h2 className={`${freePressFont.className} mt-4 text-2xl text-slate-900`}>Clear signals, not civic theater.</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Most civic tools are loud or partisan. We wanted the opposite: a measured briefing that shows the work, the
            deadlines, and the follow-through. It is built for people who want facts and a calm way to respond.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            {whyTags.map((item) => (
              <span key={item} className="rounded-full border border-slate-200 bg-white px-3 py-1">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200/70 bg-white/90 p-8 shadow-xl shadow-slate-200/40">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-700">Our promise</p>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            We focus on public data, clear language, and respectful civic action. This is a project for people who want Congress
            to work better and want to reach out in a way that invites progress.
          </p>
        </div>
      </div>

      <div className="rounded-[32px] border border-slate-200/70 bg-gradient-to-br from-white via-amber-50/40 to-emerald-50/40 p-8 shadow-xl shadow-amber-100/40">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">How to use it</p>
        <h3 className={`${freePressFont.className} mt-4 text-2xl text-slate-900`}>Scan the week. Share the signal.</h3>
        <div className="mt-6 space-y-4 text-sm text-slate-700">
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">01</p>
            <p className="mt-2 font-semibold text-slate-900">Read the weekly briefing</p>
            <p className="mt-1 text-xs text-slate-600">Get the snapshot of what moved, stalled, or hit a deadline.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">02</p>
            <p className="mt-2 font-semibold text-slate-900">Check your delegation</p>
            <p className="mt-1 text-xs text-slate-600">Find your House member and Senators in seconds.</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">03</p>
            <p className="mt-2 font-semibold text-slate-900">Send a clear request</p>
            <p className="mt-1 text-xs text-slate-600">Use specifics so your message is actionable and fair.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
