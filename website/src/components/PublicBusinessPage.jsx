let msgIdCounter = 0;

import { useState, useEffect, useRef, useCallback } from 'react';
import { API_URL } from '../config';
import { buildLocationLabel, buildTelUrl, buildWhatsAppUrl, coverImageUrl, formatBusinessType, resolveBusinessPhone, parseAmenities } from '../lib/businessSite';
import { enrichBusiness } from '../lib/miniSiteProfile';
import { ROUTES } from '../lib/routes';
import MiniSiteProfileSections from './MiniSiteProfileSections';
import SahelLogo from './SahelLogo';
import { useLanguage } from '../i18n';

const HERO_IMAGES = {
  todra:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDjZIu5VBMbcCtzOnstlQ2WBb4n1OeoKFbT4CgWdIWkSFUtlqJflFCOmmKNIQnwAPBSAkzns66nIB2eccLPMJF-1ygxoUl5tVPQ2U05cNGuduF7-z5CkQu5H9Infv08A1rSYpxs9QMEYtyKWA5f1al3JUNAJ0c-ArIwFgA3lxwbWCPzDugkQdm6i4cljI6VDyR9AD-LkI0niQPSHtspHtYVd-ix7tJGsRGT8WguL9lDwqzZ03cvS0yCUSnlDy79bsy--ZuLnjd6ZSyq',
};

function getHeroImage(name = '', type = '') {
  const lowerName = name.toLowerCase();
  const lowerType = type.toLowerCase();

  if (lowerName.includes('todra') || lowerName.includes('gorge') || lowerName.includes('saghro')) {
    return HERO_IMAGES.todra;
  }
  if (lowerType.includes('hotel') || lowerType.includes('riad') || lowerType.includes('tourism') || lowerType.includes('gite')) {
    return 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=1200';
  }
  if (lowerType.includes('retail') || lowerType.includes('shop') || lowerType.includes('store') || lowerType.includes('boutique') || lowerType.includes('commerce')) {
    return 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1200';
  }
  if (lowerType.includes('restaurant') || lowerType.includes('cafe') || lowerType.includes('food')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200';
  }
  return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200';
}

function getBadgeLabel(type = '') {
  const formatted = formatBusinessType(type);
  if (formatted) return formatted;
  const t = type.toLowerCase();
  if (t.includes('hotel') || t.includes('riad')) return 'Hôtel / Riad';
  if (t.includes('restaurant') || t.includes('cafe')) return 'Restaurant / Café';
  if (t.includes('retail') || t.includes('boutique')) return 'Commerce local';
  return 'Commerce local';
}



function isLoggedIn() {
  try {
    const raw = localStorage.getItem('sahelOwnerSession');
    if (!raw) return false;
    const session = JSON.parse(raw);
    return session?.owner && session?.token;
  } catch { return false; }
}

export default function PublicBusinessPage({ slug }) {
  const [business, setBusiness] = useState(null);
  const [status, setStatus] = useState('loading');
  const [loggedIn] = useState(isLoggedIn);
  const convStorageKey = `sahel_pbp_conv_${slug}`;
  const [conversationId, setConversationId] = useState(() => {
    try { return localStorage.getItem(convStorageKey) || null; } catch { return null; }
  });
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);
  const chatAbortRef = useRef(null);
  const { t, lang } = useLanguage();

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/businesses/${slug}`, { signal: controller.signal })
      .then((response) => {
        if (response.status === 404) throw new Error('not-found');
        if (!response.ok) throw new Error('error');
        return response.json();
      })
      .then((data) => {
        const enriched = enrichBusiness(data);
        setBusiness(enriched);
        setStatus('ready');
        setMessages([
          {
            id: 'welcome',
            text: t('chat.welcomeBusiness', { name: enriched.name }),
            sender: 'bot',
          },
        ]);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setStatus(err.message === 'not-found' ? 'not-found' : 'error');
      });
    return () => controller.abort();
  }, [slug, t]);

  useEffect(() => {
    if (business && messages.length > 0 && messages[0]?.id === 'welcome') {
      setMessages((prev) => {
        const updated = [...prev];
        updated[0] = { ...updated[0], text: t('chat.welcomeBusiness', { name: business.name }) };
        return updated;
      });
    }
  }, [lang, business, messages, t]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollTop = chatEndRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  useEffect(() => {
    if (business?.cover_image_url) {
      const img = new Image();
      img.src = coverImageUrl(business);
    }
  }, [business?.cover_image_url, business]);

  useEffect(() => {
    return () => chatAbortRef.current?.abort();
  }, []);

  const handleSendMessage = useCallback(async (textToSend) => {
    const queryText = (textToSend || chatInput).trim();
    if (!queryText || chatLoading) return;

    const userMsg = { id: `${Date.now()}_${++msgIdCounter}-user`, text: queryText, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setChatLoading(true);

    chatAbortRef.current?.abort();
    const controller = new AbortController();
    chatAbortRef.current = controller;

    try {
      const res = await fetch(`${API_URL}/businesses/${business.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: queryText,
          conversation_id: conversationId,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error('chat-error');
      const data = await res.json();
      setConversationId(data.conversation_id);
      try { localStorage.setItem(convStorageKey, data.conversation_id); } catch { /* noop */ }
      const botMsg = { id: `${Date.now()}_${++msgIdCounter}-bot`, text: data.answer, sender: 'bot' };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      if (e.name === 'AbortError') return;
      const errMsg = { id: `${Date.now()}_${++msgIdCounter}-err`, text: t('chat.error'), sender: 'bot' };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, t, business?.id, conversationId, convStorageKey]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg text-on-surface">
        <div className="flex flex-col items-center gap-sm">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-label-md">{t('publicBusiness.loading')}</p>
        </div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg text-on-surface">
        <div className="text-center space-y-sm">
          <span className="material-symbols-outlined !text-[48px] text-error">error</span>
          <h1 className="font-headline-md text-headline-md font-bold">{t('publicBusiness.notFound')}</h1>
          <p className="text-on-surface-variant">{t('publicBusiness.notFoundDesc')}</p>
          <a href={ROUTES.home} className="inline-block bg-primary text-white px-md py-xs rounded no-underline">
            {t('common.backToHome')}
          </a>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg text-on-surface">
        <div className="text-center space-y-sm">
          <span className="material-symbols-outlined !text-[48px] text-warning">cloud_off</span>
          <h1 className="font-headline-md text-headline-md font-bold">{t('common.error')}</h1>
          <p className="text-on-surface-variant">A server error occurred. Please try again later.</p>
          <button onClick={() => window.location.reload()} aria-label={t('common.retry')} className="inline-block bg-primary text-white px-md py-xs rounded no-underline border-0 cursor-pointer">
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  const heroSrc = coverImageUrl(business, getHeroImage);
  const locationLabel = buildLocationLabel(business);
  const contactPhone = resolveBusinessPhone(business);
  const contactMessage = t('publicBusiness.contactMessage', { name: business.name });
  const telLink =
    buildTelUrl(contactPhone) ||
    (business.owner_email ? `mailto:${business.owner_email}?subject=${encodeURIComponent(`Contact — ${business.name}`)}` : '');
  const waLink = buildWhatsAppUrl(contactPhone, contactMessage);

  const conciergeShort = (business.name || 'Business').split(/\s+/).slice(0, 1).join(' ');

  return (
    <div className="bg-background text-on-background font-body-md antialiased min-h-screen overflow-x-hidden">
      <header className="bg-white/70 backdrop-blur-xl border-b border-hairline-border fixed top-0 w-full z-50 transition-all duration-300">
        <div className="flex justify-between items-center px-margin py-4 max-w-7xl mx-auto w-full">
          <a href={ROUTES.home} className="no-underline">
            <SahelLogo size={28} textClass="font-headline-sm text-xl font-bold tracking-tight text-deep-navy" />
          </a>
          {loggedIn ? (
            <a href={ROUTES.dashboard} className="bg-primary text-white px-6 py-2.5 rounded-full font-label-md text-sm hover:brightness-110 transition-all active:scale-95 shadow-lg shadow-primary/20 no-underline">
              {t('nav.dashboard')}
            </a>
          ) : (
            <a href={ROUTES.login} className="bg-deep-navy text-white px-6 py-2.5 rounded-full font-label-md text-sm hover:bg-primary transition-all active:scale-95 shadow-lg shadow-deep-navy/10 no-underline">
              {t('nav.login')}
            </a>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        {/* Section 1: Full-bleed Hero */}
        <section className="relative h-screen min-h-[600px] flex flex-col justify-end px-margin overflow-hidden">
          <img
            className="absolute inset-0 w-full h-full object-cover z-0"
            alt={business.name}
            src={heroSrc}
            width="1600" height="900"
          />
          <div className="absolute inset-0 hero-gradient z-10" />
          <div className="relative z-20 max-w-2xl mb-xl reveal">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-4 py-1 rounded-full font-label-sm text-[10px] uppercase tracking-[0.2em]">
                {getBadgeLabel(business.business_type)}
              </span>
              <div className="h-px w-8 bg-white/30" />
              <span className="text-white/80 font-label-sm text-xs tracking-wide">{locationLabel || 'Maroc'}</span>
            </div>
            <h1 className="font-display-lg text-5xl md:text-7xl text-white italic tracking-tighter leading-[0.9] mb-8">
              {business.name}
            </h1>
            <p className="text-white/80 font-body-lg text-lg md:text-xl leading-relaxed max-w-lg mb-10 font-light">
              {business.description || t('publicBusiness.defaultDescription')}
            </p>
            <div className="flex gap-4">
              {telLink && (
                <a href={telLink} className="bg-white text-deep-navy px-8 py-4 rounded-full font-label-md hover:bg-primary hover:text-white transition-all shadow-xl active:scale-95 no-underline">
                  {t('publicBusiness.contactUs')}
                </a>
              )}
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label={t('publicBusiness.whatsapp')} className="bg-[#25D366] text-white px-8 py-4 rounded-full font-label-md hover:opacity-90 transition-all shadow-xl active:scale-95 no-underline flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">chat</span> {t('publicBusiness.whatsapp')}
                </a>
              )}
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 opacity-50">
            <span className="font-label-sm text-[10px] text-white uppercase tracking-widest">{t('publicBusiness.scroll')}</span>
            <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
          </div>
        </section>

        {/* Concierge AI Module */}
        <section id="conciergerie" className="px-margin -mt-16 relative z-30 reveal" style={{ animationDelay: '0.2s' }}>
          <div className="bg-deep-navy rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            <div className="flex flex-col md:flex-row h-full">
              {/* Branding/Status Side */}
              <div className="md:w-1/3 bg-white/[0.03] p-lg border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between">
                <div>
                  <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
                  </div>
                  <h2 className="text-white font-headline-md text-3xl mb-2">{t('publicBusiness.concierge', { name: conciergeShort })}</h2>
                  <p className="text-white/50 font-body-md leading-relaxed">{t('publicBusiness.conciergeDesc')}</p>
                </div>
                <div className="mt-8 flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75 animate-ping" style={{ animationIterationCount: 3 }} />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary" />
                  </span>
                  <span className="text-secondary font-label-sm text-xs uppercase tracking-widest">{t('publicBusiness.onlineReady')}</span>
                </div>
              </div>
              {/* Chat Side */}
              <div className="flex-1 p-lg flex flex-col h-[500px]">
                <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pb-6" ref={chatEndRef}>
                  {messages.map((msg) =>
                    msg.sender === 'user' ? (
                      <div key={msg.id} className="flex justify-end">
                        <div className="bg-primary p-5 rounded-2xl rounded-tr-none text-white font-body-md max-w-[85%] shadow-xl shadow-primary/20 border border-white/10">
                          {msg.text}
                        </div>
                      </div>
                    ) : (
                      <div key={msg.id} className="flex gap-4 max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                        </div>
                        <div className="flex-1 bg-white/5 backdrop-blur-sm p-5 rounded-2xl rounded-tl-none border border-white/10 chat-bubble-shadow">
                          <p className="text-white/90 font-body-md text-base leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    ),
                  )}
                  {chatLoading && (
                    <div className="flex gap-4 max-w-[85%]">
                      <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white text-sm">smart_toy</span>
                      </div>
                      <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl rounded-tl-none border border-white/10">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  {!chatLoading && messages.length <= 1 && (
                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleSendMessage(t('publicBusiness.chatSuggestion.hours'))}
                        aria-label={t('publicBusiness.chatSuggestion.hours')}
                        className="bg-primary/20 border border-primary/40 text-primary-fixed-dim px-5 py-2.5 rounded-full font-label-md text-sm hover:bg-primary/40 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        {t('publicBusiness.chatSuggestion.hours')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage(t('publicBusiness.chatSuggestion.location'))}
                        aria-label={t('publicBusiness.chatSuggestion.location')}
                        className="bg-white/5 border border-white/10 text-white/80 px-5 py-2.5 rounded-full font-label-md text-sm hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        {t('publicBusiness.chatSuggestion.location')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage(t('publicBusiness.chatSuggestion.booking'))}
                        aria-label={t('publicBusiness.chatSuggestion.booking')}
                        className="bg-white/5 border border-white/10 text-white/80 px-5 py-2.5 rounded-full font-label-md text-sm hover:bg-white/10 transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-sm">event</span>
                        {t('publicBusiness.chatSuggestion.booking')}
                      </button>
                    </div>
                  )}
                </div>
                {/* Input Area */}
                <div className="relative pt-6 border-t border-white/10">
                  <textarea
                    className="w-full bg-white/5 border-none rounded-2xl py-5 px-6 text-white placeholder:text-white/30 focus:ring-2 focus:ring-primary/50 transition-all resize-none font-body-md outline-none"
                    placeholder={t('publicBusiness.chatPlaceholder')}
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={chatLoading}
                  />
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={chatLoading || !chatInput.trim()}
                    aria-label={t('chat.send')}
                    className="absolute right-3 top-[calc(50%+12px)] -translate-y-1/2 w-12 h-12 bg-primary hover:bg-primary-container text-white rounded-xl flex items-center justify-center transition-all shadow-lg active:scale-95 cursor-pointer border-0 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Sections from MiniSiteProfileSections */}
        <div className="px-margin py-xl">
          <MiniSiteProfileSections business={business} />
        </div>

        {/* Amenities Strip */}
        {parseAmenities(business.highlights).length > 0 && (
          <section className="px-margin pb-xl">
            <div className="bg-white rounded-3xl p-8 border border-hairline-border flex flex-wrap justify-center gap-xl md:gap-24">
              {parseAmenities(business.highlights).map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center transition-transform hover:scale-110">
                    <span className="material-symbols-outlined text-primary text-2xl">{item.icon}</span>
                  </div>
                  <span className="font-label-sm text-[11px] uppercase tracking-widest text-outline">{item.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Practical Info */}
        <section className="px-margin py-xl bg-surface-container-lowest">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-xl">
            <div className="space-y-xl">
              <div>
                <h2 className="font-headline-md text-4xl mb-2 italic">{t('publicBusiness.practicalInfo')}</h2>
                <div className="h-1 w-20 bg-primary/20 mb-8" />
                <div className="space-y-0">
                  {business.working_hours && (
                    <div className="flex items-center justify-between py-6 border-b border-hairline-border group">
                      <span className="font-label-md text-on-surface-variant flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">schedule</span>
                        {t('publicBusiness.openingHours')}
                      </span>
                      <span className="font-body-md font-semibold text-deep-navy">{business.working_hours}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-6 border-b border-hairline-border group">
                    <span className="font-label-md text-on-surface-variant flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">calendar_today</span>
                      {t('publicBusiness.serviceDays')}
                    </span>
                    <span className="font-body-md font-semibold text-deep-navy">{t('publicBusiness.everyday')}</span>
                  </div>
                  {locationLabel && (
                    <div className="flex items-start justify-between py-6 border-b border-hairline-border group">
                      <span className="font-label-md text-on-surface-variant flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">location_on</span>
                        {t('publicBusiness.address')}
                      </span>
                      <span className="font-body-md font-semibold text-deep-navy text-right max-w-[240px]">{locationLabel}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Contact & Info Card */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl border border-hairline-border overflow-hidden shadow-2xl">
                <div className="h-32 bg-gradient-to-br from-primary/10 via-surface-blue to-secondary/5 relative flex items-end p-6">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300467c' fill-opacity='1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }} />
                  <div className="relative z-10">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-3">
                      <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>contact_support</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface m-0">{t('publicBusiness.contactAccess')}</h3>
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  {business.working_hours && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-lg">schedule</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-caption text-caption text-on-surface-variant m-0 uppercase tracking-wider">{t('publicBusiness.schedule')}</p>
                        <p className="font-body-md text-body-md text-on-surface font-medium m-0 truncate">{business.working_hours}</p>
                      </div>
                    </div>
                  )}
                  {locationLabel && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary/5 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-secondary text-lg">location_on</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-caption text-caption text-on-surface-variant m-0 uppercase tracking-wider">{t('publicBusiness.address')}</p>
                        <p className="font-body-md text-body-md text-on-surface font-medium m-0 truncate">{locationLabel}</p>
                      </div>
                    </div>
                  )}
                  {contactPhone && (
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#25D366] text-lg">call</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-caption text-caption text-on-surface-variant m-0 uppercase tracking-wider">{t('publicBusiness.phone')}</p>
                        <p className="font-body-md text-body-md text-on-surface font-medium m-0 truncate">{contactPhone}</p>
                      </div>
                    </div>
                  )}
                  <div className="pt-3 border-t border-hairline-border flex gap-3">
                    {waLink && (
                      <a href={waLink} target="_blank" rel="noopener noreferrer" aria-label={t('publicBusiness.whatsapp')} className="flex-1 bg-[#25D366] text-white py-3 rounded-xl flex items-center justify-center gap-2 font-label-sm text-label-sm hover:brightness-110 transition-all active:scale-95 no-underline shadow-lg shadow-[#25D366]/20">
                        <span className="material-symbols-outlined text-sm">chat</span>
                        {t('publicBusiness.whatsapp')}
                      </a>
                    )}
                    {telLink && (
                      <a href={telLink} aria-label={t('publicBusiness.call')} className="flex-1 bg-deep-navy text-white py-3 rounded-xl flex items-center justify-center gap-2 font-label-sm text-label-sm hover:bg-primary transition-all active:scale-95 no-underline shadow-lg shadow-deep-navy/10">
                        <span className="material-symbols-outlined text-sm">call</span>
                        {t('publicBusiness.call')}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-deep-navy py-xl">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="flex flex-col md:flex-row justify-between items-start gap-xl pb-xl border-b border-white/10">
            <div className="space-y-6">
              <a href={ROUTES.home} className="no-underline">
                <SahelLogo size={32} textClass="font-headline-sm text-2xl font-bold tracking-tight text-white" />
              </a>
              <p className="text-white/40 font-body-md max-w-sm leading-relaxed">
                {t('publicBusiness.footerDesc')}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-xl">
              <div className="space-y-4">
                <h4 className="text-white font-label-md text-xs uppercase tracking-widest">{t('publicBusiness.menu')}</h4>
                <nav className="flex flex-col gap-3">
                  <a className="text-white/40 hover:text-white transition-colors text-sm no-underline" href="/">{t('nav.home')}</a>
                  <a className="text-white/40 hover:text-white transition-colors text-sm no-underline" href={buildWhatsAppUrl(contactPhone, `Bonjour ${business.name}, je souhaite consulter le menu.`)} target="_blank" rel="noopener noreferrer">{t('publicBusiness.menu')}</a>
                  <a className="text-white/40 hover:text-white transition-colors text-sm no-underline" href={buildWhatsAppUrl(contactPhone, `Bonjour ${business.name}, je souhaite effectuer une réservation.`)} target="_blank" rel="noopener noreferrer">{t('publicBusiness.booking')}</a>
                  <a className="text-white/40 hover:text-white transition-colors text-sm no-underline" href="/contact">{t('nav.contact')}</a>
                </nav>
              </div>
              <div className="space-y-4">
                <h4 className="text-white font-label-md text-xs uppercase tracking-widest">{t('publicBusiness.intelligence')}</h4>
                <nav className="flex flex-col gap-3">
                  <a className="text-white/40 hover:text-white transition-colors text-sm no-underline" href="#conciergerie">{t('publicBusiness.conciergerie')}</a>
                </nav>
              </div>
              <div className="space-y-4">
                <h4 className="text-white font-label-md text-xs uppercase tracking-widest">{t('footer.legal')}</h4>
                <nav className="flex flex-col gap-3">
                  <a className="text-white/40 hover:text-white transition-colors text-sm no-underline" href={ROUTES.privacy}>{t('footer.privacy')}</a>
                  <a className="text-white/40 hover:text-white transition-colors text-sm no-underline" href={ROUTES.terms}>{t('footer.terms')}</a>
                </nav>
              </div>
            </div>
          </div>
          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/30 text-xs font-label-sm uppercase tracking-widest">
            <p>© {new Date().getFullYear()} {business.name} — Powered by Sahel.ai</p>
            <div className="flex gap-4">
              {(() => {
                let socialLinks;
                try { socialLinks = JSON.parse(business.social_media || '{}'); } catch { socialLinks = {}; }
                return Object.entries(socialLinks)
                  .filter(([, url]) => url && url.trim())
                  .map(([platform, url]) => (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors no-underline capitalize text-xs">
                      {platform}
                    </a>
                  ));
              })()}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .no-scrollbar::-webkit-scrollbar { width: 4px; }
        .no-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: thin; }
        .hero-gradient {
          background: linear-gradient(to top, rgba(13, 17, 23, 0.95) 0%, rgba(13, 17, 23, 0.4) 50%, rgba(13, 17, 23, 0.1) 100%);
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .reveal { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .chat-bubble-shadow {
          box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1), 0 2px 6px -2px rgba(0, 0, 0, 0.05);
        }
      `}</style>
    </div>
  );
}
