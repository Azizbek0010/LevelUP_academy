import { Wallet, Star, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { money, fmt } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonKpis } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState, ProgressBar } from '../components/ui.jsx';

export default function Debt() {
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);

  if (!selectedChild) return <EmptyState icon="user-circle" title="Выберите ребёнка" />;

  if (isLoading) {
    return (
      <>
        <PageHeader title="Оплата" />
        <SkeletonKpis count={2} className="grid-cols-1 lg:grid-cols-2" />
      </>
    );
  }

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const d = data?.data;
  if (!d) return null;

  const totalDebt = Number(d.totalDebt) || 0;
  const coins = d.coins || 0;

  return (
    <>
      <PageHeader
        title="Оплата"
        subtitle={`${selectedChild.firstName} ${selectedChild.lastName}`}
      />

      {/* Debt + Coins cards */}
      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Debt card */}
        <div className="card bg-base-100 overflow-hidden relative hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full -translate-y-1/3 translate-x-1/3 blur-xl" style={{ background: totalDebt > 0 ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.08)' }} />
          <div className="card-body relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: totalDebt > 0 ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)' }}>
                <Wallet className="w-5 h-5" style={{ color: totalDebt > 0 ? '#ef4444' : '#22c55e' }} />
              </div>
              <span className="text-sm font-medium opacity-60">Общий долг</span>
            </div>
            <p className={`text-3xl font-extrabold ${totalDebt > 0 ? 'text-error' : 'text-success'}`}>
              {money(d.totalDebt)}
            </p>
            {totalDebt > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-[11px] opacity-40 mb-1">
                  <span>Оплачено</span>
                  <span>Ожидает</span>
                </div>
                <ProgressBar value={0} color="#ef4444" height={6} />
              </div>
            )}
          </div>
        </div>

        {/* Coins card */}
        <div className="card bg-base-100 overflow-hidden relative hover:shadow-lg transition-shadow">
          <div className="absolute top-0 right-0 w-28 h-28 rounded-full bg-primary/5 -translate-y-1/3 translate-x-1/3 blur-xl" />
          <div className="card-body relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary/10">
                <Star className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium opacity-60">Коины</span>
            </div>
            <p className="text-3xl font-extrabold text-primary">{fmt(coins)}</p>
            <p className="text-[11px] opacity-30 mt-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Заработанные баллы за достижения
            </p>
          </div>
        </div>
      </div>

      {/* Status message */}
      {totalDebt > 0 ? (
        <div className="card bg-base-100">
          <div className="card-body text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
            <h3 className="text-lg font-bold mb-2">Есть задолженность</h3>
            <p className="text-sm text-base-content/50 max-w-sm mx-auto mb-4">
              Сумма долга составляет <span className="font-bold text-error">{money(d.totalDebt)}</span>.
              Обратитесь к администратору для оплаты.
            </p>
            <div className="inline-flex items-center gap-2 text-xs opacity-40">
              <div className="w-2 h-2 rounded-full bg-error animate-pulse" />
              Требуется внимание
            </div>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100">
          <div className="card-body text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-lg font-bold mb-2">Задолженностей нет</h3>
            <p className="text-sm text-base-content/50">Все счета оплачены вовремя</p>
          </div>
        </div>
      )}
    </>
  );
}
