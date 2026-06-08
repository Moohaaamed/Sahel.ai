export const ROUTES = {
  home: '/',
  about: '/about',
  showcase: '/showcase',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
  cookies: '/cookies',
  faq: '/faq',
  blog: '/blog',
  login: '/login',
  register: '/register',
  onboarding: '/onboarding',
  success: '/success',
  dashboard: '/dashboard',
  miniSite: (slug) => `/business/${slug}`,
  chat: (slug) => `/chat/${slug}`,
};

export function navigate(path) {
  window.location.href = path;
}

export function loginUrl(nextPath) {
  if (!nextPath) return ROUTES.login;
  return `${ROUTES.login}?next=${encodeURIComponent(nextPath)}`;
}

export function dashboardUrl() {
  try {
    const raw = localStorage.getItem('sahelOwnerSession');
    if (raw) {
      const session = JSON.parse(raw);
      if (session?.owner && session?.token) {
        const expires = session.expires_at ? Date.parse(session.expires_at) : 0;
        if (!expires || expires > Date.now()) return ROUTES.dashboard;
      }
    }
  } catch { /* ignore */ }
  return loginUrl(ROUTES.onboarding);
}
