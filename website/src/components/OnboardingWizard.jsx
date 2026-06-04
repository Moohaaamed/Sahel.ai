import { useState, useRef, useEffect, useMemo } from 'react';
import { API_URL } from '../config';
import { uploadBusinessCover, serializeAmenities } from '../lib/businessSite';
import { ROUTES } from '../lib/routes';
import LocationMapPicker from './LocationMapPicker';
import SahelLogo from './SahelLogo';
import AmenityIcon from './AmenityIcon';

const STEPS_COUNT = 3;

const BUSINESS_TYPES = [
  { value: 'Restaurant', label: 'Restaurant / Café' },
  { value: 'Hotel', label: 'Hôtel / Riad' },
  { value: 'Retail', label: 'Boutique / Commerce' },
  { value: 'Services', label: 'Services / Conseil' },
  { value: 'Tech', label: 'Technologie' },
];

const AMENITY_TAGS = [
  { id: 'wifi', label: 'WiFi', icon: 'wifi' },
  { id: 'parking', label: 'Parking', icon: 'local_parking' },
  { id: 'card', label: 'Paiement carte', icon: 'payments' },
  { id: 'delivery', label: 'Livraison', icon: 'delivery_dining' },
  { id: 'access', label: 'Accessibilité', icon: 'accessible' },
];

const CUSTOM_ICON_CHOICES = [
  'star',
  'restaurant',
  'local_cafe',
  'spa',
  'pool',
  'ac_unit',
  'pets',
  'child_care',
  'storefront',
  'local_laundry_service',
  'room_service',
  'fitness_center',
];

const PROCESSING_MESSAGES = [
  'Nettoyage des métadonnées...',
  'Génération des embeddings vectoriels...',
  'Optimisation du moteur de recherche...',
  'Finalisation de votre mini-site...',
];

function parseCoord(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function ProgressBar({ currentStep }) {
  return (
    <div className="flex gap-2 h-1.5 w-full">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`flex-1 rounded-full ${
            index < currentStep ? 'step-completed' : index === currentStep ? 'step-active' : 'step-inactive'
          }`}
        />
      ))}
    </div>
  );
}

function OnboardingProcessing({ uploadProgress }) {
  const [statusText, setStatusText] = useState(PROCESSING_MESSAGES[0]);
  const [activeProcessStep, setActiveProcessStep] = useState(1);

  useEffect(() => {
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % PROCESSING_MESSAGES.length;
      setStatusText(PROCESSING_MESSAGES[messageIndex]);
    }, 3000);

    const stepInterval = setInterval(() => {
      setActiveProcessStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 4500);

    return () => {
      clearInterval(messageInterval);
      clearInterval(stepInterval);
    };
  }, []);

  const steps = [
    { title: 'Création du profil', detail: 'Enregistrement de votre commerce' },
    { title: 'Photo & localisation', detail: 'Personnalisation du mini-site' },
    { title: 'Indexation IA', detail: uploadProgress || 'Préparation de votre assistant' },
  ];

  return (
    <div className="py-xl flex flex-col items-center justify-center gap-lg text-center animate-subtle-pulse">
      <div className="relative flex justify-center items-center">
        <div className="onboarding-spinner" />
        <div className="absolute w-12 h-12 flex items-center justify-center">
          <span
            className="material-symbols-outlined text-primary text-3xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            auto_awesome
          </span>
        </div>
      </div>
      <div className="space-y-xs max-w-md">
        <h2 className="font-headline-md text-headline-md text-on-background m-0">
          Traitement en cours...
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant m-0">{statusText}</p>
      </div>
      <div className="bg-surface border border-hairline-border p-md rounded-lg text-left w-full max-w-md shadow-sm">
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const done = stepNum < activeProcessStep;
          const current = stepNum === activeProcessStep;
          return (
            <div
              key={step.title}
              className={`flex items-center gap-sm py-xs ${!done && !current ? 'opacity-50' : ''}`}
            >
              <span
                className={`material-symbols-outlined text-md ${
                  done ? 'text-primary' : current ? 'text-primary animate-spin' : 'text-outline'
                }`}
                style={done ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {done ? 'check_circle' : current ? 'autorenew' : 'pending'}
              </span>
              <div>
                <p className="font-label-md text-label-md text-on-surface m-0">{step.title}</p>
                <p className="font-label-sm text-label-sm text-outline m-0">{step.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OnboardingWizard({ owner, ownerToken, onComplete, onExit }) {
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('sahel_onboarding_step');
    if (saved) {
      const step = parseInt(saved, 10);
      if (step >= 0 && step < STEPS_COUNT) return step;
    }
    return 0;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState(() => {
    const saved = localStorage.getItem('sahel_onboarding_amenities');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });
  const [showCustomAmenity, setShowCustomAmenity] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customIcon, setCustomIcon] = useState('star');
  const [customEmoji, setCustomEmoji] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('sahel_onboarding_form');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      name: '',
      business_type: 'Restaurant',
      city: '',
      address: '',
      latitude: '',
      longitude: '',
      owner_phone: '',
      description: '',
      working_hours: '',
      primary_services: '',
      pasted_text: '',
      ice: '',
      rc: '',
      if_tax: '',
      patente: '',
      cnss: '',
      legal_form: '',
    };
  });

  const [file, setFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('sahel_onboarding_step', String(currentStep));
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem('sahel_onboarding_amenities', JSON.stringify(selectedAmenities));
  }, [selectedAmenities]);

  useEffect(() => {
    localStorage.setItem('sahel_onboarding_form', JSON.stringify(form));
  }, [form]);

  const handleExit = () => {
    localStorage.removeItem('sahel_onboarding_step');
    localStorage.removeItem('sahel_onboarding_amenities');
    localStorage.removeItem('sahel_onboarding_form');
    onExit();
  };

  const mapSearchHint = useMemo(() => {
    return [form.address, form.city, form.name].filter(Boolean).join(', ');
  }, [form.address, form.city, form.name]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const isAmenitySelected = (tag) => selectedAmenities.some((a) => a.label === tag.label);

  const togglePresetAmenity = (tag) => {
    setSelectedAmenities((prev) => {
      if (prev.some((a) => a.label === tag.label)) {
        return prev.filter((a) => a.label !== tag.label);
      }
      return [...prev, { label: tag.label, icon: tag.icon }];
    });
  };

  const addCustomAmenity = () => {
    const label = customLabel.trim();
    if (!label) {
      alert('Donnez un nom à votre service.');
      return;
    }
    if (selectedAmenities.some((a) => a.label.toLowerCase() === label.toLowerCase())) {
      alert('Ce service existe déjà.');
      return;
    }
    const icon = customEmoji.trim() || customIcon;
    setSelectedAmenities((prev) => [...prev, { label, icon }]);
    setCustomLabel('');
    setCustomEmoji('');
    setShowCustomAmenity(false);
  };

  const handleLocationChange = (lat, lng, resolvedAddress) => {
    setForm((prev) => ({
      ...prev,
      latitude: String(Number(lat).toFixed(6)),
      longitude: String(Number(lng).toFixed(6)),
      ...(resolvedAddress ? { address: resolvedAddress } : {}),
    }));
  };

  const handleCoverSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      alert('Veuillez choisir une image (JPG, PNG ou WEBP).');
      return;
    }
    setCoverFile(selected);
    setCoverPreview(URL.createObjectURL(selected));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) addDocumentFile(e.dataTransfer.files[0]);
  };

  const addDocumentFile = (picked) => {
    setFile(picked);
    setUploadedFiles([{ name: picked.name, size: picked.size }]);
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.[0]) addDocumentFile(e.target.files[0]);
  };

  const removeDocument = () => {
    setFile(null);
    setUploadedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const nextStep = () => {
    if (currentStep === 0) {
      if (!form.name.trim()) {
        alert('Veuillez saisir le nom de votre entreprise.');
        return;
      }
      if (!form.owner_phone.trim()) {
        alert('Veuillez saisir votre numéro WhatsApp professionnel.');
        return;
      }
    }
    if (currentStep === 1) {
      if (!form.description.trim()) {
        alert('Veuillez décrire votre activité.');
        return;
      }
      if (parseCoord(form.latitude) == null || parseCoord(form.longitude) == null) {
        alert('Placez votre commerce sur la carte (recherche ou clic sur la carte).');
        return;
      }
    }

    if (currentStep < STEPS_COUNT - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      submitOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const submitOnboarding = async () => {
    setIsSubmitting(true);
    setUploadProgress('Création du profil de l\'entreprise...');

    const highlights = serializeAmenities(selectedAmenities);
    const publicKnowledge = form.pasted_text.trim();

    try {
      const businessPayload = {
        name: form.name.trim(),
        business_type: form.business_type,
        description: form.description.trim(),
        owner_email: owner.email,
        owner_phone:
          '+212' + form.owner_phone.trim().replace(/^\+212/, '').replace(/^0/, ''),
        city: form.city.trim(),
        address: form.address.trim(),
        latitude: parseCoord(form.latitude),
        longitude: parseCoord(form.longitude),
        working_hours: form.working_hours.trim(),
        primary_services: form.primary_services.trim(),
        highlights,
        public_knowledge: publicKnowledge || null,
        owner_id: owner.id,
        ice: form.ice.trim() || null,
        rc: form.rc.trim() || null,
        if_tax: form.if_tax.trim() || null,
        patente: form.patente.trim() || null,
        cnss: form.cnss.trim() || null,
        legal_form: form.legal_form.trim() || null,
      };

      const response = await fetch(`${API_URL}/businesses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ownerToken}`,
        },
        body: JSON.stringify(businessPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Erreur lors de la création de l\'entreprise.');
      }

      let business = await response.json();

      if (coverFile) {
        setUploadProgress('Téléversement de la photo de couverture...');
        business = await uploadBusinessCover(business.id, coverFile, ownerToken);
      }

      if (file) {
        setUploadProgress('Indexation de vos documents...');
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch(`${API_URL}/businesses/${business.id}/documents`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${ownerToken}` },
          body: formData,
        });
        if (!uploadRes.ok) {
          const errDetail = await uploadRes.json().catch(() => ({}));
          alert(
            'Le commerce a été créé, mais l\'indexation du document a échoué : ' +
              (errDetail.detail || 'Erreur inconnue'),
          );
        }
      } else if (form.pasted_text.trim()) {
        setUploadProgress('Indexation de vos connaissances...');
        const textBlob = new Blob([form.pasted_text], { type: 'text/plain' });
        const textFile = new File([textBlob], 'profil_entreprise.txt', { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', textFile);
        const uploadRes = await fetch(`${API_URL}/businesses/${business.id}/documents`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${ownerToken}` },
          body: formData,
        });
        if (!uploadRes.ok) {
          const errDetail = await uploadRes.json().catch(() => ({}));
          alert(
            'Le commerce a été créé, mais l\'indexation du texte a échoué : ' +
              (errDetail.detail || 'Erreur inconnue'),
          );
        }
      }

      setUploadProgress('Configuration terminée !');
      localStorage.removeItem('sahel_onboarding_step');
      localStorage.removeItem('sahel_onboarding_amenities');
      localStorage.removeItem('sahel_onboarding_form');
      setTimeout(() => onComplete(business), 800);
    } catch (error) {
      alert(error.message || 'Une erreur est survenue lors de l\'installation.');
      setIsSubmitting(false);
    }
  };

  const stepLabels = ['Identité', 'Votre commerce', 'Documents & IA'];

  return (
    <div className="bg-warm-bg text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed page-enter">
      <header className="bg-background sticky top-0 z-50 border-b border-hairline-border">
        <div className="flex justify-between items-center px-gutter py-4 w-full max-w-2xl mx-auto">
          <a href={ROUTES.home} className="no-underline">
            <SahelLogo size={28} textClass="font-headline-sm text-headline-sm italic text-on-background" />
          </a>
          {currentStep === 0 && !isSubmitting ? (
            <a
              href={ROUTES.home}
              className="font-label-md text-label-md text-primary no-underline hover:opacity-80"
            >
              Aide
            </a>
          ) : onExit ? (
            <button
              type="button"
              onClick={handleExit}
              className="font-label-md text-label-md text-on-surface-variant bg-transparent border-0 cursor-pointer hover:text-primary"
            >
              Quitter
            </button>
          ) : (
            <span className="w-16" />
          )}
        </div>
      </header>

      <main className="flex-grow py-lg px-gutter pb-xl">
        <div className="max-w-2xl mx-auto w-full">
          {!isSubmitting && (
            <div className="mb-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary">
                  Étape {currentStep + 1} sur {STEPS_COUNT}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {stepLabels[currentStep]}
                </span>
              </div>
              <ProgressBar currentStep={currentStep} />
            </div>
          )}

          <div className="bg-surface border border-hairline-border rounded-lg p-md md:p-lg shadow-sm">
            {isSubmitting ? (
              <OnboardingProcessing uploadProgress={uploadProgress} />
            ) : (
              <>
                {currentStep === 0 && (
                  <div className="space-y-gutter">
                    <header>
                      <h1 className="font-headline-md text-headline-md text-on-background mb-2 m-0">
                        Bienvenue
                      </h1>
                      <p className="font-body-lg text-body-lg text-on-surface-variant m-0">
                        Commençons par les informations de base de votre entreprise.
                      </p>
                    </header>
                    <div className="space-y-md">
                      <label className="flex flex-col gap-base">
                        <span className="font-label-md text-label-md text-on-surface">Nom de l&apos;entreprise</span>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleInputChange}
                          className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                          placeholder="Ex: Café de l'Atlas"
                          type="text"
                        />
                      </label>
                      <label className="flex flex-col gap-base">
                        <span className="font-label-md text-label-md text-on-surface">Type d&apos;activité</span>
                        <select
                          name="business_type"
                          value={form.business_type}
                          onChange={handleInputChange}
                          className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md h-[42px]"
                        >
                          {BUSINESS_TYPES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="flex flex-col gap-base">
                        <span className="font-label-md text-label-md text-on-surface">Ville</span>
                        <input
                          name="city"
                          value={form.city}
                          onChange={handleInputChange}
                          className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                          placeholder="Ex: Casablanca"
                          type="text"
                        />
                      </label>
                      <label className="flex flex-col gap-base">
                        <span className="font-label-md text-label-md text-on-surface">
                          WhatsApp professionnel
                        </span>
                        <div className="flex">
                          <span className="flex items-center px-sm border border-r-0 border-hairline-border bg-surface-container-low text-on-surface-variant rounded-l font-body-md">
                            +212
                          </span>
                          <input
                            name="owner_phone"
                            value={form.owner_phone}
                            onChange={handleInputChange}
                            className="w-full bg-background border border-hairline-border rounded-r px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                            placeholder="6 00 00 00 00"
                            type="tel"
                          />
                        </div>
                      </label>

                      <details className="mt-md border border-hairline-border rounded-lg p-md">
                        <summary className="font-label-md text-label-md text-primary cursor-pointer select-none">
                          Informations légales (Maroc)
                        </summary>
                        <div className="space-y-md mt-md">
                          <label className="flex flex-col gap-base">
                            <span className="font-label-md text-label-md text-on-surface">Forme juridique</span>
                            <select
                              name="legal_form"
                              value={form.legal_form}
                              onChange={handleInputChange}
                              className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md h-[42px]"
                            >
                              <option value="">Sélectionnez...</option>
                              <option value="Auto-entrepreneur">Auto-entrepreneur</option>
                              <option value="SARL">SARL</option>
                              <option value="SASU">SASU</option>
                              <option value="SA">SA</option>
                              <option value="SNC">SNC</option>
                              <option value="Société civile">Société civile</option>
                              <option value="Coopérative">Coopérative</option>
                            </select>
                          </label>
                          <label className="flex flex-col gap-base">
                            <span className="font-label-md text-label-md text-on-surface">ICE</span>
                            <input
                              name="ice"
                              value={form.ice}
                              onChange={handleInputChange}
                              className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                              placeholder="Identifiant Commun de l'Entreprise"
                              type="text"
                            />
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                            <label className="flex flex-col gap-base">
                              <span className="font-label-md text-label-md text-on-surface">RC</span>
                              <input
                                name="rc"
                                value={form.rc}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                                placeholder="Registre de Commerce"
                                type="text"
                              />
                            </label>
                            <label className="flex flex-col gap-base">
                              <span className="font-label-md text-label-md text-on-surface">IF</span>
                              <input
                                name="if_tax"
                                value={form.if_tax}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                                placeholder="Identifiant Fiscal"
                                type="text"
                              />
                            </label>
                            <label className="flex flex-col gap-base">
                              <span className="font-label-md text-label-md text-on-surface">Patente</span>
                              <input
                                name="patente"
                                value={form.patente}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                                placeholder="Numéro de patente"
                                type="text"
                              />
                            </label>
                            <label className="flex flex-col gap-base">
                              <span className="font-label-md text-label-md text-on-surface">CNSS</span>
                              <input
                                name="cnss"
                                value={form.cnss}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                                placeholder="Numéro CNSS"
                                type="text"
                              />
                            </label>
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-gutter">
                    <header>
                      <h1 className="font-headline-md text-headline-md text-on-background mb-2 m-0">
                        Parlez-nous de votre commerce
                      </h1>
                      <p className="font-body-lg text-body-lg text-on-surface-variant m-0">
                        Ces détails apparaîtront sur votre mini-site et aideront vos clients à vous trouver.
                      </p>
                    </header>

                    <form className="space-y-gutter" onSubmit={(e) => e.preventDefault()}>
                      <label className="flex flex-col gap-base">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                          Description
                        </span>
                        <textarea
                          name="description"
                          value={form.description}
                          onChange={handleInputChange}
                          className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none font-body-md"
                          placeholder="Décrivez brièvement votre activité..."
                          rows={4}
                        />
                      </label>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                        <label className="flex flex-col gap-base">
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                            Horaires
                          </span>
                          <div className="relative">
                            <input
                              name="working_hours"
                              value={form.working_hours}
                              onChange={handleInputChange}
                              className="w-full bg-background border border-hairline-border rounded px-sm py-xs pl-10 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                              placeholder="ex: 09:00 - 18:00"
                              type="text"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                              schedule
                            </span>
                          </div>
                        </label>
                        <label className="flex flex-col gap-base">
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                            Adresse complète
                          </span>
                          <div className="relative">
                            <input
                              name="address"
                              value={form.address}
                              onChange={handleInputChange}
                              className="w-full bg-background border border-hairline-border rounded px-sm py-xs pl-10 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                              placeholder="Rue Agdal, Casablanca"
                              type="text"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                              location_on
                            </span>
                          </div>
                        </label>
                      </div>

                      <div className="flex flex-col gap-sm">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                          Photo de couverture (mini-site)
                        </span>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => coverInputRef.current?.click()}
                          onKeyDown={(e) => e.key === 'Enter' && coverInputRef.current?.click()}
                          className="border-2 border-dashed border-outline-variant rounded-lg overflow-hidden cursor-pointer hover:bg-surface-blue/30 transition-colors min-h-[140px] flex items-center justify-center"
                        >
                          <input
                            ref={coverInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleCoverSelect}
                          />
                          {coverPreview ? (
                            <img
                              src={coverPreview}
                              alt="Aperçu couverture"
                              className="w-full h-48 object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-xs py-md">
                              <span className="material-symbols-outlined text-primary text-3xl">
                                add_photo_alternate
                              </span>
                              <p className="font-label-md text-label-md text-on-surface-variant m-0 text-center px-sm">
                                Téléversez la photo de votre établissement
                              </p>
                              <p className="font-label-sm text-label-sm text-outline m-0">JPG, PNG ou WEBP</p>
                            </div>
                          )}
                        </div>
                        {coverFile ? (
                          <p className="font-label-sm text-label-sm text-primary m-0">{coverFile.name}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-sm">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                          Services &amp; équipements
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {AMENITY_TAGS.map((tag) => {
                            const selected = isAmenitySelected(tag);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => togglePresetAmenity(tag)}
                                className={`flex items-center gap-2 px-3 py-1.5 border rounded-full font-label-md text-label-md transition-all ${
                                  selected
                                    ? 'tag-selected'
                                    : 'border-hairline-border text-on-surface-variant hover:border-primary'
                                }`}
                              >
                                <AmenityIcon icon={tag.icon} className="text-[18px]" filled={selected} onPrimary={selected} />
                                <span>{tag.label}</span>
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setShowCustomAmenity((v) => !v)}
                            className={`flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-full font-label-md text-label-md transition-all ${
                              showCustomAmenity
                                ? 'border-primary text-primary bg-surface-blue/30'
                                : 'border-outline text-outline hover:border-primary hover:text-primary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span>Autre</span>
                          </button>
                        </div>
                        {showCustomAmenity ? (
                          <div className="border border-hairline-border rounded-lg p-md bg-surface-container-low space-y-sm">
                            <label className="flex flex-col gap-xs">
                              <span className="font-label-md text-label-md text-on-surface">Nom du service</span>
                              <input
                                type="text"
                                value={customLabel}
                                onChange={(e) => setCustomLabel(e.target.value)}
                                className="w-full bg-background border border-hairline-border rounded px-sm py-xs font-body-md outline-none focus:ring-1 focus:ring-primary"
                                placeholder="Ex: Brunch du dimanche"
                              />
                            </label>
                            <div>
                              <span className="font-label-md text-label-md text-on-surface block mb-xs">Icône</span>
                              <div className="flex flex-wrap gap-2 mb-sm">
                                {CUSTOM_ICON_CHOICES.map((iconName) => (
                                  <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => {
                                      setCustomIcon(iconName);
                                      setCustomEmoji('');
                                    }}
                                    className={`w-10 h-10 rounded-lg border flex items-center justify-center ${
                                      customIcon === iconName && !customEmoji
                                        ? 'border-primary bg-surface-blue'
                                        : 'border-hairline-border bg-background'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-primary text-[20px]">{iconName}</span>
                                  </button>
                                ))}
                              </div>
                              <label className="flex flex-col gap-xs">
                                <span className="font-label-sm text-label-sm text-on-surface-variant">
                                  Ou emoji (ex: ☕ 🍕)
                                </span>
                                <input
                                  type="text"
                                  maxLength={4}
                                  value={customEmoji}
                                  onChange={(e) => setCustomEmoji(e.target.value)}
                                  className="w-24 bg-background border border-hairline-border rounded px-sm py-xs text-center text-xl outline-none focus:ring-1 focus:ring-primary"
                                  placeholder="🍕"
                                />
                              </label>
                            </div>
                            <button
                              type="button"
                              onClick={addCustomAmenity}
                              className="bg-primary text-on-primary px-md py-xs rounded font-label-md border-0 cursor-pointer"
                            >
                              Ajouter ce service
                            </button>
                          </div>
                        ) : null}
                        {selectedAmenities.filter((a) => !AMENITY_TAGS.some((t) => t.label === a.label)).length > 0 ? (
                          <div className="flex flex-wrap gap-2 pt-xs">
                            {selectedAmenities
                              .filter((a) => !AMENITY_TAGS.some((t) => t.label === a.label))
                              .map((a) => (
                                <span
                                  key={a.label}
                                  className="tag-selected flex items-center gap-2 px-3 py-1.5 border rounded-full font-label-md text-label-md"
                                >
                                  <AmenityIcon icon={a.icon} className="text-[18px]" />
                                  {a.label}
                                  <button
                                    type="button"
                                    className="border-0 bg-transparent cursor-pointer p-0 text-inherit opacity-80"
                                    onClick={() =>
                                      setSelectedAmenities((prev) => prev.filter((x) => x.label !== a.label))
                                    }
                                    aria-label={`Retirer ${a.label}`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                  </button>
                                </span>
                              ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-sm">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                          Emplacement sur la carte
                        </span>
                        <p className="font-label-sm text-label-sm text-on-surface-variant m-0">
                          Recherchez votre adresse ou cliquez sur la carte pour placer le repère de votre commerce.
                        </p>
                        <LocationMapPicker
                          latitude={form.latitude}
                          longitude={form.longitude}
                          searchQuery={mapSearchHint}
                          onLocationChange={handleLocationChange}
                        />
                      </div>
                    </form>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-gutter">
                    <header className="text-center md:text-left">
                      <h1 className="font-headline-md text-headline-md text-on-background mb-sm m-0">
                        Nourrissez votre IA
                      </h1>
                      <p className="font-body-lg text-body-lg text-on-surface-variant m-0 max-w-xl">
                        Téléversez vos documents (PDF, Word) ou saisissez les informations clés pour que votre
                        chatbot comprenne parfaitement votre activité.
                      </p>
                    </header>

                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
                        dragActive
                          ? 'border-primary bg-surface-blue'
                          : 'border-outline-variant hover:bg-surface-container-low'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.doc,.docx,.txt"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                      <div className="w-16 h-16 rounded-full bg-surface-blue flex items-center justify-center mb-sm">
                        <span className="material-symbols-outlined text-primary text-[32px]">upload_file</span>
                      </div>
                      <p className="font-label-md text-label-md text-on-surface mb-xs m-0">
                        Glissez-déposez vos fichiers ici
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant m-0">PDF, DOCX jusqu&apos;à 20 Mo</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-md px-gutter py-3 bg-surface-container text-primary font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-colors border-0 cursor-pointer"
                      >
                        Parcourir les fichiers
                      </button>
                    </div>

                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        {uploadedFiles.map((f) => (
                          <div
                            key={f.name}
                            className="flex items-center justify-between p-sm bg-surface-container-low rounded-lg border border-hairline-border"
                          >
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-primary">description</span>
                              <div>
                                <p className="font-label-md text-label-md text-on-surface m-0">{f.name}</p>
                                <p className="font-label-sm text-label-sm text-outline m-0">
                                  {(f.size / 1024 / 1024).toFixed(2)} Mo
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={removeDocument}
                              className="text-error hover:bg-error-container p-2 rounded-full border-0 bg-transparent cursor-pointer"
                              aria-label="Supprimer le fichier"
                            >
                              <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-md">
                      <div className="flex-grow h-px bg-hairline-border" />
                      <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">ou</span>
                      <div className="flex-grow h-px bg-hairline-border" />
                    </div>

                    <label className="flex flex-col gap-xs">
                      <span className="font-label-md text-label-md text-on-surface">
                        Saisie manuelle des connaissances
                      </span>
                      <p className="font-label-sm text-label-sm text-on-surface-variant m-0 mb-xs">
                        Ce texte apparaît sur votre mini-site (section « Informations utiles ») et nourrit votre IA.
                      </p>
                      <textarea
                        name="pasted_text"
                        value={form.pasted_text}
                        onChange={handleInputChange}
                        disabled={!!file}
                        className="w-full px-md py-sm border border-hairline-border rounded-lg font-body-md placeholder:text-outline-variant focus:ring-0 focus:border-primary transition-all resize-none disabled:opacity-50"
                        placeholder="Services, tarifs, horaires, FAQ..."
                        rows={6}
                      />
                    </label>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter opacity-70 pt-sm">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="material-symbols-outlined text-[20px]">verified_user</span>
                        <span className="font-label-sm text-label-sm">Données sécurisées</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <span className="material-symbols-outlined text-[20px]">psychology</span>
                        <span className="font-label-sm text-label-sm">IA souveraine</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center col-span-2 md:col-span-1">
                        <span className="material-symbols-outlined text-[20px]">language</span>
                        <span className="font-label-sm text-label-sm">Serveurs en Europe</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-md mt-lg border-t border-hairline-border">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors py-2 px-4 bg-transparent border-0 cursor-pointer ${
                      currentStep === 0 ? 'opacity-0 pointer-events-none' : ''
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all border-0 cursor-pointer flex items-center gap-2"
                  >
                    {currentStep === STEPS_COUNT - 1 ? (
                      <>
                        Créer mon chatbot
                        <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                      </>
                    ) : (
                      'Continuer'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-surface border-t border-hairline-border py-md shrink-0">
        <div className="max-w-2xl mx-auto px-gutter flex justify-between items-center">
          <span className="font-headline-sm italic text-on-surface">
            <SahelLogo size={28} textClass="font-headline-sm italic text-on-surface" />
          </span>
          <p className="font-label-sm text-label-sm text-on-surface-variant m-0">© 2026 Sahel.ai</p>
        </div>
      </footer>
    </div>
  );
}
