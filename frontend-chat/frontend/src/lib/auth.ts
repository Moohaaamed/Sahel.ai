const TOKEN_KEY = 'sahel_token';
const OWNER_KEY = 'sahel_owner';

export interface Owner {
  id: string;
  full_name: string;
  email: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getOwner(): Owner | null {
  const raw = localStorage.getItem(OWNER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveAuth(token: string, owner: Owner): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(OWNER_KEY, JSON.stringify(owner));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(OWNER_KEY);
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function loginOwner(email: string, password: string): Promise<{ owner: Owner; token: string }> {
  const res = await fetch(`${API_BASE}/owners/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail ?? 'Login failed');
  }
  return res.json();
}

export async function fetchAnalytics(slug: string): Promise<any> {
  const res = await fetch(`${API_BASE}/businesses/${slug}/analytics`, {
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchInquiries(slug: string): Promise<any> {
  const res = await fetch(`${API_BASE}/businesses/${slug}/inquiries`, {
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch inquiries');
  return res.json();
}

export async function updateInquiryStatus(slug: string, inquiryId: string, status: string): Promise<any> {
  const res = await fetch(`${API_BASE}/businesses/${slug}/inquiries/${inquiryId}`, {
    method: 'PATCH',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update inquiry');
  return res.json();
}

export async function fetchOwnerBusinesses(ownerId: string): Promise<any> {
  const res = await fetch(`${API_BASE}/businesses?owner_id=${ownerId}`, {
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to fetch businesses');
  const data = await res.json();
  return data.businesses as Array<{ id: string; slug: string; name: string; business_type: string }>;
}
