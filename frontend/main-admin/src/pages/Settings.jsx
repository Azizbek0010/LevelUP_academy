import { Link } from 'react-router-dom';
import {
  User, Shield, CreditCard, Building2, GraduationCap, Wallet,
  Info, ExternalLink, GitBranch, Landmark, TrendingUp,
  Activity, Settings2,
} from 'lucide-react';
import { useDashboard, usePricing } from '../queries.js';
import { useAuth } from '../auth.jsx';
import { fmt, ORG_STATUS } from '../format.js';
import PageHeader from '../components/PageHeader.jsx';

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-base-200 py-2.5 text-sm last:border-0">
      <span className="text-base-content/55">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { data } = useDashboard();
  const { data: pricing } = usePricing();

  const t = data?.totals;
  const cur = t?.currency || pricing?.currency || 'UZS';
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'MA';

  const statusStats = (data?.partners || []).reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader
        title={<span className="flex items-center gap-2"><Settings2 size={22} /> Настройки</span>}
        subtitle="Профиль Main Admin и конфигурация платформы"
      />

      {/* Admin profile hero */}
      <div className="card bg-base-100 border border-base-200/60 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-lime-400 to-lime-600" />
        <div className="card-body flex-row flex-wrap items-center gap-5 py-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lime-400 to-lime-600 text-lime-950 font-extrabold text-2xl grid place-items-center shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-extrabold">{user?.firstName} {user?.lastName}</div>
            <div className="text-sm text-base-content/55 mt-0.5">{user?.email}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className="badge badge-sm bg-lime-100 text-lime-800 border-lime-200 gap-1">
                <Shield size={10} /> Main Admin
              </span>
              <span className="badge badge-sm badge-ghost gap-1">
                <Activity size={10} className="text-success" /> Активен
              </span>
            </div>
          </div>
          <div className="text-right shrink-0 hidden sm:block">
            <div className="text-xs text-base-content/40 mb-1">Уровень доступа</div>
            <div className="text-sm font-bold">Полный доступ</div>
            <div className="text-xs text-base-content/40">Вся платформа</div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Profile details */}
        <div className="card bg-base-100 border border-base-200/60 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <User size={15} className="text-lime-600" />
              <h2 className="card-title text-base">Данные профиля</h2>
            </div>
            <Row label="Имя" value={user?.firstName || '—'} />
            <Row label="Фамилия" value={user?.lastName || '—'} />
            <Row label="Email" value={user?.email || '—'} />
            <Row label="Роль" value="Main Admin" />
            <Row label="Уровень доступа" value="Полный" />
          </div>
        </div>

        {/* Platform info */}
        <div className="card bg-base-100 border border-base-200/60 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <Info size={15} className="text-lime-600" />
              <h2 className="card-title text-base">Платформа</h2>
            </div>
            <Row label="Название" value="LevelUp Academy" />
            <Row label="Версия" value={<span className="badge badge-sm badge-outline">v1.0</span>} />
            <Row label="Среда" value={<span className="badge badge-sm badge-success badge-outline">Production</span>} />
            <Row label="Валюта" value={cur} />
            <Row label="Часовой пояс" value="UTC+5 (Ташкент)" />
          </div>
        </div>

        {/* Platform stats */}
        <div className="card bg-base-100 border border-base-200/60 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={15} className="text-lime-600" />
              <h2 className="card-title text-base">Статистика платформы</h2>
            </div>
            {!t ? (
              <div className="flex justify-center py-6"><span className="loading loading-spinner opacity-40" /></div>
            ) : (
              <>
                <Row label="Учебных центров" value={fmt(t.partners)} />
                <Row label="Учеников всего" value={fmt(t.students)} />
                <Row label="Филиалов всего" value={fmt(t.branches)} />
                <Row
                  label="Доход / мес"
                  value={<span className="text-lime-700 font-bold">{fmt(t.ourMonthlyIncome)} {cur}</span>}
                />
                {Object.keys(statusStats).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-base-200">
                    <div className="text-xs text-base-content/45 mb-2 font-semibold uppercase tracking-wider">По статусам</div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(statusStats).map(([status, count]) => {
                        const st = ORG_STATUS[status] || { label: status, cls: 'badge-ghost' };
                        return (
                          <div key={status} className="text-center p-2.5 bg-base-200/50 rounded-xl">
                            <div className="text-xl font-extrabold">{count}</div>
                            <span className={`badge badge-xs mt-1 ${st.cls}`}>{st.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="card bg-base-100 border border-base-200/60 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={15} className="text-lime-600" />
              <h2 className="card-title text-base">Текущие тарифы</h2>
            </div>
            {!pricing ? (
              <div className="flex justify-center py-6"><span className="loading loading-spinner opacity-40" /></div>
            ) : (
              <>
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center justify-between p-3 bg-base-200/40 rounded-xl text-sm">
                    <span className="flex items-center gap-2 text-base-content/60">
                      <Landmark size={13} className="text-blue-500" /> 1-й филиал (база)
                    </span>
                    <span className="font-bold">{fmt(pricing.baseFirstBranch)} {cur}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-base-200/40 rounded-xl text-sm">
                    <span className="flex items-center gap-2 text-base-content/60">
                      <GitBranch size={13} className="text-purple-500" /> Доп. филиал
                    </span>
                    <span className="font-bold">{fmt(pricing.perExtraBranch)} {cur}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-base-200/40 rounded-xl text-sm">
                    <span className="flex items-center gap-2 text-base-content/60">
                      <GraduationCap size={13} className="text-green-500" /> За ученика
                    </span>
                    <span className="font-bold">{fmt(pricing.perStudent)} {cur}</span>
                  </div>
                </div>
                <Link to="/billing" className="btn btn-sm btn-outline gap-1.5 w-full">
                  <ExternalLink size={13} /> Редактировать тарифы
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="card bg-base-100 border border-base-200/60 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base mb-4">Быстрая навигация</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { to: '/leads', Icon: Activity, title: 'Заявки', desc: 'Новые учебные центры', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100 hover:border-blue-300' },
              { to: '/organizations', Icon: Building2, title: 'Партнёры', desc: 'Управление центрами', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100 hover:border-purple-300' },
              { to: '/revenue', Icon: TrendingUp, title: 'Доход', desc: 'Аналитика выручки', color: 'text-lime-700', bg: 'bg-lime-50 border-lime-100 hover:border-lime-300' },
              { to: '/billing', Icon: Wallet, title: 'Биллинг', desc: 'Тарифы и счета', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100 hover:border-orange-300' },
            ].map(({ to, Icon, title, desc, color, bg }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all group ${bg}`}
              >
                <Icon size={20} className={color} />
                <div>
                  <div className={`font-semibold text-sm ${color}`}>{title}</div>
                  <div className="text-xs text-base-content/45">{desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
