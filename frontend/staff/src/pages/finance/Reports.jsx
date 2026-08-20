import { Download, Wallet, TriangleAlert, Users, Building2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/PageHeader.jsx';
import { money } from '../../format.js';
import { useSuperStats } from '../../queries.js';
import { Metric, Card, compactMoney } from './_ui.jsx';
import { useT } from './_i18n.jsx';

const METHOD_LABEL = { cash: 'Наличные', card: 'Карта', click: 'Click', payme: 'Payme' };

export default function FinanceReports() {
  const { t } = useT();
  const { data, isLoading, error, refetch } = useSuperStats('30d');

  if (error) {
    return <button className="btn btn-error" onClick={() => refetch()}>{error.message}</button>;
  }
  if (isLoading || !data) return <div className="loading loading-spinner loading-lg" />;

  const totals = data.totals;
  const branches = data.branches || [];
  const chartData = branches.map((branch) => ({
    name: branch.name,
    revenue: Number(branch.revenue || 0),
    debt: Number(branch.debt || 0),
  }));
  const methods = (data.paymentMethods || []).map((row) => ({
    name: METHOD_LABEL[row.method] || row.method,
    amount: Number(row.amount || 0),
  }));

  const handleExport = () => {
    const rows = [
      ['Филиал', 'Ученики', 'Поступления за 30 дней', 'Текущий долг'],
      ...branches.map((branch) => [branch.name, branch.students, branch.revenue, branch.debt]),
      ['ОРГАНИЗАЦИЯ', totals.activeStudents, totals.periodRevenue, totals.outstandingDebt],
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${value}"`).join(',')).join('\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title={t('reports.title')} subtitle="Реальные данные backend · последние 30 дней">
        <button onClick={handleExport} className="btn btn-outline gap-2">
          <Download size={16} /> {t('reports.export')}
        </button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        <Metric Icon={Wallet} label="Поступления за 30 дней" value={money(totals.periodRevenue)} tone="success" />
        <Metric Icon={TriangleAlert} label="Текущий долг" value={money(totals.outstandingDebt)} tone="warning" />
        <Metric Icon={Users} label="Активные ученики" value={totals.activeStudents} tone="info" />
        <Metric Icon={Building2} label="Филиалы" value={totals.branches} tone="neutral" />
      </div>

      <Card title="Поступления и долги по филиалам" subtitle="Последние 30 дней" bodyClass="p-4 h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-base-300)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis width={64} tickFormatter={(value) => compactMoney(value)} />
            <Tooltip formatter={(value) => money(value)} />
            <Bar dataKey="revenue" name="Поступления" fill="#16a34a" radius={[4, 4, 0, 0]} />
            <Bar dataKey="debt" name="Долг" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
        <Card title="Подробный отчёт по филиалам" className="xl:col-span-2" bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead><tr><th>Филиал</th><th>Ученики</th><th className="text-right">Поступления</th><th className="text-right">Долг</th><th className="text-right">Доля</th></tr></thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td className="font-medium">{branch.name}</td>
                    <td>{branch.students}</td>
                    <td className="text-right text-success tabular-nums">{money(branch.revenue)}</td>
                    <td className="text-right text-error tabular-nums">{money(branch.debt)}</td>
                    <td className="text-right">{Number(branch.share || 0).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Способы оплаты" subtitle="Завершённые транзакции" bodyClass="p-4">
          {methods.length ? methods.map((method) => (
            <div key={method.name} className="flex justify-between gap-3 py-2 border-b border-base-200 last:border-0">
              <span>{method.name}</span><span className="font-bold tabular-nums">{money(method.amount)}</span>
            </div>
          )) : <p className="text-sm text-base-content/50">Нет завершённых платежей</p>}
        </Card>
      </div>
    </div>
  );
}
