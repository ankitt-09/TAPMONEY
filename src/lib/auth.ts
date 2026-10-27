import { createHash, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "tm_session";

function secret(): string {
  const s = process.env.APP_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV !== "production") return "1234"; // dev default
  throw new Error("APP_SECRET is not set (required in production).");
}

const digest = (s: string) => createHash("sha256").update(`tapmoney:${s}`).digest();

/** Constant-time string comparison (hashes first so lengths always match). */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(digest(a), digest(b));
}

export function checkSecret(input: string): boolean {
  return safeEqual(input, secret());
}

/** Value stored in the session cookie: a hash of the secret, never the secret itself. */
export function sessionValue(): string {
  return digest(secret()).toString("hex");
}

/**
 * A request is authenticated by either:
 *  - `Authorization: Bearer <APP_SECRET>` (used by the iPhone Shortcut), or
 *  - the httpOnly session cookie set by /api/login (used by the web app).
 */
export function isAuthed(req: Request): boolean {
  const auth = req.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return checkSecret(auth.slice(7).trim());
  }
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([a-f0-9]+)`));
  return match ? safeEqual(match[1], sessionValue()) : false;
}
