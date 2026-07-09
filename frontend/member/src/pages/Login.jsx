import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

// Вход учеников и родителей: логин-код + пароль.
// Google-входа НЕТ. «Забыли пароль» НЕТ — код перевыдаёт администратор центра.
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(code.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.status === 401) setError('Неверный логин-код или пароль');
      else if (err.status === 429) setError('Слишком много попыток — попробуйте позже');
      else if (err.status === 422) setError('Введите логин-код и пароль');
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-200">
      {/* Левая панель — бренд */}
      <div className="hidden lg:flex flex-col justify-between bg-sidebar text-neutral-content p-12">
        <img src="/logo-white.svg" alt="LevelUp Academy" className="h-10 w-auto self-start" />
        <div>
          <h2 className="text-3xl font-bold leading-tight">Кабинет ученика</h2>
          <p className="opacity-60 mt-2 max-w-sm">
            Тесты, домашние задания, коины и рейтинг — всё в личном кабинете ученика и родителя.
          </p>
        </div>
        <div className="text-xs opacity-40">LevelUp Academy · Ученик / Родитель</div>
      </div>

      {/* Правая панель — форма */}
      <div className="grid place-items-center p-6">
        <div className="w-full max-w-sm">
          <img src="/logo-primary.svg" alt="LevelUp Academy" className="h-8 w-auto mb-5 lg:hidden" />
          <h1 className="text-2xl font-bold">Вход</h1>
          <p className="text-sm opacity-60 mb-6">Ученик / Родитель</p>
          {error && (
            <div role="alert" className="alert alert-error text-sm py-2 mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-3">
            <label className="form-control w-full">
              <span className="label-text mb-1">Логин-код</span>
              <input
                type="text"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                placeholder="напр. demostud"
                className="input input-bordered w-full tracking-widest"
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text mb-1">Пароль</span>
              <input
                type="password"
                required
                inputMode="numeric"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6-значный код"
                className="input input-bordered w-full"
              />
            </label>
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-sm" /> : 'Войти'}
            </button>
          </form>

          <p className="text-xs opacity-50 text-center pt-4">
            Логин-код и пароль выдаёт администратор вашего учебного центра.
          </p>
        </div>
      </div>
    </div>
  );
}
