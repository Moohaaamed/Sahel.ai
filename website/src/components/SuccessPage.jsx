import { useEffect, useState, useMemo } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { ROUTES, loginUrl } from '../lib/routes';
import { getLastBusiness, getSession } from '../lib/session';
import SahelLogo from './SahelLogo';
import { useLanguage, LanguageSwitcher } from '../i18n';

function cleanPhone(val) {
  return (val || '').replace(/[^\d+]/g, '');
}

function buildWhatsAppShareUrl(phone, message) {
  const digits = cleanPhone(phone).replace(/^\+/, '');
  const text = encodeURIComponent(message);
  if (!digits) {
    return text ? `https://wa.me/?text=${text}` : null;
  }
  return `https://wa.me/${digits}${text ? `?text=${text}` : ''}`;
}

export default function SuccessPage() {
  const { t } = useLanguage();
  const session = getSession();
  const [business] = useState(() => getLastBusiness());
  const [toast, setToast] = useState('');
  const [accordionOpen, setAccordionOpen] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  useEffect(() => {
    if (!session?.owner) {
      window.location.replace(loginUrl(ROUTES.success));
      return;
    }
    if (!business) {
      window.location.replace(ROUTES.onboarding);
    }
  }, [session?.owner, business]);

  const sitePath = business?.site_url || (business?.slug ? `/b/${business.slug}` : '');
  const siteUrl = business ? `${origin}${sitePath}` : '';
  const displayLink = business
    ? `${window.location.host}${sitePath}`.replace(/^www\./, '')
    : '';

  const widgetSnippet = useMemo(() => {
    if (!business) return '';
    const businessId = business.id || business.slug;
    return `<script src="${origin}/widget.js" async></script>\n<sahel-chat business-id="${businessId}"></sahel-chat>`;
  }, [business, origin]);

  const whatsAppShareUrl = useMemo(() => {
    if (!business) return null;
    const message = `Bonjour, découvrez notre nouveau concierge virtuel ici : ${siteUrl}`;
    return buildWhatsAppShareUrl(business.owner_phone, message);
  }, [business, siteUrl]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const copyText = async (value, message = t('common.copied')) => {
    try {
      await navigator.clipboard.writeText(value);
      showToast(message);
    } catch {
      const input = document.createElement('textarea');
      input.value = value;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      showToast(message);
    }
  };

  const downloadQr = () => {
    const canvas = document.getElementById('success-qr-code');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const link = document.createElement('a');
    link.href = pngUrl;
    link.download = `${business.slug}-qr-code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t('success.qrDownloaded'));
  };

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-warm-bg font-body-md text-on-background min-h-screen page-enter">
      <header className="bg-background border-b border-hairline-border fixed top-0 w-full z-50">
        <div className="flex justify-between items-center px-gutter py-4 w-full max-w-7xl mx-auto">
          <a href={ROUTES.home} className="no-underline">
            <SahelLogo size={28} textClass="font-headline-sm text-headline-sm italic text-on-background" />
          </a>
          <div className="flex gap-md items-center">
            <a
              href={ROUTES.contact}
              className="text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors no-underline"
            >
                {t('footer.support')}
            </a>
            <a
              href={ROUTES.dashboard}
              className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg active:scale-95 duration-100 no-underline"
            >
              {t('nav.dashboard')}
            </a>
          </div>
        </div>
      </header>

      <main className="pt-[120px] pb-xl px-gutter max-w-5xl mx-auto">
        <section className="py-lg text-center">
          <div className="mb-sm flex justify-center">
            <div className="w-20 h-20 bg-surface-blue flex items-center justify-center rounded-full text-primary">
              <span
                className="material-symbols-outlined !text-5xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                task_alt
              </span>
            </div>
          </div>
          <h1 className="font-display-lg text-display-lg text-on-surface mb-xs m-0">
            {t('success.title')}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto m-0">
            {t('success.subtitle', { name: business.name })}
          </p>
          <div className="mt-lg flex flex-col sm:flex-row justify-center gap-sm">
            <a
              href={sitePath}
              target="_blank"
              rel="noreferrer"
              className="btn-primary-ui px-lg py-3 font-label-md text-label-md flex items-center justify-center gap-xs no-underline"
            >
              <span className="material-symbols-outlined">visibility</span>
              {t('success.viewSite')}
            </a>
            <a
              href={ROUTES.dashboard}
              className="btn-outline-ui px-lg py-3 font-label-md text-label-md text-on-surface flex items-center justify-center gap-xs no-underline"
            >
              <span className="material-symbols-outlined">edit</span>
              {t('success.editResponses')}
            </a>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md">
          <div className="lg:col-span-7 space-y-md">
            <div className="flat-card p-md">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-sm m-0">
                {t('success.shareLink')}
              </h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-xs">
                <input
                  className="w-full bg-surface-container-low border-hairline-border border rounded px-sm py-3 font-body-md text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  readOnly
                  type="text"
                  value={displayLink}
                  onFocus={(e) => e.target.select()}
                />
                <button
                  type="button"
                  className="btn-primary-ui px-md py-3 font-label-md text-label-md whitespace-nowrap"
                  onClick={() => copyText(siteUrl)}
                >
                  {t('success.copyLink')}
                </button>
              </div>
            </div>

            <div className="flat-card p-md">
              <div className="flex flex-col md:flex-row gap-md">
                <div className="md:w-1/3 flex flex-col items-center gap-sm bg-surface-container-low p-sm rounded border border-hairline-border">
                  <div className="bg-white p-2 rounded shadow-sm">
                    <QRCodeCanvas id="success-qr-code" value={siteUrl} size={128} includeMargin />
                  </div>
                  <span className="font-label-sm text-label-sm text-center">{business.name}</span>
                </div>
                <div className="md:w-2/3">
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs m-0">{t('success.qrKit')}</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant mb-md m-0">
                    {t('success.qrDesc')}
                  </p>
                  <ul className="space-y-xs mb-md list-none p-0 m-0">
                    <li className="flex items-start gap-xs font-body-md text-body-md text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                      <span>{t('success.qrBusinessCard')}</span>
                    </li>
                    <li className="flex items-start gap-xs font-body-md text-body-md text-on-surface">
                      <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
                      <span>{t('success.qrBedside')}</span>
                    </li>
                  </ul>
                  <button
                    type="button"
                    className="btn-outline-ui w-full py-3 font-label-md text-label-md flex items-center justify-center gap-xs"
                    onClick={downloadQr}
                  >
                    <span className="material-symbols-outlined">download</span>
                    {t('success.downloadQr')}
                  </button>
                </div>
              </div>
            </div>

            <div className="flat-card p-md border-secondary/20 bg-secondary/5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-md">
                <div className="p-3 bg-secondary rounded-full text-white shrink-0">
                  <span className="material-symbols-outlined">send</span>
                </div>
                <div className="flex-grow min-w-0">
                  <h3 className="font-label-md text-label-md text-secondary uppercase tracking-wider mb-base m-0">
                    {t('success.directContact')}
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant m-0">
                    {t('success.directContactDesc')}
                    {business.owner_phone ? (
                      <>
                        {' '}
                        (<span className="font-medium text-on-surface">{business.owner_phone}</span>).
                      </>
                    ) : (
                      '.'
                    )}
                  </p>
                </div>
                {whatsAppShareUrl ? (
                  <a
                    href={whatsAppShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-secondary text-white px-md py-3 rounded-[6px] font-label-md text-label-md hover:bg-[#005a41] flex items-center gap-xs transition-colors no-underline whitespace-nowrap shrink-0"
                  >
                    {t('success.shareWhatsapp')}
                  </a>
                ) : (
                  <span className="font-label-sm text-label-sm text-outline">
                    {t('success.whatsappHint')}
                  </span>
                )}
              </div>
            </div>

            <div className="flat-card overflow-hidden">
              <button
                type="button"
                className="w-full p-md flex items-center justify-between hover:bg-surface-container-lowest transition-colors border-0 bg-transparent cursor-pointer"
                onClick={() => setAccordionOpen((open) => !open)}
                aria-expanded={accordionOpen}
              >
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-on-surface-variant">code</span>
                  <span className="font-label-md text-label-md text-on-surface uppercase tracking-wider">
                    {t('success.integration')}
                  </span>
                </div>
                <span
                  className={`material-symbols-outlined transition-transform duration-200 ${
                    accordionOpen ? 'rotate-180' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>
              {accordionOpen ? (
                <div className="px-md pb-md">
                  <p className="font-body-md text-body-md text-on-surface-variant mb-md m-0">
                    {t('success.integrationDesc')}
                  </p>
                  <div className="bg-deep-navy p-md rounded border border-hairline-border relative group">
                    <code className="font-mono text-[12px] text-primary-fixed block leading-relaxed break-all whitespace-pre-wrap">
                      {widgetSnippet}
                    </code>
                    <button
                      type="button"
                      className="absolute top-2 right-2 p-1 text-outline-variant hover:text-white transition-colors border-0 bg-transparent cursor-pointer"
                      onClick={() => copyText(widgetSnippet, t('common.copied'))}
                      aria-label={t('common.copy')}
                    >
                      <span className="material-symbols-outlined text-[20px]">content_copy</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-md">
            <div className="flat-card flex flex-col">
              <div className="bg-primary/5 flex items-center justify-center py-lg px-md min-h-[200px]">
                <div className="relative group/phone w-[104px] h-[188px] shrink-0 bg-white rounded-xl shadow-lg border border-hairline-border p-2">
                  <div className="h-3 w-10 bg-surface-container-high rounded-full mx-auto mb-1" />
                  <div className="space-y-1 px-0.5">
                    <div className="h-1.5 w-full bg-surface-blue rounded" />
                    <div className="h-1.5 w-3/4 bg-surface-blue rounded" />
                    <div className="mt-2 h-16 w-full bg-surface-container-low rounded flex items-center justify-center">
                      <span className="material-symbols-outlined text-outline-variant text-2xl">chat</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full bg-surface-blue rounded" />
                  </div>
                  <a
                    href={sitePath}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute inset-0 rounded-xl bg-primary/10 opacity-0 group-hover/phone:opacity-100 transition-opacity flex items-center justify-center no-underline z-10"
                  >
                    <span className="bg-white text-primary px-sm py-1 rounded-full font-label-sm text-label-sm shadow-sm">
                      {t('success.previewSite')}
                    </span>
                  </a>
                </div>
              </div>
              <div className="p-md text-center border-t border-hairline-border bg-white relative z-20">
                <p className="font-label-sm text-label-sm text-on-surface-variant m-0 mb-xs">
                  {t('success.responsive')}
                </p>
                <a
                  href={sitePath}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-label-sm text-label-sm hover:underline no-underline"
                >
                  {t('success.previewSite')}
                </a>
              </div>
            </div>

            <div className="flat-card p-md bg-white border-primary/20 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
              <div className="relative">
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs m-0">
                  {t('success.manageConversations')}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-md m-0">
                  {t('success.manageConversationsDesc')}
                </p>
                <a
                  href={ROUTES.dashboard}
                  className="btn-primary-ui w-full py-3 font-label-md text-label-md flex items-center justify-center no-underline"
                >
                  {t('success.goToDashboard')}
                </a>
              </div>
            </div>

            <div className="p-md text-center">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-xs m-0">
                {t('success.needHelp')}
              </p>
              <a
                className="text-primary font-label-sm text-label-sm hover:underline no-underline"
                href={ROUTES.contact}
              >
                {t('success.helpCenter')}
              </a>
            </div>
          </div>
        </div>
      </main>

      {toast ? (
        <div
          className="fixed bottom-md left-1/2 -translate-x-1/2 bg-on-surface text-surface px-md py-2 rounded-full font-label-sm text-label-sm toast-enter z-[60]"
          role="status"
        >
          {toast}
        </div>
      ) : null}

      <footer className="bg-surface border-t border-hairline-border mt-xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter px-gutter py-lg max-w-7xl mx-auto">
          <div className="col-span-2 md:col-span-1">
            <span className="block mb-sm">
              <SahelLogo size={28} textClass="font-headline-sm italic text-on-surface" />
            </span>
            <p className="text-on-surface-variant font-label-sm text-label-sm m-0">
              {t('success.digitalization')}
            </p>
          </div>
          <div>
            <h4 className="font-label-md text-label-md text-on-surface mb-sm m-0">{t('footer.product')}</h4>
            <ul className="space-y-xs list-none p-0 m-0">
              <li>
                <a className="text-on-surface-variant font-body-md text-body-md hover:text-primary underline" href="/#fonctionnalites">
                  {t('footer.chatbot')}
                </a>
              </li>
              <li>
                <a className="text-on-surface-variant font-body-md text-body-md hover:text-primary underline" href="/#fonctionnalites">
                  {t('footer.integrations')}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-label-md text-label-md text-on-surface mb-sm m-0">{t('footer.company')}</h4>
            <ul className="space-y-xs list-none p-0 m-0">
              <li>
                <a className="text-on-surface-variant font-body-md text-body-md hover:text-primary underline" href={ROUTES.about}>
                  {t('footer.about')}
                </a>
              </li>
              <li>
                <a className="text-on-surface-variant font-body-md text-body-md hover:text-primary underline" href={ROUTES.contact}>
                  {t('footer.contact')}
                </a>
              </li>
            </ul>
          </div>
          <div className="col-span-2 md:col-span-4 mt-md border-t border-hairline-border pt-md flex flex-col sm:flex-row justify-between gap-sm">
            <span className="text-on-surface-variant font-label-sm text-label-sm">{t('footer.copyright', { year: new Date().getFullYear() })}</span>
            <div className="flex gap-md items-center">
              <a className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary no-underline" href={ROUTES.terms}>
                {t('footer.legal')}
              </a>
              <a className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary no-underline" href={ROUTES.contact}>
              {t('footer.support')}
              </a>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
