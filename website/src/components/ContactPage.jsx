import { useState } from 'react';
import { ROUTES } from '../lib/routes';
import { API_URL } from '../config';
import { useLanguage } from '../i18n';
import MarketingHeader from './layout/MarketingHeader';
import MarketingFooter from './layout/MarketingFooter';
import InteractiveDots from './InteractiveDots';

export default function ContactPage() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      console.warn('Contact form validation failed');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      setSubmitted(true);
    } catch (e) {
      console.error('Contact form submit failed:', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="text-on-surface min-h-screen flex flex-col page-enter relative">
      <InteractiveDots
        color="rgba(0, 94, 164, 0.4)"
        count={350}
      />
      <div className="relative z-10 flex flex-col min-h-screen">
        <MarketingHeader />
        
        <section className="flex-1 flex items-center justify-center py-xl px-margin">
          <div className="max-w-xl w-full mx-auto bg-white/95 backdrop-blur-sm rounded-2xl border border-hairline-border p-md md:p-lg shadow-2xl hover:border-primary/30 transition-colors relative">
            <a href={ROUTES.home} className="inline-flex items-center gap-xs text-on-surface-variant font-label-md no-underline hover:text-primary mb-md">
              <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
              {t('common.backToHome')}
            </a>
            
            {submitted ? (
              <div className="text-center py-lg animate-fade-in flex flex-col items-center gap-md">
                <div className="w-16 h-16 bg-surface-blue rounded-full flex items-center justify-center text-primary mb-xs">
                  <span className="material-symbols-outlined !text-[36px]">check_circle</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface m-0">{t('contact.success')}</h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-sm m-0">
                  {t('contact.successDesc', { email })}
                </p>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    setName('');
                    setEmail('');
                    setMessage('');
                  }}
                  className="mt-md bg-primary hover:bg-primary-container text-on-primary font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95 text-center font-label-md text-label-md border-0 cursor-pointer"
                >
                  {t('contact.sendAnother')}
                </button>
              </div>
            ) : (
              <>
                <h1 className="font-display-lg text-display-lg mt-md mb-md">{t('contact.title')}</h1>
                <p className="font-body-md text-body-md text-on-surface-variant mb-lg leading-relaxed text-left">
                  {t('contact.subtitle')}
                </p>
                
                <form onSubmit={handleSubmit} className="grid gap-md">
                  <label className="grid gap-xs text-on-surface font-semibold text-label-md text-left">
                    {t('contact.fullName')}
                    <input 
                      type="text" 
                      placeholder={t('contact.namePlaceholder')} 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-body-md bg-transparent"
                    />
                  </label>
                  <label className="grid gap-xs text-on-surface font-semibold text-label-md text-left">
                    {t('contact.email')}
                    <input 
                      type="email" 
                      placeholder={t('contact.emailPlaceholder')} 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-body-md bg-transparent"
                    />
                  </label>
                  <label className="grid gap-xs text-on-surface font-semibold text-label-md text-left">
                    {t('contact.message')}
                    <textarea 
                      rows="4" 
                      placeholder={t('contact.messagePlaceholder')} 
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-body-md bg-transparent resize-y text-left"
                    />
                  </label>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="bg-primary hover:bg-primary-container text-on-primary font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/10 transition-all active:scale-95 text-center font-label-md text-label-md border-0 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {t('common.sending') || 'Sending...'}
                      </span>
                    ) : t('contact.submit')}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>

        <MarketingFooter />
      </div>
    </div>
  );
}
