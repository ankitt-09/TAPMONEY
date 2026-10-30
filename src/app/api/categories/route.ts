import {
  MAX_CATEGORIES_PER_KIND,
  MAX_NAME_LENGTH,
  cleanCategoryName,
  cleanEmoji,
  type Kind,
} from "@/lib/categories";
import { nameTaken, listCategories, toCategory } from "@/lib/category-db";
import { getDb } from "@/lib/db";
import { route } from "@/lib/http";

export const dynamic = "force-dynamic";

/** GET /api/categories */
export const GET = route(async () => {
  return Response.json({ categories: await listCategories() });
});

/** POST /api/categories  { kind: "expense" | "income", name: string, emoji?: string } */
export const POST = route(async (req) => {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Send a JSON body." }, { status: 400 });
  }

  const kind: Kind = body.kind === "income" ? "income" : "expense";
  const name = cleanCategoryName(body.name);
  if (!name) {
    return Response.json(
      { error: `Give it a name (1–${MAX_NAME_LENGTH} characters).` },
      { status: 400 },
    );
  }
  if (await nameTaken(kind, name)) {
    return Response.json({ error: `You already have a "${name}" category.` }, { status: 409 });
  }

  const db = await getDb();
  const [{ n }] = await db.query<{ n: number }>(
    `select count(*)::int as n from categories where kind = $1`,
    [kind],
  );
  if (Number(n) >= MAX_CATEGORIES_PER_KIND) {
    return Response.json(
      { error: `You can have up to ${MAX_CATEGORIES_PER_KIND} categories.` },
      { status: 400 },
    );
  }

  const [row] = await db.query<{ id: number; kind: Kind; name: string; emoji: string }>(
    `insert into categories (kind, name, emoji, sort_order)
     values ($1, $2, $3, (select coalesce(max(sort_order), 0) + 1 from categories where kind = $1))
     returning id, kind, name, emoji`,
    [kind, name, cleanEmoji(body.emoji)],
  );
  return Response.json({ category: toCategory(row) }, { status: 201 });
});
