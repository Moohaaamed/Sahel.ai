import { useEffect } from 'react';
import OnboardingWizard from './OnboardingWizard';
import { ROUTES, loginUrl } from '../lib/routes';
import { getSession, saveLastBusiness } from '../lib/session';

export default function OnboardingFlow() {
  const session = getSession();

  useEffect(() => {
    if (!session?.owner) {
      window.location.replace(loginUrl(ROUTES.onboarding));
    }
  }, [session?.owner]);

  if (!session?.owner) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-bg">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <OnboardingWizard
      owner={session.owner}
      ownerToken={session.token}
      onExit={() => { window.location.href = ROUTES.home; }}
      onComplete={(business) => {
        saveLastBusiness(business);
        window.location.href = ROUTES.success;
      }}
    />
  );
}
