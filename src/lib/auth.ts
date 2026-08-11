export type Role = 'admin' | 'user';

export interface AuthStatus {
  authenticated: boolean;
  username?: string;
  role?: Role;
}

export interface PublicUser {
  username: string;
  role: Role;
}

async function apiFetch<T>(action: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/auth?action=${action}`, init);
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed: ${res.status}`);
  return data;
}

export function getAuthStatus(): Promise<AuthStatus> {
  return apiFetch('status');
}

export function login(username: string, password: string): Promise<{ ok: true }> {
  return apiFetch('login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export function logout(): Promise<{ ok: true }> {
  return apiFetch('logout', { method: 'POST' });
}

export function listUsers(): Promise<{ users: PublicUser[] }> {
  return apiFetch('users');
}

export function addUser(username: string, password: string, role: Role): Promise<{ users: PublicUser[] }> {
  return apiFetch('add-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, role }),
  });
}

export function removeUser(username: string): Promise<{ users: PublicUser[] }> {
  return apiFetch('remove-user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
}
