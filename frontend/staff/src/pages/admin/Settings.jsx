import { useState, useEffect } from 'react';
import { useAuth } from '../../auth.jsx';
import { useAdminSettings, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import {
  Building2, Palette, Bell, Shield, CreditCard, Globe,
  CheckCircle2, AlertCircle, Eye, EyeOff, Moon, Sun,
  MessageSquare, Mail, Smartphone, Clock, Coins,
  FileText, Languages, MapPin, Phone, Save,
} from 'lucide-react';

/* ───────────────────── Tab definitions ───────────────────── */

const TABS = [
  { key: 'general', label: 'Общие', icon: Building2 },
  { key: 'appearance', label: 'Внешний вид', icon: Palette },
  { key: 'notifications', label: 'Уведомления', icon: Bell },
  { key: 'security', label: 'Безопасность', icon: Shield },
  { key: 'finance', label: 'Финансы', icon: CreditCard },
  { key: 'localization', label: 'Локализация', icon: Globe },
];

/* ───────────────────── Default settings ───────────────────── */

const DEFAULTS = {
  // General
  branchName: '',
  branchAddress: '',
  branchPhone: '',
  branchEmail: '',
  branchWebsite: '',
  // Appearance
  theme: 'light',
  accentColor: '#C6FF34',
  compactMode: false,
  showAvatars: true,
  // Notifications
  notifyEmail: true,
  notifyTelegram: true,
  notifySms: false,
  notifyOverduePayments: true,
  notifyNewStudents: true,
  notifyAttendance: true,
  notifyDailyReport: false,
  // Security
  twoFactorEnabled: false,
  sessionTimeout: 30,
  allowMultipleSessions: true,
  // Finance
  currency: 'UZS',
  currencySymbol: 'сўм',
  invoicePrefix: 'INV',
  autoGenerateInvoice: true,
  paymentGraceDays: 3,
  // Localization
  language: 'ru',
  dateFormat: 'DD.MM.YYYY',
  timezone: 'Asia/Tashkent',
  firstDayOfWeek: 'monday',
};

/* ───────────────────── Toggle component ───────────────────── */

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${
        checked ? 'bg-[#10B981]' : 'bg-base-300'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
        style={{ left: checked ? '22px' : '2px' }}
      />
    </button>
  );
}

/* ───────────────────── Section card ───────────────────── */

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-[var(--surface)] rounded-[16px] border border-[var(--border)] p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={18} className="text-base-content/40" />}
        <h3 className="text-[14px] font-bold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ───────────────────── Field row ───────────────────── */

function Field({ label, hint, children, horizontal }) {
  return (
    <div className={`gap-4 ${horizontal ? 'flex items-center justify-between' : 'space-y-1.5'}`}>
      <div className={horizontal ? '' : ''}>
        <label className="text-[12px] font-semibold text-base-content/70">{label}</label>
        {hint && <p className="text-[11px] text-base-content/40 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

/* ───────────────────── Input styles ───────────────────── */

const inputCls = 'input input-bordered w-full text-[13px] h-10 hover:border-[var(--green)] focus:border-[var(--green)] transition-colors';
const selectCls = 'select select-bordered w-full text-[13px] h-10 hover:border-[var(--green)] focus:border-[var(--green)] transition-colors';

/* ═══════════════════ Tab: General ═══════════════════ */

function TabGeneral({ settings, onChange }) {
  return (
    <div className="space-y-4">
      <Section title="Информация о филиале" icon={Building2}>
        <Field label="Название филиала">
          <input
            className={inputCls}
            value={settings.branchName}
            onChange={(e) => onChange({ branchName: e.target.value })}
            placeholder="LevelUp Academy — Downtown"
          />
        </Field>
        <Field label="Адрес">
          <input
            className={inputCls}
            value={settings.branchAddress}
            onChange={(e) => onChange({ branchAddress: e.target.value })}
            placeholder="Ташкент, ул. Амира Темура, 108"
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Телефон">
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/30" />
              <input
                className={`${inputCls} pl-9`}
                value={settings.branchPhone}
                onChange={(e) => onChange({ branchPhone: e.target.value })}
                placeholder="+998 90 123 45 67"
              />
            </div>
          </Field>
          <Field label="Email">
            <input
              className={inputCls}
              type="email"
              value={settings.branchEmail}
              onChange={(e) => onChange({ branchEmail: e.target.value })}
              placeholder="info@levelup.uz"
            />
          </Field>
        </div>
        <Field label="Веб-сайт" hint="URL сайта филиала (если есть)">
          <input
            className={inputCls}
            value={settings.branchWebsite}
            onChange={(e) => onChange({ branchWebsite: e.target.value })}
            placeholder="https://levelup.uz"
          />
        </Field>
      </Section>
    </div>
  );
}

/* ═══════════════════ Tab: Appearance ═══════════════════ */

function TabAppearance({ settings, onChange }) {
  const themes = [
    { value: 'light', label: 'Светлая', icon: Sun },
    { value: 'dark', label: 'Тёмная', icon: Moon },
    { value: 'system', label: 'Системная', icon: Smartphone },
  ];

  return (
    <div className="space-y-4">
      <Section title="Тема оформления" icon={Palette}>
        <Field label="Цветовая тема">
          <div className="flex gap-3">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => onChange({ theme: value })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[12px] font-semibold border transition-all ${
                  settings.theme === value
                    ? 'bg-[var(--green)] text-[#141B10] border-[var(--green)]'
                    : 'bg-[var(--surface)] text-base-content/60 border-[var(--border)] hover:border-[var(--green)]'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Отображение" icon={Eye}>
        <Field label="Компактный режим" hint="Уменьшить отступы для большего количества информации на экране" horizontal>
          <Toggle
            checked={settings.compactMode}
            onChange={(v) => onChange({ compactMode: v })}
          />
        </Field>
        <Field label="Показывать аватары" hint="Отображать фотографии студентов и сотрудников" horizontal>
          <Toggle
            checked={settings.showAvatars}
            onChange={(v) => onChange({ showAvatars: v })}
          />
        </Field>
      </Section>
    </div>
  );
}

/* ═══════════════════ Tab: Notifications ═══════════════════ */

function TabNotifications({ settings, onChange }) {
  return (
    <div className="space-y-4">
      <Section title="Каналы уведомлений" icon={Bell}>
        <Field label="Email-уведомления" hint="Отправлять уведомления на email" horizontal>
          <Toggle
            checked={settings.notifyEmail}
            onChange={(v) => onChange({ notifyEmail: v })}
          />
        </Field>
        <Field label="Telegram-уведомления" hint="Через Telegram-бота" horizontal>
          <Toggle
            checked={settings.notifyTelegram}
            onChange={(v) => onChange({ notifyTelegram: v })}
          />
        </Field>
        <Field label="SMS-уведомления" hint="Только для критических событий" horizontal>
          <Toggle
            checked={settings.notifySms}
            onChange={(v) => onChange({ notifySms: v })}
          />
        </Field>
      </Section>

      <Section title="События" icon={Mail}>
        <Field label="Просроченные платежи" hint="Уведомлять о просроченных инвойсах" horizontal>
          <Toggle
            checked={settings.notifyOverduePayments}
            onChange={(v) => onChange({ notifyOverduePayments: v })}
          />
        </Field>
        <Field label="Новые студенты" hint="Уведомлять о регистрации новых студентов" horizontal>
          <Toggle
            checked={settings.notifyNewStudents}
            onChange={(v) => onChange({ notifyNewStudents: v })}
          />
        </Field>
        <Field label="Посещаемость" hint="Уведомлять о пропусках" horizontal>
          <Toggle
            checked={settings.notifyAttendance}
            onChange={(v) => onChange({ notifyAttendance: v })}
          />
        </Field>
        <Field label="Ежедневный отчёт" hint="Сводка за день в конце рабочего времени" horizontal>
          <Toggle
            checked={settings.notifyDailyReport}
            onChange={(v) => onChange({ notifyDailyReport: v })}
          />
        </Field>
      </Section>
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
    <div className="space-y-4">
      <Section title="Двухфакторная аутентификация" icon={Shield}>
        <Field label="2FA" hint="Дополнительный уровень защиты аккаунта" horizontal>
          <Toggle
            checked={settings.twoFactorEnabled}
            onChange={(v) => onChange({ twoFactorEnabled: v })}
          />
        </Field>
      </Section>

      <Section title="Сессии" icon={Clock}>
        <Field label="Тайм-аут сессии (минуты)" hint="Через сколько минут бездействия произойдёт автоматический выход">
          <select
            className={selectCls}
            value={settings.sessionTimeout}
            onChange={(e) => onChange({ sessionTimeout: Number(e.target.value) })}
          >
            <option value={15}>15 минут</option>
            <option value={30}>30 минут</option>
            <option value={60}>1 час</option>
            <option value={120}>2 часа</option>
            <option value={480}>8 часов</option>
          </select>
        </Field>
        <Field label="Множественные сессии" hint="Разрешить вход с нескольких устройств одновременно" horizontal>
          <Toggle
            checked={settings.allowMultipleSessions}
            onChange={(v) => onChange({ allowMultipleSessions: v })}
          />
        </Field>
      </Section>

      <Section title="Смена пароля" icon={Shield}>
        <div className="space-y-3">
          <Field label="Текущий пароль">
            <div className="relative">
              <input
                className={`${inputCls} pr-10`}
                type={showCurrentPw ? 'text' : 'password'}
                value={pwFields.current}
                onChange={(e) => setPwFields((p) => ({ ...p, current: e.target.value }))}
                placeholder="Введите текущий пароль"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw(!showCurrentPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content/60"
              >
                {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <Field label="Новый пароль">
            <div className="relative">
              <input
                className={`${inputCls} pr-10`}
                type={showNewPw ? 'text' : 'password'}
                value={pwFields.newPw}
                onChange={(e) => setPwFields((p) => ({ ...p, newPw: e.target.value }))}
                placeholder="Мин. 8 символов"
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/30 hover:text-base-content/60"
              >
                {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <Field label="Подтвердите пароль">
            <input
              className={inputCls}
              type="password"
              value={pwFields.confirm}
              onChange={(e) => setPwFields((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="Повторите новый пароль"
            />
          </Field>
          {pwMsg === 'success' && (
            <div className="flex items-center gap-2 text-[12px] text-[#2ECC71]">
              <CheckCircle2 size={14} /> Пароль успешно изменён
            </div>
          )}
          {pwMsg === 'error' && (
            <div className="flex items-center gap-2 text-[12px] text-[#E8543E]">
              <AlertCircle size={14} /> {pwFields.newPw !== pwFields.confirm ? 'Пароли не совпадают' : 'Ошибка смены пароля'}
            </div>
          )}
          <button
            className="btn btn-sm bg-[var(--green)] text-[#141B10] border-none hover:brightness-110"
            disabled={!pwFields.current || !pwFields.newPw || pwFields.newPw.length < 8 || pwBusy}
            onClick={handlePasswordChange}
          >
            {pwBusy && <span className="loading loading-spinner loading-xs" />}
            Изменить пароль
          </button>
        </div>
      </Section>
    </div>
  );
}

/* ═══════════════════ Tab: Finance ═══════════════════ */

function TabFinance({ settings, onChange }) {
  return (
    <div className="space-y-4">
      <Section title="Валюта" icon={Coins}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Валюта">
            <select
              className={selectCls}
              value={settings.currency}
              onChange={(e) => onChange({ currency: e.target.value })}
            >
              <option value="UZS">UZS — Узбекский сум</option>
              <option value="USD">USD — Доллар США</option>
              <option value="RUB">RUB — Российский рубль</option>
            </select>
          </Field>
          <Field label="Символ валюты">
            <input
              className={inputCls}
              value={settings.currencySymbol}
              onChange={(e) => onChange({ currencySymbol: e.target.value })}
              placeholder="сўм"
            />
          </Field>
        </div>
      </Section>

      <Section title="Инвойсы" icon={FileText}>
        <Field label="Префикс инвойсов" hint="Добавляется перед номером (например, INV-001)">
          <input
            className={`${inputCls} max-w-[200px]`}
            value={settings.invoicePrefix}
            onChange={(e) => onChange({ invoicePrefix: e.target.value.toUpperCase() })}
            placeholder="INV"
          />
        </Field>
        <Field label="Автогенерация инвойсов" hint="Создавать инвойс автоматически при начале месяца" horizontal>
          <Toggle
            checked={settings.autoGenerateInvoice}
            onChange={(v) => onChange({ autoGenerateInvoice: v })}
          />
        </Field>
        <Field label="Льготный период (дни)" hint="Сколько дней давать на оплату после выставления счёта">
          <select
            className={`${selectCls} max-w-[200px]`}
            value={settings.paymentGraceDays}
            onChange={(e) => onChange({ paymentGraceDays: Number(e.target.value) })}
          >
            <option value={0}>Без льготного периода</option>
            <option value={3}>3 дня</option>
            <option value={5}>5 дней</option>
            <option value={7}>7 дней</option>
            <option value={14}>14 дней</option>
          </select>
        </Field>
      </Section>
    </div>
  );
}

/* ═══════════════════ Tab: Localization ═══════════════════ */

function TabLocalization({ settings, onChange }) {
  const languages = [
    { value: 'ru', label: 'Русский' },
    { value: 'uz', label: 'Ўзбекча' },
    { value: 'en', label: 'English' },
  ];

  const dateFormats = [
    { value: 'DD.MM.YYYY', label: '31.12.2026' },
    { value: 'MM/DD/YYYY', label: '12/31/2026' },
    { value: 'YYYY-MM-DD', label: '2026-12-31' },
  ];

  const timezones = [
    { value: 'Asia/Tashkent', label: 'Asia/Tashkent (UTC+5)' },
    { value: 'Asia/Almaty', label: 'Asia/Almaty (UTC+6)' },
    { value: 'Europe/Moscow', label: 'Europe/Moscow (UTC+3)' },
  ];

  const weekDays = [
    { value: 'monday', label: 'Понедельник' },
    { value: 'sunday', label: 'Воскресенье' },
  ];

  return (
    <div className="space-y-4">
      <Section title="Язык и формат" icon={Languages}>
        <Field label="Язык интерфейса">
          <div className="flex gap-3">
            {languages.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onChange({ language: value })}
                className={`px-4 py-2.5 rounded-[10px] text-[12px] font-semibold border transition-all ${
                  settings.language === value
                    ? 'bg-[var(--green)] text-[#141B10] border-[var(--green)]'
                    : 'bg-[var(--surface)] text-base-content/60 border-[var(--border)] hover:border-[var(--green)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Формат даты">
          <div className="flex gap-3">
            {dateFormats.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onChange({ dateFormat: value })}
                className={`px-4 py-2.5 rounded-[10px] text-[12px] font-semibold border transition-all font-mono ${
                  settings.dateFormat === value
                    ? 'bg-[var(--green)] text-[#141B10] border-[var(--green)]'
                    : 'bg-[var(--surface)] text-base-content/60 border-[var(--border)] hover:border-[var(--green)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
      </Section>

      <Section title="Региональные настройки" icon={MapPin}>
        <Field label="Часовой пояс">
          <select
            className={`${selectCls} max-w-[320px]`}
            value={settings.timezone}
            onChange={(e) => onChange({ timezone: e.target.value })}
          >
            {timezones.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Первый день недели">
          <div className="flex gap-3">
            {weekDays.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => onChange({ firstDayOfWeek: value })}
                className={`px-4 py-2.5 rounded-[10px] text-[12px] font-semibold border transition-all ${
                  settings.firstDayOfWeek === value
                    ? 'bg-[var(--green)] text-[#141B10] border-[var(--green)]'
                    : 'bg-[var(--surface)] text-base-content/60 border-[var(--border)] hover:border-[var(--green)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Field>
      </Section>
    </div>
  );
}

/* ═══════════════════ Main: AdminSettings ═══════════════════ */

export default function AdminSettings() {
  const { token } = useAuth();
  const { data, isLoading, error } = useAdminSettings();
  const invalidate = useInvalidate();

  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(DEFAULTS);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(''); // 'success' | 'error' | ''

  /* Load settings from backend */
  useEffect(() => {
    if (data) {
      const s = data.data || data.settings || data;
      if (s && typeof s === 'object') {
        setSettings((prev) => ({ ...prev, ...s }));
      }
    }
  }, [data]);

  /* Partial update */
  const update = (patch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setDirty(true);
    setSaveMsg('');
  };

  /* Save */
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

  /* ── Loading state ── */
  if (isLoading) {
    return (
      <div>
        <PageHeader title="Настройки" subtitle="Настройки филиала" />
        <div className="mt-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[var(--surface)] rounded-[16px] border border-[var(--border)] p-5 animate-pulse">
              <div className="h-4 w-32 bg-base-300 rounded mb-4" />
              <div className="space-y-3">
                <div className="h-10 bg-base-300 rounded-[10px]" />
                <div className="h-10 bg-base-300 rounded-[10px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Error state (allow editing anyway) ── */
  const backendReady = !error;
  if (error && error.status !== 401) {
    // Settings backend not ready — still show form with defaults
  }

  return (
    <div>
      <PageHeader title="Настройки" subtitle="Настройки филиала">
        <div className="flex items-center gap-3">
          {saveMsg === 'success' && (
            <span className="flex items-center gap-1.5 text-[12px] text-[#2ECC71] font-semibold animate-fade-in">
              <CheckCircle2 size={14} /> Сохранено
            </span>
          )}
          {saveMsg === 'error' && (
            <span className="flex items-center gap-1.5 text-[12px] text-[#E8543E] font-semibold animate-fade-in">
              <AlertCircle size={14} /> Ошибка сохранения
            </span>
          )}
          {!backendReady && (
            <span className="flex items-center gap-1.5 text-[11px] text-[#F59E0B] font-semibold bg-[rgba(245,158,11,0.1)] px-2.5 py-1 rounded-full">
              <AlertCircle size={12} /> Backend не подключён
            </span>
          )}
        </div>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-6 mt-2">
        {/* ── Sidebar tabs ── */}
        <div className="lg:w-[220px] shrink-0">
          <div className="bg-[var(--surface)] rounded-[16px] border border-[var(--border)] p-2 flex lg:flex-col gap-1 overflow-x-auto">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-[12px] font-semibold transition-all whitespace-nowrap ${
                  activeTab === key
                    ? 'bg-[rgba(198,255,52,0.12)] text-[var(--text)]'
                    : 'text-base-content/50 hover:text-base-content hover:bg-[var(--surface-hover)]'
                }`}
              >
                <Icon size={15} className={activeTab === key ? 'text-[var(--green)]' : ''} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 min-w-0 space-y-4">
          {activeTab === 'general' && <TabGeneral settings={settings} onChange={update} />}
          {activeTab === 'appearance' && <TabAppearance settings={settings} onChange={update} />}
          {activeTab === 'notifications' && <TabNotifications settings={settings} onChange={update} />}
          {activeTab === 'security' && <TabSecurity settings={settings} onChange={update} />}
          {activeTab === 'finance' && <TabFinance settings={settings} onChange={update} />}
          {activeTab === 'localization' && <TabLocalization settings={settings} onChange={update} />}

          {/* ── Save button ── */}
          <div className="flex justify-end pt-2 pb-8">
            <button
              className="btn btn-sm bg-[var(--green)] text-[#141B10] border-none hover:brightness-110 shadow-[0_4px_16px_rgba(198,255,52,0.25)] gap-2"
              disabled={!dirty || saving}
              onClick={handleSave}
            >
              {saving ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <Save size={14} />
              )}
              Сохранить изменения
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
