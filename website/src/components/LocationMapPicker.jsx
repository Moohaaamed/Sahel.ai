import { useEffect, useRef, useState, useCallback } from 'react';
import { useLanguage } from '../i18n';

const DEFAULT_CENTER = { lat: 33.5731, lng: -7.5898 };
const LEAFLET_CSS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const existing = document.querySelector(`script[src="${LEAFLET_JS}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

async function geocodeQuery(query) {
  const q = query.trim();
  if (!q) return null;
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'fr' } });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.[0]) return null;
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

export default function LocationMapPicker({
  latitude,
  longitude,
  searchQuery,
  onLocationChange,
  className = '',
}) {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [searching, setSearching] = useState(false);
  const [hint, setHint] = useState(t('locationPicker.clickToPlace'));

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  const setMarker = useCallback(
    (L, map, latLng, fly = true) => {
      if (markerRef.current) {
        markerRef.current.setLatLng(latLng);
      } else {
        markerRef.current = L.marker(latLng, { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          onLocationChange(pos.lat, pos.lng);
          setHint(t('locationPicker.position', { lat: pos.lat.toFixed(5), lng: pos.lng.toFixed(5) }));
        });
      }
      if (fly) map.flyTo(latLng, Math.max(map.getZoom(), 15), { duration: 0.6 });
      onLocationChange(latLng[0], latLng[1]);
      setHint(t('locationPicker.position', { lat: latLng[0].toFixed(5), lng: latLng[1].toFixed(5) }));
    },
    [onLocationChange, t],
  );

  useEffect(() => {
    let cancelled = false;

    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;

        const start = hasCoords ? [lat, lng] : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];
        const map = L.map(containerRef.current, { scrollWheelZoom: true }).setView(start, hasCoords ? 16 : 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        map.on('click', (e) => {
          setMarker(L, map, [e.latlng.lat, e.latlng.lng], false);
        });

        if (hasCoords) {
          setMarker(L, map, [lat, lng], false);
        }

        mapRef.current = map;
      })
      .catch(() => {
        setHint(t('locationPicker.mapUnavailable'));
      });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once
  }, []);

  useEffect(() => {
    if (!mapRef.current || !window.L || !hasCoords) return;
    const L = window.L;
    setMarker(L, mapRef.current, [lat, lng], true);
  }, [lat, lng, hasCoords, setMarker]);

  const runSearch = async (query) => {
    const text = (query ?? searchQuery ?? '').trim();
    if (!text || !mapRef.current || !window.L) return;
    setSearching(true);
    try {
      const result = await geocodeQuery(text);
        if (result) {
        setMarker(window.L, mapRef.current, [result.lat, result.lng]);
        onLocationChange(result.lat, result.lng, result.displayName);
      } else {
        setHint(t('locationPicker.addressNotFound'));
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className={`flex flex-col gap-sm ${className}`}>
      <div className="flex flex-col sm:flex-row gap-xs">
        <input
          type="text"
          className="flex-grow bg-background border border-hairline-border rounded px-sm py-xs font-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none"
          placeholder={t('locationPicker.searchPlaceholder')}
          defaultValue={searchQuery}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runSearch(e.target.value);
            }
          }}
          id="map-search-input"
        />
        <button
          type="button"
          disabled={searching}
          className="px-md py-xs bg-primary text-on-primary rounded font-label-md text-label-md border-0 cursor-pointer hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
          onClick={() => {
            const input = document.getElementById('map-search-input');
            runSearch(input?.value);
          }}
        >
          {searching ? t('locationPicker.searching') : t('locationPicker.explore')}
        </button>
      </div>
      <p className="font-label-sm text-label-sm text-on-surface-variant m-0">{hint}</p>
      <div
        ref={containerRef}
        className="w-full h-[280px] rounded-lg border border-hairline-border z-0"
        aria-label={t('locationPicker.mapAria')}
      />
    </div>
  );
}
