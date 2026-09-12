import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "pmw_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set. Add it to your .env file.");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Whether this request actually reached us over HTTPS. Checked via the
 * standard reverse-proxy header (set by every real deployment — Vercel,
 * Railway, Nginx, etc. terminate TLS and forward this) rather than
 * NODE_ENV, so a `Secure` cookie is only ever requested when the browser
 * will actually accept it. Using NODE_ENV alone broke session persistence
 * for anyone testing a production build over plain HTTP — e.g. opening the
 * site from a phone via the host machine's LAN IP, which browsers never
 * treat as a secure context the way they special-case "localhost".
 */
async function isHttps(): Promise<boolean> {
  const h = await headers();
  return h.get("x-forwarded-proto") === "https";
}

export type SessionPayload = {
  sub: string; // database id
  code: string; // public User ID (PMW-XXXXXX)
  name: string;
  role: string;
};

/** Signs a session JWT and stores it in an httpOnly cookie. */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: await isHttps(),
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/** Reads and verifies the current session, or returns null if absent/invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: String(payload.sub),
      code: String(payload.code),
      name: String(payload.name),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

/** Loads the full, current user record for the session (or null). */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || !user.active) return null;
  return user;
}

/** Clears the session cookie (logout). */
export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
