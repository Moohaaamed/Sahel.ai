import { useState, useEffect } from 'react';
import { API_URL, GOOGLE_CLIENT_ID } from '../config';
import { ROUTES, loginUrl } from '../lib/routes';
import { authHeaders, saveSession } from '../lib/session';
import MarketingHeader from './layout/MarketingHeader';
import SahelLogo from './SahelLogo';

async function resolvePostLoginPath(session) {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  if (next && next.startsWith('/')) {
    return next;
  }

  try {
    const response = await fetch(
      `${API_URL}/businesses?owner_id=${encodeURIComponent(session.owner.id)}`,
      { headers: authHeaders(session.token) },
    );
    if (response.ok) {
      const data = await response.json();
      if ((data.businesses || []).length > 0) {
        return ROUTES.dashboard;
      }
    }
  } catch {
    // fall through to onboarding
  }

  return ROUTES.onboarding;
}

export default function LoginPage({ initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
    terms: false,
  });
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setStatus('');
    setRegisteredEmail('');
    setForm({
      full_name: '',
      email: '',
      password: '',
      confirm_password: '',
      terms: false,
    });
  }, [initialMode]);

  const submitAuth = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    if (mode === 'register') {
      if (form.password !== form.confirm_password) {
        setStatus('Les mots de passe ne correspondent pas.');
        setIsSubmitting(false);
        return;
      }
      if (form.password.length < 6) {
        setStatus('Le mot de passe doit contenir au moins 6 caractères.');
        setIsSubmitting(false);
        return;
      }
      if (!form.terms) {
        setStatus("Veuillez accepter les conditions d'utilisation.");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const endpoint = mode === 'login' ? '/owners/login' : '/owners/register';
      const payload =
        mode === 'login'
          ? { email: form.email, password: form.password }
          : { full_name: form.full_name, email: form.email, password: form.password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || (mode === 'login' ? 'Identifiants incorrects' : 'Inscription impossible'));
      }

      const data = await response.json();

      if (mode === 'register') {
        setRegisteredEmail(form.email);
        return;
      }

      const session = { owner: data.owner, token: data.token, expires_at: data.expires_at };
      saveSession(session);
      const destination = await resolvePostLoginPath(session);
      window.location.href = destination;
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const googleLogin = async (credential) => {
    setIsSubmitting(true);
    setStatus('');
    try {
      const response = await fetch(`${API_URL}/owners/google-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Google sign-in failed');
      }
      const data = await response.json();
      const session = { owner: data.owner, token: data.token, expires_at: data.expires_at };
      saveSession(session);
      const destination = await resolvePostLoginPath(session);
      window.location.href = destination;
    } catch (error) {
      setStatus(error.message);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (!document.getElementById('gsi-script')) {
      const script = document.createElement('script');
      script.id = 'gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    const tryRender = () => {
      if (!window.google?.accounts) return setTimeout(tryRender, 200);
      const container = document.getElementById('google-btn');
      if (!container) return setTimeout(tryRender, 200);
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => googleLogin(response.credential),
      });
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
      });
    };
    setTimeout(tryRender, 200);
  }, [mode]);

  const resendVerification = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/owners/resend-verification?email=${encodeURIComponent(form.email)}`, {
        method: 'POST',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.detail || 'Failed to resend');
      }
      setStatus('✅ Verification email resent. Check your inbox.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface-container-low min-h-screen flex flex-col">
      <MarketingHeader />
      <div className="flex-1 flex flex-col items-center justify-center p-sm py-lg">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      {mode === 'register' && registeredEmail ? (
        /* Verification Success */
        <main className="w-full max-w-[400px] flex flex-col items-center animate-fade-in">
          <div className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl p-lg flex flex-col items-center shadow-sm text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-lg">
              <span className="material-symbols-outlined text-primary text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                mail
              </span>
            </div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface mb-sm">Vérifiez votre email</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-md">
              Un email de confirmation a été envoyé à <strong>{registeredEmail}</strong>.
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
              Cliquez sur le lien dans l'email pour activer votre compte, puis connectez-vous.
            </p>
            <div className="flex flex-col gap-sm w-full">
              <a
                className="w-full text-center bg-primary text-on-primary py-sm rounded-lg font-label-md text-label-md hover:opacity-90 transition-all no-underline"
                href={ROUTES.login}
              >
                Aller à la connexion
              </a>
              <button
                className="w-full border border-outline-variant py-sm rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-all cursor-pointer"
                onClick={resendVerification}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? 'Envoi...' : 'Renvoyer l\'email'}
              </button>
            </div>
            {status ? (
              <div className="text-sm mt-md text-on-surface-variant">{status}</div>
            ) : null}
          </div>
        </main>
      ) : mode === 'register' ? (
        /* Inscription Layout */
        <main className="w-full max-w-[400px] flex flex-col items-center animate-fade-in">
          {/* Registration Card */}
          <div className="w-full bg-surface-container-lowest border border-hairline-border rounded-xl p-lg flex flex-col items-center shadow-sm">
            {/* Logo Section */}
            <div className="mb-lg flex flex-col items-center gap-xs">
              <SahelLogo size={40} textClass="font-headline-sm text-headline-sm text-primary tracking-tight" />
            </div>

            {/* Heading */}
            <h1 className="font-headline-sm text-headline-sm text-on-surface mb-lg">
              Créer un compte
            </h1>

            {/* Registration Form */}
            <form onSubmit={submitAuth} className="w-full space-y-md">
              {/* Nom Complet */}
              <div className="flex flex-col gap-base text-left w-full">
                <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="name">
                  Nom complet
                </label>
                <input
                  className="w-full px-sm py-sm border border-outline-variant rounded-lg text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
                  id="name"
                  name="name"
                  placeholder="Jean Dupont"
                  required
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-base text-left w-full">
                <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="email">
                  Email
                </label>
                <input
                  className="w-full px-sm py-sm border border-outline-variant rounded-lg text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline"
                  id="email"
                  name="email"
                  placeholder="jean@entreprise.ma"
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              {/* Mot de passe */}
              <div className="flex flex-col gap-base text-left w-full">
                <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="password">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    className="w-full px-sm py-sm border border-outline-variant rounded-lg text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline pr-[40px]"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <button
                    className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1 cursor-pointer"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Confirmer le mot de passe */}
              <div className="flex flex-col gap-base text-left w-full">
                <label className="font-label-sm text-label-sm text-on-surface-variant" htmlFor="confirm-password">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <input
                    className="w-full px-sm py-sm border border-outline-variant rounded-lg text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-outline pr-[40px]"
                    id="confirm-password"
                    name="confirm-password"
                    placeholder="••••••••"
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirm_password}
                    onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <button
                    className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-1 cursor-pointer"
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showConfirmPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Terms and Privacy */}
              <div className="flex items-start gap-xs pt-base text-left">
                <input
                  className="mt-[2px] h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                  id="terms"
                  name="terms"
                  required
                  type="checkbox"
                  checked={form.terms}
                  onChange={(e) => setForm({ ...form, terms: e.target.checked })}
                  disabled={isSubmitting}
                />
                <label className="font-label-sm text-label-sm text-on-surface-variant select-none cursor-pointer" htmlFor="terms">
                  J'accepte les{' '}
                  <a className="text-primary hover:underline transition-all" href={ROUTES.terms}>
                    Conditions d'utilisation
                  </a>{' '}
                  et la{' '}
                  <a className="text-primary hover:underline transition-all" href={ROUTES.privacy}>
                    Politique de confidentialité
                  </a>
                  .
                </label>
              </div>

              {/* Error Message */}
              {status ? (
                <div className="text-error font-body-md text-sm text-left mt-sm bg-error-container/30 border border-error/20 p-2 rounded-lg animate-fade-in">
                  {status}
                </div>
              ) : null}

              {/* Submit Button */}
              <button
                className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md text-label-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-xs mt-md cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin">
                      progress_activity
                    </span>{' '}
                    Création...
                  </>
                ) : (
                  "S'inscrire"
                )}
              </button>
            </form>

            {/* Social Registration Divider */}
            <div className="w-full flex items-center gap-sm my-md">
              <div className="h-[1px] flex-grow bg-hairline-border"></div>
              <span className="font-label-sm text-label-sm text-outline">OU</span>
              <div className="h-[1px] flex-grow bg-hairline-border"></div>
            </div>

            {/* Google Sign Up */}
            {GOOGLE_CLIENT_ID ? (
              <div id="google-btn" className="w-full flex justify-center"></div>
            ) : (
              <button
                className="w-full border border-outline-variant py-sm rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors flex items-center justify-center gap-xs cursor-pointer"
                disabled
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">google</span>
                Google indisponible
              </button>
            )}
          </div>

          {/* Secondary Navigation */}
          <div className="mt-lg text-center">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Déjà un compte ?{' '}
              <a
                className="text-primary font-label-md text-label-md hover:underline transition-all ml-[2px]"
                href={ROUTES.login}
                onClick={(e) => {
                  e.preventDefault();
                  setMode('login');
                  setStatus('');
                  window.history.pushState(null, '', ROUTES.login);
                }}
              >
                Se connecter
              </a>
            </p>
          </div>

          {/* Language Selector or Small Footer Info */}
          <div className="mt-xl flex flex-col items-center gap-xs">
            <div className="flex gap-md">
              <span className="font-label-sm text-label-sm text-primary cursor-pointer hover:underline">
                Français
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant cursor-pointer hover:underline">
                العربية
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant cursor-pointer hover:underline">
                English
              </span>
            </div>
            <p className="font-label-sm text-label-sm text-outline">© 2024 Sahel.ai</p>
          </div>
        </main>
      ) : (
        /* Connexion Layout */
        <main className="w-full max-w-md bg-white border border-hairline-border rounded-xl p-lg flex flex-col gap-lg animate-fade-in shadow-sm">
          {/* Header / Identity */}
          <header className="flex flex-col items-center gap-sm">
            <div className="w-12 h-12 bg-primary flex items-center justify-center rounded-lg text-white mb-xs shadow-sm">
              <span className="material-symbols-outlined text-headline-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                dataset
              </span>
            </div>
            <h1 className="font-headline-md text-headline-md text-on-surface text-center">
              Bon retour
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant text-center px-sm">
              Accédez à votre espace professionnel Sahel.ai
            </p>
          </header>

          {/* Form Section */}
          <form onSubmit={submitAuth} className="flex flex-col gap-md text-left">
            {/* Email Field */}
            <div className="flex flex-col gap-xs group focus-within:text-primary">
              <label
                className="font-label-md text-label-md text-on-surface-variant ml-xs group-focus-within:text-primary transition-colors duration-200"
                htmlFor="email"
              >
                Email
              </label>
              <div className="relative">
                <input
                  className="w-full h-12 px-md border border-hairline-border rounded-lg bg-surface-container-low focus:ring-1 focus:ring-primary focus:border-primary transition-all font-body-md text-body-md outline-none"
                  id="email"
                  placeholder="nom@entreprise.ma"
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-xs group focus-within:text-primary">
              <div className="flex justify-between items-center ml-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant group-focus-within:text-primary transition-colors duration-200"
                  htmlFor="password"
                >
                  Mot de passe
                </label>
                <a
                  className="font-label-sm text-label-sm text-primary hover:underline transition-all"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Veuillez contacter le support à support@sahel.ai pour réinitialiser votre mot de passe.');
                  }}
                >
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <input
                  className="w-full h-12 px-md border border-hairline-border rounded-lg bg-surface-container-low focus:ring-1 focus:ring-primary focus:border-primary transition-all font-body-md text-body-md outline-none pr-[48px]"
                  id="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  disabled={isSubmitting}
                />
                <button
                  className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60 hover:opacity-100 transition-all flex items-center justify-center p-1 cursor-pointer"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined text-body-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {status ? (
              <div className="text-error font-body-md text-sm bg-error-container/30 border border-error/20 p-2 rounded-lg animate-fade-in">
                {status}
              </div>
            ) : null}

            {/* CTA */}
            <button
              className="w-full h-12 bg-primary text-white font-label-md text-label-md rounded-lg active:scale-[0.98] transition-all hover:opacity-90 mt-xs cursor-pointer flex items-center justify-center gap-xs disabled:opacity-60 disabled:pointer-events-none"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin">
                    progress_activity
                  </span>{' '}
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Social/Alternative Login */}
          <div className="relative flex items-center py-xs">
            <div className="flex-grow border-t border-hairline-border"></div>
            <span className="flex-shrink mx-md font-label-sm text-label-sm text-on-surface-variant opacity-40">
              OU
            </span>
            <div className="flex-grow border-t border-hairline-border"></div>
          </div>

          {GOOGLE_CLIENT_ID ? (
            <div id="google-btn" className="w-full flex justify-center"></div>
          ) : (
            <button
              className="w-full h-12 bg-white border border-hairline-border rounded-lg flex items-center justify-center gap-sm opacity-60"
              disabled
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">google</span>
              <span className="font-label-md text-label-md text-on-surface">Google indisponible</span>
            </button>
          )}

          {/* Footer Identity */}
          <footer className="mt-lg flex flex-col items-center gap-xs">
            <p className="font-body-md text-body-md text-on-surface-variant">
              Pas encore de compte ?{' '}
              <a
                className="text-primary font-label-md text-label-md ml-base hover:underline"
                href={ROUTES.register}
                onClick={(e) => {
                  e.preventDefault();
                  setMode('register');
                  setStatus('');
                  window.history.pushState(null, '', ROUTES.register);
                }}
              >
                S'inscrire
              </a>
            </p>
            <div className="mt-md flex gap-md opacity-60">
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href={ROUTES.privacy}>
                Confidentialité
              </a>
              <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href={ROUTES.terms}>
                Conditions
              </a>
            </div>
            <p className="font-label-sm text-label-sm text-on-surface-variant opacity-40 mt-sm">
              © 2024 Sahel.ai. Tous droits réservés.
            </p>
          </footer>
        </main>
      )}
      </div>
    </div>
  );
}
