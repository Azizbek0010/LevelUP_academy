import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, AlertTriangle } from 'lucide-react';
import { fmt, money } from '../../format.js';
import { useSuperBranches } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { phoneDisplay } from '../../components/PhoneInput.jsx';
import BranchFormModal from './BranchFormModal.jsx';

/**
 * Список филиалов — витрина, а не пульт управления.
 *
 * Раньше на каждой карточке висели «изменить» и «в архив»: карточка вела
 * внутрь филиала, но два её угла вели куда-то ещё, и промахнуться было легко.
 * Управление одним филиалом переехало внутрь этого филиала — под шестерёнку
 * «Настройки». Здесь остались только сам список и создание нового.
 */

export default function SuperBranches() {
  const { data, isLoading, error, refetch } = useSuperBranches();
  const [q, setQ] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    document.title = 'Филиалы | LevelUp Academy';
  }, []);

  const branches = data?.branches || [];
  const rows = branches.filter(
    (b) =>
      b.name.toLowerCase().includes(q.toLowerCase()) ||
      (b.address || '').toLowerCase().includes(q.toLowerCase()),
  );

  /* Лидеры по деньгам. Считаем по всем филиалам, а не по отфильтрованным:
     ответ на вопрос «какой филиал больше зарабатывает» не должен меняться
     от того, что набрано в поиске. Архивные не участвуют — они не работают. */
  const active = branches.filter((b) => !b.isArchived);
  const topEarner = active.length
    ? active.reduce((a, b) => ((b.revenue || 0) > (a.revenue || 0) ? b : a))
    : null;
  const topSpender = active.length
    ? active.reduce((a, b) => ((b.expenses || 0) > (a.expenses || 0) ? b : a))
    : null;

  return (
    <div className="space-y-5">
      <PageHeader title="Филиалы" subtitle="Управление филиалами организации">
        <button className="btn btn-primary btn-sm gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus size={16} /> Новый филиал
        </button>
      </PageHeader>

      {error && error.status !== 401 ? (
        <div className="card bg-base-100 shadow-sm border border-error/20 max-w-lg mx-auto mt-6">
          <div className="card-body items-center text-center p-6 gap-3">
            <div className="p-3 bg-error/10 text-error rounded-full">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-bold text-lg">Ошибка загрузки филиалов</h3>
            <p className="text-sm text-base-content/60">{error.message || 'Произошла непредвиденная ошибка при запросе к серверу.'}</p>
            <div className="card-actions mt-2">
              <button className="btn btn-primary btn-sm px-6" onClick={() => refetch()}>
                Повторить попытку
              </button>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <input
              className="input input-bordered input-sm max-w-xs"
              placeholder="Поиск филиалов…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {topEarner && (topEarner.revenue > 0 || (topSpender && topSpender.expenses > 0)) && (
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs">
                {topEarner.revenue > 0 && (
                  <span className="text-base-content/60">
                    Больше всех зарабатывает:{' '}
                    <Link to={`/branches/${topEarner.id}`} className="font-bold text-success hover:underline">
                      {topEarner.name}
                    </Link>{' '}
                    <span className="tabular-nums">{money(topEarner.revenue)}</span>
                  </span>
                )}
                {topSpender && topSpender.expenses > 0 && (
                  <span className="text-base-content/60">
                    Больше всех тратит:{' '}
                    <Link to={`/branches/${topSpender.id}`} className="font-bold hover:underline">
                      {topSpender.name}
                    </Link>{' '}
                    <span className="tabular-nums">{money(topSpender.expenses)}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {rows.length === 0 ? (
            <div className="card bg-base-100 shadow-sm border border-dashed border-base-300">
              <div className="card-body text-center py-16 space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-base-200 flex items-center justify-center text-base-content/40">
                  <Building2 size={32} />
                </div>
                <div className="max-w-sm mx-auto">
                  <h3 className="text-lg font-bold">Нет филиалов</h3>
                  <p className="text-sm text-base-content/50 mt-1">
                    {q ? 'По вашему запросу ничего не найдено. Попробуйте изменить поисковый запрос.' : 'Филиалов пока нет. Создайте первый филиал, чтобы начать работу.'}
                  </p>
                </div>
                {!q && (
                  <button className="btn btn-primary btn-sm mx-auto gap-1.5" onClick={() => setCreateOpen(true)}>
                    <Plus size={16} /> Создать первый филиал
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Карточка целиком — ссылка внутрь филиала. Ни одной кнопки:
                  всё, что можно сделать с филиалом, делается внутри него. */}
              {rows.map((b) => (
                <Link
                  key={b.id}
                  to={`/branches/${b.id}`}
                  className={`card bg-base-100 border border-base-200 hover:border-base-300 transition-colors ${b.isArchived ? 'opacity-60' : ''}`}
                >
                  <div className="card-body p-4 gap-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold truncate">{b.name}</span>
                      <span className="text-xs text-base-content/45 shrink-0">
                        {b.isArchived ? 'в архиве' : b.isMain ? 'главный' : ''}
                      </span>
                    </div>

                    <div className="text-xs text-base-content/50 space-y-0.5">
                      <div className="truncate">{b.address || 'адрес не указан'}</div>
                      <div>{b.phone ? phoneDisplay(b.phone) : 'телефон не указан'}</div>
                    </div>

                    <dl className="grid grid-cols-3 gap-y-2 text-sm">
                      <div>
                        <dt className="text-xs text-base-content/45">Ученики</dt>
                        <dd className="font-semibold tabular-nums">{fmt(b.students)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-base-content/45">Группы</dt>
                        <dd className="font-semibold tabular-nums">{fmt(b.groups)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-base-content/45">Сотрудники</dt>
                        <dd className="font-semibold tabular-nums">
                          {fmt((b.admins || 0) + (b.mentors || 0))}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs text-base-content/45">Доход</dt>
                        <dd className="font-semibold tabular-nums">{money(b.revenue)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-base-content/45">Расход</dt>
                        <dd className="font-semibold tabular-nums">{money(b.expenses)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-base-content/45">Долг</dt>
                        <dd className={`font-semibold tabular-nums ${b.debt > 0 ? 'text-error' : ''}`}>
                          {money(b.debt)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <BranchFormModal
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
