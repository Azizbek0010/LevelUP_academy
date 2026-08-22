import { Link } from 'react-router-dom';
import {
  Wallet, TriangleAlert, Receipt, TrendingUp, Users, GraduationCap, Clock,
  Building2, CalendarDays, Sparkles, ChevronRight, CreditCard, Coins,
  UserPlus, UserMinus,
} from 'lucide-react';
import { fmt, money, dateShort } from '../../format.js';
import { useAdminDashboard, useAdminInvoices } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonKpis } from '../../components/Skeleton.jsx';
import { Panel } from '../mentor/_ui.jsx';

/* Компактная строка показателя: подпись + число (+ шеврон если ссылка).
   Денсификейшн: меньше паддинги, меньше gap, меньший шрифт для подписи. */
function StatRow({ Icon, label, value, danger, accent, to }) {
  const inner = (
    <>
      <span className="flex items-center gap-2 text-[12px] text-base-content/70">
        {Icon && (
          <span className="w-6 h-6 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0">
            <Icon size={12} />
          </span>
        )}
        {label}
      </span>
      <span className="flex items-center gap-1 shrink-0">
        <span className={`text-[14px] font-extrabold tabular-nums ${danger ? 'text-error' : accent ? 'text-primary' : 'text-base-content'}`}>
          {value}
        </span>
        {to && <ChevronRight size={13} className="text-base-content/30" />}
      </span>
    </>
  );

  const base = 'flex items-center justify-between rounded-lg px-3 py-2 border transition-colors';
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
  const { data: invoicesData } = useAdminInvoices();

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Дашборд" subtitle={today} />
        <div className="mt-4"><SkeletonKpis /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Дашборд" subtitle={today} />
        <div className="alert alert-error mt-4">Ошибка загрузки: {error.message}</div>
      </div>
    );
  }

  const raw = data?.data || data || {};
  const t = raw.totals || {};
  const m = raw.thisMonth || {};

  /* Последние оплаты — только последние 5 */
  const payRaw = invoicesData?.data || invoicesData || {};
  const allPayments = payRaw.payments || payRaw.invoices || (Array.isArray(payRaw) ? payRaw : []);
  const recentPayments = allPayments
    .filter(p => p.status === 'paid' || p.status === 'completed')
    .slice(0, 5);

  return (
    <div className="space-y-4 pb-6 animate-page-enter">
      <PageHeader title="Дашборд" subtitle={`Сегодня ${today} · обзор вашего филиала`} />

      {/* Верхний ряд: две панели в гриде на lg, одна колонка на мобильных */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Операционные показатели — счётчики */}
        <Panel title="Показатели филиала" icon={Building2} bodyClass="p-3 space-y-1.5">
          <StatRow Icon={GraduationCap} label="Активные студенты" value={fmt(t.activeStudents)} accent to="/students" />
          <StatRow Icon={Users} label="Группы" value={fmt(t.groups)} to="/groups" />
          <StatRow Icon={Clock} label="Просроченные счета" value={fmt(t.overdueInvoices)} danger={t.overdueInvoices > 0} to="/payments" />
        </Panel>

        {/* Последние оплаты */}
        <Panel title="Последние оплаты" icon={CreditCard} bodyClass="p-3 space-y-1.5">
          {recentPayments.length === 0 ? (
            <p className="text-[12px] text-base-content/45 text-center py-3">Пока нет оплат</p>
          ) : (
            <div className="space-y-1.5">
              {recentPayments.map((p) => (
                <Link
                  key={p.id}
                  to="/payments"
                  className="flex items-center justify-between rounded-lg px-3 py-2 border border-base-200 hover:border-primary/40 hover:bg-primary/[0.03] transition-colors"
                >
                  <span className="flex items-center gap-2 text-[12px] text-base-content/70">
                    <span className="w-6 h-6 rounded-lg grid place-items-center bg-success/10 text-success shrink-0">
                      <Coins size={12} />
                    </span>
                    <span className="truncate max-w-[180px]">{p.studentName || p.student?.fullName || 'Студент'}</span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <span className="text-[14px] font-extrabold tabular-nums text-success">
                      {money(p.amount)}
                    </span>
                    <ChevronRight size={13} className="text-base-content/30" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Нижняя панель: месячные финансы — компактная 3-колонка */}
      <Panel title="За этот месяц" icon={CalendarDays} bodyClass="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatRow Icon={TrendingUp} label="Доход" value={money(m.revenue)} accent />
          <StatRow Icon={Receipt} label="Расход" value={money(m.expenses)} />
          <StatRow Icon={Sparkles} label="Прибыль" value={money(m.profit)} accent={m.profit > 0} danger={m.profit < 0} />
        </div>
      </Panel>

      {/* Приход/отток учеников за этот месяц: пришло, ушло (архивировано), чистый прирост */}
      <Panel title="Ученики за этот месяц" icon={Users} bodyClass="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatRow Icon={UserPlus} label="Пришло" value={fmt(m.newStudents)} accent to="/students" />
          <StatRow Icon={UserMinus} label="Ушло (архив)" value={fmt(m.droppedStudents)} danger={m.droppedStudents > 0} />
          <StatRow
            Icon={Sparkles}
            label="Чистый прирост"
            value={m.netStudents > 0 ? `+${fmt(m.netStudents)}` : fmt(m.netStudents)}
            accent={m.netStudents > 0}
            danger={m.netStudents < 0}
          />
        </div>
      </Panel>
    </div>
  );
}