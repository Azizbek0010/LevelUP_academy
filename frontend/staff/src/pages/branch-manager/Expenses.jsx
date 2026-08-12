import { useState, useMemo } from 'react';
import { Receipt, Tag, TrendingUp, Layers, Info } from 'lucide-react';
import { money } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Panel, Kpi, SearchInput, EmptyState } from '../mentor/_ui.jsx';
import { useBranchManagerExpenses } from '../../queries.js';

/** Генерирует последние 6 месяцев */
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

export default function BranchManagerExpenses() {
  const MONTHS = useMemo(() => generateMonths(6), []);
  const [monthKey, setMonthKey] = useState(MONTHS[MONTHS.length - 1].key);
  const [cat, setCat] = useState('');
  const [search, setSearch] = useState('');
  const { data, isLoading, error } = useBranchManagerExpenses(monthKey);

  const month = MONTHS.find((m) => m.key === monthKey) ?? MONTHS[MONTHS.length - 1];

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8 animate-page-enter">
        <PageHeader title="Расходы" subtitle="Загрузка данных..." />
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

  const allExpenses = data?.expenses || [];
  const filteredByCat = allExpenses.filter((e) => !cat || e.category === cat);
  const rows = search
    ? filteredByCat.filter(e =>
        (e.description || e.note)?.toLowerCase().includes(search.toLowerCase()) ||
        e.category?.toLowerCase().includes(search.toLowerCase())
      )
    : filteredByCat;
  const total = data?.totalAmount || 0;
  const categories = new Set(allExpenses.map((e) => e.category));
  const top = rows.length ? [...rows].sort((a, b) => b.amount - a.amount)[0] : null;
  const EXPENSE_CATEGORIES = [...categories].sort();

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader
        title="Расходы"
        subtitle={`Филиал · расходы за ${month.label.toLowerCase()}`}
      />

      {/* ── Read-only заметка ── */}
      <div className="flex items-start gap-3 rounded-2xl border border-base-200 bg-base-100 px-4 py-3">
        <span className="w-8 h-8 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0">
          <Info size={15} />
        </span>
        <p className="text-[13px] text-base-content/70 leading-relaxed">
          <b className="text-base-content">Только просмотр.</b>{' '}
          Расходы добавляет администратор филиала — здесь видна статистика за выбранный месяц.
        </p>
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
        <Kpi Icon={TrendingUp} title="Расход за месяц" value={money(total)} unit={`${month.label}`} tone="danger" />
        <Kpi Icon={Layers} title="Категории" value={categories.size} unit="использовано" tone="neutral" />
        <Kpi Icon={Receipt} title="Записи" value={filteredByCat.length} unit="расходов" tone="neutral" />
        <Kpi
          Icon={Tag}
          title="Самый крупный"
          value={top ? money(top.amount) : '—'}
          unit={top ? top.category : ''}
          tone="danger"
        />
      </div>

      {/* ── Фильтр по категориям ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mr-1">
          Категория:
        </span>
        <button
          onClick={() => setCat('')}
          className={`badge badge-lg gap-1 border transition-colors cursor-pointer ${
            cat === '' ? 'badge-primary' : 'badge-ghost border-base-200 text-base-content/60 hover:border-primary/40'
          }`}
        >
          Все
        </button>
        {EXPENSE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(cat === c ? '' : c)}
            className={`badge badge-lg gap-1 border transition-colors cursor-pointer ${
              cat === c ? 'badge-primary' : 'badge-ghost border-base-200 text-base-content/60 hover:border-primary/40'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* ── Таблица расходов ── */}
      <Panel title={`Расходы — ${month.label}`} icon={Receipt} bodyClass="p-0">
        {/* Поиск */}
        {allExpenses.length > 0 && (
          <div className="px-5 pt-4 pb-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Поиск по комментарию или категории..."
              className="max-w-sm"
            />
          </div>
        )}

        {rows.length === 0 ? (
          search ? (
            <EmptyState
              icon={Receipt}
              title="Ничего не найдено"
              hint="Попробуйте изменить запрос или сбросить фильтр категории."
            />
          ) : (
            <EmptyState
              icon={Receipt}
              title="В этом месяце нет расходов"
              hint="Расходы добавляет администратор филиала — когда они появятся, вы увидите их здесь."
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wider text-base-content/45">
                  <th className="pl-5">Дата</th>
                  <th>Категория</th>
                  <th>Комментарий</th>
                  <th className="pr-5 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id} className="hover:bg-base-200/50 transition-colors">
                    <td className="pl-5 text-[13px] text-base-content/60 tabular-nums whitespace-nowrap">
                      {new Date(e.spent_at || e.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                    </td>
                    <td>
                      <span className="badge badge-sm badge-ghost border border-base-200 text-base-content/70">
                        {e.category}
                      </span>
                    </td>
                    <td className="text-[13px] text-base-content/70 max-w-[260px] truncate">{e.description || e.note}</td>
                    <td className="pr-5 text-right text-[14px] font-extrabold tabular-nums text-base-content">
                      {money(e.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-base-200">
                  <td colSpan={3} className="pl-5 text-[12px] font-semibold text-base-content/60">Итого</td>
                  <td className="pr-5 text-right text-[15px] font-extrabold tabular-nums text-error">{money(total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
