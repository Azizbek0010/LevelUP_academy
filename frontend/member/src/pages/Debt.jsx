import { useEffect, useState } from 'react';
import { Wallet, Star, Clock3, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { money, fmt, dateShort } from '../format.js';
import {
  C, HUES, IconTile, PageHeader, EmptyState, ErrorState, Skeleton, CountUp,
} from '../student/components/ui.jsx';
import { useI18n } from '../i18n.jsx';

function useNow(active) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function TimeBox({ value, label, accent }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span
        className="k-num w-14 sm:w-16 text-[22px] font-extrabold py-2 rounded-xl text-center"
        style={accent
          ? { background: `${C.lime}1c`, color: C.limeDk }
          : { background: C.bg, color: C.text }}
      >
        {value}
      </span>
      <span className="text-[10.5px] font-bold" style={{ color: C.muted }}>{label}</span>
    </div>
  );
}

export default function Debt() {
  const { t } = useI18n();
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);

  if (!selectedChild) {
    return (
      <div className="k-card">
        <EmptyState icon={Wallet} hue="coral" title={t('dash.noChildTitle')} text={t('dash.noChildMsg')} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title={t('debt.title')} subtitle={`${selectedChild.firstName} ${selectedChild.lastName}`} />
        <Skeleton h={220} count={1} />
        <div className="grid grid-cols-2 gap-4 mt-4"><Skeleton h={140} /><Skeleton h={140} /></div>
      </>
    );
  }

  if (error) {
    return (
      <div className="k-card">
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const totalDebt = Number(d.totalDebt) || 0;
  const coins = d.coins || 0;
  const inv = d.currentInvoice;
  const paid = Number(inv?.paidAmount) || 0;
  const invTotal = Number(inv?.totalAmount) || 0;
  const progress = invTotal > 0 ? Math.round((paid / invTotal) * 100) : 0;

  // Счётчик до следующего платежа: реального due_date на бэке пока нет
  // (mock добавляет его в api.js), поэтому блок появляется только при наличии даты.
  const dueDate = inv?.dueDate ? new Date(inv.dueDate) : null;
  const active = Boolean(dueDate && totalDebt > 0);
  const now = useNow(active);

  const diff = dueDate && active ? Math.max(0, dueDate.getTime() - now) : null;
  const days = diff == null ? 0 : Math.floor(diff / 86400000);
  const hours = diff == null ? 0 : Math.floor((diff % 86400000) / 3600000);
  const minutes = diff == null ? 0 : Math.floor((diff % 3600000) / 60000);
  const seconds = diff == null ? 0 : Math.floor((diff % 60000) / 1000);

  return (
    <>
      <PageHeader title={t('debt.title')} subtitle={`${selectedChild.firstName} ${selectedChild.lastName}`} />

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* ══ Задолженность ══ */}
        <div
          className="k-card p-5 flex flex-col"
          style={{
            background: totalDebt > 0
              ? 'linear-gradient(135deg, #FFF7F4 0%, #FFFFFF 100%)'
              : 'linear-gradient(135deg, #F2F9F0 0%, #FFFFFF 100%)',
          }}
        >
          <div className="flex items-center gap-3 mb-3">
            <IconTile icon={totalDebt > 0 ? Wallet : CheckCircle2} hue={totalDebt > 0 ? 'coral' : 'green'} size={42} />
            <span className="text-[13px] font-bold" style={{ color: C.muted }}>{t('debt.total')}</span>
            {totalDebt > 0 && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md ml-auto"
                style={{ background: `${C.coral}1c`, color: C.coral }}
              >
                {t('debt.attention')}
              </span>
            )}
          </div>
          <p
            className="k-num text-[32px] font-extrabold leading-none"
            style={{ color: totalDebt > 0 ? C.coral : C.lime }}
          >
            {money(d.totalDebt)}
          </p>

          {inv && invTotal > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-[11.5px] font-semibold mb-1.5" style={{ color: C.muted }}>
                <span>{t('debt.paid', { sum: money(paid) })}</span>
                <span>{t('debt.pending', { sum: money(Math.max(0, invTotal - paid)) })}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: C.line }}>
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(100, progress)}%`,
                    background: progress >= 100 ? C.lime : C.coral,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ══ Коины ══ */}
        <div className="k-card p-5 flex flex-col relative overflow-hidden">
          <span className="absolute -right-6 -top-8 w-28 h-28 rounded-full opacity-60" style={{ background: `${HUES.amber}14` }} aria-hidden="true" />
          <div className="flex items-center gap-3 mb-3 relative">
            <IconTile icon={Star} hue="amber" size={42} />
            <span className="text-[13px] font-bold" style={{ color: C.muted }}>{t('debt.coins')}</span>
          </div>
          <p className="k-num text-[32px] font-extrabold leading-none flex items-center gap-2" style={{ color: HUES.amber }}>
            <CountUp value={coins} />
          </p>
          <p className="text-[12px] font-semibold mt-3 flex items-center gap-1.5" style={{ color: C.muted }}>
            <Sparkles size={13} strokeWidth={2.2} />
            {t('debt.coinsSub')}
          </p>
        </div>
      </div>

      {/* ══ Счётчик до следующего платежа ══ */}
      {active && dueDate && diff != null ? (
        <div className="k-card p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <IconTile icon={Clock3} hue="blue" size={34} />
            <div>
              <h3 className="text-[15.5px] font-extrabold" style={{ color: C.text }}>{t('debt.nextPayment')}</h3>
              <p className="text-[12px] font-semibold mt-0.5" style={{ color: C.muted }}>
                {t('debt.nextPaymentLeft')} · {t('debt.paidUntil', { date: dateShort(dueDate.toISOString()) })}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <TimeBox value={pad(days)} label={t('debt.days')} />
            <span className="text-[20px] font-extrabold" style={{ color: C.muted }}>:</span>
            <TimeBox value={pad(hours)} label={t('debt.hours')} />
            <span className="text-[20px] font-extrabold" style={{ color: C.muted }}>:</span>
            <TimeBox value={pad(minutes)} label={t('debt.minutes')} />
            <span className="text-[20px] font-extrabold" style={{ color: C.muted }}>:</span>
            <TimeBox value={pad(seconds)} label={t('debt.seconds')} accent />
          </div>
        </div>
      ) : (
        <div className="k-card">
          <div className="text-center py-12">
            <IconTile icon={totalDebt > 0 ? XCircle : CheckCircle2} hue={totalDebt > 0 ? 'coral' : 'green'} size={72} className="mx-auto" />
            <h3 className="text-[17px] font-extrabold mt-4" style={{ color: C.text }}>
              {totalDebt > 0 ? t('debt.status.debt') : t('debt.status.noDebt')}
            </h3>
            <p className="text-[13.5px] font-semibold mt-1.5 max-w-sm mx-auto" style={{ color: C.muted }}>
              {totalDebt > 0
                ? `${t('debt.status.debtMsgStart')} ${money(d.totalDebt)}${t('debt.status.debtMsgEnd')}`
                : t('debt.status.noDebtMsg')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
