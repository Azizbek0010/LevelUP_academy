import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, Users, Phone, MapPin } from 'lucide-react';
import { fmt, money, dateShort } from '../../format.js';
import { useSuperBranchDetail } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import Avatar from '../../components/Avatar.jsx';
import { SkeletonList } from '../../components/Skeleton.jsx';

export default function SuperBranchDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useSuperBranchDetail(id);

  if (error && error.status !== 401)
    return <div className="alert alert-error text-sm"><span>{error.message}</span></div>;

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

      {/* Info card */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
              <MapPin size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-xs opacity-50 font-medium">Адрес</div>
              <div className="text-sm font-semibold mt-0.5">{branch.address || 'Не указан'}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
              <Phone size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-xs opacity-50 font-medium">Телефон</div>
              <div className="text-sm font-semibold mt-0.5">{branch.phone || 'Не указан'}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl shrink-0">
              <Building2 size={18} className="text-primary" />
            </div>
            <div>
              <div className="text-xs opacity-50 font-medium">Создан</div>
              <div className="text-sm font-semibold mt-0.5">{dateShort(branch.createdAt)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Админы */}
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-6">
            <h2 className="card-title text-base mb-4">
              <Users size={18} /> Администраторы
              <span className="text-base-content/40 font-normal text-sm">({branch.admins?.length || 0})</span>
            </h2>
            {!branch.admins || branch.admins.length === 0 ? (
              <p className="text-base-content/40 text-sm py-8 text-center">Администраторов нет</p>
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
            <h2 className="card-title text-base mb-4">
              <Building2 size={18} /> Группы
              <span className="text-base-content/40 font-normal text-sm">({branch.groups?.length || 0})</span>
            </h2>
            {!branch.groups || branch.groups.length === 0 ? (
              <p className="text-base-content/40 text-sm py-8 text-center">Групп нет</p>
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
