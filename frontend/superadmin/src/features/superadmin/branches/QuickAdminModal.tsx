import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { usersApi, type UserItem } from '../../../shared/api/endpoints/users';
import { ApiError } from '../../../shared/api/http';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import {
  CliField,
  CliPasswordField,
  CliSection,
  CliError,
  HintFooter,
  STANDARD_HINTS,
  useCliShortcuts,
} from '../../../shared/ui/cli';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (user: UserItem) => void;
}

const EMPTY = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function QuickAdminModal({ open, onClose, onCreated }: Props): React.ReactElement {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
    }
  }, [open]);

  const mut = useMutation({
    mutationFn: () =>
      usersApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: 'admin',
        password: form.password,
      }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success(`Админ ${created.lastName} ${created.firstName} добавлен`);
      onCreated(created);
    },
    onError: (err) => setError(err instanceof ApiError ? err.payload.message : 'Ошибка'),
  });

  const emailValid = useMemo(() => EMAIL_RE.test(form.email.trim()), [form.email]);
  const emailHint: { text: string; tone: 'ok' | 'warn' | 'muted' } = form.email.length === 0
    ? { text: 'например admin@educrm.local', tone: 'muted' }
    : emailValid
      ? { text: 'формат ок', tone: 'ok' }
      : { text: 'проверь формат', tone: 'warn' };

  function submit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('Имя, фамилия и email обязательны');
      return;
    }
    if (!emailValid) {
      setError('Неверный формат email');
      return;
    }
    if (form.password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    setError(null);
    mut.mutate();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  useCliShortcuts({ onSubmit: submit, enabled: open });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="quick admin · создать и назначить"
      size="md"
      hints={<HintFooter items={STANDARD_HINTS} />}
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
            Отмена
          </button>
          <button
            type="submit"
            form="quick-admin-form"
            className="btn btn-primary btn-xs gap-1.5"
            disabled={mut.isPending}
          >
            {mut.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <UserPlus className="size-3.5" />
            )}
            <span className="font-mono">▸</span> создать
          </button>
        </>
      }
    >
      <form id="quick-admin-form" className="space-y-4" onSubmit={onSubmit}>
        <div className="font-mono text-[11px] text-base-content/60 bg-base-200/40 border border-base-300 rounded px-2.5 py-1.5">
          <span className="text-primary/80">▸</span> новый пользователь получит роль{' '}
          <span className="text-primary">admin</span> и будет привязан к филиалу
        </div>

        <CliSection label="Личное">
          <CliField
            label="Имя"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
            autoFocus
            placeholder="Али"
          />
          <CliField
            label="Фамилия"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
            placeholder="Каримов"
          />
        </CliSection>

        <CliSection label="Доступ">
          <CliField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            mono
            placeholder="admin@educrm.local"
            hintText={emailHint.text}
            hintTone={emailHint.tone}
          />
          <CliField
            label="Телефон"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            mono
            placeholder="+998901234567"
          />
        </CliSection>

        <CliSection label="Безопасность">
          <CliPasswordField
            label="Пароль"
            value={form.password}
            onChange={(v) => setForm({ ...form, password: v })}
            required
            minLength={6}
          />
        </CliSection>

        <CliError>{error}</CliError>
      </form>
    </Modal>
  );
}
