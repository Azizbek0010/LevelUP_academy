import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi } from '../../../shared/api/endpoints/groups';
import { ApiError } from '../../../shared/api/http';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import {
  CliField,
  CliSection,
  CliCardChoice,
  CliDayPicker,
  CliError,
  HintFooter,
  STANDARD_HINTS,
  useCliShortcuts,
} from '../../../shared/ui/cli';

interface Props {
  open: boolean;
  onClose: () => void;
}

const DAYS = [
  { value: 'mon', label: 'Пн' },
  { value: 'tue', label: 'Вт' },
  { value: 'wed', label: 'Ср' },
  { value: 'thu', label: 'Чт' },
  { value: 'fri', label: 'Пт' },
  { value: 'sat', label: 'Сб' },
  { value: 'sun', label: 'Вс' },
];

type GroupKind = 'individual' | 'group';

const EMPTY = {
  kind: 'group' as GroupKind,
  name: '',
  mentorName: '',
  lessonDays: [] as string[],
  lessonStartTime: '18:00',
  lessonEndTime: '20:00',
  monthlyFee: '600000',
};

export function GroupFormModal({ open, onClose }: Props): React.ReactElement {
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
      groupsApi.create({
        name: form.name.trim(),
        mentorName: form.mentorName.trim(),
        lessonDays: form.lessonDays,
        lessonStartTime: form.lessonStartTime,
        lessonEndTime: form.lessonEndTime,
        monthlyFee: Number(form.monthlyFee),
        kind: form.kind,
      } as unknown as Parameters<typeof groupsApi.create>[0]),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      toast.success(`Группа "${created.name}" создана`);
      onClose();
    },
    onError: (err) => {
      if (err instanceof ApiError) setError(err.payload.message);
      else setError('Не удалось сохранить');
    },
  });

  function submit() {
    if (!form.name.trim() || !form.mentorName.trim()) {
      setError('Название и ментор обязательны');
      return;
    }
    if (form.lessonDays.length === 0) {
      setError('Выберите хотя бы один день недели');
      return;
    }
    if (form.lessonStartTime >= form.lessonEndTime) {
      setError('Время начала должно быть раньше окончания');
      return;
    }
    const fee = Number(form.monthlyFee);
    if (isNaN(fee) || fee < 0) {
      setError('Абонемент должен быть положительным числом');
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

  const daysHint =
    form.lessonDays.length === 0
      ? 'ни один день не выбран'
      : `${form.lessonDays.length} дн/нед`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="new group"
      size="lg"
      hints={<HintFooter items={STANDARD_HINTS} />}
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
            Отмена
          </button>
          <button
            type="submit"
            form="group-form"
            className="btn btn-primary btn-xs gap-1.5"
            disabled={mut.isPending}
          >
            {mut.isPending && <span className="loading loading-spinner loading-xs" />}
            <span className="font-mono">▸</span> Сохранить
          </button>
        </>
      }
    >
      <form id="group-form" className="space-y-4" onSubmit={onSubmit}>
        <CliSection label="Тип группы" hint="сколько учеников">
          <CliCardChoice
            value={form.kind}
            onChange={(v) => setForm({ ...form, kind: v as GroupKind })}
            options={[
              { value: 'individual', label: 'Индивидуально', hint: '1 ученик — репетитор-стиль' },
              { value: 'group', label: 'Группа', hint: 'много учеников — стандарт' },
            ]}
            columns={2}
          />
        </CliSection>

        <CliSection label="Идентификация">
          <CliField
            label="Название"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
            placeholder="Frontend · Junior · MW-Evening"
          />
          <CliField
            label="Ментор"
            value={form.mentorName}
            onChange={(e) => setForm({ ...form, mentorName: e.target.value })}
            required
            placeholder="Санжар Джураев"
          />
        </CliSection>

        <CliSection label="Расписание">
          <CliDayPicker
            label="Дни недели"
            value={form.lessonDays}
            onChange={(v) => setForm({ ...form, lessonDays: v })}
            options={DAYS}
            required
            hint={daysHint}
          />
          <CliField
            label="Начало"
            type="time"
            value={form.lessonStartTime}
            onChange={(e) => setForm({ ...form, lessonStartTime: e.target.value })}
            required
            mono
          />
          <CliField
            label="Конец"
            type="time"
            value={form.lessonEndTime}
            onChange={(e) => setForm({ ...form, lessonEndTime: e.target.value })}
            required
            mono
          />
        </CliSection>

        <CliSection label="Финансы">
          <CliField
            label="Абонемент"
            type="number"
            value={form.monthlyFee}
            onChange={(e) => setForm({ ...form, monthlyFee: e.target.value })}
            required
            mono
            hintText="сум/мес"
            hintTone="muted"
          />
        </CliSection>

        <CliError>{error}</CliError>
      </form>
    </Modal>
  );
}
