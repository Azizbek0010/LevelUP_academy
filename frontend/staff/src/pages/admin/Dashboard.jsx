import { Link } from 'react-router-dom';
import {
  Wallet, TriangleAlert, Receipt, TrendingUp, Users, GraduationCap, Clock,
  Building2, CalendarDays, Sparkles, ChevronRight,
} from 'lucide-react';
import { fmt, money } from '../../format.js';
import { useAdminDashboard } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis } from '../../components/Skeleton.jsx';
import { Kpi, Panel } from '../mentor/_ui.jsx';

/* Строка показателя внутри панели. С `to` становится ссылкой — та, что ведёт
   куда-то (студенты, группы, счета), это показывает: шеврон справа и подсветка
   рамки на наведении. Без `to` — просто пара «подпись → число».

   Раньше на дашборде было ещё три секции: приветственный баннер, сетка
   «Быстрые действия» и лента «Последняя активность». Баннер убран как
   декоративный; плитки быстрых действий дублировали левое меню (те же ссылки
   на том же экране) — ровно поэтому их убрали и у ментора; лента активности
   была захардкоженной выдумкой («Система работает стабильно», «Данные
   обновлены») — интерфейс сообщал о событиях, которых не было. Осталось только
   то, что стоит на реальных данных. */
function StatRow({ Icon, label, value, danger, accent, to }) {
  const inner = (
    <>
      <span className="flex items-center gap-2.5 text-[13px] text-base-content/70">
        {Icon && (
          <span className="w-7 h-7 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0">
            <Icon size={14} />
          </span>
        )}
        {label}
      </span>
      <span className="flex items-center gap-1.5 shrink-0">
        <span className={`text-[15px] font-extrabold tabular-nums ${danger ? 'text-error' : accent ? 'text-primary' : 'text-base-content'}`}>
          {value}
        </span>
        {to && <ChevronRight size={15} className="text-base-content/30" />}
      </span>
    </>
  );

  const base = 'flex items-center justify-between rounded-xl px-3.5 py-3 border transition-colors';
  if (to) {
    return (
      <Link to={to} className={`${base} border-base-200 hover:border-primary/40 hover:bg-primary/[0.03] group`}>
        {inner}
      </Link>
    );
  }
  return <div className={`${base} border-base-200`}>{inner}</div>;
}

export default function AdminDashboard() {
  const { data, isLoading, error } = useAdminDashboard();

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Дашборд" subtitle={today} />
        <div className="mt-6"><SkeletonKpis /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Дашборд" subtitle={today} />
        <div className="alert alert-error mt-6">Ошибка загрузки: {error.message}</div>
      </div>
    );
  }

  const raw = data?.data || data || {};
  const t = raw.totals || {};
  const m = raw.thisMonth || {};

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title="Дашборд" subtitle={`Сегодня ${today} · обзор вашего филиала`} />

      {/* Деньги филиала — за всё время. Плитки кликабельны: ведут туда, где с
          этой цифрой можно что-то сделать. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi Icon={TrendingUp} title="Общий доход" value={money(t.revenue)} tone="success" to="/payments" />
        <Kpi Icon={TriangleAlert} title="Долги" value={money(t.outstandingDebt)} tone="warning" to="/payments" />
        <Kpi Icon={Receipt} title="Расходы" value={money(t.expenses)} tone="danger" to="/expenses" />
        <Kpi Icon={Wallet} title="Чистая прибыль" value={money(t.profit)} tone="neutral" to="/reports" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Операционные показатели — счётчики, а не деньги. */}
        <Panel title="Показатели филиала" icon={Building2} bodyClass="p-4">
          <div className="space-y-2">
            <StatRow Icon={GraduationCap} label="Активные студенты" value={fmt(t.activeStudents)} accent to="/students" />
            <StatRow Icon={Users} label="Группы" value={fmt(t.groups)} to="/groups" />
            <StatRow Icon={Clock} label="Просроченные счета" value={fmt(t.overdueInvoices)} danger={t.overdueInvoices > 0} to="/payments" />
          </div>
        </Panel>

        {/* Деньги за текущий месяц — срез, которого нет в плитках сверху
            (там суммы за всё время). */}
        <Panel title="За этот месяц" icon={CalendarDays} bodyClass="p-4">
          <div className="space-y-2">
            <StatRow Icon={TrendingUp} label="Доход" value={money(m.revenue)} accent />
            <StatRow Icon={Receipt} label="Расход" value={money(m.expenses)} />
            <StatRow Icon={Sparkles} label="Прибыль" value={money(m.profit)} accent={m.profit > 0} danger={m.profit < 0} />
          </div>
        </Panel>
      </div>
    </div>
  );
}
