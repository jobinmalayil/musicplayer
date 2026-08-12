import type { IncomingMessage, ServerResponse } from 'node:http';
import { readBody, sendJson } from './_http.js';
import { clearSessionCookie, createSessionCookie, getSession } from './_session.js';
import { getUsers, hashPassword, saveUsers, verifyPassword, type AppUser } from './_usersStore.js';

function publicUser(u: AppUser) {
  return { username: u.username, role: u.role };
}

export async function handleAuthRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://internal');
  const action = url.searchParams.get('action');
  const session = getSession(req.headers.cookie);

  if (action === 'status') {
    sendJson(res, 200, session ? { authenticated: true, username: session.username, role: session.role } : { authenticated: false });
    return;
  }

  if (action === 'logout') {
    sendJson(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie() });
    return;
  }

  if (action === 'login') {
    try {
      const body = JSON.parse(await readBody(req)) as { username?: string; password?: string };
      const username = body.username ?? '';
      const password = body.password ?? '';
      const users = await getUsers();
      const match = users.find((u) => u.username === username);

      if (!match || !verifyPassword(password, match.passwordHash)) {
        sendJson(res, 401, { error: 'Invalid username or password' });
        return;
      }
      sendJson(
        res,
        200,
        { ok: true },
        { 'Set-Cookie': createSessionCookie({ username: match.username, role: match.role }) },
      );
    } catch (err) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : 'Unexpected error' });
    }
    return;
  }

  // Everything below requires an admin session.
  if (!session || session.role !== 'admin') {
    sendJson(res, 403, { error: 'Admin access required' });
    return;
  }

  if (action === 'users' && req.method === 'GET') {
    const users = await getUsers();
    sendJson(res, 200, { users: users.map(publicUser) });
    return;
  }

  if (action === 'add-user') {
    try {
      const body = JSON.parse(await readBody(req)) as { username?: string; password?: string; role?: string };
      const username = (body.username ?? '').trim();
      const password = body.password ?? '';
      const role = body.role === 'admin' ? 'admin' : 'user';

      if (!username || !password) {
        sendJson(res, 400, { error: 'Username and password are required' });
        return;
      }

      const users = await getUsers();
      if (users.some((u) => u.username === username)) {
        sendJson(res, 409, { error: 'That username already exists' });
        return;
      }

      users.push({ username, passwordHash: hashPassword(password), role });
      await saveUsers(users);
      sendJson(res, 200, { users: users.map(publicUser) });
    } catch (err) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : 'Unexpected error' });
    }
    return;
  }

  if (action === 'remove-user') {
    try {
      const body = JSON.parse(await readBody(req)) as { username?: string };
      const username = body.username ?? '';
      const users = await getUsers();
      const target = users.find((u) => u.username === username);
      if (!target) {
        sendJson(res, 404, { error: 'User not found' });
        return;
      }

      const remainingAdmins = users.filter((u) => u.role === 'admin' && u.username !== username);
      if (target.role === 'admin' && remainingAdmins.length === 0) {
        sendJson(res, 400, { error: "Can't remove the last admin" });
        return;
      }

      const next = users.filter((u) => u.username !== username);
      await saveUsers(next);
      sendJson(res, 200, { users: next.map(publicUser) });
    } catch (err) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : 'Unexpected error' });
    }
    return;
  }

  sendJson(res, 400, { error: `Unknown action: ${action}` });
}
