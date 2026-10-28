import { resolveCategory } from "@/lib/category-db";
import type { Kind } from "@/lib/categories";
import { getDb } from "@/lib/db";
import { IN_MONTH, TZ, resolveMonth, route } from "@/lib/http";
import { formatMoney, parseAmountToCents } from "@/lib/money";
import { toTx, type TxRow } from "@/lib/tx";

export const dynamic = "force-dynamic";

/** GET /api/transactions?month=YYYY-MM&limit=200 */
export const GET = route(async (req) => {
  const month = await resolveMonth(req);
  const limit = Math.min(
    Math.max(Number(new URL(req.url).searchParams.get("limit")) || 200, 1),
    500,
  );
  const db = await getDb();
  const rows = await db.query<TxRow>(
    `select id, amount_cents, kind, category, note, created_at
       from transactions
      where ${IN_MONTH}
      order by created_at desc, id desc
      limit $3`,
    [TZ, month, limit],
  );
  return Response.json({ month, transactions: rows.map(toTx) });
});

/**
 * POST /api/transactions
 * body: { amount: number | string, kind?: "expense" | "income", category?: string, note?: string }
 * The same endpoint is used by the web app and by the iPhone Shortcut.
 */
export const POST = route(async (req) => {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Send a JSON body." }, { status: 400 });
  }

  const amountCents = parseAmountToCents(body.amount);
  if (amountCents === null) {
    return Response.json({ error: "Enter a valid amount greater than 0." }, { status: 400 });
  }

  const kind: Kind = body.kind === "income" ? "income" : "expense";
  const category = await resolveCategory(kind, body.category);
  const note = String(body.note ?? "").trim().slice(0, 120);

  const db = await getDb();
  const [row] = await db.query<TxRow>(
    `insert into transactions (amount_cents, kind, category, note)
     values ($1, $2, $3, $4)
     returning id, amount_cents, kind, category, note, created_at`,
    [amountCents, kind, category, note],
  );

  const tx = toTx(row);
  return Response.json(
    {
      transaction: tx,
      // Handy for the Shortcut's "Show Notification" action.
      message: `${kind === "income" ? "Received" : "Saved"} ${formatMoney(tx.amountCents)} · ${category}`,
    },
    { status: 201 },
  );
});
