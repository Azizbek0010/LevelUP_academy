import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Role } from '../../../shared/types';
import { usersApi, type UserItem } from '../../../shared/api/endpoints/users';
import { ApiError } from '../../../shared/api/http';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import { useT } from '../../../shared/i18n/useT';
import {
  CliField,
  CliPasswordField,
  CliTextarea,
  CliSection,
  CliSelect,
  HintFooter,
  Key,
  useCliShortcuts,
} from '../../../shared/ui/cli';

interface Props {
  open: boolean;
  onClose: () => void;
  editing: UserItem | null;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: Role;
  password: string;
  position: string;
  workingSince: string;
  note: string;
}

const EMPTY: FormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  role: 'mentor',
  password: '',
  position: '',
  workingSince: '',
  note: '',
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'mentor', label: 'mentor' },
  { value: 'admin', label: 'admin' },
  { value: 'superadmin', label: 'superadmin' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function UserFormModal({ open, onClose, editing }: Props): React.ReactElement {
  const t = useT();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const isEdit = !!editing;

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      setForm({
        firstName: editing.firstName,
        lastName: editing.lastName,
        email: editing.email,
        phone: editing.phone ?? '',
        role: editing.role,
        password: '',
        position: editing.position ?? '',
        workingSince: editing.workingSince ? editing.workingSince.slice(0, 10) : '',
        note: editing.note ?? '',
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const mut = useMutation({
    mutationFn: () => {
      const extra = {
        position: form.position.trim() || null,
        workingSince: form.workingSince || null,
        note: form.note.trim() || null,
      };
      if (editing) {
        return usersApi.update(editing.id, {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          role: form.role,
          ...extra,
        });
      }
      return usersApi.create({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        role: form.role,
        password: form.password,
        ...extra,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      qc.invalidateQueries({ queryKey: ['user'] });
      toast.success(isEdit ? 'Изменения сохранены' : 'Пользователь добавлен');
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.payload.message : 'Не удалось сохранить');
    },
  });

  const emailValid = useMemo(() => EMAIL_RE.test(form.email.trim()), [form.email]);
  const emailHint: { text: string; tone: 'ok' | 'warn' | 'muted' } = form.email.length === 0
    ? { text: 'например ali@marsit.uz', tone: 'muted' }
    : emailValid
      ? { text: 'формат ок' , tone: 'ok' }
      : { text: 'проверь формат', tone: 'warn' };

  const roleHintTone: 'ok' | 'warn' | 'muted' = form.role === 'superadmin' ? 'warn' : 'muted';
  const roleHintText = form.role === 'superadmin' ? 'полный доступ' : `роль: ${form.role}`;

  function submit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setError('Имя, фамилия и email обязательны');
      return;
    }
    if (!emailValid) {
      setError('Неверный формат email');
      return;
    }
    if (!isEdit && form.password.length < 6) {
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
      title={isEdit ? `edit user · ${editing?.email ?? ''}` : 'new user'}
      size="md"
      hints={
        <HintFooter
          items={[
            { keys: [<Key key="e">Esc</Key>], label: 'закрыть' },
            { keys: [<Key key="c">⌘</Key>, <Key key="r">↵</Key>], label: 'сохранить' },
            { keys: [<Key key="t">↹</Key>], label: 'след. поле' },
          ]}
        />
      }
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="user-form"
            className="btn btn-primary btn-xs gap-1.5"
            disabled={mut.isPending}
          >
            {mut.isPending && <span className="loading loading-spinner loading-xs" />}
            <span className="font-mono">▸</span> {t('settings.save')}
          </button>
        </>
      }
    >
      <form id="user-form" className="space-y-4" onSubmit={onSubmit}>
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

        <CliSection label="Доступ" hint="учётка и роль в системе">
          <CliField
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            mono
            placeholder="ali@marsit.uz"
            hintText={emailHint.text}
            hintTone={emailHint.tone}
          />
          <CliField
            label="Телефон"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            mono
            placeholder="+998 90 000 00 00"
          />
          <CliSelect
            label="Роль"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={(v) => setForm({ ...form, role: v as Role })}
            hintText={roleHintText}
            hintTone={roleHintTone}
          />
        </CliSection>

        <CliSection label="Работа" hint="должность и стаж в академии">
          <CliField
            label="Должность"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            placeholder="Frontend · Junior группы"
          />
          <CliField
            label="Работает с"
            type="date"
            value={form.workingSince}
            onChange={(e) => setForm({ ...form, workingSince: e.target.value })}
            mono
            hintText="начало работы"
            hintTone="muted"
          />
          <CliTextarea
            label="Заметка"
            value={form.note}
            onChange={(v) => setForm({ ...form, note: v })}
            rows={3}
            maxLength={500}
            placeholder="Например: работает 2 года, ведёт Junior-группу, ответственный, студенты любят…"
            hint="никто кроме супер-админа не видит"
          />
        </CliSection>

        {!isEdit && (
          <CliSection label="Безопасность" hint="начальный пароль">
            <CliPasswordField
              label="Пароль"
              value={form.password}
              onChange={(v) => setForm({ ...form, password: v })}
              required
              minLength={6}
            />
          </CliSection>
        )}

        {error && (
          <div role="alert" className="mt-3 font-mono text-[12px] text-error border-l-2 border-error/50 pl-3 py-1 bg-error/5">
            <span className="text-error/60 mr-1">✕</span>
            {error}
          </div>
        )}
      </form>
    </Modal>
  );
}
