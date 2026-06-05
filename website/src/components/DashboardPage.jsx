import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import FileUpload from './FileUpload';
import ChatInterface from './ChatInterface';
import { ROUTES, loginUrl } from '../lib/routes';
import { authHeaders, clearSession, getSession, saveSession } from '../lib/session';
import { API_URL, resolveApiUrl } from '../config';
import { coverImageUrl, uploadBusinessCover } from '../lib/businessSite';
import SahelLogo from './SahelLogo';

const PLACEHOLDER_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBD7Wl8KZu09BeADFplLfYSnvOZ4muCfqhVHl5isez1xbp8cLu55PFcF8na_t9tdEU-DAqIQj64ffn1YRBkSjK6M7GRnLlBBYohvjkyy4svtF2XTO24yTT5Ux4ifFIEdupGJnrfFSEoSHSSnhtkMv-UHxLE5oIAiwVua42ljpUx0sU3cku0KzaXmsUd0-buw9ThCanvUvhey5JjEX0ld6QV13fHnFsqJeSXO6VSOwmrx0GsdBr3J1u96vkCcN84M5tp8iSaA3l_mAJB',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD1o2gkCPxBSsoIe9rX4gBTJaiBRErBDuYFSK8ffLPxAwMJJO1HdiYLKqAgni3y-bCxGTk_4FpK4rIikDTjH95_kQU1RRupXUitI_GEUE61oap49_uvcGnZ83un0s8uq3vdOZvJ52-h7xQE0Jmc6i0d8OkN7WIe2r4Dib9Tg15C3R929VYHn_geMo1Tu7pOmyM7h417UpoHJ28Avj4o6VIwMCA93hogGoDlMlh6PWAE3aCDh2BfGrUPzpFEWolX_MBwNrUBlOCuxML6',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAdNoB5BO5h2aIuS1WPYejnQkKC5LZqhIDC2lTlZQzL0SVxcYK8UBvJEhvV4IY_EWyssVc__pLSKSqwfc543iCiIHGNv8c1Q1MQDi5THn0tWjpLhPNe5xA776L9FSKUTTdoGAEyzUNzUgxRB_Rm874dmk-GvJbgfwRL7o7YxMQTJS3I9oCG5U9EnnjroY-7BRIdqlq1POtO2KZ9ned4Fy7HKAixCcyc_r69dfKwKLRz0RDkSx-hzKzd9vKGnl8kfwYLTlRdfugnvRQ0',
];

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'dashboard' },
  { id: 'businesses', label: 'My Businesses', icon: 'business_center' },
  { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

function formatBusinessType(value) {
  if (!value) return 'Commerce';
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function languageBadge(language) {
  const map = {
    ar: 'AR (Darija)',
    fr: 'FR',
    en: 'EN',
  };
  return map[language] || (language ? language.toUpperCase() : '—');
}

function clientId(conversationId) {
  if (!conversationId) return '#C-0000';
  const suffix = conversationId.replace(/\D/g, '').slice(-4) || conversationId.slice(-4);
  return `#C-${suffix.padStart(4, '0').slice(-4)}`;
}

function truncate(text, max = 28) {
  const value = (text || '').trim();
  if (value.length <= max) return value ? `"${value}"` : '—';
  return `"${value.slice(0, max)}..."`;
}

function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`} data-icon={name}>
      {name}
    </span>
  );
}

function AnimatedNumber({ value, duration = 800 }) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current === value) return;
    prevRef.current = value;
    const start = performance.now();
    const from = display;
    const diff = value - from;
    if (diff === 0) return;
    let frame;
    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      setDisplay(Math.round(from + diff * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span>{display}</span>;
}

export default function DashboardPage() {
  const [session, setSession] = useState(() => getSession());
  const owner = session?.owner || null;
  const ownerToken = session?.token || '';
  const appOrigin = window.location.origin;

  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState('overview');
  const [businesses, setBusinesses] = useState([]);
  const [businessStats, setBusinessStats] = useState({});
  const [recentInteractions, setRecentInteractions] = useState([]);
  const [topQuestions, setTopQuestions] = useState([]);
  const [languageDistribution, setLanguageDistribution] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrBusiness, setQrBusiness] = useState(null);
  const [editBusiness, setEditBusiness] = useState(null);
  const [manageBusiness, setManageBusiness] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    business_type: 'restaurant',
    description: '',
    owner_email: '',
    owner_phone: '',
  });
  const [editForm, setEditForm] = useState({
    name: '',
    business_type: '',
    description: '',
    owner_email: '',
    owner_phone: '',
    city: '',
    address: '',
    latitude: '',
    longitude: '',
    working_hours: '',
    primary_services: '',
    highlights: '',
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: '', email: '' });

  const ownerQuery = owner ? `owner_id=${encodeURIComponent(owner.id)}` : '';

  const logout = () => {
    clearSession();
    setSession(null);
    window.location.href = ROUTES.home;
  };

  useEffect(() => {
    if (!owner) {
      window.location.replace(loginUrl(ROUTES.dashboard));
    }
  }, [owner]);

  useEffect(() => {
    if (!owner) {
      setBusinesses([]);
      return;
    }

    fetch(`${API_URL}/businesses?${ownerQuery}`, { headers: authHeaders(ownerToken) })
      .then((response) => response.json())
      .then((data) => setBusinesses(data.businesses || []))
      .catch(() => setBusinesses([]));
  }, [owner, ownerQuery, ownerToken]);

  const loadDashboardData = useCallback(async () => {
    if (!owner) {
      setBusinessStats({});
      setRecentInteractions([]);
      setTopQuestions([]);
      setLanguageDistribution([]);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/owner/analytics`, {
        headers: authHeaders(ownerToken),
      });
      if (!response.ok) {
        setLoading(false);
        return;
      }
      const data = await response.json();

      const stats = {};
      (data.businesses || []).forEach((b) => {
        stats[b.id] = {
          conversations: b.conversations ?? 0,
          messages: b.messages ?? 0,
          responseRate: b.responseRate ?? 0,
        };
      });

      setTopQuestions(
        (data.top_questions || []).map((item) => ({ q: item.question, count: item.count })),
      );

      const langLabels = { ar: 'Darija (Arabe)', fr: 'Français', en: 'Anglais', unknown: 'Autre' };
      const langCounts = data.language_counts || {};
      const totalLang = Object.values(langCounts).reduce((s, v) => s + v, 0);
      setLanguageDistribution(
        Object.entries(langCounts)
          .filter(([_, count]) => count > 0)
          .map(([lang, count]) => ({
            lang: langLabels[lang] || lang,
            pct: totalLang > 0 ? Math.round((count / totalLang) * 100) : 0,
            color: lang === 'fr' ? 'bg-primary' : lang === 'ar' ? 'bg-secondary' : lang === 'en' ? 'bg-tertiary' : 'bg-outline',
          })),
      );

      const interactions = (data.recent_messages || []).map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        businessId: m.business_id,
        businessName: m.business_name,
        language: m.language,
        question: m.question,
        createdAt: m.created_at,
      }));
      const conversationCounts = {};
      interactions.forEach((item) => {
        const key = `${item.businessId}:${item.conversationId}`;
        conversationCounts[key] = (conversationCounts[key] || 0) + 1;
      });
      setRecentInteractions(
        interactions.slice(0, 5).map((item) => ({
          ...item,
          messageCount: conversationCounts[`${item.businessId}:${item.conversationId}`] || 1,
        })),
      );

      setBusinessStats(stats);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [owner, ownerToken]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const loadDocuments = useCallback(() => {
    if (!manageBusiness) {
      setDocuments([]);
      return;
    }

    fetch(`${API_URL}/businesses/${manageBusiness.id}/documents`, {
      headers: authHeaders(ownerToken),
    })
      .then((response) => response.json())
      .then((data) => setDocuments(data.documents || []))
      .catch(() => setDocuments([]));
  }, [manageBusiness, ownerToken]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const totals = useMemo(() => {
    const conversationTotal = Object.values(businessStats).reduce(
      (sum, stat) => sum + (stat.conversations || 0),
      0,
    );
    const messageTotal = Object.values(businessStats).reduce(
      (sum, stat) => sum + (stat.messages || 0),
      0,
    );
    const rates = Object.values(businessStats)
      .map((stat) => stat.responseRate)
      .filter((rate) => rate > 0);
    const avgResponse =
      rates.length > 0
        ? Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length)
        : 0;

    const messageCounts = recentInteractions.map((i) => i.messageCount);
    const maxMsgCount = Math.max(...messageCounts, 1);
    const sparkline = messageCounts.length >= 7
      ? messageCounts.slice(0, 7).map((c) => Math.round((c / maxMsgCount) * 80))
      : [40, 55, 45, 70, 60, 80, 75];

    return {
      conversations: conversationTotal,
      messages: messageTotal,
      responseRate: avgResponse,
      activeBusinesses: businesses.length,
      sparkline,
    };
  }, [businessStats, businesses.length, recentInteractions]);

  const filteredBusinesses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return businesses;
    return businesses.filter(
      (business) =>
        business.name?.toLowerCase().includes(query) ||
        business.business_type?.toLowerCase().includes(query) ||
        business.slug?.toLowerCase().includes(query),
    );
  }, [businesses, searchQuery]);

  const createBusiness = async (event) => {
    event.preventDefault();
    setIsCreating(true);

    try {
      const response = await fetch(`${API_URL}/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(ownerToken) },
        body: JSON.stringify({ ...form, owner_id: owner.id }),
      });

      if (!response.ok) throw new Error('Could not create business');

      const business = await response.json();
      setBusinesses((current) => [business, ...current]);
      setForm({
        name: '',
        business_type: 'restaurant',
        description: '',
        owner_email: '',
        owner_phone: '',
      });
      setShowCreateModal(false);
    } finally {
      setIsCreating(false);
    }
  };

  const openEdit = (business) => {
    setEditBusiness(business);
    setCoverFile(null);
    setCoverPreview(resolveApiUrl(business.cover_image_url));
    setEditForm({
      name: business.name || '',
      business_type: business.business_type || '',
      description: business.description || '',
      owner_email: business.owner_email || '',
      owner_phone: business.owner_phone || '',
      city: business.city || '',
      address: business.address || '',
      latitude: business.latitude != null ? String(business.latitude) : '',
      longitude: business.longitude != null ? String(business.longitude) : '',
      working_hours: business.working_hours || '',
      primary_services: business.primary_services || '',
      highlights: business.highlights || '',
    });
  };

  const parseCoord = (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return null;
    const parsed = Number.parseFloat(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const updateBusiness = async (event) => {
    event.preventDefault();
    if (!editBusiness) return;

    setIsUpdating(true);
    try {
      const payload = {
        ...editForm,
        latitude: parseCoord(editForm.latitude),
        longitude: parseCoord(editForm.longitude),
      };

      const response = await fetch(`${API_URL}/businesses/${editBusiness.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(ownerToken) },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Could not update business');

      let updated = await response.json();

      if (coverFile) {
        updated = await uploadBusinessCover(editBusiness.id, coverFile, ownerToken);
      }

      setBusinesses((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditBusiness(null);
      setCoverFile(null);
      setCoverPreview(null);
    } finally {
      setIsUpdating(false);
    }
  };

  const copyLink = async (business, type) => {
    const path = type === 'chat' ? business.chat_url : business.site_url;
    await navigator.clipboard.writeText(`${appOrigin}${path}`);
  };

  const downloadQrCode = () => {
    if (!qrBusiness) return;
    const canvas = document.getElementById('dashboard-qr-code');
    if (!canvas) return;

    const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = `${qrBusiness.slug}-qr-code.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const scrollToSection = (id) => {
    setActiveNav(id);
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const saveProfile = (event) => {
    event.preventDefault();
    const updated = { ...session, owner: { ...owner, ...profileForm } };
    saveSession(updated);
    setSession(updated);
    setEditingProfile(false);
  };

  const startEditingProfile = () => {
    setProfileForm({ full_name: owner.full_name || '', email: owner.email || '' });
    setEditingProfile(true);
  };

  const ownerName = (owner?.full_name || 'MOUHAMED').toUpperCase();

  if (!owner) {
    return (
      <div className="bg-warm-bg text-on-background min-h-screen flex items-center justify-center page-enter">
        <p className="font-body-md text-body-md text-on-surface-variant">Redirection vers la connexion...</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-warm-bg text-on-background min-h-screen page-enter relative overflow-hidden">
        <div className="orb top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full bg-primary/5" />
        <div className="orb bottom-[-150px] left-[-150px] w-[400px] h-[400px] rounded-full bg-secondary/5" />
      <aside className="h-screen w-64 fixed left-0 top-0 bg-warm-bg border-r border-hairline-border flex flex-col py-md px-sm justify-between z-50">
        <div className="space-y-lg">
          <div className="px-xs">
            <a href={ROUTES.home} className="no-underline inline-flex items-center gap-2">
              <SahelLogo size={24} textClass="font-headline-sm text-headline-sm font-bold text-on-background" />
            </a>
            <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60">SME Solutions</p>
          </div>
          <nav className="space-y-base">
            {NAV_ITEMS.map((item) => {
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center gap-xs px-xs py-sm transition-all font-label-md text-label-md border-0 cursor-pointer ${
                    active
                      ? 'bg-surface-blue text-primary border-l-4 border-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-low bg-transparent border-l-4 border-transparent'
                  }`}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="px-xs">
            <a
              href={ROUTES.onboarding}
              className="w-full bg-primary text-on-primary py-sm rounded-xl font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-xs no-underline"
            >
              <Icon name="add" className="text-[18px]" />
              <span>New AI Project</span>
            </a>
          </div>
        </div>
        <div className="space-y-base border-t border-hairline-border pt-md">
          <a
            href={ROUTES.contact}
            className="flex items-center gap-xs px-xs py-sm text-on-surface-variant hover:bg-surface-container-low transition-all font-label-md text-label-md no-underline"
          >
            <Icon name="help_outline" />
            <span>Help Center</span>
          </a>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-xs px-xs py-sm text-error hover:bg-error-container/10 transition-all font-label-md text-label-md border-0 bg-transparent cursor-pointer"
          >
            <Icon name="logout" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="ml-64 p-margin max-w-7xl mx-auto">
        <header id="overview" className="flex flex-col md:flex-row md:items-end justify-between mb-lg scroll-mt-6 gap-md">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-display-lg text-display-lg text-on-background m-0 leading-tight">
                Bonjour, {ownerName}
              </h1>
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" title="En direct" />
            </div>
            <p className="font-body-lg text-body-lg text-on-surface-variant mt-xs">
              Voici un aperçu de votre écosystème commercial.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="bg-primary text-on-primary px-lg py-sm rounded-xl font-headline-sm text-sm hover:scale-[1.02] transition-all shadow-lg shadow-primary/20 flex items-center gap-xs border-0 cursor-pointer"
          >
            <Icon name="add_business" />
            <span>+ Nouveau commerce</span>
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-md mb-lg">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white border border-hairline-border p-md rounded-xl animate-pulse">
                <div className="flex items-center gap-sm mb-sm">
                  <div className="w-10 h-10 rounded-xl bg-outline/10" />
                  <div className="h-5 w-14 rounded-full bg-outline/10 ml-auto" />
                </div>
                <div className="h-3 w-24 bg-outline/10 rounded mb-2" />
                <div className="h-8 w-16 bg-outline/10 rounded" />
                <div className="mt-2 h-6 bg-outline/10 rounded" />
              </div>
            ))
          ) : (
            <>
              <div className="bg-white border border-hairline-border p-md rounded-xl group hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/20 transition-all duration-300">
                <div className="flex items-center gap-sm mb-sm">
                  <div className="w-10 h-10 rounded-xl bg-surface-blue flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-[8deg] transition-all duration-300">
                    <span className="material-symbols-outlined">forum</span>
                  </div>
                  <span className="bg-secondary/10 text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full ml-auto group-hover:bg-secondary/20 transition-colors">
                    {totals.conversations > 0 ? '+12%' : '—'}
                  </span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider m-0">
                  Conversations
                </p>
                <h2 className="font-headline-sm text-headline-sm text-on-background mt-1 m-0">
                  <AnimatedNumber value={totals.conversations} />
                </h2>
                <div className="mt-2 flex gap-[2px] items-end h-6">
                  {totals.sparkline.map((h, i) => (
                    <div
                      key={i}
                      className="w-full bg-gradient-to-t from-primary/30 to-primary/10 rounded-t transition-all duration-500"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-white border border-hairline-border p-md rounded-xl group hover:shadow-xl hover:-translate-y-0.5 hover:border-secondary/20 transition-all duration-300">
                <div className="flex items-center gap-sm mb-sm">
                  <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 group-hover:rotate-[8deg] transition-all duration-300">
                    <span className="material-symbols-outlined">speed</span>
                  </div>
                  <span className="bg-secondary/10 text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full ml-auto group-hover:bg-secondary/20 transition-colors">
                    {totals.responseRate >= 80 ? 'Excellent' : totals.responseRate >= 50 ? 'Moyen' : 'À améliorer'}
                  </span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider m-0">
                  Taux de réponse
                </p>
                <h2 className="font-headline-sm text-headline-sm text-on-background mt-1 m-0">
                  <AnimatedNumber value={totals.responseRate} />%
                </h2>
                <div className="mt-2 w-full h-1.5 bg-outline/10 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full transition-all duration-1000 ease-out" style={{ width: `${totals.responseRate}%` }} />
                </div>
              </div>
              <div className="bg-white border border-hairline-border p-md rounded-xl group hover:shadow-xl hover:-translate-y-0.5 hover:border-tertiary/20 transition-all duration-300">
                <div className="flex items-center gap-sm mb-sm">
                  <div className="w-10 h-10 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 group-hover:rotate-[8deg] transition-all duration-300">
                    <span className="material-symbols-outlined">storefront</span>
                  </div>
                  <span className="bg-primary/5 text-primary font-label-sm text-label-sm px-2 py-0.5 rounded-full ml-auto">
                    Actif
                  </span>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider m-0">
                  Commerces actifs
                </p>
                <h2 className="font-headline-sm text-headline-sm text-on-background mt-1 m-0">
                  <AnimatedNumber value={totals.activeBusinesses} />
                </h2>
                <div className="mt-2 flex -space-x-1">
                  {Array.from({ length: Math.min(totals.activeBusinesses, 5) }).map((_, i) => (
                    <div key={i} className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-[8px] font-bold border-2 border-white transition-transform hover:scale-110 hover:z-10" style={{ zIndex: 5 - i }}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  {totals.activeBusinesses > 5 && (
                    <div className="w-6 h-6 rounded-full bg-outline/20 flex items-center justify-center text-[8px] text-outline border-2 border-white">
                      +{totals.activeBusinesses - 5}
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white border border-hairline-border p-md rounded-xl group hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/20 transition-all duration-300">
                <div className="flex items-center gap-sm mb-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-[8deg] transition-all duration-300">
                    <span className="material-symbols-outlined">translate</span>
                  </div>
                </div>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider m-0">
                  Langues actives
                </p>
                <h2 className="font-headline-sm text-headline-sm text-on-background mt-1 m-0">
                  <AnimatedNumber value={3} />
                </h2>
                <div className="mt-2 flex gap-1 text-[10px]">
                  <span className="bg-surface-blue text-primary px-2 py-0.5 rounded-full font-medium transition-all hover:scale-105">AR</span>
                  <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded-full font-medium transition-all hover:scale-105">FR</span>
                  <span className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-full font-medium transition-all hover:scale-105">EN</span>
                </div>
              </div>
            </>
          )}
        </section>

        <section
          id="businesses"
          className="bg-white border border-hairline-border rounded-xl mb-lg overflow-hidden scroll-mt-6"
        >
          <div className="p-md border-b border-hairline-border flex justify-between items-center gap-md flex-wrap">
            <h3 className="font-headline-sm text-headline-sm headline-font m-0">Business Management</h3>
            <div className="relative">
              <Icon
                name="search"
                className="absolute left-xs top-1/2 -translate-y-1/2 text-outline-variant pointer-events-none"
              />
              <input
                className="pl-lg pr-md py-xs border border-hairline-border rounded-lg font-body-md text-body-md focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none"
                placeholder="Search businesses..."
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant border-b border-hairline-border">
                    Name
                  </th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant border-b border-hairline-border">
                    Type
                  </th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant border-b border-hairline-border">
                    Status
                  </th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant border-b border-hairline-border">
                    Conversations
                  </th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant border-b border-hairline-border text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline-border">
                {filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-md py-lg text-center font-body-md text-on-surface-variant">
                      {businesses.length === 0
                        ? 'No businesses yet. Create your first commerce.'
                        : 'No businesses match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((business, index) => {
                    const stat = businessStats[business.id] || { conversations: 0 };
                    const isPending = (stat.conversations || 0) === 0;
                    return (
                      <tr key={business.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-md py-md">
                          <div className="flex items-center gap-sm">
                            <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center overflow-hidden shrink-0">
                              <img
                                className="w-full h-full object-cover"
                                alt=""
                                src={
                                  coverImageUrl(business, () => PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length])
                                }
                              />
                            </div>
                            <span className="font-body-md text-body-md font-bold">{business.name}</span>
                          </div>
                        </td>
                        <td className="px-md py-md font-body-md text-body-md text-on-surface-variant">
                          {formatBusinessType(business.business_type)}
                        </td>
                        <td className="px-md py-md">
                          {isPending ? (
                            <span className="bg-orange-500/10 text-orange-600 font-label-sm text-label-sm px-xs py-1 rounded-full inline-flex items-center gap-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                              Pending
                            </span>
                          ) : (
                            <span className="bg-secondary/10 text-secondary font-label-sm text-label-sm px-xs py-1 rounded-full inline-flex items-center gap-xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-md py-md font-body-md text-body-md">{stat.conversations || 0}</td>
                        <td className="px-md py-md text-right">
                          <div className="flex justify-end gap-xs">
                            <button
                              type="button"
                              className="p-xs hover:bg-surface-blue text-primary rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                              title="QR Code"
                              onClick={() => setQrBusiness(business)}
                            >
                              <Icon name="qr_code_2" />
                            </button>
                            <button
                              type="button"
                              className="p-xs hover:bg-surface-blue text-primary rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                              title="Copy mini-site link"
                              onClick={() => copyLink(business, 'site')}
                            >
                              <Icon name="link" />
                            </button>
                            <button
                              type="button"
                              className="p-xs hover:bg-surface-blue text-primary rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                              title="Edit"
                              onClick={() => openEdit(business)}
                            >
                              <Icon name="edit" />
                            </button>
                            <button
                              type="button"
                              className="p-xs hover:bg-error/10 text-error rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                              title="Delete"
                              onClick={() => {
                                // eslint-disable-next-line no-alert
                                window.alert(
                                  'Business deletion is not available yet. Open Settings below for documents and the assistant.',
                                );
                              }}
                            >
                              <Icon name="delete" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="analytics"
          className="scroll-mt-6 mb-lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-md">
            {/* Top Questions */}
            <div className="bg-white border border-hairline-border rounded-xl p-md">
              <h3 className="font-headline-sm text-headline-sm m-0 mb-md flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">quiz</span>
                Questions les plus fréquentes
              </h3>
              <div className="space-y-3">
                {topQuestions.length === 0 ? (
                  <p className="text-on-surface-variant font-body-md text-body-md text-center py-lg">
                    Aucune question pour le moment.
                  </p>
                ) : (
                  topQuestions.map((item, i) => {
                    const maxCount = topQuestions[0].count || 1;
                    const pct = (item.count / maxCount) * 100;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant w-5 shrink-0 text-right">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-on-surface truncate">{item.q}</span>
                            <span className="text-on-surface-variant shrink-0 ml-2">{item.count}</span>
                          </div>
                          <div className="w-full h-2 bg-outline/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-primary to-primary-fixed-dim transition-all duration-1000"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Language Distribution */}
            <div className="bg-white border border-hairline-border rounded-xl p-md">
              <h3 className="font-headline-sm text-headline-sm m-0 mb-md flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
                Répartition par langue
              </h3>
              <div className="space-y-4">
                {languageDistribution.length === 0 ? (
                  <p className="text-on-surface-variant font-body-md text-body-md text-center py-lg">
                    Aucune donnée linguistique pour le moment.
                  </p>
                ) : (
                  languageDistribution.map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-on-surface font-medium">{item.lang}</span>
                        <span className="text-on-surface-variant">{item.pct}%</span>
                      </div>
                      <div className="w-full h-3 bg-outline/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-1000`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-4 pt-3 border-t border-hairline-border flex items-center justify-between text-xs text-on-surface-variant">
                <span>Basé sur les {totals.messages || 1} interactions récentes</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                  Mise à jour en direct
                </span>
              </div>
            </div>
          </div>

          {/* Recent Interactions */}
          <div className="bg-white border border-hairline-border rounded-xl overflow-hidden">
            <div className="p-md border-b border-hairline-border flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm m-0 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">chat</span>
                Interactions récentes
              </h3>
              <button
                type="button"
                onClick={loadDashboardData}
                className="text-primary font-label-md text-label-md hover:underline transition-all border-0 bg-transparent cursor-pointer"
              >
                Tout voir
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant border-b border-hairline-border">
                      Client
                    </th>
                    <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant border-b border-hairline-border">
                      Commerce
                    </th>
                    <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant border-b border-hairline-border">
                      Langue
                    </th>
                    <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant border-b border-hairline-border">
                      Messages
                    </th>
                    <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant border-b border-hairline-border">
                      Dernier message
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline-border">
                  {recentInteractions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-md py-lg text-center font-body-md text-on-surface-variant">
                        Aucune interaction pour le moment. Partagez votre mini-site ou QR code pour commencer à recevoir des messages.
                      </td>
                    </tr>
                  ) : (
                    recentInteractions.map((row) => (
                      <tr key={row.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="px-md py-md font-body-md text-body-md text-on-surface-variant font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                              {clientId(row.conversationId).slice(-2)}
                            </div>
                            {clientId(row.conversationId)}
                          </div>
                        </td>
                        <td className="px-md py-md font-body-md text-body-md">{row.businessName}</td>
                        <td className="px-md py-md">
                          <span className="px-2 py-0.5 bg-surface-blue text-primary font-label-sm text-label-sm rounded-full border border-primary/20">
                            {languageBadge(row.language)}
                          </span>
                        </td>
                        <td className="px-md py-md font-body-md text-body-md">
                          <span className="bg-primary/5 text-primary px-2 py-0.5 rounded-full font-semibold text-xs">
                            {row.messageCount}
                          </span>
                        </td>
                        <td className="px-md py-md font-body-md text-body-md text-on-surface-variant max-w-[200px] truncate">
                          {truncate(row.question)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="p-md text-center border-t border-hairline-border">
                <p className="font-label-sm text-label-sm text-on-surface-variant opacity-60 italic m-0">
                  Affichage de {Math.min(5, recentInteractions.length)} interaction(s) sur {totals.conversations} au total.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="settings" className="scroll-mt-6 mb-lg">
          {manageBusiness ? (
            <div className="bg-white border border-hairline-border rounded-xl p-md">
              <div className="flex justify-between items-center gap-md flex-wrap mb-md">
                <h3 className="font-headline-sm text-headline-sm headline-font m-0">
                  Workspace — {manageBusiness.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setManageBusiness(null)}
                  className="text-on-surface-variant font-label-md border-0 bg-transparent cursor-pointer hover:text-primary"
                >
                  Close
                </button>
              </div>
              <div className="flex flex-wrap gap-sm mb-md">
                <a
                  href={`${appOrigin}${manageBusiness.site_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-label-md no-underline hover:underline"
                >
                  Open mini-site
                </a>
                <a
                  href={`${appOrigin}${manageBusiness.chat_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-label-md no-underline hover:underline"
                >
                  Open chatbot
                </a>
              </div>
              {/* Intégration — embed widget */}
              <details className="group bg-surface-container-low/50 border border-hairline-border rounded-xl overflow-hidden mb-md">
                <summary className="px-md py-sm cursor-pointer font-headline-sm text-headline-sm flex items-center gap-2 select-none hover:bg-surface-blue/20 transition-colors list-none [&::-webkit-details-marker]:hidden">
                  <span className="material-symbols-outlined text-primary text-lg">code</span>
                  Intégration — Widget Chat
                  <span className="material-symbols-outlined ml-auto text-outline group-open:rotate-90 transition-transform">chevron_right</span>
                </summary>
                <div className="px-md pb-md space-y-sm">
                  <p className="font-body-md text-body-md text-on-surface-variant m-0">
                    Copiez ces deux lignes et collez-les dans le <code className="bg-outline/10 px-1 rounded text-sm">&lt;head&gt;</code> ou juste avant <code className="bg-outline/10 px-1 rounded text-sm">&lt;/body&gt;</code> de votre site existant. Une bulle de chat apparaîtra automatiquement.
                  </p>
                  <div className="relative">
                    <pre className="bg-deep-navy text-green-400 p-sm rounded-xl text-xs leading-relaxed overflow-x-auto m-0 font-mono">{`<script src="${API_URL}/embed/${manageBusiness.slug}.js" defer></script>`}</pre>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(`<script src="${API_URL}/embed/${manageBusiness.slug}.js" defer></script>`)}
                      className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs border-0 cursor-pointer transition-colors flex items-center gap-1"
                      title="Copier le snippet"
                    >
                      <span className="material-symbols-outlined !text-[14px]">content_copy</span>
                    </button>
                  </div>
                  <p className="font-label-sm text-label-sm text-outline m-0">
                    💡 Testez-le sur votre site ou sur une page HTML locale pour vérifier l'affichage.
                  </p>
                </div>
              </details>

              <FileUpload
                businessId={manageBusiness.id}
                ownerToken={ownerToken}
                onFileUpload={setUploadedFile}
                currentFile={uploadedFile}
                onUploadComplete={loadDocuments}
              />
              {documents.length > 0 ? (
                <ul className="mt-md space-y-xs font-body-md text-body-md text-on-surface-variant">
                  {documents.map((doc) => (
                    <li key={doc.id}>
                      {doc.file_name} — {doc.chunks} chunks
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-md border border-hairline-border rounded-xl overflow-hidden">
                <ChatInterface
                  business={manageBusiness}
                  documentName={uploadedFile?.name}
                  onMessageSaved={loadDashboardData}
                />
              </div>
            </div>
          ) : (
            <div className="bg-white border border-hairline-border rounded-xl p-md">
              <div className="flex justify-between items-center gap-md flex-wrap mb-sm">
                <h3 className="font-headline-sm text-headline-sm headline-font m-0">Account</h3>
                {!editingProfile ? (
                  <button
                    type="button"
                    onClick={startEditingProfile}
                    className="text-primary font-label-md text-label-md border-0 bg-transparent cursor-pointer hover:underline"
                  >
                    Edit
                  </button>
                ) : null}
              </div>
              {editingProfile ? (
                <form onSubmit={saveProfile} className="grid gap-sm">
                  <label className="grid gap-xs font-label-md text-label-md">
                    Full name
                    <input
                      required
                      className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                      value={profileForm.full_name}
                      onChange={(event) =>
                        setProfileForm({ ...profileForm, full_name: event.target.value })
                      }
                    />
                  </label>
                  <label className="grid gap-xs font-label-md text-label-md">
                    Email
                    <input
                      type="email"
                      required
                      className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                      value={profileForm.email}
                      onChange={(event) =>
                        setProfileForm({ ...profileForm, email: event.target.value })
                      }
                    />
                  </label>
                  <div className="flex gap-sm justify-end mt-xs">
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="px-md py-xs rounded-xl border border-hairline-border bg-white cursor-pointer font-label-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-md py-xs rounded-xl bg-primary text-on-primary border-0 cursor-pointer font-label-md"
                    >
                      Save
                    </button>
                  </div>
                </form>
              ) : (
                <p className="font-body-md text-body-md text-on-surface-variant m-0">
                  {owner.full_name} &middot; {owner.email}
                </p>
              )}
            </div>
          )}
        </section>

        <footer className="mt-xl py-lg flex flex-col md:flex-row justify-between items-center gap-md border-t border-hairline-border opacity-60">
          <p className="font-label-sm text-label-sm text-on-background m-0">
            © 2024 Sahel.ai. Made for Moroccan SMEs.
          </p>
          <div className="flex gap-md">
            <a
              href={ROUTES.privacy}
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors no-underline"
            >
              Privacy Policy
            </a>
            <a
              href={ROUTES.terms}
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors no-underline"
            >
              Terms of Service
            </a>
            <a
              href={ROUTES.contact}
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors no-underline"
            >
              Contact
            </a>
          </div>
        </footer>
      </main>
    </div>

      {showCreateModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-md overflow-y-auto">
          <div className="bg-white rounded-xl border border-hairline-border p-md w-full max-w-md">
            <h3 className="font-headline-sm text-headline-sm headline-font mt-0">Nouveau commerce</h3>
            <form className="grid gap-sm" onSubmit={createBusiness}>
              <label className="grid gap-xs font-label-md text-label-md">
                Business name
                <input
                  required
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                Type
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={form.business_type}
                  onChange={(event) => setForm({ ...form, business_type: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                Description
                <textarea
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md min-h-[72px]"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                Phone / WhatsApp
                <input
                  type="tel"
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={form.owner_phone}
                  onChange={(event) => setForm({ ...form, owner_phone: event.target.value })}
                  placeholder="+212 6XX XXX XXX"
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                Email
                <input
                  type="email"
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={form.owner_email}
                  onChange={(event) => setForm({ ...form, owner_email: event.target.value })}
                  placeholder="contact@example.com"
                />
              </label>
              <div className="flex gap-sm justify-end mt-sm">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-md py-xs rounded-xl border border-hairline-border bg-white cursor-pointer font-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || !form.name.trim()}
                  className="px-md py-xs rounded-xl bg-primary text-on-primary border-0 cursor-pointer font-label-md disabled:opacity-60"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editBusiness ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-md overflow-y-auto">
          <div className="bg-white rounded-xl border border-hairline-border p-md w-full max-w-lg my-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-headline-sm text-headline-sm headline-font mt-0">Mini-site & profil</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-0 mb-md">
              Ces informations alimentent directement votre page publique et la carte.
            </p>
            <form className="grid gap-sm" onSubmit={updateBusiness}>
              <label className="grid gap-xs font-label-md text-label-md">
                Cover photo
                <div
                  className="border border-dashed border-hairline-border rounded-lg p-sm cursor-pointer hover:bg-surface-container-low transition-colors"
                  onClick={() => document.getElementById('dashboard-cover-input')?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && document.getElementById('dashboard-cover-input')?.click()}
                  role="button"
                  tabIndex={0}
                >
                  <input
                    id="dashboard-cover-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const selected = event.target.files?.[0];
                      if (!selected) return;
                      setCoverFile(selected);
                      setCoverPreview(URL.createObjectURL(selected));
                    }}
                  />
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover preview" className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <p className="font-body-md text-on-surface-variant m-0 text-center py-md">Upload JPG, PNG or WEBP</p>
                  )}
                </div>
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                Name
                <input
                  required
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.name}
                  onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                Type
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.business_type}
                  onChange={(event) => setEditForm({ ...editForm, business_type: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                Description (shown on mini-site)
                <textarea
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md min-h-[72px]"
                  value={editForm.description}
                  onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                <label className="grid gap-xs font-label-md text-label-md">
                  City
                  <input
                    className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                    value={editForm.city}
                    onChange={(event) => setEditForm({ ...editForm, city: event.target.value })}
                  />
                </label>
                <label className="grid gap-xs font-label-md text-label-md">
                  Hours
                  <input
                    className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                    value={editForm.working_hours}
                    onChange={(event) => setEditForm({ ...editForm, working_hours: event.target.value })}
                  />
                </label>
              </div>
              <label className="grid gap-xs font-label-md text-label-md">
                Full address
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.address}
                  onChange={(event) => setEditForm({ ...editForm, address: event.target.value })}
                  placeholder="Street address for map & directions"
                />
              </label>
              <div className="grid grid-cols-2 gap-sm">
                <label className="grid gap-xs font-label-md text-label-md">
                  Latitude
                  <input
                    className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                    value={editForm.latitude}
                    onChange={(event) => setEditForm({ ...editForm, latitude: event.target.value })}
                  />
                </label>
                <label className="grid gap-xs font-label-md text-label-md">
                  Longitude
                  <input
                    className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                    value={editForm.longitude}
                    onChange={(event) => setEditForm({ ...editForm, longitude: event.target.value })}
                  />
                </label>
              </div>
              <label className="grid gap-xs font-label-md text-label-md">
                Services (comma-separated)
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.primary_services}
                  onChange={(event) => setEditForm({ ...editForm, primary_services: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                Highlights (comma-separated)
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.highlights}
                  onChange={(event) => setEditForm({ ...editForm, highlights: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                WhatsApp / phone
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.owner_phone}
                  onChange={(event) => setEditForm({ ...editForm, owner_phone: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                Email
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.owner_email}
                  onChange={(event) => setEditForm({ ...editForm, owner_email: event.target.value })}
                />
              </label>
              <button
                type="button"
                className="text-primary font-label-md border-0 bg-transparent cursor-pointer p-0 text-left hover:underline"
                onClick={() => {
                  setManageBusiness(editBusiness);
                  setEditBusiness(null);
                  setActiveNav('settings');
                  document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Open documents & assistant workspace
              </button>
              <div className="flex gap-sm justify-end mt-sm">
                <button
                  type="button"
                  onClick={() => setEditBusiness(null)}
                  className="px-md py-xs rounded-xl border border-hairline-border bg-white cursor-pointer font-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editForm.name.trim()}
                  className="px-md py-xs rounded-xl bg-primary text-on-primary border-0 cursor-pointer font-label-md disabled:opacity-60"
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {qrBusiness ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-md overflow-y-auto">
          <div className="bg-white rounded-xl border border-hairline-border p-md w-full max-w-sm text-center">
            <h3 className="font-headline-sm text-headline-sm headline-font mt-0">{qrBusiness.name}</h3>
            <div className="flex justify-center my-md">
              <QRCodeCanvas
                id="dashboard-qr-code"
                value={`${appOrigin}${qrBusiness.site_url}`}
                size={160}
                includeMargin
              />
            </div>
            <div className="flex gap-sm justify-center">
              <button
                type="button"
                onClick={downloadQrCode}
                className="px-md py-xs rounded-xl bg-primary text-on-primary border-0 cursor-pointer font-label-md"
              >
                Download PNG
              </button>
              <button
                type="button"
                onClick={() => setQrBusiness(null)}
                className="px-md py-xs rounded-xl border border-hairline-border bg-white cursor-pointer font-label-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
