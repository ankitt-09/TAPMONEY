import { FALLBACK_CATEGORY, type Category, type Kind } from "./categories";
import { getDb } from "./db";

interface Row {
  id: number;
  kind: Kind;
  name: string;
  emoji: string;
}

export const toCategory = (r: Row): Category => ({
  id: Number(r.id),
  kind: r.kind,
  name: r.name,
  emoji: r.emoji,
});

/** All categories; "Other" always last within its kind. */
export async function listCategories(): Promise<Category[]> {
  const db = await getDb();
  const rows = await db.query<Row>(
    `select id, kind, name, emoji from categories
      order by kind, (name = $1), sort_order, id`,
    [FALLBACK_CATEGORY],
  );
  return rows.map(toCategory);
}

/**
 * Map whatever the client sent (any casing) to a real category name.
 * Unknown names go to "Other" so a typo in a Shortcut never loses an expense.
 */
export async function resolveCategory(kind: Kind, input: unknown): Promise<string> {
  const wanted = String(input ?? "").trim().toLowerCase();
  const db = await getDb();
  const [row] = await db.query<{ name: string }>(
    `select name from categories where kind = $1 and lower(name) = $2`,
    [kind, wanted],
  );
  return row?.name ?? FALLBACK_CATEGORY;
}

/** Is another category (not `exceptId`) already using this name? Case-insensitive. */
export async function nameTaken(kind: Kind, name: string, exceptId = 0): Promise<boolean> {
  const db = await getDb();
  const rows = await db.query(
    `select 1 from categories where kind = $1 and lower(name) = lower($2) and id <> $3`,
    [kind, name, exceptId],
  );
  return rows.length > 0;
}
