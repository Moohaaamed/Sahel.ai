import { useEffect, useState } from 'react';
import { API_URL } from '../config';
import { saveSession } from '../lib/session';
import { ROUTES } from '../lib/routes';
import MarketingHeader from './layout/MarketingHeader';
import SahelLogo from './SahelLogo';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('no-token');
      return;
    }
    fetch(`${API_URL}/owners/verify?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || 'Verification failed');
        }
        const data = await res.json();
        const session = { owner: data.owner, token: data.token, expires_at: data.expires_at };
        saveSession(session);
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
      });
  }, []);

  return (
    <div className="bg-surface-container-low min-h-screen flex flex-col">
      <MarketingHeader />
      <div className="flex-1 flex flex-col items-center justify-center p-sm">
        <div className="w-full max-w-[400px] bg-surface-container-lowest border border-hairline-border rounded-xl p-lg flex flex-col items-center shadow-sm text-center animate-fade-in">
          <style>{`
            @keyframes fade-in {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            .animate-fade-in { animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          `}</style>

          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-lg">
                <span className="material-symbols-outlined text-primary text-[36px] animate-spin">progress_activity</span>
              </div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface mb-sm">Verification...</h1>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-lg">
                <span className="material-symbols-outlined text-green-600 text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface mb-sm">Email verified!</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">Your account is now active.</p>
              <a href={ROUTES.onboarding} className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-all no-underline">
                Continue to onboarding
              </a>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-lg">
                <span className="material-symbols-outlined text-red-600 text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              </div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface mb-sm">Verification failed</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">The link is invalid or expired.</p>
              <a href={ROUTES.login} className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-all no-underline">
                Go to login
              </a>
            </>
          )}

          {status === 'no-token' && (
            <>
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-lg">
                <span className="material-symbols-outlined text-orange-600 text-[36px]">link_off</span>
              </div>
              <h1 className="font-headline-sm text-headline-sm text-on-surface mb-sm">Missing token</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">No verification token found in the link.</p>
              <a href={ROUTES.login} className="bg-primary text-on-primary px-lg py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-all no-underline">
                Go to login
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
