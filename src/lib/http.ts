import { isAuthed } from "./auth";
import { getDb } from "./db";

export const TZ = process.env.APP_TZ ?? "Asia/Kolkata";
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Wraps a route handler with auth + error handling. */
export function route<C>(handler: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      if (!isAuthed(req)) return Response.json({ error: "Unauthorized" }, { status: 401 });
      return await handler(req, ctx);
    } catch (err) {
      console.error(err);
      return Response.json({ error: "Server error" }, { status: 500 });
    }
  };
}

/** The requested ?month=YYYY-MM, or the current month in the configured timezone. */
export async function resolveMonth(req: Request): Promise<string> {
  const requested = new URL(req.url).searchParams.get("month");
  if (requested && MONTH_RE.test(requested)) return requested;
  const db = await getDb();
  const [row] = await db.query<{ m: string }>(
    `select to_char(now() at time zone $1::text, 'YYYY-MM') as m`,
    [TZ],
  );
  return row.m;
}

/** SQL fragment: created_at inside month $2 (YYYY-MM) in timezone $1. */
export const IN_MONTH = `created_at >= (($2::text || '-01')::date)::timestamp at time zone $1::text
  and created_at < ((($2::text || '-01')::date)::timestamp + interval '1 month') at time zone $1::text`;
