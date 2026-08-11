async function apiFetch<T>(action: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/auth?action=${action}`, init);
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error((data as { error?: string }).error ?? `Request failed: ${res.status}`);
  return data;
}

export function getAuthStatus(): Promise<{ authenticated: boolean }> {
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
