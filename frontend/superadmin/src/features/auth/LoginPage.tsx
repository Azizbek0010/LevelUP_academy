import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Eye, EyeOff, BarChart3, Bell, Building2, Users } from 'lucide-react';
import { authApi } from '../../shared/api/endpoints/auth';
import { ApiError } from '../../shared/api/http';
import { useAuthStore } from '../../shared/stores/auth';

const FEATURES = [
  { icon: Building2, label: 'Управление филиалами', desc: 'Вся сеть учебных центров в одном месте' },
  { icon: BarChart3, label: 'Финансовая аналитика', desc: 'Доходы, долги, выручка в реальном времени' },
  { icon: Users, label: 'Команда сотрудников', desc: 'Администраторы, методисты, менторы' },
  { icon: Bell, label: 'Telegram-уведомления', desc: 'Анонсы и напоминания для всей команды' },
];

export default function LoginPage(): React.ReactElement {
  const status = useAuthStore((s) => s.status);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'authenticated') {
    const state = location.state as { from?: string } | null;
    return <Navigate to={state?.from ?? '/superadmin'} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { accessToken, user } = await authApi.login(email, password);
      setAuth(accessToken, user);
      const state = location.state as { from?: string } | null;
      navigate(state?.from ?? '/superadmin', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.payload.message : 'Не удалось войти. Проверьте данные.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[460px] panel-dark flex-col p-10 relative overflow-hidden shrink-0">
        {/* decorative orbs */}
        <div
          className="absolute -top-28 -left-28 size-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(85% 0.22 130 / 0.18), transparent 65%)' }}
        />
        <div
          className="absolute bottom-0 right-0 size-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(85% 0.22 130 / 0.08), transparent 70%)' }}
        />

        {/* brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary text-primary-content grid place-items-center font-bold text-lg shadow-lg shadow-primary/25">
            L
          </div>
          <div>
            <div className="text-white font-semibold text-[15px] leading-tight">LevelUp Academy</div>
            <div className="text-white/40 text-[11px]">Super Admin Panel</div>
          </div>
        </div>

        {/* tagline */}
        <div className="relative z-10 mt-auto mb-10">
          <div className="inline-flex items-center gap-2 h-6 px-3 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-semibold text-primary mb-4 uppercase tracking-wider">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Платформа для учебных центров
          </div>
          <h2 className="text-[2rem] font-bold text-white leading-tight">
            Управляйте вашей<br />
            <span className="text-primary">учебной сетью</span>
          </h2>
          <p className="text-white/50 text-sm mt-3 leading-relaxed max-w-xs">
            Единая CRM-система для учебных центров Узбекистана. Студенты, финансы, команда — всё в одном окне.
          </p>
        </div>

        {/* feature list */}
        <div className="relative z-10 space-y-4">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div
                className="size-8 rounded-lg grid place-items-center shrink-0 mt-0.5"
                style={{ background: 'color-mix(in oklch, oklch(85% 0.22 130) 15%, transparent)' }}
              >
                <Icon className="size-4 text-primary" />
              </div>
              <div>
                <div className="text-white/90 text-[13px] font-medium">{label}</div>
                <div className="text-white/40 text-[11px] mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="relative z-10 mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-white/25 text-[11px]">v1.0 · MVP Phase</span>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            <span className="text-white/40 text-[11px]">Server online</span>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 bg-base-200 flex items-center justify-center p-6">
        <div className="w-full max-w-[360px]">
          {/* mobile logo */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="size-12 rounded-2xl bg-primary text-primary-content grid place-items-center font-bold text-xl mb-3">
              L
            </div>
            <h1 className="text-2xl font-semibold">LevelUp Academy</h1>
            <p className="text-base-content/60 text-sm mt-1">Панель Super Admin</p>
          </div>

          {/* desktop heading */}
          <div className="hidden lg:block mb-7">
            <h2 className="text-2xl font-bold tracking-tight">Добро пожаловать</h2>
            <p className="text-base-content/60 text-sm mt-1">Войдите в панель управления</p>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-300">
            <form className="card-body gap-0 space-y-4" onSubmit={onSubmit}>
              <label className="form-control">
                <span className="label label-text text-[13px] font-medium">Email</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered wow-input"
                  placeholder="you@levelup.uz"
                  autoFocus
                />
              </label>

              <label className="form-control">
                <span className="label label-text text-[13px] font-medium">Пароль</span>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input input-bordered wow-input w-full pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </label>

              {error && (
                <div role="alert" className="alert alert-error text-sm py-2.5">
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full mt-1 wow-shine"
                disabled={loading}
              >
                {loading && <span className="loading loading-spinner loading-xs" />}
                Войти в систему
              </button>
            </form>
          </div>

          <p className="text-center text-[11px] text-base-content/30 mt-6">
            LevelUp Academy · Все права защищены
          </p>
        </div>
      </div>
    </div>
  );
}
