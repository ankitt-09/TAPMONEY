import { getDb } from "@/lib/db";
import { route } from "@/lib/http";

export const dynamic = "force-dynamic";

/** DELETE /api/transactions/:id */
export const DELETE = route(async (_req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return Response.json({ error: "Invalid id." }, { status: 400 });
  }
  const db = await getDb();
  const rows = await db.query(`delete from transactions where id = $1 returning id`, [numericId]);
  if (rows.length === 0) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json({ ok: true });
});
