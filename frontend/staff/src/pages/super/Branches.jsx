import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Building2, MapPin, Phone, AlertTriangle } from 'lucide-react';
import { fmt, money } from '../../format.js';
import { useSuperBranches, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import YMapPicker from '../../components/YMapPicker.jsx';
import PhoneInput from '../../components/PhoneInput.jsx';

/**
 * Координаты храним с шестью знаками после запятой — столько же в базе
 * (NUMERIC(9,6)), это примерно 11 сантиметров на местности.
 *
 * Округлять обязательно: клик по карте отдаёт полную точность вроде
 * 41.366643253779706, и браузер отказывался принимать такое значение в поле
 * с шагом 0.000001 — «введите допустимое значение». То есть после клика по
 * карте форму нельзя было сохранить вообще.
 */
const round6 = (n) => (n == null || Number.isNaN(Number(n)) ? null : Math.round(Number(n) * 1e6) / 1e6);

const branchSchema = z.object({
  name:      z.string().trim().min(1, 'Название обязательно').max(80, 'Макс. 80 символов'),
  address:   z.string().trim().max(160, 'Макс. 160 символов').or(z.literal('')),
  phone:     z.string().trim()
    .refine(
      (val) => val === '' || /^\+998\d{9}$/.test(val),
      'Формат телефона должен быть: +998XXXXXXXXX (9 цифр)'
    )
    .or(z.literal('')),
  roomCount: z.coerce.number().int().min(0, 'Не может быть отрицательным').max(999).optional(),
});

export default function SuperBranches() {
  const { data, isLoading, error, refetch } = useSuperBranches();
  const { token } = useAuth();
  const invalidate = useInvalidate();
  const [q, setQ] = useState('');
  const [err, setErr] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [currentId, setCurrentId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [location, setLocation] = useState(null);
  /* Карта считается доступной, только если она реально поднялась.
     Одного ключа мало: он может быть не настроен по HTTP referer, а сервис —
     отвечать 503. Тогда точку поставить нечем, и требовать её означало бы
     запретить создание филиалов совсем. */
  const [mapBroken, setMapBroken] = useState(!import.meta.env.VITE_YANDEX_KEY);
  const mapAvailable = !mapBroken;

  // Стейты подтверждения архивации
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState(null); // { id, name, isArchived }

  // Установка динамического заголовка вкладки
  useEffect(() => {
    document.title = 'Филиалы | LevelUp Academy';
  }, []);

  // Слушатель Esc для быстрого закрытия модалок
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
        setConfirmOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: '', address: '', phone: '', roomCount: '' },
  });

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

  const openCreate = () => {
    setModalMode('create');
    setErr('');
    setLocation(null);
    reset({ name: '', address: '', phone: '', roomCount: '' });
    setModalOpen(true);
  };

  const openEdit = (branch) => {
    setModalMode('edit');
    setCurrentId(branch.id);
    setErr('');
    setLocation(
      branch.lat && branch.lng
        ? { lat: Number(branch.lat), lng: Number(branch.lng) }
        : null,
    );
    reset({ name: branch.name, address: branch.address || '', phone: branch.phone || '', roomCount: branch.roomCount ?? '' });
    setModalOpen(true);
  };

  const onFormSubmit = async (formData) => {
    setErr('');

    /* Точка на карте обязательна при создании — по ней потом строятся маршруты
       для родителей и разбор «в каком филиале что происходит». При правке
       старого филиала не требуем: он мог быть заведён до появления карты.
       Если ключ Яндекса не подключён, карта показать себя не может — тогда
       требовать координаты бессмысленно, и филиал создаётся без них. */
    const hasPoint = location?.lat != null && location?.lng != null;
    const halfPoint = !hasPoint && (location?.lat != null || location?.lng != null);

    // одна координата без второй — почти всегда недописанный ввод, а не намерение
    if (halfPoint) {
      setErr('Укажите обе координаты: широту и долготу');
      return;
    }
    if (modalMode === 'create' && mapAvailable && !hasPoint) {
      setErr('Отметьте филиал на карте — без точки его не найдут ни родители, ни курьер');
      return;
    }

    setBusy(true);
    try {
      const body = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        phone: formData.phone.trim(),
        ...(formData.roomCount !== '' && formData.roomCount != null ? { roomCount: Number(formData.roomCount) } : {}),
        /* При создании координаты шлём только когда они есть. При правке шлём
           всегда: null — это осознанное «снять точку», и без него отметку
           можно было поставить и подвинуть, но не убрать. */
        ...(hasPoint
          ? { lat: location.lat, lng: location.lng }
          : modalMode === 'edit'
            ? { lat: null, lng: null }
            : {}),
      };
      if (modalMode === 'create') {
        await api.superCreateBranch(token, body);
      } else {
        await api.superUpdateBranch(token, currentId, body);
      }
      invalidate('super-branches', 'super-dashboard');
      setModalOpen(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  const handleArchiveClick = (id, name, isArchived) => {
    setArchiveTarget({ id, name, isArchived });
    setConfirmOpen(true);
  };

  const confirmArchive = async () => {
    if (!archiveTarget) return;
    setErr('');
    setBusy(true);
    try {
      if (archiveTarget.isArchived) {
        await api.superUnarchiveBranch(token, archiveTarget.id);
      } else {
        await api.superArchiveBranch(token, archiveTarget.id);
      }
      invalidate('super-branches', 'super-dashboard');
      setConfirmOpen(false);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
      setArchiveTarget(null);
    }
  };

  const showErr = err || (error && error.status !== 401 ? error.message : '');

  return (
    <div className="space-y-5">
      <PageHeader title="Филиалы" subtitle="Управление филиалами организации">
        <button className="btn btn-primary btn-sm gap-1.5" onClick={openCreate}>
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
      ) : (
        <>
          {err && <div className="alert alert-error text-sm"><span>{err}</span></div>}

          {isLoading ? (
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
                      <button className="btn btn-primary btn-sm mx-auto gap-1.5" onClick={openCreate}>
                        <Plus size={16} /> Создать первый филиал
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {/* Было: иконка в круге, градиентный бейдж «ГЛАВНЫЙ», полоска
                      снизу с пульсацией и показатели в отдельной серой плашке —
                      карточка внутри карточки, шесть подписей капсом. Слишком
                      много украшений на четыре факта. Осталось: имя, состояние
                      словом, контакты строкой и числа; наведение подсвечивает
                      рамку, без подпрыгиваний и теней-ореолов. */}
                  {rows.map((b) => (
                    <div
                      key={b.id}
                      className={`card bg-base-100 border border-base-200 hover:border-base-300 transition-colors ${b.isArchived ? 'opacity-60' : ''}`}
                    >
                      <div className="card-body p-4 gap-3">
                        <div className="flex items-baseline justify-between gap-3">
                          <Link
                            to={`/branches/${b.id}`}
                            className="font-semibold hover:underline truncate"
                          >
                            {b.name}
                          </Link>
                          <span className="text-xs text-base-content/45 shrink-0">
                            {b.isArchived ? 'в архиве' : b.isMain ? 'главный' : ''}
                          </span>
                        </div>

                        <div className="text-xs text-base-content/50 space-y-0.5">
                          <div className="truncate">{b.address || 'адрес не указан'}</div>
                          <div>{b.phone || 'телефон не указан'}</div>
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

                        <div className="flex gap-4 text-xs text-base-content/45 pt-1">
                          {!b.isArchived && (
                            <button className="hover:text-base-content" onClick={() => openEdit(b)}>
                              изменить
                            </button>
                          )}
                          <button
                            className="hover:text-error"
                            onClick={() => handleArchiveClick(b.id, b.name, b.isArchived)}
                          >
                            {b.isArchived ? 'вернуть' : 'в архив'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="modal modal-open">
          {/* Две колонки: слева поля, справа карта.
              В одну колонку карта уезжала за нижний край и форму приходилось
              прокручивать, чтобы добраться до телефона и кнопок. Поля мелкого
              размера — как в остальной панели; раньше здесь стояли крупные,
              и модалка выбивалась из общего вида. */}
          <div className="modal-box max-w-3xl rounded-2xl border border-base-200">
            <h3 className="font-bold text-base">
              {modalMode === 'create' ? 'Новый филиал' : 'Филиал'}
            </h3>
            {err && <div className="alert alert-error text-sm py-2 mt-3"><span>{err}</span></div>}
            <form onSubmit={handleSubmit(onFormSubmit)} className="mt-4">
              <div className="grid md:grid-cols-2 gap-x-5 gap-y-3">
                <div className="space-y-3">
                  <label className="form-control w-full">
                    <span className="text-xs text-base-content/60 mb-1">Название *</span>
                    <input
                      {...register('name')}
                      autoFocus
                      placeholder="Чиланзар"
                      className={`input input-bordered input-sm w-full rounded-lg text-base sm:text-sm ${errors.name ? 'input-error' : ''}`}
                    />
                    {errors.name && <span className="text-xs text-error mt-1">{errors.name.message}</span>}
                  </label>

                  <label className="form-control w-full">
                    <span className="text-xs text-base-content/60 mb-1">Адрес</span>
                    <input
                      {...register('address')}
                      placeholder="Улица, дом, ориентир"
                      className={`input input-bordered input-sm w-full rounded-lg text-base sm:text-sm ${errors.address ? 'input-error' : ''}`}
                    />
                    {errors.address && <span className="text-xs text-error mt-1">{errors.address.message}</span>}
                  </label>

                  <label className="form-control w-full">
                    <span className="text-xs text-base-content/60 mb-1">Телефон</span>
                    <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                        <PhoneInput
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className={`input input-bordered input-sm w-full rounded-lg text-base sm:text-sm ${errors.phone ? 'input-error' : ''}`}
                        />
                      )}
                    />
                    {errors.phone && <span className="text-xs text-error mt-1">{errors.phone.message}</span>}
                  </label>

                  <label className="form-control w-full">
                    <span className="text-xs text-base-content/60 mb-1">Комнат</span>
                    <input
                      type="number"
                      min="0"
                      max="999"
                      {...register('roomCount')}
                      placeholder="8"
                      className={`input input-bordered input-sm w-full rounded-lg text-base sm:text-sm ${errors.roomCount ? 'input-error' : ''}`}
                    />
                    {errors.roomCount && <span className="text-xs text-error mt-1">{errors.roomCount.message}</span>}
                  </label>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs text-base-content/60">
                      На карте{mapAvailable && modalMode === 'create' && ' *'}
                    </span>
                    {location ? (
                      <button
                        type="button"
                        className="text-xs text-base-content/45 hover:text-error"
                        onClick={() => setLocation(null)}
                      >
                        сбросить
                      </button>
                    ) : (
                      /* Подсказка строкой у заголовка, а не плашкой поверх карты:
                         плашка закрывала часть карты и спорила с её же контролами. */
                      <span className="text-xs text-base-content/40">кликните по карте</span>
                    )}
                  </div>

                  <YMapPicker
                    value={location}
                    onChange={(p) => setLocation(p ? { lat: round6(p.lat), lng: round6(p.lng) } : null)}
                    height={232}
                    onUnavailable={setMapBroken}
                  />

                  {/* Координаты полями — на случай, когда карта недоступна
                      (нет ключа, ограничения не применились), и чтобы вставить
                      готовую пару, скопированную из Яндекс Карт. */}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="any"
                      min="-90"
                      max="90"
                      aria-label="Широта"
                      className="input input-bordered input-sm rounded-lg text-base sm:text-sm"
                      placeholder="широта"
                      value={location?.lat ?? ''}
                      onChange={(e) => {
                        const lat = e.target.value === '' ? null : round6(e.target.value);
                        setLocation(lat === null && location?.lng == null
                          ? null
                          : { lat, lng: location?.lng ?? null });
                      }}
                    />
                    <input
                      type="number"
                      step="any"
                      min="-180"
                      max="180"
                      aria-label="Долгота"
                      className="input input-bordered input-sm rounded-lg text-base sm:text-sm"
                      placeholder="долгота"
                      value={location?.lng ?? ''}
                      onChange={(e) => {
                        const lng = e.target.value === '' ? null : round6(e.target.value);
                        setLocation(lng === null && location?.lat == null
                          ? null
                          : { lat: location?.lat ?? null, lng });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost btn-sm rounded-xl" onClick={() => setModalOpen(false)} disabled={busy}>
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary btn-sm rounded-xl shadow-sm shadow-primary/10" disabled={busy}>
                  {busy && <span className="loading loading-spinner loading-sm" />}
                  {modalMode === 'create' ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setModalOpen(false)} />
        </div>
      )}

      {/* Confirm Archive Modal */}
      {confirmOpen && archiveTarget && (
        <div className="modal modal-open">
          <div className="modal-box max-w-sm rounded-2xl border border-base-200 shadow-xl">
            <div className="flex items-center gap-3 text-warning">
              <AlertTriangle size={24} className="shrink-0" />
              <h3 className="font-bold text-lg">
                {archiveTarget.isArchived ? 'Активировать?' : 'Архивировать?'}
              </h3>
            </div>
            <p className="text-sm text-base-content/60 mt-3">
              {archiveTarget.isArchived
                ? `Вы действительно хотите вернуть филиал «${archiveTarget.name}» в список активных?`
                : `Вы действительно хотите архивировать филиал «${archiveTarget.name}»? Это временно скроет его из активного списка.`}
            </p>
            <div className="modal-action gap-2">
              <button
                type="button"
                className="btn btn-ghost btn-sm rounded-xl"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
              >
                Отмена
              </button>
              <button
                type="button"
                className={`btn btn-sm rounded-xl ${archiveTarget.isArchived ? 'btn-primary' : 'btn-error text-error-content'}`}
                onClick={confirmArchive}
                disabled={busy}
              >
                {busy && <span className="loading loading-spinner loading-sm" />}
                Да, продолжить
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setConfirmOpen(false)} />
        </div>
      )}
    </div>
  );
}
