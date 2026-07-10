import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { authApi } from '../../shared/api/endpoints/auth';
import { ApiError } from '../../shared/api/http';
import { useAuthStore } from '../../shared/stores/auth';

export default function LoginPage(): React.ReactElement {
  const status = useAuthStore((s) => s.status);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      if (err instanceof ApiError) {
        setError(err.payload.message);
      } else {
        setError('Не удалось войти');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-primary text-primary-content mb-4 font-bold text-2xl">
            L
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">LevelUp Academy</h1>
          <p className="text-base-content/60 text-sm mt-1">Панель Super Admin</p>
        </div>

        <div className="card bg-base-100 shadow-sm border border-base-300">
          <form className="card-body space-y-3" onSubmit={onSubmit}>
            <label className="form-control">
              <span className="label label-text">Email</span>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered"
                placeholder="you@example.com"
              />
            </label>

            <label className="form-control">
              <span className="label label-text">Пароль</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered"
                placeholder="••••••••"
              />
            </label>

            {error && (
              <div role="alert" className="alert alert-error text-sm py-2">
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
              {loading && <span className="loading loading-spinner loading-xs" />}
              Войти
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
