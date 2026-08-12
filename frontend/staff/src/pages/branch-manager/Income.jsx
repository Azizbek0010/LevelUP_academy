import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Wallet, CheckCircle2, CalendarDays, CreditCard, Info, Plus } from 'lucide-react';
import { money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel, Kpi, SearchInput, EmptyState } from '../mentor/_ui.jsx';
import { PaymentStatusBadge } from './_ui.jsx';
import { useBranchManagerIncome } from '../../queries.js';

/** Генерирует последние 6 месяцев в формате {key, label} */
const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function generateMonths(count = 6) {
  const result = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({ key, label: MONTH_NAMES[d.getMonth()] });
  }
  return result;
}

export default function BranchManagerIncome() {
  const MONTHS = useMemo(() => generateMonths(6), []);
  const [monthKey, setMonthKey] = useState(MONTHS[MONTHS.length - 1].key);
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useBranchManagerIncome(monthKey);

  const month = MONTHS.find((m) => m.key === monthKey) ?? MONTHS[MONTHS.length - 1];

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8 animate-page-enter">
        <PageHeader title="Доход" subtitle="Загрузка данных..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="rounded-2xl bg-base-200/60 animate-pulse h-28" />
          ))}
        </div>
        <div className="rounded-2xl bg-base-200/60 animate-pulse h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex flex-col items-center gap-3 text-error">
          <span className="text-4xl">⚠</span>
          <span className="text-lg font-semibold">Произошла ошибка при загрузке данных</span>
          <button
            className="btn btn-sm btn-error btn-outline mt-2"
            onClick={() => window.location.reload()}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  const allRows = data?.payments || [];
  const rows = search
    ? allRows.filter(p =>
        p.student?.toLowerCase().includes(search.toLowerCase()) ||
        p.group?.toLowerCase().includes(search.toLowerCase())
      )
    : allRows;
  const total = data?.total || 0;
  const paid = data?.paidCount || 0;
  const overdue = data?.overdueCount || 0;
  const debt = data?.debt || 0;

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader
        title="Доход"
        subtitle={`Филиал · платежи и задолженность`}
      />

      {/* ── Подсказка: доход создаётся через «Платежи» ── */}
      <div className="alert bg-primary/5 border border-primary/15 rounded-2xl p-4">
        <Info size={20} className="text-primary shrink-0" />
        <div className="flex flex-1 flex-wrap items-center justify-between gap-2 min-w-0">
          <div>
            <p className="text-[13px] font-semibold">Доход формируется из платежей</p>
            <p className="text-[12px] text-base-content/55">Новый платёж оформляется в разделе «Платежи»</p>
          </div>
          <Link to="/payments" className="btn btn-sm btn-primary rounded-lg shrink-0">
            <Plus size={16} /> Оформить платёж
          </Link>
        </div>
      </div>

      {/* ── Выбор месяца ── */}
      <div className="flex flex-wrap gap-2">
        {MONTHS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMonthKey(m.key)}
            className={`btn btn-sm rounded-lg transition-all ${
              m.key === monthKey
                ? 'btn-primary'
                : 'btn-ghost border border-base-200 text-base-content/60 hover:border-primary/40'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* ── KPI ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Kpi Icon={TrendingUp} title="Доход за месяц" value={money(total)} unit={`${month.label}`} tone="success" />
        <Kpi Icon={CheckCircle2} title="Оплачено" value={paid} unit={`из ${allRows.length} платежей`} tone="neutral" />
        <Kpi Icon={Wallet} title="Просрочено" value={overdue} unit="просроченных платежей" tone="danger" />
        <Kpi Icon={CalendarDays} title="Общая задолженность" value={money(debt)} unit="по филиалу" tone="danger" />
      </div>

      {/* ── Таблица платежей ── */}
      <Panel title={`Платежи — ${month.label}`} icon={CreditCard} bodyClass="p-0">
        {/* Поиск */}
        {allRows.length > 0 && (
          <div className="px-5 pt-4 pb-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Поиск по студенту или группе..."
              className="max-w-sm"
            />
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title={search ? 'Ничего не найдено' : 'В этом месяце нет платежей'}
            hint={search
              ? 'Попробуйте изменить запрос или выбрать другой месяц'
              : 'Оформите платёж в разделе «Платежи» — он появится здесь'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-base-content/45">
                  <th className="pl-5">Дата</th>
                  <th>Студент</th>
                  <th>Группа</th>
                  <th className="hidden md:table-cell">Метод</th>
                  <th className="text-right">Сумма</th>
                  <th className="pr-5 text-right">Статус</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="hover:bg-base-200/50 transition-colors">
                    <td className="pl-5 text-[13px] text-base-content/60 tabular-nums whitespace-nowrap">
                      {new Date(p.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="text-[13px] font-semibold">{p.student}</td>
                    <td className="text-[13px] text-base-content/70">{p.group}</td>
                    <td className="hidden md:table-cell text-[13px] text-base-content/60">{p.method}</td>
                    <td className="text-right text-[14px] font-extrabold tabular-nums">{money(p.amount)}</td>
                    <td className="pr-5 text-right"><PaymentStatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-base-200">
                  <td colSpan={4} className="pl-5 text-[12px] font-semibold text-base-content/60">Итого</td>
                  <td className="text-right text-[15px] font-extrabold tabular-nums text-success">{money(total)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
