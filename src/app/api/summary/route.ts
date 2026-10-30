import { getDb } from "@/lib/db";
import { IN_MONTH, TZ, resolveMonth, route } from "@/lib/http";
import type { Summary } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/summary?month=YYYY-MM — totals, per-category and per-day spending. */
export const GET = route(async (req) => {
  const month = await resolveMonth(req);
  const db = await getDb();

  const [byKind, byCategory, daily] = await Promise.all([
    db.query<{ kind: string; total: number }>(
      `select kind, sum(amount_cents)::int as total
         from transactions where ${IN_MONTH} group by kind`,
      [TZ, month],
    ),
    db.query<{ category: string; total: number; n: number }>(
      `select category, sum(amount_cents)::int as total, count(*)::int as n
         from transactions
        where ${IN_MONTH} and kind = 'expense'
        group by category
        order by total desc`,
      [TZ, month],
    ),
    db.query<{ day: string; total: number }>(
      `select to_char(created_at at time zone $1::text, 'YYYY-MM-DD') as day,
              sum(amount_cents)::int as total
         from transactions
        where ${IN_MONTH} and kind = 'expense'
        group by day
        order by day`,
      [TZ, month],
    ),
  ]);

  const total = (kind: string) => Number(byKind.find((r) => r.kind === kind)?.total ?? 0);

  const summary: Summary = {
    month,
    expenseCents: total("expense"),
    incomeCents: total("income"),
    byCategory: byCategory.map((r) => ({
      category: r.category,
      totalCents: Number(r.total),
      count: Number(r.n),
    })),
    daily: daily.map((r) => ({ day: r.day, expenseCents: Number(r.total) })),
  };
  return Response.json(summary);
});
