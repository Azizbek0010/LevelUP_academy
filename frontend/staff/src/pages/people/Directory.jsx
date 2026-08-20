import { useMemo, useState } from 'react';
import { Search, Users, WalletCards, AlertTriangle, Building2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader.jsx';
import { usePeopleDirectory } from '../../queries.js';

const ROLES = [
  ['', 'Все роли'], ['seo', 'SEO'], ['branch_manager', 'Branch Manager'],
  ['admin', 'Admin'], ['finance_manager', 'Finance Manager'], ['methodist', 'Methodist'],
  ['mentor', 'Mentor'], ['parent', 'Parent'], ['student', 'Student'],
];

const roleLabel = Object.fromEntries(ROLES);
const money = (value) => `${new Intl.NumberFormat('uz-UZ').format(Number(value || 0))} сум`;
const fullName = (person) => `${person.first_name || ''} ${person.last_name || ''}`.trim();

function Summary({ people, canSeeFinance }) {
  const students = people.filter((p) => p.role === 'student');
  const debt = students.reduce((sum, p) => sum + Number(p.invoice_debt || 0), 0);
  const overdue = students.reduce((sum, p) => sum + Number(p.overdue || 0), 0);
  const cards = [
    ['Людей в выборке', people.length, Users],
    ['Учеников', students.length, Building2],
    ...(canSeeFinance ? [['Долг по счетам', money(debt), WalletCards], ['Просрочено', money(overdue), AlertTriangle]] : []),
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value, Icon]) => (
        <div key={label} className="card bg-base-100 border border-base-200/60 shadow-sm">
          <div className="card-body p-4 flex-row items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/20 text-primary-content"><Icon size={18} /></span>
            <div><div className="text-[11px] font-bold uppercase tracking-wide text-base-content/50">{label}</div><div className="text-xl font-extrabold tabular-nums">{value}</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Directory() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const query = useMemo(() => {
    const qs = new URLSearchParams({ limit: '100' });
    if (search.trim()) qs.set('search', search.trim());
    if (role) qs.set('role', role);
    return qs.toString();
  }, [search, role]);
  const { data, isLoading, error } = usePeopleDirectory(query);
  const people = data?.data || [];
  const canSeeFinance = Boolean(data?.meta?.canSeeFinance);

  return (
    <div className="space-y-5">
      <PageHeader title="Люди и клиенты" subtitle="Единая база сотрудников, родителей и учеников с доступом по вашей роли" />
      <Summary people={people} canSeeFinance={canSeeFinance} />

      <section className="card bg-base-100 border border-base-200/60 shadow-sm">
        <div className="card-body p-4 sm:p-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="input input-bordered flex flex-1 items-center gap-2">
              <Search size={17} className="opacity-50" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="grow" placeholder="Имя, телефон или email" />
            </label>
            <select className="select select-bordered sm:w-56" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          {isLoading && <div className="py-12 text-center text-base-content/50">Загрузка базы…</div>}
          {error && <div className="alert alert-error">{error.message || 'Не удалось загрузить базу'}</div>}
          {!isLoading && !error && people.length === 0 && <div className="py-12 text-center text-base-content/50">По вашему фильтру никого нет</div>}

          {people.length > 0 && (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead><tr><th>Человек</th><th>Роль</th><th>Филиал</th><th>Статус</th>{canSeeFinance && <><th className="text-right">Оплачено</th><th className="text-right">Долг</th></>}</tr></thead>
                <tbody>{people.map((person) => (
                  <tr key={person.id} className="hover">
                    <td><div className="font-semibold">{fullName(person)}</div><div className="text-xs text-base-content/50">{person.phone || person.email || 'Контакт не указан'}</div></td>
                    <td><span className="badge badge-ghost badge-sm">{roleLabel[person.role] || person.role}</span>{person.children_count > 0 && <div className="mt-1 text-xs text-base-content/50">Детей: {person.children_count}</div>}</td>
                    <td>{person.branch_name || person.organization_name || 'Платформа'}</td>
                    <td><span className={`badge badge-sm ${person.status === 'active' ? 'badge-success' : 'badge-warning'}`}>{person.status}</span></td>
                    {canSeeFinance && <><td className="text-right tabular-nums">{person.role === 'student' ? money(person.paid) : '—'}</td><td className={`text-right font-semibold tabular-nums ${Number(person.overdue) > 0 ? 'text-error' : ''}`}>{person.role === 'student' ? money(person.invoice_debt) : '—'}</td></>}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
