import { API_URL, resolveApiUrl } from '../config';

export function splitCsv(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function parseCoord(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseFloat(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseBusinessCoords(business) {
  const lat = parseCoord(business?.latitude);
  const lng = parseCoord(business?.longitude);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

export function isEmojiIcon(icon) {
  if (!icon) return false;
  if (icon.startsWith('e:')) return true;
  try {
    return /\p{Extended_Pictographic}/u.test(icon);
  } catch (e) {
    console.warn('isEmojiIcon failed:', e);
    return false;
  }
}

export function parseAmenities(highlights) {
  if (!highlights) return [];
  if (Array.isArray(highlights)) {
    return highlights
      .filter((item) => item && (item.label || item.name))
      .map((item) => ({
        label: String(item.label || item.name).trim(),
        icon: item.icon ? String(item.icon).trim() : highlightIcon(item.label || item.name),
      }));
  }
  if (typeof highlights !== 'string') return [];
  const trimmed = highlights.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && item.label)
          .map((item) => ({
            label: String(item.label).trim(),
            icon: item.icon ? String(item.icon).trim() : highlightIcon(item.label),
          }));
      }
    } catch (e) {
      console.warn('parseAmenities JSON parse failed:', e);
    }
  }

  return splitCsv(trimmed).map((part) => {
    const pipe = part.indexOf('|');
    if (pipe === -1) {
      return { label: part, icon: highlightIcon(part) };
    }
    const label = part.slice(0, pipe).trim();
    let icon = part.slice(pipe + 1).trim();
    if (icon.startsWith('e:')) icon = icon.slice(2);
    return { label, icon: icon || highlightIcon(label) };
  });
}

export function serializeAmenities(items) {
  if (!items?.length) return '';
  return JSON.stringify(
    items.map(({ label, icon }) => {
      let stored = icon;
      if (isEmojiIcon(icon) && !icon.startsWith('e:')) stored = `e:${icon}`;
      return { label: label.trim(), icon: stored };
    }),
  );
}

export function mergeServicesAndHighlights(business) {
  const services = splitCsv(business?.primary_services);
  const amenities = parseAmenities(business?.highlights).map((a) => a.label);
  return [...new Set([...services, ...amenities])];
}

export function formatBusinessType(type = '') {
  const labels = {
    Restaurant: 'Restaurant / Café',
    Hotel: 'Hôtel / Riad',
    Retail: 'Boutique / Commerce',
    Services: 'Services / Conseil',
    Tech: 'Technologie',
  };
  return labels[type] || type || '';
}

const PHONE_PATTERN =
  /(?:\+|00)?212[\s.-]?[567]\d{8}|0[567]\d{8}|(?:\+|00)?[\d\s().-]{8,18}\d/;

export function extractPhoneFromText(text = '') {
  if (!text) return '';
  const match = String(text).match(PHONE_PATTERN);
  return match ? match[0].trim() : '';
}

export function normalizeMoroccanPhone(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';

  let digits = raw.replace(/[^\d+]/g, '');
  if (!digits) return '';

  let num = digits.replace(/^\+/, '');
  if (num.startsWith('00')) num = num.slice(2);
  if (num.startsWith('0') && num.length === 10) {
    num = `212${num.slice(1)}`;
  }

  const digitCount = num.replace(/\D/g, '').length;
  if (digitCount < 8) return '';

  if (num.startsWith('212')) {
    return `+${num}`;
  }

  return digits.startsWith('+') ? digits : `+${num}`;
}

export function resolveBusinessPhone(business) {
  const direct = (business?.owner_phone || '').trim();
  if (direct) return direct;

  for (const field of [business?.public_knowledge, business?.description]) {
    const extracted = extractPhoneFromText(field);
    if (extracted) return extracted;
  }

  return '';
}

function phoneDigits(value = '') {
  return String(value || '').replace(/[^\d+]/g, '');
}

export function buildTelUrl(phone) {
  const normalized = normalizeMoroccanPhone(phone);
  if (normalized) return `tel:${normalized}`;

  const digits = phoneDigits(phone);
  if (digits.replace(/\D/g, '').length >= 8) {
    return digits.startsWith('+') ? `tel:${digits}` : `tel:+${digits.replace(/^\+/, '')}`;
  }
  return '';
}

export function buildWhatsAppUrl(phone, message = '') {
  const normalized = normalizeMoroccanPhone(phone);
  const text = message ? encodeURIComponent(message) : '';
  const digits = normalized ? normalized.replace(/^\+/, '') : phoneDigits(phone).replace(/^\+/, '');

  if (digits.replace(/\D/g, '').length >= 8) {
    return `https://wa.me/${digits.replace(/\D/g, '')}${text ? `?text=${text}` : ''}`;
  }

  return text ? `https://wa.me/?text=${text}` : 'https://wa.me/';
}

export function buildLocationLabel(business) {
  if (business.city) return `${business.city}, Morocco`;
  if (business.address) return business.address;
  return 'Morocco';
}

export function buildAddressLine(business) {
  if (business.address) return business.address;
  if (business.city) return `${business.city}, Morocco`;
  return null;
}

export function buildMapsQuery(business) {
  const coords = parseBusinessCoords(business);
  if (coords) {
    return `${coords.lat},${coords.lng}`;
  }
  if (business.address) return business.address;
  if (business.city) return `${business.name || ''} ${business.city}, Morocco`.trim();
  return business.name || '';
}

export function buildMapEmbedUrl(business) {
  const coords = parseBusinessCoords(business);
  if (coords) {
    const { lat, lng } = coords;
    const pad = 0.015;
    const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`;
  }
  const query = buildMapsQuery(business);
  if (!query) return null;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

export function buildDirectionsUrl(business) {
  const query = buildMapsQuery(business);
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function hasMapLocation(business) {
  return Boolean(
    parseBusinessCoords(business) ||
      (business?.address && String(business.address).trim()) ||
      (business?.city && String(business.city).trim()),
  );
}

export function coverImageUrl(business, fallbackFn) {
  const uploaded = resolveApiUrl(business.cover_image_url);
  if (uploaded) return uploaded;
  return fallbackFn ? fallbackFn(business.name, business.business_type) : null;
}

export function highlightIcon(label) {
  const text = label.toLowerCase();
  if (text.includes('wifi') || text.includes('wi-fi')) return 'wifi';
  if (text.includes('pool') || text.includes('piscine')) return 'pool';
  if (text.includes('dine') || text.includes('restaurant') || text.includes('food')) return 'restaurant';
  if (text.includes('park')) return 'local_parking';
  if (text.includes('spa')) return 'spa';
  return 'check_circle';
}

export async function uploadBusinessCover(businessId, file, ownerToken) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_URL}/businesses/${businessId}/cover`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: formData,
    },
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Cover upload failed');
  }
  return response.json();
}
