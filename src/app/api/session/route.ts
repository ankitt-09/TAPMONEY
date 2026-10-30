import { isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/session — lets the app know whether to show the passcode screen. */
export async function GET(req: Request) {
  return Response.json({ authed: isAuthed(req) });
}
