import { SESSION_COOKIE, checkSecret, sessionValue } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** POST /api/login { passcode } — sets the session cookie. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { passcode?: unknown } | null;
  const passcode = typeof body?.passcode === "string" ? body.passcode : "";

  if (!checkSecret(passcode)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return Response.json({ error: "Wrong passcode." }, { status: 401 });
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${SESSION_COOKIE}=${sessionValue()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${secure}`,
    },
  });
}
