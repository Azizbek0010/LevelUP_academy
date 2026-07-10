import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlarmClock,
  BellRing,
  CalendarX2,
  CircleAlert,
  CircleCheck,
  Save,
  Send,
} from 'lucide-react';
import clsx from 'clsx';
import { rulesApi, type RuleItem } from '../../../shared/api/endpoints/rules';
import { toast } from '../../../shared/ui/Toast';

const EVENT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  'debt.overdue': CircleAlert,
  'payment.received': CircleCheck,
  'homework.due': AlarmClock,
  'attendance.missed': CalendarX2,
};

const EVENT_COLOR: Record<string, string> = {
  'debt.overdue': 'text-error',
  'payment.received': 'text-success',
  'homework.due': 'text-warning',
  'attendance.missed': 'text-info',
};

function timeAgo(iso: string | null): string {
  if (!iso) return 'ни разу';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  const days = Math.floor(hr / 24);
  return `${days} дн назад`;
}

export function RulesTab(): React.ReactElement {
  const query = useQuery({
    queryKey: ['rules'],
    queryFn: () => rulesApi.list(),
  });

  const rules = query.data?.items ?? [];
  const activeCount = rules.filter((r) => r.enabled).length;
  const totalTriggered = rules.reduce((s, r) => s + r.triggeredCount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MiniStat label="Правил всего" value={rules.length} icon={BellRing} />
        <MiniStat label="Активных" value={activeCount} icon={CircleCheck} tone="success" />
        <MiniStat label="Отправлено" value={totalTriggered} icon={Send} tone="primary" />
      </div>

      <div className="text-sm text-base-content/60">
        Уведомления родителям летят автоматически через Telegram-бота. Здесь можно включать/выключать правила и редактировать шаблоны. Переменные:{' '}
        <code className="text-primary">{'{student}'}</code>, <code className="text-primary">{'{group}'}</code>, <code className="text-primary">{'{period}'}</code>, <code className="text-primary">{'{amount}'}</code>, <code className="text-primary">{'{debt}'}</code>.
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </div>
    </div>
  );
}

function RuleCard({ rule }: { rule: RuleItem }): React.ReactElement {
  const qc = useQueryClient();
  const [template, setTemplate] = useState(rule.template);
  const [expanded, setExpanded] = useState(false);
  const dirty = template !== rule.template;

  const enableMut = useMutation({
    mutationFn: (enabled: boolean) => rulesApi.update(rule.id, { enabled }),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['rules'] });
      toast.success(updated.enabled ? 'Правило включено' : 'Правило выключено');
    },
  });

  const saveMut = useMutation({
    mutationFn: () => rulesApi.update(rule.id, { template }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rules'] });
      toast.success('Шаблон сохранён');
    },
  });

  const Icon = EVENT_ICON[rule.event] ?? BellRing;
  const iconColor = EVENT_COLOR[rule.event] ?? 'text-base-content';

  return (
    <div
      className={clsx(
        'card border transition-colors chart-rise',
        rule.enabled ? 'bg-base-100 border-base-300' : 'bg-base-200/40 border-base-200',
      )}
    >
      <div className="card-body">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className={`inline-flex size-10 items-center justify-center rounded-xl bg-base-200 ${iconColor}`}>
              <Icon className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{rule.eventLabel}</span>
                <code className="text-[10px] text-base-content/50 bg-base-200/60 rounded px-1.5 py-0.5">
                  {rule.event}
                </code>
              </div>
              <div className="text-xs text-base-content/60 mt-0.5">{rule.description}</div>
              <div className="flex items-center gap-3 text-xs text-base-content/50 mt-1.5">
                <span>Сработало: <span className="font-medium text-base-content/70">{rule.triggeredCount}</span></span>
                <span>·</span>
                <span>Последнее: <span className="font-medium text-base-content/70">{timeAgo(rule.lastTriggered)}</span></span>
              </div>
            </div>
          </div>
          <label className="cursor-pointer inline-flex items-center gap-2">
            <span className="text-xs text-base-content/60">{rule.enabled ? 'Активно' : 'Отключено'}</span>
            <input
              type="checkbox"
              className="toggle toggle-primary toggle-sm"
              checked={rule.enabled}
              onChange={(e) => enableMut.mutate(e.target.checked)}
            />
          </label>
        </div>

        {expanded ? (
          <div className="mt-3 space-y-2">
            <textarea
              className="textarea textarea-bordered w-full h-24 text-sm font-mono"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => {
                  setTemplate(rule.template);
                  setExpanded(false);
                }}
              >
                Свернуть
              </button>
              <button
                type="button"
                className="btn btn-primary btn-xs gap-1"
                onClick={() => saveMut.mutate()}
                disabled={!dirty || saveMut.isPending}
              >
                <Save className="size-3.5" />
                Сохранить шаблон
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 text-left text-sm text-base-content/70 bg-base-200/40 rounded-lg px-3 py-2 hover:bg-base-200 transition-colors"
          >
            {template}
          </button>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone?: 'neutral' | 'success' | 'primary';
}): React.ReactElement {
  const toneCls =
    tone === 'success' ? 'text-success' : tone === 'primary' ? 'text-primary' : 'text-base-content';
  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body py-3">
        <div className="flex items-center gap-2 text-xs text-base-content/60">
          <Icon className="size-3.5" />
          {label}
        </div>
        <div className={`text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</div>
      </div>
    </div>
  );
}
