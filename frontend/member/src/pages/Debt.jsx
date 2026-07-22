import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { money, fmt } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonKpis } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState, ProgressBar } from '../components/ui.jsx';
import Icon from '../components/Icons.jsx';

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

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Debt Card */}
        <div className="card bg-base-100 overflow-hidden relative hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/3 translate-x-1/3 blur-2xl"
            style={{ background: totalDebt > 0 ? 'rgba(239,68,68,.06)' : 'rgba(34,197,94,.06)' }}
          />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full translate-y-1/3 -translate-x-1/4 blur-xl"
            style={{ background: totalDebt > 0 ? 'rgba(239,68,68,.04)' : 'rgba(34,197,94,.04)' }}
          />
          <div className="card-body relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: totalDebt > 0 ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.1)' }}
              >
                <Icon name="wallet" className="w-6 h-6" style={{ color: totalDebt > 0 ? '#ef4444' : '#22c55e' }} />
              </div>
              <div>
                <span className="text-sm font-medium opacity-60">Общий долг</span>
                {totalDebt > 0 && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
                    <span className="text-[10px] text-error font-medium">Требуется внимание</span>
                  </div>
                )}
              </div>
            </div>
            <p className={`text-3xl font-extrabold ${totalDebt > 0 ? 'text-error' : 'text-success'}`}>
              {money(d.totalDebt)}
            </p>
            {totalDebt > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-[11px] opacity-40 mb-1">
                  <span>Оплачено</span>
                  <span>Ожидает</span>
                </div>
                <ProgressBar value={0} color="#ef4444" height={6} />
              </div>
            )}
          </div>
        </div>

        {/* Coins Card */}
        <div className="card bg-base-100 overflow-hidden relative hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-1/3 translate-x-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-primary/3 translate-y-1/3 -translate-x-1/4 blur-xl" />
          <div className="card-body relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
                <Icon name="star" className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium opacity-60">Коины</span>
            </div>
            <p className="text-3xl font-extrabold text-primary">{fmt(coins)}</p>
            <p className="text-[11px] opacity-30 mt-2 flex items-center gap-1">
              <Icon name="sparkles" className="w-3 h-3" />
              Заработанные баллы за достижения
            </p>
          </div>
        </div>
      </div>

      {/* Status Card */}
      {totalDebt > 0 ? (
        <div className="card bg-base-100">
          <div className="card-body text-center py-12">
            <div className="relative inline-block mb-4">
              <div className="w-20 h-20 rounded-2xl bg-error/10 flex items-center justify-center">
                <Icon name="alert" className="w-10 h-10 text-error" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-error rounded-full flex items-center justify-center animate-pulse">
                <Icon name="exclamation-circle" className="w-3 h-3 text-white" />
              </div>
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
            <div className="w-20 h-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
              <Icon name="check-circle" className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-lg font-bold mb-2">Задолженностей нет</h3>
            <p className="text-sm text-base-content/50">Все счета оплачены вовремя</p>
          </div>
        </div>
      )}
    </>
  );
}
