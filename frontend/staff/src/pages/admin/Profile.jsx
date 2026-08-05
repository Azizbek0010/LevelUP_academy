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
  const { token, user, patchUser } = useAuth();
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
      const res = await api.updateMe(token, payload);
      if (res?.data) patchUser(res.data);
      else patchUser(u => ({ ...u, ...payload }));
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
      setMsg({ type: 'err', text: 'Минимум 6 символов' });
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      await api.changePassword(token, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm(f => ({ ...f, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setMsg({ type: 'ok', text: 'Пароль изменён!' });
    } catch (err) {
      setMsg({ type: 'err', text: err.message || 'Ошибка смены пароля' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      {/* ═══ Page Header ═══ */}
      <div>
        <h1 className="text-[28px] font-extrabold text-base-content tracking-[-0.035em] leading-none">Профиль</h1>
        <p className="text-[13px] text-base-content/70 mt-1">Личные данные и настройки безопасности</p>
      </div>

      {/* ═══ Profile Card ═══ */}
      <div className="card bg-base-100 p-5 card-hover-premium animate-fade-in stagger-0">
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-[18px] flex items-center justify-center text-2xl font-black shrink-0"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #2563eb) 100%)',
              color: '#fff',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.25)',
            }}
          >
            {user?.firstName?.[0] ?? 'U'}{user?.lastName?.[0] ?? ''}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold text-base-content">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-sm mt-0.5 text-base-content/70">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary/10 text-primary"
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
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-error/10 text-error border border-error/20'
          }`}
        >
          {msg.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {msg.text}
        </div>
      )}

      {/* Personal info form */}
      <form onSubmit={handleSaveProfile} className="card bg-base-100 p-6 animate-fade-in stagger-1">
        <div className="flex items-center gap-2.5 mb-5">
          <h2 className="text-[15px] font-extrabold text-base-content">Личные данные</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First name */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-base-content/50">
              Имя
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                type="text"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-base-300 bg-base-100 text-base-content text-[13px] outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Last name */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-base-content/50">
              Фамилия
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                type="text"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-base-300 bg-base-100 text-base-content text-[13px] outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-base-content/50">
              Никнейм
            </label>
            <div className="relative">
              <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                type="text"
                value={form.nickname}
                onChange={e => set('nickname', e.target.value)}
                placeholder="Отображаемое имя"
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-base-300 bg-base-100 text-base-content text-[13px] outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-base-content/45"
              />
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-base-content/50">
              Возраст
            </label>
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                type="number"
                min="5"
                max="100"
                value={form.age}
                onChange={e => set('age', e.target.value)}
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-base-300 bg-base-100 text-base-content text-[13px] outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-base-content/50">
              Email
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full h-10 pl-9 pr-3 rounded-[10px] border border-base-300 bg-base-200 text-base-content/50 text-[13px] outline-none cursor-not-allowed"
              />
            </div>
            <span className="text-[10px] text-base-content/40 mt-1">Email меняется через Super Admin</span>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-sm gap-2"
          >
            {saving ? <span className="loading loading-spinner loading-sm" /> : <Save size={14} />}
            Сохранить
          </button>
        </div>
      </form>

      {/* Change password form */}
      <form onSubmit={handleChangePassword} className="card bg-base-100 p-6 animate-fade-in stagger-2">
        <div className="flex items-center gap-2.5 mb-5">
          <h2 className="text-[15px] font-extrabold text-base-content">Смена пароля</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Current password */}
          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-base-content/50">
              Текущий пароль
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={e => set('currentPassword', e.target.value)}
                className="w-full h-10 pl-9 pr-10 rounded-[10px] border border-base-300 bg-base-100 text-base-content text-[13px] outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-base-content/50">
              Новый пароль
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.newPassword}
                onChange={e => set('newPassword', e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full h-10 pl-9 pr-10 rounded-[10px] border border-base-300 bg-base-100 text-base-content text-[13px] outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-base-content/45"
              />
            </div>
          </div>

          {/* Confirm password */}
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-base-content/50">
              Подтвердите пароль
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={e => set('confirmPassword', e.target.value)}
                placeholder="Повторите новый пароль"
                className="w-full h-10 pl-9 pr-10 rounded-[10px] border border-base-300 bg-base-100 text-base-content text-[13px] outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-base-content/45"
              />
            </div>
          </div>
        </div>

        {/* Show/hide password toggle */}
        <button
          type="button"
          onClick={() => setShowPassword(v => !v)}
          className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium transition-colors text-base-content/50"
        >
          {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
          {showPassword ? 'Скрыть пароли' : 'Показать пароли'}
        </button>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary btn-sm gap-2"
          >
            {saving ? <span className="loading loading-spinner loading-sm" /> : <Save size={14} />}
            Изменить пароль
          </button>
        </div>
      </form>
    </div>
  );
}