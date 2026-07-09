import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.1 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c2.8 0 5.4 1.1 7.3 2.8l5.7-5.7C33.6 6.1 29.1 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 34.9 26.7 36 24 36c-5.3 0-9.7-3.6-11.3-8.4l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.4 36.5 44 30.8 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

function EyeIcon({ off }) {
  return off ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.61" />
      <path d="M14.12 14.12A3 3 0 1 1 9.88 9.88" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// Поле пароля с кнопкой показать/скрыть.
function PasswordField({ value, onChange, placeholder, autoComplete, minLength }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="input input-bordered w-full pr-11"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-base-content/40 hover:text-base-content transition-colors"
      >
        <EyeIcon off={show} />
      </button>
    </div>
  );
}

function LoginForm({ onForgot }) {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Введите email и пароль'); return; }
    setBusy(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.status === 401) setError('Неверный email или пароль');
      else if (err.status === 429) setError('Слишком много попыток — попробуйте позже');
      else if (err.status === 422) setError('Введите email и пароль');
      else setError(err.message || 'Не удалось войти');
    } finally { setBusy(false); }
  };

  const onGoogle = async () => {
    setError('');
    setGoogleBusy(true);
    try {
      await loginWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      if (err.code === 'firebase-not-configured') setError('Google-вход пока не настроен');
      else if (err.status === 403 || err.status === 401) setError('Этот Google-аккаунт не привязан');
      else if (err.code !== 'auth/popup-closed-by-user') setError(err.message || 'Не удалось войти через Google');
    } finally { setGoogleBusy(false); }
  };

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Вход в панель</h1>
      <p className="text-sm opacity-60 mb-6">Super Admin · Администратор · Ментор · Методист</p>
      {error && <div role="alert" className="alert alert-error text-sm py-2 mb-4"><span>{error}</span></div>}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <label className="form-control w-full">
          <span className="label-text mb-1 font-medium">Email</span>
          <input type="email" required autoFocus autoComplete="username"
            value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com" className="input input-bordered w-full" />
        </label>
        <label className="form-control w-full">
          <span className="label-text mb-1 font-medium">Пароль</span>
          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </label>
        <button type="submit" className="btn btn-primary w-full" disabled={busy || googleBusy}>
          {busy ? <span className="loading loading-spinner loading-sm" /> : 'Войти'}
        </button>
      </form>

      <div className="divider text-xs opacity-40">или</div>

      <button type="button" className="btn btn-outline w-full gap-2" onClick={onGoogle} disabled={busy || googleBusy}>
        {googleBusy ? <span className="loading loading-spinner loading-sm" /> : <><GoogleIcon /> Войти через Google</>}
      </button>

      <div className="text-center pt-4">
        <button type="button"
          className="text-sm text-base-content/50 hover:text-base-content transition-colors"
          onClick={onForgot}>
          Забыли пароль?
        </button>
      </div>
    </>
  );
}

function ForgotForm({ onBack }) {
  const [stage, setStage] = useState('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const sendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Укажите email'); return; }
    setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      setStage('confirm');
    } catch (err) { setError(err.message || 'Не удалось отправить код'); } finally { setBusy(false); }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError('');
    if (!otp.trim() || newPassword.length < 8) { setError('Введите код и новый пароль (мин. 8 символов)'); return; }
    setBusy(true);
    try {
      await api.resetPassword({ email: email.trim(), otp: otp.trim(), newPassword });
      setStage('done');
    } catch (err) {
      if (err.status === 400) setError('Неверный или просроченный код');
      else if (err.status === 429) setError('Слишком много попыток — запросите код заново');
      else setError(err.message || 'Не удалось сменить пароль');
    } finally { setBusy(false); }
  };

  return (
    <>
      <button type="button" className="link no-underline text-sm opacity-60 hover:opacity-100 mb-3 transition-opacity" onClick={onBack}>← Назад ко входу</button>
      <h1 className="text-2xl font-bold tracking-tight">Восстановление пароля</h1>
      {error && <div role="alert" className="alert alert-error text-sm py-2 my-4"><span>{error}</span></div>}

      {stage === 'request' && (
        <form onSubmit={sendCode} className="space-y-4 mt-4" noValidate>
          <p className="text-sm opacity-60">Укажите email — пришлём 6-значный код на почту.</p>
          <input type="email" required autoFocus autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="you@gmail.com" className="input input-bordered w-full" />
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? <span className="loading loading-spinner loading-sm" /> : 'Отправить код'}
          </button>
        </form>
      )}

      {stage === 'confirm' && (
        <form onSubmit={reset} className="space-y-4 mt-4" noValidate>
          <p className="text-sm opacity-60">
            Код отправлен на <b>{email}</b> (проверьте почту, в т.ч. «Спам»). Введите код и новый пароль.
          </p>
          <input inputMode="numeric" maxLength={6} required autoFocus autoComplete="one-time-code" value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Код из письма (6 цифр)" className="input input-bordered w-full text-center text-lg tracking-[0.5em]" />
          <PasswordField
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Новый пароль (мин. 8)"
            autoComplete="new-password"
            minLength={8}
          />
          <button className="btn btn-primary w-full" disabled={busy}>
            {busy ? <span className="loading loading-spinner loading-sm" /> : 'Сменить пароль'}
          </button>
          <button type="button" className="link link-primary text-xs" onClick={() => setStage('request')}>
            Отправить код заново
          </button>
        </form>
      )}

      {stage === 'done' && (
        <div className="mt-4 space-y-4">
          <div className="alert alert-success text-sm"><span>Пароль изменён. Войдите с новым паролем.</span></div>
          <button className="btn btn-primary w-full" onClick={onBack}>Ко входу</button>
        </div>
      )}
    </>
  );
}

const FEATURES = [
  'Филиалы, сотрудники и студенты в одном месте',
  'Финансы, платежи и отчёты',
  'Тесты, домашние задания и посещаемость',
];

export default function Login() {
  const [mode, setMode] = useState('login');
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-200">
      {/* Левая панель — бренд */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-sidebar text-neutral-content p-12">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-limebrand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-limebrand/10 blur-3xl" />
        <img src="/logo-white.svg" alt="LevelUp Academy" className="relative h-10 w-auto self-start" />
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">Панель управления</h2>
          <p className="opacity-60 mt-2 max-w-sm">Super Admin, Администратор, Ментор и Методист — управляйте своей организацией из одной панели.</p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm opacity-80">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-limebrand/15 text-limebrand">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative text-xs opacity-40">LevelUp Academy · SaaS</div>
      </div>

      {/* Правая панель — форма */}
      <div className="grid place-items-center p-6">
        <div className="w-full max-w-md">
          <img src="/logo-primary.svg" alt="LevelUp Academy" className="h-8 w-auto mb-6 lg:hidden" />
          <div className="rounded-2xl border border-base-300 bg-base-100 p-8 shadow-[0_1px_2px_rgba(29,36,23,0.04),0_18px_50px_-12px_rgba(29,36,23,0.14)] sm:p-10">
            {mode === 'login'
              ? <LoginForm onForgot={() => setMode('forgot')} />
              : <ForgotForm onBack={() => setMode('login')} />}
          </div>
          <p className="text-center text-xs opacity-40 mt-6">© LevelUp Academy</p>
        </div>
      </div>
    </div>
  );
}
