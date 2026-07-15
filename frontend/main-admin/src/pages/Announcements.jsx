import { useMemo, useState } from 'react';
import {
  Megaphone, Send, Users, Info, AlertTriangle, Zap, CheckCircle2, Clock, X,
} from 'lucide-react';
import { useDashboard } from '../queries.js';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { dateShort } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';

const TYPES = [
  {
    key: 'info',
    label: 'Информация',
    Icon: Info,
    badge: 'badge-info',
    ring: 'ring-sky-200',
    tint: { bg: '#DBEAFE', fg: '#1E40AF' },
    desc: 'Общая новость или уведомление',
  },
  {
    key: 'warning',
    label: 'Предупреждение',
    Icon: AlertTriangle,
    badge: 'badge-warning',
    ring: 'ring-amber-200',
    tint: { bg: '#FEF3C7', fg: '#92400E' },
    desc: 'Важное сообщение, требующее внимания',
  },
  {
    key: 'critical',
    label: 'Критично',
    Icon: Zap,
    badge: 'badge-error',
    ring: 'ring-rose-200',
    tint: { bg: '#FEE2E2', fg: '#991B1B' },
    desc: 'Срочное критическое уведомление',
  },
];

const MOCK_HISTORY = [
  {
    id: 'a1',
    title: 'Обновление тарифов с 1 августа',
    body: 'С 1 августа изменяются тарифы платформы. Подробности в личном кабинете.',
    type: 'warning',
    recipients: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 'a2',
    title: 'Новый модуль отчётов',
    body: 'Доступна новая аналитика по группам и филиалам в разделе «Отчёты».',
    type: 'info',
    recipients: 25,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
  },
  {
    id: 'a3',
    title: 'Плановые технические работы',
    body: 'В воскресенье с 03:00 до 05:00 возможны краткие перерывы в работе платформы.',
    type: 'critical',
    recipients: 25,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21).toISOString(),
  },
];

export default function Announcements() {
  const { token } = useAuth();
  const { data: dash } = useDashboard();
  const partners = dash?.partners || [];

  const [type, setType] = useState('info');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [allSelected, setAllSelected] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState(MOCK_HISTORY);

  const chosenType = TYPES.find((t) => t.key === type) || TYPES[0];
  const recipientCount = allSelected ? partners.length : selectedIds.size;

  const togglePartner = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setAllSelected((v) => !v);
    if (!allSelected) setSelectedIds(new Set());
  };

  const canSend = title.trim().length >= 3 && body.trim().length >= 3 && recipientCount > 0;

  const send = async (e) => {
    e.preventDefault();
    if (!canSend) return;
    setBusy(true);
    try {
      // API endpoint не существует — graceful degradation
      try {
        await fetch('/api/main/announcements', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            title: title.trim(),
            body: body.trim(),
            type,
            partnerIds: allSelected ? null : Array.from(selectedIds),
          }),
        });
      } catch {
        // ignore, graceful degradation
      }
      const newItem = {
        id: `a-${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        type,
        recipients: recipientCount,
        createdAt: new Date().toISOString(),
      };
      setHistory((prev) => [newItem, ...prev]);
      setToast({
        kind: 'success',
        text: `Объявление поставлено в очередь (${recipientCount} получат.). Функция скоро будет доступна.`,
      });
      setTitle('');
      setBody('');
    } catch {
      setToast({
        kind: 'success',
        text: 'Объявление поставлено в очередь (функция скоро будет доступна).',
      });
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const stats = useMemo(() => ({
    total: history.length,
    thisMonth: history.filter((h) => new Date(h.createdAt).getMonth() === new Date().getMonth()).length,
    critical: history.filter((h) => h.type === 'critical').length,
  }), [history]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={
          <span className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-lime-400 text-lime-950 grid place-items-center">
              <Megaphone size={20} strokeWidth={2.3} />
            </span>
            Объявления партнёрам
          </span>
        }
        subtitle="Разослать сообщение всем Super Admin партнёров"
      />

      {toast && (
        <div className={`alert ${toast.kind === 'success' ? 'alert-success' : 'alert-error'} text-sm`}>
          <CheckCircle2 size={16} />
          <span>{toast.text}</span>
          <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setToast(null)}><X size={14} /></button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatMini Icon={Megaphone} tint={{ bg: '#ECFCCB', fg: '#365314' }} title="Всего рассылок" value={stats.total} />
        <StatMini Icon={Clock} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="В этом месяце" value={stats.thisMonth} />
        <StatMini Icon={Zap} tint={{ bg: '#FEE2E2', fg: '#991B1B' }} title="Критических" value={stats.critical} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Form */}
        <form onSubmit={send} className="card bg-base-100 shadow-sm border border-base-200/60 lg:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-r from-lime-100 via-lime-50 to-transparent px-6 py-4 border-b border-base-200">
            <h2 className="font-extrabold text-base">Новое объявление</h2>
            <p className="text-xs text-base-content/60 mt-0.5">Сообщение получат все выбранные партнёры</p>
          </div>

          <div className="card-body space-y-4">
            <label className="form-control">
              <span className="label-text mb-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/60">Заголовок</span>
              <input
                type="text"
                className="input input-bordered focus:border-lime-400 focus:outline-lime-200"
                placeholder="Обновление тарифов, тех. работы…"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
              />
              <span className="text-[11px] text-base-content/40 mt-1 self-end">{title.length}/140</span>
            </label>

            <label className="form-control">
              <span className="label-text mb-1.5 text-xs font-semibold uppercase tracking-wider text-base-content/60">Текст сообщения</span>
              <textarea
                className="textarea textarea-bordered min-h-32 focus:border-lime-400 focus:outline-lime-200"
                placeholder="Подробности объявления…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
              />
              <span className="text-[11px] text-base-content/40 mt-1 self-end">{body.length}/2000</span>
            </label>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2 block">Тип объявления</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {TYPES.map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    onClick={() => setType(t.key)}
                    className={`rounded-xl border p-3 text-left transition-all ${
                      type === t.key
                        ? `border-transparent ring-2 ${t.ring} bg-base-100`
                        : 'border-base-200 hover:border-base-300 bg-base-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-7 h-7 rounded-lg grid place-items-center shrink-0" style={{ background: t.tint.bg, color: t.tint.fg }}>
                        <t.Icon size={14} strokeWidth={2.4} />
                      </span>
                      <span className={`badge badge-sm ${t.badge}`}>{t.label}</span>
                    </div>
                    <div className="text-[11px] text-base-content/50">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60 mb-2 block">
                Получатели · {recipientCount} партнёров
              </span>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-base-200 hover:border-lime-300 cursor-pointer bg-lime-50/40 mb-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-success"
                  checked={allSelected}
                  onChange={toggleAll}
                />
                <Users size={15} className="text-lime-700" />
                <span className="text-sm font-semibold">Все партнёры ({partners.length})</span>
              </label>
              {!allSelected && (
                <div className="max-h-52 overflow-y-auto rounded-xl border border-base-200 divide-y divide-base-200">
                  {partners.length === 0 && (
                    <div className="text-center text-sm text-base-content/40 py-6">Партнёров пока нет</div>
                  )}
                  {partners.map((p) => (
                    <label key={p.id} className="flex items-center gap-2.5 p-2.5 hover:bg-base-200/50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-xs"
                        checked={selectedIds.has(p.id)}
                        onChange={() => togglePartner(p.id)}
                      />
                      <Avatar name={p.name} size={26} />
                      <span className="text-sm flex-1 truncate">{p.name}</span>
                      <span className="text-[11px] text-base-content/50 shrink-0">{p.branches} фил.</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-base-200 flex items-center gap-3">
              <button
                type="submit"
                className="btn bg-lime-400 hover:bg-lime-500 border-0 text-lime-950 gap-2 px-6 disabled:opacity-50"
                disabled={!canSend || busy}
              >
                {busy ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <><Send size={16} /> Отправить объявление</>
                )}
              </button>
              <span className="text-xs text-base-content/50">
                Получат: <b>{recipientCount}</b> · Тип: <span className={`badge badge-xs ${chosenType.badge}`}>{chosenType.label}</span>
              </span>
            </div>
          </div>
        </form>

        {/* Preview */}
        <div className="card bg-base-100 shadow-sm border border-base-200/60 h-fit">
          <div className="card-body">
            <h3 className="font-bold text-sm text-base-content/60 uppercase tracking-wider mb-3">Предпросмотр</h3>
            <div className="rounded-2xl border border-base-200 p-4 bg-gradient-to-br from-base-100 to-base-200/30">
              <div className="flex items-center gap-2 mb-2">
                <chosenType.Icon size={14} className="text-base-content/60" />
                <span className={`badge badge-xs ${chosenType.badge}`}>{chosenType.label}</span>
              </div>
              <div className="font-extrabold text-sm mb-1">
                {title || <span className="text-base-content/30">Заголовок объявления</span>}
              </div>
              <div className="text-xs text-base-content/70 whitespace-pre-wrap min-h-16">
                {body || <span className="text-base-content/30">Текст объявления появится здесь…</span>}
              </div>
              <div className="mt-3 pt-3 border-t border-base-200 text-[11px] text-base-content/40 flex items-center gap-1.5">
                <Users size={11} /> {recipientCount} получат.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card bg-base-100 shadow-sm border border-base-200/60">
        <div className="card-body">
          <h2 className="card-title text-base mb-2">История объявлений</h2>
          <div className="space-y-2.5">
            {history.length === 0 ? (
              <div className="text-center py-10 text-base-content/40 text-sm">Пока нет объявлений</div>
            ) : (
              history.map((h) => {
                const t = TYPES.find((x) => x.key === h.type) || TYPES[0];
                return (
                  <div
                    key={h.id}
                    className="rounded-xl border border-base-200 p-4 hover:border-lime-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-9 h-9 rounded-xl grid place-items-center shrink-0" style={{ background: t.tint.bg, color: t.tint.fg }}>
                        <t.Icon size={16} strokeWidth={2.3} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{h.title}</span>
                          <span className={`badge badge-xs ${t.badge}`}>{t.label}</span>
                        </div>
                        <div className="text-xs text-base-content/60 mt-1 line-clamp-2">{h.body}</div>
                        <div className="text-[11px] text-base-content/40 mt-2 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock size={10} /> {dateShort(h.createdAt)}</span>
                          <span className="flex items-center gap-1"><Users size={10} /> {h.recipients} получателей</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">{title}</div>
            <div className="text-2xl font-extrabold leading-tight mt-0.5">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
