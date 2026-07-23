import { useState, useEffect } from 'react';
import { useAuth } from '../../auth.jsx';
import { useAdminSettings, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { SkeletonKpis } from '../../components/Skeleton.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import {
  Building2, Bell, Shield, CreditCard, Globe,
  CheckCircle2, AlertCircle, Eye, EyeOff,
  MessageSquare, Mail, Smartphone, Clock, Coins,
  FileText, Languages, MapPin, Phone, Save,
  KeyRound, Lock, Monitor, Zap, Globe2, Timer,
} from 'lucide-react';

/* ═══════════════════ Tab definitions ═══════════════════ */

const TABS = [
  { key: 'general',       label: 'Общие',         icon: Building2,    color: '#3b82f6' },
  { key: 'notifications', label: 'Уведомления',    icon: Bell,         color: '#f59e0b' },
  { key: 'security',      label: 'Безопасность',   icon: Shield,       color: '#ef4444' },
  { key: 'finance',       label: 'Финансы',        icon: CreditCard,   color: '#3b82f6' },
  { key: 'localization',  label: 'Локализация',    icon: Globe,        color: '#06b6d4' },
];

/* ═══════════════════ Default settings ═══════════════════ */

const DEFAULTS = {
  branchName: '',
  branchAddress: '',
  branchPhone: '',
  branchEmail: '',
  branchWebsite: '',
  notifyEmail: true,
  notifyTelegram: true,
  notifySms: false,
  notifyOverduePayments: true,
  notifyNewStudents: true,
  notifyAttendance: true,
  notifyDailyReport: false,
  twoFactorEnabled: false,
  sessionTimeout: 30,
  allowMultipleSessions: true,
  currency: 'UZS',
  currencySymbol: 'сўм',
  invoicePrefix: 'INV',
  autoGenerateInvoice: true,
  paymentGraceDays: 3,
  language: 'ru',
  dateFormat: 'DD.MM.YYYY',
  timezone: 'Asia/Tashkent',
  firstDayOfWeek: 'monday',
};

/* ═══════════════════ Shared premium components ═══════════════════ */

function SettingCard({ icon: Icon, title, subtitle, color, children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${className}`}
      style={{
        background: 'var(--glass-bg)',
        borderColor: 'var(--glass-border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="p-5 sm:p-6">
        {(title || subtitle) && (
          <div className="flex items-center gap-3 mb-5">
            {Icon && (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${color || '#3b82f6'}15` }}
              >
                <Icon size={17} style={{ color: color || '#3b82f6' }} />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
              {subtitle && (
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[13px] font-semibold" style={{ color: 'var(--text)' }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, label, hint, icon: Icon, color = '#3b82f6' }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200"
            style={{ background: checked ? `${color}15` : 'var(--surface-hover)' }}
          >
            <Icon size={15} style={{ color: checked ? color : 'var(--text-muted)' }} />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{label}</div>
          {hint && <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{hint}</div>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className="relative w-11 h-6 rounded-full shrink-0 transition-all duration-300 ml-3"
        style={{
          background: checked ? color : 'var(--border)',
          boxShadow: checked ? `0 0 12px ${color}40` : 'none',
        }}
      >
        <span
           className="absolute top-0.5 w-5 h-5 rounded-full bg-base-100 shadow-md transition-all duration-300"
          style={{
            left: checked ? 22 : 2,
            transform: checked ? 'scale(1)' : 'scale(0.85)',
          }}
        />
      </button>
    </div>
  );
}

function PremiumInput({ value, onChange, placeholder, icon: Icon, type = 'text', disabled = false }) {
  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {Icon && <Icon size={15} style={{ color: 'var(--text-muted)' }} className="shrink-0" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
        style={{ color: 'var(--text)' }}
      />
    </div>
  );
}

function PremiumSelect({ value, onChange, children, icon: Icon }) {
  return (
    <div
      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {Icon && <Icon size={15} style={{ color: 'var(--text-muted)' }} className="shrink-0" />}
      <select
        value={value}
        onChange={onChange}
        className="flex-1 bg-transparent outline-none text-[13px] min-w-0 cursor-pointer appearance-none"
        style={{ color: 'var(--text)' }}
      >
        {children}
      </select>
    </div>
  );
}

function OptionGroup({ options, value, onChange, columns = false }) {
  return (
    <div className={`flex gap-2 ${columns ? 'flex-wrap' : ''}`}>
      {options.map(({ val, label, icon: Icon }) => (
        <button
          key={val}
          onClick={() => onChange(val)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200"
          style={{
            background: value === val ? 'var(--primary)' : 'var(--surface)',
            color: value === val ? '#fff' : 'var(--text-secondary)',
            borderColor: value === val ? 'var(--primary)' : 'var(--border)',
            boxShadow: value === val ? '0 4px 12px rgba(59,130,246,0.3)' : 'none',
          }}
        >
          {Icon && <Icon size={15} />}
          {label}
        </button>
      ))}
    </div>
  );
}

function Divider() {
  return (
    <div className="my-4" style={{ borderTop: '1px solid var(--border)' }} />
  );
}

/* ═══════════════════ Tab: General ═══════════════════ */

function TabGeneral({ settings, onChange }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <SettingCard
        icon={Building2}
        title="Основные настройки"
        subtitle="Общие параметры панели"
        color="#3b82f6"
      >
        <div className="space-y-4">
          <Field label="Префикс инвойсов" hint="Добавляется перед номером счёта">
            <PremiumInput
              value={settings.invoicePrefix}
              onChange={(e) => onChange({ invoicePrefix: e.target.value.toUpperCase() })}
              placeholder="INV"
              icon={FileText}
            />
          </Field>

          <Divider />

          <Toggle
            checked={settings.autoGenerateInvoice}
            onChange={(v) => onChange({ autoGenerateInvoice: v })}
            label="Автогенерация инвойсов"
            hint="Создавать инвойс автоматически при начале месяца"
            icon={Zap}
            color="#3b82f6"
          />
        </div>
      </SettingCard>
    </div>
  );
}

/* ═══════════════════ Tab: Appearance ═══════════════════ */

// Выбор темы удалён вместе с самой тёмной темой (см. src/index.css):
// переключатель остался бы кнопкой, которая ничего не меняет.
/* ═══════════════════ Tab: Notifications ═══════════════════ */

function TabNotifications({ settings, onChange }) {
  const channels = [
    { key: 'notifyEmail',     label: 'Email-уведомления',   hint: 'Отправлять уведомления на email',      icon: Mail,          color: '#3b82f6' },
    { key: 'notifyTelegram',  label: 'Telegram-уведомления', hint: 'Через Telegram-бота',                 icon: MessageSquare, color: '#3b82f6' },
    { key: 'notifySms',       label: 'SMS-уведомления',      hint: 'Только для критических событий',       icon: Smartphone,   color: '#f59e0b' },
  ];

  const events = [
    { key: 'notifyOverduePayments', label: 'Просроченные платежи', hint: 'Уведомлять о просроченных инвойсах', icon: Timer,         color: '#ef4444' },
    { key: 'notifyNewStudents',     label: 'Новые студенты',       hint: 'Уведомлять о регистрации новых студентов', icon: Mail,     color: '#3b82f6' },
    { key: 'notifyAttendance',      label: 'Посещаемость',         hint: 'Уведомлять о пропусках',             icon: Clock,         color: '#f59e0b' },
    { key: 'notifyDailyReport',     label: 'Ежедневный отчёт',     hint: 'Сводка за день в конце рабочего времени', icon: FileText, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <SettingCard
        icon={Bell}
        title="Каналы уведомлений"
        subtitle="Выберите, куда отправлять уведомления"
        color="#f59e0b"
      >
        <div className="space-y-1">
          {channels.map(({ key, label, hint, icon, color }, i) => (
            <div key={key}>
              <Toggle
                checked={settings[key]}
                onChange={(v) => onChange({ [key]: v })}
                label={label}
                hint={hint}
                icon={icon}
                color={color}
              />
              {i < channels.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </SettingCard>

      <SettingCard
        icon={Zap}
        title="События"
        subtitle="Какие события отслеживать"
        color="#06b6d4"
      >
        <div className="space-y-1">
          {events.map(({ key, label, hint, icon, color }, i) => (
            <div key={key}>
              <Toggle
                checked={settings[key]}
                onChange={(v) => onChange({ [key]: v })}
                label={label}
                hint={hint}
                icon={icon}
                color={color}
              />
              {i < events.length - 1 && <Divider />}
            </div>
          ))}
        </div>
      </SettingCard>
    </div>
  );
}

/* ═══════════════════ Tab: Security ═══════════════════ */

function TabSecurity({ settings, onChange }) {
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwFields, setPwFields] = useState({ current: '', newPw: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState('');
  const [pwBusy, setPwBusy] = useState(false);

  const handlePasswordChange = async () => {
    if (!pwFields.current || !pwFields.newPw) return;
    if (pwFields.newPw !== pwFields.confirm) {
      setPwMsg('error');
      return;
    }
    setPwBusy(true);
    try {
      await api.adminUpdateSettings(null, { changePassword: { current: pwFields.current, newPassword: pwFields.newPw } });
      setPwMsg('success');
      setPwFields({ current: '', newPw: '', confirm: '' });
      setTimeout(() => setPwMsg(''), 3000);
    } catch {
      setPwMsg('error');
      setTimeout(() => setPwMsg(''), 3000);
    } finally {
      setPwBusy(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <SettingCard
        icon={Shield}
        title="Двухфакторная аутентификация"
        subtitle="Дополнительный уровень защиты аккаунта"
        color="#ef4444"
      >
        <Toggle
          checked={settings.twoFactorEnabled}
          onChange={(v) => onChange({ twoFactorEnabled: v })}
          label="Включить 2FA"
          hint="При входе потребуется код из приложения-аутентификатора"
          icon={KeyRound}
          color="#ef4444"
        />
        {settings.twoFactorEnabled && (
          <div
            className="mt-3 px-4 py-3 rounded-xl flex items-center gap-3"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.15)' }}
          >
            <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
            <span className="text-[12px] font-semibold" style={{ color: '#22c55e' }}>2FA активна</span>
          </div>
        )}
      </SettingCard>

      <SettingCard
        icon={Clock}
        title="Сессии"
        subtitle="Управление активными сессиями"
        color="#8b5cf6"
      >
        <div className="space-y-4">
          <Field label="Тайм-аут сессии" hint="Через сколько минут бездействия произойдёт выход">
            <PremiumSelect
              value={settings.sessionTimeout}
              onChange={(e) => onChange({ sessionTimeout: Number(e.target.value) })}
              icon={Timer}
            >
              <option value={15}>15 минут</option>
              <option value={30}>30 минут</option>
              <option value={60}>1 час</option>
              <option value={120}>2 часа</option>
              <option value={480}>8 часов</option>
            </PremiumSelect>
          </Field>

          <Divider />

          <Toggle
            checked={settings.allowMultipleSessions}
            onChange={(v) => onChange({ allowMultipleSessions: v })}
            label="Множественные сессии"
            hint="Разрешить вход с нескольких устройств одновременно"
            icon={Monitor}
            color="#8b5cf6"
          />
        </div>
      </SettingCard>

      <SettingCard
        icon={Lock}
        title="Смена пароля"
        subtitle="Обновите пароль для безопасности"
        color="#f59e0b"
      >
        <div className="space-y-4 max-w-md">
          <Field label="Текущий пароль">
            <div
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <KeyRound size={15} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={pwFields.current}
                onChange={(e) => setPwFields((p) => ({ ...p, current: e.target.value }))}
                placeholder="Введите текущий пароль"
                className="flex-1 bg-transparent outline-none text-[13px]"
                style={{ color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="shrink-0 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <Field label="Новый пароль" hint="Минимум 8 символов">
            <div
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.15)]"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <Lock size={15} style={{ color: 'var(--text-muted)' }} className="shrink-0" />
              <input
                type={showNewPw ? 'text' : 'password'}
                value={pwFields.newPw}
                onChange={(e) => setPwFields((p) => ({ ...p, newPw: e.target.value }))}
                placeholder="Мин. 8 символов"
                className="flex-1 bg-transparent outline-none text-[13px]"
                style={{ color: 'var(--text)' }}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="shrink-0 transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {pwFields.newPw && pwFields.newPw.length < 8 && (
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--danger)' }}>
                Минимум 8 символов
              </p>
            )}
          </Field>

          <Field label="Подтвердите пароль">
            <PremiumInput
              value={pwFields.confirm}
              onChange={(e) => setPwFields((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="Повторите новый пароль"
              icon={Lock}
              type="password"
            />
            {pwFields.confirm && pwFields.newPw !== pwFields.confirm && (
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--danger)' }}>
                Пароли не совпадают
              </p>
            )}
          </Field>

          {pwMsg === 'success' && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[12px] font-semibold animate-slide-up"
              style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <CheckCircle2 size={16} />
              Пароль успешно изменён
            </div>
          )}
          {pwMsg === 'error' && (
            <div
              className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-[12px] font-semibold animate-slide-up"
              style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <AlertCircle size={16} />
              {pwFields.newPw !== pwFields.confirm ? 'Пароли не совпадают' : 'Ошибка смены пароля'}
            </div>
          )}

          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-200 btn btn-primary"
            disabled={!pwFields.current || !pwFields.newPw || pwFields.newPw.length < 8 || pwBusy}
            onClick={handlePasswordChange}
          >
            {pwBusy && <span className="loading loading-spinner loading-xs" />}
            Изменить пароль
          </button>
        </div>
      </SettingCard>
    </div>
  );
}

/* ═══════════════════ Tab: Finance ═══════════════════ */

function TabFinance({ settings, onChange }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <SettingCard
        icon={Coins}
        title="Валюта"
        subtitle="Настройки валюты и формата сумм"
        color="#3b82f6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Валюта">
            <PremiumSelect
              value={settings.currency}
              onChange={(e) => onChange({ currency: e.target.value })}
              icon={Coins}
            >
              <option value="UZS">UZS — Узбекский сум</option>
              <option value="USD">USD — Доллар США</option>
              <option value="RUB">RUB — Российский рубль</option>
            </PremiumSelect>
          </Field>
          <Field label="Символ валюты">
            <PremiumInput
              value={settings.currencySymbol}
              onChange={(e) => onChange({ currencySymbol: e.target.value })}
              placeholder="сўм"
              icon={Coins}
            />
          </Field>
        </div>
      </SettingCard>

      <SettingCard
        icon={FileText}
        title="Инвойсы"
        subtitle="Настройки автоматической генерации счетов"
        color="#3b82f6"
      >
        <div className="space-y-4">
          <Field label="Префикс инвойсов" hint="Добавляется перед номером (например, INV-001)">
            <PremiumInput
              value={settings.invoicePrefix}
              onChange={(e) => onChange({ invoicePrefix: e.target.value.toUpperCase() })}
              placeholder="INV"
              icon={FileText}
            />
          </Field>

          <Divider />

          <Toggle
            checked={settings.autoGenerateInvoice}
            onChange={(v) => onChange({ autoGenerateInvoice: v })}
            label="Автогенерация инвойсов"
            hint="Создавать инвойс автоматически при начале месяца"
            icon={Zap}
            color="#3b82f6"
          />

          <Divider />

          <Field label="Льготный период (дни)" hint="Сколько дней давать на оплату после выставления счёта">
            <PremiumSelect
              value={settings.paymentGraceDays}
              onChange={(e) => onChange({ paymentGraceDays: Number(e.target.value) })}
              icon={Timer}
            >
              <option value={0}>Без льготного периода</option>
              <option value={3}>3 дня</option>
              <option value={5}>5 дней</option>
              <option value={7}>7 дней</option>
              <option value={14}>14 дней</option>
            </PremiumSelect>
          </Field>
        </div>
      </SettingCard>
    </div>
  );
}

/* ═══════════════════ Tab: Localization ═══════════════════ */

function TabLocalization({ settings, onChange }) {
  const languages = [
    { val: 'ru', label: 'Русский' },
    { val: 'uz', label: 'Ўзбекча' },
    { val: 'en', label: 'English' },
  ];

  const dateFormats = [
    { val: 'DD.MM.YYYY', label: '31.12.2026' },
    { val: 'MM/DD/YYYY', label: '12/31/2026' },
    { val: 'YYYY-MM-DD', label: '2026-12-31' },
  ];

  const timezones = [
    { val: 'Asia/Tashkent', label: 'Asia/Tashkent (UTC+5)' },
    { val: 'Asia/Almaty',   label: 'Asia/Almaty (UTC+6)' },
    { val: 'Europe/Moscow', label: 'Europe/Moscow (UTC+3)' },
  ];

  const weekDays = [
    { val: 'monday',   label: 'Понедельник' },
    { val: 'sunday',   label: 'Воскресенье' },
  ];

  return (
    <div className="space-y-5 animate-fade-in">
      <SettingCard
        icon={Languages}
        title="Язык и формат"
        subtitle="Язык интерфейса и форматы отображения"
        color="#06b6d4"
      >
        <div className="space-y-5">
          <Field label="Язык интерфейса">
            <OptionGroup
              options={languages}
              value={settings.language}
              onChange={(v) => onChange({ language: v })}
            />
          </Field>

          <Divider />

          <Field label="Формат даты">
            <OptionGroup
              options={dateFormats.map(d => ({ ...d, icon: null }))}
              value={settings.dateFormat}
              onChange={(v) => onChange({ dateFormat: v })}
            />
          </Field>
        </div>
      </SettingCard>

      <SettingCard
        icon={MapPin}
        title="Региональные настройки"
        subtitle="Часовой пояс и начало недели"
        color="#8b5cf6"
      >
        <div className="space-y-5">
          <Field label="Часовой пояс">
            <PremiumSelect
              value={settings.timezone}
              onChange={(e) => onChange({ timezone: e.target.value })}
              icon={Globe2}
            >
              {timezones.map(({ val, label }) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </PremiumSelect>
          </Field>

          <Divider />

          <Field label="Первый день недели">
            <OptionGroup
              options={weekDays}
              value={settings.firstDayOfWeek}
              onChange={(v) => onChange({ firstDayOfWeek: v })}
            />
          </Field>
        </div>
      </SettingCard>
    </div>
  );
}

/* ═══════════════════ Main: AdminSettings ═══════════════════ */

export default function AdminSettings() {
  const { token } = useAuth();
  const { data, isLoading } = useAdminSettings();
  const invalidate = useInvalidate();

  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(DEFAULTS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    if (data) {
      const s = data.data || data.settings || data;
      if (s && typeof s === 'object') {
        setSettings((prev) => ({ ...prev, ...s }));
      }
    }
  }, [data]);

  const update = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setDirty(true);
    setSaveMsg('');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.adminUpdateSettings(token, settings);
      invalidate('admin-settings');
      setDirty(false);
      setSaveMsg('success');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch {
      setSaveMsg('error');
      setTimeout(() => setSaveMsg(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="animate-page-enter">
        <PageHeader title="Настройки" subtitle="Загрузка настроек..." />
        <SkeletonKpis count={2} className="grid-cols-1 md:grid-cols-2" />
      </div>
    );
  }

  const activeTabData = TABS.find((t) => t.key === activeTab);

  return (
    <div className="animate-page-enter">
      {/* ── Header ── */}
      <PageHeader title="Настройки" subtitle="Управление параметрами филиала">
        {saveMsg === 'success' && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold animate-slide-up bg-success/10 text-success border border-success/20">
            <CheckCircle2 size={14} />
            Сохранено
          </div>
        )}
        {saveMsg === 'error' && (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[12px] font-semibold animate-slide-up bg-error/10 text-error border border-error/20">
            <AlertCircle size={14} />
            Ошибка сохранения
          </div>
        )}
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Sidebar tabs ── */}
        <div className="lg:w-[220px] shrink-0">
          <div
            className="rounded-2xl border p-2"
            style={{
              background: 'var(--glass-bg)',
              borderColor: 'var(--glass-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="flex lg:flex-col gap-1 overflow-x-auto">
              {TABS.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 whitespace-nowrap"
                  style={{
                    background: activeTab === key ? `${color}12` : 'transparent',
                    color: activeTab === key ? color : 'var(--text-muted)',
                  }}
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="hidden lg:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 min-w-0 pb-24">
          {activeTab === 'general' && <TabGeneral settings={settings} onChange={update} />}
          {activeTab === 'notifications' && <TabNotifications settings={settings} onChange={update} />}
          {activeTab === 'security' && <TabSecurity settings={settings} onChange={update} />}
          {activeTab === 'finance' && <TabFinance settings={settings} onChange={update} />}
          {activeTab === 'localization' && <TabLocalization settings={settings} onChange={update} />}
        </div>
      </div>

      {/* ── Fixed save bar ── */}
      {dirty && (
        <div
          className="fixed bottom-0 right-0 z-50 flex items-center gap-3 px-6 py-4 animate-slide-up"
          style={{
            left: 'var(--sidebar-width, 256px)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid var(--glass-border)',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
          }}
        >
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
            Есть несохранённые изменения
          </span>
          <div className="flex-1" />
          <button
            onClick={() => { setDirty(false); setSettings(DEFAULTS); }}
            className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-all duration-200"
            style={{ color: 'var(--text-secondary)', background: 'var(--surface)' }}
          >
            Отменить
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 btn btn-primary"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Save size={15} />
            )}
            Сохранить
          </button>
        </div>
      )}
    </div>
  );
}
