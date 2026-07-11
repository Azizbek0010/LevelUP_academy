import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

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

const FEATURES = [
  'Тесты и домашние задания',
  'Коины, магазин и рейтинг',
  'Успеваемость и посещаемость',
];

// Вход учеников и родителей: логин-код + пароль.
// Google-входа НЕТ. «Забыли пароль» НЕТ — код перевыдаёт администратор центра.
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!code.trim() || !password) {
      setError('Введите логин-код и пароль');
      return;
    }
    setBusy(true);
    try {
      await login(code.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.status === 401) setError('Неверный логин-код или пароль');
      else if (err.status === 429) setError('Слишком много попыток — попробуйте позже');
      else if (err.status === 422) setError('Введите логин-код и пароль');
      else setError(err.message || 'Не удалось войти');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-200">
      {/* Левая панель — бренд */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-sidebar text-neutral-content p-12">
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-limebrand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-limebrand/10 blur-3xl" />
        <img src="/logo-white.svg" alt="LevelUp Academy" className="relative h-10 w-auto self-start" />
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">Кабинет ученика</h2>
          <p className="opacity-60 mt-2 max-w-sm">
            Тесты, домашние задания, коины и рейтинг — всё в личном кабинете ученика и родителя.
          </p>
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
        <div className="relative text-xs opacity-40">LevelUp Academy · Ученик / Родитель</div>
      </div>

      {/* Правая панель — форма */}
      <div className="grid place-items-center p-6">
        <div className="w-full max-w-md">
          <img src="/logo-primary.svg" alt="LevelUp Academy" className="h-8 w-auto mb-6 lg:hidden" />
          <div className="rounded-2xl border border-base-300 bg-base-100 p-8 shadow-[0_1px_2px_rgba(29,36,23,0.04),0_18px_50px_-12px_rgba(29,36,23,0.14)] sm:p-10">
            <h1 className="text-2xl font-bold tracking-tight">Вход</h1>
            <p className="text-sm opacity-60 mb-6">Ученик / Родитель</p>
            {error && (
              <div role="alert" className="alert alert-error text-sm py-2 mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Логин-код</span>
                <input
                  type="text"
                  required
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="username"
                  value={code}
                  onChange={(e) => setCode(e.target.value.trim())}
                  placeholder="напр. demostud"
                  className="input input-bordered w-full tracking-widest"
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Пароль</span>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    inputMode="numeric"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6-значный код"
                    className="input input-bordered w-full pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    tabIndex={-1}
                    aria-label={showPw ? 'Скрыть пароль' : 'Показать пароль'}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center text-base-content/40 hover:text-base-content transition-colors"
                  >
                    <EyeIcon off={showPw} />
                  </button>
                </div>
              </label>
              <button type="submit" className="btn btn-primary w-full" disabled={busy}>
                {busy ? <span className="loading loading-spinner loading-sm" /> : 'Войти'}
              </button>
            </form>

            <p className="text-xs opacity-50 text-center pt-4">
              Логин-код и пароль выдаёт администратор вашего учебного центра.
            </p>
          </div>
          <p className="text-center text-xs opacity-40 mt-6">© LevelUp Academy</p>
        </div>
      </div>
    </div>
  );
}
