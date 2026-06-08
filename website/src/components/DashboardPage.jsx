import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import FileUpload from './FileUpload';
import { ROUTES, loginUrl } from '../lib/routes';
import { authHeaders, clearSession, getSession, saveSession } from '../lib/session';
import { API_URL, resolveApiUrl } from '../config';
import { uploadBusinessCover } from '../lib/businessSite';
import SahelLogo from './SahelLogo';
import CoverPhotoUploader from './CoverPhotoUploader';
import { useLanguage, LanguageSwitcher } from '../i18n';

function languageBadge(language) {
  const map = {
    ar: 'AR (Darija)',
    fr: 'FR',
    en: 'EN',
  };
  return map[language] || (language ? language.toUpperCase() : '—');
}

const parseCoord = (value) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

function BusinessDetailView({ business, ownerToken, onBack, onUpdate, onDelete }) {
  const [form, setForm] = useState({
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
    social_media: business.social_media || '',
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(resolveApiUrl(business.cover_image_url));
  const [isSaving, setIsSaving] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [detailConvId, setDetailConvId] = useState(null);
  const [detailMessages, setDetailMessages] = useState([]);
  const [detailInput, setDetailInput] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/businesses/${business.id}/documents`, {
      headers: authHeaders(ownerToken),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((d) => setDocuments(d.documents || []))
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setDocuments([]);
      });
    return () => controller.abort();
  }, [business.id, ownerToken]);

  useEffect(() => {
    setForm({
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
      social_media: business.social_media || '',
    });
    setCoverPreview(resolveApiUrl(business.cover_image_url));
  }, [business]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    let updated;
    try {
      const payload = {
        ...form,
        latitude: parseCoord(form.latitude),
        longitude: parseCoord(form.longitude),
      };
      const res = await fetch(`${API_URL}/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(ownerToken) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Update failed');
      }
      updated = await res.json();

      // Sync text details immediately
      onUpdate(updated);

      if (coverFile) {
        try {
          const updatedWithCover = await uploadBusinessCover(business.id, coverFile, ownerToken);
          updated = updatedWithCover;
          setCoverFile(null);
          setCoverPreview(resolveApiUrl(updated.cover_image_url));
          onUpdate(updated); // Sync again with new cover URL
        } catch (uploadErr) {
          console.error('Cover photo upload failed:', uploadErr);
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error('Save changes failed:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChat = async () => {
    const text = detailInput.trim();
    if (!text || detailLoading) return;
    setDetailMessages((prev) => [...prev, { id: `${Date.now()}-user`, text, sender: 'user' }]);
    setDetailInput('');
    setDetailLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(`${API_URL}/businesses/${business.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders(ownerToken) },
        signal: controller.signal,
        body: JSON.stringify({ question: text, conversation_id: detailConvId }),
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      setDetailConvId(data.conversation_id);
      setDetailMessages((prev) => [...prev, { id: `${Date.now()}-bot`, text: data.answer, sender: 'bot' }]);
    } catch {
      setDetailMessages((prev) => [...prev, { id: `${Date.now()}-error`, text: 'Sorry, could not connect.', sender: 'bot' }]);
    } finally {
      setDetailLoading(false);
    }
  };

  const appOrigin = window.location.origin;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-surface-container-low rounded-full transition-all active:scale-95 border-0 bg-transparent cursor-pointer">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          <h1 className="font-headline-sm text-headline-sm text-on-surface m-0">Site Settings</h1>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="font-label-md text-label-md text-secondary flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">check_circle</span>Saved</span>}
          <button onClick={handleSave} disabled={isSaving || !form.name.trim()} className="bg-primary text-on-primary font-label-md text-label-md px-6 py-2.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/10 border-0 cursor-pointer disabled:opacity-50 whitespace-nowrap">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-lg">
        <aside className="md:col-span-3 space-y-2 hidden md:block">
          <nav className="space-y-1">
            {[
              { id: 'general', label: 'General Info', icon: 'settings' },
              { id: 'social', label: 'Social Presence', icon: 'share' },
              { id: 'hours', label: 'Operating Hours', icon: 'schedule' },
              { id: 'knowledge', label: 'Knowledge Base', icon: 'psychology' },
            ].map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full py-3 px-4 flex items-center gap-3 font-label-md text-label-md rounded-lg transition-all border-0 cursor-pointer text-left ${activeTab === item.id ? 'bg-surface-blue text-primary border-l-2 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-6 p-4 bg-white hairline rounded-xl shadow-sm">
            <h4 className="font-label-md text-label-md text-on-surface flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[18px]">code</span>
              Integration
            </h4>
            <p className="font-body-md text-body-md text-on-surface-variant m-0 mb-3 text-sm">Embed this mini-site on your website.</p>
            <div className="relative">
              <pre className="bg-deep-navy text-green-400 p-3 rounded-lg text-xs leading-relaxed overflow-x-auto m-0 font-mono">{`<script src="${API_URL}/embed/${business.slug}.js" defer></script>`}</pre>
              <button onClick={() => navigator.clipboard.writeText(`<script src="${API_URL}/embed/${business.slug}.js" defer></script>`)} className="absolute top-1.5 right-1.5 p-1.5 bg-white/10 hover:bg-white/20 rounded text-white text-xs border-0 cursor-pointer" title="Copy">
                <span className="material-symbols-outlined !text-[12px]">content_copy</span>
              </button>
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              <button onClick={() => navigator.clipboard.writeText(`${appOrigin}${business.site_url}`)} className="text-primary font-label-sm text-label-sm border-0 bg-transparent cursor-pointer hover:bg-primary-fixed/30 rounded-lg py-1.5 px-2 inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined !text-[14px]">link</span>Copy Site URL
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-hairline-border">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">qr_code</span>QR Code
              </p>
              <div className="flex justify-center bg-surface-container-low rounded-lg p-2">
                <QRCodeCanvas value={`${appOrigin}${business.site_url}`} size={100} includeMargin />
              </div>
            </div>
          </div>
        </aside>

        <div className="md:col-span-9 space-y-lg">
          <section className="bg-white hairline rounded-xl p-md flex flex-col md:flex-row md:items-center justify-between gap-md border-primary/20 bg-gradient-to-r from-surface-blue/50 to-background shadow-sm">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">language</span>
              </div>
              <div>
                <h3 className="font-label-md text-label-md text-on-surface m-0">Live Mini-Site</h3>
                <p className="text-primary font-mono text-body-md m-0 mt-0.5">{appOrigin}{business.site_url}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigator.clipboard.writeText(`${appOrigin}${business.site_url}`)} className="bg-white hairline text-on-surface font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-surface-container-low transition-all flex items-center gap-2 border-0 cursor-pointer">
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
                Copy Link
              </button>
              <a href={`${appOrigin}${business.site_url}`} target="_blank" rel="noreferrer" className="bg-primary/5 text-primary font-label-md text-label-md px-4 py-2 rounded-lg hover:bg-primary/10 transition-all flex items-center gap-2 no-underline">
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                View Site
              </a>
            </div>
          </section>

          {activeTab === 'general' && (
            <section className="space-y-sm">
              <h2 className="font-headline-md text-headline-md text-on-surface border-b border-hairline-border pb-2 m-0">General Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div className="space-y-base">
                  <label className="font-label-md text-label-md text-on-surface-variant">Business Name</label>
                  <input className="w-full bg-white hairline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-base">
                  <label className="font-label-md text-label-md text-on-surface-variant">Category</label>
                  <select className="w-full bg-white hairline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none" value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })}>
                    <option value="">Select a category</option>
                    <option value="restaurant">Restaurant</option>
                    <option value="hotel">Hotel / Riad</option>
                    <option value="cafe">Cafe</option>
                    <option value="shop">Shop</option>
                    <option value="service">Service</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-base">
                  <label className="font-label-md text-label-md text-on-surface-variant">About Your Business</label>
                  <textarea className="w-full bg-white hairline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-y" rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="space-y-base">
                  <label className="font-label-md text-label-md text-on-surface-variant">City</label>
                  <input className="w-full bg-white hairline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="e.g. Marrakech" />
                </div>
                <div className="space-y-base">
                  <label className="font-label-md text-label-md text-on-surface-variant">Address</label>
                  <input className="w-full bg-white hairline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, area, landmark" />
                </div>
                <div className="space-y-base">
                  <label className="font-label-md text-label-md text-on-surface-variant">Latitude</label>
                  <input className="w-full bg-white hairline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" type="text" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="31.6295" />
                </div>
                <div className="space-y-base">
                  <label className="font-label-md text-label-md text-on-surface-variant">Longitude</label>
                  <input className="w-full bg-white hairline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" type="text" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="-7.9811" />
                </div>
                <div className="space-y-base">
                  <label className="font-label-md text-label-md text-on-surface-variant">Phone</label>
                  <input className="w-full bg-white hairline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" type="text" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} placeholder="+212 6XX-XXXXXX" />
                </div>
                <div className="space-y-base">
                  <label className="font-label-md text-label-md text-on-surface-variant">Email</label>
                  <input className="w-full bg-white hairline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" type="email" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} placeholder="contact@business.com" />
                </div>
                <div className="space-y-base">
                  <label className="font-label-md text-label-md text-on-surface-variant">Primary Services</label>
                  <input className="w-full bg-white hairline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" type="text" value={form.primary_services} onChange={(e) => setForm({ ...form, primary_services: e.target.value })} placeholder="e.g. Restaurant, Catering" />
                </div>
                <div className="space-y-base">
                  <label className="font-label-md text-label-md text-on-surface-variant">Highlights</label>
                  <input className="w-full bg-white hairline rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" type="text" value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} placeholder="e.g. Traditional, Family-run" />
                </div>
              </div>
              <div className="mt-md space-y-base">
                <label className="font-label-md text-label-md text-on-surface-variant">Cover Photo</label>
                <CoverPhotoUploader
                  coverPreview={coverPreview}
                  onFileSelect={(f) => { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }}
                  inputId="detail-cover-input"
                  placeholderText="Click to upload a cover image"
                />
              </div>
            </section>
          )}

          {activeTab === 'social' && (
            <section className="space-y-sm">
              <h2 className="font-headline-md text-headline-md text-on-surface border-b border-hairline-border pb-2 m-0">Social Presence</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {[
                  { key: 'whatsapp', icon: 'chat', color: 'text-[#25D366]', placeholder: 'WhatsApp Number', prefix: '+' },
                  { key: 'instagram', icon: 'photo_camera', color: 'text-[#E1306C]', placeholder: 'Instagram Username' },
                  { key: 'facebook', icon: 'face_nod', color: 'text-[#1877F2]', placeholder: 'Facebook Page URL' },
                  { key: 'tiktok', icon: 'music_note', color: 'text-black', placeholder: 'TikTok Username' },
                  { key: 'linkedin', icon: 'work', color: 'text-[#0A66C2]', placeholder: 'LinkedIn URL' },
                  { key: 'twitter', icon: 'alternate_email', color: 'text-[#1DA1F2]', placeholder: 'Twitter / X Username' },
                  { key: 'youtube', icon: 'play_circle', color: 'text-[#FF0000]', placeholder: 'YouTube Channel URL' },
                ].map(({ key, icon, color, placeholder }) => {
                  const current = (() => {
                    try { return JSON.parse(form.social_media || '{}')[key] || ''; } catch { return ''; }
                  })();
                  return (
                    <div key={key} className="flex items-center bg-white hairline rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                      <div className="w-12 h-12 flex items-center justify-center border-r border-hairline-border bg-surface-container-low shrink-0">
                        <span className={`material-symbols-outlined ${color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      </div>
                      <input
                        className="flex-1 px-4 py-3 outline-none border-none font-body-md"
                        placeholder={placeholder}
                        type="text"
                        value={current}
                        onChange={(e) => {
                          try {
                            const data = JSON.parse(form.social_media || '{}');
                            data[key] = e.target.value;
                            setForm({ ...form, social_media: JSON.stringify(data) });
                          } catch {
                            setForm({ ...form, social_media: JSON.stringify({ [key]: e.target.value }) });
                          }
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {activeTab === 'hours' && (
            <section className="space-y-sm">
              <h2 className="font-headline-md text-headline-md text-on-surface border-b border-hairline-border pb-2 m-0">Operating Hours</h2>
              <div className="bg-white hairline rounded-xl divide-y divide-hairline-border shadow-sm">
                {(() => {
                  let hoursData = {};
                  try { hoursData = JSON.parse(form.working_hours || '{}'); } catch { hoursData = { 'monday': { enabled: true, open: '09:00', close: '22:00' }, 'tuesday': { enabled: true, open: '09:00', close: '22:00' }, 'wednesday': { enabled: true, open: '09:00', close: '22:00' }, 'thursday': { enabled: true, open: '09:00', close: '22:00' }, 'friday': { enabled: true, open: '09:00', close: '22:00' }, 'saturday': { enabled: true, open: '10:00', close: '23:00' }, 'sunday': { enabled: false, open: '', close: '' } }; }
                  const weekdayGroup = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                  const rowDays = [
                    { key: 'weekdays', label: 'Monday - Friday', days: weekdayGroup },
                    { key: 'saturday', label: 'Saturday', days: ['saturday'] },
                    { key: 'sunday', label: 'Sunday', days: ['sunday'] },
                  ];
                  const setHours = (days, key, val) => {
                    const h = { ...hoursData };
                    days.forEach((day) => {
                      if (!h[day]) h[day] = { enabled: false, open: '', close: '' };
                      h[day][key] = val;
                    });
                    setForm({ ...form, working_hours: JSON.stringify(h) });
                  };
                  const getFirst = (days) => hoursData[days[0]] || { enabled: false, open: '', close: '' };
                  return rowDays.map(({ key, label, days }) => {
                    const d = getFirst(days);
                    const anyEnabled = days.some((day) => (hoursData[day] || {}).enabled);
                    return (
                      <div key={key} className={`p-md flex flex-wrap items-center justify-between gap-4 ${!anyEnabled ? 'opacity-50' : ''}`}>
                        <div className="flex items-center gap-4 min-w-[120px]">
                          <input type="checkbox" checked={anyEnabled} onChange={(e) => setHours(days, 'enabled', e.target.checked)} className="w-5 h-5 rounded text-primary focus:ring-primary" />
                          <span className={`font-label-md text-label-md ${anyEnabled ? 'text-on-surface' : 'text-outline'}`}>{label}</span>
                        </div>
                        {anyEnabled ? (
                          <div className="flex items-center gap-2">
                            <input type="time" value={d.open || '09:00'} onChange={(e) => setHours(days, 'open', e.target.value)} className="hairline rounded-lg px-2 py-1 text-body-md outline-none" />
                            <span className="text-on-surface-variant">-</span>
                            <input type="time" value={d.close || '22:00'} onChange={(e) => setHours(days, 'close', e.target.value)} className="hairline rounded-lg px-2 py-1 text-body-md outline-none" />
                          </div>
                        ) : (
                          <span className="text-on-surface-variant italic text-body-md">Closed</span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </section>
          )}

          {activeTab === 'knowledge' && (
            <section className="space-y-sm">
              <h2 className="font-headline-md text-headline-md text-on-surface border-b border-hairline-border pb-2 m-0">AI Knowledge Base</h2>
              <div className="bg-surface-container-low hairline rounded-xl p-md flex flex-col md:flex-row items-center justify-between gap-md">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">description</span>
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface m-0">
                      {documents.length > 0 ? documents[0].file_name : 'No document uploaded'}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${documents.length > 0 ? 'bg-secondary' : 'bg-outline'}`}></span>
                      <p className="text-caption text-secondary m-0">
                        {documents.length > 0 ? 'Knowledge base is up to date' : 'No knowledge base document'}
                      </p>
                    </div>
                  </div>
                </div>
                <FileUpload businessId={business.id} ownerToken={ownerToken} onFileUpload={setUploadedFile} currentFile={uploadedFile} onUploadComplete={() => {
                  fetch(`${API_URL}/businesses/${business.id}/documents`, { headers: authHeaders(ownerToken) })
                    .then((r) => r.json()).then((d) => setDocuments(d.documents || [])).catch(() => { });
                }} />
              </div>
              <p className="text-caption text-on-surface-variant m-0">The Sahel AI uses this document to answer customer queries automatically. Upload menus, service lists, or FAQs.</p>
              {documents.length > 1 && (
                <div className="mt-2 space-y-1">
                  {documents.slice(1).map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 px-4 py-2.5 bg-white/50 rounded-lg border border-hairline-border">
                      <span className="material-symbols-outlined text-[16px] text-secondary">article</span>
                      <span className="flex-1 font-body-md text-body-md text-on-surface truncate">{doc.file_name}</span>
                      <span className="font-caption text-caption text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">{doc.chunks} chunks</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Test AI Assistant */}
              <div className="bg-white hairline rounded-xl overflow-hidden shadow-sm mt-md">
                <div className="p-4 border-b border-hairline-border bg-gradient-to-r from-primary-fixed/10 to-transparent">
                  <h3 className="font-label-md text-label-md m-0 flex items-center gap-2 text-on-surface">
                    <span className="material-symbols-outlined text-[18px] text-primary">smart_toy</span>
                    Test AI Assistant
                  </h3>
                </div>
                <div className="p-4 max-h-[300px] overflow-y-auto space-y-3 bg-surface-container-low/30">
                  {detailMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <span className="material-symbols-outlined text-3xl text-outline/30 mb-2">chat</span>
                      <p className="font-body-md text-body-md text-on-surface-variant m-0">Ask a question to test your AI assistant</p>
                    </div>
                  ) : detailMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm leading-relaxed ${msg.sender === 'user' ? 'bg-primary text-on-primary rounded-br-md' : 'bg-white text-on-surface rounded-bl-md border border-hairline-border'}`}>{msg.text}</div>
                    </div>
                  ))}
                  {detailLoading && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-tertiary flex items-center justify-center text-white text-[8px] font-bold">AI</div>
                      <div className="flex gap-1 px-3 py-2 bg-white rounded-2xl border border-hairline-border">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/30 animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 border-t border-hairline-border bg-white flex gap-2">
                  <input className="flex-1 border border-outline/20 rounded-lg px-3 py-2 font-body-md text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-surface-container-low/50" placeholder="Ask about this business..." value={detailInput} onChange={(e) => setDetailInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleChat())} disabled={detailLoading} />
                  <button type="button" onClick={handleChat} disabled={detailLoading || !detailInput.trim()} className="bg-primary text-on-primary w-9 h-9 rounded-lg flex items-center justify-center border-0 cursor-pointer disabled:opacity-50 transition-all hover:scale-105 shrink-0">
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Danger Zone - always visible */}
          <section className="mt-lg pt-lg border-t border-hairline-border">
            <div className="p-md rounded-xl bg-error-container/10 border border-error/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
                <div>
                  <h3 className="font-label-md text-label-md text-error flex items-center gap-2 m-0">
                    <span className="material-symbols-outlined text-[18px]">warning</span>
                    Danger Zone
                  </h3>
                  <p className="text-body-md text-on-surface-variant m-0 mt-1">Permanently delete your business mini-site and all associated training data.</p>
                </div>
                <button type="button" onClick={() => setShowDeleteModal(true)} className="border border-error text-error hover:bg-error hover:text-white font-label-md text-label-md px-6 py-2 rounded-lg transition-all duration-300 bg-transparent cursor-pointer whitespace-nowrap">
                  Delete Site
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-hairline-border flex justify-around items-center h-16 px-4 z-50">
        {[
          { id: 'general', label: 'General', icon: 'settings' },
          { id: 'social', label: 'Social', icon: 'share' },
          { id: 'hours', label: 'Hours', icon: 'schedule' },
          { id: 'knowledge', label: 'AI', icon: 'psychology' },
        ].map((item) => (
          <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center pt-2 border-0 bg-transparent cursor-pointer ${activeTab === item.id ? 'text-primary' : 'text-on-surface-variant'}`}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-label-sm text-label-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4 overflow-y-auto" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-xl border border-hairline-border w-full max-w-sm overflow-hidden shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-hairline-border flex items-center justify-between">
              <h3 className="font-headline-sm text-[18px] text-error flex items-center gap-2 m-0">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                Delete Site
              </h3>
              <button type="button" onClick={() => setShowDeleteModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-0 cursor-pointer hover:bg-surface-container">
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            <div className="p-4">
              <p className="font-body-md text-body-md text-on-surface m-0">
                Are you sure you want to delete <strong>&ldquo;
                  {business.name}
                  &rdquo;</strong>? This cannot be undone.
              </p>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 rounded-xl border border-hairline-border text-on-surface font-label-md text-label-md bg-transparent cursor-pointer hover:bg-surface-container transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={async () => {
                  setIsDeleting(true);
                  try {
                    const res = await fetch(`${API_URL}/businesses/${business.id}`, { method: 'DELETE', headers: authHeaders(ownerToken) });
                    if (!res.ok) throw new Error('Delete failed');
                    setShowDeleteModal(false);
                    onDelete(business.id);
                  } catch (e) { console.error('Delete business failed:', e); setIsDeleting(false); }
                }} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl bg-error text-white font-label-md text-label-md border-0 cursor-pointer disabled:opacity-60 hover:opacity-90 transition-all">
                  {isDeleting ? <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
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
  }, [value, duration, display]);

  return <span>{display}</span>;
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const [session, setSession] = useState(() => getSession());
  const owner = session?.owner || null;
  const ownerToken = session?.token || '';
  const appOrigin = window.location.origin;

  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [businessStats, setBusinessStats] = useState({});
  const [recentInteractions, setRecentInteractions] = useState([]);
  const [topQuestions, setTopQuestions] = useState([]);
  const [languageDistribution, setLanguageDistribution] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [showAllBusinesses, setShowAllBusinesses] = useState(false);
  const [editBusiness, setEditBusiness] = useState(null);
  const [manageBusiness, setManageBusiness] = useState(null);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
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
    social_media: '',
  });
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [profileForm, setProfileForm] = useState({ full_name: '', email: '' });
  const [avatarError, setAvatarError] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState('');

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

    const controller = new AbortController();
    fetch(`${API_URL}/businesses?${ownerQuery}`, {
      headers: authHeaders(ownerToken),
      signal: controller.signal
    })
      .then((response) => response.json())
      .then((data) => {
        const list = data.businesses || [];
        setBusinesses(list);
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');
        if (editId) {
          const target = list.find((b) => String(b.id) === editId);
          if (target) setSelectedBusiness(target);
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setBusinesses([]);
      });

    return () => controller.abort();
  }, [owner, ownerQuery, ownerToken]);

  useEffect(() => {
    const handlePop = () => {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('edit')) setSelectedBusiness(null);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const loadDashboardData = useCallback(async (signal) => {
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
        signal: signal,
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
          .filter(([, count]) => count > 0)
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
    } catch (err) {
      if (err.name === 'AbortError') return;
      setLoading(false);
    }
  }, [owner, ownerToken]);

  useEffect(() => {
    const controller = new AbortController();
    loadDashboardData(controller.signal);
    return () => controller.abort();
  }, [loadDashboardData]);

  useEffect(() => {
    if (!showSettings && manageBusiness) {
      setManageBusiness(null);
    }
  }, [showSettings, manageBusiness]);

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

    const trend = (() => {
      if (messageCounts.length >= 4) {
        const mid = Math.floor(messageCounts.length / 2);
        const firstHalf = messageCounts.slice(0, mid);
        const secondHalf = messageCounts.slice(mid);
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        if (avgFirst > 0) {
          const change = ((avgSecond - avgFirst) / avgFirst) * 100;
          return (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
        }
      }
      const sparkFirst2 = sparkline.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
      const sparkLast2 = sparkline.slice(-2).reduce((a, b) => a + b, 0) / 2;
      if (sparkFirst2 > 0) {
        const change = ((sparkLast2 - sparkFirst2) / sparkFirst2) * 100;
        return (change >= 0 ? '+' : '') + change.toFixed(1) + '%';
      }
      return '+0.0%';
    })();

    return {
      conversations: conversationTotal,
      messages: messageTotal,
      responseRate: avgResponse,
      activeBusinesses: businesses.length,
      sparkline,
      trend,
    };
  }, [businessStats, businesses.length, recentInteractions]);

  const [conciergeAdvice, setConciergeAdvice] = useState(null);

  const activeAdvice = useMemo(() => [
    { label: 'Optimiser les horaires', action: 'edit', quote: (t) => `Activité en hausse de ${t} sur vos commerces. Ajoutez des horaires détaillés pour capter plus de réservations en soirée.` },
    { label: 'Configurer l\'assistant', action: 'edit', quote: () => `Vos clients posent des questions similaires. Ajoutez des réponses automatiques dans votre profil commerce pour gagner du temps.` },
    { label: 'Voir les paramètres', action: 'settings', quote: (t) => `Le taux de réponse de vos commerces est de ${t}%. Activez les notifications pour ne manquer aucune demande.` },
    { label: 'Ajouter du contenu', action: 'edit', quote: (_, l) => `La plupart de vos interactions sont en ${l}. Ajoutez du contenu dans cette langue pour mieux engager vos clients.` },
    { label: 'Mettre à jour', action: 'edit', quote: () => `Les commerces avec photos et description complète reçoivent 2x plus d'interactions. Mettez à jour vos fiches.` },
    { label: 'Activer l\'assistant', action: 'edit', quote: () => `Activez l'assistant IA sur tous vos commerces pour répondre automatiquement 24h/7 en Darija, Français et Anglais.` },
  ], []);

  const emptyAdvice = useMemo(() => [
    { label: 'Créer mon commerce', action: 'create', quote: () => `Astuce : Ajoutez votre premier commerce et activez l'assistant IA Sahel.ai pour répondre automatiquement à vos clients 24h/7 en Darija, Français et Anglais.` },
    { label: 'Créer mon commerce', action: 'create', quote: () => `Saviez-vous que 78% des commerces avec assistant IA voient leur taux de réponse augmenter de 40% ? Créez votre commerce dès maintenant.` },
    { label: 'Créer mon commerce', action: 'create', quote: () => `Offrez à vos clients une expérience multilingue 24h/24. Sahel.ai gère les réservations et questions en temps réel.` },
    { label: 'Commencer', action: 'create', quote: () => `Un commerce digitalisé capte 3x plus de demandes. Lancez-vous avec l'assistant IA Sahel.ai sans aucun code.` },
    { label: 'Créer mon commerce', action: 'create', quote: () => `67% des clients préfèrent un commerce qui répond en moins de 5 minutes. Sahel.ai vous permet d'être toujours réactif.` },
  ], []);

  const pickAdvice = useCallback(() => {
    const hasData = businesses.length > 0 && totals.conversations > 0;
    const pool = hasData ? activeAdvice : emptyAdvice;
    const idx = Math.floor(Math.random() * pool.length);
    const base = pool[idx];
    const topLang = languageDistribution[0]?.lang?.split(' ')[0] || 'Français';
    const quote = base.quote(totals.trend, topLang, totals.responseRate);
    setConciergeAdvice({ ...base, quote });
  }, [businesses, totals, languageDistribution, activeAdvice, emptyAdvice]);

  useEffect(() => {
    if (!loading) pickAdvice();
  }, [loading, pickAdvice]);

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
      setIsCreating(false);
      setShowCreateModal(false);
      setSelectedBusiness(business);
    } catch {
      setIsCreating(false);
    }
  };

  const updateBusiness = async (event) => {
    event.preventDefault();
    if (!editBusiness) return;

    setIsUpdating(true);
    let updated;
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

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || 'Could not update business');
      }

      updated = await response.json();

      if (coverFile) {
        try {
          const updatedWithCover = await uploadBusinessCover(editBusiness.id, coverFile, ownerToken);
          updated = updatedWithCover;
          setCoverFile(null);
          setCoverPreview(null);
        } catch (uploadErr) {
          console.error('Cover photo update failed:', uploadErr);
        }
      }

      setBusinesses((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setEditBusiness(null);
      setCoverFile(null);
      setCoverPreview(null);
    } catch (e) {
      console.error('Update business failed:', e);
    } finally {
      setIsUpdating(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const payload = { full_name: profileForm.full_name, email: profileForm.email };
      if (profilePhotoPreview && profilePhotoPreview !== owner?.picture) {
        payload.profile_photo = profilePhotoPreview;
      }
      if (passwordForm.newPass) {
        if (!passwordForm.current) { setProfileStatus(t('dashboard.profile.currentPasswordRequired')); setSavingProfile(false); return; }
        if (passwordForm.newPass !== passwordForm.confirm) { setProfileStatus(t('dashboard.profile.passwordMismatch')); setSavingProfile(false); return; }
        if (passwordForm.newPass.length < 6) { setProfileStatus(t('dashboard.profile.passwordTooShort')); setSavingProfile(false); return; }
        payload.current_password = passwordForm.current;
        payload.new_password = passwordForm.newPass;
      }
      const res = await fetch(`${API_URL}/owners/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders(ownerToken) },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Update failed');
      }
      const data = await res.json();
      const updated = { ...session, owner: { ...owner, ...data.owner } };
      saveSession(updated);
      setSession(updated);
      setShowProfileModal(false);
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setProfilePhoto(null);
      setProfilePhotoPreview(null);
    } catch (e) { setProfileStatus(e.message || 'Could not update profile'); }
    finally { setSavingProfile(false); }
  };

  const startEditingProfile = () => {
    setProfileForm({ full_name: owner.full_name || '', email: owner.email || '' });
    setPasswordForm({ current: '', newPass: '', confirm: '' });
    setProfilePhoto(null);
    setProfilePhotoPreview(null);
    setShowProfileMenu(false);
    setShowProfileModal(true);
  };

  const ownerName = (owner?.full_name || owner?.email?.split('@')[0] || 'Propriétaire').toUpperCase();

  if (!owner) {
    return (
      <div className="bg-warm-bg text-on-background min-h-screen flex items-center justify-center page-enter">
        <p className="font-body-md text-body-md text-on-surface-variant">{t('dashboard.redirecting')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background text-on-background min-h-screen page-enter relative overflow-hidden pb-28">
        {/* Top Navigation */}
        <header className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-hairline-border flex h-16 justify-between items-center px-gutter">
          <a href={ROUTES.home} className="no-underline">
            <SahelLogo size={28} textClass="font-headline-sm text-headline-sm font-bold text-deep-navy" />
          </a>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDashboardData}
              className="p-2 rounded-full hover:bg-black/5 transition-colors border-0 bg-transparent cursor-pointer"
              title={t('dashboard.refresh')}
            >
              <span className="material-symbols-outlined text-on-surface-variant">refresh</span>
            </button>
            <LanguageSwitcher />
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="w-9 h-9 rounded-full overflow-hidden shadow-sm ring-1 ring-deep-navy/5 bg-transparent cursor-pointer p-0"
              >
                {avatarError || !owner?.picture ? (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-white text-sm font-bold">
                    {ownerName.charAt(0)}
                  </div>
                ) : (
                  <img
                    alt={owner.full_name || 'Profile'}
                    className="w-full h-full object-cover"
                    src={resolveApiUrl(owner.picture)}
                    onError={() => setAvatarError(true)}
                  />
                )}
              </button>
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-hairline-border shadow-xl z-20 overflow-hidden">
                    <div className="p-4 border-b border-hairline-border">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-primary flex items-center justify-center text-white text-lg font-bold">
                          {avatarError || !owner?.picture ? ownerName.charAt(0) : <img src={resolveApiUrl(owner.picture)} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-label-md text-on-surface m-0 truncate">{owner.full_name || 'Utilisateur'}</p>
                          <p className="font-caption text-caption text-on-surface-variant m-0 truncate">{owner.email || ''}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button type="button" onClick={startEditingProfile} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container transition-colors border-0 bg-transparent cursor-pointer text-left">
                        <span className="material-symbols-outlined text-on-surface-variant text-xl">settings</span>
                        <span className="font-body-md text-body-md text-on-surface">{t('dashboard.profileSettings')}</span>
                      </button>
                      <button type="button" onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-error/5 transition-colors border-0 bg-transparent cursor-pointer text-left">
                        <span className="material-symbols-outlined text-error text-xl">logout</span>
                        <span className="font-body-md text-body-md text-error">{t('nav.logout')}</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-28 pt-6 space-y-8">
          {selectedBusiness ? (
            <BusinessDetailView
              business={selectedBusiness}
              ownerToken={ownerToken}
              onBack={() => {
                setSelectedBusiness(null);
                window.history.replaceState({}, '', '/dashboard');
              }}
              onUpdate={(updated) => {
                setBusinesses((current) => current.map((b) => (b.id === updated.id ? updated : b)));
                setSelectedBusiness(updated);
              }}
              onDelete={(id) => {
                setBusinesses((current) => current.filter((b) => b.id !== id));
                setSelectedBusiness(null);
                window.history.replaceState({}, '', '/dashboard');
              }}
            />
          ) : (
            <>
              {/* Greeting */}
              <section>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider m-0">{t('dashboard.greeting', { name: ownerName })}</p>
                <h1 className="font-headline-sm text-headline-sm text-primary font-bold m-0">{t('dashboard.title')}</h1>
              </section>

              {/* Hero Row: Health + Concierge side by side on desktop */}
              <div className="md:grid md:grid-cols-3 gap-6 space-y-6 md:space-y-0">
                <div className="md:col-span-2 space-y-6">
                  {/* Intelligence Summary (Hero) */}
                  <section>
                    <div className="glass-card border-[0.5px] border-hairline-border rounded-xl p-6 relative overflow-hidden bg-white/80 backdrop-blur">
                      <div className="absolute top-0 right-0 p-4">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div className="space-y-4">
                        <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider m-0">{t('dashboard.health')}</p>
                        <div className="flex items-end gap-2">
                          <span className="font-newsreader text-4xl text-primary leading-none">
                            {loading ? '—' : <AnimatedNumber value={totals.responseRate || 94} />}%
                          </span>
                          <span className="font-label-md text-label-md text-secondary mb-2 flex items-center">
                            <span className="material-symbols-outlined text-[14px]">trending_up</span>
                            {totals.trend}
                          </span>
                        </div>
                        <div className="h-12 w-full flex items-end gap-1 opacity-60">
                          {loading ? Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="w-full bg-primary-fixed rounded-t animate-pulse" style={{ height: `${40 + (i * 7) % 50}%` }} />
                          )) : totals.sparkline.map((h, i) => (
                            <div key={i} className={`w-full rounded-t ${i === totals.sparkline.length - 1 ? 'bg-primary' : 'bg-primary-fixed'}`} style={{ height: `${Math.max(h, 8)}%` }} />
                          ))}
                        </div>
                      </div>
                      <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                    </div>
                  </section>

                  {/* Stat Cards */}
                  <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-hairline-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-surface-blue flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-lg">forum</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-secondary/10 text-secondary">{totals.trend}</span>
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest m-0">{t('dashboard.conversations')}</p>
                      <p className="font-newsreader text-2xl text-deep-navy font-bold mt-0.5 m-0">
                        {loading ? '—' : <AnimatedNumber value={totals.conversations} />}
                      </p>
                    </div>
                    <div className="bg-white border border-hairline-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-secondary text-lg">speed</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${totals.responseRate >= 80 ? 'bg-secondary/10 text-secondary' : totals.responseRate >= 50 ? 'bg-orange-500/10 text-orange-600' : 'bg-error/10 text-error'}`}>
                          {totals.responseRate >= 80 ? t('dashboard.excellent') : totals.responseRate >= 50 ? t('dashboard.average') : t('dashboard.low')}
                        </span>
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest m-0">{t('dashboard.responseRate')}</p>
                      <p className="font-newsreader text-2xl text-deep-navy font-bold mt-0.5 m-0">
                        {loading ? '—' : <AnimatedNumber value={totals.responseRate} />}%
                      </p>
                      <div className="mt-2 w-full h-1 bg-outline/10 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full transition-all duration-1000 ease-out" style={{ width: `${loading ? 0 : totals.responseRate}%` }} />
                      </div>
                    </div>
                    <div className="bg-white border border-hairline-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-tertiary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-tertiary text-lg">storefront</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/5 text-primary">{t('dashboard.active')}</span>
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest m-0">{t('dashboard.activeBusinesses')}</p>
                      <p className="font-newsreader text-2xl text-deep-navy font-bold mt-0.5 m-0">
                        {loading ? '—' : <AnimatedNumber value={totals.activeBusinesses} />}
                      </p>
                    </div>
                    <div className="bg-white border border-hairline-border rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-primary text-lg">translate</span>
                        </div>
                      </div>
                      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest m-0">{t('dashboard.languages')}</p>
                      <p className="font-newsreader text-2xl text-deep-navy font-bold mt-0.5 m-0">
                        {loading ? '—' : <AnimatedNumber value={Math.max(languageDistribution.length, 1)} />}
                      </p>
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {languageDistribution.length > 0 ? languageDistribution.map((l, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: l.color?.replace('bg-', '').includes('primary') ? '#d3e4ff' : l.color?.includes('secondary') ? '#9af1cb' : '#d4e3ff', color: '#00467c' }}>{l.lang.split(' ')[0]}</span>
                        )) : <><span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-surface-blue text-primary">FR</span><span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-secondary/10 text-secondary">AR</span><span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-tertiary/10 text-tertiary">EN</span></>}
                      </div>
                    </div>
                  </section>

                </div>{/* /md:col-span-2 */}

                {/* AI Concierge Insight */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary-container text-xl">auto_awesome</span>
                    <h3 className="font-headline-sm text-[18px] text-on-surface m-0">{t('dashboard.conciergeInsight')}</h3>
                  </div>
                  <div className="bg-surface-blue border-[0.5px] border-primary/10 rounded-xl p-5 space-y-4">
                    {loading ? (
                      <div className="space-y-3">
                        <div className="h-6 bg-primary/10 rounded animate-pulse" />
                        <div className="h-6 bg-primary/10 rounded w-3/4 animate-pulse" />
                        <div className="h-10 bg-primary/10 rounded animate-pulse" />
                      </div>
                    ) : conciergeAdvice ? (
                      <>
                        <blockquote className="font-headline-sm text-[18px] leading-relaxed text-primary italic m-0">
                          &ldquo;{conciergeAdvice.quote}&rdquo;
                        </blockquote>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (conciergeAdvice.action === 'edit' && businesses.length > 0) {
                                const target = businesses[0];
                                setSelectedBusiness(target);
                                window.history.pushState({ edit: target.id }, '', `?edit=${target.id}`);
                              } else if (conciergeAdvice.action === 'settings') {
                                setShowSettings(true);
                                document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth' });
                              } else {
                                setShowCreateModal(true);
                              }
                            }}
                            className="flex-1 bg-primary text-on-primary font-label-md text-label-md py-3 rounded-xl active:scale-95 transition-transform border-0 cursor-pointer"
                          >
                            {conciergeAdvice.label}
                          </button>
                          <button
                            type="button"
                            onClick={pickAdvice}
                            className="px-4 border border-outline-variant text-on-surface-variant font-label-md text-label-md py-3 rounded-xl active:scale-95 transition-transform bg-transparent cursor-pointer flex items-center gap-1"
                            title={t('dashboard.nextAdvice')}
                          >
                            <span className="material-symbols-outlined text-sm">shuffle</span>
                            {t('dashboard.nextAdvice')}
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>
              </div>{/* /md:grid */}

              {/* Business Portfolio */}
              <section className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h3 className="font-headline-sm text-[20px] text-on-surface m-0">{t('dashboard.portfolio')}</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(true)}
                    className="text-primary font-label-md text-label-md border-0 bg-transparent cursor-pointer hover:underline"
                  >
                    {t('common.create')}
                  </button>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('dashboard.searchBusiness')}
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-hairline-border bg-white text-on-surface font-body-md text-body-md placeholder:text-on-surface-variant outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                  {filteredBusinesses.length === 0 ? (
                    <div className="text-center py-lg font-body-md text-body-md text-on-surface-variant bg-white border border-hairline-border rounded-xl p-lg md:col-span-2">
                      {businesses.length === 0
                        ? t('dashboard.emptyPortfolio')
                        : t('dashboard.emptySearch')}
                    </div>
                  ) : (
                    filteredBusinesses.slice(0, showAllBusinesses ? filteredBusinesses.length : 6).map((business) => {
                      const stat = businessStats[business.id] || { conversations: 0 };
                      const isPending = (stat.conversations || 0) === 0;
                      const isConfig = !business.site_url;
                      const businessIcon =
                        business.business_type?.toLowerCase().includes('hotel') || business.business_type?.toLowerCase().includes('riad') ? 'hotel' :
                          business.business_type?.toLowerCase().includes('restaurant') || business.business_type?.toLowerCase().includes('cafe') || business.business_type?.toLowerCase().includes('café') ? 'restaurant' :
                            business.business_type?.toLowerCase().includes('boutique') || business.business_type?.toLowerCase().includes('retail') ? 'storefront' :
                              business.business_type?.toLowerCase().includes('store') || business.business_type?.toLowerCase().includes('shop') || business.business_type?.toLowerCase().includes('bazar') ? 'storefront' :
                                'business';
                      return (
                        <div
                          key={business.id}
                          className={`bg-white border-[0.5px] border-hairline-border p-4 rounded-xl ${isConfig ? 'opacity-75' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="w-12 h-12 bg-surface-container rounded-lg flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary">{businessIcon}</span>
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-body-lg font-semibold text-on-surface m-0 truncate">{business.name}</h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {isConfig ? (
                                    <>
                                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant" />
                                      <span className="font-caption text-caption text-outline uppercase">{t('dashboard.statusConfig')}</span>
                                    </>
                                  ) : isPending ? (
                                    <>
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                                      <span className="font-caption text-caption text-primary-container uppercase">{t('dashboard.statusTraining')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                      <span className="font-caption text-caption text-secondary uppercase">{t('dashboard.statusActive')}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-label-md text-label-md text-on-surface">{isConfig ? '--' : stat.conversations || 0}</div>
                              <div className="font-caption text-caption text-on-surface-variant">{isConfig ? t('dashboard.statusConfig') : t('dashboard.conversations')}</div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3 pt-3 border-t border-hairline-border">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedBusiness(business);
                                window.history.pushState({ edit: business.id }, '', `?edit=${business.id}`);
                              }}
                              className="flex-1 py-1.5 rounded-lg border border-hairline-border text-on-surface font-label-sm text-label-sm bg-transparent cursor-pointer hover:bg-surface-container transition-colors"
                            >
                              {t('dashboard.modify')}
                            </button>
                            {business.site_url ? (
                              <a
                                href={`${appOrigin}${business.site_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-1.5 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm text-center no-underline hover:brightness-95 transition-all"
                              >
                                {t('dashboard.viewSite')}
                              </a>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedBusiness(business)}
                                className="flex-1 py-1.5 rounded-lg border border-hairline-border text-on-surface-variant font-label-sm text-label-sm bg-transparent cursor-pointer hover:bg-surface-container transition-colors opacity-50"
                                disabled
                              >
                                {t('dashboard.miniSite')}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  {!showAllBusinesses && businesses.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllBusinesses(true)}
                      className="w-full md:col-span-2 py-3 rounded-xl border border-dashed border-outline-variant text-on-surface-variant font-label-md text-label-md hover:border-primary hover:text-primary transition-colors bg-transparent cursor-pointer"
                    >
                      {t('common.showMore', { count: businesses.length })}
                    </button>
                  )}
                  {showAllBusinesses && businesses.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllBusinesses(false)}
                      className="w-full md:col-span-2 py-2 rounded-xl text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-colors bg-transparent border-0 cursor-pointer"
                    >
                      {t('common.showLess')}
                    </button>
                  )}
                </div>
              </section>

              {/* Analytics */}
              {(topQuestions.length > 0 || languageDistribution.length > 0) && (
                <section className="space-y-4">
                  <h3 className="font-headline-sm text-[20px] text-on-surface px-1 m-0">{t('dashboard.analytics')}</h3>
                  <div className="space-y-3 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                    {topQuestions.length > 0 && (
                      <div className="bg-white border border-hairline-border rounded-xl">
                        <div className="px-4 py-3 flex items-center gap-2 border-b border-hairline-border">
                          <span className="material-symbols-outlined text-primary text-lg">quiz</span>
                          <h4 className="font-label-md text-label-md text-on-surface m-0">{t('dashboard.frequentQuestions')}</h4>
                        </div>
                        <div className="p-4 space-y-3">
                          {topQuestions.slice(0, 3).map((item, i) => {
                            const maxCount = topQuestions[0].count || 1;
                            const pct = (item.count / maxCount) * 100;
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${i === 0 ? 'bg-primary text-on-primary' : i === 1 ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-on-surface-variant'}`}>{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-on-surface truncate">{item.q}</span>
                                    <span className="text-on-surface-variant text-xs shrink-0 ml-2">{item.count}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-outline/10 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${pct}%`, opacity: i === 0 ? 1 : i === 1 ? 0.7 : 0.4 }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {languageDistribution.length > 0 && (
                      <div className="bg-white border border-hairline-border rounded-xl">
                        <div className="px-4 py-3 flex items-center gap-2 border-b border-hairline-border">
                          <span className="material-symbols-outlined text-primary text-lg">bar_chart</span>
                          <h4 className="font-label-md text-label-md text-on-surface m-0">{t('dashboard.languages')}</h4>
                        </div>
                        <div className="p-4 space-y-3">
                          {languageDistribution.map((item, i) => {
                            const colors = { fr: '#0066b4', ar: '#00a86b', en: '#9747ff' };
                            const c = colors[item.lang?.split(' ')[0]?.toLowerCase()] || '#64748b';
                            return (
                              <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-on-surface font-medium flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
                                    {item.lang}
                                  </span>
                                  <span className="text-on-surface-variant text-xs">{item.pct}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-outline/10 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${item.pct}%`, backgroundColor: c }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="px-4 py-2 border-t border-hairline-border">
                          <p className="font-caption text-caption text-on-surface-variant m-0">{t('dashboard.basedOnInteractions', { n: totals.messages || 1 })}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Recent Intelligence */}
              <section className="space-y-4">
                <h3 className="font-headline-sm text-[20px] text-on-surface px-1 m-0">{t('dashboard.recentIntelligence')}</h3>
                <div className="bg-white border-[0.5px] border-hairline-border rounded-xl divide-y divide-hairline-border">
                  {recentInteractions.length === 0 ? (
                    <div className="p-4 text-center font-body-md text-body-md text-on-surface-variant">
                      {t('dashboard.noInteractions')}
                    </div>
                  ) : (
                    recentInteractions.map((row) => {
                      const isReservation = row.question?.toLowerCase().includes('reserv') || row.question?.toLowerCase().includes('booking');
                      return (
                        <div key={row.id} className="p-4 flex items-start gap-4">
                          <div className="bg-surface-blue p-2 rounded-full">
                            <span className="material-symbols-outlined text-primary text-[20px]">{isReservation ? 'check_circle' : 'chat_bubble'}</span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex justify-between">
                              <p className="font-body-md font-medium text-on-surface m-0">{isReservation ? 'Reservation' : 'Inquiry'}</p>
                              <span className="font-caption text-caption text-on-surface-variant">
                                {row.createdAt ? (() => { const d = new Date(row.createdAt); const diff = Math.floor((Date.now() - d.getTime()) / 60000); return diff < 60 ? `${diff}m ago` : d.toLocaleDateString(); })() : 'Recent'}
                              </span>
                            </div>
                            <p className="font-caption text-caption text-on-surface-variant m-0">{row.question ? (isReservation ? 'Auto-resolved.' : `Answered: "${row.question.substring(0, 40)}..."`) : '—'}</p>
                            <div className="flex gap-2 pt-1">
                              <span className="px-2 py-0.5 bg-surface-container rounded text-[10px] font-bold text-on-surface-variant">{languageBadge(row.language).replace(/ \(.*\)/, '')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </>
          )}
        </main>

        {/* Floating Action Button */}
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/20 flex items-center justify-center active:scale-95 transition-transform z-40 border-0 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[28px]">add</span>
        </button>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 w-full z-50 bg-white/95 backdrop-blur-xl border-t border-hairline-border safe-area-bottom">
          <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-4">
            <button type="button" className="flex flex-col items-center justify-center gap-0.5 bg-transparent border-0 cursor-pointer text-primary">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
              <span className="font-label-sm text-[10px] uppercase tracking-widest font-bold">{t('dashboard.title')}</span>
            </button>
            <button type="button" onClick={() => { loadDashboardData(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex flex-col items-center justify-center gap-0.5 bg-transparent border-0 cursor-pointer text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-xl">refresh</span>
              <span className="font-label-sm text-[10px] uppercase tracking-widest">{t('dashboard.refresh')}</span>
            </button>
            <button type="button" onClick={() => window.location.href = '/onboarding'} className="flex flex-col items-center justify-center gap-0.5 bg-transparent border-0 cursor-pointer text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-xl">add_circle</span>
              <span className="font-label-sm text-[10px] uppercase tracking-widest">{t('common.create')}</span>
            </button>
          </div>
        </nav>

      </div>

      {showCreateModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-hairline-border w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-hairline-border flex items-center justify-between">
              <h3 className="font-headline-sm text-[18px] text-on-surface m-0">{t('dashboard.newBusiness')}</h3>
              <button type="button" onClick={() => setShowCreateModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-0 cursor-pointer hover:bg-surface-container">
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            <form className="p-4 space-y-4" onSubmit={createBusiness}>
              <label className="grid gap-1 font-label-md text-label-md text-on-surface">
                {t('dashboard.businessName')}
                <input required autoFocus className="border border-hairline-border rounded-lg px-3 py-2 font-body-md text-body-md w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t('dashboard.businessNamePlaceholder')} />
              </label>
              <p className="font-caption text-caption text-on-surface-variant m-0 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">info</span>
                {t('dashboard.createInfo')}
              </p>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 rounded-xl border border-hairline-border text-on-surface font-label-md text-label-md bg-transparent cursor-pointer hover:bg-surface-container transition-colors">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={isCreating || !form.name.trim()} className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-label-md text-label-md border-0 cursor-pointer disabled:opacity-60 hover:brightness-95 transition-all">
                  {isCreating ? t('dashboard.creating') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {editBusiness ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-md overflow-y-auto">
          <div className="bg-white rounded-xl border border-hairline-border p-md w-full max-w-lg my-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-headline-sm text-headline-sm headline-font mt-0">{t('dashboard.miniSite')} & {t('dashboard.profile.title')}</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-0 mb-md">
              {t('dashboard.editInfoDescription')}
            </p>
            <form className="grid gap-sm" onSubmit={updateBusiness}>
              <label className="grid gap-xs font-label-md text-label-md">
                {t('dashboard.profile.coverPhotoLabel')}
                <CoverPhotoUploader
                  coverPreview={coverPreview}
                  onFileSelect={(f) => { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }}
                  inputId="dashboard-cover-input"
                  compact
                  placeholderText={t('dashboard.profile.uploadHint')}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                {t('dashboard.profile.name')}
                <input
                  required
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.name}
                  onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                {t('dashboard.profile.type')}
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.business_type}
                  onChange={(event) => setEditForm({ ...editForm, business_type: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                {t('dashboard.profile.description')}
                <textarea
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md min-h-[72px]"
                  value={editForm.description}
                  onChange={(event) => setEditForm({ ...editForm, description: event.target.value })}
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                <label className="grid gap-xs font-label-md text-label-md">
                  {t('dashboard.profile.city')}
                  <input
                    className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                    value={editForm.city}
                    onChange={(event) => setEditForm({ ...editForm, city: event.target.value })}
                  />
                </label>
                <label className="grid gap-xs font-label-md text-label-md">
                  {t('dashboard.profile.hours')}
                  <input
                    className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                    value={editForm.working_hours}
                    onChange={(event) => setEditForm({ ...editForm, working_hours: event.target.value })}
                  />
                </label>
              </div>
              <label className="grid gap-xs font-label-md text-label-md">
                {t('dashboard.profile.address')}
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.address}
                  onChange={(event) => setEditForm({ ...editForm, address: event.target.value })}
                  placeholder={t('dashboard.profile.addressPlaceholder')}
                />
              </label>
              <div className="grid grid-cols-2 gap-sm">
                <label className="grid gap-xs font-label-md text-label-md">
                  {t('dashboard.profile.latitude')}
                  <input
                    className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                    value={editForm.latitude}
                    onChange={(event) => setEditForm({ ...editForm, latitude: event.target.value })}
                  />
                </label>
                <label className="grid gap-xs font-label-md text-label-md">
                  {t('dashboard.profile.longitude')}
                  <input
                    className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                    value={editForm.longitude}
                    onChange={(event) => setEditForm({ ...editForm, longitude: event.target.value })}
                  />
                </label>
              </div>
              <label className="grid gap-xs font-label-md text-label-md">
                {t('dashboard.profile.services')}
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.primary_services}
                  onChange={(event) => setEditForm({ ...editForm, primary_services: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                {t('dashboard.profile.highlights')}
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.highlights}
                  onChange={(event) => setEditForm({ ...editForm, highlights: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                {t('dashboard.profile.phone')}
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.owner_phone}
                  onChange={(event) => setEditForm({ ...editForm, owner_phone: event.target.value })}
                />
              </label>
              <label className="grid gap-xs font-label-md text-label-md">
                {t('dashboard.profile.email')}
                <input
                  className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                  value={editForm.owner_email}
                  onChange={(event) => setEditForm({ ...editForm, owner_email: event.target.value })}
                />
              </label>
              <details className="border border-hairline-border rounded-lg p-md mt-sm">
                <summary className="font-label-md text-label-md text-primary cursor-pointer select-none">
                  {t('dashboard.socialMedia')}
                </summary>
                <div className="space-y-md mt-md">
                  {['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'youtube'].map((platform) => {
                    const current = (() => {
                      try { return JSON.parse(editForm.social_media || '{}')[platform] || ''; } catch { return ''; }
                    })();
                    return (
                      <label key={platform} className="grid gap-xs font-label-md text-label-md">
                        <span className="capitalize">{platform}</span>
                        <input
                          type="url"
                          className="border border-hairline-border rounded-lg px-sm py-xs font-body-md"
                          placeholder={`https://${platform}.com/...`}
                          value={current}
                          onChange={(e) => {
                            try {
                              const data = JSON.parse(editForm.social_media || '{}');
                              data[platform] = e.target.value;
                              setEditForm({ ...editForm, social_media: JSON.stringify(data) });
                            } catch {
                              setEditForm({ ...editForm, social_media: JSON.stringify({ [platform]: e.target.value }) });
                            }
                          }}
                        />
                      </label>
                    );
                  })}
                </div>
              </details>
              <button
                type="button"
                className="text-primary font-label-md border-0 bg-transparent cursor-pointer p-0 text-left hover:underline"
                onClick={() => {
                  setManageBusiness(editBusiness);
                  setEditBusiness(null);
                  setShowSettings(true);
                  document.getElementById('settings')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                {t('dashboard.openDocumentsWorkspace')}
              </button>
              <div className="flex gap-sm justify-end mt-sm">
                <button
                  type="button"
                  onClick={() => setEditBusiness(null)}
                  className="px-md py-xs rounded-xl border border-hairline-border bg-white cursor-pointer font-label-md"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating || !editForm.name.trim()}
                  className="px-md py-xs rounded-xl bg-primary text-on-primary border-0 cursor-pointer font-label-md disabled:opacity-60"
                >
                  {isUpdating ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}


      {/* Profile Settings Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 p-4 overflow-y-auto" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white rounded-xl border border-hairline-border w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-hairline-border">
              <h3 className="font-headline-sm text-[20px] text-on-surface m-0">{t('dashboard.profileSettings')}</h3>
              <button type="button" onClick={() => setShowProfileModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-0 cursor-pointer hover:bg-surface-container">
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>
            <form className="p-4 space-y-4" onSubmit={saveProfile}>
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-surface-container flex items-center justify-center">
                  {profilePhotoPreview ? (
                    <img src={profilePhotoPreview} alt="" className="w-full h-full object-cover" />
                  ) : avatarError || !owner?.picture ? (
                    <span className="text-3xl font-bold text-primary">{ownerName.charAt(0)}</span>
                  ) : (
                    <img src={resolveApiUrl(owner.picture)} alt="" className="w-full h-full object-cover" onError={() => setAvatarError(true)} />
                  )}
                </div>
                <label className="font-label-md text-label-md text-primary cursor-pointer hover:underline">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProfilePhoto(file);
                      const reader = new FileReader();
                      reader.onload = (ev) => setProfilePhotoPreview(ev.target?.result);
                      reader.readAsDataURL(file);
                    }
                  }} />
                  {t('dashboard.profilePhoto')}
                </label>
              </div>
              {/* Name */}
              <label className="grid gap-1 font-label-md text-label-md text-on-surface">
                {t('login.fullName')}
                <input
                  className="border border-hairline-border rounded-lg px-3 py-2 font-body-md text-body-md text-on-surface bg-white w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                  required
                />
              </label>
              {/* Email */}
              <label className="grid gap-1 font-label-md text-label-md text-on-surface">
                {t('dashboard.profile.email')}
                <input
                  type="email"
                  className="border border-hairline-border rounded-lg px-3 py-2 font-body-md text-body-md text-on-surface bg-white w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                />
              </label>
              {/* Divider */}
              <hr className="border-hairline-border" />
              <p className="font-label-sm text-label-sm text-on-surface-variant m-0 uppercase tracking-wider">{t('dashboard.changePassword')}</p>
              {/* Current Password */}
              <label className="grid gap-1 font-label-md text-label-md text-on-surface">
                {t('dashboard.currentPassword')}
                <input
                  type="password"
                  className="border border-hairline-border rounded-lg px-3 py-2 font-body-md text-body-md text-on-surface bg-white w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                />
              </label>
              {/* New Password */}
              <label className="grid gap-1 font-label-md text-label-md text-on-surface">
                {t('dashboard.newPassword')}
                <input
                  type="password"
                  className="border border-hairline-border rounded-lg px-3 py-2 font-body-md text-body-md text-on-surface bg-white w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={passwordForm.newPass}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                  placeholder={t('dashboard.minChars')}
                />
              </label>
              {/* Confirm Password */}
              <label className="grid gap-1 font-label-md text-label-md text-on-surface">
                {t('login.confirmPassword')}
                <input
                  type="password"
                  className="border border-hairline-border rounded-lg px-3 py-2 font-body-md text-body-md text-on-surface bg-white w-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                />
              </label>
              {profileStatus && <p className="font-caption text-caption text-red-500 m-0 text-center">{profileStatus}</p>}
              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-3 rounded-xl border border-hairline-border text-on-surface font-label-md text-label-md bg-transparent cursor-pointer hover:bg-surface-container transition-colors">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={savingProfile} className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md border-0 cursor-pointer disabled:opacity-50 hover:brightness-95 transition-all">
                  {savingProfile ? t('common.saving') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
