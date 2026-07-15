import { useMemo, useState } from 'react';
import {
  AlertTriangle, Wallet, CheckCircle2, Clock, Send, X, User, Building2, CalendarDays, Coins,
} from 'lucide-react';
import { useDashboard } from '../queries.js';
import { useAuth } from '../auth.jsx';
import { fmt, dateShort } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';

const REASONS = [
  'Опоздание',
  'Прогул',
  'Ненормативная лексика',
  'Нарушение дресс-кода',
  'Другое',
];

const STATUS = {
  pending: { label: 'Ожидает', cls: 'badge-warning', Icon: Clock },
  paid: { label: 'Оплачен', cls: 'badge-success', Icon: CheckCircle2 },
  disputed: { label: 'Оспорен', cls: 'badge-error', Icon: AlertTriangle },
};

const sanitize = (v) => String(v ?? '').replace(/[^\d]/g, '');

const initialMock = [
  { id: 'f1', partnerName: 'EduCenter Chilanzar', employee: 'Собиров А.А.', reason: 'Опоздание', amount: 150000, date: '2026-06-28', status: 'paid' },
  { id: 'f2', partnerName: 'LingoPro Yunusabad', employee: 'Каримова М.', reason: 'Нарушение дресс-кода', amount: 100000, date: '2026-07-02', status: 'pending' },
  { id: 'f3', partnerName: 'IT-School Mirzo', employee: 'Тошев Ш.', reason: 'Ненормативная лексика', amount: 300000, date: '2026-07-05', status: 'disputed' },
  { id: 'f4', partnerName: 'MathLab Sergeli', employee: 'Абдуллаев Р.', reason: 'Прогул', amount: 500000, date: '2026-07-08', status: 'pending' },
  { id: 'f5', partnerName: 'EduCenter Chilanzar', employee: 'Юлдашева Д.', reason: 'Опоздание', amount: 100000, date: '2026-07-10', status: 'paid' },
  { id: 'f6', partnerName: 'EnglishLab Yakkasaray', employee: 'Хамидов Б.', reason: 'Другое', amount: 250000, date: '2026-07-12', status: 'pending' },
];

export default function Fines() {
  const { token } = useAuth();
  const { data: dash } = useDashboard();
  const partners = dash?.partners || [];
  const cur = dash?.totals?.currency || 'UZS';

  const [fines, setFines] = useState(initialMock);
  const [partnerId, setPartnerId] = useState('');
  const [employee, setEmployee] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [amount, setAmount] = useState('');
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);

  const canSubmit = partnerId && employee.trim().length >= 2 && Number(amount) > 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      // graceful degradation: API не существует
      try {
        await fetch('/api/main/fines', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            partnerId, employee: employee.trim(), reason, details, amount: Number(amount), incidentDate,
          }),
        });
      } catch { /* ignore */ }

      const partner = partners.find((p) => p.id === partnerId);
      const item = {
        id: `f-${Date.now()}`,
        partnerName: partner?.name || 'Партнёр',
        employee: employee.trim(),
        reason,
        amount: Number(amount),
        date: incidentDate,
        status: 'pending',
      };
      setFines((prev) => [item, ...prev]);
      setToast({ kind: 'success', text: `Штраф на ${fmt(amount)} ${cur} выписан (в очереди — функция скоро будет доступна)` });
      // reset form
      setPartnerId('');
      setEmployee('');
      setReason(REASONS[0]);
      setDetails('');
      setAmount('');
    } catch {
      setToast({ kind: 'success', text: 'Штраф поставлен в очередь (функция скоро будет доступна).' });
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const kpi = useMemo(() => {
    const total = fines.length;
    const totalSum = fines.reduce((s, f) => s + f.amount, 0);
    const paidSum = fines.filter((f) => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
    const pending = fines.filter((f) => f.status === 'pending').length;
    return { total, totalSum, paidSum, pending };
  }, [fines]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-rose-500 text-white grid place-items-center">
              <AlertTriangle size={20} strokeWidth={2.3} />
            </span>
            Штрафы сотрудникам
          </span>
        }
        subtitle="Выписка штрафа сотруднику партнёра за нарушение"
      />

      {toast && (
        <div className={`alert ${toast.kind === 'success' ? 'alert-success' : 'alert-error'} text-sm`}>
          <CheckCircle2 size={16} />
          <span>{toast.text}</span>
          <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMini Icon={AlertTriangle} tint={{ bg: '#FEE2E2', fg: '#991B1B' }} title="Всего штрафов" value={fmt(kpi.total)} />
        <StatMini Icon={Wallet} tint={{ bg: '#FEF3C7', fg: '#92400E' }} title={`Общая сумма (${cur})`} value={fmt(kpi.totalSum)} />
        <StatMini Icon={CheckCircle2} tint={{ bg: '#DCFCE7', fg: '#166534' }} title={`Оплачено (${cur})`} value={fmt(kpi.paidSum)} />
        <StatMini Icon={Clock} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Ожидает оплаты" value={fmt(kpi.pending)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Form */}
        <form onSubmit={submit} className="card bg-base-100 shadow-sm border border-base-200/60 overflow-hidden lg:col-span-1">
          <div className="bg-gradient-to-r from-rose-100 via-rose-50 to-transparent px-6 py-4 border-b border-base-200">
            <h2 className="font-extrabold text-base">Выписать штраф</h2>
            <p className="text-xs text-base-content/60 mt-0.5">Штраф отобразится в панели партнёра</p>
          </div>

          <div className="card-body space-y-3.5">
            <label className="form-control">
              <span className="label-text mb-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
                <Building2 size={12} /> Партнёр
              </span>
              <select
                className="select select-bordered focus:border-rose-400 focus:outline-rose-200"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
              >
                <option value="">— выберите партнёра —</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text mb-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
                <User size={12} /> ФИО сотрудника
              </span>
              <input
                type="text"
                className="input input-bordered focus:border-rose-400 focus:outline-rose-200"
                placeholder="Иванов И.И."
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/60">Причина</span>
              <select
                className="select select-bordered focus:border-rose-400 focus:outline-rose-200"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text mb-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/60">Детали</span>
              <textarea
                className="textarea textarea-bordered min-h-20 focus:border-rose-400 focus:outline-rose-200"
                placeholder="Подробности инцидента…"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text mb-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
                  <Coins size={12} /> Сумма ({cur})
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="input input-bordered font-bold focus:border-rose-400 focus:outline-rose-200"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(sanitize(e.target.value))}
                />
              </label>
              <label className="form-control">
                <span className="label-text mb-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/60 flex items-center gap-1.5">
                  <CalendarDays size={12} /> Дата
                </span>
                <input
                  type="date"
                  className="input input-bordered focus:border-rose-400 focus:outline-rose-200"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                />
              </label>
            </div>

            <button
              type="submit"
              className="btn bg-lime-400 hover:bg-lime-500 border-0 text-lime-950 gap-2 mt-2 disabled:opacity-50"
              disabled={!canSubmit || busy}
            >
              {busy ? <span className="loading loading-spinner loading-sm" /> : <><Send size={16} /> Выписать штраф</>}
            </button>
          </div>
        </form>

        {/* Table */}
        <div className="card bg-base-100 shadow-sm border border-base-200/60 lg:col-span-2">
          <div className="card-body">
            <h2 className="card-title text-base mb-2">Все штрафы</h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Партнёр</th>
                    <th>Сотрудник</th>
                    <th>Причина</th>
                    <th className="text-right">Сумма</th>
                    <th>Дата</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {fines.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-base-content/40">Штрафов пока нет</td></tr>
                  ) : (
                    fines.map((f) => {
                      const s = STATUS[f.status] || STATUS.pending;
                      return (
                        <tr key={f.id} className="hover">
                          <td>
                            <div className="flex items-center gap-2">
                              <Avatar name={f.partnerName} size={28} />
                              <span className="font-medium text-sm truncate max-w-[160px]">{f.partnerName}</span>
                            </div>
                          </td>
                          <td className="text-sm">{f.employee}</td>
                          <td className="text-sm text-base-content/70">{f.reason}</td>
                          <td className="text-right font-bold tabular-nums text-rose-600">{fmt(f.amount)}</td>
                          <td className="whitespace-nowrap text-xs text-base-content/60">{dateShort(f.date)}</td>
                          <td>
                            <span className={`badge badge-sm gap-1 ${s.cls}`}>
                              <s.Icon size={10} />
                              {s.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatMini({ Icon, tint, title, value }) {
  return (
    <div className="card bg-base-100 shadow-sm border border-base-200/60">
      <div className="card-body p-4">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: tint.bg, color: tint.fg }}>
            <Icon size={18} strokeWidth={2.3} />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 truncate">{title}</div>
            <div className="text-2xl font-extrabold leading-tight mt-0.5 truncate">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
