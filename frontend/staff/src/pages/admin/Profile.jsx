import { useState } from 'react';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import {
  User, Mail, Lock, Eye, EyeOff, Save, Shield,
  Calendar, AtSign, BadgeCheck, AlertCircle, CheckCircle2,
} from 'lucide-react';

const ROLE_LABELS = {
  admin: 'Администратор',
  superadmin: 'Super Admin',
  mentor: 'Ментор',
  methodist: 'Методист',
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'ok'|'err', text }

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    nickname: user?.nickname || '',
    age: user?.age || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        nickname: form.nickname,
        age: form.age ? Number(form.age) : undefined,
      };
      const res = await api.request('auth/me', { method: 'PATCH', body: payload });
      if (res?.user) setUser(res.user);
      else setUser(u => ({ ...u, ...payload }));
      setMsg({ type: 'ok', text: 'Профиль обновлён!' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Ошибка сохранения' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      setMsg({ type: 'err', text: 'Пароли не совпадают' });
      return;
    }
    if (form.newPassword.length < 6) {
      setMsg({ type: 'err', text: 'Пароль должен быть не менее 6 символов' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await api.request('auth/change-password', {
        method: 'POST',
        body: { currentPassword: form.currentPassword, newPassword: form.newPassword },
      });
      setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setMsg({ type: 'ok', text: 'Пароль успешно изменён!' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Ошибка смены пароля' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title="Мой профиль" subtitle="Управление личными данными и безопасностью" />

      {/* Profile avatar + role badge */}
      <div className="glass-strong rounded-[20px] p-6 animate-fade-in">
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-[18px] flex items-center justify-center text-2xl font-black shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--green) 0%, var(--green-dark) 100%)',
              color: '#111',
              boxShadow: '0 0 30px rgba(198, 255, 52, 0.2)',
            }}
          >
            {user?.firstName?.[0] ?? 'U'}{user?.lastName?.[0] ?? ''}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold" style={{ color: 'var(--text)' }}>
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
                style={{ background: 'var(--green-bg)', color: 'var(--green)' }}
              >
                <BadgeCheck size={12} />
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status message */}
      {msg && (
        <div
          className={`flex items-center gap-2.5 px-4 py-3 rounded-[12px] text-[13px] font-medium animate-slide-up ${
            msg.type === 'ok'
              ? 'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/20'
              : 'bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/20'
          }`}
        >
          {msg.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </div>
      )}

      {/* Personal info form */}
      <form onSubmit={handleSaveProfile} className="glass-strong rounded-[20px] p-6 animate-fade-in stagger-1">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-6 rounded-full bg-[var(--green)]" />
          <h2 className="text-[15px] font-extrabold" style={{ color: 'var(--text)' }}>Личные данные</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First name */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Имя
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border text-[13px] outline-none transition-all duration-200 focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)]"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>

          {/* Last name */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Фамилия
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border text-[13px] outline-none transition-all duration-200 focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)]"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Никнейм
            </label>
            <div className="relative">
              <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={form.nickname}
                onChange={e => set('nickname', e.target.value)}
                placeholder="Отображаемое имя"
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border text-[13px] outline-none transition-all duration-200 focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)] placeholder:text-[var(--text-muted)]"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Возраст
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="number"
                min="16"
                max="100"
                value={form.age}
                onChange={e => set('age', e.target.value)}
                placeholder="25"
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border text-[13px] outline-none transition-all duration-200 focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)] placeholder:text-[var(--text-muted)]"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Email
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={form.email}
                readOnly
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border text-[13px] outline-none cursor-not-allowed opacity-70"
                style={{
                  background: 'var(--surface-hover)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-bold transition-all duration-200 hover:brightness-110 disabled:opacity-50"
            style={{ background: 'var(--green)', color: '#111' }}
          >
            {saving ? <span className="loading loading-spinner loading-sm" /> : <Save size={14} />}
            Сохранить
          </button>
        </div>
      </form>

      {/* Change password form */}
      <form onSubmit={handleChangePassword} className="glass-strong rounded-[20px] p-6 animate-fade-in stagger-2">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-1 h-6 rounded-full bg-[var(--danger)]" />
          <h2 className="text-[15px] font-extrabold" style={{ color: 'var(--text)' }}>Смена пароля</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Current password */}
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Текущий пароль
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={e => set('currentPassword', e.target.value)}
                className="w-full h-10 pl-9 pr-10 rounded-[10px] border text-[13px] outline-none transition-all duration-200 focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)]"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Новый пароль
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => set('newPassword', e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full h-10 pl-9 pr-10 rounded-[10px] border text-[13px] outline-none transition-all duration-200 focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)] placeholder:text-[var(--text-muted)]"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--text-muted)' }}>
              Подтвердите пароль
            </label>
            <div className="relative">
              <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                placeholder="Повторите пароль"
                className="w-full h-10 pl-9 pr-10 rounded-[10px] border text-[13px] outline-none transition-all duration-200 focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)] placeholder:text-[var(--text-muted)]"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                  color: 'var(--text)',
                }}
              />
            </div>
          </div>
        </div>

        {/* Show/hide password toggle */}
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
          {showPassword ? 'Скрыть пароли' : 'Показать пароли'}
        </button>

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={saving || !form.currentPassword || !form.newPassword}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-bold transition-all duration-200 hover:brightness-110 disabled:opacity-50"
            style={{ background: 'var(--danger)', color: '#fff' }}
          >
            {saving ? <span className="loading loading-spinner loading-sm" /> : <Lock size={14} />}
            Изменить пароль
          </button>
        </div>
      </form>
    </div>
  );
}
