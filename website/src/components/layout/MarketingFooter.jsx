import { ROUTES } from '../../lib/routes';
import SahelLogo from '../SahelLogo';
import { useLanguage } from '../../i18n';

export default function MarketingFooter() {
  const { t } = useLanguage();
  return (
    <footer className="bg-on-background dark:bg-deep-navy w-full py-lg px-margin border-t border-hairline-border">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
        <div>
          <a href={ROUTES.home} className="inline-flex items-center gap-2 no-underline">
            <SahelLogo size={28} textClass="font-headline-sm text-headline-sm font-bold text-surface-bright" />
          </a>
          <p className="font-label-sm text-label-sm text-outline-variant mt-2">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
        <div className="flex gap-md flex-wrap justify-center pl-0">
          <a className="font-body-md text-body-md text-outline-variant hover:text-surface-bright transition-opacity no-underline" href={ROUTES.privacy}>
            {t('footer.privacy')}
          </a>
          <a className="font-body-md text-body-md text-outline-variant hover:text-surface-bright transition-opacity no-underline" href={ROUTES.terms}>
            {t('footer.terms')}
          </a>
          <a className="font-body-md text-body-md text-outline-variant hover:text-surface-bright transition-opacity no-underline" href={ROUTES.cookies}>
            {t('footer.cookies')}
          </a>
          <a className="font-body-md text-body-md text-outline-variant hover:text-surface-bright transition-opacity no-underline" href={ROUTES.contact}>
            {t('footer.contact')}
          </a>
          <a className="font-body-md text-body-md text-outline-variant hover:text-surface-bright transition-opacity no-underline" href={ROUTES.about}>
            {t('footer.about')}
          </a>
        </div>
      </div>
    </footer>
  );
}
