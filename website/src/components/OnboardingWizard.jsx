import { useState, useRef, useEffect, useMemo } from 'react';
import { API_URL } from '../config';
import { uploadBusinessCover, serializeAmenities } from '../lib/businessSite';
import { ROUTES } from '../lib/routes';
import LocationMapPicker from './LocationMapPicker';
import SahelLogo from './SahelLogo';
import AmenityIcon from './AmenityIcon';
import { useLanguage, LanguageSwitcher } from '../i18n';

const STEPS_COUNT = 3;

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
          className={`flex-1 rounded-full ${index < currentStep ? 'step-completed' : index === currentStep ? 'step-active' : 'step-inactive'
            }`}
        />
      ))}
    </div>
  );
}

function OnboardingProcessing({ uploadProgress }) {
  const { t } = useLanguage();
  const messagesRef = useRef([
    t('onboarding.progressCleaning'),
    t('onboarding.progressEmbeddings'),
    t('onboarding.progressOptimizing'),
    t('onboarding.progressFinalizing'),
  ]);
  messagesRef.current = [
    t('onboarding.progressCleaning'),
    t('onboarding.progressEmbeddings'),
    t('onboarding.progressOptimizing'),
    t('onboarding.progressFinalizing'),
  ];
  const [statusText, setStatusText] = useState(messagesRef.current[0]);
  const [activeProcessStep, setActiveProcessStep] = useState(1);

  useEffect(() => {
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messagesRef.current.length;
      setStatusText(messagesRef.current[messageIndex]);
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
    { title: t('onboarding.creatingProfile'), detail: t('onboarding.savingBusiness') },
    { title: t('onboarding.photoLocation'), detail: t('onboarding.customizingSite') },
    { title: t('onboarding.indexingAi'), detail: uploadProgress || t('onboarding.preparingAssistant') },
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
          {t('onboarding.processing')}
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
                className={`material-symbols-outlined text-md ${done ? 'text-primary' : current ? 'text-primary animate-spin' : 'text-outline'
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
  const { t } = useLanguage();
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

  const BUSINESS_TYPES = [
    { value: 'Restaurant', label: t('onboarding.restaurant') },
    { value: 'Hotel', label: t('onboarding.hotel') },
    { value: 'Retail', label: t('onboarding.shop') },
    { value: 'Services', label: t('onboarding.services') },
    { value: 'Tech', label: t('onboarding.tech') },
  ];

  const AMENITY_TAGS = [
    { id: 'wifi', label: t('onboarding.wifi'), icon: 'wifi' },
    { id: 'parking', label: t('onboarding.parking'), icon: 'local_parking' },
    { id: 'card', label: t('onboarding.cardPayment'), icon: 'payments' },
    { id: 'delivery', label: t('onboarding.delivery'), icon: 'delivery_dining' },
    { id: 'access', label: t('onboarding.accessibility'), icon: 'accessible' },
  ];

  const [selectedAmenities, setSelectedAmenities] = useState(() => {
    const saved = localStorage.getItem('sahel_onboarding_amenities');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((a) => a && a.label && typeof a.label === 'string' && a.label.trim());
        }
      } catch { /* ignore */ }
    }
    return [];
  });
  const [showCustomAmenity, setShowCustomAmenity] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customIcon, setCustomIcon] = useState('star');
  const [customEmoji, setCustomEmoji] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const formDefaults = {
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
    social_media: '',
  };

  const [form, setForm] = useState(() => {
    const saved = localStorage.getItem('sahel_onboarding_form');
    if (saved) {
      try {
        return { ...formDefaults, ...JSON.parse(saved) };
      } catch { /* ignore */ }
    }
    return formDefaults;
  });
  const [onboardingError, setOnboardingError] = useState('');

  const [file, setFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const coverPreviewRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('sahel_onboarding_step', String(currentStep));
  }, [currentStep]);

  useEffect(() => {
    return () => {
      if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
    };
  }, []);

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
      setOnboardingError(t('onboarding.validationServiceName'));
      return;
    }
    if (selectedAmenities.some((a) => a.label.toLowerCase() === label.toLowerCase())) {
      setOnboardingError(t('onboarding.validationServiceExists'));
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
      setOnboardingError(t('onboarding.validationImage'));
      return;
    }
    setCoverFile(selected);
    if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
    const url = URL.createObjectURL(selected);
    coverPreviewRef.current = url;
    setCoverPreview(url);
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
        setOnboardingError(t('onboarding.validationName'));
        return;
      }
      if (!form.owner_phone.trim()) {
        setOnboardingError(t('onboarding.validationWhatsapp'));
        return;
      }
    }
    if (currentStep === 1) {
      if (!form.description.trim()) {
        setOnboardingError(t('onboarding.validationDescription'));
        return;
      }
      if (parseCoord(form.latitude) == null || parseCoord(form.longitude) == null) {
        setOnboardingError(t('onboarding.validationMap'));
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
    setUploadProgress(t('onboarding.progressCreating'));

    const highlights = serializeAmenities(selectedAmenities);
    const publicKnowledge = form.pasted_text.trim();

    try {
      const normalizedPhone = form.owner_phone.trim().replace(/^\+212/, '').replace(/^0/, '');
      if (normalizedPhone.length < 9) {
        throw new Error(t('onboarding.validationPhone'));
      }
      const businessPayload = {
        name: form.name.trim(),
        business_type: form.business_type,
        description: form.description.trim(),
        owner_email: owner.email,
        owner_phone: '+212' + normalizedPhone,
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
        social_media: form.social_media.trim() || null,
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
        const msg = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
        throw new Error(msg || t('onboarding.errorApi'));
      }

      let business = await response.json();

      if (coverFile) {
        setUploadProgress(t('onboarding.progressUploading'));
        business = await uploadBusinessCover(business.id, coverFile, ownerToken);
      }

      if (file) {
        setUploadProgress(t('onboarding.progressIndexing'));
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch(`${API_URL}/businesses/${business.id}/documents`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${ownerToken}` },
          body: formData,
        });
        if (!uploadRes.ok) {
          const errDetail = await uploadRes.json().catch(() => ({}));
          const msg = typeof errDetail.detail === 'string' ? errDetail.detail : JSON.stringify(errDetail.detail);
          setOnboardingError(t('onboarding.errorPartial', { error: msg || t('onboarding.errorApi') }));
        }
      } else if (form.pasted_text.trim()) {
        setUploadProgress(t('onboarding.progressKnowledge'));
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
          const msg = typeof errDetail.detail === 'string' ? errDetail.detail : JSON.stringify(errDetail.detail);
          setOnboardingError(t('onboarding.errorPartial', { error: msg || t('onboarding.errorApi') }));
        }
      }

      setUploadProgress(t('onboarding.progressDone'));
      localStorage.removeItem('sahel_onboarding_step');
      localStorage.removeItem('sahel_onboarding_amenities');
      localStorage.removeItem('sahel_onboarding_form');
      setTimeout(() => onComplete(business), 800);
    } catch (error) {
      setOnboardingError(error.message || t('onboarding.errorGeneric'));
      setIsSubmitting(false);
    }
  };

  const stepLabels = [t('onboarding.identity'), t('onboarding.yourBusiness'), t('onboarding.documentsAi')];

  return (
    <div className="bg-warm-bg text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary-fixed selection:text-on-primary-fixed page-enter">
      <header className="bg-background sticky top-0 z-50 border-b border-hairline-border">
        <div className="flex justify-between items-center px-gutter py-4 w-full max-w-2xl mx-auto">
          <a href={ROUTES.home} className="no-underline">
            <SahelLogo size={28} textClass="font-headline-sm text-headline-sm italic text-on-background" />
          </a>
          <LanguageSwitcher />
          {currentStep === 0 && !isSubmitting ? (
            <a
              href={ROUTES.contact}
              className="font-label-md text-label-md text-primary no-underline hover:opacity-80"
            >
              {t('onboarding.help')}
            </a>
          ) : onExit ? (
            <button
              type="button"
              onClick={handleExit}
              className="font-label-md text-label-md text-on-surface-variant bg-transparent border-0 cursor-pointer hover:text-primary"
            >
              {t('onboarding.exit')}
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
                  {t('onboarding.step', { n: currentStep + 1, m: STEPS_COUNT })}
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
                        {t('onboarding.welcome')}
                      </h1>
                      <p className="font-body-lg text-body-lg text-on-surface-variant m-0">
                        {t('onboarding.welcomeDesc')}
                      </p>
                    </header>
                    <div className="space-y-md">
                      <label className="flex flex-col gap-base">
                        <span className="font-label-md text-label-md text-on-surface">{t('onboarding.companyName')}</span>
                        <input
                          name="name"
                          value={form.name}
                          onChange={handleInputChange}
                          className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                          placeholder={t('onboarding.companyPlaceholder')}
                          type="text"
                        />
                      </label>
                      <label className="flex flex-col gap-base">
                        <span className="font-label-md text-label-md text-on-surface">{t('onboarding.activityType')}</span>
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
                        <span className="font-label-md text-label-md text-on-surface">{t('onboarding.city')}</span>
                        <input
                          name="city"
                          value={form.city}
                          onChange={handleInputChange}
                          className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                          placeholder={t('onboarding.cityPlaceholder')}
                          type="text"
                        />
                      </label>
                      <label className="flex flex-col gap-base">
                        <span className="font-label-md text-label-md text-on-surface">
                          {t('onboarding.whatsapp')}
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
                          {t('onboarding.legalInfo')}
                        </summary>
                        <div className="space-y-md mt-md">
                          <label className="flex flex-col gap-base">
                            <span className="font-label-md text-label-md text-on-surface">{t('onboarding.legalForm')}</span>
                            <select
                              name="legal_form"
                              value={form.legal_form}
                              onChange={handleInputChange}
                              className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md h-[42px]"
                            >
                              <option value="">{t('onboarding.selectForm')}</option>
                              <option value="Auto-entrepreneur">{t('onboarding.autoEntrepreneur')}</option>
                              <option value="SARL">{t('onboarding.sarl')}</option>
                              <option value="SASU">{t('onboarding.sasu')}</option>
                              <option value="SA">{t('onboarding.sa')}</option>
                              <option value="SNC">{t('onboarding.snc')}</option>
                              <option value="Société civile">{t('onboarding.civilSociety')}</option>
                              <option value="Coopérative">{t('onboarding.cooperative')}</option>
                            </select>
                          </label>
                          <label className="flex flex-col gap-base">
                            <span className="font-label-md text-label-md text-on-surface">{t('onboarding.ice')}</span>
                            <input
                              name="ice"
                              value={form.ice}
                              onChange={handleInputChange}
                              className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                              placeholder={t('onboarding.icePlaceholder')}
                              type="text"
                            />
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                            <label className="flex flex-col gap-base">
                              <span className="font-label-md text-label-md text-on-surface">{t('onboarding.rc')}</span>
                              <input
                                name="rc"
                                value={form.rc}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                                placeholder={t('onboarding.rcPlaceholder')}
                                type="text"
                              />
                            </label>
                            <label className="flex flex-col gap-base">
                              <span className="font-label-md text-label-md text-on-surface">{t('onboarding.if')}</span>
                              <input
                                name="if_tax"
                                value={form.if_tax}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                                placeholder={t('onboarding.ifPlaceholder')}
                                type="text"
                              />
                            </label>
                            <label className="flex flex-col gap-base">
                              <span className="font-label-md text-label-md text-on-surface">{t('onboarding.patente')}</span>
                              <input
                                name="patente"
                                value={form.patente}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                                placeholder={t('onboarding.patentePlaceholder')}
                                type="text"
                              />
                            </label>
                            <label className="flex flex-col gap-base">
                              <span className="font-label-md text-label-md text-on-surface">{t('onboarding.cnss')}</span>
                              <input
                                name="cnss"
                                value={form.cnss}
                                onChange={handleInputChange}
                                className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                                placeholder={t('onboarding.cnssPlaceholder')}
                                type="text"
                              />
                            </label>
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                )}

                {onboardingError && (
                  <div className="font-body-md text-sm text-error bg-error/10 border border-error/30 p-3 rounded-lg animate-fade-in mb-3">{onboardingError}</div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-gutter">
                    <header>
                      <h1 className="font-headline-md text-headline-md text-on-background mb-2 m-0">
                        {t('onboarding.tellUs')}
                      </h1>
                      <p className="font-body-lg text-body-lg text-on-surface-variant m-0">
                        {t('onboarding.tellUsDesc')}
                      </p>
                    </header>

                    <form className="space-y-gutter" onSubmit={(e) => e.preventDefault()}>
                      <label className="flex flex-col gap-base">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                          {t('onboarding.description')}
                        </span>
                        <textarea
                          name="description"
                          value={form.description}
                          onChange={handleInputChange}
                          className="w-full bg-background border border-hairline-border rounded px-sm py-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none font-body-md"
                          placeholder={t('onboarding.descriptionPlaceholder')}
                          rows={4}
                        />
                      </label>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                        <label className="flex flex-col gap-base">
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                            {t('onboarding.hours')}
                          </span>
                          <div className="relative">
                            <input
                              name="working_hours"
                              value={form.working_hours}
                              onChange={handleInputChange}
                              className="w-full bg-background border border-hairline-border rounded px-sm py-xs pl-10 focus:ring-1 focus:ring-primary focus:border-primary outline-none font-body-md"
                              placeholder={t('onboarding.hoursPlaceholder')}
                              type="text"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                              schedule
                            </span>
                          </div>
                        </label>
                        <label className="flex flex-col gap-base">
                          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                            {t('onboarding.address')}
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
                          {t('onboarding.coverPhoto')}
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
                                {t('onboarding.uploadPhoto')}
                              </p>
                              <p className="font-label-sm text-label-sm text-outline m-0">{t('onboarding.formatHint')}</p>
                            </div>
                          )}
                        </div>
                        {coverFile ? (
                          <p className="font-label-sm text-label-sm text-primary m-0">{coverFile.name}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-sm">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                          {t('onboarding.amenities')}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {AMENITY_TAGS.map((tag) => {
                            const selected = isAmenitySelected(tag);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => togglePresetAmenity(tag)}
                                className={`flex items-center gap-2 px-3 py-1.5 border rounded-full font-label-md text-label-md transition-all ${selected
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
                            className={`flex items-center gap-2 px-3 py-1.5 border border-dashed rounded-full font-label-md text-label-md transition-all ${showCustomAmenity
                                ? 'border-primary text-primary bg-surface-blue/30'
                                : 'border-outline text-outline hover:border-primary hover:text-primary'
                              }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span>{t('onboarding.customAmenity')}</span>
                          </button>
                        </div>
                        {showCustomAmenity ? (
                          <div className="border border-hairline-border rounded-lg p-md bg-surface-container-low space-y-sm">
                            <label className="flex flex-col gap-xs">
                              <span className="font-label-md text-label-md text-on-surface">{t('onboarding.serviceName')}</span>
                              <input
                                type="text"
                                value={customLabel}
                                onChange={(e) => setCustomLabel(e.target.value)}
                                className="w-full bg-background border border-hairline-border rounded px-sm py-xs font-body-md outline-none focus:ring-1 focus:ring-primary"
                                placeholder={t('onboarding.serviceNamePlaceholder')}
                              />
                            </label>
                            <div>
                              <span className="font-label-md text-label-md text-on-surface block mb-xs">{t('onboarding.icon')}</span>
                              <div className="flex flex-wrap gap-2 mb-sm">
                                {CUSTOM_ICON_CHOICES.map((iconName) => (
                                  <button
                                    key={iconName}
                                    type="button"
                                    onClick={() => {
                                      setCustomIcon(iconName);
                                      setCustomEmoji('');
                                    }}
                                    className={`w-10 h-10 rounded-lg border flex items-center justify-center ${customIcon === iconName && !customEmoji
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
                                  {t('onboarding.iconHint')}
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
                              {t('onboarding.addService')}
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
                                    aria-label={t('onboarding.deleteFile')}
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
                          {t('onboarding.mapLocation')}
                        </span>
                        <p className="font-label-sm text-label-sm text-on-surface-variant m-0">
                          {t('onboarding.mapDesc')}
                        </p>
                        <LocationMapPicker
                          latitude={form.latitude}
                          longitude={form.longitude}
                          searchQuery={mapSearchHint}
                          onLocationChange={handleLocationChange}
                        />
                      </div>

                      <div className="bg-surface-container-low border border-hairline-border rounded-lg p-md">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase flex items-center gap-2 mb-md">
                          <span className="material-symbols-outlined text-[20px]">share</span>
                          {t('onboarding.socialMedia')}
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                          {['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok', 'youtube'].map((platform) => {
                            const current = (() => {
                              try { return JSON.parse(form.social_media || '{}')[platform] || ''; } catch { return ''; }
                            })();
                            return (
                              <label key={platform} className="flex flex-col gap-base">
                                <span className="font-label-md text-label-md text-on-surface capitalize">{platform}</span>
                                <div className="flex items-center bg-white border border-hairline-border rounded overflow-hidden focus-within:ring-1 focus-within:ring-primary">
                                  <div className="w-10 h-10 flex items-center justify-center border-r border-hairline-border bg-surface-container-low shrink-0">
                                    <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                                      {platform === 'instagram' ? 'photo_camera' : platform === 'facebook' ? 'facebook' : platform === 'linkedin' ? 'work' : platform === 'twitter' ? 'alternate_email' : platform === 'tiktok' ? 'music_note' : 'play_circle'}
                                    </span>
                                  </div>
                                  <input
                                    type="url"
                                    className="w-full px-3 py-2 outline-none border-none font-body-md bg-transparent"
                                    placeholder={`https://${platform}.com/...`}
                                    value={current}
                                    onChange={(e) => {
                                      const newVal = e.target.value;
                                      setForm((prev) => {
                                        let currentData = {};
                                        const raw = (prev.social_media || '').trim();
                                        if (raw) {
                                          try {
                                            currentData = JSON.parse(raw);
                                          } catch (err) {
                                            // Corrupted data: preserve current state to avoid silent data loss
                                            console.error("Social media parse error:", err);
                                            return prev;
                                          }
                                        }
                                        const updated = { ...currentData, [platform]: newVal };
                                        return { ...prev, social_media: JSON.stringify(updated) };
                                      });
                                    }}
                                  />
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-gutter">
                    <header className="text-center md:text-left">
                      <h1 className="font-headline-md text-headline-md text-on-background mb-sm m-0">
                        {t('onboarding.feedAi')}
                      </h1>
                      <p className="font-body-lg text-body-lg text-on-surface-variant m-0 max-w-xl">
                        {t('onboarding.feedAiDesc')}
                      </p>
                    </header>

                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-xl flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${dragActive
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
                        {t('onboarding.dropzone')}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant m-0">{t('onboarding.fileHint')}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="mt-md px-gutter py-3 bg-surface-container text-primary font-label-md text-label-md rounded-lg hover:bg-surface-container-high transition-colors border-0 cursor-pointer"
                      >
                        {t('onboarding.browseFiles')}
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
                              aria-label={t('onboarding.deleteFile')}
                            >
                              <span className="material-symbols-outlined text-[20px]">close</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-md">
                      <div className="flex-grow h-px bg-hairline-border" />
                      <span className="font-label-sm text-label-sm text-outline uppercase tracking-widest">{t('common.or')}</span>
                      <div className="flex-grow h-px bg-hairline-border" />
                    </div>

                    <label className="flex flex-col gap-xs">
                      <span className="font-label-md text-label-md text-on-surface">
                        {t('onboarding.manualKnowledge')}
                      </span>
                      <p className="font-label-sm text-label-sm text-on-surface-variant m-0 mb-xs">
                        {t('onboarding.manualKnowledgeDesc')}
                      </p>
                      <textarea
                        name="pasted_text"
                        value={form.pasted_text}
                        onChange={handleInputChange}
                        disabled={!!file}
                        className="w-full px-md py-sm border border-hairline-border rounded-lg font-body-md placeholder:text-outline-variant focus:ring-0 focus:border-primary transition-all resize-none disabled:opacity-50"
                        placeholder={t('onboarding.knowledgePlaceholder')}
                        rows={6}
                      />
                    </label>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter opacity-70 pt-sm">
                      <div className="flex items-center gap-2 justify-center">
                        <span className="material-symbols-outlined text-[20px]">verified_user</span>
                        <span className="font-label-sm text-label-sm">{t('onboarding.secureData')}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <span className="material-symbols-outlined text-[20px]">psychology</span>
                        <span className="font-label-sm text-label-sm">{t('onboarding.sovereignAi')}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-center col-span-2 md:col-span-1">
                        <span className="material-symbols-outlined text-[20px]">language</span>
                        <span className="font-label-sm text-label-sm">{t('onboarding.europeServers')}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-md mt-lg border-t border-hairline-border">
                  <button
                    type="button"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors py-2 px-4 bg-transparent border-0 cursor-pointer ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''
                      }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    {t('common.back')}
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-primary text-on-primary px-8 py-3 rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-95 transition-all border-0 cursor-pointer flex items-center gap-2"
                  >
                    {currentStep === STEPS_COUNT - 1 ? (
                      <>
                        {t('onboarding.createChatbot')}
                        <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                      </>
                    ) : (
                      t('common.next')
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
          <p className="font-label-sm text-label-sm text-on-surface-variant m-0">&copy; {new Date().getFullYear()} Sahel.ai</p>
        </div>
      </footer>
    </div>
  );
}
