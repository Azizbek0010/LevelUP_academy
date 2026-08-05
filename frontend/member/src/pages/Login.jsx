import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';

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

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

// Иконка логин-кода (карточка-бейдж) — визуальный «ключ доступа» ученика.
function CodeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 15h4M15 15h2M7 11h10" />
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
  const { login, adoptSession } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  /* ── Вход через Telegram ────────────────────────────────────────────────
     Логин-код из 8 символов и пароль из 6 цифр ребёнок забывает; открытый
     Telegram у него в телефоне всегда. Работает ТОЛЬКО у тех, кто уже привязал
     бота в кабинете: бот ищет чат в telegram_accounts и, не найдя, отвечает
     отказом. То есть это не обход пароля, а второй ключ к уже доказанному
     владению аккаунтом.

     Опрос, а не редирект обратно: deep-link уводит в приложение Telegram, и
     вернуть человека на вкладку автоматически неоткуда — вкладка ждёт сама. */
  const [tgBusy, setTgBusy] = useState(false);
  const [tgWaiting, setTgWaiting] = useState(false);
  const [tgAvailable, setTgAvailable] = useState(true);
  const pollTimer = useRef(null);

  // Оставленный таймер продолжил бы опрашивать сервер после ухода со страницы.
  useEffect(() => () => clearInterval(pollTimer.current), []);

  const onTelegramLogin = async () => {
    setError('');
    setTgBusy(true);
    try {
      const { data } = await api.telegramLoginStart();
      window.open(data.deepLink, '_blank', 'noopener,noreferrer');
      setTgWaiting(true);

      clearInterval(pollTimer.current);
      const startedAt = Date.now();

      pollTimer.current = setInterval(async () => {
        // Ждём ровно столько, сколько живёт nonce на сервере (expiresIn) —
        // дольше опрашивать бессмысленно, ключа уже нет.
        if (Date.now() - startedAt > data.expiresIn * 1000) {
          clearInterval(pollTimer.current);
          setTgWaiting(false);
          setError('Telegram orqali kirish muddati tugadi — qaytadan urinib ko‘ring');
          return;
        }

        try {
          const res = await api.telegramLoginPoll(data.nonce);
          if (res.data.status === 'approved') {
            clearInterval(pollTimer.current);
            setTgWaiting(false);
            adoptSession(res.data);
            navigate('/', { replace: true });
          } else if (res.data.status === 'unknown') {
            clearInterval(pollTimer.current);
            setTgWaiting(false);
            setError('Telegram orqali kirish muddati tugadi — qaytadan urinib ko‘ring');
          }
        } catch {
          // Разовый сбой сети не должен обрывать ожидание — следующий тик повторит.
        }
      }, 2000);
    } catch (err) {
      // 503 — на сервере не задан бот. Кнопку прячем: она гарантированно не сработает.
      if (err?.status === 503) setTgAvailable(false);
      else setError('Telegram orqali kirib bo‘lmadi — keyinroq urinib ko‘ring');
    } finally {
      setTgBusy(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Пробелы по краям (автозаполнение, мобильная клавиатура, вставка) не должны
    // превращать верный код/пароль в «неверный».
    const pass = password.trim();
    if (!code.trim() || !pass) {
      setError('Введите логин-код и пароль');
      return;
    }
    setBusy(true);
    try {
      await login(code.trim(), pass);
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
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-limebrand/20 blur-3xl animate-float" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-limebrand/10 blur-3xl animate-float" style={{ animationDelay: '1.2s' }} />
        <img src="/logo-white.svg" alt="LevelUp Academy" className="relative h-10 w-auto self-start animate-slide-up" />
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight animate-slide-up">Кабинет ученика</h2>
          <p className="opacity-60 mt-2 max-w-sm animate-slide-up stagger-1">
            Тесты, домашние задания, коины и рейтинг — всё в личном кабинете ученика и родителя.
          </p>
          <ul className="mt-8 space-y-3">
            {FEATURES.map((f, i) => (
              <li key={f} className={`flex items-center gap-3 text-sm opacity-80 animate-slide-up stagger-${i + 2}`}>
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
          <div className="rounded-2xl border border-base-300 bg-base-100 p-8 shadow-[0_1px_2px_rgba(29,36,23,0.04),0_18px_50px_-12px_rgba(29,36,23,0.14)] transition-shadow duration-300 hover:shadow-[0_1px_2px_rgba(29,36,23,0.05),0_24px_60px_-12px_rgba(29,36,23,0.18)] sm:p-10 animate-slide-up">
            <div className="h-1 w-10 rounded-full bg-limebrand mb-4 animate-slide-up" />
            <h1 className="text-2xl font-bold tracking-tight animate-slide-up">Вход</h1>
            <p className="text-sm opacity-60 mb-6 animate-slide-up stagger-1">Ученик / Родитель</p>
            {error && (
              <div role="alert" className="alert alert-error text-sm py-2 mb-4 animate-fade-in">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <label className="form-control w-full animate-slide-up stagger-2">
                <span className="label-text mb-1 font-medium">Логин-код</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 grid w-11 place-items-center text-base-content/40 pointer-events-none">
                    <CodeIcon />
                  </span>
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
                    className="input input-bordered w-full pl-11 tracking-widest transition-shadow focus:shadow-[0_0_0_4px_rgba(64,131,59,0.22)]"
                  />
                </div>
              </label>
              <label className="form-control w-full animate-slide-up stagger-3">
                <span className="label-text mb-1 font-medium">Пароль</span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 grid w-11 place-items-center text-base-content/40 pointer-events-none">
                    <LockIcon />
                  </span>
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    inputMode="numeric"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6-значный код"
                    className="input input-bordered w-full pl-11 pr-11 transition-shadow focus:shadow-[0_0_0_4px_rgba(64,131,59,0.22)]"
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
              <button
                type="submit"
                className="btn btn-primary w-full transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 animate-slide-up stagger-4"
                disabled={busy}
              >
                {busy ? <span className="loading loading-spinner loading-sm" /> : 'Войти'}
              </button>
            </form>

            {tgAvailable && (
              <>
                <div className="divider text-xs opacity-40 my-4">или</div>
                <button
                  type="button"
                  onClick={onTelegramLogin}
                  disabled={tgBusy || tgWaiting}
                  className="btn w-full gap-2"
                  style={{ background: '#E4F1FF', color: '#1668B8', border: 'none' }}
                >
                  {tgWaiting ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Telegram’da tasdiqlang…
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M21.9 4.3 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7 8.5-7.7c.4-.3-.1-.5-.6-.2L6.9 13 2.4 11.6c-1-.3-1-1 .2-1.4l18-7c.8-.3 1.5.2 1.3 1.1z" />
                      </svg>
                      Telegram orqali kirish
                    </>
                  )}
                </button>
                {tgWaiting && (
                  <p className="text-xs opacity-60 text-center pt-2 leading-snug">
                    Telegram ochildi — botdagi «Start» tugmasini bosing.
                    Bu oyna o‘zi ochiladi.
                  </p>
                )}
              </>
            )}

            <p className="text-xs opacity-50 text-center pt-4 animate-slide-up stagger-5">
              Логин-код и пароль выдаёт администратор вашего учебного центра.
              {tgAvailable && ' Telegram orqali kirish faqat kabinetda botni ulaganlarda ishlaydi.'}
            </p>
          </div>
          <p className="text-center text-xs opacity-40 mt-6">© LevelUp Academy</p>
        </div>
      </div>
    </div>
  );
}
