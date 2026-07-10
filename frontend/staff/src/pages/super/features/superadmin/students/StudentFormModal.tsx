// @ts-nocheck
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../../../shared/api/endpoints/students';
import { ApiError } from '../../../shared/api/http';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import {
  CliField,
  CliSection,
  CliError,
  HintFooter,
  STANDARD_HINTS,
  useCliShortcuts,
} from '../../../shared/ui/cli';

interface Props {
  open: boolean;
  onClose: () => void;
}

const EMPTY = {
  firstName: '',
  lastName: '',
  phone: '',
  parentPhone: '',
  parentPhone2: '',
  telegramChatId: '',
};

const UZ_PHONE_RE = /^\+998\d{9}$/;

export function StudentFormModal({ open, onClose }: Props): React.ReactElement {
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
    mutationFn: (input: typeof EMPTY) =>
      studentsApi.create({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        phone: input.phone.trim() || null,
        parentPhone: input.parentPhone.trim(),
        parentPhone2: input.parentPhone2.trim() || null,
        telegramChatId: input.telegramChatId.trim() || null,
      }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      toast.success(`Студент "${created.lastName} ${created.firstName}" добавлен`);
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) setError(err.payload.message);
      else setError('Не удалось сохранить');
    },
  });

  const parentValid = useMemo(() => UZ_PHONE_RE.test(form.parentPhone.trim()), [form.parentPhone]);
  const parentHint: { text: string; tone: 'ok' | 'warn' | 'muted' } = form.parentPhone.length === 0
    ? { text: '+998XXXXXXXXX', tone: 'muted' }
    : parentValid
      ? { text: 'формат ок', tone: 'ok' }
      : { text: 'нужен +998XXXXXXXXX', tone: 'warn' };

  function submit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.parentPhone.trim()) {
      setError('Имя, фамилия и телефон родителя обязательны');
      return;
    }
    if (!parentValid) {
      setError('Телефон родителя в формате +998XXXXXXXXX');
      return;
    }
    setError(null);
    mut.mutate(form);
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
      title="new student"
      size="md"
      hints={<HintFooter items={STANDARD_HINTS} />}
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
            Отмена
          </button>
          <button
            type="submit"
            form="student-form"
            className="btn btn-primary btn-xs gap-1.5"
            disabled={mut.isPending}
          >
            {mut.isPending && <span className="loading loading-spinner loading-xs" />}
            <span className="font-mono">▸</span> Сохранить
          </button>
        </>
      }
    >
      <form id="student-form" className="space-y-4" onSubmit={onSubmit}>
        <CliSection label="Личное">
          <CliField
            label="Имя"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            required
            autoFocus
            placeholder="Айгуль"
          />
          <CliField
            label="Фамилия"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            required
            placeholder="Джураева"
          />
        </CliSection>

        <CliSection label="Контакты" hint="хотя бы один номер родителя обязателен">
          <CliField
            label="Родитель·1"
            type="tel"
            value={form.parentPhone}
            onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
            required
            mono
            placeholder="+998901234567"
            hintText={parentHint.text}
            hintTone={parentHint.tone}
          />
          <CliField
            label="Родитель·2"
            type="tel"
            value={form.parentPhone2}
            onChange={(e) => setForm({ ...form, parentPhone2: e.target.value })}
            mono
            placeholder="+998901234567"
            hintText="необязательно"
            hintTone="muted"
          />
          <CliField
            label="Студент"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            mono
            placeholder="+998901234567"
            hintText="необязательно"
            hintTone="muted"
          />
        </CliSection>

        <CliSection label="Уведомления" hint="Telegram chat id для рассылок">
          <CliField
            label="Chat ID"
            value={form.telegramChatId}
            onChange={(e) => setForm({ ...form, telegramChatId: e.target.value })}
            mono
            placeholder="123456789"
          />
        </CliSection>

        <CliError>{error}</CliError>
      </form>
    </Modal>
  );
}
