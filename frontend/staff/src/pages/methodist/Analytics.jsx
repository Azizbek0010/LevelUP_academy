import { useMethodistAnalytics } from '../../queries.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { BookOpen, FileQuestion, TrendingDown, AlertTriangle, BarChart3, RefreshCw, ArrowDown } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';

const scoreColor = (avg) => {
  if (avg >= 70) return 'bg-success';
  if (avg >= 50) return 'bg-warning';
  return 'bg-error';
};

const scoreLabel = (avg) => {
  if (avg >= 70) return 'Хорошо';
  if (avg >= 50) return 'Средне';
  return 'Сложно';
};

const scoreTextClass = (avg) => {
  if (avg >= 70) return 'text-success';
  if (avg >= 50) return 'text-warning';
  return 'text-error';
};

const scoreBgClass = (avg) => {
  if (avg >= 70) return 'bg-[rgba(34,197,94,0.10)]';
  if (avg >= 50) return 'bg-[rgba(245,158,11,0.10)]';
  return 'bg-[rgba(239,68,68,0.10)]';
};

function ScoreBadge({ score, size = 'md' }) {
  const num = Number(score);
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-[13px] px-3 py-1';
  return (
    <span className={`inline-flex items-center rounded-full font-bold tabular-nums ${sizeClass} ${scoreTextClass(num)} ${scoreBgClass(num)}`}>
      {num.toFixed(1)}%
    </span>
  );
}

function DifficultyBar({ name, avgScore, count, index }) {
  return (
    <div className={`animate-slide-up stagger-${Math.min(index + 1, 6)}`}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-[var(--text)]">{name}</span>
          <span className="text-[10px] text-[var(--text-muted)]">({count} тестов)</span>
        </div>
        <ScoreBadge score={avgScore} />
      </div>
      <div className="relative h-3 bg-base-200 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${scoreColor(avgScore)}`}
          style={{ width: `${Math.max(5, avgScore)}%` }}
        />
        {/* Score markers */}
        <div className="absolute inset-0 flex">
          <div className="w-[50%] border-r border-white/30" />
          <div className="w-[20%] border-r border-white/30" />
        </div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-[var(--text-muted)]">{scoreLabel(avgScore)}</span>
        <span className="text-[10px] text-[var(--text-muted)] tabular-nums">{avgScore}%</span>
      </div>
    </div>
  );
}

function WorstTestCard({ test, index }) {
  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-[14px] bg-[var(--surface-hover)] hover:bg-[rgba(239,68,68,0.04)] transition-colors animate-slide-up stagger-${Math.min(index + 1, 6)}`}>
      <span className="w-8 h-8 rounded-[8px] bg-[rgba(239,68,68,0.08)] grid place-items-center shrink-0 text-[11px] font-bold text-error">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--text)] truncate">{test.title}</div>
        <div className="text-[11px] text-[var(--text-muted)]">{test.group_name} · {test.attempts} попыток</div>
      </div>
      <ScoreBadge score={test.avg_score} size="sm" />
    </div>
  );
}

export default function MethodistAnalytics() {
  const { data, isLoading, error } = useMethodistAnalytics();

  if (isLoading) return (
    <div className="space-y-6">
      <PageHeader title="Аналитика успеваемости" subtitle="Статистика сложностей по предметам, тестам и ДЗ" />
      <SkeletonTable rows={5} cols={4} />
    </div>
  );

  if (error) return (
    <div className="space-y-6">
      <PageHeader title="Аналитика успеваемости" subtitle="Статистика сложностей по предметам, тестам и ДЗ" />
      <div className="glass-strong rounded-[20px] p-6 animate-scale-in">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[14px] bg-[rgba(239,68,68,0.08)] grid place-items-center shrink-0">
            <AlertTriangle size={22} className="text-error" />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-[var(--text)] mb-0.5">Ошибка загрузки</p>
            <p className="text-[12px] text-[var(--text-muted)]">{error.message}</p>
          </div>
          <button
            className="flex items-center gap-2 h-10 px-4 rounded-[10px] bg-[var(--surface-hover)] text-[var(--text-secondary)] text-[13px] font-semibold hover:bg-base-300 transition-colors"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={14} /> Повторить
          </button>
        </div>
      </div>
    </div>
  );

  const tests = data?.data?.tests || [];
  const homework = data?.data?.homework || [];

  // Subject stats
  const subjectStats = {};
  for (const t of tests) {
    const subj = t.subject || 'Общее';
    if (!subjectStats[subj]) subjectStats[subj] = { tests: 0, avgScore: 0, count: 0 };
    subjectStats[subj].tests += 1;
    subjectStats[subj].avgScore += Number(t.avg_score || 0);
    subjectStats[subj].count += 1;
  }
  for (const h of homework) {
    const subj = h.subject || 'Общее';
    if (!subjectStats[subj]) subjectStats[subj] = { tests: 0, avgScore: 0, count: 0 };
    subjectStats[subj].avgScore += Number(h.avg_score || 0);
    subjectStats[subj].count += 1;
  }
  const difficultSubjects = Object.entries(subjectStats)
    .map(([name, s]) => ({ name, ...s, avgScore: s.count > 0 ? Math.round(s.avgScore / s.count) : 0 }))
    .sort((a, b) => a.avgScore - b.avgScore);

  const worstTests = [...tests].sort((a, b) => Number(a.avg_score) - Number(b.avg_score)).slice(0, 5);
  const sortedTests = [...tests].sort((a, b) => Number(a.avg_score) - Number(b.avg_score));

  // Overall stats
  const totalAttempts = tests.reduce((s, t) => s + (Number(t.attempts) || 0), 0);
  const overallAvg = tests.length > 0
    ? Math.round(tests.reduce((s, t) => s + Number(t.avg_score || 0), 0) / tests.length)
    : 0;

  return (
    <div className="space-y-5">
      <div className="animate-fade-in">
        <PageHeader title="Аналитика успеваемости" subtitle="Статистика сложностей по предметам, тестам и ДЗ" />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-strong rounded-[20px] p-4 card-hover-premium animate-slide-up stagger-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5">Всего тестов</div>
          <div className="text-[24px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">{tests.length}</div>
        </div>
        <div className="glass-strong rounded-[20px] p-4 card-hover-premium animate-slide-up stagger-2">
          <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5">Всего попыток</div>
          <div className="text-[24px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">{totalAttempts}</div>
        </div>
        <div className="glass-strong rounded-[20px] p-4 card-hover-premium animate-slide-up stagger-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5">Общий средний</div>
          <div className="flex items-end gap-2">
            <span className={`text-[24px] font-extrabold leading-none tracking-[-0.02em] tabular-nums ${scoreTextClass(overallAvg)}`}>{overallAvg}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Subject difficulty */}
        <div className="glass-strong rounded-[20px] p-6 animate-slide-up stagger-4">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-[12px] bg-[rgba(245,158,11,0.1)] grid place-items-center">
              <TrendingDown size={18} className="text-warning" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-[var(--text)]">Сложность предметов</h2>
              <p className="text-[11px] text-[var(--text-muted)]">По среднему баллу</p>
            </div>
          </div>
          {difficultSubjects.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-[12px] bg-[var(--surface-hover)] grid place-items-center mx-auto mb-3">
                <BarChart3 size={20} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-[13px] text-[var(--text-muted)]">Нет данных</p>
            </div>
          ) : (
            <div className="space-y-5">
              {difficultSubjects.map((s, i) => (
                <DifficultyBar key={s.name} name={s.name} avgScore={s.avgScore} count={s.count} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* Worst tests */}
        <div className="glass-strong rounded-[20px] p-6 animate-slide-up stagger-5">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-[12px] bg-[rgba(239,68,68,0.1)] grid place-items-center">
              <AlertTriangle size={18} className="text-error" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-[var(--text)]">Тесты с низкими результатами</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Топ-5 по сложности</p>
            </div>
          </div>
          {worstTests.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-[12px] bg-[var(--surface-hover)] grid place-items-center mx-auto mb-3">
                <AlertTriangle size={20} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-[13px] text-[var(--text-muted)]">Нет данных</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {worstTests.map((t, i) => (
                <WorstTestCard key={t.test_id} test={t} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* All tests table */}
        <div className="glass-strong rounded-[20px] p-6 lg:col-span-2 animate-slide-up stagger-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-10 h-10 rounded-[12px] bg-[rgba(59,130,246,0.1)] grid place-items-center">
              <FileQuestion size={18} className="text-info" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-[var(--text)]">Все тесты</h2>
              <p className="text-[11px] text-[var(--text-muted)]">Полная таблица результатов</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="font-bold text-[10px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">Название</th>
                  <th className="font-bold text-[10px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">Группа</th>
                  <th className="font-bold text-[10px] uppercase tracking-[0.06em] text-[var(--text-secondary)]">Филиал</th>
                  <th className="font-bold text-[10px] uppercase tracking-[0.06em] text-[var(--text-secondary)] text-right">Попытки</th>
                  <th className="font-bold text-[10px] uppercase tracking-[0.06em] text-[var(--text-secondary)] text-right">Средний балл</th>
                </tr>
              </thead>
              <tbody>
                {sortedTests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10">
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-[12px] bg-[var(--surface-hover)] grid place-items-center mb-3">
                          <FileQuestion size={20} className="text-[var(--text-muted)]" />
                        </div>
                        <p className="text-[13px] text-[var(--text-muted)]">Нет данных</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedTests.map((t, i) => (
                    <tr key={t.test_id} className="border-b border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors">
                      <td className="text-[13px] font-semibold text-[var(--text)]">{t.title}</td>
                      <td className="text-[12px] text-[var(--text-secondary)]">{t.group_name || '—'}</td>
                      <td className="text-[12px] text-[var(--text-secondary)]">{t.branch_name}</td>
                      <td className="text-right tabular-nums text-[12px] text-[var(--text-secondary)]">{t.attempts}</td>
                      <td className="text-right">
                        <ScoreBadge score={t.avg_score} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
