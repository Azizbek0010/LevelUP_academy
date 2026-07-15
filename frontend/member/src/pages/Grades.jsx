import { useState } from 'react';
import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { dateShort } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState } from '../components/ui.jsx';

const TABS = [
  { key: 'homework', label: 'Домашние задания' },
  { key: 'tests', label: 'Тесты' },
];

export default function Grades() {
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);
  const [tab, setTab] = useState('homework');

  if (!selectedChild) {
    return <EmptyState icon="👶" title="Выберите ребёнка" />;
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Оценки" />
        <SkeletonTable rows={5} cols={4} />
      </>
    );
  }

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const d = data?.data;
  if (!d) return null;

  const hw = d.grades?.homework || [];
  const tests = d.grades?.tests || [];
  const list = tab === 'homework' ? hw : tests;

  return (
    <>
      <PageHeader
        title="Оценки"
        subtitle={`${selectedChild.firstName} ${selectedChild.lastName}`}
      />

      <div className="flex gap-1 mb-4 bg-base-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-primary text-primary-content'
                : 'text-base-content/60 hover:bg-base-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="card bg-base-100">
        <div className="card-body">
          {list.length === 0 ? (
            <EmptyState
              icon="📝"
              title="Нет оценок"
              message={tab === 'homework' ? 'Домашние задания ещё не проверены' : 'Тесты ещё не пройдены'}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Название</th>
                    <th>Балл</th>
                    <th>Процент</th>
                    <th>Дата</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((g, i) => {
                    const pct = g.maxScore > 0 ? Math.round((g.score / g.maxScore) * 100) : 0;
                    const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
                    return (
                      <tr key={i}>
                        <td className="text-sm font-medium">{g.title}</td>
                        <td className="text-sm font-mono">
                          {g.score}/{g.maxScore}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-base-200 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${pct}%`, background: color }}
                              />
                            </div>
                            <span className="text-xs font-mono" style={{ color }}>
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="text-sm opacity-60 whitespace-nowrap">
                          {dateShort(g.gradedAt || g.finishedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
