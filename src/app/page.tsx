"use client";

import Link from "next/link";
import { MonthSwitcher } from "@/components/MonthSwitcher";
import { TxRow } from "@/components/TxRow";
import { daysInMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { useEmojiFor, useStore } from "@/lib/store";

export default function HomePage() {
  const month = useStore((s) => s.month);
  const summary = useStore((s) => s.summary);
  const txs = useStore((s) => s.txs);
  const loading = useStore((s) => s.loading);
  const error = useStore((s) => s.error);
  const emojiFor = useEmojiFor();

  const expense = summary?.expenseCents ?? 0;
  const income = summary?.incomeCents ?? 0;
  const net = income - expense;

  // One bar per day of the month
  const days = daysInMonth(month);
  const byDay = new Map(summary?.daily.map((d) => [d.day, d.expenseCents]));
  const bars = Array.from({ length: days }, (_, i) => {
    const key = `${month}-${String(i + 1).padStart(2, "0")}`;
    return { key, day: i + 1, cents: byDay.get(key) ?? 0 };
  });
  const maxBar = Math.max(1, ...bars.map((b) => b.cents));
  const topCategory = summary?.byCategory[0]?.totalCents ?? 1;

  return (
    <div className="space-y-6">
      <MonthSwitcher />

      {error && (
        <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <section className="rounded-3xl border border-line bg-surface p-5">
        <p className="text-sm text-mute">Spent this month</p>
        <p className={`num mt-1 text-5xl font-semibold tracking-tight ${loading && !summary ? "opacity-40" : ""}`}>
          {formatMoney(expense)}
        </p>
        <div className="mt-4 flex gap-6 text-sm">
          <div>
            <p className="text-mute">Income</p>
            <p className="num font-medium text-accent">{formatMoney(income)}</p>
          </div>
          <div>
            <p className="text-mute">Left over</p>
            <p className={`num font-medium ${net < 0 ? "text-danger" : ""}`}>
              {net < 0 ? "−" : ""}
              {formatMoney(Math.abs(net))}
            </p>
          </div>
        </div>

        <div
          className="mt-5 flex h-16 items-end gap-[3px]"
          role="img"
          aria-label={`Daily spending for ${days} days. Highest day: ${formatMoney(maxBar === 1 ? 0 : maxBar)}.`}
        >
          {bars.map((b) => (
            <div
              key={b.key}
              title={`${b.day}: ${formatMoney(b.cents)}`}
              className={`flex-1 rounded-sm ${b.cents ? "bg-accent" : "bg-line"}`}
              style={{ height: b.cents ? `${Math.max(8, (b.cents / maxBar) * 100)}%` : "4px" }}
            />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-mute">
          <span>1</span>
          <span>{days}</span>
        </div>
      </section>

      {summary && summary.byCategory.length > 0 && (
        <section aria-labelledby="cats">
          <h2 id="cats" className="mb-3 text-sm font-semibold text-mute">
            Where it went
          </h2>
          <ul className="space-y-3">
            {summary.byCategory.map((c) => (
              <li key={c.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>
                    <span aria-hidden>{emojiFor("expense", c.category)} </span>
                    {c.category}
                    <span className="text-mute"> · {c.count}</span>
                  </span>
                  <span className="num font-medium">{formatMoney(c.totalCents)}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.max(3, (c.totalCents / topCategory) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="recent">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent" className="text-sm font-semibold text-mute">
            Recent
          </h2>
          {txs.length > 5 && (
            <Link href="/history" className="text-sm text-accent">
              See all
            </Link>
          )}
        </div>

        {txs.length === 0 && !loading ? (
          <div className="rounded-2xl border border-dashed border-line px-5 py-8 text-center">
            <p className="font-medium">Nothing here yet</p>
            <p className="mt-1 text-sm text-mute">Add your first expense — it takes two seconds.</p>
            <Link
              href="/add"
              className="mt-4 inline-block rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg"
            >
              Add expense
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {txs.slice(0, 5).map((t) => (
              <li key={t.id}>
                <TxRow tx={t} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
