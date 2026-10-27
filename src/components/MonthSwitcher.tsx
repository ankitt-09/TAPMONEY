"use client";

import { monthKey, monthLabel } from "@/lib/dates";
import { useStore } from "@/lib/store";

export function MonthSwitcher() {
  const month = useStore((s) => s.month);
  const shift = useStore((s) => s.shift);
  const isCurrent = month >= monthKey(new Date());

  const btn =
    "grid size-10 place-items-center rounded-full text-mute active:bg-raised disabled:opacity-30";

  return (
    <div className="flex items-center justify-between">
      <button className={btn} onClick={() => shift(-1)} aria-label="Previous month">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="text-base font-semibold">{monthLabel(month)}</h1>
      <button className={btn} onClick={() => shift(1)} disabled={isCurrent} aria-label="Next month">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
