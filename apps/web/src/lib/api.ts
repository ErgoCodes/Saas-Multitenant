const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function fetcher<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (res.status === 204) return undefined as unknown as T;

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    const message = Array.isArray(error.message) ? error.message.join(', ') : error.message;
    throw new Error(message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => fetcher<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) => fetcher<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => fetcher<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => fetcher<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => fetcher<T>(path, { method: 'DELETE' }),
};
