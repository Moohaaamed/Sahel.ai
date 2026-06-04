import { useState, useEffect, useRef } from 'react';
import { API_URL } from '../config';
import { buildLocationLabel, buildTelUrl, buildWhatsAppUrl, coverImageUrl, formatBusinessType, resolveBusinessPhone, parseAmenities } from '../lib/businessSite';
import { enrichBusiness } from '../lib/miniSiteProfile';
import { ROUTES, loginUrl } from '../lib/routes';
import MiniSiteProfileSections from './MiniSiteProfileSections';
import SahelLogo from './SahelLogo';
import MarketingHeader from './layout/MarketingHeader';

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



export default function PublicBusinessPage({ slug }) {
  const [business, setBusiness] = useState(null);
  const [status, setStatus] = useState('loading');
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/businesses/${slug}`)
      .then((response) => {
        if (!response.ok) throw new Error('Business not found');
        return response.json();
      })
      .then((data) => {
        setBusiness(enrichBusiness(data));
        setStatus('ready');
        setMessages([
          {
            id: 'welcome',
            text: `Marhaba! Welcome to ${data.name}. I can help you with bookings, details, or recommendations. How can I assist you today?`,
            sender: 'bot',
          },
        ]);
      })
      .catch(() => setStatus('not-found'));
  }, [slug]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg text-on-surface">
        <div className="flex flex-col items-center gap-sm">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-label-md">Chargement du mini-site...</p>
        </div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg text-on-surface">
        <div className="text-center space-y-sm">
          <span className="material-symbols-outlined !text-[48px] text-error">error</span>
          <h1 className="font-headline-md text-headline-md font-bold">Commerce non trouvé</h1>
          <p className="text-on-surface-variant">L&apos;adresse demandée n&apos;existe pas ou a été déplacée.</p>
          <a href={ROUTES.home} className="inline-block bg-primary text-white px-md py-xs rounded no-underline">
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  const heroSrc = coverImageUrl(business, getHeroImage);
  const locationLabel = buildLocationLabel(business);
  const contactPhone = resolveBusinessPhone(business);
  const contactMessage = `Bonjour ${business.name}, je souhaite plus d'informations.`;
  const telLink =
    buildTelUrl(contactPhone) ||
    (business.owner_email ? `mailto:${business.owner_email}?subject=${encodeURIComponent(`Contact — ${business.name}`)}` : '');
  const waLink = buildWhatsAppUrl(contactPhone, contactMessage);

  const conciergeShort = (business.name || 'Business').split(/\s+/).slice(0, 1).join(' ');
  const showTranslationPill = messages.length > 1;

  const handleSendMessage = async (textToSend) => {
    const queryText = (textToSend || chatInput).trim();
    if (!queryText || chatLoading) return;

    const userMsg = { id: `${Date.now()}-user`, text: queryText, sender: 'user' };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch(`${API_URL}/businesses/${business.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: queryText,
          conversation_id: conversationId,
        }),
      });

      if (!res.ok) throw new Error('API Error');

      const data = await res.json();
      setConversationId(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-bot`, text: data.answer, sender: 'bot' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          text: 'Sorry, I could not connect right now. Please try again.',
          sender: 'bot',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="bg-warm-bg text-on-surface font-body-md antialiased min-h-screen">
      <MarketingHeader />

      <main className="max-w-7xl mx-auto px-margin py-md page-enter">
        <header className="relative bg-surface-container-lowest rounded-xl overflow-hidden border border-hairline-border mb-md group">
          <div className="h-64 md:h-80 w-full relative overflow-hidden">
            <img
              alt={business.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src={heroSrc}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            <div className="absolute bottom-md left-md right-md z-10 flex flex-col md:flex-row md:items-end justify-between gap-md text-white">
              <div>
                <div className="flex flex-wrap items-center gap-xs mb-xs">
                  <span className="bg-primary text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded">
                    {getBadgeLabel(business.business_type)}
                  </span>
                  <span className="flex items-center gap-xs text-sm opacity-90">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {locationLabel}
                  </span>
                </div>
                <h1 className="font-display-lg text-display-lg leading-tight text-white m-0">{business.name}</h1>
                {/* Visual quality badges row */}
                {parseAmenities(business.highlights).length > 0 && (
                  <div className="flex flex-wrap gap-xs mt-sm animate-fade-in">
                    {parseAmenities(business.highlights).map((item) => (
                      <span key={item.label} className="inline-flex items-center gap-1.5 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full font-label-sm text-[11px] text-white border border-white/10 shadow-sm transition-transform hover:scale-105 duration-200 select-none">
                        <span className="material-symbols-outlined text-[15px] text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {item.icon}
                        </span>
                        {item.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-sm shrink-0">
                <a
                  href={telLink || '#concierge'}
                  onClick={
                    telLink
                      ? undefined
                      : (event) => {
                          event.preventDefault();
                          document.getElementById('concierge')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                  }
                  className="flex items-center gap-xs bg-white text-on-surface font-label-md text-label-md px-md py-sm rounded-lg hover:bg-surface-blue transition-colors no-underline shadow-md"
                >
                  <span className="material-symbols-outlined">call</span>
                  Appeler
                </a>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-xs bg-[#25D366] text-white font-label-md text-label-md px-md py-sm rounded-lg hover:opacity-90 transition-opacity shadow-lg no-underline"
                >
                  <span className="material-symbols-outlined">chat</span>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
          <div className="lg:col-span-7">
            <MiniSiteProfileSections business={business} />
          </div>

          <div className="lg:col-span-5 lg:sticky lg:top-[100px]" id="concierge">
            <div className="bg-surface-container-lowest border border-hairline-border rounded-xl h-[600px] flex flex-col shadow-sm">
              <div className="p-md border-b border-hairline-border flex items-center justify-between bg-surface-blue/30 rounded-t-xl shrink-0">
                <div className="flex items-center gap-sm">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      smart_toy
                    </span>
                  </div>
                  <div>
                    <h3 className="font-label-md text-label-md m-0">{conciergeShort} AI Concierge</h3>
                    <div className="flex items-center gap-xs">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] text-outline uppercase font-bold">Online • En, Fr, Ar</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-md space-y-md no-scrollbar min-h-0">
                {messages.map((msg) =>
                  msg.sender === 'user' ? (
                    <div key={msg.id} className="flex gap-sm justify-end">
                      <div className="bg-primary text-on-primary p-sm rounded-xl rounded-tr-none max-w-[85%]">
                        <p className="text-body-md m-0 whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={msg.id} className="flex gap-sm">
                      <div className="w-8 h-8 rounded-full bg-surface-container-high flex-shrink-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm text-primary">assistant</span>
                      </div>
                      <div className="bg-surface-container text-on-surface p-sm rounded-xl rounded-tl-none max-w-[85%] border border-hairline-border">
                        <p className="text-body-md m-0 whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ),
                )}

                {chatLoading && (
                  <div className="flex gap-sm">
                    <div className="w-8 h-8 rounded-full bg-surface-container-high flex-shrink-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-primary">assistant</span>
                    </div>
                    <div className="bg-surface-container p-sm rounded-xl rounded-tl-none border border-hairline-border flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-outline rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}

                {showTranslationPill && (
                  <div className="text-center py-sm">
                    <span className="bg-surface-container-high px-md py-1 rounded-full text-[10px] text-outline-variant font-bold uppercase tracking-widest">
                      Translation Active
                    </span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="p-md border-t border-hairline-border space-y-sm shrink-0">
                <div className="relative">
                  <textarea
                    className="w-full bg-surface-container-lowest border border-hairline-border rounded-lg p-sm pr-14 focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all resize-none font-body-md"
                    placeholder="Type your message..."
                    rows={2}
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
                    className="absolute bottom-sm right-sm bg-primary text-white w-10 h-10 rounded-lg flex items-center justify-center active:scale-90 transition-transform shadow-md border-0 cursor-pointer disabled:opacity-50"
                    aria-label="Send message"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-xs opacity-40 pointer-events-none" aria-hidden="true">
                    <span className="w-8 h-8 rounded flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-outline">attach_file</span>
                    </span>
                    <span className="w-8 h-8 rounded flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-outline">mic</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-outline-variant font-medium">Powered by</span>
                    <SahelLogo size={14} showText={false} />
                    <span className="text-[10px] font-bold text-primary">Sahel.ai</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-on-background w-full py-lg px-margin flex flex-col md:flex-row justify-between items-center gap-md border-t border-hairline-border mt-xl">
        <div className="flex flex-col items-center md:items-start gap-xs">
          <a href={ROUTES.home} className="no-underline">
            <SahelLogo size={28} textClass="font-headline-sm text-headline-sm text-surface-bright font-bold" />
          </a>
          <p className="font-label-sm text-label-sm text-outline-variant m-0">© 2026 Sahel.ai. Made for Moroccan SMEs.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-md">
          <a className="text-outline-variant font-body-md hover:text-surface-bright transition-opacity no-underline" href={ROUTES.privacy}>
            Privacy Policy
          </a>
          <a className="text-outline-variant font-body-md hover:text-surface-bright transition-opacity no-underline" href={ROUTES.terms}>
            Terms of Service
          </a>
          <a className="text-outline-variant font-body-md hover:text-surface-bright transition-opacity no-underline" href={ROUTES.cookies}>
            Cookie Policy
          </a>
          <a className="text-outline-variant font-body-md hover:text-surface-bright transition-opacity no-underline" href={ROUTES.contact}>
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}
