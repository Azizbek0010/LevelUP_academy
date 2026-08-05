import { useState, useEffect } from 'react';
import {
  Mail, Building2, CalendarDays, ShieldCheck, KeyRound, Check, AlertCircle, LogOut,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import Avatar from '../../components/Avatar.jsx';
import MyDiscipline from '../../components/MyDiscipline.jsx';
import { useMe } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';

/**
 * Профиль методиста. У методиста нет групп/грейда/навыков ментора — карточка
 * короче: личные данные (PATCH /api/users/me принимает firstName/lastName/
 * email — bio/skills сервис игнорирует не у ментора), безопасность, и своя
 * дисциплина (K-DISC-FRONT: раньше у методиста вообще не было /profile —
 * маршрут молча редиректил на дашборд).
 */
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon size={16} className="text-base-content/35 shrink-0" />
      <span className="text-sm text-base-content/55 shrink-0">{label}</span>
      <span className="text-sm font-semibold ml-auto text-right truncate">{value || '—'}</span>
    </div>
  );
}

export default function MethodistProfile() {
  const { token, user, logout, patchUser } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useMe();
  const me = data?.data ?? null;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!me) return;
    setFirstName(me.firstName ?? '');
    setLastName(me.lastName ?? '');
    setEmail(me.email ?? '');
  }, [me]);

  const dirty = me && (
    firstName !== (me.firstName ?? '')
    || lastName !== (me.lastName ?? '')
    || email !== (me.email ?? '')
  );

  const validate = () => {
    if (!firstName.trim()) return 'Введите имя';
    if (!lastName.trim()) return 'Введите фамилию';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Некорректный email';
    return '';
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) { setError(problem); return; }

    setSaving(true);
    setError('');
    try {
      const patch = { firstName: firstName.trim(), lastName: lastName.trim(), email: email.trim() };
      await api.updateMe(token, patch);
      qc.invalidateQueries({ queryKey: ['me'] });
      patchUser(patch);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Не удалось сохранить');
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    if (!me) return;
    setFirstName(me.firstName ?? '');
    setLastName(me.lastName ?? '');
    setEmail(me.email ?? '');
    setError('');
  };

  const onLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const fullName = `${me?.firstName ?? user?.firstName ?? ''} ${me?.lastName ?? user?.lastName ?? ''}`.trim();
  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  return (
    <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-5 p-4 sm:p-6 lg:p-8 overflow-y-auto lg:overflow-hidden">
      {/* ═════ Карточка личности ═════ */}
      <aside className="w-full lg:w-[380px] shrink-0 lg:h-full lg:overflow-y-auto">
        <div className="space-y-5">
          <section className="card bg-base-100 overflow-hidden">
            <div className="h-20 bg-gradient-to-br from-primary/15 via-primary/8 to-transparent" />
            <div className="px-5 pb-5 -mt-10">
              <div className="ring-4 ring-base-100 rounded-full w-fit">
                <Avatar name={fullName || '?'} size={72} />
              </div>
              <h2 className="text-lg font-extrabold mt-3 truncate">
                {isLoading
                  ? <span className="skeleton inline-block h-5 w-36 align-middle" />
                  : fullName}
              </h2>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="badge badge-primary badge-sm gap-1">
                  <ShieldCheck size={11} /> Методист
                </span>
              </div>
            </div>

            <div className="divide-y divide-base-200 border-t border-base-200">
              <InfoRow icon={Mail} label="Email" value={me?.email ?? user?.email} />
              <InfoRow icon={Building2} label="Филиал" value={me?.branchName} />
              <InfoRow icon={CalendarDays} label="Зарегистрирован" value={formatDate(me?.createdAt)} />
            </div>
          </section>
        </div>
      </aside>

      {/* ═════ Настройки ═════ */}
      <div className="flex-1 min-w-0 lg:h-full lg:overflow-y-auto lg:pr-1">
        <div className="space-y-5">
          <section className="card bg-base-100">
            <header className="px-5 py-4 border-b border-base-200">
              <h2 className="font-bold">Личные данные</h2>
              <p className="text-xs text-base-content/45 mt-0.5">
                Эти данные видит администратор организации.
              </p>
            </header>

            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control">
                <span className="text-xs font-semibold text-base-content/55 mb-1.5">Имя</span>
                <input
                  className="input input-bordered"
                  value={firstName}
                  maxLength={80}
                  onChange={(e) => { setFirstName(e.target.value); setError(''); }}
                  disabled={isLoading}
                />
              </label>
              <label className="form-control">
                <span className="text-xs font-semibold text-base-content/55 mb-1.5">Фамилия</span>
                <input
                  className="input input-bordered"
                  value={lastName}
                  maxLength={80}
                  onChange={(e) => { setLastName(e.target.value); setError(''); }}
                  disabled={isLoading}
                />
              </label>
              <label className="form-control sm:col-span-2">
                <span className="text-xs font-semibold text-base-content/55 mb-1.5">Email</span>
                <input
                  type="email"
                  className="input input-bordered"
                  value={email}
                  maxLength={160}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  disabled={isLoading}
                />
                <span className="text-[11px] text-base-content/45 mt-1.5">
                  Вы входите в систему с этим email, код восстановления пароля также приходит на этот адрес.
                </span>
              </label>
            </div>

            <footer className="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-base-200 bg-base-200/30 rounded-b-2xl min-h-[60px]">
              <span className="text-xs">
                {error ? (
                  <span className="flex items-center gap-1.5 text-error font-medium">
                    <AlertCircle size={14} /> {error}
                  </span>
                ) : saved ? (
                  <span className="flex items-center gap-1.5 text-success font-semibold">
                    <Check size={14} /> Сохранено
                  </span>
                ) : dirty ? (
                  <span className="text-base-content/50">Есть несохранённые изменения</span>
                ) : null}
              </span>

              <span className="flex items-center gap-2 shrink-0">
                {dirty && (
                  <button className="btn btn-ghost btn-sm" onClick={reset} disabled={saving}>
                    Отмена
                  </button>
                )}
                <button
                  className="btn btn-primary btn-sm gap-1.5"
                  onClick={handleSave}
                  disabled={saving || !dirty}
                >
                  {saving ? <span className="loading loading-spinner loading-xs" /> : <Check size={15} />}
                  Сохранить
                </button>
              </span>
            </footer>
          </section>

          <section className="card bg-base-100">
            <header className="px-5 py-4 border-b border-base-200">
              <h2 className="font-bold">Безопасность</h2>
            </header>

            <div className="divide-y divide-base-200">
              <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <KeyRound size={15} className="text-base-content/40" /> Пароль
                  </div>
                  <p className="text-xs text-base-content/50 mt-1 max-w-md">
                    В целях безопасности пароль не изменяется здесь — он
                    восстанавливается через код подтверждения, отправляемый на ваш email.
                  </p>
                </div>
                <button
                  className="btn btn-outline btn-sm shrink-0"
                  onClick={() => navigate('/login?reset=1')}
                >
                  Восстановить пароль
                </button>
              </div>

              <div className="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
                <div className="min-w-0">
                  <div className="text-sm font-semibold flex items-center gap-2">
                    <LogOut size={15} className="text-base-content/40" /> Завершить сеанс
                  </div>
                  <p className="text-xs text-base-content/50 mt-1">
                    Вы выйдете из аккаунта на этом устройстве.
                  </p>
                </div>
                <button className="btn btn-outline btn-error btn-sm shrink-0" onClick={onLogout}>
                  Выйти
                </button>
              </div>
            </div>
          </section>

          {/* K-DISC-FRONT: свои взыскания + устав, только просмотр */}
          <MyDiscipline />
        </div>
      </div>
    </div>
  );
}
