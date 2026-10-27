"use client";

import { Fragment, useState } from "react";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { TxRow } from "@/components/TxRow";
import { dayLabel } from "@/lib/dates";
import { useStore } from "@/lib/store";

export default function HistoryPage() {
  const txs = useStore((s) => s.txs);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const remove = useStore((s) => s.remove);
  const [openId, setOpenId] = useState<number | null>(null);

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

      <ul className="space-y-1">
        {txs.map((t, i) => {
          const label = dayLabel(t.createdAt);
          const showHeader = i === 0 || dayLabel(txs[i - 1].createdAt) !== label;
          const open = openId === t.id;
          return (
            <Fragment key={t.id}>
              {showHeader && (
                <li className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-mute">
                  {label}
                </li>
              )}
              <li>
                <button
                  onClick={() => setOpenId(open ? null : t.id)}
                  aria-expanded={open}
                  className="w-full rounded-xl px-1 py-2 text-left active:bg-surface"
                >
                  <TxRow tx={t} />
                </button>
                {open && (
                  <div className="mb-2 flex gap-2 pl-14">
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
                      className="rounded-lg bg-surface px-4 py-2 text-sm text-mute"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            </Fragment>
          );
        })}
      </ul>
    </div>
  );
}
