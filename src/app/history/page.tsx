"use client";

import { useMemo, useState } from "react";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { TxRow } from "@/components/TxRow";
import { dayKey, dayLabel, longDayLabel } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useStore } from "@/lib/store";
import type { Tx } from "@/lib/types";

interface DayGroup {
  key: string;
  label: string; // "Today", "Yesterday" or "Mon, 27 Oct"
  sub: string | null; // full date, shown under Today / Yesterday
  items: Tx[];
  expenseCents: number;
  incomeCents: number;
}

/** Groups newest-first transactions into one block per calendar day (device local time). */
function groupByDay(txs: Tx[]): DayGroup[] {
  const groups: DayGroup[] = [];
  const byKey = new Map<string, DayGroup>();
  for (const t of txs) {
    const key = dayKey(t.createdAt);
    let g = byKey.get(key);
    if (!g) {
      const label = dayLabel(t.createdAt);
      const relative = label === "Today" || label === "Yesterday";
      g = {
        key,
        label,
        sub: relative ? longDayLabel(t.createdAt) : null,
        items: [],
        expenseCents: 0,
        incomeCents: 0,
      };
      byKey.set(key, g);
      groups.push(g);
    }
    g.items.push(t);
    if (t.kind === "income") g.incomeCents += t.amountCents;
    else g.expenseCents += t.amountCents;
  }
  return groups;
}

export default function HistoryPage() {
  const txs = useStore((s) => s.txs);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const remove = useStore((s) => s.remove);
  const [openId, setOpenId] = useState<number | null>(null);

  const groups = useMemo(() => groupByDay(txs), [txs]);

  return (
    <div className="space-y-5">
      <MonthSwitcher />

      {error && (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {txs.length === 0 && !loading && (
        <p className="py-10 text-center text-sm text-mute">No transactions in this month.</p>
      )}

      <div className="space-y-4">
        {groups.map((g) => (
          <section key={g.key} aria-label={g.label} className="overflow-hidden rounded-2xl border border-line bg-surface">
            <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">{g.label}</h2>
                {g.sub && <p className="text-xs text-mute">{g.sub}</p>}
              </div>
              <div className="text-right">
                {g.expenseCents > 0 && (
                  <p className="num text-sm font-semibold">
                    <span className="sr-only">Spent </span>
                    {formatMoney(g.expenseCents)}
                  </p>
                )}
                {g.incomeCents > 0 && (
                  <p className="num text-xs font-medium text-accent">
                    <span className="sr-only">Income </span>+{formatMoney(g.incomeCents)}
                  </p>
                )}
              </div>
            </header>

            <ul className="divide-y divide-line">
              {g.items.map((t) => {
                const open = openId === t.id;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => setOpenId(open ? null : t.id)}
                      aria-expanded={open}
                      className="w-full px-4 py-3 text-left active:bg-raised"
                    >
                      <TxRow tx={t} />
                    </button>
                    {open && (
                      <div className="flex gap-2 px-4 pb-3 pl-[4.25rem]">
                        <button
                          onClick={() => {
                            setOpenId(null);
                            void remove(t.id);
                          }}
                          className="rounded-lg bg-danger/15 px-4 py-2 text-sm font-semibold text-danger"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setOpenId(null)}
                          className="rounded-lg bg-raised px-4 py-2 text-sm text-mute"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
