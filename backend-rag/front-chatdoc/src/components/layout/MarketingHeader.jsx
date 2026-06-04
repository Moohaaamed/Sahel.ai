import { useState, useEffect } from 'react';
import { ROUTES } from '../../lib/routes';
import { getSession, clearSession } from '../../lib/session';
import ConsentBanner from '../ConsentBanner';
import SahelLogo from '../SahelLogo';

export default function MarketingHeader() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const handleLogout = (e) => {
    e.preventDefault();
    clearSession();
    setSession(null);
    window.location.href = ROUTES.home;
  };

  return (
    <>
      <header className="bg-background dark:bg-deep-navy sticky top-0 z-50 border-b border-hairline-border dark:border-outline-variant">
        <nav className="flex justify-between items-center w-full px-margin py-xs max-w-7xl mx-auto h-16">
          <div className="flex items-center gap-md">
            <a href={ROUTES.home} className="flex items-center gap-xs no-underline">
              <SahelLogo size={28} textClass="font-headline-sm text-headline-sm font-bold text-on-background dark:text-surface-bright" />
            </a>
            <div className="hidden md:flex gap-md">
              <a className="text-on-surface-variant dark:text-outline-variant font-medium hover:text-primary dark:hover:text-primary-fixed transition-colors font-label-md text-label-md no-underline" href="/" onClick={(e) => { if (window.location.pathname === '/') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}>Solutions</a>
              <a className="text-on-surface-variant dark:text-outline-variant font-medium hover:text-primary dark:hover:text-primary-fixed transition-colors font-label-md text-label-md no-underline" href={ROUTES.about}>
                À propos
              </a>
              <a className="text-on-surface-variant dark:text-outline-variant font-medium hover:text-primary dark:hover:text-primary-fixed transition-colors font-label-md text-label-md no-underline" href={ROUTES.faq}>
                FAQ
              </a>
              <a className="text-on-surface-variant dark:text-outline-variant font-medium hover:text-primary dark:hover:text-primary-fixed transition-colors font-label-md text-label-md no-underline" href={ROUTES.blog}>
                Blog
              </a>
              <a className="text-on-surface-variant dark:text-outline-variant font-medium hover:text-primary dark:hover:text-primary-fixed transition-colors font-label-md text-label-md no-underline" href={ROUTES.contact}>
                Contact
              </a>
            </div>
          </div>
          <div className="flex items-center gap-sm">
            {session?.owner ? (
              <>
                <a href={ROUTES.dashboard} className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors no-underline">
                  Tableau de bord
                </a>
                <button
                  onClick={handleLogout}
                  className="bg-primary text-on-primary px-md py-xs rounded-xl font-label-md text-label-md hover:brightness-90 transition-transform duration-200 active:scale-95 border-0 cursor-pointer"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <a href={ROUTES.login} className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors no-underline">
                  Connexion
                </a>
                <a href={ROUTES.register} className="bg-primary text-on-primary px-md py-xs rounded-xl font-label-md text-label-md hover:brightness-90 transition-transform duration-200 active:scale-95 no-underline">
                  S&apos;inscrire
                </a>
              </>
            )}
          </div>
        </nav>
      </header>
      <ConsentBanner />
    </>
  );
}
