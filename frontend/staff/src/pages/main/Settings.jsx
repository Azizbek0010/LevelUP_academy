import { Link } from 'react-router-dom';
import { User, CreditCard, Building2, GraduationCap, Wallet, Info, ExternalLink } from 'lucide-react';
import { useMainDashboard, useMainPricing } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import { fmt, ORG_STATUS } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';

function Section({ title, Icon, children }) {
  return (
    <div className="card bg-base-100">
      <div className="card-body">
        <div className="flex items-center gap-2 mb-4">
          <Icon size={16} className="text-primary" />
          <h2 className="card-title text-base">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-base-200 py-2.5 text-sm last:border-0">
      <span className="text-base-content/55">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}

export default function MainSettings() {
  const { user } = useAuth();
  const { data } = useMainDashboard();
  const { data: pricing } = useMainPricing();

  const t = data?.totals;
  const cur = t?.currency || pricing?.currency || 'UZS';
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'M';

  const statusCounts = (data?.partners || []).reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <PageHeader title="Настройки" subtitle="Профиль Main Admin и конфигурация платформы" />

      <div className="grid lg:grid-cols-2 gap-5">
        <Section title="Профиль администратора" Icon={User}>
          <div className="flex items-center gap-4 mb-4 p-3 bg-base-200/50 rounded-xl">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content font-extrabold text-xl grid place-items-center shrink-0">
              {initials}
            </div>
            <div>
              <div className="font-bold text-lg">{user?.firstName} {user?.lastName}</div>
              <div className="text-sm text-base-content/55">{user?.email}</div>
              <span className="badge badge-primary badge-sm mt-1">Main Admin</span>
            </div>
          </div>
          <Row label="Имя" value={user?.firstName || '—'} />
          <Row label="Фамилия" value={user?.lastName || '—'} />
          <Row label="Email" value={user?.email || '—'} />
          <Row label="Роль" value="Main Admin" />
        </Section>

        <Section title="Платформа" Icon={Info}>
          <Row label="Название" value="LevelUp Academy" />
          <Row label="Версия" value="v1.0" />
          <Row label="Среда" value="Production" />
          <Row label="Валюта" value={cur} />
          <Row label="Часовой пояс" value="UTC+5 (Ташкент)" />
        </Section>

        <Section title="Статистика платформы" Icon={Building2}>
          {!t ? (
            <div className="flex justify-center py-6"><span className="loading loading-spinner opacity-40" /></div>
          ) : (
            <>
              <Row label="Учебных центров (партнёров)" value={fmt(t.partners)} />
              <Row label="Учеников всего" value={fmt(t.students)} />
              <Row label="Филиалов всего" value={fmt(t.branches)} />
              <Row label="Доход / мес" value={<span className="text-primary font-bold">{fmt(t.ourMonthlyIncome)} {cur}</span>} />
              <div className="mt-3 grid grid-cols-3 gap-2">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const s = ORG_STATUS[status] || { label: status, cls: 'badge-ghost' };
                  return (
                    <div key={status} className="text-center p-2 bg-base-200/50 rounded-lg">
                      <div className="text-lg font-extrabold">{count}</div>
                      <span className={`badge badge-xs ${s.cls}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Section>

        <Section title="Текущие тарифы" Icon={CreditCard}>
          {!pricing ? (
            <div className="flex justify-center py-6"><span className="loading loading-spinner opacity-40" /></div>
          ) : (
            <>
              <Row label="Базовый (1 филиал)" value={`${fmt(pricing.baseFirstBranch)} ${cur}/мес`} />
              <Row label="Доп. филиал" value={`${fmt(pricing.perExtraBranch)} ${cur}/мес`} />
              <Row label="За ученика" value={`${fmt(pricing.perStudent)} ${cur}/мес`} />
              <div className="mt-4">
                <Link to="/main/billing" className="btn btn-sm btn-outline btn-primary gap-1.5 w-full">
                  <ExternalLink size={13} /> Редактировать тарифы
                </Link>
              </div>
            </>
          )}
        </Section>
      </div>

      <div className="card bg-base-100">
        <div className="card-body">
          <h2 className="card-title text-base mb-3">Быстрые ссылки</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <Link to="/main/leads" className="flex items-center gap-3 p-3 rounded-xl border border-base-300 hover:border-primary hover:text-primary transition-colors group">
              <GraduationCap size={20} className="text-base-content/40 group-hover:text-primary" />
              <div>
                <div className="font-semibold text-sm">Заявки</div>
                <div className="text-xs text-base-content/45">Новые учебные центры</div>
              </div>
            </Link>
            <Link to="/main/organizations" className="flex items-center gap-3 p-3 rounded-xl border border-base-300 hover:border-primary hover:text-primary transition-colors group">
              <Building2 size={20} className="text-base-content/40 group-hover:text-primary" />
              <div>
                <div className="font-semibold text-sm">Партнёры</div>
                <div className="text-xs text-base-content/45">Управление учебными центрами</div>
              </div>
            </Link>
            <Link to="/main/revenue" className="flex items-center gap-3 p-3 rounded-xl border border-base-300 hover:border-primary hover:text-primary transition-colors group">
              <Wallet size={20} className="text-base-content/40 group-hover:text-primary" />
              <div>
                <div className="font-semibold text-sm">Доход</div>
                <div className="text-xs text-base-content/45">Аналитика выручки</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
