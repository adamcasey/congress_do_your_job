'use client';

import { useEffect, useMemo, useState } from 'react';
import { LAST_FULL_BUDGET_PASSED_AT } from './data';

function formatDuration(ms: number) {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return {
		days,
		hours: hours.toString().padStart(2, '0'),
		minutes: minutes.toString().padStart(2, '0'),
		seconds: seconds.toString().padStart(2, '0'),
	};
}

export function BudgetBanner() {
	const start = useMemo(() => new Date(LAST_FULL_BUDGET_PASSED_AT).getTime(), []);
	const [elapsed, setElapsed] = useState(() => formatDuration(Date.now() - start));
	const invalidDate = Number.isNaN(start);

	useEffect(() => {
		if (invalidDate) return;
		// Align client hydration with server render by delaying the first tick
		const id = setInterval(() => setElapsed(formatDuration(Date.now() - start)), 1000);
		return () => clearInterval(id);
	}, [start, invalidDate]);

	// Ensure server and client render the same initial value
	const renderElapsed = useMemo(() => formatDuration(start ? Date.now() - start : 0), [start]);

	useEffect(() => {
		if (invalidDate) return;
		const tick = () => setElapsed(formatDuration(Date.now() - start));
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	}, [start, invalidDate]);

	return (
		<div className="relative isolate overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-emerald-50 px-6 py-6 shadow-lg shadow-amber-100/50">
			<div className="pointer-events-none absolute inset-0 bg-dot-grid bg-[size:20px_20px] opacity-40" />
			<div className="relative flex flex-wrap items-center justify-center gap-5 text-center md:justify-between md:text-left">
				<span className="grid h-12 w-12 place-items-center rounded-full bg-white text-lg font-bold text-amber-600 ring-1 ring-amber-100 shadow-sm md:justify-self-start">
					⏱️
				</span>
				<div className="flex flex-col items-center leading-tight text-slate-900 md:items-start">
					<span className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-700">
						Days since Congress passed a full budget (not a CR)
					</span>
					{invalidDate ? (
						<span className="text-2xl font-semibold">Waiting for latest budget date…</span>
					) : (
						<span className="text-4xl font-black tracking-[0.12em]">
							{elapsed.days ?? renderElapsed.days}d{' '}
							<span className="inline-block min-w-[3ch]">
								{elapsed.hours ?? renderElapsed.hours}
							</span>
							:
							<span className="inline-block min-w-[3ch]">
								{elapsed.minutes ?? renderElapsed.minutes}
							</span>
							:
							<span className="inline-block min-w-[3ch]">
								{elapsed.seconds ?? renderElapsed.seconds}
							</span>
						</span>
					)}
				</div>
				<div className="ml-auto flex flex-wrap justify-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 md:justify-end">
					<span className="rounded-full bg-white px-3 py-1 ring-1 ring-amber-100">Not a continuing resolution</span>
					<span className="rounded-full bg-white px-3 py-1 ring-1 ring-amber-100">Updates every second</span>
				</div>
			</div>
		</div>
	);
}
