import { useState } from 'react';
import { useParentOverview } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { dateShort } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';
import { EmptyState, ErrorState, ProgressBar } from '../components/ui.jsx';
import Icon from '../components/Icons.jsx';
import GradeDetail from '../components/GradeDetail.jsx';

const TABS = [
  { key: 'homework', label: 'Домашние задания', icon: 'document-text' },
  { key: 'tests', label: 'Тесты', icon: 'academic' },
];

export default function Grades() {
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);
  const [tab, setTab] = useState('homework');
  const [detail, setDetail] = useState(null);

  if (!selectedChild) return <EmptyState icon="user-circle" title="Выберите ребёнка" />;

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

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-base-100 p-1 rounded-xl w-fit shadow-sm">
        {TABS.map((t) => {
          const count = t.key === 'homework' ? hw.length : tests.length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === t.key
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/50 hover:bg-base-200'
              }`}
            >
              <Icon name={t.icon} className="w-4 h-4" />
              {t.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                tab === t.key ? 'bg-primary-content/20' : 'bg-base-200'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card bg-base-100 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-base-200 flex items-center justify-center mx-auto mb-2">
            <Icon name="document-text" className="w-5 h-5 text-base-content/40" />
          </div>
          <p className="text-2xl font-extrabold">{list.length}</p>
          <p className="text-[11px] opacity-40 mt-1">Всего</p>
        </div>
        <div className="card bg-base-100 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
            style={{ background: avg >= 80 ? 'rgba(34,197,94,.1)' : avg >= 60 ? 'rgba(245,158,11,.1)' : 'rgba(239,68,68,.1)' }}
          >
            <Icon
              name="chart-bar"
              className="w-5 h-5"
              style={{ color: avg >= 80 ? '#22c55e' : avg >= 60 ? '#f59e0b' : '#ef4444' }}
            />
          </div>
          <p
            className="text-2xl font-extrabold"
            style={{ color: avg >= 80 ? '#22c55e' : avg >= 60 ? '#f59e0b' : '#ef4444' }}
          >
            {avg}%
          </p>
          <p className="text-[11px] opacity-40 mt-1">Средний</p>
        </div>
        <div className="card bg-base-100 p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Icon name="trophy" className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-extrabold text-primary">{best}%</p>
          <p className="text-[11px] opacity-40 mt-1">Лучший</p>
        </div>
      </div>

      {/* Grade List */}
      <div className="card bg-base-100">
        <div className="card-body">
          {list.length === 0 ? (
            <EmptyState
              icon="document-text"
              title="Нет оценок"
              message={tab === 'homework' ? 'Домашние задания ещё не проверены' : 'Тесты ещё не пройдены'}
            />
          ) : (
            <div className="space-y-2 mt-2">
              {list.map((g, i) => {
                const pct = g.maxScore > 0 ? Math.round((g.score / g.maxScore) * 100) : 0;
                const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
                const itemId = g.id || `${tab}-${i}`;
                return (
                  <button
                    key={itemId}
                    onClick={() => setDetail({ type: tab === 'homework' ? 'hw' : 'test', id: g.id })}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-base-200/30 hover:bg-base-200/60 hover:-translate-y-0.5 transition-all duration-200 group text-left cursor-pointer"
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `${color}15`, color }}
                    >
                      {pct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{g.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <ProgressBar value={pct} color={color} height={4} />
                        <span className="text-[11px] font-mono opacity-50">{g.score}/{g.maxScore}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] opacity-30 whitespace-nowrap">{dateShort(g.gradedAt || g.finishedAt)}</span>
                      <Icon name="chevron-right" className="w-4 h-4 opacity-20 group-hover:opacity-50 transition-opacity" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {detail && (
        <GradeDetail
          type={detail.type}
          id={detail.id}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
