import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import MarketingHeader from './layout/MarketingHeader';
import MarketingFooter from './layout/MarketingFooter';

const CATEGORIES = [
  { key: 'all', label: 'Toutes', icon: 'apps' },
  { key: 'restaurant', label: 'Restaurants', icon: 'restaurant' },
  { key: 'hotel', label: 'Hôtels & Riads', icon: 'bed' },
  { key: 'service', label: 'Services', icon: 'build' },
  { key: 'retail', label: 'Commerces', icon: 'storefront' },
  { key: 'autre', label: 'Autres', icon: 'category' },
];

function categoryKey(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('restaurant') || t.includes('cafe') || t.includes('food')) return 'restaurant';
  if (t.includes('hotel') || t.includes('riad') || t.includes('kasbah')) return 'hotel';
  if (t.includes('service') || t.includes('salon') || t.includes('garage') || t.includes('cabinet') || t.includes('studio') || t.includes('agence')) return 'service';
  if (t.includes('retail') || t.includes('boutique') || t.includes('commerce') || t.includes('épicerie') || t.includes('shop')) return 'retail';
  return 'autre';
}

const CATEGORY_COVERS = {
  restaurant: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600&h=400',
  hotel: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=600&h=400',
  service: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600&h=400',
  retail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=600&h=400',
  autre: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600&h=400',
};

function coverFor(business) {
  if (business.cover_image_url) return business.cover_image_url;
  const key = categoryKey(business.business_type);
  return CATEGORY_COVERS[key] || CATEGORY_COVERS.autre;
}

export default function ShowcasePage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/businesses`)
      .then((res) => res.json())
      .then((data) => {
        setBusinesses(data.businesses || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const grouped = {};
  businesses.forEach((b) => {
    const cat = categoryKey(b.business_type);
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(b);
  });

  const filtered = activeCategory === 'all'
    ? businesses
    : (grouped[activeCategory] || []);

  const hasBusinesses = businesses.length > 0;

  return (
    <>
      <div className="bg-warm-bg text-on-background min-h-screen">
        <MarketingHeader />

        <section className="pt-32 pb-lg px-margin">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-lg">
              <h1 className="font-display-lg text-display-lg m-0 leading-tight">
                Vitrines <span className="text-primary">Digitales</span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mt-md">
                Découvrez les commerces marocains qui utilisent Sahel.ai pour offrir une expérience
                intelligente à leurs clients. Cliquez sur une vitrine pour discuter avec leur assistant IA.
              </p>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-xl">
              {CATEGORIES.map((cat) => {
                const count = cat.key === 'all' ? businesses.length : (grouped[cat.key] || []).length;
                const isActive = activeCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveCategory(cat.key)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-label-md text-label-md border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-on-primary border-primary shadow-md'
                        : 'bg-white text-on-surface-variant border-hairline-border hover:border-primary/30 hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                    <span>{cat.label}</span>
                    <span className={`text-xs ml-0.5 ${isActive ? 'text-on-primary/70' : 'text-outline'}`}>({count})</span>
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white border border-hairline-border rounded-xl overflow-hidden animate-pulse">
                    <div className="h-48 bg-outline/10" />
                    <div className="p-md space-y-2">
                      <div className="h-5 w-3/4 bg-outline/10 rounded" />
                      <div className="h-3 w-1/2 bg-outline/10 rounded" />
                      <div className="h-8 w-full bg-outline/10 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasBusinesses ? (
              <div className="text-center py-2xl">
                <span className="material-symbols-outlined text-6xl text-outline-variant mb-md">storefront</span>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Aucune vitrine pour le moment.</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-2xl">
                <span className="material-symbols-outlined text-6xl text-outline-variant mb-md">search_off</span>
                <p className="font-body-lg text-body-lg text-on-surface-variant">Aucune vitrine dans cette catégorie.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {filtered.map((b) => (
                  <a
                    key={b.id}
                    href={`/business/${b.slug}`}
                    className="group bg-white border border-hairline-border rounded-xl overflow-hidden no-underline transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30"
                  >
                    <div className="h-48 bg-surface-variant relative overflow-hidden">
                      <img
                        src={coverFor(b)}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      {b.city && (
                        <div className="absolute bottom-3 left-3">
                          <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-on-surface-variant font-label-sm text-label-sm rounded-full border border-hairline-border inline-flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {b.city}
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="px-2 py-0.5 bg-white/90 backdrop-blur-sm text-on-surface font-label-sm text-label-sm rounded-full border border-hairline-border">
                          {categoryKey(b.business_type) === 'restaurant' ? 'Restaurant' :
                           categoryKey(b.business_type) === 'hotel' ? 'Hôtel / Riad' :
                           categoryKey(b.business_type) === 'service' ? 'Service' :
                           categoryKey(b.business_type) === 'retail' ? 'Commerce' : 'Autre'}
                        </span>
                      </div>
                    </div>
                    <div className="p-md">
                      <h3 className="font-headline-sm text-headline-sm m-0 text-on-background group-hover:text-primary transition-colors">
                        {b.name}
                      </h3>
                      {b.description && (
                        <p className="font-body-md text-body-md text-on-surface-variant mt-1 line-clamp-2 m-0">
                          {b.description}
                        </p>
                      )}
                      <div className="mt-3 flex items-center gap-1 text-primary font-label-md text-label-md">
                        <span>Visiter la vitrine</span>
                        <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        </section>

        <MarketingFooter />
      </div>
    </>
  );
}
