import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { money, fmt } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonKpis } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState, ProgressBar } from '../components/ui.jsx';

export default function Debt() {
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);

  if (!selectedChild) return <EmptyState icon="👶" title="Выберите ребёнка" />;

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

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card bg-base-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full" style={{ background: totalDebt > 0 ? 'rgba(239,68,68,.06)' : 'rgba(34,197,94,.06)' }} />
          <div className="card-body relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: totalDebt > 0 ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)' }}>
                <span className="text-lg">💰</span>
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

        <div className="card bg-base-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-primary/5" />
          <div className="card-body relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
                <span className="text-lg">🪙</span>
              </div>
              <span className="text-sm font-medium opacity-60">Коины</span>
            </div>
            <p className="text-3xl font-extrabold text-primary">{fmt(coins)}</p>
            <p className="text-[11px] opacity-30 mt-2">Заработанные баллы за достижения</p>
          </div>
        </div>
      </div>

      {totalDebt > 0 ? (
        <div className="card bg-base-100">
          <div className="card-body text-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-error/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
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
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-lg font-bold mb-2">Задолженностей нет</h3>
            <p className="text-sm text-base-content/50">Все счета оплачены вовремя</p>
          </div>
        </div>
      )}
    </>
  );
}
