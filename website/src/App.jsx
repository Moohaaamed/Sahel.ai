import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { LanguageProvider, useLanguage } from './i18n';
import SahelLogo from './components/SahelLogo';
import MarketingFooter from './components/layout/MarketingFooter';
import MarketingHeader from './components/layout/MarketingHeader';
import { ROUTES, loginUrl } from './lib/routes';
import { getSession } from './lib/session';
import { API_URL } from './config';

const DashboardPage = lazy(() => import('./components/DashboardPage'));
const ChatInterface = lazy(() => import('./components/ChatInterface'));
const BusinessShowcasePage = lazy(() => import('./components/PublicBusinessPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const VerifyEmailPage = lazy(() => import('./components/VerifyEmailPage'));
const OnboardingFlow = lazy(() => import('./components/OnboardingFlow'));
const SuccessPage = lazy(() => import('./components/SuccessPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const FaqPage = lazy(() => import('./components/FaqPage'));
const ShowcasePage = lazy(() => import('./components/ShowcasePage'));
const ContactPage = lazy(() => import('./components/ContactPage'));
const BlogPage = lazy(() => import('./components/BlogPage'));

function LandingPage() {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState(null);
  const [chatStep, setChatStep] = useState(0);
  const chatContainerRef = useRef(null);
  const [landingCta] = useState(() => {
    const session = getSession();
    return session?.owner ? ROUTES.dashboard : loginUrl(ROUTES.onboarding);
  });
  const [heroChatStep, setHeroChatStep] = useState(0);
  const heroChatRef = useRef(null);
  const heroChatStarted = useRef(false);
  const chatMessages = [
    { type: 'user', text: "Salam, bghit na3raf l'menu dialkom svp." },
    { type: 'bot', text: "Wa alaykum salam! Voici notre menu digital du jour. Souhaitez-vous voir nos spécialités ?" },
    { type: 'user', text: "Oui, chnou 3andkom f tagine ?" },
    { type: 'bot', text: "Nous avons aujourd'hui: Tagine d'Agneau aux pruneaux, Tagine de Poulet au citron confit, et notre Tagine Végétarien Berbère. Lequel vous tente ?" }
  ];
  const heroMessages = [
    { type: 'bot', text: 'Bonjour ! Bienvenue sur Sahel.ai. Je suis votre assistant IA. Comment puis-je vous aider ?' },
    { type: 'user', text: 'Salam ! Je cherche un bon restaurant marocain à Marrakech.' },
    { type: 'bot', text: 'Bien sûr ! Je vous recommande le "Restaurant Atlas" — spécialités traditionnelles, noté 4.8 ⭐. Voulez-vous réserver une table ?' },
    { type: 'user', text: 'Oui, pour 2 personnes ce soir à 20h.' },
    { type: 'bot', text: 'Parfait ! Réservation confirmée pour 2 personnes ce soir à 20h au Restaurant Atlas. Un QR code vous sera envoyé. 🎉' }
  ];

  useEffect(() => {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

    const bentoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
          }
        });
      },
      { threshold: 0.15 }
    );
    const bentoGrid = document.querySelector('.bento-stagger');
    if (bentoGrid) bentoObserver.observe(bentoGrid);

    const nav = document.querySelector('.glass-nav');
    const handleNav = () => {
      if (window.scrollY > 50) {
        nav?.classList.add('scrolled');
      } else {
        nav?.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', handleNav);

    return () => {
      revealObserver.disconnect();
      bentoObserver.disconnect();
      window.removeEventListener('scroll', handleNav);
    };
  }, []);

  useEffect(() => {
    const handleMouse = (e) => {
      const glow = document.getElementById('cursor-glow');
      if (glow) {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
      }
    };
    document.addEventListener('mousemove', handleMouse);
    return () => document.removeEventListener('mousemove', handleMouse);
  }, []);

  useEffect(() => {
    if (!heroChatRef.current) return;
    const ob = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !heroChatStarted.current) {
          heroChatStarted.current = true;
          const run = async () => {
            for (let i = 1; i <= heroMessages.length; i++) {
              await new Promise((r) => setTimeout(r, 1400));
              setHeroChatStep(i);
            }
          };
          run();
        }
      },
      { threshold: 0.4 }
    );
    ob.observe(heroChatRef.current);
    return () => ob.disconnect();
  }, [heroMessages.length]);

  useEffect(() => {
    if (chatStep >= chatMessages.length) return;
    const timer = setTimeout(() => {
      setChatStep((s) => s + 1);
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [chatStep, chatMessages.length]);

  const faqItems = [
    { q: t('landing.faq.q1'), a: t('landing.faq.a1') },
    { q: t('landing.faq.q2'), a: t('landing.faq.a2') },
    { q: t('landing.faq.q3'), a: t('landing.faq.a3') },
  ];

  return (
    <div className="bg-background text-on-background font-body-md overflow-x-hidden selection:bg-primary/20 page-enter">
      <div className="cursor-glow" id="cursor-glow"></div>

      {/* Background Orbs */}
      <div className="orb w-96 h-96 bg-primary-container top-[-10%] left-[-10%]"></div>
      <div className="orb w-80 h-80 bg-secondary-fixed top-[40%] right-[-5%]"></div>

      <MarketingHeader />

      {/* Hero Section */}
      <header className="relative pt-40 pb-xl overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin text-center">
          <h1 className="font-display-lg text-display-lg mb-md max-w-4xl mx-auto reveal leading-tight">
            {t('landing.hero.headline')}
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg max-w-2xl mx-auto reveal" style={{ transitionDelay: '0.1s' }}>
            {t('landing.hero.subheadline')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-sm mb-xl reveal" style={{ transitionDelay: '0.2s' }}>
            <a href={landingCta} className="bg-primary text-on-primary px-lg py-md rounded-xl font-headline-sm text-lg hover:scale-[1.02] transition-all shadow-xl shadow-primary/25 flex items-center justify-center gap-sm no-underline">
              {t('landing.hero.cta')} <span className="material-symbols-outlined">rocket_launch</span>
            </a>
            <a href={ROUTES.contact} className="bg-white border border-outline-variant px-lg py-md rounded-xl font-headline-sm text-lg hover:bg-neutral-gray transition-colors flex items-center justify-center gap-sm no-underline">
              {t('landing.hero.demo')} <span className="material-symbols-outlined">play_circle</span>
            </a>
          </div>

          {/* Interactive Mockup - Chat + Mini-site */}
          <div className="relative max-w-5xl mx-auto reveal" style={{ transitionDelay: '0.3s' }} ref={heroChatRef}>
            <div className="rounded-2xl overflow-hidden border border-hairline-border shadow-[0_32px_64px_-16px_rgba(0,70,124,0.15)] bg-white">
              <div className="bg-neutral-gray px-md py-sm border-b border-hairline-border flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 text-center text-xs text-outline/60">{t('footer.poweredBy')}</div>
              </div>
              <div className="p-md md:p-lg grid grid-cols-1 md:grid-cols-5 gap-md">
                {/* Chat Panel */}
                <div className="md:col-span-3">
                  <div className="bg-slate-50 rounded-xl border border-hairline-border overflow-hidden">
                    <div className="bg-white px-sm py-2 border-b border-hairline-border flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[10px] font-bold">S</div>
                      <span className="text-xs font-bold text-on-surface">Assistant Sahel</span>
                      <span className="ml-auto text-[10px] text-green-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> {t('common.online')}
                      </span>
                    </div>
                    <div className="p-3 min-h-[260px] flex flex-col gap-2 justify-end">
                      {heroMessages.slice(0, heroChatStep).map((msg, i) => (
                        <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                          <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-relaxed ${msg.type === 'user'
                            ? 'bg-primary text-on-primary rounded-br-sm'
                            : 'bg-white text-on-surface rounded-bl-sm border border-hairline-border shadow-sm'
                            }`}>
                            {msg.text}
                          </div>
                        </div>
                      ))}
                      {heroChatStep < heroMessages.length && heroChatStep > 0 && (
                        <div className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[8px] font-bold shrink-0">S</div>
                          <div className="flex gap-1 px-3 py-2.5 bg-white rounded-xl border border-hairline-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mini Website Preview */}
                <div className="md:col-span-2">
                  <div className="rounded-xl border border-hairline-border overflow-hidden bg-white h-full flex flex-col">
                    <div className="h-24 bg-gradient-to-br from-primary to-tertiary-container relative">
                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="w-14 h-14 rounded-xl bg-white shadow-md flex items-center justify-center text-primary font-bold text-lg">RA</div>
                      </div>
                    </div>
                    <div className="p-3 pt-10 flex-1 flex flex-col gap-1.5">
                      <h4 className="font-bold text-sm text-on-surface m-0">Restaurant Atlas</h4>
                      <div className="flex items-center gap-1 text-[10px] text-yellow-500">
                        <span className="material-symbols-outlined !text-[12px]">star</span>
                        <span className="material-symbols-outlined !text-[12px]">star</span>
                        <span className="material-symbols-outlined !text-[12px]">star</span>
                        <span className="material-symbols-outlined !text-[12px]">star</span>
                        <span className="material-symbols-outlined !text-[12px]">star</span>
                        <span className="text-outline ml-1">4.8</span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant m-0 leading-relaxed">
                        Cuisine marocaine · Ouvert 12h-23h · Marrakech
                      </p>
                      <div className="mt-auto pt-2 flex items-center gap-1 text-[10px] text-primary">
                        <span className="material-symbols-outlined !text-[12px]">qr_code_scanner</span>
                        Menu digital
                        <span className="ml-auto material-symbols-outlined !text-[12px]">arrow_forward</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Master Your Data (RAG) */}
      <section className="py-xl bg-neutral-gray overflow-hidden">
        <div className="max-w-7xl mx-auto px-margin flex flex-col md:flex-row items-center gap-xl">
          <div className="flex-1 reveal">
            <h2 className="font-headline-md text-headline-md mb-md">{t('landing.masterData.heading')}</h2>
            <p className="text-on-surface-variant font-body-lg text-body-lg mb-lg leading-relaxed">
              {t('landing.masterData.description')}
            </p>
            <div className="space-y-md">
              <div className="flex gap-sm">
                <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">security</span>
                <div>
                  <h4 className="font-bold text-on-surface">{t('landing.masterData.privacy')}</h4>
                  <p className="text-on-surface-variant text-sm">{t('landing.masterData.privacyDesc')}</p>
                </div>
              </div>
              <div className="flex gap-sm">
                <span className="material-symbols-outlined text-primary bg-primary/5 p-2 rounded-lg">psychology</span>
                <div>
                  <h4 className="font-bold text-on-surface">{t('landing.masterData.contextual')}</h4>
                  <p className="text-on-surface-variant text-sm">{t('landing.masterData.contextualDesc')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-deep-navy rounded-2xl p-lg relative reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="absolute top-4 right-4 flex gap-xs">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="mt-md font-mono text-sm text-green-400 space-y-2">
              <p className="m-0">&gt; Initializing Sahel RAG engine...</p>
              <p className="m-0">&gt; Loading 14 documents (PDF, CSV, JPEG)...</p>
              <p className="m-0">&gt; Vectorizing knowledge base...</p>
              <p className="m-0 text-white">&gt; Query: &ldquo;Est-ce qu&apos;il reste du Zellige bleu en 10x10?&rdquo;</p>
              <p className="m-0 text-blue-400">&gt; Result found in Stock_May.pdf: 14 units remaining.</p>
              <p className="m-0 text-primary-fixed">&gt; Sahel: &ldquo;Oui, il nous reste exactement 14 unités de Zellige bleu 10x10 en stock.&rdquo;</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-xl" id="features">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="text-center mb-xl reveal">
            <h2 className="font-headline-md text-headline-md mb-sm">{t('landing.features.heading')}</h2>
            <p className="text-on-surface-variant font-body-lg text-body-lg max-w-xl mx-auto">{t('landing.features.subheading')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-md bento-stagger">
            {/* Large Card - WhatsApp Assistant */}
            <div className="md:col-span-8 bg-white p-lg rounded-2xl border border-hairline-border flex flex-col md:flex-row gap-lg group hover:shadow-2xl transition-all reveal">
              <div className="flex-1">
                <div className="w-12 h-12 bg-surface-blue rounded-xl flex items-center justify-center text-primary mb-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">smart_toy</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm mb-xs">{t('landing.features.whatsapp')}</h3>
                <p className="text-on-surface-variant mb-md">{t('landing.features.whatsappDesc')}</p>
                <ul className="space-y-xs">
                  <li className="flex items-center gap-xs text-sm text-primary">
                    <span className="material-symbols-outlined text-[18px]">verified</span> {t('landing.features.autoBooking')}
                  </li>
                  <li className="flex items-center gap-xs text-sm text-primary">
                    <span className="material-symbols-outlined text-[18px]">verified</span> {t('landing.features.instantTranslation')}
                  </li>
                </ul>
              </div>
              <div className="flex-1 bg-neutral-gray rounded-xl p-md border border-hairline-border overflow-hidden">
                <div className="flex flex-col gap-sm">
                  <div className="bg-white p-sm rounded-lg self-start text-xs max-w-[80%] shadow-sm">Bonjour ! Avez-vous des tables pour ce soir ?</div>
                  <div className="bg-primary text-on-primary p-sm rounded-lg self-end text-xs max-w-[80%]">Salaam ! Oui, il nous reste 3 tables disponibles pour 20h. Voulez-vous réserver ?</div>
                </div>
              </div>
            </div>

            {/* Small Card - Telegram Bot */}
            <div className="md:col-span-4 bg-white p-lg rounded-2xl border border-hairline-border flex flex-col group hover:shadow-2xl transition-all reveal">
              <div>
                <div className="w-12 h-12 bg-surface-blue rounded-xl flex items-center justify-center text-primary mb-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">send</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm mb-xs">{t('landing.features.telegram')}</h3>
                <p className="text-on-surface-variant">{t('landing.features.telegramDesc')}</p>
              </div>
              <ul className="space-y-xs mt-auto pt-md">
                <li className="flex items-center gap-xs text-sm text-primary">
                  <span className="material-symbols-outlined text-[18px]">verified</span> {t('landing.features.realtimeNotifications')}
                </li>
                <li className="flex items-center gap-xs text-sm text-primary">
                  <span className="material-symbols-outlined text-[18px]">verified</span> {t('landing.features.multiPlatform')}
                </li>
              </ul>
            </div>

            {/* Row 2 - Dashboard */}
            <div className="md:col-span-4 bg-surface-blue p-lg rounded-2xl border border-hairline-border group reveal">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-primary mb-md shadow-sm group-hover:-translate-y-1 transition-transform">
                <span className="material-symbols-outlined">analytics</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm mb-xs">{t('landing.features.analytics')}</h3>
              <p className="text-on-surface-variant">{t('landing.features.analyticsDesc')}</p>
            </div>

            {/* Row 2 - Site Web */}
            <div className="md:col-span-8 bg-white p-lg rounded-2xl border border-hairline-border flex flex-col md:flex-row-reverse gap-lg group reveal">
              <div className="flex-1">
                <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center text-secondary mb-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">language</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm mb-xs">{t('landing.features.autoSite')}</h3>
                <p className="text-on-surface-variant">{t('landing.features.autoSiteDesc')}</p>
              </div>
              <div className="flex-1 rounded-xl bg-neutral-gray p-sm border border-hairline-border overflow-hidden">
                <div className="grid grid-cols-2 gap-xs">
                  <div className="h-20 bg-white rounded-lg shadow-sm"></div>
                  <div className="h-20 bg-white rounded-lg shadow-sm"></div>
                  <div className="h-20 bg-white rounded-lg shadow-sm col-span-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Local Impact */}
      <section className="py-xl bg-warm-bg/20" id="local-impact">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="flex flex-col md:flex-row items-center gap-xl">
            <div className="flex-1 reveal">
              <h2 className="font-headline-md text-headline-md mb-md">{t('landing.localImpact.heading')}</h2>
              <p className="text-on-surface-variant font-body-lg text-body-lg mb-lg leading-relaxed">
                {t('landing.localImpact.description')}
              </p>
              <div className="grid grid-cols-2 gap-md">
                <div className="p-md bg-white rounded-xl shadow-sm border border-hairline-border">
                  <p className="text-3xl font-display-lg text-primary mb-1">500+</p>
                  <p className="text-sm font-label-md text-on-surface-variant">{t('landing.localImpact.smesSupported')}</p>
                </div>
                <div className="p-md bg-white rounded-xl shadow-sm border border-hairline-border">
                  <p className="text-3xl font-display-lg text-primary mb-1">24/7</p>
                  <p className="text-sm font-label-md text-on-surface-variant">{t('landing.localImpact.localSupport')}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 reveal" style={{ transitionDelay: '0.2s' }}>
              <div className="rounded-3xl overflow-hidden shadow-2xl relative group">
                <div className="w-full h-[400px] bg-gradient-to-br from-primary/80 to-tertiary-container flex items-center justify-center text-white font-display-lg text-6xl group-hover:scale-105 transition-transform duration-700">
                  <span className="material-symbols-outlined text-8xl">precision_manufacturing</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-deep-navy/80 to-transparent flex items-end p-lg">
                  <p className="text-white font-headline-sm italic text-xl leading-relaxed">{t('landing.localImpact.testimonial')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Simulation */}
      <section className="py-xl overflow-hidden">
        <div className="max-w-3xl mx-auto px-margin text-center">
          <h2 className="font-headline-md text-headline-md mb-xl reveal">{t('landing.hero.liveExperience')}</h2>
          <div className="bg-white border border-hairline-border rounded-3xl shadow-2xl overflow-hidden reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="bg-neutral-gray px-md py-sm border-b border-hairline-border flex items-center justify-between">
              <div className="flex items-center gap-sm">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[20px]">smart_toy</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">Assistant Sahel</p>
                  <p className="text-[10px] text-green-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> {t('common.online')}
                  </p>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant">more_vert</span>
            </div>
            <div className="p-md h-[300px] overflow-y-auto bg-slate-50 flex flex-col gap-md" ref={chatContainerRef}>
              {chatMessages.slice(0, chatStep).map((msg, i) => (
                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm max-w-[80%] ${msg.type === 'user'
                    ? 'bg-primary text-on-primary rounded-tr-none'
                    : 'bg-white text-on-surface rounded-tl-none border border-hairline-border'
                    }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatStep < chatMessages.length && chatStep > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">S</div>
                  <div className="flex gap-1 px-3 py-3 bg-white rounded-xl border border-hairline-border">
                    <span className="w-2 h-2 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-outline/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
            <div className="p-md border-t border-hairline-border flex gap-sm bg-white">
              <div className="flex-1 bg-neutral-gray rounded-full px-md py-2 text-left text-on-surface-variant text-sm">{t('chat.placeholder')}</div>
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white">
                <span className="material-symbols-outlined">send</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-xl bg-deep-navy text-white">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
            <div className="reveal">
              <span className="material-symbols-outlined text-primary-fixed text-4xl mb-md">lock_person</span>
              <h3 className="font-headline-sm text-headline-sm mb-sm">{t('landing.trust.heading')}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{t('landing.trust.description')}</p>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.1s' }}>
              <span className="material-symbols-outlined text-primary-fixed text-4xl mb-md">verified_user</span>
              <h3 className="font-headline-sm text-headline-sm mb-sm">{t('landing.trust.auth')}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{t('landing.trust.authDesc')}</p>
            </div>
            <div className="reveal" style={{ transitionDelay: '0.2s' }}>
              <span className="material-symbols-outlined text-primary-fixed text-4xl mb-md">history</span>
              <h3 className="font-headline-sm text-headline-sm mb-sm">{t('landing.trust.backup')}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{t('landing.trust.backupDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-xl" id="pricing">
        <div className="max-w-7xl mx-auto px-margin">
          <div className="text-center mb-xl reveal">
            <h2 className="font-headline-md text-headline-md mb-sm">{t('landing.pricing.heading')}</h2>
            <p className="text-on-surface-variant font-body-lg text-body-lg">{t('landing.pricing.subheading')}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg items-end">
            {/* Free */}
            <div className="p-lg bg-white border border-hairline-border rounded-2xl reveal group hover:shadow-xl transition-all">
              <p className="font-label-sm uppercase text-on-surface-variant mb-md">{t('landing.pricing.free')}</p>
              <div className="flex items-baseline gap-1 mb-md">
                <span className="text-4xl font-display-lg font-bold">{t('landing.pricing.freePrice')}</span>
                <span className="text-on-surface-variant">/ mois</span>
              </div>
              <p className="text-sm text-on-surface-variant mb-lg">{t('landing.pricing.freeDesc')}</p>
              <ul className="space-y-sm mb-lg pl-0">
                <li className="flex items-center gap-sm text-sm">
                  <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> {t('landing.pricing.freeSite')}
                </li>
                <li className="flex items-center gap-sm text-sm">
                  <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> {t('landing.pricing.freeOrders')}
                </li>
                <li className="flex items-center gap-sm text-sm">
                  <span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> {t('landing.pricing.freeQr')}
                </li>
              </ul>
              <a href={landingCta} className="w-full block text-center py-3 rounded-xl bg-primary text-on-primary font-label-md shadow-sm hover:shadow-md hover:scale-[1.02] transition-all no-underline">
                {t('landing.pricing.freeCta')}
              </a>
            </div>

            {/* Pro */}
            <div className="p-lg bg-white border-2 border-primary rounded-2xl reveal relative scale-105 shadow-2xl shadow-primary/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest">{t('landing.pricing.recommended')}</div>
              <p className="font-label-sm uppercase text-primary mb-md font-bold">{t('landing.pricing.pro')}</p>
              <div className="flex items-baseline gap-1 mb-md">
                <span className="text-5xl font-display-lg font-bold">{t('landing.pricing.proPrice')}</span>
              </div>
              <p className="text-sm text-on-surface-variant mb-lg">{t('landing.pricing.proDesc')}</p>
              <ul className="space-y-sm mb-lg pl-0">
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> {t('landing.pricing.proAssistant')}</li>
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> {t('landing.pricing.proMenu')}</li>
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> {t('landing.pricing.proOrders')}</li>
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> {t('landing.pricing.proAnalytics')}</li>
              </ul>
              <a href={landingCta} className="w-full block text-center py-4 rounded-xl bg-primary text-on-primary font-label-md shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all no-underline">
                {t('landing.pricing.proCta')}
              </a>
            </div>

            {/* Enterprise */}
            <div className="p-lg bg-white border border-hairline-border rounded-2xl reveal group hover:shadow-xl transition-all">
              <p className="font-label-sm uppercase text-on-surface-variant mb-md">{t('landing.pricing.enterprise')}</p>
              <div className="flex items-baseline gap-1 mb-md">
                <span className="text-4xl font-display-lg font-bold">{t('landing.pricing.enterprisePrice')}</span>
              </div>
              <p className="text-sm text-on-surface-variant mb-lg">{t('landing.pricing.enterpriseDesc')}</p>
              <ul className="space-y-sm mb-lg pl-0">
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> {t('landing.pricing.enterpriseMulti')}</li>
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> {t('landing.pricing.enterpriseApi')}</li>
                <li className="flex items-center gap-sm text-sm"><span className="material-symbols-outlined text-green-500 text-lg">check_circle</span> {t('landing.pricing.enterpriseSupport')}</li>
              </ul>
              <a href={ROUTES.contact} className="w-full block text-center py-3 rounded-xl border border-outline-variant font-label-md hover:bg-neutral-gray transition-colors no-underline text-on-surface">
                {t('landing.pricing.enterpriseCta')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-xl bg-neutral-gray" id="faq">
        <div className="max-w-3xl mx-auto px-margin">
          <h2 className="font-headline-md text-headline-md text-center mb-xl reveal">{t('landing.faq.heading')}</h2>
          <div className="space-y-md reveal">
            {faqItems.map((item, i) => (
              <div key={i} className="border border-hairline-border rounded-xl bg-white overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-lg py-md flex items-center justify-between text-left focus:outline-none transition-colors hover:bg-slate-50 cursor-pointer border-0 bg-transparent"
                >
                  <span className="font-bold text-on-surface">{item.q}</span>
                  <span className={`material-symbols-outlined transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>
                    {openFaq === i ? 'remove' : 'add'}
                  </span>
                </button>
                <div className={`px-lg pb-md text-on-surface-variant text-sm leading-relaxed ${openFaq === i ? 'block' : 'hidden'}`}>
                  {item.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-xl px-margin bg-primary text-on-primary">
        <div className="max-w-7xl mx-auto text-center reveal">
          <h2 className="font-headline-md text-headline-md mb-md text-white">{t('landing.cta.heading')}</h2>
          <p className="font-body-lg text-body-lg opacity-80 mb-lg max-w-2xl mx-auto text-white">{t('landing.cta.subheading')}</p>
          <a href={landingCta} className="inline-block bg-white text-primary px-xl py-md rounded-xl font-headline-sm text-headline-sm hover:bg-surface-blue transition-all no-underline font-semibold">
            {t('landing.cta.button')}
          </a>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}


function Section({ number, title, children }) {
  return (
    <div>
      <h2 className="font-headline-md text-headline-md text-on-surface mt-0 mb-sm">
        <span className="text-primary mr-xs">{number}.</span>{title}
      </h2>
      <div className="text-body-md text-on-surface-variant leading-relaxed m-0 space-y-sm">
        {children}
      </div>
    </div>
  );
}

function LegalPage() {
  const path = window.location.pathname;
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  useEffect(() => {
    if (path === '/privacy') setTitle(t('legal.privacyTitle'));
    else if (path === '/terms') setTitle(t('legal.termsTitle'));
    else if (path === '/cookies') setTitle(t('legal.cookiesTitle'));
  }, [path, t]);
  const isPrivacy = path === '/privacy';
  const isTerms = path === '/terms';
  const isCookies = path === '/cookies';

  return (
    <div className="bg-background text-on-surface min-h-screen flex flex-col justify-between page-enter">
      <div>
        <MarketingHeader />
        <section className="py-xl px-margin">
          <div className="max-w-3xl mx-auto bg-white rounded-xl border border-hairline-border p-lg md:p-xl text-left">
            <a href={ROUTES.home} className="inline-flex items-center gap-xs text-on-surface-variant font-label-md no-underline hover:text-primary mb-md">
              <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
              {t('common.backToHome')}
            </a>
            <h1 className="font-display-lg text-display-lg mt-md mb-md">{title}</h1>

            {isPrivacy ? (
              <>
                <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-lg">
                  <p className="m-0 text-sm text-outline">{t('legal.lastUpdate')}</p>

                  <Section number="1" title={t('legal.dataCollected')}>
                    <p>{t('legal.dataCollectedDesc')}</p>
                    <ul>
                      <li>{t('legal.dataItem1')}</li>
                      <li>{t('legal.dataItem2')}</li>
                      <li>{t('legal.dataItem3')}</li>
                      <li>{t('legal.dataItem4')}</li>
                      <li>{t('legal.dataItem5')}</li>
                    </ul>
                  </Section>

                  <Section number="2" title={t('legal.dataUsage')}>
                    <p>{t('legal.dataUsageDesc')}</p>
                  </Section>

                  <Section number="3" title={t('legal.hosting')}>
                    <p>{t('legal.hostingDesc')}</p>
                  </Section>

                  <Section number="4" title={t('legal.retention')}>
                    <p>{t('legal.retentionDesc')}</p>
                  </Section>

                  <Section number="5" title={t('legal.yourRights')}>
                    <p>{t('legal.yourRightsDesc')}</p>
                  </Section>
                </div>
              </>
            ) : isTerms ? (
              <>
                <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-lg">
                  <p className="m-0 text-sm text-outline">{t('legal.lastUpdate')}</p>

                  <Section number="1" title={t('legal.termsAcceptance')}>
                    <p>{t('legal.termsAcceptanceDesc')}</p>
                  </Section>

                  <Section number="2" title="Description du service">
                    <p>{t('legal.serviceDesc')}</p>
                  </Section>

                  <Section number="3" title={t('legal.userObligations')}>
                    <p>{t('legal.userObligationsDesc')}</p>
                    <ul>
                      <li>{t('legal.obligation1')}</li>
                      <li>{t('legal.obligation2')}</li>
                      <li>{t('legal.obligation3')}</li>
                      <li>{t('legal.obligation4')}</li>
                      <li>{t('legal.obligation5')}</li>
                    </ul>
                  </Section>

                  <Section number="4" title={t('legal.liability')}>
                    <p>{t('legal.liabilityDesc')}</p>
                  </Section>

                  <Section number="5" title={t('legal.ip')}>
                    <p>{t('legal.ipDesc')}</p>
                  </Section>

                  <Section number="6" title={t('legal.termination')}>
                    <p>{t('legal.terminationDesc')}</p>
                  </Section>

                  <Section number="7" title={t('legal.applicableLaw')}>
                    <p>{t('legal.applicableLawDesc')}</p>
                  </Section>
                </div>
              </>
            ) : isCookies ? (
              <>
                <div className="font-body-md text-body-md text-on-surface-variant leading-relaxed space-y-lg">
                  <p className="m-0 text-sm text-outline">{t('legal.lastUpdate')}</p>

                  <Section number="1" title={t('legal.cookieWhat')}>
                    <p>{t('legal.cookieWhatDesc')}</p>
                  </Section>

                  <Section number="2" title={t('legal.cookieUsed')}>
                    <ul className="space-y-md">
                      <li>{t('legal.cookieSession')}</li>
                      <li>{t('legal.cookieGdpr')}</li>
                      <li>{t('legal.cookieAnalytics')}</li>
                      <li>{t('legal.cookieNoAd')}</li>
                    </ul>
                  </Section>
                </div>
              </>
            ) : (
              <>
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
                  Cette page est en cours de finalisation. Pour toute question officielle,
                  contactez l&apos;équipe Sahel.ai et nous vous répondrons avec les informations
                  adaptées à votre commerce.
                </p>
              </>
            )}

            <div className="flex flex-wrap gap-sm mt-lg">
              <a href={ROUTES.contact} className="bg-primary text-on-primary px-md py-xs rounded-lg no-underline font-label-md text-label-md">
                {t('legal.contactTeam')}
              </a>
              <a href={ROUTES.home} className="bg-white border border-outline-variant text-on-surface px-md py-xs rounded-lg no-underline font-label-md text-label-md">
                {t('common.backToHome')}
              </a>
            </div>
          </div>
        </section>
      </div>
      <MarketingFooter />
    </div>
  );
}



function PublicChatPage({ slug }) {
  const { t } = useLanguage();
  const [business, setBusiness] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/businesses/${slug}`, { signal: controller.signal })
      .then((response) => {
        if (response.status === 404) throw new Error('not-found');
        if (!response.ok) throw new Error('error');
        return response.json();
      })
      .then((data) => {
        setBusiness(data);
        setStatus('ready');
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setStatus(err.message === 'not-found' ? 'not-found' : 'error');
      });
    return () => controller.abort();
  }, [slug]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <MarketingHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white border border-hairline-border shadow-sm">
            <span className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="font-body-md text-body-md text-on-surface-variant">{t('common.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <MarketingHeader />
        <div className="flex-1 flex items-center justify-center">
          <p className="font-body-md text-body-md text-on-surface-variant">{t('publicBusiness.notFound')}</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col bg-background text-on-surface">
        <MarketingHeader />
        <div className="flex-1 flex items-center justify-center text-center">
          <div>
            <p className="font-body-md text-body-md text-on-surface-variant">{t('common.error')}</p>
            <button onClick={() => window.location.reload()} className="mt-md bg-primary text-white px-md py-xs rounded border-0 cursor-pointer">{t('common.retry')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col page-enter">
      <MarketingHeader />

      <main className="flex-1 px-margin py-lg">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <a
            href={ROUTES.miniSite(business.slug)}
            className="inline-flex items-center gap-1.5 text-outline font-label-md text-label-md no-underline hover:text-primary transition-colors mb-md"
          >
            <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
            Retour au mini-site
          </a>

          {/* Chat card header */}
          <div className="flex items-center gap-4 px-md py-4 rounded-t-xl border border-hairline-border border-b-0 bg-white shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
              AI
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-headline-sm text-headline-sm text-on-surface m-0 truncate">
                Assistant IA {business.name}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-label-sm font-label-sm text-secondary font-semibold">{t('common.online')}</span>
              </div>
            </div>
            <a
              href={ROUTES.home}
              className="hidden sm:inline-flex items-center gap-1.5 text-outline font-label-md text-label-md no-underline hover:text-primary transition-colors shrink-0"
            >
              <SahelLogo size={16} showText={false} />
              Sahel.ai
            </a>
          </div>

          {/* Chat interface */}
          <ChatInterface business={business} />

          {/* Mobile back link */}
          <div className="flex sm:hidden justify-center mt-md">
            <a
              href={ROUTES.home}
              className="inline-flex items-center gap-1.5 text-outline font-label-md text-label-md no-underline hover:text-primary transition-colors"
            >
              <SahelLogo size={16} showText={false} />
              Propulsé par Sahel.ai
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}

function AppRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}

function NotFoundPage() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <MarketingHeader />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant">search_off</span>
        <h1 className="font-headline-md text-headline-md text-on-surface m-0">{t('common.pageNotFound')}</h1>
        <p className="font-body-md text-body-md text-on-surface-variant m-0">{t('common.pageNotFoundDesc')}</p>
        <a href={ROUTES.home} className="px-6 py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md no-underline hover:brightness-95 transition-all">
          {t('common.backToHome')}
        </a>
      </div>
    </div>
  );
}

function App() {
  const path = window.location.pathname;
  const miniSiteMatch = path.match(/^\/business\/([^/]+)/);
  const chatMatch = path.match(/^\/chat\/([^/]+)/);

  function renderPage() {
    if (miniSiteMatch) {
      return <BusinessShowcasePage slug={miniSiteMatch[1]} />;
    }

    if (chatMatch) {
      return <PublicChatPage slug={chatMatch[1]} />;
    }

    if (path === '/' || path === '') {
      return <LandingPage />;
    }

    if (path === '/about') {
      return <AboutPage />;
    }

    if (path === '/showcase') {
      return <ShowcasePage />;
    }

    if (path === '/faq') {
      return <FaqPage />;
    }

    if (path === '/blog') {
      return <BlogPage />;
    }

    if (path === '/contact') {
      return <ContactPage />;
    }

    if (path === '/privacy') {
      return <LegalPage />;
    }

    if (path === '/terms') {
      return <LegalPage />;
    }

    if (path === '/cookies') {
      return <LegalPage />;
    }

    if (path === '/verify-email') {
      return <VerifyEmailPage />;
    }

    if (path === '/login') {
      return <LoginPage initialMode="login" />;
    }

    if (path === '/register' || path === '/signup') {
      return <LoginPage initialMode="register" />;
    }

    if (path === '/onboarding') {
      return <OnboardingFlow />;
    }

    if (path === '/success') {
      return <SuccessPage />;
    }

    if (path === '/dashboard') {
      return <DashboardPage />;
    }

    if (path === '/app') {
      return <AppRedirect to={loginUrl(ROUTES.onboarding)} />;
    }

    return <NotFoundPage />;
  }

  return <LanguageProvider><Suspense fallback={
    <div className="min-h-screen flex items-center justify-center bg-warm-bg text-on-surface">
      <div className="flex flex-col items-center gap-sm">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  }>{renderPage()}</Suspense></LanguageProvider>;
}

export default App;
