import { buildMapEmbedUrl, buildTelUrl, buildWhatsAppUrl } from '../lib/businessSite';
import { buildMiniSiteSections } from '../lib/miniSiteProfile';
import AmenityIcon from './AmenityIcon';
import { useLanguage } from '../i18n';

function SectionCard({ title, children, id }) {
  return (
    <section
      id={id}
      className="bg-surface-container-lowest p-md border border-hairline-border rounded-xl"
    >
      <h2 className="font-headline-sm text-headline-sm mb-sm border-b border-hairline-border pb-xs m-0">
        {title}
      </h2>
      {children}
    </section>
  );
}

const SOCIAL_PLATFORMS = {
  instagram: { icon: 'camera_alt', color: '#E4405F', label: 'Instagram' },
  facebook: { icon: 'facebook', color: '#1877F2', label: 'Facebook' },
  linkedin: { icon: 'work', color: '#0A66C2', label: 'LinkedIn' },
  twitter: { icon: 'alternate_email', color: '#1DA1F2', label: 'Twitter / X' },
  tiktok: { icon: 'music_note', color: '#000000', label: 'TikTok' },
  youtube: { icon: 'play_circle', color: '#FF0000', label: 'YouTube' },
};

export default function MiniSiteProfileSections({ business }) {
  const { t } = useLanguage();
  const sections = buildMiniSiteSections(business);
  const mapEmbedUrl = buildMapEmbedUrl(business);
  const contactPhone = sections.practical.contactPhone || '';
  const telLink = buildTelUrl(contactPhone);
  const waLink = buildWhatsAppUrl(
    contactPhone,
    t('miniSite.contactMessage', { name: business.name }),
  );

  const renderPracticalValue = (row) => {
    if (row.label !== 'WhatsApp / Téléphone' || !contactPhone) {
      return <p className="text-body-md text-on-surface-variant m-0 mt-1">{row.value}</p>;
    }

    return (
      <div className="flex flex-wrap items-center gap-sm mt-1">
        <p className="text-body-md text-on-surface-variant m-0">{row.value}</p>
        {telLink ? (
          <a href={telLink} className="inline-flex items-center gap-1 text-primary font-label-md no-underline hover:underline">
            <span className="material-symbols-outlined text-sm">call</span>
            {t('publicBusiness.call')}
          </a>
        ) : null}
        {waLink ? (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#128C7E] font-label-md no-underline hover:underline"
          >
            <span className="material-symbols-outlined text-sm">chat</span>
            {t('publicBusiness.whatsapp')}
          </a>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-md">
      <SectionCard title={sections.about.title} id={sections.about.id}>
        {sections.about.description ? (
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed m-0 whitespace-pre-wrap">
            {sections.about.description}
          </p>
        ) : (
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed m-0">
            {t('miniSite.welcomeMessage', { name: sections.about.businessName })}
          </p>
        )}
      </SectionCard>

      <SectionCard 
        title={
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-[22px]">auto_awesome</span>
            <span>{sections.amenities.title}</span>
          </div>
        } 
        id={sections.amenities.id}
      >
        {sections.amenities.items.length > 0 ? (
          <div className="flex flex-wrap gap-sm mb-md">
            {sections.amenities.items.map((item) => (
              <span
                key={item.label}
                className="inline-flex items-center gap-sm px-4 py-2.5 bg-white border border-outline-variant hover:border-primary/40 hover:bg-surface-blue/10 rounded-xl font-label-md text-label-md text-on-surface transition-all duration-200 shadow-sm"
              >
                <AmenityIcon icon={item.icon} className="text-[20px]" />
                {item.label}
              </span>
            ))}
          </div>
        ) : (
          <p className="font-body-md text-on-surface-variant m-0 mb-sm">
            {t('miniSite.noAmenities')}
          </p>
        )}
        {sections.amenities.extraServices.length > 0 ? (
          <div className="pt-sm border-t border-hairline-border/50">
            <p className="font-label-md text-label-md text-on-surface mb-xs m-0">{t('miniSite.otherServices')}</p>
            <div className="flex flex-wrap gap-xs">
              {sections.amenities.extraServices.map((name) => (
                <span
                  key={name}
                  className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm px-sm py-1.5 rounded-lg border border-hairline-border"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title={sections.practical.title} id={sections.practical.id}>
        {sections.practical.rows.length > 0 ? (
          <ul className="space-y-sm list-none p-0 m-0">
            {sections.practical.rows.map((row) => (
              <li key={row.label} className="flex items-start gap-sm">
                <span className="material-symbols-outlined text-primary shrink-0">{row.icon}</span>
                <div>
                  <p className="font-label-md text-label-md text-on-surface m-0">{row.label}</p>
                  {renderPracticalValue(row)}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body-md text-on-surface-variant m-0">
            {t('miniSite.contactForDetails')}
          </p>
        )}
      </SectionCard>

      {sections.knowledge.show ? (
        <SectionCard title={sections.knowledge.title} id={sections.knowledge.id}>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed m-0 whitespace-pre-wrap">
            {sections.knowledge.text}
          </p>
        </SectionCard>
      ) : null}

      {(() => {
        let socialLinks;
        try { socialLinks = JSON.parse(business.social_media || '{}'); } catch { socialLinks = {}; }
        const entries = Object.entries(socialLinks).filter(([, url]) => url && url.trim());
        if (entries.length === 0) return null;
        return (
          <section className="py-xl bg-white border-t border-hairline-border/50">
            <div className="max-w-7xl mx-auto text-center">
              <h2 className="font-headline-md text-headline-md mb-2 italic text-on-surface">{t('miniSite.socialMedia')}</h2>
              <div className="h-1 w-20 bg-primary/20 mb-10 mx-auto rounded-full"></div>
              <div className="flex flex-wrap justify-center gap-8 md:gap-12">
                {entries.map(([platform, url]) => {
                  const p = SOCIAL_PLATFORMS[platform] || { icon: 'link', color: '#378ADD', label: platform };
                  return (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-3 no-underline">
                      <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center transition-all duration-300 group-hover:bg-primary group-hover:text-white text-on-surface shadow-sm">
                        <span className="material-symbols-outlined text-3xl">{p.icon}</span>
                      </div>
                      <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant group-hover:text-primary transition-colors">{p.label}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}

      {sections.location.show ? (
        <SectionCard 
          title={
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-[22px]">map</span>
              <span>{sections.location.title}</span>
            </div>
          } 
          id={sections.location.id}
        >
          {/* Visual address details card list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sm mb-md text-left">
            {sections.location.workingHours && (
              <div className="flex items-start gap-xs bg-surface-container-low p-sm rounded-xl border border-hairline-border/60">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">schedule</span>
                <div>
                  <span className="font-label-sm text-[10px] text-on-surface-variant block uppercase tracking-wider">{t('publicBusiness.schedule')}</span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">{sections.location.workingHours}</span>
                </div>
              </div>
            )}
            {sections.location.addressLine && (
              <div className="flex items-start gap-xs bg-surface-container-low p-sm rounded-xl border border-hairline-border/60">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">location_on</span>
                <div>
                  <span className="font-label-sm text-[10px] text-on-surface-variant block uppercase tracking-wider">{t('publicBusiness.address')}</span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">{sections.location.addressLine}</span>
                </div>
              </div>
            )}
          </div>

          <div className="relative aspect-video w-full min-h-[240px] rounded-xl bg-surface-container border border-hairline-border overflow-hidden shadow-inner group/map">
            {mapEmbedUrl ? (
              <iframe
                title={`Carte — ${business.name}`}
                src={mapEmbedUrl}
                className="w-full h-full min-h-[240px] border-0 transition-transform duration-300 group-hover/map:scale-[1.01]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full min-h-[240px] flex flex-col items-center justify-center gap-sm p-md text-center">
                <span className="material-symbols-outlined text-outline text-4xl">map</span>
                <p className="font-body-md text-on-surface-variant m-0">{sections.location.locationLabel}</p>
              </div>
            )}
          </div>

          <div className="mt-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-sm bg-surface-container-low p-sm rounded-xl border border-hairline-border/50 text-left">
            <span className="text-on-surface-variant font-body-md font-medium">{sections.location.locationLabel}</span>
            {sections.location.directionsUrl ? (
              <a
                href={sections.location.directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-xs bg-primary text-on-primary font-label-md text-label-md px-md py-2 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/10 no-underline whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[16px]">directions</span>
                {t('miniSite.directions')}
              </a>
            ) : null}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
