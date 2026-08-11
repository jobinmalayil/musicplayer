import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // 180 days — "remember this device"

export type Role = 'admin' | 'user';

export interface Session {
  username: string;
  role: Role;
}

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error('Missing SESSION_SECRET');
  return s;
}

function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

export function createSessionCookie(session: Session): string {
  const payload = Buffer.from(
    JSON.stringify({ ...session, exp: Date.now() + MAX_AGE_SECONDS * 1000 }),
  ).toString('base64url');
  const token = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

/** Verifies the session cookie's HMAC signature and expiry, returning the session it carries. */
export function getSession(cookieHeader: string | undefined): Session | null {
  const token = parseCookies(cookieHeader)[COOKIE_NAME];
  if (!token) return null;

  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString()) as Session & { exp: number };
    if (typeof data.exp !== 'number' || data.exp <= Date.now()) return null;
    if (typeof data.username !== 'string' || (data.role !== 'admin' && data.role !== 'user')) return null;
    return { username: data.username, role: data.role };
  } catch {
    return null;
  }
}

export function isAuthenticated(cookieHeader: string | undefined): boolean {
  return getSession(cookieHeader) !== null;
}
