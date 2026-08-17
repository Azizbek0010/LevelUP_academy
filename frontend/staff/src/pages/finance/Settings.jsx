/* ─────────────────────────────────────────────────────────────────────────────
   Finance Manager — Настройки профиля. Статичный демо-раздел (backend-роль ещё
   не заведена), поэтому редактирование хранится локально в localStorage и не
   уходит на сервер. Стили — DaisyUI в тон остальных страниц панели.
   ────────────────────────────────────────────────────────────────────────── */
import { useEffect, useState } from 'react';
import { User, Mail, Phone, MapPin, Save, BadgeCheck, Globe, ShieldCheck, CheckCircle2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import { useAuth } from '../../auth.jsx';
import { Card, LangSwitch } from './_ui.jsx';
import { useT } from './_i18n.jsx';
import { PROFILE } from './_data.js';

const STORAGE_KEY = 'finance_profile';

/* ── Поле формы с иконкой слева ── */
function Field({ label, icon: Icon, value, onChange, readOnly }) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block text-base-content/50">
        {label}
      </label>
      <div className="relative">
        <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
        <input
          type="text"
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
          className={`w-full h-10 pl-9 pr-3 rounded-[10px] border border-base-300 bg-base-100 text-base-content text-[13px] outline-none transition-all duration-200 focus:border-primary focus:ring-1 focus:ring-primary ${
            readOnly ? 'cursor-not-allowed bg-base-200 text-base-content/50' : ''
          }`}
        />
      </div>
    </div>
  );
}

export default function FinanceSettings() {
  const { t } = useT();
  const { user } = useAuth();
  const [form, setForm] = useState(() => {
    /* Имя/фамилия/email — из авторизации (как в шапке), остальное из PROFILE+localStorage */
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      stored = {};
    }
    return {
      ...PROFILE,
      ...stored,
      firstName: user?.firstName ?? stored.firstName ?? PROFILE.firstName,
      lastName: user?.lastName ?? stored.lastName ?? PROFILE.lastName,
      email: user?.email ?? stored.email ?? PROFILE.email,
    };
  });
  const [saved, setSaved] = useState(false);

  /* Демо-режим: храним правки локально между перезагрузками страницы */
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
  }, [form]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = ((form.firstName?.[0] ?? '') + (form.lastName?.[0] ?? '')).toUpperCase() || 'FM';

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} />

      {/* ═══ Профиль ═══ */}
      <Card bodyClass="p-5">
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-[18px] grid place-items-center text-2xl font-black shrink-0 text-white"
            style={{ background: 'linear-gradient(135deg, #0d9488 0%, #134e4a 100%)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-extrabold text-base-content">{form.firstName} {form.lastName}</h2>
            <p className="text-sm mt-0.5 text-base-content/70">{form.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600">
                <BadgeCheck size={12} />
                {form.role}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-base-content/5 text-base-content/60">
                <MapPin size={12} />
                {form.city}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ═══ Личные данные ═══ */}
      <form onSubmit={handleSave} className="card bg-base-100 border border-base-300 shadow-sm p-6">
        <h2 className="text-[15px] font-extrabold text-base-content">{t('settings.personal')}</h2>
        <p className="text-[12px] text-base-content/50 mt-0.5 mb-5">{t('settings.personalSub')}</p>

        {saved && (
          <div className="flex items-center gap-2.5 px-4 py-3 mb-5 rounded-[12px] text-[13px] font-medium bg-success/10 text-success border border-success/20 animate-slide-up">
            <CheckCircle2 size={15} />
            {t('settings.saved')}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('settings.firstName')} icon={User} value={form.firstName} onChange={(v) => set('firstName', v)} />
          <Field label={t('settings.lastName')} icon={User} value={form.lastName} onChange={(v) => set('lastName', v)} />
          <Field label={t('settings.phone')} icon={Phone} value={form.phone} onChange={(v) => set('phone', v)} />
          <Field label={t('settings.city')} icon={MapPin} value={form.city} onChange={(v) => set('city', v)} />
          <div className="sm:col-span-2">
            <Field label={t('settings.email')} icon={Mail} value={form.email} readOnly />
            <span className="text-[10px] text-base-content/40 mt-1">{t('settings.local')}</span>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button type="submit" className="btn btn-primary btn-sm gap-2">
            <Save size={14} />
            {t('settings.save')}
          </button>
        </div>
      </form>

      {/* ═══ Язык интерфейса ═══ */}
      <Card title={t('settings.lang')} subtitle={t('settings.langSub')} bodyClass="p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Globe size={20} />
          </span>
          <LangSwitch />
        </div>
      </Card>

      {/* ═══ Безопасность ═══ */}
      <Card title={t('settings.security')} subtitle={t('settings.securitySub')} bodyClass="p-5">
        <div className="flex items-center gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning/10 text-warning">
            <ShieldCheck size={20} />
          </span>
          <span className="text-[13px] text-base-content/60">{form.email}</span>
        </div>
      </Card>
    </div>
  );
}
