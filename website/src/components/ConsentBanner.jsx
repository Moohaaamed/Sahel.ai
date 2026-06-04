import { useState, useEffect } from 'react';
import { ROUTES } from '../lib/routes';

const STORAGE_KEY = 'sahel_cookie_consent';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  const reject = () => {
    localStorage.setItem(STORAGE_KEY, 'rejected');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-hairline-border shadow-lg p-md md:p-lg animate-fade-in">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-md">
        <div className="flex-1">
          <p className="font-body-md text-body-md text-on-surface m-0 mb-xs">
            Sahel.ai utilise des cookies
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant m-0">
            Nous utilisons des cookies nécessaires au fonctionnement et des analytics anonymes pour améliorer votre expérience.{' '}
            <a href={ROUTES.cookies} className="text-primary underline font-label-md">
              En savoir plus
            </a>
          </p>
        </div>
        <div className="flex gap-sm shrink-0">
          <button
            type="button"
            onClick={reject}
            className="bg-white border border-outline-variant text-on-surface px-md py-2.5 rounded-xl font-label-md text-label-md cursor-pointer hover:bg-surface-container-lowest transition-colors"
          >
            Refuser
          </button>
          <button
            type="button"
            onClick={accept}
            className="bg-primary text-on-primary px-md py-2.5 rounded-xl font-label-md text-label-md cursor-pointer hover:brightness-90 transition-all"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
