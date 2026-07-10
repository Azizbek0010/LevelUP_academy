import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Users,
} from 'lucide-react';
import clsx from 'clsx';
import { branchesApi, type BranchAdminItem, type BranchGroupItem } from '../../../shared/api/endpoints/branches';
import { Avatar } from '../../../shared/ui/PageHeader';

const CURRENCY = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BranchDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['branch', id],
    queryFn: () => branchesApi.get(id!),
    enabled: !!id,
  });

  const branch = data?.branch;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-base-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-base-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="p-8">
        <Link to="/superadmin/branches" className="btn btn-ghost btn-sm gap-2 mb-4">
          <ArrowLeft className="size-4" /> Назад
        </Link>
        <div role="alert" className="alert alert-error">
          <span>Не удалось загрузить информацию о филиале.</span>
        </div>
      </div>
    );
  }

  const admins = Array.isArray(branch.admins) ? (branch.admins as BranchAdminItem[]) : [];
  const groups = branch.groups ?? [];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/superadmin/branches" className="btn btn-ghost btn-sm gap-2 mt-0.5">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold tracking-tight truncate">{branch.name}</h1>
            {branch.isMain && <span className="badge badge-primary">Главный</span>}
            {branch.isArchived && <span className="badge badge-warning">В архиве</span>}
          </div>
          <p className="text-base-content/60 text-sm mt-1">
            {branch.address ?? 'Адрес не указан'}
          </p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard icon={Building2} label="Тип" value={branch.isMain ? 'Главный филиал' : 'Дополнительный'} color="oklch(85% 0.22 130)" />
        <InfoCard icon={Users} label="Администраторы" value={String(admins.length)} color="oklch(70% 0.20 300)" />
        <InfoCard icon={BookOpen} label="Группы" value={String(groups.length)} color="oklch(75% 0.16 175)" />
        <InfoCard icon={Calendar} label="Дата открытия" value={formatDate(branch.createdAt)} color="oklch(75% 0.20 55)" />
      </div>

      {/* Contact */}
      <div className="card bg-base-100 border border-base-300 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-base-content/70 uppercase tracking-wider">Контакты</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {branch.address && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="size-8 rounded-lg bg-base-200 grid place-items-center shrink-0">
                <MapPin className="size-4 text-primary" />
              </div>
              <span>{branch.address}</span>
            </div>
          )}
          {branch.phone && (
            <div className="flex items-center gap-2.5 text-sm">
              <div className="size-8 rounded-lg bg-base-200 grid place-items-center shrink-0">
                <Phone className="size-4 text-primary" />
              </div>
              <a href={`tel:${branch.phone}`} className="hover:text-primary font-mono">{branch.phone}</a>
            </div>
          )}
          {!branch.address && !branch.phone && (
            <p className="text-base-content/40 text-sm">Контактная информация не указана</p>
          )}
        </div>
      </div>

      {/* Admins */}
      <div className="card bg-base-100 border border-base-300 overflow-hidden">
        <div className="px-5 py-4 border-b border-base-300 flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h2 className="text-lg font-medium">Администраторы ({admins.length})</h2>
        </div>
        {admins.length === 0 ? (
          <div className="p-8 text-center text-base-content/40">
            <Users className="size-10 mx-auto mb-2 opacity-30" />
            <p>Администраторы не назначены</p>
            <p className="text-xs mt-1">Добавьте администраторов через раздел «Сотрудники»</p>
          </div>
        ) : (
          <div className="divide-y divide-base-300">
            {admins.map((admin) => (
              <div key={admin.id} className="px-5 py-3 flex items-center gap-3 hover:bg-base-200/40">
                <Avatar name={`${admin.firstName} ${admin.lastName}`} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{admin.firstName} {admin.lastName}</div>
                  <div className="flex items-center gap-1 text-xs text-base-content/50">
                    <Mail className="size-3" />
                    <a href={`mailto:${admin.email}`} className="hover:text-primary">{admin.email}</a>
                  </div>
                </div>
                <span className={clsx('badge badge-sm', admin.status === 'active' ? 'badge-success' : 'badge-warning')}>
                  {admin.status === 'active' ? 'Активен' : 'Заморожен'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Groups */}
      <div className="card bg-base-100 border border-base-300 overflow-hidden">
        <div className="px-5 py-4 border-b border-base-300 flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          <h2 className="text-lg font-medium">Группы ({groups.length})</h2>
        </div>
        {groups.length === 0 ? (
          <div className="p-8 text-center text-base-content/40">
            <BookOpen className="size-10 mx-auto mb-2 opacity-30" />
            <p>Групп нет</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm dense-table">
              <thead className="bg-base-200/60">
                <tr>
                  <th>Название</th>
                  <th>Предмет</th>
                  <th className="text-right">Стоимость/мес</th>
                </tr>
              </thead>
              <tbody>
                {(groups as BranchGroupItem[]).map((g) => (
                  <tr key={g.id} className="hover:bg-base-200/40">
                    <td className="font-medium">{g.name}</td>
                    <td className="text-sm text-base-content/70">{g.subject}</td>
                    <td className="text-right tabular-nums text-sm">
                      {g.monthlyPrice > 0 ? `${CURRENCY.format(g.monthlyPrice)} UZS` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, color }: { icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>; label: string; value: string; color: string }) {
  return (
    <div className="card bg-base-100 border border-base-300 p-4 relative overflow-hidden">
      <div className="absolute -top-3 -right-3 size-14 rounded-full opacity-10" style={{ background: color, filter: 'blur(10px)' }} />
      <div className="flex items-center gap-2 mb-2">
        <div className="size-7 rounded-lg grid place-items-center" style={{ background: `color-mix(in oklch, ${color} 15%, transparent)` }}>
          <Icon className="size-3.5" style={{ color }} />
        </div>
        <span className="text-[10px] uppercase tracking-[0.12em] text-base-content/50 font-semibold">{label}</span>
      </div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}
