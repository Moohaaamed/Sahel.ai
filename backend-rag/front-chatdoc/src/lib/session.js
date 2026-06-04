export const SESSION_KEY = 'sahelOwnerSession';
export const LAST_BUSINESS_KEY = 'sahelLastBusiness';

export function isExpiredSession(session) {
  return session?.expires_at && Date.parse(session.expires_at) <= Date.now();
}

export function getSession() {
  try {
    const storedSession = localStorage.getItem(SESSION_KEY);
    if (storedSession) {
      const parsed = JSON.parse(storedSession);
      if (isExpiredSession(parsed)) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return parsed;
    }
    const legacyOwner = localStorage.getItem('sahelOwner');
    return legacyOwner ? { owner: JSON.parse(legacyOwner), token: '' } : null;
  } catch {
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
  } catch {
    return null;
  }
}
