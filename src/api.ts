const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken(): string {
  return localStorage.getItem('inv_token') || '';
}

export function setToken(token: string) {
  localStorage.setItem('inv_token', token);
}

export function clearToken() {
  localStorage.removeItem('inv_token');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorised');
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  login: (email: string, password: string) =>
    req<{ token: string; user: { id: string; email: string; name: string } }>(
      'POST', '/api/auth/login', { email, password }
    ),
  me: () => req<{ user: unknown }>('GET', '/api/auth/me'),
  getInvoices: () => req<any[]>('GET', '/api/invoices'),
  getInvoice: (id: string) => req<any>('GET', `/api/invoices/${id}`),
  createInvoice: (data: unknown) => req<any>('POST', '/api/invoices', data),
  updateInvoice: (id: string, data: unknown) => req<any>('PUT', `/api/invoices/${id}`, data),
  deleteInvoice: (id: string) => req<void>('DELETE', `/api/invoices/${id}`),
  nextNumber: () => req<{ next: string }>('GET', '/api/invoices/meta/next-number'),
};
