import { useState } from 'react';
import { Tag, Users2, Layers, Archive, ArchiveRestore } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useSuperTrainingTypes, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import TrainingTypeIcon from '../../components/TrainingTypeIcon.jsx';
import { Panel } from './_ui.jsx';

/**
 * Методику заводит методист (frontend/staff/src/pages/methodist/TrainingTypes.jsx) —
 * только с названием, без цены. Здесь SEO один раз назначает ей цену абонемента
 * и лимит студентов в группе; ДО этого момента методика не появляется в форме
 * создания группы у admin/branch_manager (см. admin.repository.listPricedTrainingTypes —
 * фильтр price IS NOT NULL). Karis, 08.08.2026.
 */
export default function SuperTrainingTypes() {
  const { token } = useAuth();
  const { data, isLoading } = useSuperTrainingTypes();
  const invalidate = useInvalidate();
  const [editingId, setEditingId] = useState(null);
  const [price, setPrice] = useState('');
  const [maxStudents, setMaxStudents] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const types = data?.data?.trainingTypes || data?.trainingTypes || [];

  const startEdit = (tt) => {
    setEditingId(tt.id);
    setPrice(tt.price ?? '');
    setMaxStudents(tt.maxStudents ?? '');
    setErr('');
  };

  const save = async (id) => {
    if (!price || Number(price) < 0) { setErr('Укажите цену'); return; }
    setBusy(true); setErr('');
    try {
      await api.superSetTrainingTypePrice(token, id, Number(price), maxStudents ? Number(maxStudents) : undefined);
      invalidate('super-training-types');
      setEditingId(null);
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  // Архивная методика не выбираема при создании группы (admin.repository.listPricedTrainingTypes),
  // даже если ей уже назначена цена — это и вызывало путаницу «цену поставил, а в списке её нет».
  const toggleArchive = async (tt) => {
    setBusy(true); setErr('');
    try {
      await api.superSetTrainingTypeArchived(token, tt.id, !tt.isArchived);
      invalidate('super-training-types');
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  if (isLoading) return <SkeletonTable rows={4} cols={4} />;

  return (
    <div className="space-y-5">
      <PageHeader title="Методики" subtitle="Цену и лимит группы назначает только SEO — методист заводит только название" />

      {err && <div className="alert alert-error text-sm py-2">{err}</div>}

      <Panel title="Все методики" icon={Tag}>
        {types.length === 0 ? (
          <p className="text-sm text-base-content/45 text-center py-8">
            Пока ни один методист не создал методику.
          </p>
        ) : (
          <div className="space-y-2">
            {types.map((tt) => (
              <div key={tt.id} className="flex items-center gap-3 p-3 rounded-[12px] border border-base-300">
                <TrainingTypeIcon name={tt.name} icon={tt.icon} className="w-9 h-9 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[13px] text-base-content truncate">{tt.name}</span>
                    {tt.isArchived && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-base-300 text-base-content/60">
                        Архивирован
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-base-content/45 mt-0.5">
                    <span className="flex items-center gap-1"><Layers size={11} /> {tt.groupsCount} групп</span>
                    {tt.price == null && <span className="text-warning font-semibold">Цена не назначена</span>}
                    {tt.isArchived && tt.price != null && (
                      <span className="text-warning font-semibold">Не виден при создании группы — архивирован</span>
                    )}
                  </div>
                </div>

                {editingId === tt.id ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      className="input input-bordered input-sm w-32"
                      type="number" min="0" placeholder="Цена, сум"
                      value={price} onChange={(e) => setPrice(e.target.value)}
                    />
                    <input
                      className="input input-bordered input-sm w-28"
                      type="number" min="1" placeholder="Макс. студ."
                      value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)}
                    />
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)} disabled={busy}>Отмена</button>
                    <button className="btn btn-primary btn-sm" onClick={() => save(tt.id)} disabled={busy}>
                      {busy && <span className="loading loading-spinner loading-xs" />} Сохранить
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-[13px] font-extrabold text-base-content tabular-nums">
                        {tt.price != null ? `${Number(tt.price).toLocaleString('ru-RU')} сум` : '—'}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-[11px] text-base-content/45">
                        <Users2 size={11} /> {tt.maxStudents ?? '—'}
                      </div>
                    </div>
                    <button className="btn btn-outline btn-sm" onClick={() => startEdit(tt)}>
                      {tt.price != null ? 'Изменить' : 'Назначить цену'}
                    </button>
                    <button
                      className="btn btn-ghost btn-sm btn-square"
                      onClick={() => toggleArchive(tt)}
                      disabled={busy}
                      title={tt.isArchived ? 'Вернуть из архива' : 'Архивировать'}
                    >
                      {tt.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
