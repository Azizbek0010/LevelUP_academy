import { BookOpen, Layers, FileQuestion, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTrainingTypes, useMethodistAnalytics } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis } from '../../components/Skeleton.jsx';

const KPIS = [
  { key: 'types', Icon: BookOpen, title: 'Типы обучения', tint: { bg: 'rgba(34,197,94,0.10)', fg: '#16a34a', glow: 'rgba(34,197,94,0.18)' } },
  { key: 'topics', Icon: Layers, title: 'Всего тем', tint: { bg: 'rgba(59,130,246,0.10)', fg: '#2563eb', glow: 'rgba(59,130,246,0.18)' } },
  { key: 'tests', Icon: FileQuestion, title: 'Тестов', tint: { bg: 'rgba(245,158,11,0.10)', fg: '#d97706', glow: 'rgba(245,158,11,0.18)' } },
  { key: 'hw', Icon: TrendingUp, title: 'Домашние задания', tint: { bg: 'rgba(168,85,247,0.10)', fg: '#9333ea', glow: 'rgba(168,85,247,0.18)' } },
];

function KpiCard({ Icon, tint, title, value, unit, index }) {
  return (
    <div className={`glass-strong rounded-[20px] p-5 card-hover-premium group animate-slide-up stagger-${index + 1}`}>
      <div className="flex items-center justify-between mb-4">
        <span
          className="w-11 h-11 rounded-[12px] grid place-items-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
          style={{ background: tint.bg, color: tint.fg, boxShadow: `0 0 0 0 ${tint.glow}` }}
        >
          <Icon size={20} strokeWidth={2.2} />
        </span>
        <div className="w-16 h-8 opacity-30">
          <svg viewBox="0 0 64 32" fill="none" className="w-full h-full">
            <path d="M0 28 Q16 20 32 24 T64 8" stroke={tint.fg} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
            <path d="M0 30 Q16 22 32 26 T64 10" stroke={tint.fg} strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
          </svg>
        </div>
      </div>
      <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5">
        {title}
      </div>
      <div className="text-[28px] font-extrabold leading-none tracking-[-0.02em] tabular-nums text-[var(--text)]">
        {value}
      </div>
      {unit && <div className="text-[11px] text-[var(--text-muted)] mt-1.5">{unit}</div>}
    </div>
  );
}

function QuickLink({ to, icon, label, count }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3.5 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] hover:border-[rgba(59,130,246,0.3)] transition-all duration-200 group"
    >
      <span className="w-10 h-10 rounded-[10px] bg-[rgba(59,130,246,0.1)] grid place-items-center text-lg group-hover:scale-110 transition-transform">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-[var(--text)] truncate">{label}</div>
        <div className="text-[11px] text-[var(--text-muted)]">{count} тем</div>
      </div>
      <ArrowRight size={16} className="text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all" />
    </Link>
  );
}

export default function MethodistDashboard() {
  const { data: types, isLoading: typesLoading } = useTrainingTypes();
  const { data: analytics, isLoading: analyticsLoading } = useMethodistAnalytics();

  const ttList = types?.data || [];
  const tests = analytics?.data?.tests || [];
  const hw = analytics?.data?.homework || [];

  const totalTests = tests.length;
  const totalHw = hw.length;
  const totalTopics = ttList.reduce((s, t) => s + (t.topics_count || 0), 0);
  const avgScore = tests.length > 0
    ? Math.round(tests.reduce((s, t) => s + Number(t.avg_score || 0), 0) / tests.length)
    : 0;

  if (typesLoading || analyticsLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Дашборд методиста" subtitle="Управление учебными материалами и методиками" />
        <SkeletonKpis count={4} />
      </div>
    );
  }

  const values = { types: ttList.length, topics: totalTopics, tests: totalTests, hw: totalHw };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <PageHeader title="Дашборд методиста" subtitle="Управление учебными материалами и методиками" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPIS.map(({ key, ...kpi }, i) => (
          <KpiCard key={key} {...kpi} value={values[key]} index={i} />
        ))}
      </div>

      {/* Average Score Banner */}
      {tests.length > 0 && (
        <div className="glass-strong rounded-[20px] p-5 animate-slide-up stagger-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-[14px] bg-[rgba(59,130,246,0.1)] grid place-items-center shrink-0">
              <Sparkles size={24} className="text-[var(--primary)]" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1">Средний балл по тестам</div>
              <div className="flex items-end gap-3">
                <span className="text-[32px] font-extrabold leading-none tracking-[-0.02em] tabular-nums">{avgScore}%</span>
                <span className={`text-[12px] font-semibold mb-1 ${avgScore >= 70 ? 'text-success' : avgScore >= 50 ? 'text-warning' : 'text-error'}`}>
                  {avgScore >= 70 ? 'Отлично' : avgScore >= 50 ? 'Хорошо' : 'Нужна работа'}
                </span>
              </div>
              <div className="mt-2 h-2 bg-base-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${avgScore >= 70 ? 'bg-success' : avgScore >= 50 ? 'bg-warning' : 'bg-error'}`}
                  style={{ width: `${Math.max(4, avgScore)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Training Types Quick Access */}
      <div className="glass-strong rounded-[20px] p-6 animate-slide-up stagger-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[15px] font-bold text-[var(--text)]">Типы обучения</h2>
          <Link
            to="/methodist/types"
            className="text-[12px] font-semibold text-[var(--primary)] hover:opacity-80 transition-colors flex items-center gap-1"
          >
            Все типы <ArrowRight size={14} />
          </Link>
        </div>
        {ttList.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-16 h-16 rounded-[16px] bg-[rgba(59,130,246,0.1)] grid place-items-center mx-auto mb-4">
              <BookOpen size={28} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[14px] font-semibold text-[var(--text)] mb-1">Нет типов обучения</p>
            <p className="text-[12px] text-[var(--text-muted)] mb-4">Создайте первый тип, чтобы начать</p>
            <Link
              to="/methodist/types"
              className="btn btn-primary btn-sm gap-2"
            >
              <BookOpen size={16} /> Создать тип
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ttList.slice(0, 4).map((tt, i) => (
              <QuickLink
                key={tt.id}
                to={`/methodist/types/${tt.id}/topics`}
                icon={tt.icon || '📚'}
                label={tt.name}
                count={tt.topics_count || 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
