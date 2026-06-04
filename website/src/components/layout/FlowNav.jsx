import { ROUTES } from '../../lib/routes';

const STEPS = [
  { id: 'home', label: 'Accueil', href: ROUTES.home },
  { id: 'login', label: 'Connexion', href: ROUTES.login },
  { id: 'onboarding', label: 'Configuration', href: ROUTES.onboarding },
  { id: 'success', label: 'Partage', href: ROUTES.success },
];

export default function FlowNav({ activeStep, backHref, backLabel = 'Retour' }) {
  const activeIndex = STEPS.findIndex((step) => step.id === activeStep);

  return (
    <div className="border-b border-hairline-border bg-surface-container-lowest">
      <div className="max-w-7xl mx-auto px-margin py-sm flex flex-col gap-sm">
        {backHref ? (
          <a
            href={backHref}
            className="inline-flex items-center gap-xs text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors no-underline w-fit"
          >
            <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
            {backLabel}
          </a>
        ) : null}
        <nav aria-label="Parcours commerçant" className="flex flex-wrap items-center gap-xs text-label-sm">
          {STEPS.map((step, index) => {
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;
            return (
              <span key={step.id} className="inline-flex items-center gap-xs">
                {index > 0 ? (
                  <span className="text-outline-variant material-symbols-outlined !text-[14px]">chevron_right</span>
                ) : null}
                {isPast ? (
                  <a
                    href={step.href}
                    className="text-primary font-medium no-underline hover:underline"
                  >
                    {step.label}
                  </a>
                ) : (
                  <span
                    className={
                      isActive
                        ? 'text-primary font-bold'
                        : 'text-outline-variant'
                    }
                  >
                    {step.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
