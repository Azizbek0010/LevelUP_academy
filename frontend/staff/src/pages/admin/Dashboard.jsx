import { Link } from 'react-router-dom';
import {
  Wallet, TriangleAlert, Receipt, TrendingUp, Users, GraduationCap, Clock,
  Building2, CalendarDays, Sparkles, ChevronRight, CreditCard, Coins, BellRing,
} from 'lucide-react';
import { fmt, money } from '../../format.js';
import { useAdminDashboard, useAdminInvoices } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel } from '../mentor/_ui.jsx';
import { useAuth } from '../../auth.jsx';

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
  const { data: invoicesData } = useAdminInvoices();
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-[120px] rounded-2xl bg-base-200/60 mb-6"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-[250px] rounded-2xl bg-base-200/60 col-span-1 lg:col-span-2"></div>
          <div className="h-[250px] rounded-2xl bg-base-200/60"></div>
        </div>
        <div className="h-[180px] rounded-2xl bg-base-200/60"></div>
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

  const payRaw = invoicesData?.data || invoicesData || {};
  const allPayments = payRaw.payments || payRaw.invoices || (Array.isArray(payRaw) ? payRaw : []);
  const recentPayments = allPayments
    .filter(p => p.status === 'paid' || p.status === 'completed')
    .slice(0, 5);

  const adminName = user?.firstName || user?.first_name || user?.name || 'Admin';

  return (
    <div className="space-y-6 pb-8 animate-page-enter">


      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <Panel title="Показатели филиала" icon={Building2} bodyClass="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <StatRow Icon={GraduationCap} label="Активные студенты" value={fmt(t.activeStudents)} accent to="/students" />
              <StatRow Icon={Users} label="Группы" value={fmt(t.groups)} to="/groups" />
              <div className="sm:col-span-2">
                <StatRow Icon={Clock} label="Просроченные счета" value={fmt(t.overdueInvoices)} danger={t.overdueInvoices > 0} to="/payments" />
              </div>
            </div>
          </Panel>

          <Panel title="Последние оплаты" icon={CreditCard} bodyClass="p-4">
            {recentPayments.length === 0 ? (
              <p className="text-[13px] text-base-content/45 text-center py-4">Пока нет оплат</p>
            ) : (
              <div className="space-y-2">
                {recentPayments.map((p) => (
                  <Link
                    key={p.id}
                    to="/payments"
                    className="flex items-center justify-between rounded-xl px-3.5 py-3 border border-base-200 hover:border-primary/40 hover:bg-primary/[0.03] transition-all hover:scale-[1.01]"
                  >
                    <span className="flex items-center gap-2.5 text-[13px] text-base-content/70">
                      <span className="w-8 h-8 rounded-lg grid place-items-center bg-success/10 text-success shrink-0">
                        <Coins size={14} />
                      </span>
                      <span className="truncate font-medium">{p.studentName || p.student?.fullName || 'Студент'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[15px] font-extrabold tabular-nums text-success">
                        +{money(p.amount)}
                      </span>
                      <ChevronRight size={15} className="text-base-content/30" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* Напоминания & Месячная сводка */}
        <div className="space-y-5">
          <Panel title="Напоминания" icon={BellRing} bodyClass="p-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-xl border border-warning/20">
                <TriangleAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-warning-content">Просроченные платежи</h4>
                  <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                    В данный момент <b>{fmt(t.overdueInvoices)}</b> счетов просрочены. Контролируйте оплаты.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-info/10 rounded-xl border border-info/20">
                <Users className="w-5 h-5 text-info shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-info-content">Активные ученики</h4>
                  <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                    В филиале обучается <b>{fmt(t.activeStudents)}</b> активных учеников.
                  </p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="За этот месяц" icon={CalendarDays} bodyClass="p-4">
            <div className="flex flex-col gap-3">
              <StatRow Icon={TrendingUp} label="Доход" value={money(m.revenue)} accent />
              <StatRow Icon={Receipt} label="Расход" value={money(m.expenses)} />
              <div className="mt-2 pt-2 border-t border-base-200">
                <StatRow Icon={Sparkles} label="Прибыль" value={money(m.profit)} accent={m.profit > 0} danger={m.profit < 0} />
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
