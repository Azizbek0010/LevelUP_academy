import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Snowflake } from 'lucide-react';
import clsx from 'clsx';
import { studentsApi, type StudentDetail } from '../../../shared/api/endpoints/students';
import { ApiError } from '../../../shared/api/http';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import {
  CliError,
  CliField,
  CliSection,
  CliTextarea,
  HintFooter,
  STANDARD_HINTS,
  useCliShortcuts,
} from '../../../shared/ui/cli';

const REASONS = [
  'Болезнь',
  'Отъезд/командировка',
  'Финансовые трудности',
  'Летний отпуск',
  'Академический перерыв',
];

interface Props {
  open: boolean;
  onClose: () => void;
  student: StudentDetail | null;
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function FreezeModal({ open, onClose, student }: Props): React.ReactElement {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setCustomReason('');
      setExpectedReturnAt('');
      setNote('');
      setError(null);
    }
  }, [open, student]);

  const mut = useMutation({
    mutationFn: () => {
      if (!student) throw new Error('no student');
      const final = reason === '__custom__' ? customReason.trim() : reason;
      return studentsApi.freeze(student.id, {
        reason: final,
        expectedReturnAt: expectedReturnAt || null,
        note: note.trim() || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', student?.id] });
      qc.invalidateQueries({ queryKey: ['students'] });
      qc.invalidateQueries({ queryKey: ['upcoming-returns'] });
      toast.success('Студент в заморозке');
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.payload.message : 'Не удалось');
    },
  });

  function submit() {
    if (!reason || (reason === '__custom__' && !customReason.trim())) {
      setError('Укажи причину');
      return;
    }
    if (!expectedReturnAt) {
      setError('Укажи дату — когда студент обещал вернуться');
      return;
    }
    if (expectedReturnAt < todayPlus(0)) {
      setError('Дата возврата не может быть в прошлом');
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
      title={student ? `freeze · ${student.lastName} ${student.firstName}` : 'freeze'}
      size="md"
      hints={<HintFooter items={STANDARD_HINTS} />}
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
            Отмена
          </button>
          <button
            type="submit"
            form="freeze-form"
            className="btn btn-primary btn-xs gap-1.5"
            disabled={mut.isPending}
          >
            {mut.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Snowflake className="size-3.5" />
            )}
            <span className="font-mono">▸</span> Заморозить
          </button>
        </>
      }
    >
      <form id="freeze-form" className="space-y-4" onSubmit={onSubmit}>
        <div className="font-mono text-[11px] text-info bg-info/5 border-l-2 border-info/50 pl-3 py-1.5">
          △ пока в заморозке — платежи не начисляются, уведомления родителю не идут, посещаемость не отмечается
        </div>

        <CliSection label="Причина">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-4">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={clsx(
                  'text-left px-2.5 py-1.5 rounded border font-mono text-[12px] transition-all',
                  reason === r
                    ? 'border-primary bg-primary/10'
                    : 'border-base-300 text-base-content/70 hover:border-base-content/40',
                )}
              >
                {reason === r && <span className="text-primary mr-1">▸</span>}
                {r}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setReason('__custom__')}
              className={clsx(
                'text-left px-2.5 py-1.5 rounded border font-mono text-[12px] transition-all sm:col-span-2',
                reason === '__custom__'
                  ? 'border-primary bg-primary/10'
                  : 'border-base-300 text-base-content/70 hover:border-base-content/40',
              )}
            >
              {reason === '__custom__' && <span className="text-primary mr-1">▸</span>}
              Другое…
            </button>
          </div>
          {reason === '__custom__' && (
            <CliField
              label="Причина"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              required
              autoFocus
              placeholder="Своя причина"
            />
          )}
        </CliSection>

        <CliSection label="Когда обещал вернуться" hint="дата возврата · обязательно">
          <div className="pl-4 space-y-2">
            <input
              type="date"
              value={expectedReturnAt}
              onChange={(e) => setExpectedReturnAt(e.target.value)}
              min={todayPlus(0)}
              required
              className="w-full h-10 px-3 rounded-md border border-base-300 bg-base-100 text-base text-base-content outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors font-mono"
            />
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Завтра', days: 1 },
                { label: 'Через неделю', days: 7 },
                { label: 'Через 2 нед', days: 14 },
                { label: 'Через месяц', days: 30 },
              ].map((q) => (
                <button
                  key={q.days}
                  type="button"
                  onClick={() => setExpectedReturnAt(todayPlus(q.days))}
                  className="px-2 py-0.5 rounded font-mono text-[11px] border border-base-300 text-base-content/60 hover:border-base-content/40 hover:text-base-content transition-all"
                >
                  {q.label}
                </button>
              ))}
            </div>
            <div className="font-mono text-[11px] text-primary/80">
              ▸ за день до и в день возврата — напоминание в «Напоминаниях»
            </div>
          </div>
        </CliSection>

        <CliSection label="Заметка" hint="необязательно">
          <CliTextarea
            label="Комментарий"
            value={note}
            onChange={setNote}
            rows={3}
            maxLength={300}
            placeholder="Пример: родители обещали вернуться после Ozod bayrami"
          />
        </CliSection>

        <CliError>{error}</CliError>
      </form>
    </Modal>
  );
}
