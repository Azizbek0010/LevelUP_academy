import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { money } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonKpis } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState } from '../components/ui.jsx';

export default function Debt() {
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);

  if (!selectedChild) {
    return <EmptyState icon="👶" title="Выберите ребёнка" />;
  }

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

  return (
    <>
      <PageHeader
        title="Оплата"
        subtitle={`${selectedChild.firstName} ${selectedChild.lastName}`}
      />

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="card bg-base-100 border-l-4" style={{ borderLeftColor: totalDebt > 0 ? '#ef4444' : '#22c55e' }}>
          <div className="card-body">
            <p className="text-sm opacity-60">Общий долг</p>
            <p className={`text-3xl font-extrabold ${totalDebt > 0 ? 'text-error' : 'text-success'}`}>
              {money(d.totalDebt)}
            </p>
          </div>
        </div>

        <div className="card bg-base-100 border-l-4" style={{ borderLeftColor: '#C6FF34' }}>
          <div className="card-body">
            <p className="text-sm opacity-60">Коины</p>
            <p className="text-3xl font-extrabold">{d.coins}</p>
            <p className="text-xs opacity-40 mt-1">Заработанные баллы</p>
          </div>
        </div>
      </div>

      {totalDebt > 0 ? (
        <div className="card bg-base-100">
          <div className="card-body text-center py-12">
            <span className="text-5xl mb-4">💰</span>
            <h3 className="text-lg font-bold mb-2">Есть задолженность</h3>
            <p className="text-sm text-base-content/50 max-w-sm mx-auto">
              Сумма долга составляет {money(d.totalDebt)}. Обратитесь к администратору для оплаты.
            </p>
          </div>
        </div>
      ) : (
        <div className="card bg-base-100">
          <div className="card-body text-center py-12">
            <span className="text-5xl mb-4">✅</span>
            <h3 className="text-lg font-bold mb-2">Задолженностей нет</h3>
            <p className="text-sm text-base-content/50">Все счета оплачены</p>
          </div>
        </div>
      )}
    </>
  );
}
