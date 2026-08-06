import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, Shield, CreditCard, Building2, GraduationCap, Wallet,
  Info, ExternalLink, GitBranch, TrendingUp,
  Activity, Settings2, Pencil, LogOut, Megaphone, Check,
} from 'lucide-react';
import { useDashboard, usePricing } from '../queries.js';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { fmt, ORG_STATUS } from '../format.js';
import { tierRange, tierPriceLabel } from '../lib/pricing.js';
import PageHeader from '../components/PageHeader.jsx';
import Avatar from '../components/Avatar.jsx';

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center border-b border-base-200 py-2.5 text-sm last:border-0">
      <span className="text-base-content/55">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}

export default function Settings() {
  const { user, token, logout, patchUser } = useAuth();
  const { data } = useDashboard();
  const { data: pricing } = usePricing();

  const t = data?.totals;
  const cur = t?.currency || pricing?.currency || 'UZS';
  const partners = data?.partners || [];
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'MA';

  const statusStats = partners.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  // ---- Profile edit state ----
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '' });
  const [editBusy, setEditBusy] = useState(false);
  const [editSuccess, setEditSuccess] = useState(false);
  const [editError, setEditError] = useState('');

  const openEdit = () => {
    setEditForm({ firstName: user?.firstName || '', lastName: user?.lastName || '' });
    setEditError('');
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditError('');
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setEditBusy(true);
    setEditError('');
    try {
      const { profile } = await api.updateProfile(token, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
      });
      // Кладём ответ сервера в контекст, а не то, что напечатали в форме:
      // сервер тримит и нормализует поля, и шапка должна показывать сохранённое.
      patchUser({ firstName: profile.firstName, lastName: profile.lastName });
      setEditSuccess(true);
      setEditMode(false);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err) {
      // Раньше здесь 404/500 подменялись «успехом»: эндпоинта PATCH /main/profile
      // не существовало, и пользователь видел «сохранено», хотя не сохранялось ничего.
      // Эндпоинт написан — глушить ошибки больше нельзя, иначе поломка снова станет невидимой.
      setEditError(
        err?.status === 409
          ? 'Такой email или телефон уже заняты'
          : err?.message || 'Не удалось сохранить',
      );
    } finally {
      setEditBusy(false);
    }
  };

  const doLogout = async () => {
    if (!window.confirm('Выйти из аккаунта?')) return;
    try {
      await logout();
    } catch {
      /* ignore */
    }
  };

  // ---- Revenue block calculations ----
  const activePartnersCount = partners.filter((p) => p.status === 'active').length;
  const avgBillFromIncome = partners.length > 0
    ? Math.round((t?.ourMonthlyIncome || 0) / partners.length)
    : 0;
  const activePartnersShare = partners.length > 0
    ? ((activePartnersCount / partners.length) * 100).toFixed(0)
    : '0';
  const topPartners = [...partners]
    .sort((a, b) => (b.monthlyBill || 0) - (a.monthlyBill || 0))
    .slice(0, 3);

  return (
    <div className="space-y-5">
      <PageHeader
        title={<span className="flex items-center gap-2"><Settings2 size={22} /> Настройки</span>}
        subtitle="Профиль Main Admin и конфигурация платформы"
      />

      {editSuccess && (
        <div className="alert alert-success text-sm">
          <Check size={16} />
          <span>Профиль обновлён</span>
        </div>
      )}

      {/* Admin profile hero */}
      <div className="card bg-base-100 border border-base-200/60 shadow-sm overflow-hidden">
        <div className="h-1.5 bg-primary" />
        <div className="card-body flex-row flex-wrap items-center gap-5 py-5">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-content font-extrabold text-2xl grid place-items-center shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-extrabold">{user?.firstName} {user?.lastName}</div>
            <div className="text-sm text-base-content/55 mt-0.5">{user?.email}</div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="badge badge-sm bg-primary/10 text-primary-content border-primary/30 gap-1">
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
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <User size={15} className="text-primary-content" />
                <h2 className="card-title text-base">Данные профиля</h2>
              </div>
              {!editMode && (
                <button
                  className="btn btn-sm btn-outline gap-1"
                  onClick={openEdit}
                >
                  <Pencil size={13} /> Изменить
                </button>
              )}
            </div>

            {editMode ? (
              <form onSubmit={saveProfile} className="space-y-3">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs">Имя</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm focus:border-primary focus:outline-primary/40"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
                    placeholder="Имя"
                    autoFocus
                  />
                </div>
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text text-xs">Фамилия</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered input-sm focus:border-primary focus:outline-primary/40"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
                    placeholder="Фамилия"
                  />
                </div>
                <Row label="Email" value={user?.email || '—'} />
                <Row label="Роль" value="Main Admin" />

                {editError && (
                  <div className="alert alert-error text-xs py-2">
                    <span>{editError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={cancelEdit}
                    disabled={editBusy}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm gap-1"
                    disabled={editBusy}
                  >
                    {editBusy
                      ? <span className="loading loading-spinner loading-xs" />
                      : <><Check size={13} /> Сохранить</>
                    }
                  </button>
                </div>
              </form>
            ) : (
              <>
                <Row label="Имя" value={user?.firstName || '—'} />
                <Row label="Фамилия" value={user?.lastName || '—'} />
                <Row label="Email" value={user?.email || '—'} />
                <Row label="Роль" value="Main Admin" />
                <Row label="Уровень доступа" value="Полный" />
                <div className="pt-4 mt-2 border-t border-base-200">
                  <button
                    onClick={doLogout}
                    className="btn btn-outline btn-error btn-sm gap-1 w-full"
                  >
                    <LogOut size={13} /> Выйти из аккаунта
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Platform info */}
        <div className="card bg-base-100 border border-base-200/60 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <Info size={15} className="text-primary-content" />
              <h2 className="card-title text-base">Платформа</h2>
            </div>
            <Row label="Название" value="LevelUp Academy" />
            <Row label="Версия" value={<span className="badge badge-sm badge-outline">v1.0</span>} />
            <Row label="Среда" value={<span className="badge badge-sm badge-success badge-outline">Production</span>} />
            <Row label="Валюта" value={cur} />
            <Row label="Часовой пояс" value="UTC+5 (Ташкент)" />
            {t && (
              <>
                <Row label="Партнёров" value={fmt(t.partners)} />
                <Row label="Учеников" value={fmt(t.students)} />
              </>
            )}
          </div>
        </div>

        {/* Platform stats */}
        <div className="card bg-base-100 border border-base-200/60 shadow-sm">
          <div className="card-body">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={15} className="text-primary-content" />
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
                  value={<span className="text-primary-content font-bold">{fmt(t.ourMonthlyIncome)} {cur}</span>}
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
              <CreditCard size={15} className="text-primary-content" />
              <h2 className="card-title text-base">Текущие тарифы</h2>
            </div>
            {!pricing ? (
              <div className="flex justify-center py-6"><span className="loading loading-spinner opacity-40" /></div>
            ) : (
              <>
                {/* Бакеты по числу активных учеников. Раньше здесь стояли
                    база за филиал / доп. филиал / за ученика — полей с такими
                    именами бэкенд не отдаёт, поэтому все три были пустыми. */}
                <div className="space-y-2.5 mb-4">
                  {(pricing.tiers ?? []).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-base-200/40 rounded-xl text-sm">
                      <span className="flex items-center gap-2 text-base-content/60">
                        <GraduationCap size={13} className="text-green-500" /> {t.label}
                        <span className="text-base-content/40">· {tierRange(t)} уч.</span>
                      </span>
                      <span className="font-bold">{tierPriceLabel(t, cur)}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 px-3 text-xs text-base-content/45">
                    <GitBranch size={12} className="text-purple-500" /> Филиалы входят в тариф без доплаты
                  </div>
                </div>
                {/* Тарифы зашиты в backend/src/config/plans.js, правка через БД — v2,
                    поэтому ссылка ведёт на просмотр, а не на редактирование. */}
                <Link to="/billing" className="btn btn-sm btn-outline gap-1.5 w-full">
                  <ExternalLink size={13} /> Открыть тарифы
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Revenue detail block (full width) */}
      <div className="card bg-base-100 border border-base-200/60 shadow-sm">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-primary-content" />
              <h2 className="card-title text-base">Доход платформы — детали</h2>
            </div>
            <Link to="/revenue" className="btn btn-xs btn-outline gap-1">
              <ExternalLink size={11} /> Подробнее
            </Link>
          </div>

          {/* 3 KPI pills */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold text-primary-content">{fmt(t?.ourMonthlyIncome || 0)}</div>
              <div className="text-xs text-primary-content font-semibold mt-0.5">{cur}/мес (этот месяц)</div>
            </div>
            <div className="bg-base-200/40 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold">{fmt(avgBillFromIncome)}</div>
              <div className="text-xs text-base-content/50 mt-0.5">Средний счёт ({cur})</div>
            </div>
            <div className="bg-base-200/40 rounded-xl p-3 text-center">
              <div className="text-2xl font-extrabold">{activePartnersShare}%</div>
              <div className="text-xs text-base-content/50 mt-0.5">Активных партнёров</div>
            </div>
          </div>

          {/* Top-3 partners */}
          {topPartners.length > 0 ? (
            <>
              <div className="text-xs text-base-content/45 mb-2 font-semibold uppercase tracking-wider">
                Топ партнёры
              </div>
              <div className="space-y-2">
                {topPartners.map((p, i) => {
                  const share = (t?.ourMonthlyIncome || 0) > 0
                    ? ((p.monthlyBill / t.ourMonthlyIncome) * 100).toFixed(1)
                    : '0';
                  return (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="text-xs text-base-content/40 w-4">#{i + 1}</span>
                      <Avatar name={p.name} size={24} />
                      <span className="text-sm font-medium flex-1 truncate">{p.name}</span>
                      <div className="w-24 h-1.5 bg-base-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.min(100, parseFloat(share))}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-primary-content w-20 text-right tabular-nums">
                        {fmt(p.monthlyBill)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-sm text-base-content/40">
              Пока нет партнёров для отображения
            </div>
          )}
        </div>
      </div>

      {/* Разделы, которых нет в меню.
          Сайдбар сокращён до ежедневной работы (дашборд, партнёры, заявки),
          а редкие экраны собраны здесь. Шесть разных пастельных заливок убраны:
          цвет не нёс смысла — «Доход» был зелёным, а «Анонсы» бирюзовыми просто
          по очереди в списке. Ссылка на «Штрафы» удалена вместе со страницей:
          дисциплина сотрудников — зона Super Admin. */}
      <div className="card bg-base-100 border border-base-200/60 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-base mb-4">Ещё разделы</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { to: '/revenue', Icon: TrendingUp, title: 'Доход', desc: 'Наш счёт партнёрам' },
              { to: '/billing', Icon: Wallet, title: 'Тарифы', desc: 'Бакеты по числу учеников' },
              { to: '/announcements', Icon: Megaphone, title: 'Анонсы', desc: 'Сообщения партнёрам' },
            ].map(({ to, Icon, title, desc }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-4 rounded-xl border border-base-200/60 bg-base-100
                           hover:border-primary/40 transition-colors"
              >
                <span className="w-9 h-9 rounded-lg bg-primary/10 text-primary grid place-items-center shrink-0">
                  <Icon size={17} />
                </span>
                <div>
                  <div className="font-semibold text-sm">{title}</div>
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
