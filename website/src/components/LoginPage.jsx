import { useState, useEffect, useCallback } from 'react';
import { API_URL, GOOGLE_CLIENT_ID } from '../config';
import { ROUTES } from '../lib/routes';
import { authHeaders, saveSession } from '../lib/session';
import { useLanguage, LanguageSwitcher } from '../i18n';
import SahelLogo from './SahelLogo';
import InteractiveDots from './InteractiveDots';

async function resolvePostLoginPath(session) {
  const params = new URLSearchParams(window.location.search);
  const next = params.get('next');
  if (next && next.startsWith('/')) {
    return next;
  }

  const response = await fetch(
    `${API_URL}/businesses?owner_id=${encodeURIComponent(session.owner.id)}`,
    { headers: authHeaders(session.token) },
  );

  if (!response.ok) {
    throw new Error('Failed to verify business status. Please try logging in again.');
  }

  const data = await response.json();
  if ((data.businesses || []).length > 0) {
    return ROUTES.dashboard;
  }

  return ROUTES.onboarding;
}

function parseErrorDetail(detail) {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((e) => {
      const field = ((e.loc || []).filter((l) => l !== 'body')).join('.');
      const msg = e.msg || 'Invalid value';
      return field ? `${field}: ${msg}` : msg;
    }).join('; ');
  }
  if (detail && typeof detail === 'object') {
    try { return JSON.stringify(detail); } catch { return 'Unknown error'; }
  }
  return '';
}

const formDefaults = {
  full_name: '',
  email: '',
  password: '',
  confirm_password: '',
  terms: false,
};

export default function LoginPage({ initialMode = 'login' }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(formDefaults);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState(''); // 'error' or 'success'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resetState, setResetState] = useState(null);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');

  useEffect(() => {
    setMode(initialMode);
    setStatus('');
    setRegisteredEmail('');
    setForm(formDefaults);
  }, [initialMode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setStatus('');
    setForm(formDefaults);
    window.history.pushState(null, '', newMode === 'login' ? ROUTES.login : ROUTES.register);
  };

  const submitAuth = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus('');

    if (mode === 'register') {
      if (!form.full_name || form.full_name.trim().length < 2) {
        setStatus(t('login.errors.nameTooShort'));
        setIsSubmitting(false);
        return;
      }
      if (form.password !== form.confirm_password) {
        setStatus(t('login.errors.passwordMismatch'));
        setIsSubmitting(false);
        return;
      }
      if (form.password.length < 6) {
        setStatus(t('login.errors.passwordTooShort'));
        setIsSubmitting(false);
        return;
      }
      if (!form.terms) {
        setStatus(t('login.errors.acceptTerms'));
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
        const msg = parseErrorDetail(error.detail);
        throw new Error(msg || (mode === 'login' ? t('login.errors.invalidCredentials') : t('login.errors.registrationFailed')));
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

  const googleLogin = useCallback(async (credential) => {
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
        const msg = parseErrorDetail(error.detail);
        throw new Error(msg || t('login.errors.googleFailed'));
      }
      const data = await response.json();
      const session = { owner: data.owner, token: data.token, expires_at: data.expires_at };
      saveSession(session);
      const destination = await resolvePostLoginPath(session);
      window.location.href = destination;
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }, [t]);

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
      const containerIds = ['google-btn', 'google-btn-register'];
      containerIds.forEach((id) => {
        const container = document.getElementById(id);
        if (!container || container.hasChildNodes()) return;
        if (!window._gsiInitialized) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => googleLogin(response.credential),
          });
          window._gsiInitialized = true;
        }
        window.google.accounts.id.renderButton(container, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'continue_with',
        });
      });
    };
    setTimeout(tryRender, 200);
  }, [mode, googleLogin]);

  const resendVerification = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/owners/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const msg = parseErrorDetail(error.detail);
        throw new Error(msg || t('login.errors.resendFailed'));
      }
      setStatus(t('login.success.codeSent'));
      setStatusType('success');
    } catch (error) {
      setStatus(error.message);
      setStatusType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitForgotPassword = async () => {
    if (!resetEmail.trim()) {
      setStatus(t('login.errors.enterEmail'));
      return;
    }
    setIsSubmitting(true);
    setStatus('');
    try {
      const response = await fetch(`${API_URL}/owners/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const msg = parseErrorDetail(error.detail);
        throw new Error(msg || t('login.errors.invalidCredentials'));
      }
      setResetState('reset_code');
      setStatus(t('login.success.codeSent'));
      setStatusType('success');
    } catch (error) {
      setStatus(error.message);
      setStatusType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitResetCode = async () => {
    if (!resetCode.trim() || resetCode.length !== 6) {
      setStatus(t('login.errors.enterCode'));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/owners/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(parseErrorDetail(err.detail) || t('login.errors.invalidCode'));
      }
      setResetState('reset_password');
      setStatus('');
    } catch (error) {
      setStatus(error.message || t('login.errors.invalidCode'));
      setStatusType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitResetPassword = async () => {
    const pw = form.password;
    if (pw.length < 6) {
      setStatus(t('login.errors.passwordTooShort'));
      return;
    }
    setIsSubmitting(true);
    setStatus('');
    try {
      const response = await fetch(`${API_URL}/owners/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, code: resetCode, new_password: pw }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const msg = typeof error.detail === 'string' ? error.detail : JSON.stringify(error.detail);
        throw new Error(msg || t('login.resetPassword'));
      }
      setStatus(t('login.success.passwordReset'));
      setStatusType('success');
      setResetState(null);
      setMode('login');
      setForm(formDefaults);
      setResetCode('');
    } catch (error) {
      setStatus(error.message);
      setStatusType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl border border-hairline-border focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none";
  const labelClasses = "font-label-md text-label-md text-on-surface-variant ml-1";

  return (
    <div className="min-h-screen bg-surface-container-low flex flex-col items-center justify-center p-4 md:p-8 font-body-md overflow-x-hidden selection:bg-primary-fixed selection:text-on-primary-fixed">
      <style>{`
        .bg-pattern {
          background-image: radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0);
          background-size: 32px 32px;
        }
      `}</style>

      {/* Background Decorations */}
      <div className="fixed bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-surface-blue to-transparent -z-10 opacity-30" />
      <div className="fixed top-20 right-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[100px] -z-10" />
      <div className="fixed bottom-10 left-[-5%] w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[80px] -z-10" />
      <InteractiveDots color="rgba(0, 94, 164, 0.4)" count={350} />

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 w-full p-gutter flex justify-between items-center z-50">
        <a href={ROUTES.home} className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors no-underline cursor-pointer">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span className="font-label-md text-label-md">{t('common.backToHome')}</span>
        </a>
      </nav>

      {mode === 'register' && registeredEmail ? (
        /* ── Verification Screen ── */
        <main className="w-full max-w-[400px] flex flex-col items-center animate-fade-in">
          <div className="w-full bg-white border border-hairline-border rounded-3xl p-lg flex flex-col items-center shadow-xl text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-lg">
              <span className="material-symbols-outlined text-primary text-[36px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                mail
              </span>
            </div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface mb-sm">{t('login.verifyEmail')}</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mb-md">
              {t('login.verifySent', { email: registeredEmail })}
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
              {t('login.verifyClickLink')}
            </p>
            <div className="flex flex-col gap-sm w-full">
              <a
                className="w-full text-center bg-primary text-on-primary py-sm rounded-xl font-label-md text-label-md hover:opacity-90 transition-all no-underline"
                href={ROUTES.login}
              >
                {t('login.verifyGoLogin')}
              </a>
              <button
                className="w-full border border-outline-variant py-sm rounded-xl font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-all cursor-pointer"
                onClick={resendVerification}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? t('login.sending') : t('login.verifyResend')}
              </button>
            </div>
            {status ? (
              <div className={`text-sm mt-md p-2 rounded-lg animate-fade-in ${statusType === 'error' ? 'text-error bg-error/10' : 'bg-success-container/30 border border-success/20 text-on-surface font-medium'}`}>{status}</div>
            ) : null}
          </div>
        </main>
      ) : resetState ? (
        /* ── Reset Flow ── */
        <div className="w-full max-w-md animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl border border-hairline-border p-lg">
            {resetState === 'forgot' && (
              <>
                <div className="mb-lg">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">{t('login.resetTitle')}</h2>
                  <p className="font-body-md text-on-surface-variant">{t('login.resetDesc')}</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); submitForgotPassword(); }} className="space-y-sm">
                  <div className="space-y-base">
                    <label className={labelClasses} htmlFor="reset-email">{t('login.email')}</label>
                    <input
                      className={inputClasses}
                      id="reset-email"
                      placeholder={t('login.emailPlaceholder')}
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                  {status ? (
                    <div className={`font-body-md text-sm p-2 rounded-lg animate-fade-in ${statusType === 'error' ? 'bg-error/10 border border-error/30 text-error' : 'bg-success-container/30 border border-success/20 text-on-surface'}`}>{status}</div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-4 px-lg rounded-xl font-label-md text-label-md shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <><span className="material-symbols-outlined animate-spin">progress_activity</span> {t('login.sending')}</>
                    ) : (
                      <>{t('login.sendCode')}</>
                    )}
                  </button>
                </form>
                <div className="mt-md text-center">
                  <button onClick={() => { setResetState(null); setStatus(''); }} className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-0 text-body-md">
                    {t('login.signIn')}
                  </button>
                </div>
              </>
            )}

            {resetState === 'reset_code' && (
              <>
                <div className="mb-lg">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">{t('login.codeTitle')}</h2>
                  <p className="font-body-md text-on-surface-variant">{t('login.codeDesc')}</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); submitResetCode(); }} className="space-y-sm">
                  <div className="space-y-base">
                    <label className={labelClasses} htmlFor="reset-code">{t('login.codeLabel')}</label>
                    <input
                      className={inputClasses}
                      id="reset-code"
                      placeholder={t('login.codePlaceholder')}
                      type="text"
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={isSubmitting}
                    />
                  </div>
                  {status ? (
                    <div className={`font-body-md text-sm p-2 rounded-lg animate-fade-in ${statusType === 'error' ? 'bg-error/10 border border-error/30 text-error' : 'bg-success-container/30 border border-success/20 text-on-surface'}`}>{status}</div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isSubmitting || resetCode.length !== 6}
                    className="w-full bg-primary text-white py-4 px-lg rounded-xl font-label-md text-label-md shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {t('login.verifyCode')}
                  </button>
                </form>
                <div className="mt-md text-center">
                  <button onClick={() => { setResetState('forgot'); setStatus(''); }} className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-0 text-body-md">
                    {t('common.back')}
                  </button>
                </div>
              </>
            )}

            {resetState === 'reset_password' && (
              <>
                <div className="mb-lg">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">{t('login.newPassword')}</h2>
                  <p className="font-body-md text-on-surface-variant">{t('login.newPasswordDesc')}</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); submitResetPassword(); }} className="space-y-sm">
                  <div className="space-y-base">
                    <label className={labelClasses} htmlFor="new-password">{t('login.newPassword')}</label>
                    <div className="relative">
                      <input
                        className={inputClasses + " pr-10"}
                        id="new-password"
                        placeholder="••••••••"
                        type={showPassword ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors cursor-pointer bg-transparent border-0"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-base">
                    <label className={labelClasses} htmlFor="confirm-new-password">{t('login.confirmPassword')}</label>
                    <div className="relative">
                      <input
                        className={inputClasses + " pr-10"}
                        id="confirm-new-password"
                        placeholder="••••••••"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={form.confirm_password}
                        onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors cursor-pointer bg-transparent border-0"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {showConfirmPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {status ? (
                    <div className={`font-body-md text-sm p-2 rounded-lg animate-fade-in ${statusType === 'error' ? 'bg-error/10 border border-error/30 text-error' : 'bg-success-container/30 border border-success/20 text-on-surface'}`}>{status}</div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-4 px-lg rounded-xl font-label-md text-label-md shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {isSubmitting ? (
                      <><span className="material-symbols-outlined animate-spin">progress_activity</span> {t('login.resetting')}</>
                    ) : (
                      <>{t('login.resetButton')}</>
                    )}
                  </button>
                </form>
                <div className="mt-md text-center">
                  <button onClick={() => { setResetState(null); setMode('login'); setStatus(''); setResetCode(''); }} className="text-primary font-bold hover:underline cursor-pointer bg-transparent border-0 text-body-md">
                    {t('login.signIn')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Auth Card (Overlay slides across forms) ── */
        <div className="relative w-full max-w-5xl animate-fade-in">
          <div className="relative overflow-hidden rounded-3xl shadow-xl min-h-[650px] bg-white">
            {/* Background layer: both forms rendered side by side */}
            <div className="flex w-full min-h-[650px]">
              {/* Login Form (left half) */}
              <div className="w-1/2 flex items-center justify-center p-lg">
                <div className="w-full max-w-sm">
                  <div className="space-y-2 mb-8">
                    <h2 className="font-headline-md text-headline-md text-on-surface">{t('login.loginTitle')}</h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">{t('login.loginSubtext')}</p>
                  </div>
                  <form onSubmit={submitAuth} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className={labelClasses} htmlFor="email">{t('login.email')}</label>
                        <input
                          className={inputClasses}
                          id="email"
                          placeholder={t('login.emailPlaceholder')}
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1">
                          <label className={labelClasses} htmlFor="login-password">{t('login.password')}</label>
                          <span
                            className="font-label-sm text-label-sm text-primary hover:underline transition-all cursor-pointer"
                            onClick={() => { setResetState('forgot'); setResetEmail(form.email); }}
                          >
                            {t('login.forgotPassword')}
                          </span>
                        </div>
                        <input
                          className={inputClasses}
                          id="login-password"
                          placeholder="••••••••"
                          type="password"
                          value={form.password}
                          onChange={(e) => setForm({ ...form, password: e.target.value })}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-1">
                      <input className="w-4 h-4 text-primary border-hairline-border rounded focus:ring-primary" id="remember" type="checkbox" />
                      <label className="font-label-sm text-label-sm text-on-surface-variant cursor-pointer select-none" htmlFor="remember">{t('login.rememberMe')}</label>
                    </div>
                    {status ? (
                      <div className={`font-body-md text-sm p-2 rounded-lg animate-fade-in ${statusType === 'error' ? 'bg-error/10 border border-error/30 text-error' : 'bg-success-container/30 border border-success/20 text-on-surface'}`}>{status}</div>
                    ) : null}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-primary text-white font-label-md text-label-md rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {isSubmitting ? (
                        <><span className="material-symbols-outlined animate-spin">progress_activity</span> {t('login.loggingIn')}</>
                      ) : (
                        <>{t('login.loginButton')}</>
                      )}
                    </button>
                  </form>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-hairline-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-on-surface-variant font-label-sm">{t('login.continueWith')}</span>
                    </div>
                  </div>
                  {GOOGLE_CLIENT_ID ? (
                    <div id="google-btn" className="w-full flex justify-center" />
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-white border border-outline-variant text-on-surface-variant py-3 px-lg rounded-xl font-label-md text-label-md opacity-60 flex justify-center items-center gap-xs cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">google</span> {t('login.googleUnavailable')}
                    </button>
                  )}
                </div>
              </div>

              {/* Register Form (right half, hidden behind overlay in login mode) */}
              <div className="w-1/2 flex items-center justify-center p-lg">
                <div className="w-full max-w-sm">
                  <div className="space-y-2 mb-8">
                    <h2 className="font-headline-md text-headline-md text-on-surface">{t('login.registerTitle')}</h2>
                    <p className="font-body-lg text-body-lg text-on-surface-variant">{t('login.registerSubtext')}</p>
                  </div>
                  <form onSubmit={submitAuth} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className={labelClasses} htmlFor="reg-name">{t('login.fullName')}</label>
                        <input
                          className={inputClasses}
                          id="reg-name"
                          placeholder={t('login.fullNamePlaceholder')}
                          type="text"
                          value={form.full_name}
                          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClasses} htmlFor="reg-email">{t('login.email')}</label>
                        <input
                          className={inputClasses}
                          id="reg-email"
                          placeholder={t('login.emailPlaceholder')}
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClasses} htmlFor="reg-password">{t('login.password')}</label>
                        <div className="relative">
                          <input
                            className={inputClasses + " pr-10"}
                            id="reg-password"
                            placeholder="••••••••"
                            type={showPassword ? 'text' : 'password'}
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors cursor-pointer bg-transparent border-0"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClasses} htmlFor="reg-confirm-password">{t('login.confirmPassword')}</label>
                        <div className="relative">
                          <input
                            className={inputClasses + " pr-10"}
                            id="reg-confirm-password"
                            placeholder="••••••••"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={form.confirm_password}
                            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors cursor-pointer bg-transparent border-0"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              {showConfirmPassword ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 px-1">
                      <input
                        className="mt-[2px] h-4 w-4 rounded border-hairline-border text-primary focus:ring-primary"
                        id="reg-terms"
                        type="checkbox"
                        checked={form.terms}
                        onChange={(e) => setForm({ ...form, terms: e.target.checked })}
                        disabled={isSubmitting}
                      />
                      <label className="text-[11px] text-on-surface-variant select-none cursor-pointer" htmlFor="reg-terms">
                        {t('login.acceptTerms')}
                      </label>
                    </div>
                    {status ? (
                      <div className={`font-body-md text-sm p-2 rounded-lg animate-fade-in ${statusType === 'error' ? 'bg-error/10 border border-error/30 text-error' : 'bg-success-container/30 border border-success/20 text-on-surface'}`}>{status}</div>
                    ) : null}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-primary text-white font-label-md text-label-md rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {isSubmitting ? (
                        <><span className="material-symbols-outlined animate-spin">progress_activity</span> {t('login.registering')}</>
                      ) : (
                        <>{t('login.registerButton')}</>
                      )}
                    </button>
                  </form>
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-hairline-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-on-surface-variant font-label-sm">{t('login.continueWith')}</span>
                    </div>
                  </div>
                  {GOOGLE_CLIENT_ID ? (
                    <div id="google-btn-register" className="w-full flex justify-center" />
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-white border border-outline-variant text-on-surface-variant py-3 px-lg rounded-xl font-label-md text-label-md opacity-60 flex justify-center items-center gap-xs cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-[18px]">google</span> {t('login.googleUnavailable')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Overlay panel - slides across the card on top of the forms */}
            <div
              className="absolute top-0 left-0 w-1/2 h-full transition-transform duration-700 ease-in-out bg-[#002d58] overflow-hidden"
              style={{ transform: mode === 'login' ? 'translateX(100%)' : 'translateX(0)' }}
            >
              <div className="absolute inset-0 bg-pattern opacity-40" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
              <div className="relative z-10 h-full flex flex-col items-center justify-center gap-6 px-lg text-center">
                <div className="transition-opacity duration-500 ease-in-out">
                  <SahelLogo size={64} showText={false} />
                </div>
                <div className="transition-opacity duration-500 ease-in-out">
                  <h2 className="font-display-lg text-display-lg text-white leading-tight italic">
                    {mode === 'login' ? t('login.brandWelcome') : t('login.brandJoin')}
                  </h2>
                  <p className="font-body-lg text-body-lg text-white/70 mt-2">
                    {mode === 'login' ? t('login.brandSubtext') : t('login.brandJoinSubtext')}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2 transition-opacity duration-500 ease-in-out">
                  <p className="font-label-md text-label-md text-white/60">
                    {mode === 'login' ? t('login.newHere') : t('login.haveAccount')}
                  </p>
                  <button
                    onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl font-headline-sm text-lg transition-all active:scale-95 cursor-pointer"
                  >
                    {mode === 'login' ? t('login.createAccount') : t('login.signIn')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Selector + Footer */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <LanguageSwitcher />
        <p className="font-label-sm text-label-sm text-outline">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </div>
  );
}
