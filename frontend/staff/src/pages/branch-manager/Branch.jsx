import { useState } from 'react';
import {
  MapPin, Phone, Building2, Landmark, Send, Check, Copy,
} from 'lucide-react';
import { fmt, money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel } from '../mentor/_ui.jsx';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';
import { useBranchManagerInfo, useBranchManagerTelegramStatus } from '../../queries.js';

function InfoRow({ Icon, label, value, href }) {
  const inner = (
    <>
      <span className="w-9 h-9 rounded-xl grid place-items-center bg-primary/10 text-primary shrink-0">
        <Icon size={16} />
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
          {label}
        </span>
        <span className="block text-[14px] font-semibold text-base-content truncate">
          {value || '—'}
        </span>
      </span>
    </>
  );
  const cls = 'flex items-center gap-3 p-3 rounded-xl hover:bg-base-200/60 transition-colors';
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

/** Привязка группы родителей к Telegram-боту. Бот добавляется в группу
 * вручную (Branch Manager делает это самостоятельно — нельзя добавить бота
 * автоматически извне), затем код отправляется в группу командой
 * /bindbranch <код>. */
function TelegramGroupCard() {
  const { token } = useAuth();
  const { data: status, isLoading, refetch } = useBranchManagerTelegramStatus();
  const [issuing, setIssuing] = useState(false);
  const [code, setCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  async function issueCode() {
    setIssuing(true);
    setError(null);
    try {
      const res = await api.branchManagerTelegramBindToken(token);
      setCode(res.data);
    } catch (err) {
      setError(err.message || 'Произошла ошибка');
    } finally {
      setIssuing(false);
    }
  }

  async function unlink() {
    if (!window.confirm('Вы действительно хотите отключить группу?')) return;
    await api.branchManagerTelegramUnlink(token);
    setCode(null);
    refetch();
  }

  function copyCommand() {
    if (!code) return;
    navigator.clipboard.writeText(`/bindbranch ${code.token}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isLoading) return null;

  if (status?.linked) {
    return (
      <Panel title="Группа родителей (Telegram)" icon={Send} bodyClass="p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-success font-semibold">
            <Check size={18} /> Группа подключена
          </div>
          <button type="button" className="btn btn-sm btn-ghost text-error" onClick={unlink}>
            Отключить
          </button>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Группа родителей (Telegram)" icon={Send} bodyClass="p-5">
      {!code ? (
        <>
          <p className="text-sm text-base-content/60 mb-3">
            Сообщения о посещаемости и успеваемости будут автоматически отправляться в эту группу.
            Сначала добавьте бота в группу, затем получите код для подключения.
          </p>
          <button type="button" className="btn btn-primary btn-sm" onClick={issueCode} disabled={issuing}>
            {issuing ? 'Загрузка...' : 'Получить код подключения'}
          </button>
          {error && <p className="text-error text-sm mt-2">{error}</p>}
        </>
      ) : (
        <div className="space-y-3">
          <ol className="text-sm text-base-content/70 list-decimal list-inside space-y-1">
            <li>
              Добавьте бота в группу: <b>@{code.botUsername}</b>
            </li>
            <li>Отправьте следующую команду в саму группу:</li>
          </ol>
          <div className="flex items-center gap-2 bg-base-200 rounded-lg px-3 py-2 font-mono text-sm">
            <span className="flex-1 select-all">/bindbranch {code.token}</span>
            <button type="button" className="btn btn-xs btn-ghost" onClick={copyCommand}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <p className="text-xs text-base-content/45">Код действителен {Math.round(code.expiresIn / 60)} минут.</p>
        </div>
      )}
    </Panel>
  );
}

export default function BranchManagerBranch() {
  const { data: rawBranch, isLoading, error } = useBranchManagerInfo();
  const branch = rawBranch?.branch || rawBranch;

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8 animate-page-enter">
        <PageHeader title="Филиал" subtitle="Загрузка данных..." />
        <div className="rounded-2xl bg-base-200/60 animate-pulse h-64" />
        <div className="rounded-2xl bg-base-200/60 animate-pulse h-32" />
        <div className="rounded-2xl bg-base-200/60 animate-pulse h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex flex-col items-center gap-3 text-error">
          <span className="text-4xl">⚠</span>
          <span className="text-lg font-semibold">Произошла ошибка при загрузке данных</span>
          <button
            className="btn btn-sm btn-error btn-outline mt-2"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="p-8 text-center text-base-content/45">
        <Building2 size={48} className="mx-auto mb-3 opacity-30" />
        <p className="text-lg font-semibold">Данные филиала не найдены</p>
      </div>
    );
  }

  const s = branch.stats;

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title="Филиал" subtitle={`${branch.name} · расположение и статистика`} />

      {/* ── Основная карточка ── */}
      <Panel title="О филиале" icon={Building2} bodyClass="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl grid place-items-center bg-primary/15 text-primary">
              <Landmark size={22} />
            </span>
            <h3 className="text-lg font-extrabold text-base-content">{branch.name}</h3>
          </div>
          {branch.isMain && <span className="badge badge-primary badge-lg">Главный филиал</span>}
        </div>

        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="rounded-xl border border-base-200 p-4">
            <dt className="text-[11px] text-base-content/45">Студенты</dt>
            <dd className="text-2xl font-extrabold tabular-nums mt-1">{fmt(s.students)}</dd>
          </div>
          <div className="rounded-xl border border-base-200 p-4">
            <dt className="text-[11px] text-base-content/45">Группы</dt>
            <dd className="text-2xl font-extrabold tabular-nums mt-1">{fmt(s.groups)}</dd>
          </div>
          <div className="rounded-xl border border-base-200 p-4">
            <dt className="text-[11px] text-base-content/45">Менторы</dt>
            <dd className="text-2xl font-extrabold tabular-nums mt-1">{fmt(s.staff || s.mentors || 0)}</dd>
          </div>
          <div className="rounded-xl border border-base-200 p-4">
            <dt className="text-[11px] text-base-content/45">Задолженность</dt>
            <dd className={`text-2xl font-extrabold tabular-nums mt-1 ${s.debt > 0 ? 'text-error' : ''}`}>
              {money(s.debt)}
            </dd>
          </div>
        </dl>
      </Panel>

      {/* ── Telegram: группа родителей ── */}
      <TelegramGroupCard />

      {/* ── Контакты ── */}
      <Panel title="Контакты" icon={MapPin} bodyClass="p-5">
        <div className="space-y-1">
          <InfoRow Icon={MapPin} label="Адрес" value={branch.address} />
          <InfoRow Icon={Phone} label="Телефон" value={branch.phone} href={branch.phone ? `tel:${branch.phone.replace(/\s/g, '')}` : undefined} />
        </div>
      </Panel>

      {/* ── Финансы ── */}
      <Panel title="Финансы (итого)" icon={Building2} bodyClass="p-5">
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <dt className="text-[11px] text-base-content/45">Доход</dt>
            <dd className="text-xl font-extrabold tabular-nums mt-1 text-success">{money(s.revenue)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-base-content/45">Расход</dt>
            <dd className="text-xl font-extrabold tabular-nums mt-1">{money(s.expenses)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-base-content/45">Прибыль</dt>
            <dd className={`text-xl font-extrabold tabular-nums mt-1 ${s.profit >= 0 ? 'text-success' : 'text-error'}`}>
              {money(s.profit)}
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
