// @ts-nocheck
import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send } from 'lucide-react';
import clsx from 'clsx';
import type { AnnouncementTarget } from '../../../shared/api/endpoints/announcements';
import { announcementsApi } from '../../../shared/api/endpoints/announcements';
import { branchesApi } from '../../../shared/api/endpoints/branches';
import { ApiError } from '../../../shared/api/http';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import {
  CliCardChoice,
  CliField,
  CliSection,
  CliTextarea,
  CliError,
  HintFooter,
  STANDARD_HINTS,
  useCliShortcuts,
} from '../../../shared/ui/cli';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormState {
  title: string;
  body: string;
  targetType: AnnouncementTarget;
  targetLabel: string;
}

const EMPTY: FormState = {
  title: '',
  body: '',
  targetType: 'all-staff',
  targetLabel: 'Все сотрудники',
};

const QUICK_TARGETS: Array<{ value: AnnouncementTarget; label: string; hint: string }> = [
  { value: 'all-staff', label: 'Все сотрудники', hint: 'админы + менторы' },
  { value: 'all-admins', label: 'Все админы', hint: 'только админы филиалов' },
  { value: 'all-mentors', label: 'Все менторы', hint: 'все преподаватели' },
];

export function AnnouncementModal({ open, onClose }: Props): React.ReactElement {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: () => branchesApi.list(),
    enabled: open,
  });
  const activeBranches = branchesQuery.data?.items.filter((b) => b.status === 'active') ?? [];

  useEffect(() => {
    if (open) {
      setForm(EMPTY);
      setError(null);
    }
  }, [open]);

  const mut = useMutation({
    mutationFn: () =>
      announcementsApi.create({
        title: form.title.trim(),
        body: form.body.trim(),
        targetType: form.targetType,
        targetLabel: form.targetLabel,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      qc.invalidateQueries({ queryKey: ['audit'] });
      toast.success('Анонс отправлен');
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.payload.message : 'Не удалось отправить');
    },
  });

  function submit() {
    if (!form.title.trim()) {
      setError('Введите заголовок');
      return;
    }
    if (!form.body.trim()) {
      setError('Введите текст сообщения');
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
      title="new announcement"
      size="lg"
      hints={<HintFooter items={STANDARD_HINTS} />}
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
            Отмена
          </button>
          <button
            type="submit"
            form="announcement-form"
            className="btn btn-primary btn-xs gap-1.5"
            disabled={mut.isPending}
          >
            {mut.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Send className="size-3.5" />
            )}
            <span className="font-mono">▸</span> отправить
          </button>
        </>
      }
    >
      <form id="announcement-form" className="space-y-4" onSubmit={onSubmit}>
        <CliSection label="Кому" hint={form.targetLabel}>
          <CliCardChoice
            value={form.targetType}
            onChange={(v) => {
              const meta = QUICK_TARGETS.find((x) => x.value === v);
              if (meta) setForm({ ...form, targetType: v as AnnouncementTarget, targetLabel: meta.label });
            }}
            options={QUICK_TARGETS.map((t) => ({ value: t.value, label: t.label, hint: t.hint }))}
            columns={3}
          />

          {activeBranches.length > 0 && (
            <div className="mt-2">
              <div className="text-[11px] font-mono text-base-content/40 pl-4 mb-1">
                · или конкретный филиал:
              </div>
              <div className="flex flex-wrap gap-1 pl-4">
                {activeBranches.map((b) => {
                  const active = form.targetType === `branch:${b.id}`;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          targetType: `branch:${b.id}`,
                          targetLabel: `Филиал ${b.name}`,
                        })
                      }
                      className={clsx(
                        'px-2 py-0.5 rounded font-mono text-[11px] border transition-all',
                        active
                          ? 'bg-primary text-primary-content border-primary'
                          : 'border-base-300 text-base-content/60 hover:border-base-content/40 hover:text-base-content',
                      )}
                    >
                      {active && <span className="mr-0.5">▸</span>}
                      {b.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CliSection>

        <CliSection label="Сообщение">
          <CliField
            label="Заголовок"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            maxLength={120}
            placeholder="Инвентаризация в четверг"
          />
          <CliTextarea
            label="Текст"
            value={form.body}
            onChange={(v) => setForm({ ...form, body: v })}
            required
            maxLength={2000}
            rows={6}
            placeholder="Напиши подробности…"
            hint="markdown не поддерживается"
          />
        </CliSection>

        <CliError>{error}</CliError>
      </form>
    </Modal>
  );
}
