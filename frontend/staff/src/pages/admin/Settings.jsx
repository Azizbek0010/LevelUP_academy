import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Building2, Palette, Bell, LayoutDashboard, Shield, Globe,
  Accessibility, HardDrive, Info, Moon, Sun, Monitor,
  Save, RotateCcw, Download, Upload,
  Eye, Clock, CheckCircle, AlertTriangle, X, Loader2,
  MessageSquare, User, CreditCard, TrendingUp,
  Activity, Calendar, Star, Zap, UserPlus,
  Server, Package, RefreshCw, Trash2, Languages,
  Type, Contrast, Keyboard, LogIn,
  Check, ChevronRight, CircleDot
} from 'lucide-react';

/* ================================================================
   CONSTANTS
   ================================================================ */

const STORAGE_KEY = 'levelup_admin_settings';
const STYLE_ID = 'levelup-settings-theme';

const ACCENT_COLORS = [
  { key: 'blue',    label: 'Blue',    color: '#3b82f6', light: '#eff6ff', ring: '#3b82f6' },
  { key: 'purple',  label: 'Purple',  color: '#8b5cf6', light: '#f5f3ff', ring: '#8b5cf6' },
  { key: 'emerald', label: 'Emerald', color: '#10b981', light: '#ecfdf5', ring: '#10b981' },
  { key: 'orange',  label: 'Orange',  color: '#f97316', light: '#fff7ed', ring: '#f97316' },
  { key: 'rose',    label: 'Rose',    color: '#f43f5e', light: '#fff1f2', ring: '#f43f5e' },
];

const TIMEZONES = [
  'Asia/Tashkent', 'Asia/Samarkand', 'Asia/Tokyo',
  'Europe/Moscow', 'Europe/London', 'Europe/Berlin',
  'America/New_York', 'America/Chicago', 'America/Los_Angeles',
  'Asia/Dubai', 'Asia/Almaty', 'UTC',
];

const CURRENCIES = [
  { value: 'UZS', label: "So'm (UZS)" },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'RUB', label: 'Russian Ruble (RUB)' },
];

const DATE_FORMATS = [
  { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
  { value: 'MM.DD.YYYY', label: 'MM.DD.YYYY' },
];

const LANGUAGES = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'uz', label: "O'zbek", native: "O'zbekcha" },
  { value: 'ru', label: 'Russian', native: 'Русский' },
];

const THEME_OPTIONS = [
  { key: 'light',  label: 'Light',  icon: Sun,     desc: 'Clean and bright interface' },
  { key: 'dark',   label: 'Dark',   icon: Moon,    desc: 'Easy on the eyes at night' },
  { key: 'system', label: 'System', icon: Monitor, desc: 'Follows your device theme' },
];

const SIDEBAR_STYLES = [
  { key: 'rounded',  label: 'Rounded',  desc: 'Soft pill-shaped items' },
  { key: 'classic',  label: 'Classic',  desc: 'Standard square items' },
  { key: 'compact',  label: 'Compact',  desc: 'Minimal spacing' },
];

const CARD_STYLES = [
  { key: 'soft',     label: 'Soft',     desc: 'Subtle shadow, light border' },
  { key: 'bordered', label: 'Bordered', desc: 'Clear border definition' },
  { key: 'glass',    label: 'Glass',    desc: 'Frosted glass effect' },
];

const DEFAULTS = {
  // General
  academyName: 'LevelUp Academy',
  academyAddress: '',
  phone: '+998 90 123 45 67',
  website: '',
  email: 'info@levelup.uz',
  timezone: 'Asia/Tashkent',
  language: 'en',
  currency: 'UZS',
  dateFormat: 'DD.MM.YYYY',
  timeFormat: '24h',

  // Appearance
  theme: 'light',
  accentColor: 'emerald',
  sidebarStyle: 'rounded',
  cardStyle: 'soft',
  density: 'comfortable',

  // Notifications
  notifEmail: true,
  notifBrowser: true,
  notifStudentRegistrations: true,
  notifPaymentAlerts: true,
  notifAttendanceAlerts: true,
  notifMessages: true,
  notifReminders: true,

  // Dashboard Preferences
  dashQuickStats: true,
  dashCharts: true,
  dashRecentActivity: true,
  dashCalendar: false,
  dashRevenueWidget: true,
  dashTopStudents: true,
  dashQuickActions: true,

  // Security
  passwordVisibility: false,
  autoLock: true,
  sessionTimeout: '30',
  rememberLogin: true,
  twoFactor: false,

  // Localization
  locLanguage: 'en',
  locTimezone: 'Asia/Tashkent',
  locCurrency: 'UZS',
  locDateFormat: 'DD.MM.YYYY',
  locFirstDayOfWeek: 'monday',

  // Accessibility
  largeText: false,
  reduceMotion: false,
  highContrast: false,
  keyboardNav: true,
  focusHighlight: true,
};

const TABS = [
  { key: 'general',        label: 'General',        icon: Building2 },
  { key: 'appearance',     label: 'Appearance',     icon: Palette },
  { key: 'notifications',  label: 'Notifications',  icon: Bell },
  { key: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { key: 'security',       label: 'Security',       icon: Shield },
  { key: 'localization',   label: 'Localization',   icon: Globe },
  { key: 'accessibility',  label: 'Accessibility',  icon: Accessibility },
  { key: 'backup',         label: 'Backup',         icon: HardDrive },
  { key: 'about',          label: 'About',          icon: Info },
];

/* ================================================================
   LOCAL STORAGE HELPERS
   ================================================================ */

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULTS, ...parsed };
    }
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}

function getStorageSize() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) total += (key.length + (localStorage.getItem(key)?.length || 0)) * 2;
  }
  const kb = total / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

/* ================================================================
   THEME ENGINE — injects CSS variables for light/dark
   ================================================================ */

function injectThemeStyles(accentColorKey) {
  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }
  const accent = ACCENT_COLORS.find((a) => a.key === accentColorKey) || ACCENT_COLORS[2];
  const accentRgb = hexToRgb(accent.color);
  styleEl.textContent = `
    :root {
      --a: ${accent.color};
      --a-rgb: ${accentRgb};
      --a-light: ${accent.light};
      --bg: #f8fafc;
      --card: #ffffff;
      --card-border: #e2e8f0;
      --text: #0f172a;
      --text-secondary: #64748b;
      --text-muted: #94a3b8;
      --input-bg: #ffffff;
      --input-border: #e2e8f0;
      --input-focus: ${accent.color}33;
      --hover-bg: #f1f5f9;
      --sidebar-bg: #ffffff;
      --sidebar-active: ${accent.light};
      --sidebar-text: #64748b;
      --sidebar-active-text: #0f172a;
      --toggle-bg: #cbd5e1;
      --toggle-active: ${accent.color};
      --toggle-thumb: #ffffff;
      --danger: #ef4444;
      --danger-light: #fef2f2;
      --danger-border: #fecaca;
      --success: #22c55e;
      --success-light: #f0fdf4;
      --success-border: #bbf7d0;
      --warning: #f59e0b;
      --warning-light: #fffbeb;
      --glass-bg: rgba(255,255,255,0.72);
      --glass-border: rgba(226,232,240,0.6);
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.05);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04);
      --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.04);
      --badge-text: ${accent.color};
      --badge-bg: ${accent.light};
    }
    .dark {
      --bg: #0f172a;
      --card: #1e293b;
      --card-border: #334155;
      --text: #f1f5f9;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --input-bg: #1e293b;
      --input-border: #334155;
      --input-focus: ${accent.color}44;
      --hover-bg: #334155;
      --sidebar-bg: #1e293b;
      --sidebar-active: ${accent.color}22;
      --sidebar-text: #94a3b8;
      --sidebar-active-text: #f1f5f9;
      --toggle-bg: #475569;
      --toggle-active: ${accent.color};
      --toggle-thumb: #ffffff;
      --danger: #ef4444;
      --danger-light: #450a0a;
      --danger-border: #7f1d1d;
      --success: #22c55e;
      --success-light: #052e16;
      --success-border: #166534;
      --warning: #f59e0b;
      --warning-light: #451a03;
      --glass-bg: rgba(30,41,59,0.8);
      --glass-border: rgba(51,65,85,0.6);
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.3);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.4), 0 2px 4px -2px rgba(0,0,0,0.3);
      --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.5), 0 4px 6px -4px rgba(0,0,0,0.3);
      --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.4);
      --badge-text: ${accent.color};
      --badge-bg: ${accent.color}22;
    }
    html.dark .settings-page { background: var(--bg); color: var(--text); }
    html.dark .settings-card { background: var(--card); border-color: var(--card-border); }
    html.dark .settings-input { background: var(--input-bg); border-color: var(--input-border); color: var(--text); }
    html.dark .settings-input:focus { border-color: ${accent.color}; box-shadow: 0 0 0 3px ${accent.color}44; }
    html.dark .settings-select { background: var(--input-bg); border-color: var(--input-border); color: var(--text); }
    @keyframes settingsFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes settingsSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes settingsScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes settingsShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes settingsPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .animate-settings-fade { animation: settingsFadeIn 0.3s ease-out both; }
    .animate-settings-slide { animation: settingsSlideUp 0.35s ease-out both; }
    .animate-settings-scale { animation: settingsScaleIn 0.25s ease-out both; }
    .settings-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%); background-size: 200% 100%; animation: settingsShimmer 1.5s ease-in-out infinite; }
  `;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '16,185,129';
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  }
}

/* ================================================================
   UTILITY COMPONENTS
   ================================================================ */

/* ─── Premium Toggle ─── */
function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative w-11 h-6 rounded-full shrink-0 transition-all duration-300 ease-out disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--a)] focus-visible:ring-offset-2"
      style={{
        backgroundColor: checked ? 'var(--toggle-active)' : 'var(--toggle-bg)',
        boxShadow: checked ? '0 0 12px var(--a)' : 'none',
      }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-300 ease-out"
        style={{
          backgroundColor: 'var(--toggle-thumb)',
          transform: checked ? 'translateX(20px)' : 'translateX(0)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
}

/* ─── Toast ─── */
function Toast({ show, type, message, onClose }) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onClose, 3500);
      return () => clearTimeout(t);
    }
  }, [show, onClose]);

  if (!show) return null;
  const isSuccess = type === 'success';
  return (
    <div className="fixed top-5 right-5 z-[999] animate-settings-slide">
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border backdrop-blur-sm min-w-[300px]"
        style={{
          background: isSuccess ? 'var(--success-light)' : 'var(--danger-light)',
          borderColor: isSuccess ? 'var(--success-border)' : 'var(--danger-border)',
          color: isSuccess ? '#166534' : '#991b1b',
        }}
      >
        {isSuccess ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
        <span className="text-[13px] font-semibold flex-1">{message}</span>
        <button
          onClick={onClose}
          className="opacity-40 hover:opacity-100 transition-opacity shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─── Confirm Modal ─── */
function ConfirmModal({ open, title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading, icon: Icon }) {
  useEffect(() => {
    if (open) {
      const handler = (e) => { if (e.key === 'Escape') onCancel(); };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="animate-settings-scale rounded-2xl shadow-xl border max-w-sm w-full p-6 space-y-4"
        style={{ background: 'var(--card)', borderColor: 'var(--card-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {Icon && (
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{ background: 'var(--danger-light)' }}>
            <Icon size={24} style={{ color: 'var(--danger)' }} />
          </div>
        )}
        <div className="text-center">
          <h3 className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
          <p className="text-[13px] mt-1.5" style={{ color: 'var(--text-secondary)' }}>{message}</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 h-9 rounded-xl text-[12px] font-semibold border transition-all active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'var(--card)', borderColor: 'var(--card-border)', color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 h-9 rounded-xl text-[12px] font-semibold text-white transition-all flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-50"
            style={{ background: confirmClass === 'danger' ? 'var(--danger)' : 'var(--a)' }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Section Card ─── */
function Card({ title, desc, icon: Icon, children, accent, noPadding }) {
  const cardCls = `rounded-2xl border transition-all duration-200 ${noPadding ? '' : 'p-5 sm:p-6'} space-y-5`;
  return (
    <div
      className={cardCls}
      style={{
        background: 'var(--card)',
        borderColor: accent ? 'var(--a)' : 'var(--card-border)',
        boxShadow: accent ? `0 0 0 1px ${ACCENT_COLORS.find(a => a.key === 'emerald')?.color}33` : 'var(--shadow-sm)',
      }}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--a-light)' }}>
            <Icon size={16} style={{ color: 'var(--a)' }} />
          </div>
        )}
        <div>
          <h3 className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>{title}</h3>
          {desc && <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

/* ─── Input Field ─── */
function InputField({ label, value, onChange, placeholder, type = 'text', error, icon: Icon, ...props }) {
  const [focused, setFocused] = useState(false);
  const inputId = `field-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
            <Icon size={14} />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full h-10 px-3.5 text-[13px] rounded-xl border outline-none transition-all duration-200 placeholder:text-[var(--text-muted)]"
          style={{
            background: 'var(--input-bg)',
            borderColor: error ? 'var(--danger)' : focused ? 'var(--a)' : 'var(--input-border)',
            color: 'var(--text)',
            boxShadow: focused ? `0 0 0 3px var(--input-focus)` : 'none',
            paddingLeft: Icon ? '36px' : '14px',
          }}
          {...props}
        />
      </div>
      {error && <p className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

/* ─── Select Field ─── */
function SelectField({ label, value, onChange, options, icon: Icon }) {
  const inputId = `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-[12px] font-semibold mb-1.5" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10" style={{ color: 'var(--text-muted)' }}>
            <Icon size={14} />
          </div>
        )}
        <select
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 px-3.5 text-[13px] rounded-xl border outline-none transition-all duration-200 cursor-pointer appearance-none"
          style={{
            background: 'var(--input-bg)',
            borderColor: 'var(--input-border)',
            color: 'var(--text)',
            paddingLeft: Icon ? '36px' : '14px',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '36px',
          }}
        >
          {options.map((opt) => (
            <option key={opt.value || opt} value={opt.value || opt}>
              {opt.label || opt}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

/* ─── Separator ─── */
function Separator() {
  return <div className="h-px w-full" style={{ background: 'var(--card-border)' }} />;
}

/* ================================================================
   1) GENERAL TAB
   ================================================================ */

function TabGeneral({ data, onChange }) {
  const [errors, setErrors] = useState({});

  const validate = (field, value) => {
    const errs = { ...errors };
    if (field === 'academyName' && !value.trim()) errs.academyName = 'Academy name is required';
    else if (field === 'academyName') delete errs.academyName;
    if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errs.email = 'Invalid email format';
    else if (field === 'email') delete errs.email;
    if (field === 'phone' && value && !/^[\d\s\-\+\(\)]{7,}$/.test(value)) errs.phone = 'Invalid phone number';
    else if (field === 'phone') delete errs.phone;
    setErrors(errs);
  };

  const update = (field, value) => {
    onChange({ [field]: value });
    validate(field, value);
  };

  return (
    <Card title="General" desc="Manage your academy's basic information" icon={Building2}>
      <InputField
        label="Academy Name"
        value={data.academyName}
        onChange={(v) => update('academyName', v)}
        placeholder="LevelUp Academy"
        error={errors.academyName}
        icon={Building2}
      />
      <InputField
        label="Academy Address"
        value={data.academyAddress}
        onChange={(v) => onChange({ academyAddress: v })}
        placeholder="Tashkent, Amir Temur str. 108"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Phone"
          value={data.phone}
          onChange={(v) => update('phone', v)}
          placeholder="+998 90 123 45 67"
          error={errors.phone}
        />
        <InputField
          label="Email"
          type="email"
          value={data.email}
          onChange={(v) => update('email', v)}
          placeholder="info@levelup.uz"
          error={errors.email}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Website"
          value={data.website}
          onChange={(v) => onChange({ website: v })}
          placeholder="https://levelup.uz"
        />
        <SelectField
          label="Timezone"
          value={data.timezone}
          onChange={(v) => onChange({ timezone: v })}
          options={TIMEZONES}
          icon={Clock}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SelectField
          label="Language"
          value={data.language}
          onChange={(v) => onChange({ language: v })}
          options={LANGUAGES.map((l) => ({ value: l.value, label: `${l.native} — ${l.label}` }))}
          icon={Globe}
        />
        <SelectField
          label="Currency"
          value={data.currency}
          onChange={(v) => onChange({ currency: v })}
          options={CURRENCIES}
        />
        <SelectField
          label="Date Format"
          value={data.dateFormat}
          onChange={(v) => onChange({ dateFormat: v })}
          options={DATE_FORMATS}
          icon={Calendar}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label="Time Format"
          value={data.timeFormat}
          onChange={(v) => onChange({ timeFormat: v })}
          options={[
            { value: '24h', label: '24-hour (14:30)' },
            { value: '12h', label: '12-hour (2:30 PM)' },
          ]}
          icon={Clock}
        />
      </div>
    </Card>
  );
}

/* ================================================================
   2) APPEARANCE TAB
   ================================================================ */

function TabAppearance({ data, onChange }) {
  const accent = ACCENT_COLORS.find((a) => a.key === data.accentColor) || ACCENT_COLORS[2];

  return (
    <div className="space-y-5 animate-settings-fade">
      {/* Theme */}
      <Card title="Theme" desc="Choose your preferred color mode" icon={Palette}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEME_OPTIONS.map(({ key, label, icon: Icon, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ theme: key })}
              className="relative flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98]"
              style={{
                borderColor: data.theme === key ? 'var(--a)' : 'var(--card-border)',
                background: data.theme === key ? 'var(--a-light)' : 'var(--card)',
                boxShadow: data.theme === key ? `0 0 0 1px ${accent.color}33` : 'var(--shadow-sm)',
              }}
            >
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: data.theme === key ? accent.light : 'var(--hover-bg)' }}
              >
                <Icon size={22} style={{ color: data.theme === key ? accent.color : 'var(--text-muted)' }} />
              </div>
              <div className="text-center">
                <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{label}</div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</div>
              </div>
              {data.theme === key && (
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: accent.color }}>
                  <Check size={11} className="text-white" />
                </div>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Accent Color */}
      <Card title="Accent Color" desc="Customize the primary accent color" icon={Palette}>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLORS.map(({ key, label, color, light }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ accentColor: key })}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 active:scale-[0.95]"
              style={{
                borderColor: data.accentColor === key ? color : 'var(--card-border)',
                background: data.accentColor === key ? light : 'transparent',
                minWidth: 72,
              }}
            >
              <div className="w-8 h-8 rounded-full transition-transform duration-200" style={{
                background: color,
                boxShadow: data.accentColor === key ? `0 0 0 3px ${color}44, 0 0 16px ${color}33` : 'none',
                transform: data.accentColor === key ? 'scale(1.1)' : 'scale(1)',
              }} />
              <span className="text-[11px] font-semibold" style={{ color: data.accentColor === key ? color : 'var(--text-secondary)' }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Sidebar Style */}
      <Card title="Sidebar Style" desc="Choose how sidebar items look">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SIDEBAR_STYLES.map(({ key, label, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ sidebarStyle: key })}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98]"
              style={{
                borderColor: data.sidebarStyle === key ? 'var(--a)' : 'var(--card-border)',
                background: data.sidebarStyle === key ? 'var(--a-light)' : 'var(--card)',
              }}
            >
              <div className="flex gap-1 w-full mb-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-2 flex-1 rounded-sm"
                    style={{
                      background: i === 1 && data.sidebarStyle === key ? accent.color : 'var(--hover-bg)',
                      borderRadius: key === 'rounded' ? '4px' : key === 'classic' ? '2px' : '1px',
                      height: key === 'compact' ? '1.5px' : '8px',
                      marginTop: key === 'compact' ? '3px' : 0,
                    }}
                  />
                ))}
              </div>
              <div className="text-center">
                <div className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{label}</div>
                <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Card Style */}
      <Card title="Card Style" desc="Choose how cards are displayed">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CARD_STYLES.map(({ key, label, desc }) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ cardStyle: key })}
              className="p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98]"
              style={{
                borderColor: data.cardStyle === key ? 'var(--a)' : 'var(--card-border)',
                background: key === 'glass'
                  ? 'var(--glass-bg)'
                  : data.cardStyle === key ? 'var(--a-light)' : 'var(--card)',
                backdropFilter: key === 'glass' ? 'blur(8px)' : 'none',
                boxShadow: key === 'soft' ? 'var(--shadow-md)' : 'none',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg" style={{
                  background: data.cardStyle === key ? accent.color : 'var(--hover-bg)',
                  border: key === 'bordered' ? `2px solid ${accent.color}` : 'none',
                }} />
                <div>
                  <div className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>{label}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Density */}
      <Card title="Density" desc="Control the spacing of UI elements">
        <div className="flex gap-3">
          {['comfortable', 'compact'].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => onChange({ density: key })}
              className="flex-1 p-4 rounded-2xl border-2 transition-all duration-200 active:scale-[0.98]"
              style={{
                borderColor: data.density === key ? 'var(--a)' : 'var(--card-border)',
                background: data.density === key ? 'var(--a-light)' : 'var(--card)',
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-1.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-sm"
                      style={{
                        width: key === 'compact' ? 6 : 12,
                        height: key === 'compact' ? 6 : 12,
                        background: data.density === key ? accent.color : 'var(--hover-bg)',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[12px] font-bold capitalize" style={{ color: 'var(--text)' }}>{key}</span>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Preview */}
      <Card title="Live Preview" desc="See how your selections look" icon={Eye}>
        <div
          className="rounded-xl overflow-hidden border"
          style={{
            background: 'var(--bg)',
            borderColor: 'var(--card-border)',
          }}
        >
          <div className="flex h-36">
            <div
              className="w-1/4 p-2 space-y-2"
              style={{
                background: data.theme === 'dark' ? '#1e293b' : '#f8fafc',
                borderRadius: data.sidebarStyle === 'rounded' ? '8px 0 0 0' : data.sidebarStyle === 'classic' ? '4px 0 0 0' : '0',
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-sm"
                  style={{
                    height: data.density === 'compact' ? 4 : 8,
                    width: i === 1 ? '80%' : '60%',
                    background: i === 1 ? accent.color : 'var(--toggle-bg)',
                    borderRadius: data.sidebarStyle === 'rounded' ? '6px' : '2px',
                  }}
                />
              ))}
            </div>
            <div className="flex-1 p-3 space-y-2">
              <div className="flex justify-between">
                <div className="h-2 w-1/3 rounded" style={{ background: 'var(--toggle-bg)' }} />
                <div className="w-5 h-5 rounded-full" style={{ background: accent.color, opacity: 0.3 }} />
              </div>
              <div
                className="flex-1 rounded-lg p-2"
                style={{
                  background: data.cardStyle === 'glass' ? 'var(--glass-bg)' : 'var(--card)',
                  border: data.cardStyle === 'bordered' ? `1px solid ${accent.color}33` : data.cardStyle === 'soft' ? '1px solid var(--card-border)' : 'none',
                  backdropFilter: data.cardStyle === 'glass' ? 'blur(4px)' : 'none',
                  boxShadow: data.cardStyle === 'soft' ? 'var(--shadow-sm)' : 'none',
                }}
              >
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-md" style={{ background: accent.color }} />
                  <div className="flex-1 space-y-1">
                    <div className="h-1.5 w-2/3 rounded" style={{ background: 'var(--toggle-bg)' }} />
                    <div className="h-1 w-1/2 rounded" style={{ background: 'var(--toggle-bg)', opacity: 0.5 }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ================================================================
   3) NOTIFICATIONS TAB
   ================================================================ */

const NOTIF_ITEMS = [
  { key: 'notifEmail', label: 'Email Notifications', desc: 'Receive updates via email', icon: MessageSquare },
  { key: 'notifBrowser', label: 'Browser Notifications', desc: 'Get push notifications in browser', icon: Bell },
  { key: 'notifStudentRegistrations', label: 'Student Registrations', desc: 'When new students enroll', icon: UserPlus },
  { key: 'notifPaymentAlerts', label: 'Payment Alerts', desc: 'When payments are received or overdue', icon: CreditCard },
  { key: 'notifAttendanceAlerts', label: 'Attendance Alerts', desc: 'When attendance is marked or missed', icon: User },
  { key: 'notifMessages', label: 'Message Notifications', desc: 'When you receive new messages', icon: MessageSquare },
  { key: 'notifReminders', label: 'Reminder Notifications', desc: 'Schedule reminders and alerts', icon: Clock },
];

function TabNotifications({ data, onChange }) {
  return (
    <Card title="Notifications" desc="Manage your notification preferences" icon={Bell}>
      <div className="space-y-1">
        {NOTIF_ITEMS.map(({ key, label, desc, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 cursor-pointer group"
            style={{ background: data[key] ? 'transparent' : 'transparent' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            onClick={() => onChange({ [key]: !data[key] })}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--a-light)' }}>
                <Icon size={15} style={{ color: data[key] ? 'var(--a)' : 'var(--text-muted)' }} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>{label}</div>
                <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </div>
            <div className="shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
              <Toggle checked={data[key]} onChange={(v) => onChange({ [key]: v })} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ================================================================
   4) DASHBOARD PREFERENCES TAB
   ================================================================ */

const DASH_WIDGETS = [
  { key: 'dashQuickStats', label: 'Quick Stats', desc: 'Show summary cards', icon: Activity },
  { key: 'dashCharts', label: 'Charts', desc: 'Display revenue and attendance charts', icon: TrendingUp },
  { key: 'dashRecentActivity', label: 'Recent Activity', desc: 'Show latest actions and events', icon: Activity },
  { key: 'dashCalendar', label: 'Calendar', desc: 'Display upcoming events', icon: Calendar },
  { key: 'dashRevenueWidget', label: 'Revenue Widget', desc: 'Show revenue summary', icon: CreditCard },
  { key: 'dashTopStudents', label: 'Top Students', desc: 'Show top performing students', icon: Star },
  { key: 'dashQuickActions', label: 'Quick Actions', desc: 'Show shortcut action buttons', icon: Zap },
];

function TabDashboard({ data, onChange }) {
  return (
    <Card title="Dashboard Preferences" desc="Customize which widgets appear on your dashboard" icon={LayoutDashboard}>
      <div className="space-y-1">
        {DASH_WIDGETS.map(({ key, label, desc, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            onClick={() => onChange({ [key]: !data[key] })}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--a-light)' }}>
                <Icon size={15} style={{ color: data[key] ? 'var(--a)' : 'var(--text-muted)' }} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>{label}</div>
                <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </div>
            <div className="shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
              <Toggle checked={data[key]} onChange={(v) => onChange({ [key]: v })} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ================================================================
   5) SECURITY TAB
   ================================================================ */

const LOGIN_HISTORY = [
  { date: '2026-07-18 09:32', device: 'Chrome / Windows', location: 'Tashkent, UZ', ip: '213.230.68.xxx' },
  { date: '2026-07-17 18:15', device: 'Safari / macOS', location: 'Tashkent, UZ', ip: '213.230.68.xxx' },
  { date: '2026-07-16 08:45', device: 'Firefox / Windows', location: 'Tashkent, UZ', ip: '213.230.68.xxx' },
  { date: '2026-07-15 14:20', device: 'Chrome / Android', location: 'Tashkent, UZ', ip: '84.54.71.xxx' },
  { date: '2026-07-14 11:00', device: 'Chrome / Windows', location: 'Tashkent, UZ', ip: '213.230.68.xxx' },
];

const DEVICES = [
  { name: 'Windows PC · Chrome', lastActive: '2 min ago', current: true },
  { name: 'iPhone 15 · Safari', lastActive: '3 hours ago', current: false },
  { name: 'MacBook Pro · Chrome', lastActive: '2 days ago', current: false },
];

function TabSecurity({ data, onChange }) {
  const [showPw, setShowPw] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDevices, setShowDevices] = useState(false);

  return (
    <div className="space-y-5 animate-settings-fade">
      <Card title="Security" desc="Manage your account security settings" icon={Shield}>
        <div className="space-y-1">
          {/* Password Visibility */}
          <div
            className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            onClick={() => onChange({ passwordVisibility: !data.passwordVisibility })}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--a-light)' }}>
                <Eye size={15} style={{ color: 'var(--a)' }} />
              </div>
              <div>
                <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Password Visibility</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Show/hide password toggle on login forms</div>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}><Toggle checked={data.passwordVisibility} onChange={(v) => onChange({ passwordVisibility: v })} /></div>
          </div>

          {/* Auto Lock */}
          <div
            className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            onClick={() => onChange({ autoLock: !data.autoLock })}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--a-light)' }}>
                <LogIn size={15} style={{ color: 'var(--a)' }} />
              </div>
              <div>
                <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Auto Lock</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Automatically lock after inactivity</div>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}><Toggle checked={data.autoLock} onChange={(v) => onChange({ autoLock: v })} /></div>
          </div>

          {/* Remember Login */}
          <div
            className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            onClick={() => onChange({ rememberLogin: !data.rememberLogin })}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--a-light)' }}>
                <LogIn size={15} style={{ color: 'var(--a)' }} />
              </div>
              <div>
                <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Remember Login</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Stay signed in across sessions</div>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}><Toggle checked={data.rememberLogin} onChange={(v) => onChange({ rememberLogin: v })} /></div>
          </div>

          {/* Session Timeout */}
          <div className="p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Session Timeout</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Auto logout after inactivity</div>
              </div>
            </div>
            <div className="flex gap-2">
              {['15', '30', '60', '120', '480'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => onChange({ sessionTimeout: val })}
                  className="flex-1 py-2 rounded-xl border text-[12px] font-semibold transition-all active:scale-[0.97]"
                  style={{
                    background: data.sessionTimeout === val ? 'var(--a-light)' : 'var(--card)',
                    borderColor: data.sessionTimeout === val ? 'var(--a)' : 'var(--card-border)',
                    color: data.sessionTimeout === val ? 'var(--a)' : 'var(--text-secondary)',
                  }}
                >
                  {val === '480' ? '8h' : `${val}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Two Factor */}
          <div
            className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            onClick={() => onChange({ twoFactor: !data.twoFactor })}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--a-light)' }}>
                <Shield size={15} style={{ color: 'var(--a)' }} />
              </div>
              <div>
                <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Two-Factor Auth</div>
                <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Extra security layer (demo)</div>
              </div>
            </div>
            <div onClick={(e) => e.stopPropagation()}><Toggle checked={data.twoFactor} onChange={(v) => onChange({ twoFactor: v })} /></div>
          </div>
        </div>
      </Card>

      {/* Login History */}
      <Card title="Login History" desc="Recent sign-in activity" icon={Clock}>
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between w-full p-3 rounded-xl transition-all"
          style={{ background: 'var(--hover-bg)' }}
        >
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{showHistory ? 'Hide' : 'Show'} recent logins</span>
          <ChevronRight size={16} style={{
            color: 'var(--text-muted)',
            transform: showHistory ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }} />
        </button>
        {showHistory && (
          <div className="space-y-2 animate-settings-fade">
            {LOGIN_HISTORY.map((entry, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl text-[12px]" style={{ background: 'var(--hover-bg)' }}>
                <div className="min-w-0">
                  <div className="font-semibold truncate" style={{ color: 'var(--text)' }}>{entry.device}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{entry.location} · {entry.ip}</div>
                </div>
                <div className="shrink-0 ml-3 text-[11px]" style={{ color: 'var(--text-muted)' }}>{entry.date}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Device List */}
      <Card title="Active Devices" desc="Devices currently signed into your account" icon={Smartphone}>
        <button
          type="button"
          onClick={() => setShowDevices(!showDevices)}
          className="flex items-center justify-between w-full p-3 rounded-xl transition-all"
          style={{ background: 'var(--hover-bg)' }}
        >
          <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{showDevices ? 'Hide' : 'Show'} active devices</span>
          <ChevronRight size={16} style={{
            color: 'var(--text-muted)',
            transform: showDevices ? 'rotate(90deg)' : 'rotate(0)',
            transition: 'transform 0.2s',
          }} />
        </button>
        {showDevices && (
          <div className="space-y-2 animate-settings-fade">
            {DEVICES.map((device, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl text-[12px]" style={{ background: 'var(--hover-bg)' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--a-light)' }}>
                    <Monitor size={14} style={{ color: 'var(--a)' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate" style={{ color: 'var(--text)' }}>
                      {device.name}
                      {device.current && (
                        <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'var(--a)', color: '#fff' }}>
                          Current
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>Last active: {device.lastActive}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ================================================================
   6) LOCALIZATION TAB
   ================================================================ */

function TabLocalization({ data, onChange }) {
  return (
    <Card title="Localization" desc="Configure regional preferences" icon={Globe}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label="Language"
          value={data.locLanguage}
          onChange={(v) => onChange({ locLanguage: v })}
          options={LANGUAGES.map((l) => ({ value: l.value, label: `${l.native} — ${l.label}` }))}
          icon={Languages}
        />
        <SelectField
          label="Timezone"
          value={data.locTimezone}
          onChange={(v) => onChange({ locTimezone: v })}
          options={TIMEZONES}
          icon={Clock}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label="Currency"
          value={data.locCurrency}
          onChange={(v) => onChange({ locCurrency: v })}
          options={CURRENCIES}
        />
        <SelectField
          label="Date Format"
          value={data.locDateFormat}
          onChange={(v) => onChange({ locDateFormat: v })}
          options={DATE_FORMATS}
          icon={CalendarDays}
        />
      </div>
      <SelectField
        label="First Day of Week"
        value={data.locFirstDayOfWeek}
        onChange={(v) => onChange({ locFirstDayOfWeek: v })}
        options={[
          { value: 'monday', label: 'Monday' },
          { value: 'sunday', label: 'Sunday' },
          { value: 'saturday', label: 'Saturday' },
        ]}
      />
    </Card>
  );
}

/* ================================================================
   7) ACCESSIBILITY TAB
   ================================================================ */

const ACCESS_ITEMS = [
  { key: 'largeText', label: 'Large Text', desc: 'Increase font size for better readability', icon: Type },
  { key: 'reduceMotion', label: 'Reduce Motion', desc: 'Minimize animations and transitions', icon: Activity },
  { key: 'highContrast', label: 'High Contrast', desc: 'Increase color contrast for better visibility', icon: Contrast },
  { key: 'keyboardNav', label: 'Keyboard Navigation', desc: 'Navigate using Tab and keyboard shortcuts', icon: Keyboard },
  { key: 'focusHighlight', label: 'Focus Highlight', desc: 'Show clear focus indicators on all elements', icon: CircleDot },
];

function TabAccessibility({ data, onChange }) {
  return (
    <Card title="Accessibility" desc="Make the interface work better for you" icon={Accessibility}>
      <div className="space-y-1">
        {ACCESS_ITEMS.map(({ key, label, desc, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 cursor-pointer"
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            onClick={() => onChange({ [key]: !data[key] })}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--a-light)' }}>
                <Icon size={15} style={{ color: data[key] ? 'var(--a)' : 'var(--text-muted)' }} />
              </div>
              <div className="min-w-0">
                <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--text)' }}>{label}</div>
                <div className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </div>
            <div className="shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
              <Toggle checked={data[key]} onChange={(v) => onChange({ [key]: v })} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ================================================================
   8) BACKUP TAB
   ================================================================ */

function TabBackup({ data, onReset, onImport, onToast }) {
  const fileRef = useRef(null);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [importError, setImportError] = useState('');

  const handleExport = () => {
    setExportLoading(true);
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `levelup-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onToast('success', 'Settings exported successfully');
    } catch {
      onToast('error', 'Failed to export settings');
    } finally {
      setExportLoading(false);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setImportError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result);
        const merged = { ...DEFAULTS, ...parsed };
        onImport(merged);
        onToast('success', `Settings imported from ${file.name}`);
      } catch {
        setImportError('Invalid JSON file');
        onToast('error', 'Failed to import settings');
      } finally {
        setImportLoading(false);
      }
    };
    reader.onerror = () => {
      setImportError('Failed to read file');
      setImportLoading(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    setResetting(true);
    await new Promise((r) => setTimeout(r, 800));
    setResetting(false);
    setResetModal(false);
    onReset();
    onToast('success', 'Settings reset to defaults');
  };

  return (
    <>
      <Card title="Backup & Restore" desc="Export, import, or reset your settings" icon={HardDrive}>
        {/* Export */}
        <div
          className="flex items-center justify-between p-4 rounded-xl transition-all"
          style={{ background: 'var(--hover-bg)' }}
        >
          <div>
            <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Export Settings</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Download all settings as JSON</div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={exportLoading}
            className="h-9 px-4 rounded-xl text-[12px] font-semibold border transition-all flex items-center gap-2 active:scale-[0.97] disabled:opacity-50"
            style={{ background: 'var(--card)', borderColor: 'var(--card-border)', color: 'var(--text)' }}
          >
            {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export
          </button>
        </div>

        {/* Import */}
        <div
          className="flex items-center justify-between p-4 rounded-xl transition-all"
          style={{ background: 'var(--hover-bg)' }}
        >
          <div>
            <div className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>Import Settings</div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Load settings from a JSON file</div>
            {importError && <div className="text-[11px] mt-1" style={{ color: 'var(--danger)' }}>{importError}</div>}
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={importLoading}
              className="h-9 px-4 rounded-xl text-[12px] font-semibold border transition-all flex items-center gap-2 active:scale-[0.97] disabled:opacity-50"
              style={{ background: 'var(--card)', borderColor: 'var(--card-border)', color: 'var(--text)' }}
            >
              {importLoading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              Import
            </button>
          </div>
        </div>

        <Separator />

        {/* Reset */}
        <div
          className="flex items-center justify-between p-4 rounded-xl transition-all"
          style={{ background: 'var(--danger-light)', border: '1px solid var(--danger-border)' }}
        >
          <div>
            <div className="text-[13px] font-semibold" style={{ color: 'var(--danger)' }}>Reset All Settings</div>
            <div className="text-[11px]" style={{ color: 'var(--danger)', opacity: 0.7 }}>Restore to factory defaults</div>
          </div>
          <button
            type="button"
            onClick={() => setResetModal(true)}
            className="h-9 px-4 rounded-xl text-[12px] font-bold text-white transition-all flex items-center gap-2 active:scale-[0.97]"
            style={{ background: 'var(--danger)' }}
          >
            <Trash2 size={14} />
            Reset
          </button>
        </div>
      </Card>

      <ConfirmModal
        open={resetModal}
        title="Reset All Settings?"
        message="This will restore all settings to their default values. This action cannot be undone."
        confirmLabel="Reset"
        confirmClass="danger"
        icon={AlertTriangle}
        loading={resetting}
        onConfirm={handleReset}
        onCancel={() => setResetModal(false)}
      />
    </>
  );
}

/* ================================================================
   9) ABOUT TAB
   ================================================================ */

const APP_VERSION = '1.0.0';
const FRONTEND_VERSION = '0.1.0';
const REACT_VERSION = React.version;

function TabAbout({ lastSaved }) {
  const [storageSize, setStorageSize] = useState(getStorageSize());
  const [savingEnv, setSavingEnv] = useState(false);

  useEffect(() => {
    setStorageSize(getStorageSize());
    const interval = setInterval(() => setStorageSize(getStorageSize()), 5000);
    return () => clearInterval(interval);
  }, []);

  const env = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'Development'
    : window.location.hostname.includes('vercel.app')
      ? 'Preview'
      : 'Production';

  const infoItems = [
    { label: 'App Version', value: APP_VERSION, icon: Package },
    { label: 'Environment', value: env, icon: Server },
    { label: 'Frontend Version', value: FRONTEND_VERSION, icon: Package },
    { label: 'React Version', value: REACT_VERSION, icon: Package },
    { label: 'Last Saved', value: lastSaved ? new Date(lastSaved).toLocaleString() : 'Not saved yet', icon: Clock },
    { label: 'Storage Used', value: storageSize, icon: HardDrive },
  ];

  const handleClearCache = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setStorageSize(getStorageSize());
      window.location.reload();
    } catch { /* ignore */ }
  };

  return (
    <Card title="About" desc="Application information and version details" icon={Info}>
      <div className="space-y-1">
        {infoItems.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center justify-between p-3.5 rounded-xl"
            style={{ background: 'var(--hover-bg)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--a-light)' }}>
                <Icon size={14} style={{ color: 'var(--a)' }} />
              </div>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
            </div>
            <span className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{value}</span>
          </div>
        ))}
      </div>

      <Separator />

      <div className="flex items-center justify-between p-3.5 rounded-xl" style={{ background: 'var(--warning-light)' }}>
        <div>
          <div className="text-[13px] font-semibold" style={{ color: 'var(--warning)' }}>Clear Local Storage</div>
          <div className="text-[11px]" style={{ color: 'var(--warning)', opacity: 0.7 }}>Reset all locally stored data</div>
        </div>
        <button
          type="button"
          onClick={handleClearCache}
          className="h-9 px-4 rounded-xl text-[12px] font-semibold transition-all flex items-center gap-2 active:scale-[0.97]"
          style={{ background: 'var(--card)', border: '1px solid var(--card-border)', color: 'var(--text)' }}
        >
          <RefreshCw size={14} />
          Clear
        </button>
      </div>
    </Card>
  );
}

/* ================================================================
   SKELETON LOADING STATE
   ================================================================ */

function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-settings-fade">
      <div className="flex gap-4">
        <div className="w-[220px] space-y-2 hidden lg:block">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="h-9 rounded-xl settings-shimmer" />
          ))}
        </div>
        <div className="flex-1 space-y-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl border settings-shimmer" style={{ borderColor: 'var(--card-border)' }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN: AdminSettings
   ================================================================ */

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [data, setData] = useState(null);
  const [savedData, setSavedData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, type: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef(null);

  const isDirty = useMemo(() => {
    if (!data || !savedData) return false;
    return JSON.stringify(data) !== JSON.stringify(savedData);
  }, [data, savedData]);

  const toastRef = useCallback((type, message) => {
    setToast({ show: true, type, message });
  }, []);

  // Initialize: load from localStorage + inject theme
  useEffect(() => {
    const loaded = loadFromStorage();
    setData({ ...loaded });
    setSavedData({ ...loaded });
    injectThemeStyles(loaded.accentColor);
    applyTheme(loaded.theme);
    setTimeout(() => setLoading(false), 400);
    setInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-inject theme when accent color changes
  useEffect(() => {
    if (!initialized || !data) return;
    injectThemeStyles(data.accentColor);
  }, [data?.accentColor, initialized]);

  // Apply theme when it changes
  useEffect(() => {
    if (!initialized || !data) return;
    applyTheme(data.theme);
  }, [data?.theme, initialized]);

  // Listen for system theme changes
  useEffect(() => {
    if (data?.theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [data?.theme]);

  // beforeunload warning for unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const update = useCallback((patch) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    const ok = saveToStorage(data);
    if (ok) {
      setSavedData({ ...data });
      setToast({ show: true, type: 'success', message: 'All settings saved successfully' });
    } else {
      setToast({ show: true, type: 'error', message: 'Failed to save settings' });
    }
    setSaving(false);
  };

  const handleReset = () => {
    const defaults = { ...DEFAULTS };
    setData(defaults);
    setSavedData(defaults);
    saveToStorage(defaults);
    injectThemeStyles(defaults.accentColor);
    applyTheme(defaults.theme);
    setToast({ show: true, type: 'success', message: 'Settings reset to defaults' });
  };

  const handleImport = (imported) => {
    setData(imported);
    saveToStorage(imported);
    setSavedData(imported);
    injectThemeStyles(imported.accentColor);
    applyTheme(imported.theme);
  };

  if (loading) {
    return (
      <div className="pb-8" style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="mb-8 pt-6">
            <div className="h-8 w-48 rounded-xl settings-shimmer" />
            <div className="h-4 w-64 rounded-xl settings-shimmer mt-3" />
          </div>
          <SettingsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page pb-8 min-h-screen transition-colors duration-300" style={{
      background: 'var(--bg)',
      color: 'var(--text)',
    }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* ─── Header ─── */}
        <div className="sticky top-0 z-40 pt-5 pb-4 mb-2 backdrop-blur-xl" style={{
          background: 'var(--bg)',
          borderBottom: isDirty ? '1px solid var(--a-light)' : '1px solid transparent',
          transition: 'border-color 0.3s',
        }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
                Settings
              </h1>
              <p className="text-[13px] mt-1" style={{ color: 'var(--text-muted)' }}>
                Manage your workspace preferences
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isDirty && (
                <span className="text-[11px] font-semibold px-3 py-1.5 rounded-full animate-settings-fade" style={{
                  background: 'var(--warning-light)',
                  color: 'var(--warning)',
                }}>
                  Unsaved changes
                </span>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="h-9 px-4 rounded-xl text-[12px] font-semibold border transition-all flex items-center gap-2 active:scale-[0.97] hover:shadow-sm"
                style={{
                  background: 'var(--card)',
                  borderColor: 'var(--card-border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <RotateCcw size={14} />
                <span className="hidden sm:inline">Reset</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="h-9 px-5 rounded-xl text-[12px] font-semibold text-white transition-all flex items-center gap-2 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
                style={{ background: 'var(--a)' }}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* ─── Body ─── */}
        <div className="flex flex-col lg:flex-row gap-6 mt-5">
          {/* Sidebar Navigation */}
          <nav className="lg:w-[220px] shrink-0">
            <div
              className="rounded-2xl border p-1.5 flex lg:flex-col gap-0.5 overflow-x-auto scrollbar-thin"
              style={{
                background: 'var(--card)',
                borderColor: 'var(--card-border)',
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {TABS.map(({ key, label, icon: Icon }) => {
                const isTabActive = activeTab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all duration-200 whitespace-nowrap shrink-0 active:scale-[0.98]"
                    style={{
                      background: isTabActive ? 'var(--sidebar-active)' : 'transparent',
                      color: isTabActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                    }}
                  >
                    {isTabActive && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full hidden lg:block"
                        style={{ background: 'var(--a)' }}
                      />
                    )}
                    <Icon size={15} className="shrink-0" />
                    <span className="hidden lg:inline">{label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Content Area */}
          <main className="flex-1 min-w-0" key={activeTab}>
            <div className="animate-settings-slide">
              {activeTab === 'general' && <TabGeneral data={data} onChange={update} />}
              {activeTab === 'appearance' && <TabAppearance data={data} onChange={update} />}
              {activeTab === 'notifications' && <TabNotifications data={data} onChange={update} />}
              {activeTab === 'dashboard' && <TabDashboard data={data} onChange={update} />}
              {activeTab === 'security' && <TabSecurity data={data} onChange={update} />}
              {activeTab === 'localization' && <TabLocalization data={data} onChange={update} />}
              {activeTab === 'accessibility' && <TabAccessibility data={data} onChange={update} />}
              {activeTab === 'backup' && (
                <TabBackup
                  data={data}
                  onReset={handleReset}
                  onImport={handleImport}
                  onToast={toastRef}
                />
              )}
              {activeTab === 'about' && <TabAbout lastSaved={savedData?.lastSaved} />}
            </div>
          </main>
        </div>
      </div>

      {/* Toast */}
      <Toast
        show={toast.show}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast({ show: false, type: '', message: '' })}
      />
    </div>
  );
}
