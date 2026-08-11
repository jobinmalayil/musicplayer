import type { IncomingMessage, ServerResponse } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { clearSessionCookie, createSessionCookie, isAuthenticated } from './_session.js';

function sendJson(res: ServerResponse, status: number, body: unknown, extraHeaders: Record<string, string> = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders });
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export async function handleAuthRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://internal');
  const action = url.searchParams.get('action');

  if (action === 'status') {
    sendJson(res, 200, { authenticated: isAuthenticated(req.headers.cookie) });
    return;
  }

  if (action === 'logout') {
    sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
    return;
  }

  if (action === 'login') {
    try {
      const body = JSON.parse(await readBody(req)) as { username?: string; password?: string };
      const expectedUser = process.env.APP_USERNAME ?? '';
      const expectedPass = process.env.APP_PASSWORD ?? '';
      const ok =
        expectedUser.length > 0 &&
        expectedPass.length > 0 &&
        safeEqual(body.username ?? '', expectedUser) &&
        safeEqual(body.password ?? '', expectedPass);

      if (!ok) {
        sendJson(res, 401, { error: 'Invalid username or password' });
        return;
      }
      sendJson(res, 200, { ok: true }, { 'Set-Cookie': createSessionCookie() });
    } catch {
      sendJson(res, 400, { error: 'Invalid request' });
    }
    return;
  }

  sendJson(res, 400, { error: `Unknown action: ${action}` });
}
