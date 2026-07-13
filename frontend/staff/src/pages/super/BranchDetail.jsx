import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Building2, Users, Phone, MapPin, AlertTriangle, TrendingUp, Wallet, UserX, FolderX, UserCog } from 'lucide-react';
import { fmt, money, dateShort } from '../../format.js';
import { useSuperBranchDetail, useInvalidate } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';

export default function SuperBranchDetail() {
  const { id } = useParams();
  const { data, isLoading, error, refetch } = useSuperBranchDetail(id);

  const branchName = data?.branch?.name || data?.name;
  useEffect(() => {
    if (branchName) {
      document.title = `${branchName} | Филиалы | LevelUp Academy`;
    }
  }, [branchName]);

  if (error && error.status !== 401) {
    return (
      <div className="space-y-6">
        <div className="text-xs breadcrumbs text-base-content/50">
          <ul>
            <li><Link to="/branches" className="hover:text-base-content font-medium">Филиалы</Link></li>
            <li className="font-semibold text-base-content">Ошибка</li>
          </ul>
        </div>
        <div className="card bg-base-100 shadow-sm border border-error/20 max-w-lg mx-auto mt-6">
          <div className="card-body items-center text-center p-6 gap-3">
            <div className="p-3 bg-error/10 text-error rounded-full">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-bold text-lg">Ошибка загрузки деталей филиала</h3>
            <p className="text-sm text-base-content/60">{error.message || 'Произошла непредвиденная ошибка при запросе к серверу.'}</p>
            <div className="card-actions mt-2">
              <button className="btn btn-primary btn-sm px-6" onClick={() => refetch()}>
                Повторить попытку
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div>
        <PageHeader title="Филиал" />
        <SkeletonList rows={8} />
      </div>
    );
  }

  const branch = data.branch || data;

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="text-xs breadcrumbs text-base-content/50">
        <ul>
          <li><Link to="/branches" className="hover:text-base-content font-medium">Филиалы</Link></li>
          <li className="font-semibold text-base-content">{branch.name}</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{branch.name}</h1>
            {branch.isMain && <span className="badge badge-primary badge-sm">Главный</span>}
            {branch.isArchived && <span className="badge badge-ghost badge-sm">Архив</span>}
          </div>
          <p className="text-sm text-base-content/50 mt-1">Детальный обзор филиала</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Students */}
        <div className="card bg-base-100 border border-base-200/50 shadow-sm p-4 flex flex-row items-center gap-4 hover:shadow-lg hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 group">
          <div className="p-3.5 bg-primary/10 text-primary rounded-2xl shadow-sm shadow-primary/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Users size={22} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-40">Ученики</div>
            <div className="text-xl font-black mt-0.5 tabular-nums text-base-content">{fmt(branch.students || 0)}</div>
          </div>
        </div>

        {/* KPI: Revenue */}
        <div className="card bg-base-100 border border-base-200/50 shadow-sm p-4 flex flex-row items-center gap-4 hover:shadow-lg hover:border-success/20 hover:-translate-y-1 transition-all duration-300 group">
          <div className="p-3.5 bg-success/10 text-success rounded-2xl shadow-sm shadow-success/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-40">Месячный доход</div>
            <div className="text-xl font-black mt-0.5 text-success tabular-nums">{money(branch.revenue || 0)}</div>
          </div>
        </div>

        {/* KPI: Debt */}
        <div className="card bg-base-100 border border-base-200/50 shadow-sm p-4 flex flex-row items-center gap-4 hover:shadow-lg hover:border-error/20 hover:-translate-y-1 transition-all duration-300 group" title={money(branch.debt || 0)}>
          <div className="p-3.5 bg-error/10 text-error rounded-2xl shadow-sm shadow-error/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <Wallet size={22} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-40">Общий долг</div>
            <div className={`text-xl font-black mt-0.5 tabular-nums ${(branch.debt || 0) > 0 ? 'text-error animate-pulse' : 'text-base-content/40'}`}>
              {money(branch.debt || 0)}
            </div>
          </div>
        </div>

        {/* KPI: Staff & Groups */}
        <div className="card bg-base-100 border border-base-200/50 shadow-sm p-4 flex flex-row items-center gap-4 hover:shadow-lg hover:border-info/20 hover:-translate-y-1 transition-all duration-300 group">
          <div className="p-3.5 bg-info/10 text-info rounded-2xl shadow-sm shadow-info/5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
            <UserCog size={22} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-40">Админы / Группы</div>
            <div className="text-xl font-black mt-0.5 tabular-nums text-base-content">
              {branch.admins?.length || 0} <span className="text-sm font-normal text-base-content/30">/</span> {branch.groups?.length || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-5 grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
          <div className="flex items-center gap-3">
            <MapPin size={18} className="text-base-content/40 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-base-content/40 tracking-wider">Адрес</div>
              <div className="font-semibold mt-0.5">{branch.address || 'Не указан'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={18} className="text-base-content/40 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-base-content/40 tracking-wider">Телефон</div>
              <div className="font-semibold mt-0.5">{branch.phone || 'Не указан'}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Building2 size={18} className="text-base-content/40 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-base-content/40 tracking-wider">Создан</div>
              <div className="font-semibold mt-0.5">{dateShort(branch.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Админы */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
            <h2 className="card-title text-base mb-4 flex items-center gap-2">
              <Users size={18} className="text-base-content/60" />
              <span>Администраторы</span>
              <span className="text-base-content/40 font-normal text-sm">({branch.admins?.length || 0})</span>
            </h2>
            {!branch.admins || branch.admins.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3 border border-dashed border-base-300 rounded-2xl bg-base-50/50">
                <div className="p-3 bg-base-100 rounded-xl text-base-content/30 shadow-sm">
                  <UserX size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-base-content/80">Администраторы отсутствуют</h4>
                  <p className="text-xs text-base-content/50 max-w-xs mt-1">
                    Для этого филиала еще не назначено ни одного администратора. Добавить их можно в разделе <Link to="/admins" className="text-primary hover:underline font-semibold">Админы</Link>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr><th>ФИО</th><th>Email</th><th>Статус</th></tr>
                  </thead>
                  <tbody>
                    {branch.admins.map((a) => (
                      <tr key={a.id} className={a.status === 'frozen' ? 'opacity-60' : ''}>
                        <td>
                          <div className="flex items-center gap-2">
                            <Avatar name={`${a.firstName} ${a.lastName}`} size={28} />
                            <span className="font-medium">{a.firstName} {a.lastName}</span>
                          </div>
                        </td>
                        <td className="text-sm">{a.email}</td>
                        <td>
                          <span className={`badge badge-sm ${a.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Группы */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
            <h2 className="card-title text-base mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-base-content/60" />
              <span>Группы</span>
              <span className="text-base-content/40 font-normal text-sm">({branch.groups?.length || 0})</span>
            </h2>
            {!branch.groups || branch.groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3 border border-dashed border-base-300 rounded-2xl bg-base-50/50">
                <div className="p-3 bg-base-100 rounded-xl text-base-content/30 shadow-sm">
                  <FolderX size={32} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-base-content/80">Учебные группы отсутствуют</h4>
                  <p className="text-xs text-base-content/50 max-w-xs mt-1">
                    В этом филиале пока нет активных или архивных учебных групп.
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr><th>Название</th><th>Предмет</th><th className="text-right">Цена / мес</th></tr>
                  </thead>
                  <tbody>
                    {branch.groups.map((g) => (
                      <tr key={g.id} className="hover">
                        <td className="font-medium">{g.name}</td>
                        <td>{g.subject || '—'}</td>
                        <td className="text-right font-semibold">{money(g.monthlyPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
