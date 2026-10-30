import {
  FALLBACK_CATEGORY,
  MAX_NAME_LENGTH,
  cleanCategoryName,
  cleanEmoji,
  type Kind,
} from "@/lib/categories";
import { nameTaken, toCategory } from "@/lib/category-db";
import { getDb } from "@/lib/db";
import { route } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/categories/:id  { name?: string, emoji?: string }
 * Renaming also renames the category on all your past transactions, in one atomic statement.
 */
export const PATCH = route(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid id." }, { status: 400 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Send a JSON body." }, { status: 400 });
  }

  const db = await getDb();
  const [current] = await db.query<{ kind: Kind; name: string; emoji: string }>(
    `select kind, name, emoji from categories where id = $1`,
    [id],
  );
  if (!current) return Response.json({ error: "Not found." }, { status: 404 });

  let name = current.name;
  if (body.name !== undefined) {
    const cleaned = cleanCategoryName(body.name);
    if (!cleaned) {
      return Response.json(
        { error: `Give it a name (1–${MAX_NAME_LENGTH} characters).` },
        { status: 400 },
      );
    }
    name = cleaned;
  }
  const emoji = body.emoji !== undefined ? cleanEmoji(body.emoji) : current.emoji;

  if (name !== current.name) {
    if (current.name === FALLBACK_CATEGORY) {
      return Response.json(
        { error: `"${FALLBACK_CATEGORY}" is the catch-all category and can't be renamed. You can still change its emoji.` },
        { status: 400 },
      );
    }
    if (await nameTaken(current.kind, name, id)) {
      return Response.json({ error: `You already have a "${name}" category.` }, { status: 409 });
    }
  }

  // One statement = atomic: category and its transactions are renamed together or not at all.
  const [row] = await db.query<{ id: number; kind: Kind; name: string; emoji: string; moved: number }>(
    `with old as (select kind, name from categories where id = $1),
          upd as (
            update categories c set name = $2::text, emoji = $3::text
              from old where c.id = $1
            returning c.id, c.kind, c.name, c.emoji
          ),
          moved as (
            update transactions t set category = $2::text
              from old
             where t.kind = old.kind and t.category = old.name and old.name <> $2::text
            returning t.id
          )
     select id, kind, name, emoji, (select count(*)::int from moved) as moved from upd`,
    [id, name, emoji],
  );
  if (!row) return Response.json({ error: "Not found." }, { status: 404 });

  return Response.json({ category: toCategory(row), transactionsUpdated: Number(row.moved) });
});
