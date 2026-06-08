import { API_URL } from '../config';

export const SESSION_KEY = 'sahelOwnerSession';
export const LAST_BUSINESS_KEY = 'sahelLastBusiness';

export function isExpiredSession(session) {
  if (!session?.expires_at) return false;
  const parsed = Date.parse(session.expires_at);
  if (isNaN(parsed)) return true;
  return parsed <= Date.now();
}

export function getSession() {
  try {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      if (isExpiredSession(parsed) || !parsed.token) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed;
    }
    return null;
  } catch (e) {
    console.warn('getSession failed:', e);
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.removeItem('sahelOwner');
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('sahelOwner');
  fetch(`${API_URL}/owners/logout`, { method: 'POST' }).catch(() => {});
}

export function authHeaders(ownerToken) {
  return ownerToken ? { Authorization: `Bearer ${ownerToken}` } : {};
}

export function saveLastBusiness(business) {
  localStorage.setItem(LAST_BUSINESS_KEY, JSON.stringify(business));
}

export function getLastBusiness() {
  try {
    const raw = localStorage.getItem(LAST_BUSINESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn('getLastBusiness failed:', e);
    return null;
  }
}
