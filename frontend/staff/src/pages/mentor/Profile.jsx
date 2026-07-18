import { useState, useEffect } from 'react';
import {
  User, Mail, Phone, Building2, CalendarDays, ShieldCheck, KeyRound,
  Check, AlertCircle, LogOut,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import PageHeader from '../../components/PageHeader.jsx';
import { useMe } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import { disconnectSocket } from '../../socket.js';
import { Panel } from './_ui.jsx';

/**
 * Профиль и настройки аккаунта.
 *
 * Редактируется ровно то, что принимает бэкенд (PATCH /api/users/me):
 * имя, фамилия, email. Ничего сверх этого тут нет намеренно — поле, которое
 * некуда сохранить, хуже отсутствующего поля.
 *
 * Пароль в кабинете не меняется: у API нет такого эндпоинта, есть только
 * восстановление через код на почту. Поэтому вместо формы — честная кнопка,
 * ведущая в этот сценарий.
 */

function Field({ icon: Icon, label, children, hint }) {
  return (
    <label className="form-control w-full">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5 flex items-center gap-1.5">
        <Icon size={12} /> {label}
      </span>
      {children}
      {hint && <span className="text-[11px] text-base-content/45 mt-1">{hint}</span>}
    </label>
  );
}

function ReadOnlyRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="w-8 h-8 rounded-lg bg-base-200 text-base-content/50 grid place-items-center shrink-0">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-base-content/45 font-semibold">
          {label}
        </div>
        <div className="text-sm font-medium truncate">{value || '—'}</div>
      </div>
    </div>
  );
}

export default function MentorProfile() {
  const { token, user, logout } = useAuth();
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

  // Форму заполняем, когда приехали данные, а не в начальном useState: на
  // первом рендере `me` ещё null, и поля навсегда остались бы пустыми.
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
    if (!firstName.trim()) return 'Ismni kiriting';
    if (!lastName.trim()) return 'Familiyani kiriting';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Email noto'g'ri";
    return '';
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) { setError(problem); return; }

    setSaving(true);
    setError('');
    try {
      await api.updateMe(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      qc.invalidateQueries({ queryKey: ['me'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message || 'Saqlanmadi');
    } finally {
      setSaving(false);
    }
  };

  const onLogout = async () => {
    disconnectSocket();
    await logout();
    navigate('/login', { replace: true });
  };

  const fullName = `${me?.firstName ?? user?.firstName ?? ''} ${me?.lastName ?? user?.lastName ?? ''}`.trim();
  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

  return (
    <div>
      <PageHeader title="Profil" subtitle="Shaxsiy ma'lumotlar va akkaunt sozlamalari" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start max-w-5xl">
        {/* ── Карточка аккаунта ── */}
        <div className="lg:col-span-1 space-y-5">
          <section className="card bg-base-100">
            <div className="p-5 text-center">
              <span className="w-20 h-20 rounded-2xl bg-primary/15 text-primary grid place-items-center text-2xl font-extrabold mx-auto">
                {(fullName[0] || '?').toUpperCase()}
              </span>
              <h2 className="text-lg font-bold mt-3 truncate">
                {isLoading ? <span className="skeleton inline-block h-5 w-32 align-middle" /> : fullName}
              </h2>
              <p className="text-sm text-base-content/50 truncate">{me?.email ?? user?.email}</p>
              <span className="badge badge-primary badge-sm mt-2 gap-1">
                <ShieldCheck size={11} /> Mentor
              </span>
            </div>

            <div className="px-5 pb-4 divide-y divide-base-200">
              <ReadOnlyRow icon={Phone} label="Telefon" value={me?.phone} />
              <ReadOnlyRow icon={Building2} label="Filial" value={me?.branchName} />
              <ReadOnlyRow icon={CalendarDays} label="Ro'yxatdan o'tgan" value={formatDate(me?.createdAt)} />
            </div>
          </section>

          <button className="btn btn-outline btn-error btn-sm w-full gap-2" onClick={onLogout}>
            <LogOut size={15} /> Akkauntdan chiqish
          </button>
        </div>

        {/* ── Редактирование ── */}
        <div className="lg:col-span-2 space-y-5">
          <Panel title="Shaxsiy ma'lumotlar" icon={User} bodyClass="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field icon={User} label="Ism">
                <input
                  className="input input-bordered input-sm"
                  value={firstName}
                  maxLength={80}
                  onChange={(e) => { setFirstName(e.target.value); setError(''); }}
                  disabled={isLoading}
                />
              </Field>
              <Field icon={User} label="Familiya">
                <input
                  className="input input-bordered input-sm"
                  value={lastName}
                  maxLength={80}
                  onChange={(e) => { setLastName(e.target.value); setError(''); }}
                  disabled={isLoading}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field
                  icon={Mail}
                  label="Email"
                  hint="Bu email bilan tizimga kirasiz va parolni tiklash kodi ham shu manzilga keladi."
                >
                  <input
                    type="email"
                    className="input input-bordered input-sm"
                    value={email}
                    maxLength={160}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    disabled={isLoading}
                  />
                </Field>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 mt-4 text-xs text-error">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-5">
              {saved && (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                  <Check size={14} /> Saqlandi
                </span>
              )}
              <button
                className="btn btn-primary btn-sm gap-1.5"
                onClick={handleSave}
                disabled={saving || !dirty}
              >
                {saving ? <span className="loading loading-spinner loading-xs" /> : <Check size={15} />}
                Saqlash
              </button>
            </div>
          </Panel>

          <Panel title="Xavfsizlik" icon={KeyRound} bodyClass="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-semibold">Parol</div>
                <p className="text-xs text-base-content/50 mt-1 max-w-md">
                  Parol shu yerdan almashtirilmaydi — xavfsizlik uchun u emailingizga
                  keladigan tasdiqlash kodi orqali tiklanadi.
                </p>
              </div>
              <button
                className="btn btn-outline btn-sm gap-1.5 shrink-0"
                onClick={() => navigate('/login?reset=1')}
              >
                <KeyRound size={14} /> Parolni tiklash
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
