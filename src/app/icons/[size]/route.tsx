import { renderIcon } from "@/lib/icon";

const ALLOWED = new Set([192, 512]);

export async function GET(_req: Request, ctx: { params: Promise<{ size: string }> }) {
  const { size } = await ctx.params;
  const n = Number(size);
  if (!ALLOWED.has(n)) return new Response("Not found", { status: 404 });
  const res = renderIcon(n);
  res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return res;
}
