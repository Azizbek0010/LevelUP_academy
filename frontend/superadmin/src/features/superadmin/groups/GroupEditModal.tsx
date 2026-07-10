import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserPlus } from 'lucide-react';
import clsx from 'clsx';
import { groupsApi, type GroupItem, type GroupKind } from '../../../shared/api/endpoints/groups';
import { studentsApi } from '../../../shared/api/endpoints/students';
import { ApiError } from '../../../shared/api/http';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import { Avatar } from '../../../shared/ui/PageHeader';
import {
  CliCardChoice,
  CliDayPicker,
  CliField,
  CliError,
  CliSection,
  HintFooter,
  STANDARD_HINTS,
  useCliShortcuts,
} from '../../../shared/ui/cli';

interface Props {
  open: boolean;
  onClose: () => void;
  group: GroupItem | null;
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

export function GroupEditModal({ open, onClose, group }: Props): React.ReactElement {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    mentorName: '',
    lessonDays: [] as string[],
    lessonStartTime: '18:00',
    lessonEndTime: '20:00',
    monthlyFee: '600000',
    kind: 'group' as GroupKind,
  });
  const [addSearch, setAddSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Полные данные группы вместе с ростером
  const detailQuery = useQuery({
    queryKey: ['group', group?.id],
    queryFn: () => groupsApi.get(group!.id),
    enabled: open && !!group,
  });

  // Все студенты, чтобы искать не-состоящих
  const studentsQuery = useQuery({
    queryKey: ['students', { search: '', statusFilter: 'active', page: 1 }, 'all'],
    queryFn: () => studentsApi.list({ isArchived: false, pageSize: 200 }),
    enabled: open,
  });

  useEffect(() => {
    if (!open || !group) return;
    setForm({
      name: group.name,
      mentorName: group.mentorName,
      lessonDays: [...group.lessonDays],
      lessonStartTime: group.lessonStartTime,
      lessonEndTime: group.lessonEndTime,
      monthlyFee: String(group.monthlyFee),
      kind: group.kind ?? 'group',
    });
    setAddSearch('');
    setError(null);
  }, [open, group]);

  const saveMut = useMutation({
    mutationFn: () => {
      if (!group) throw new Error('no group');
      return groupsApi.update(group.id, {
        name: form.name.trim(),
        mentorName: form.mentorName.trim(),
        lessonDays: form.lessonDays,
        lessonStartTime: form.lessonStartTime,
        lessonEndTime: form.lessonEndTime,
        monthlyFee: Number(form.monthlyFee),
        kind: form.kind,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['group', group?.id] });
      toast.success('Группа обновлена');
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.payload.message : 'Не удалось сохранить');
    },
  });

  // Убрать студента из группы — оптимистично
  const removeStudentMut = useMutation({
    mutationFn: (studentId: string) => {
      if (!group) throw new Error('no group');
      return groupsApi.removeStudent(group.id, studentId);
    },
    onMutate: async (studentId) => {
      const key = ['group', group?.id];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const data = old as { students?: Array<{ id: string }>; studentCount?: number };
        const filtered = (data.students ?? []).filter((s) => s.id !== studentId);
        return { ...data, students: filtered, studentCount: filtered.length };
      });
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['group', group?.id], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['group', group?.id] });
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const addStudentMut = useMutation({
    mutationFn: (studentId: string) => {
      if (!group) throw new Error('no group');
      return groupsApi.addStudents(group.id, [studentId]);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['group', group?.id] });
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const roster = detailQuery.data?.students ?? [];
  const rosterIds = useMemo(() => new Set(roster.map((s) => s.id)), [roster]);
  const availableToAdd = useMemo(() => {
    const all = studentsQuery.data?.items ?? [];
    const filtered = all.filter((s) => !rosterIds.has(s.id) && !s.isArchived);
    if (!addSearch) return filtered.slice(0, 20);
    const q = addSearch.toLowerCase();
    return filtered
      .filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.parentPhone.includes(q),
      )
      .slice(0, 20);
  }, [studentsQuery.data, rosterIds, addSearch]);

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
    saveMut.mutate();
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
      title={group ? `edit group · ${group.name}` : 'edit group'}
      size="lg"
      hints={<HintFooter items={STANDARD_HINTS} />}
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
            Отмена
          </button>
          <button
            type="submit"
            form="edit-group-form"
            className="btn btn-primary btn-xs gap-1.5"
            disabled={saveMut.isPending}
          >
            {saveMut.isPending && <span className="loading loading-spinner loading-xs" />}
            <span className="font-mono">▸</span> Сохранить
          </button>
        </>
      }
    >
      <form id="edit-group-form" className="space-y-4" onSubmit={onSubmit}>
        <CliSection label="Тип группы">
          <CliCardChoice
            value={form.kind}
            onChange={(v) => setForm({ ...form, kind: v as GroupKind })}
            options={[
              { value: 'individual', label: 'Индивидуально', hint: '1 ученик' },
              { value: 'group', label: 'Группа', hint: 'много учеников' },
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
          />
          <CliField
            label="Ментор"
            value={form.mentorName}
            onChange={(e) => setForm({ ...form, mentorName: e.target.value })}
            required
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

        {/* Ростер — редактирование состава прямо тут */}
        <CliSection label="Ученики в группе" hint={`${roster.length} чел.`}>
          <div className="pl-4 space-y-2">
            {detailQuery.isLoading ? (
              <div className="text-center text-base-content/40 text-sm py-4">Загрузка…</div>
            ) : roster.length === 0 ? (
              <div className="text-[12px] text-base-content/40 font-mono">
                ○ пока никого — добавь ниже
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {roster.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-base-100 border border-base-300"
                  >
                    <Avatar name={`${s.firstName} ${s.lastName}`} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-medium truncate leading-tight">
                        {s.lastName} {s.firstName}
                      </div>
                      <div className="text-[10px] text-base-content/50 font-mono">
                        {s.parentPhone}
                      </div>
                    </div>
                    <button
                      type="button"
                      title="Убрать из группы"
                      onClick={() => removeStudentMut.mutate(s.id)}
                      disabled={
                        removeStudentMut.isPending &&
                        removeStudentMut.variables === s.id
                      }
                      className="size-7 rounded-md grid place-items-center text-error/60 hover:bg-error/10 hover:text-error transition-colors shrink-0"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Добавить ученика */}
            <div className="mt-3 space-y-1.5">
              <label className="flex items-center gap-2 border-b border-base-300 pb-1 focus-within:border-primary">
                <UserPlus className="size-3.5 text-base-content/40" />
                <input
                  type="search"
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="искать ученика для добавления…"
                  className="flex-1 bg-transparent text-base-content outline-none text-sm placeholder:text-base-content/40"
                />
              </label>
              {availableToAdd.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                  {availableToAdd.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => addStudentMut.mutate(s.id)}
                      disabled={
                        addStudentMut.isPending &&
                        addStudentMut.variables === s.id
                      }
                      className={clsx(
                        'text-left flex items-center gap-2 px-2 py-1.5 rounded-md border border-base-300 transition-colors',
                        'hover:border-primary hover:bg-primary/5',
                      )}
                    >
                      <UserPlus className="size-3.5 text-primary shrink-0" />
                      <span className="text-[13px] font-medium truncate">
                        {s.lastName} {s.firstName}
                      </span>
                      <span className="text-[10px] text-base-content/40 font-mono ml-auto shrink-0">
                        {s.parentPhone}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CliSection>

        <CliError>{error}</CliError>
      </form>
    </Modal>
  );
}
