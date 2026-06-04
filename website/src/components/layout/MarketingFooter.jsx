import { ROUTES } from '../../lib/routes';
import SahelLogo from '../SahelLogo';

export default function MarketingFooter() {
  return (
    <footer className="bg-on-background dark:bg-deep-navy w-full py-lg px-margin border-t border-hairline-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
        <div>
          <a href={ROUTES.home} className="inline-flex items-center gap-2 no-underline">
            <SahelLogo size={28} textClass="font-headline-sm text-headline-sm font-bold text-surface-bright" />
          </a>
          <p className="font-label-sm text-label-sm text-outline-variant mt-2">© 2026 Sahel.ai. Made for Moroccan SMEs.</p>
        </div>
        <div className="flex gap-md flex-wrap justify-center pl-0">
          <a className="font-body-md text-body-md text-outline-variant hover:text-surface-bright transition-opacity no-underline" href={ROUTES.privacy}>
            Confidentialité
          </a>
          <a className="font-body-md text-body-md text-outline-variant hover:text-surface-bright transition-opacity no-underline" href={ROUTES.terms}>
            Conditions
          </a>
          <a className="font-body-md text-body-md text-outline-variant hover:text-surface-bright transition-opacity no-underline" href={ROUTES.cookies}>
            Cookies
          </a>
          <a className="font-body-md text-body-md text-outline-variant hover:text-surface-bright transition-opacity no-underline" href={ROUTES.contact}>
            Contact
          </a>
          <a className="font-body-md text-body-md text-outline-variant hover:text-surface-bright transition-opacity no-underline" href={ROUTES.about}>
            À propos
          </a>
        </div>
      </div>
    </footer>
  );
}
