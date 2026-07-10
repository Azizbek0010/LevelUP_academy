import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Coins,
  CreditCard,
  MessageSquare,
  Phone,
  Send,
  Snowflake,
  Split,
  Sun,
  UserPlus,
  Wallet,
  Wifi,
} from 'lucide-react';
import clsx from 'clsx';
import { studentsApi } from '../../../shared/api/endpoints/students';
import { toast } from '../../../shared/ui/Toast';
import { Avatar } from '../../../shared/ui/PageHeader';
import { AddToGroupModal } from './AddToGroupModal';
import { FreezeModal } from './FreezeModal';
import { SendMessageModal } from './SendMessageModal';

const METHOD_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    cls: string;
    iconBg: string;
  }
> = {
  cash: {
    label: 'Наличные',
    icon: Coins,
    cls: 'bg-warning/15 text-warning border-warning/30',
    iconBg: 'bg-warning/20 text-warning',
  },
  card: {
    label: 'Карта',
    icon: CreditCard,
    cls: 'bg-info/15 text-info border-info/30',
    iconBg: 'bg-info/20 text-info',
  },
  split: {
    label: 'Разбит',
    icon: Split,
    cls: 'bg-primary/15 text-primary border-primary/30',
    iconBg: 'bg-primary/20 text-primary',
  },
};

const CURRENCY = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ч назад`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days} дн назад`;
  const months = Math.floor(days / 30);
  return `${months} мес назад`;
}

function monthsSince(iso: string): number {
  const created = new Date(iso);
  const now = new Date();
  const months =
    (now.getFullYear() - created.getFullYear()) * 12 +
    (now.getMonth() - created.getMonth());
  return Math.max(0, months);
}

function daysToDate(iso: string): string {
  const t = new Date(iso);
  t.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((t.getTime() - today.getTime()) / 86400_000);
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'завтра';
  if (diff === -1) return 'вчера';
  if (diff > 0) return `через ${diff} дн`;
  return `${Math.abs(diff)} дн назад`;
}

export default function StudentDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [groupOpen, setGroupOpen] = useState(false);
  const [freezeOpen, setFreezeOpen] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);

  const query = useQuery({
    queryKey: ['student', id],
    queryFn: () => studentsApi.get(id!),
    enabled: !!id,
  });

  const unfreezeMut = useMutation({
    mutationFn: () => studentsApi.unfreeze(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', id] });
      qc.invalidateQueries({ queryKey: ['students'] });
      toast.success('Заморозка снята');
    },
  });

  if (query.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="p-8">
        <div className="alert alert-error">
          <span>Не удалось загрузить студента</span>
        </div>
      </div>
    );
  }

  const s = query.data;
  const totalAttendance = s.attendanceStats.present + s.attendanceStats.absent;
  const attendanceRate =
    totalAttendance > 0
      ? Math.round((s.attendanceStats.present / totalAttendance) * 100)
      : null;
  const months = monthsSince(s.createdAt);
  const paidCovers = s.groups.length > 0 && s.monthsPaid > 0
    ? `${s.monthsPaid} мес из ~${Math.max(1, months)}`
    : '—';
  const paidStatusLabel: Record<string, { text: string; tone: string }> = {
    paid: { text: 'оплачен', tone: 'text-success bg-success/10 border-success/30' },
    debt: { text: 'долг', tone: 'text-error bg-error/10 border-error/30' },
    frozen: { text: 'заморозка', tone: 'text-info bg-info/10 border-info/30' },
    unknown: { text: '—', tone: 'text-base-content/50 bg-base-200 border-base-300' },
  };
  const currentMonthCls = paidStatusLabel[s.currentMonthStatus] ?? paidStatusLabel.unknown!;

  return (
    <div className="p-8 space-y-4 max-w-6xl">
      <div>
        <Link to="/superadmin/students" className="btn btn-ghost btn-xs gap-1">
          <ArrowLeft className="size-3.5" /> К списку студентов
        </Link>
      </div>

      {/* Заморозка баннер */}
      {s.freeze && (
        <div className="rounded-2xl border border-info/40 bg-info/5 p-4 flex items-start gap-3">
          <div className="size-9 rounded-lg bg-info/15 text-info grid place-items-center shrink-0">
            <Snowflake className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-info">Студент в заморозке</div>
            <div className="text-[12px] text-base-content/70 mt-0.5">
              с <span className="font-medium">{new Date(s.freeze.since).toLocaleDateString('ru-RU')}</span>{' '}
              ({timeAgo(s.freeze.since)}) · причина:{' '}
              <span className="font-medium">{s.freeze.reason}</span>
            </div>
            {s.freeze.expectedReturnAt && (
              <div className="text-[12px] mt-1">
                <span className="text-base-content/50">Обещал вернуться:</span>{' '}
                <span className="font-medium text-info">
                  {new Date(s.freeze.expectedReturnAt).toLocaleDateString('ru-RU')}
                </span>
                {' · '}
                <span className="text-base-content/70">
                  {daysToDate(s.freeze.expectedReturnAt)}
                </span>
              </div>
            )}
            {s.freeze.note && (
              <div className="text-[12px] text-base-content/60 mt-1 font-mono">
                ○ {s.freeze.note}
              </div>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-xs gap-1.5 shrink-0"
            disabled={unfreezeMut.isPending}
            onClick={() => unfreezeMut.mutate()}
          >
            {unfreezeMut.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Sun className="size-3.5" />
            )}
            Снять заморозку
          </button>
        </div>
      )}

      {/* Header + actions */}
      <div className="bg-base-100 border border-base-300 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0">
              <Avatar name={`${s.firstName} ${s.lastName}`} size="lg" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight leading-tight">
                {s.lastName} {s.firstName}
              </h1>
              <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                <Chip tone="success">актив</Chip>
                {s.telegramChatId ? (
                  <Chip tone="info">
                    <Send className="size-3" /> TG подключён
                  </Chip>
                ) : (
                  <Chip tone="warn">
                    <Send className="size-3" /> без TG
                  </Chip>
                )}
                {s.freeze && (
                  <Chip tone="info">
                    <Snowflake className="size-3" /> заморозка
                  </Chip>
                )}
                <Chip tone="muted">
                  <Calendar className="size-3" /> с нами {months} мес
                </Chip>
                <Chip tone="muted">
                  <Wifi className="size-3" /> {timeAgo(s.lastVisitAt)}
                </Chip>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              className="btn btn-primary btn-sm gap-1.5 rounded-lg"
              onClick={() => setGroupOpen(true)}
            >
              <UserPlus className="size-3.5" /> В группу
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm gap-1.5 rounded-lg"
              onClick={() => setMsgOpen(true)}
            >
              <MessageSquare className="size-3.5" /> Сообщение
            </button>
            {!s.freeze && (
              <button
                type="button"
                className="btn btn-ghost btn-sm gap-1.5 rounded-lg border border-info/30 text-info"
                onClick={() => setFreezeOpen(true)}
              >
                <Snowflake className="size-3.5" /> Заморозить
              </button>
            )}
          </div>
        </div>

        {/* Contacts row */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <Contact icon={Phone} label="Тел. студента" value={s.phone ?? '—'} mono />
          <Contact icon={Phone} label="Тел. родителя" value={s.parentPhone} mono />
          {s.parentPhone2 && (
            <Contact icon={Phone} label="Тел. родителя 2" value={s.parentPhone2} mono />
          )}
          {s.telegramChatId && (
            <Contact icon={Send} label="Telegram chat ID" value={s.telegramChatId} mono />
          )}
          <Contact
            icon={Calendar}
            label="В системе с"
            value={new Date(s.createdAt).toLocaleDateString('ru-RU')}
            sub={`${months} мес`}
          />
        </div>
      </div>

      {/* Financial + Attendance summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard
          icon={Wallet}
          label="Оплачено"
          value={CURRENCY.format(s.paidTotal)}
          hint={paidCovers}
        />
        <SummaryCard
          icon={Wallet}
          label="Тек. месяц"
          value={
            <span
              className={clsx(
                'inline-flex items-center px-2 py-0.5 rounded-full border text-[13px] font-semibold',
                currentMonthCls.tone,
              )}
            >
              {currentMonthCls.text}
            </span>
          }
          hint={
            s.currentDebt > 0
              ? `долг ${CURRENCY.format(s.currentDebt)} сум`
              : s.freeze
                ? 'платежи не начисляются'
                : '—'
          }
        />
        <SummaryCard
          label="Пришёл / Пропустил"
          value={
            <span className="text-lg">
              <span className="text-success">{s.attendanceStats.present}</span>{' '}
              /{' '}
              <span className="text-error">{s.attendanceStats.absent}</span>
            </span>
          }
          hint={
            attendanceRate !== null ? `${attendanceRate}% посещаемости` : 'нет данных'
          }
        />
        <SummaryCard
          label="Групп"
          value={String(s.groups.length)}
          hint={s.groups.length === 0 ? 'не состоит в группах' : 'активных сейчас'}
          accent={s.groups.length > 0}
        />
      </div>

      {/* Groups list */}
      <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-base-300 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-base-content/50 font-bold">
              Группы
            </div>
            <div className="text-base font-semibold leading-tight">
              {s.groups.length === 0 ? 'Не состоит в группах' : `${s.groups.length} гр.`}
            </div>
          </div>
          {!s.isArchived && (
            <button
              type="button"
              className="btn btn-ghost btn-xs gap-1 border border-base-300 rounded-lg"
              onClick={() => setGroupOpen(true)}
            >
              <UserPlus className="size-3.5" /> Добавить
            </button>
          )}
        </div>
        {s.groups.length === 0 ? (
          <div className="p-6 text-center text-base-content/50 text-sm">
            <span className="font-mono">○</span> Нажми «Добавить», чтобы включить студента в группу
          </div>
        ) : (
          <ul className="divide-y divide-base-300">
            {s.groups.map((g) => (
              <li key={g.id} className="px-5 py-2.5 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary/15 text-primary grid place-items-center text-[11px] font-mono">
                  ▸
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{g.name}</div>
                  <div className="text-[11px] text-base-content/50 font-mono">
                    с {new Date(g.joinedAt).toLocaleDateString('ru-RU')} ·{' '}
                    {timeAgo(g.joinedAt)}
                  </div>
                </div>
                {g.status === 'archived' && <Chip tone="muted">архив</Chip>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Payments — карточки с иконкой способа */}
      <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-base-300 bg-base-200/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-base-content/50 font-bold">
              Платежи · когда · сколько · как
            </div>
            <div className="text-base font-semibold leading-tight">
              {s.recentPayments.length === 0
                ? 'Платежей ещё не было'
                : `Последние ${s.recentPayments.length}`}
            </div>
          </div>
          {s.recentPayments.length > 0 && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest text-base-content/50 font-bold">
                Оплачено всего
              </div>
              <div className="font-mono font-bold text-base tabular-nums text-success">
                {CURRENCY.format(s.paidTotal)}
              </div>
            </div>
          )}
        </div>
        {s.recentPayments.length === 0 ? (
          <div className="p-8 text-center text-base-content/50 text-sm">
            <span className="font-mono">○</span> История платежей пуста
          </div>
        ) : (
          <ul className="divide-y divide-base-300">
            {s.recentPayments.map((p) => {
              const meta = METHOD_META[p.method] ?? METHOD_META.cash!;
              const Icon = meta.icon;
              const paidDate = new Date(p.paidAt);
              const dateStr = paidDate.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = paidDate.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <li
                  key={p.id}
                  className="px-5 py-3.5 flex items-center gap-4 hover:bg-base-200/40 transition-colors"
                >
                  <div
                    className={clsx(
                      'size-11 rounded-xl grid place-items-center shrink-0',
                      meta.iconBg,
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0 flex items-baseline gap-3 flex-wrap">
                    <div>
                      <div className="font-semibold text-lg tabular-nums leading-tight">
                        {CURRENCY.format(Number(p.amount))}
                        <span className="text-base-content/50 font-normal text-sm ml-1">
                          сум
                        </span>
                      </div>
                      <div className="text-[11px] text-base-content/50 font-mono">
                        абонемент за{' '}
                        <span className="text-base-content/80">
                          {String(p.periodMonth).padStart(2, '0')}.{p.periodYear}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={clsx(
                      'inline-flex items-center gap-1 h-6 px-2.5 rounded-full border text-[11px] font-bold uppercase tracking-wide shrink-0',
                      meta.cls,
                    )}
                  >
                    <Icon className="size-3" />
                    {meta.label}
                  </div>
                  <div className="text-right shrink-0 min-w-[120px]">
                    <div className="flex items-center gap-1 justify-end text-[12px] font-medium">
                      <Calendar className="size-3 text-base-content/40" />
                      {dateStr}
                    </div>
                    <div className="flex items-center gap-1 justify-end text-[11px] text-base-content/50 font-mono">
                      <Clock className="size-3" />
                      {timeStr} · {timeAgo(p.paidAt)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Sent messages history */}
      <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-base-300 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-base-content/50 font-bold">
              Сообщения родителю
            </div>
            <div className="text-base font-semibold leading-tight">
              {s.sentMessages.length === 0
                ? 'Ещё не отправляли'
                : `Всего: ${s.sentMessages.length}`}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs gap-1 border border-base-300 rounded-lg"
            onClick={() => setMsgOpen(true)}
          >
            <MessageSquare className="size-3.5" /> Отправить
          </button>
        </div>
        {s.sentMessages.length === 0 ? (
          <div className="p-6 text-center text-base-content/50 text-sm">
            <span className="font-mono">○</span> История пуста — нажми «Отправить»
          </div>
        ) : (
          <ul className="divide-y divide-base-300">
            {s.sentMessages.map((m) => (
              <li key={m.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 px-2 h-5 rounded-full border text-[10px] font-bold uppercase tracking-wide',
                        m.via === 'telegram'
                          ? 'bg-info/15 text-info border-info/30'
                          : 'bg-warning/15 text-warning border-warning/30',
                      )}
                    >
                      {m.via === 'telegram' ? <Send className="size-3" /> : <MessageSquare className="size-3" />}
                      {m.via}
                    </span>
                    <span
                      className={clsx(
                        'inline-flex items-center gap-1 px-2 h-5 rounded-full text-[10px] font-bold uppercase tracking-wide',
                        m.status === 'sent'
                          ? 'bg-success/15 text-success'
                          : m.status === 'failed'
                            ? 'bg-error/15 text-error'
                            : 'bg-base-300 text-base-content/60 animate-pulse',
                      )}
                    >
                      {m.status === 'sent' ? '✓ доставлено' : m.status === 'failed' ? '✕ ошибка' : '○ в пути'}
                    </span>
                    <span className="text-[11px] text-base-content/50">
                      от <span className="text-base-content/80 font-medium">{m.senderName}</span>
                    </span>
                  </div>
                  <div className="text-[11px] text-base-content/50 font-mono shrink-0">
                    {new Date(m.sentAt).toLocaleString('ru-RU', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                    <span className="mx-1 text-base-content/25">·</span>
                    {timeAgo(m.sentAt)}
                  </div>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-[13px] bg-base-200/40 rounded-md p-2 border border-base-300">
                  {m.message}
                </div>
                {m.error && (
                  <div className="mt-1 text-[11px] text-error font-mono">
                    ✕ {m.error}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modals */}
      <AddToGroupModal
        open={groupOpen}
        onClose={() => setGroupOpen(false)}
        student={s as unknown as import('../../../shared/api/endpoints/students').StudentListItem}
      />
      <FreezeModal open={freezeOpen} onClose={() => setFreezeOpen(false)} student={s} />
      <SendMessageModal open={msgOpen} onClose={() => setMsgOpen(false)} student={s} />
    </div>
  );
}

function Chip({
  tone,
  children,
}: {
  tone: 'success' | 'muted' | 'info' | 'warn';
  children: React.ReactNode;
}) {
  const cls = {
    success: 'bg-success/15 text-success border-success/30',
    muted: 'bg-base-200 text-base-content/70 border-base-300',
    info: 'bg-info/15 text-info border-info/30',
    warn: 'bg-warning/15 text-warning border-warning/30',
  }[tone];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 h-5 px-2 rounded-full border text-[11px] font-semibold uppercase tracking-wide',
        cls,
      )}
    >
      {children}
    </span>
  );
}

function Contact({
  icon: Icon,
  label,
  value,
  sub,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-3.5 text-base-content/40 mt-1" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.12em] text-base-content/50 font-semibold">
          {label}
        </div>
        <div className={clsx('text-[13px]', mono && 'font-mono')}>{value}</div>
        {sub && <div className="text-[10px] text-base-content/40 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = false,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.12em] text-base-content/50 font-semibold">
          {label}
        </div>
        {Icon && (
          <div className="size-6 rounded-md bg-primary/10 text-primary grid place-items-center">
            <Icon className="size-3" />
          </div>
        )}
      </div>
      <div
        className={clsx(
          'font-bold tabular-nums tracking-tight mt-0.5',
          typeof value === 'string' ? 'text-xl' : 'text-base',
          accent && 'text-primary',
        )}
      >
        {value}
      </div>
      {hint && <div className="text-[11px] text-base-content/50 mt-0.5">{hint}</div>}
    </div>
  );
}
