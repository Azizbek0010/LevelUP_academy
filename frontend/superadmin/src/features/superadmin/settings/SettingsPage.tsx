import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check, Globe, KeyRound, Moon, Palette, Save, Settings, Sun, User } from 'lucide-react';
import clsx from 'clsx';
import { usersApi } from '../../../shared/api/endpoints/users';
import { ApiError } from '../../../shared/api/http';
import { useT } from '../../../shared/i18n/useT';
import { useSettingsStore, type Lang, type ThemeMode } from '../../../shared/stores/settings';
import { useAuthStore } from '../../../shared/stores/auth';
import { PageHeader } from '../../../shared/ui/PageHeader';

const LANGS: Array<{ value: Lang; label: string; code: string }> = [
  { value: 'ru', label: 'Русский', code: 'RU' },
  { value: 'uz', label: "O'zbek", code: 'UZ' },
  { value: 'en', label: 'English', code: 'GB' },
];

const THEMES: Array<{ value: ThemeMode; icon: React.ComponentType<{ className?: string }>; labelKey: string; hint: string }> = [
  { value: 'system', icon: Palette, labelKey: 'settings.theme.system', hint: 'следует ОС' },
  { value: 'light', icon: Sun, labelKey: 'settings.theme.light', hint: 'светлая · lime' },
  { value: 'dark', icon: Moon, labelKey: 'settings.theme.dark', hint: 'espresso · dark' },
];

export default function SettingsPage(): React.ReactElement {
  const t = useT();
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const lang = useSettingsStore((s) => s.lang);
  const setLang = useSettingsStore((s) => s.setLang);
  const user = useAuthStore((s) => s.user);

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader
        icon={Settings}
        title={t('settings.title')}
        subtitle="Тема, язык, профиль, пароль"
      />

      {/* Appearance */}
      <SectionCard
        icon={Palette}
        title={t('settings.appearance')}
        hint="как отображать интерфейс"
        delay={0}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {THEMES.map((th) => {
            const active = theme === th.value;
            const Icon = th.icon;
            return (
              <button
                key={th.value}
                type="button"
                onClick={() => setTheme(th.value)}
                className={clsx(
                  'group relative rounded-xl border p-3.5 text-left transition-all wow-lift',
                  active
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-base-300 hover:border-primary/40 bg-base-100',
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'size-10 rounded-lg grid place-items-center shrink-0 transition-colors',
                      active
                        ? 'bg-primary text-primary-content'
                        : 'bg-base-200 text-base-content/60 group-hover:bg-primary/20 group-hover:text-primary',
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm leading-tight">
                      {t(th.labelKey)}
                    </div>
                    <div className="text-[11px] text-base-content/50 mt-0.5 font-mono">
                      {th.hint}
                    </div>
                  </div>
                  {active && (
                    <Check className="size-4 text-primary shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Language */}
      <SectionCard
        icon={Globe}
        title={t('settings.language')}
        hint="локаль интерфейса"
        delay={80}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {LANGS.map((l) => {
            const active = lang === l.value;
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => setLang(l.value)}
                className={clsx(
                  'group relative rounded-xl border p-3.5 text-left transition-all wow-lift',
                  active
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-base-300 hover:border-primary/40 bg-base-100',
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'size-10 rounded-lg grid place-items-center shrink-0 font-mono text-[13px] font-bold transition-colors',
                      active
                        ? 'bg-primary text-primary-content'
                        : 'bg-base-200 text-base-content/60 group-hover:bg-primary/20 group-hover:text-primary',
                    )}
                  >
                    {l.code}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm leading-tight">{l.label}</div>
                    <div className="text-[11px] text-base-content/50 mt-0.5 font-mono">
                      {l.value}
                    </div>
                  </div>
                  {active && <Check className="size-4 text-primary shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      {/* Profile */}
      <ProfileCard />

      {/* Password */}
      <PasswordCard />

      {user && (
        <div className="text-xs text-base-content/40 text-center pt-6 pb-2 font-mono">
          ▸ {user.role} · {user.email}
        </div>
      )}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  hint,
  children,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="wow-card mb-4 wow-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <header className="flex items-center gap-3 px-5 py-4 border-b border-base-300 bg-base-200/30">
        <div className="size-9 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          {hint && (
            <div className="text-[11px] text-base-content/50 font-mono">
              {hint}
            </div>
          )}
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}

// ────────────────────────────────────────────────────────────
// Profile section
// ────────────────────────────────────────────────────────────

function ProfileCard(): React.ReactElement {
  const t = useT();
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? '',
    email: user?.email ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => usersApi.updateMe(form),
    onSuccess: (updated) => {
      useAuthStore.setState({
        user: {
          id: updated.id,
          email: updated.email,
          firstName: updated.firstName,
          lastName: updated.lastName,
          role: updated.role,
        },
      });
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.payload.message : 'Не удалось сохранить');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    mut.mutate();
  }

  return (
    <SectionCard icon={User} title={t('settings.profile')} hint="имя, email" delay={160}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SettingsField
            label={t('settings.field.firstName')}
            value={form.firstName}
            onChange={(v) => setForm({ ...form, firstName: v })}
          />
          <SettingsField
            label={t('settings.field.lastName')}
            value={form.lastName}
            onChange={(v) => setForm({ ...form, lastName: v })}
          />
        </div>
        <SettingsField
          label={t('settings.field.email')}
          type="email"
          mono
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />

        {error && (
          <div role="alert" className="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-error text-sm font-mono">
            ✕ {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className="btn btn-primary btn-sm gap-2 rounded-lg wow-shine"
            disabled={mut.isPending}
          >
            {mut.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Save className="size-4" />
            )}
            {t('settings.save')}
          </button>
          {saved && (
            <span className="text-success text-sm inline-flex items-center gap-1 wow-rise">
              <Check className="size-4" /> {t('settings.saved')}
            </span>
          )}
        </div>
      </form>
    </SectionCard>
  );
}

// ────────────────────────────────────────────────────────────
// Password section
// ────────────────────────────────────────────────────────────

function PasswordCard(): React.ReactElement {
  const t = useT();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const mut = useMutation({
    mutationFn: () =>
      usersApi.changeMyPassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }),
    onSuccess: () => {
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => setError(err instanceof ApiError ? err.payload.message : 'Ошибка'),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.newPassword.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    setError(null);
    mut.mutate();
  }

  return (
    <SectionCard icon={KeyRound} title={t('settings.password')} hint="смена пароля" delay={240}>
      <form className="space-y-4" onSubmit={onSubmit}>
        <SettingsField
          label={t('settings.field.currentPassword')}
          type="password"
          mono
          value={form.currentPassword}
          onChange={(v) => setForm({ ...form, currentPassword: v })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SettingsField
            label={t('settings.field.newPassword')}
            type="password"
            mono
            value={form.newPassword}
            onChange={(v) => setForm({ ...form, newPassword: v })}
          />
          <SettingsField
            label={t('settings.field.confirmPassword')}
            type="password"
            mono
            value={form.confirmPassword}
            onChange={(v) => setForm({ ...form, confirmPassword: v })}
          />
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-error/40 bg-error/5 px-3 py-2 text-error text-sm font-mono">
            ✕ {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            className="btn btn-primary btn-sm gap-2 rounded-lg wow-shine"
            disabled={mut.isPending}
          >
            {mut.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Save className="size-4" />
            )}
            {t('settings.save')}
          </button>
          {saved && (
            <span className="text-success text-sm inline-flex items-center gap-1 wow-rise">
              <Check className="size-4" /> {t('settings.saved')}
            </span>
          )}
        </div>
      </form>
    </SectionCard>
  );
}

function SettingsField({
  label,
  value,
  onChange,
  type = 'text',
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-base-content/60 font-medium mb-1 flex items-center gap-1.5">
        <span className="text-base-content/30 font-mono">▸</span>
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          'w-full h-10 px-3 rounded-lg border border-base-300 bg-base-100 text-base text-base-content wow-input',
          mono && 'font-mono',
        )}
      />
    </label>
  );
}
