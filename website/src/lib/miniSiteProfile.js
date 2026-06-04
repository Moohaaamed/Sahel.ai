import {
  buildAddressLine,
  buildDirectionsUrl,
  buildLocationLabel,
  buildTelUrl,
  buildWhatsAppUrl,
  formatBusinessType,
  parseAmenities,
  parseBusinessCoords,
  resolveBusinessPhone,
  splitCsv,
} from './businessSite';

export function enrichBusiness(raw) {
  if (!raw) return raw;
  const coords = parseBusinessCoords(raw);
  return {
    ...raw,
    latitude: coords?.lat ?? raw.latitude,
    longitude: coords?.lng ?? raw.longitude,
    description: raw.description ?? '',
    highlights: raw.highlights ?? '',
    public_knowledge: raw.public_knowledge ?? '',
    address: raw.address ?? '',
    city: raw.city ?? '',
    working_hours: raw.working_hours ?? '',
    owner_phone: raw.owner_phone ?? '',
    primary_services: raw.primary_services ?? '',
    business_type: raw.business_type ?? '',
  };
}

/** Ordered sections for the public mini-site left column. */
export function buildMiniSiteSections(business) {
  const b = enrichBusiness(business);
  const contactPhone = resolveBusinessPhone(b);
  const amenities = parseAmenities(b.highlights);
  const extraServices = splitCsv(b.primary_services).filter(
    (name) => !amenities.some((a) => a.label.toLowerCase() === name.toLowerCase()),
  );
  const coords = parseBusinessCoords(b);
  const addressLine = buildAddressLine(b);
  const locationLabel = buildLocationLabel(b);
  const directionsUrl = buildDirectionsUrl(b);

  const practical = [
    b.business_type && {
      icon: 'storefront',
      label: "Type d'activité",
      value: formatBusinessType(b.business_type) || b.business_type,
    },
    b.city && { icon: 'location_city', label: 'Ville', value: b.city },
    b.working_hours && { icon: 'schedule', label: 'Horaires', value: b.working_hours },
    addressLine && { icon: 'location_on', label: 'Adresse', value: addressLine },
    contactPhone && { icon: 'call', label: 'WhatsApp / Téléphone', value: contactPhone },
    coords && {
      icon: 'pin_drop',
      label: 'Coordonnées GPS',
      value: `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`,
    },
  ].filter(Boolean);

  const knowledge = (b.public_knowledge || '').trim();

  return {
    about: {
      id: 'about',
      title: 'À propos',
      show: true,
      description: (b.description || '').trim(),
      businessName: b.name,
    },
    amenities: {
      id: 'amenities',
      title: 'Services & équipements',
      show: true,
      items: amenities,
      extraServices,
    },
    practical: {
      id: 'practical',
      title: 'Informations pratiques',
      show: true,
      rows: practical,
      contactPhone,
    },
    knowledge: {
      id: 'knowledge',
      title: 'Informations complémentaires',
      show: Boolean(knowledge),
      text: knowledge,
    },
    location: {
      id: 'location',
      title: 'Localisation',
      show: Boolean(coords || addressLine || b.city),
      coords,
      addressLine,
      city: b.city,
      locationLabel,
      directionsUrl,
      workingHours: b.working_hours,
    },
  };
}
