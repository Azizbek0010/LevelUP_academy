import { useState } from 'react';
import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { dateShort } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState, ProgressBar } from '../components/ui.jsx';

const TABS = [
  { key: 'homework', label: 'Домашние задания', icon: '📋' },
  { key: 'tests', label: 'Тесты', icon: '📝' },
];

export default function Grades() {
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);
  const [tab, setTab] = useState('homework');

  if (!selectedChild) return <EmptyState icon="👶" title="Выберите ребёнка" />;

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

  const avg =
    list.length > 0
      ? Math.round(list.reduce((s, g) => s + (g.score / g.maxScore) * 100, 0) / list.length)
      : 0;

  const best = list.length > 0
    ? Math.max(...list.map((g) => Math.round((g.score / g.maxScore) * 100)))
    : 0;

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
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-primary text-primary-content shadow-sm'
                : 'text-base-content/50 hover:bg-base-200'
            }`}
          >
            <span className="mr-1.5">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card bg-base-100 p-4 text-center">
          <p className="text-2xl font-extrabold">{list.length}</p>
          <p className="text-[11px] opacity-40 mt-1">Всего</p>
        </div>
        <div className="card bg-base-100 p-4 text-center">
          <p className="text-2xl font-extrabold" style={{ color: avg >= 80 ? '#22c55e' : avg >= 60 ? '#f59e0b' : '#ef4444' }}>
            {avg}%
          </p>
          <p className="text-[11px] opacity-40 mt-1">Средний</p>
        </div>
        <div className="card bg-base-100 p-4 text-center">
          <p className="text-2xl font-extrabold text-primary">{best}%</p>
          <p className="text-[11px] opacity-40 mt-1">Лучший</p>
        </div>
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
            <div className="space-y-2 mt-2">
              {list.map((g, i) => {
                const pct = g.maxScore > 0 ? Math.round((g.score / g.maxScore) * 100) : 0;
                const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-base-200/30 hover:bg-base-200/60 transition-colors">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: `${color}15`, color }}
                    >
                      {pct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{g.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <ProgressBar value={pct} color={color} height={4} />
                        <span className="text-[11px] font-mono opacity-50">{g.score}/{g.maxScore}</span>
                      </div>
                    </div>
                    <span className="text-[11px] opacity-30 whitespace-nowrap">{dateShort(g.gradedAt || g.finishedAt)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
