import { useState, useEffect } from 'react';
import { useAuth } from '../../auth.jsx';
import { useAdminSettings, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis } from '../../components/Skeleton.jsx';
import {
  Building2, Palette, Bell, Shield, CreditCard, Globe,
  CheckCircle2, AlertCircle, Eye, EyeOff, Moon, Sun,
  MessageSquare, Mail, Smartphone, Clock, Coins,
  FileText, Languages, MapPin, Phone, Save,
} from 'lucide-react';

/* ═══════════════════ Tab definitions ═══════════════════ */

const TABS = [
  { key: 'general', label: 'Общие', icon: Building2 },
  { key: 'appearance', label: 'Внешний вид', icon: Palette },
  { key: 'notifications', label: 'Уведомления', icon: Bell },
  { key: 'security', label: 'Безопасность', icon: Shield },
  { key: 'finance', label: 'Финансы', icon: CreditCard },
  { key: 'localization', label: 'Локализация', icon: Globe },
];

/* ═══════════════════ Default settings ═══════════════════ */

const DEFAULTS = {
  branchName: '',
  branchAddress: '',
  branchPhone: '',
  branchEmail: '',
  branchWebsite: '',
  theme: 'light',
  accentColor: '#C6FF34',
  compactMode: false,
  showAvatars: true,
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

/* ═══════════════════ Tab: General ═══════════════════ */

function TabGeneral({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Building2 size={18} /> Информация о филиале
          </h2>
          <div className="space-y-4">
            <label className="form-control w-full">
              <span className="label-text mb-1.5 font-medium">Название филиала</span>
              <input
                className="input input-bordered w-full"
                value={settings.branchName}
                onChange={(e) => onChange({ branchName: e.target.value })}
                placeholder="LevelUp Academy — Downtown"
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text mb-1.5 font-medium">Адрес</span>
              <input
                className="input input-bordered w-full"
                value={settings.branchAddress}
                onChange={(e) => onChange({ branchAddress: e.target.value })}
                placeholder="Ташкент, ул. Амира Темура, 108"
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="form-control w-full">
                <span className="label-text mb-1.5 font-medium">Телефон</span>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                  <input
                    className="input input-bordered w-full pl-9"
                    value={settings.branchPhone}
                    onChange={(e) => onChange({ branchPhone: e.target.value })}
                    placeholder="+998 90 123 45 67"
                  />
                </div>
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1.5 font-medium">Email</span>
                <input
                  className="input input-bordered w-full"
                  type="email"
                  value={settings.branchEmail}
                  onChange={(e) => onChange({ branchEmail: e.target.value })}
                  placeholder="info@levelup.uz"
                />
              </label>
            </div>
            <label className="form-control w-full">
              <span className="label-text mb-1.5 font-medium">Веб-сайт</span>
              <input
                className="input input-bordered w-full"
                value={settings.branchWebsite}
                onChange={(e) => onChange({ branchWebsite: e.target.value })}
                placeholder="https://levelup.uz"
              />
              <span className="label-text-alt text-base-content/40 mt-1">URL сайта филиала (если есть)</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ Tab: Appearance ═══════════════════ */

function TabAppearance({ settings, onChange }) {
  const themes = [
    { value: 'light', label: 'Светлая', Icon: Sun },
    { value: 'dark', label: 'Тёмная', Icon: Moon },
    { value: 'system', label: 'Системная', Icon: Smartphone },
  ];

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Palette size={18} /> Тема оформления
          </h2>
          <div className="flex gap-3">
            {themes.map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => onChange({ theme: value })}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                  settings.theme === value
                    ? 'bg-primary text-primary-content border-primary shadow'
                    : 'bg-base-200 text-base-content/60 border-base-300 hover:border-primary'
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Eye size={18} /> Отображение
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Компактный режим</div>
                <div className="text-xs text-base-content/50">Уменьшить отступы для большего количества информации</div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={settings.compactMode}
                onChange={(e) => onChange({ compactMode: e.target.checked })}
              />
            </div>
            <div className="divider my-0" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Показывать аватары</div>
                <div className="text-xs text-base-content/50">Отображать фотографии студентов и сотрудников</div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={settings.showAvatars}
                onChange={(e) => onChange({ showAvatars: e.target.checked })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ Tab: Notifications ═══════════════════ */

function TabNotifications({ settings, onChange }) {
  const channels = [
    { key: 'notifyEmail', label: 'Email-уведомления', hint: 'Отправлять уведомления на email', icon: Mail },
    { key: 'notifyTelegram', label: 'Telegram-уведомления', hint: 'Через Telegram-бота', icon: MessageSquare },
    { key: 'notifySms', label: 'SMS-уведомления', hint: 'Только для критических событий', icon: Smartphone },
  ];

  const events = [
    { key: 'notifyOverduePayments', label: 'Просроченные платежи', hint: 'Уведомлять о просроченных инвойсах', icon: Clock },
    { key: 'notifyNewStudents', label: 'Новые студенты', hint: 'Уведомлять о регистрации новых студентов', icon: Mail },
    { key: 'notifyAttendance', label: 'Посещаемость', hint: 'Уведомлять о пропусках', icon: Mail },
    { key: 'notifyDailyReport', label: 'Ежедневный отчёт', hint: 'Сводка за день в конце рабочего времени', icon: Mail },
  ];

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Bell size={18} /> Каналы уведомлений
          </h2>
          <div className="space-y-4">
            {channels.map(({ key, label, hint, icon: Icon }) => (
              <div key={key}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-primary" />
                    </span>
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-base-content/50">{hint}</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    checked={settings[key]}
                    onChange={(e) => onChange({ [key]: e.target.checked })}
                  />
                </div>
                {key !== 'notifySms' && <div className="divider my-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <AlertCircle size={18} /> События
          </h2>
          <div className="space-y-4">
            {events.map(({ key, label, hint, icon: Icon }, i) => (
              <div key={key}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-base-content/50" />
                    </span>
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-base-content/50">{hint}</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary toggle-sm"
                    checked={settings[key]}
                    onChange={(e) => onChange({ [key]: e.target.checked })}
                  />
                </div>
                {i < events.length - 1 && <div className="divider my-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
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
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Shield size={18} /> Двухфакторная аутентификация
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">2FA</div>
              <div className="text-xs text-base-content/50">Дополнительный уровень защиты аккаунта</div>
            </div>
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={settings.twoFactorEnabled}
              onChange={(e) => onChange({ twoFactorEnabled: e.target.checked })}
            />
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Clock size={18} /> Сессии
          </h2>
          <div className="space-y-4">
            <label className="form-control w-full max-w-xs">
              <span className="label-text mb-1.5 font-medium">Тайм-аут сессии</span>
              <select
                className="select select-bordered w-full"
                value={settings.sessionTimeout}
                onChange={(e) => onChange({ sessionTimeout: Number(e.target.value) })}
              >
                <option value={15}>15 минут</option>
                <option value={30}>30 минут</option>
                <option value={60}>1 час</option>
                <option value={120}>2 часа</option>
                <option value={480}>8 часов</option>
              </select>
              <span className="label-text-alt text-base-content/40 mt-1">Через сколько минут бездействия произойдёт выход</span>
            </label>
            <div className="divider my-0" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Множественные сессии</div>
                <div className="text-xs text-base-content/50">Разрешить вход с нескольких устройств одновременно</div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={settings.allowMultipleSessions}
                onChange={(e) => onChange({ allowMultipleSessions: e.target.checked })}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Shield size={18} /> Смена пароля
          </h2>
          <div className="space-y-4 max-w-sm">
            <label className="form-control w-full">
              <span className="label-text mb-1.5 font-medium">Текущий пароль</span>
              <div className="relative">
                <input
                  className="input input-bordered w-full pr-10"
                  type={showCurrentPw ? 'text' : 'password'}
                  value={pwFields.current}
                  onChange={(e) => setPwFields((p) => ({ ...p, current: e.target.value }))}
                  placeholder="Введите текущий пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
                >
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label className="form-control w-full">
              <span className="label-text mb-1.5 font-medium">Новый пароль</span>
              <div className="relative">
                <input
                  className="input input-bordered w-full pr-10"
                  type={showNewPw ? 'text' : 'password'}
                  value={pwFields.newPw}
                  onChange={(e) => setPwFields((p) => ({ ...p, newPw: e.target.value }))}
                  placeholder="Мин. 8 символов"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70 transition-colors"
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {pwFields.newPw && pwFields.newPw.length < 8 && (
                <span className="label-text-alt text-error mt-1">Минимум 8 символов</span>
              )}
            </label>
            <label className="form-control w-full">
              <span className="label-text mb-1.5 font-medium">Подтвердите пароль</span>
              <input
                className="input input-bordered w-full"
                type="password"
                value={pwFields.confirm}
                onChange={(e) => setPwFields((p) => ({ ...p, confirm: e.target.value }))}
                placeholder="Повторите новый пароль"
              />
              {pwFields.confirm && pwFields.newPw !== pwFields.confirm && (
                <span className="label-text-alt text-error mt-1">Пароли не совпадают</span>
              )}
            </label>
            {pwMsg === 'success' && (
              <div className="alert alert-success text-sm py-2">
                <CheckCircle2 size={16} />
                <span>Пароль успешно изменён</span>
              </div>
            )}
            {pwMsg === 'error' && (
              <div className="alert alert-error text-sm py-2">
                <AlertCircle size={16} />
                <span>{pwFields.newPw !== pwFields.confirm ? 'Пароли не совпадают' : 'Ошибка смены пароля'}</span>
              </div>
            )}
            <button
              className="btn btn-primary btn-sm gap-1"
              disabled={!pwFields.current || !pwFields.newPw || pwFields.newPw.length < 8 || pwBusy}
              onClick={handlePasswordChange}
            >
              {pwBusy && <span className="loading loading-spinner loading-xs" />}
              Изменить пароль
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ Tab: Finance ═══════════════════ */

function TabFinance({ settings, onChange }) {
  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Coins size={18} /> Валюта
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="form-control w-full">
              <span className="label-text mb-1.5 font-medium">Валюта</span>
              <select
                className="select select-bordered w-full"
                value={settings.currency}
                onChange={(e) => onChange({ currency: e.target.value })}
              >
                <option value="UZS">UZS — Узбекский сум</option>
                <option value="USD">USD — Доллар США</option>
                <option value="RUB">RUB — Российский рубль</option>
              </select>
            </label>
            <label className="form-control w-full">
              <span className="label-text mb-1.5 font-medium">Символ валюты</span>
              <input
                className="input input-bordered w-full"
                value={settings.currencySymbol}
                onChange={(e) => onChange({ currencySymbol: e.target.value })}
                placeholder="сўм"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <FileText size={18} /> Инвойсы
          </h2>
          <div className="space-y-4">
            <label className="form-control w-full max-w-xs">
              <span className="label-text mb-1.5 font-medium">Префикс инвойсов</span>
              <input
                className="input input-bordered w-full"
                value={settings.invoicePrefix}
                onChange={(e) => onChange({ invoicePrefix: e.target.value.toUpperCase() })}
                placeholder="INV"
              />
              <span className="label-text-alt text-base-content/40 mt-1">Добавляется перед номером (например, INV-001)</span>
            </label>
            <div className="divider my-0" />
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Автогенерация инвойсов</div>
                <div className="text-xs text-base-content/50">Создавать инвойс автоматически при начале месяца</div>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={settings.autoGenerateInvoice}
                onChange={(e) => onChange({ autoGenerateInvoice: e.target.checked })}
              />
            </div>
            <div className="divider my-0" />
            <label className="form-control w-full max-w-xs">
              <span className="label-text mb-1.5 font-medium">Льготный период (дни)</span>
              <select
                className="select select-bordered w-full"
                value={settings.paymentGraceDays}
                onChange={(e) => onChange({ paymentGraceDays: Number(e.target.value) })}
              >
                <option value={0}>Без льготного периода</option>
                <option value={3}>3 дня</option>
                <option value={5}>5 дней</option>
                <option value={7}>7 дней</option>
                <option value={14}>14 дней</option>
              </select>
              <span className="label-text-alt text-base-content/40 mt-1">Сколько дней давать на оплату после выставления счёта</span>
            </label>
          </div>
        </div>
      </div>
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
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <Languages size={18} /> Язык и формат
          </h2>
          <div className="space-y-5">
            <div>
              <div className="text-sm font-medium mb-2">Язык интерфейса</div>
              <div className="flex gap-3">
                {languages.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onChange({ language: value })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      settings.language === value
                        ? 'bg-primary text-primary-content border-primary shadow'
                        : 'bg-base-200 text-base-content/60 border-base-300 hover:border-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider my-0" />

            <div>
              <div className="text-sm font-medium mb-2">Формат даты</div>
              <div className="flex gap-3">
                {dateFormats.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onChange({ dateFormat: value })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all font-mono ${
                      settings.dateFormat === value
                        ? 'bg-primary text-primary-content border-primary shadow'
                        : 'bg-base-200 text-base-content/60 border-base-300 hover:border-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6">
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <MapPin size={18} /> Региональные настройки
          </h2>
          <div className="space-y-4">
            <label className="form-control w-full max-w-sm">
              <span className="label-text mb-1.5 font-medium">Часовой пояс</span>
              <select
                className="select select-bordered w-full"
                value={settings.timezone}
                onChange={(e) => onChange({ timezone: e.target.value })}
              >
                {timezones.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <div className="divider my-0" />
            <div>
              <div className="text-sm font-medium mb-2">Первый день недели</div>
              <div className="flex gap-3">
                {weekDays.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => onChange({ firstDayOfWeek: value })}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      settings.firstDayOfWeek === value
                        ? 'bg-primary text-primary-content border-primary shadow'
                        : 'bg-base-200 text-base-content/60 border-base-300 hover:border-primary'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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
  const [saveMsg, setSaveMsg] = useState('');

  /* ── Load persisted theme on mount ── */
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lu-theme');
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setSettings((prev) => ({ ...prev, theme: saved }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (data) {
      const s = data.data || data.settings || data;
      if (s && typeof s === 'object') {
        setSettings((prev) => ({ ...prev, ...s }));
      }
    }
  }, [data]);

  /* ── Theme toggle: apply to document.documentElement ── */
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (settings.theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      // system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
      root.classList.toggle('light', !prefersDark);
    }
    // persist to localStorage
    try { localStorage.setItem('lu-theme', settings.theme); } catch {}
  }, [settings.theme]);

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
      <div>
        <PageHeader title="Настройки" subtitle="Настройки филиала" />
        <div className="mt-6">
          <SkeletonKpis count={2} className="grid-cols-1 md:grid-cols-2" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Настройки" subtitle="Настройки филиала">
        <div className="flex items-center gap-3">
          {saveMsg === 'success' && (
            <div className="alert alert-success text-sm py-2 px-3 gap-1.5 animate-fade-in">
              <CheckCircle2 size={14} /><span>Сохранено</span>
            </div>
          )}
          {saveMsg === 'error' && (
            <div className="alert alert-error text-sm py-2 px-3 gap-1.5 animate-fade-in">
              <AlertCircle size={14} /><span>Ошибка сохранения</span>
            </div>
          )}
        </div>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-6 mt-2">
        {/* ── Sidebar tabs ── */}
        <div className="lg:w-[220px] shrink-0">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-2">
              <div className="flex lg:flex-col gap-1 overflow-x-auto">
                {TABS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                      activeTab === key
                        ? 'bg-primary/12 text-base-content'
                        : 'text-base-content/50 hover:text-base-content hover:bg-base-200'
                    }`}
                  >
                    <Icon size={16} className={activeTab === key ? 'text-primary' : ''} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 min-w-0">
          {activeTab === 'general' && <TabGeneral settings={settings} onChange={update} />}
          {activeTab === 'appearance' && <TabAppearance settings={settings} onChange={update} />}
          {activeTab === 'notifications' && <TabNotifications settings={settings} onChange={update} />}
          {activeTab === 'security' && <TabSecurity settings={settings} onChange={update} />}
          {activeTab === 'finance' && <TabFinance settings={settings} onChange={update} />}
          {activeTab === 'localization' && <TabLocalization settings={settings} onChange={update} />}

          {/* ── Save button ── */}
          <div className="flex justify-end pt-4 pb-8">
            <button
              className="btn btn-primary gap-2"
              disabled={!dirty || saving}
              onClick={handleSave}
            >
              {saving ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Save size={16} />
              )}
              Сохранить изменения
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
