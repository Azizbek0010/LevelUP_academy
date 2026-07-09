import { useMethodistAnalytics } from '../../queries.js';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { BookOpen, FileQuestion, TrendingDown, AlertTriangle } from 'lucide-react';

const scoreColor = (avg) => {
  if (avg >= 70) return 'bg-[#2ECC71]';
  if (avg >= 50) return 'bg-[#F1C40F]';
  return 'bg-[#E74C3C]';
};

const scoreLabel = (avg) => {
  if (avg >= 70) return 'Хорошо';
  if (avg >= 50) return 'Средне';
  return 'Сложно';
};

const scoreLabelClass = (avg) => {
  if (avg >= 70) return 'text-[#2ECC71]';
  if (avg >= 50) return 'text-[#E67E22]';
  return 'text-[#E74C3C]';
};

export default function MethodistAnalytics() {
  const { data, isLoading, error } = useMethodistAnalytics();

  if (isLoading) return (
    <div className="space-y-6">
      <SkeletonTable rows={5} cols={4} />
    </div>
  );

  if (error) return <div className="alert alert-error">Ошибка: {error.message}</div>;

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1D2417]">Аналитика успеваемости</h1>
        <p className="text-sm opacity-60">Статистика сложностей по предметам, тестам и ДЗ</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject difficulty */}
        <div className="card bg-white shadow-sm border border-[#E6EDD8]">
          <div className="card-body p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-[#FEF3E8] rounded-xl"><TrendingDown size={18} className="text-[#E67E22]" /></div>
              <h2 className="text-base font-bold">Сложность предметов</h2>
            </div>
            {difficultSubjects.length === 0 ? (
              <div className="text-center py-8 text-sm opacity-50">Нет данных</div>
            ) : (
              <div className="space-y-4">
                {difficultSubjects.map((s) => (
                  <div key={s.name}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-sm">{s.name}</span>
                      <span className={`text-sm font-bold ${scoreLabelClass(s.avgScore)}`}>{s.avgScore}%</span>
                    </div>
                    <div className="w-full bg-[#F0F5E9] h-3 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${scoreColor(s.avgScore)}`} style={{ width: `${Math.max(5, s.avgScore)}%` }} />
                    </div>
                    <div className="text-[11px] opacity-50 mt-0.5">{scoreLabel(s.avgScore)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Worst tests */}
        <div className="card bg-white shadow-sm border border-[#E6EDD8]">
          <div className="card-body p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-[#FDE8E8] rounded-xl"><AlertTriangle size={18} className="text-[#E74C3C]" /></div>
              <h2 className="text-base font-bold">Тесты с низкими результатами</h2>
            </div>
            {worstTests.length === 0 ? (
              <div className="text-center py-8 text-sm opacity-50">Нет данных</div>
            ) : (
              <div className="space-y-4">
                {worstTests.map((t) => (
                  <div key={t.test_id}>
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <div className="text-sm font-semibold">{t.title}</div>
                        <div className="text-[11px] opacity-50">{t.group_name} · {t.attempts} попыток</div>
                      </div>
                      <span className={`text-sm font-bold ${Number(t.avg_score) < 50 ? 'text-[#E74C3C]' : Number(t.avg_score) < 70 ? 'text-[#E67E22]' : 'text-[#2ECC71]'}`}>{t.avg_score}%</span>
                    </div>
                    <div className="w-full bg-[#F0F5E9] h-2 rounded-full overflow-hidden mt-1.5">
                      <div className={`h-full rounded-full ${scoreColor(Number(t.avg_score))}`} style={{ width: `${Math.max(5, Number(t.avg_score))}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All tests table */}
        <div className="card bg-white shadow-sm border border-[#E6EDD8] lg:col-span-2">
          <div className="card-body p-6">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 bg-[#E8F4FD] rounded-xl"><FileQuestion size={18} className="text-[#3498DB]" /></div>
              <h2 className="text-base font-bold">Все тесты</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="border-b border-[#E6EDD8]">
                    <th className="font-semibold text-[#5E6E52]">Название</th>
                    <th className="font-semibold text-[#5E6E52]">Группа</th>
                    <th className="font-semibold text-[#5E6E52]">Филиал</th>
                    <th className="font-semibold text-[#5E6E52] text-right">Попытки</th>
                    <th className="font-semibold text-[#5E6E52] text-right">Средний балл</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 opacity-50">Нет данных</td></tr>
                  ) : (
                    [...tests].sort((a, b) => Number(a.avg_score) - Number(b.avg_score)).map((t) => (
                      <tr key={t.test_id} className="border-b border-[#E6EDD8] hover:bg-[#F8FDF0]">
                        <td className="font-semibold">{t.title}</td>
                        <td className="text-[#5E6E52]">{t.group_name || '—'}</td>
                        <td className="text-[#5E6E52]">{t.branch_name}</td>
                        <td className="text-right tabular-nums">{t.attempts}</td>
                        <td className="text-right tabular-nums font-bold">{Number(t.avg_score).toFixed(1)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
