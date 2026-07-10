import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Users2 } from 'lucide-react';
import clsx from 'clsx';
import { groupsApi, type GroupItem } from '../../../shared/api/endpoints/groups';
import { ApiError } from '../../../shared/api/http';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import {
  CliError,
  CliSection,
  HintFooter,
  STANDARD_HINTS,
  useCliShortcuts,
} from '../../../shared/ui/cli';
import { Avatar } from '../../../shared/ui/PageHeader';
import type { StudentListItem } from '../../../shared/api/endpoints/students';

interface Props {
  open: boolean;
  onClose: () => void;
  student: StudentListItem | null;
}

const DAY_LABEL: Record<string, string> = {
  mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс',
};

export function AddToGroupModal({ open, onClose, student }: Props): React.ReactElement {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const groupsQuery = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsApi.list(),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setSelected(new Set());
      setError(null);
    }
  }, [open, student]);

  const groups = useMemo(
    () => (groupsQuery.data?.items ?? []).filter((g) => g.status === 'active'),
    [groupsQuery.data],
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const mut = useMutation({
    mutationFn: async () => {
      if (!student) return { added: 0 };
      const ids = Array.from(selected);
      let added = 0;
      for (const gid of ids) {
        const res = await groupsApi.addStudents(gid, [student.id]);
        added += res.added;
      }
      return { added };
    },
    onSuccess: ({ added }) => {
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['groups'] });
      qc.invalidateQueries({ queryKey: ['group'] });
      toast.success(
        added > 0 ? `Добавлен в ${added} гр.` : 'Уже был в этих группах',
      );
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.payload.message : 'Не удалось добавить');
    },
  });

  function submit() {
    if (!student) return;
    if (selected.size === 0) {
      setError('Выберите хотя бы одну группу');
      return;
    }
    setError(null);
    mut.mutate();
  }

  useCliShortcuts({ onSubmit: submit, enabled: open });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={student ? `add to group · ${student.lastName} ${student.firstName}` : 'add to group'}
      size="lg"
      hints={<HintFooter items={STANDARD_HINTS} />}
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary btn-xs gap-1.5"
            disabled={mut.isPending || selected.size === 0}
            onClick={submit}
          >
            {mut.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <UserPlus className="size-3.5" />
            )}
            <span className="font-mono">▸</span> Добавить{' '}
            {selected.size > 0 && (
              <span className="opacity-70">· {selected.size}</span>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {student && (
          <div className="font-mono text-[11px] text-base-content/60 bg-base-200/40 border border-base-300 rounded px-2.5 py-1.5 flex items-center gap-2">
            <Avatar name={`${student.firstName} ${student.lastName}`} size="sm" />
            <span>
              студент:{' '}
              <span className="text-base-content font-medium">
                {student.lastName} {student.firstName}
              </span>{' '}
              · тел. родителя{' '}
              <span className="text-base-content">{student.parentPhone}</span>
            </span>
          </div>
        )}

        <CliSection
          label="Активные группы"
          hint={
            groupsQuery.isLoading
              ? 'загрузка…'
              : `${groups.length} доступно · выбрано ${selected.size}`
          }
        >
          {groupsQuery.isLoading ? (
            <div className="text-center text-base-content/40 text-sm py-8">Загрузка…</div>
          ) : groups.length === 0 ? (
            <div className="text-center text-base-content/40 text-sm py-6">
              <span className="font-mono">○</span> Активных групп нет — создай сначала группу
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 max-h-96 overflow-y-auto pl-4 pr-2">
              {groups.map((g) => (
                <GroupOption
                  key={g.id}
                  group={g}
                  selected={selected.has(g.id)}
                  onToggle={() => toggle(g.id)}
                />
              ))}
            </div>
          )}
        </CliSection>

        <CliError>{error}</CliError>
      </div>
    </Modal>
  );
}

function GroupOption({
  group,
  selected,
  onToggle,
}: {
  group: GroupItem;
  selected: boolean;
  onToggle: () => void;
}): React.ReactElement {
  const days = group.lessonDays.map((d) => DAY_LABEL[d] ?? d).join(' ');
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        'text-left flex items-start gap-2.5 p-2.5 rounded-lg border transition-all',
        selected
          ? 'border-primary bg-primary/10 shadow-sm'
          : 'border-base-300 hover:border-base-content/30 hover:bg-base-200/40',
      )}
    >
      <div
        className={clsx(
          'size-5 rounded border-2 grid place-items-center shrink-0 mt-0.5 transition-colors',
          selected ? 'border-primary bg-primary' : 'border-base-300',
        )}
      >
        {selected && (
          <span className="text-primary-content text-[11px] font-black leading-none">✓</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Users2 className="size-3.5 text-base-content/40 shrink-0" />
          <span className="text-[13px] font-medium truncate">{group.name}</span>
        </div>
        <div className="text-[11px] text-base-content/50 font-mono mt-0.5 pl-5">
          {group.mentorName} · {days} · {group.lessonStartTime}–{group.lessonEndTime}
        </div>
        <div className="text-[10px] text-base-content/40 pl-5">
          {group.studentCount} студентов · {group.monthlyFee.toLocaleString('ru-RU')} сум/мес
        </div>
      </div>
    </button>
  );
}
