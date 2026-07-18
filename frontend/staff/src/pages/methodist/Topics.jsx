import { useState, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Layers, FileQuestion, ArrowLeft, Trash2, ArrowRight, Info } from 'lucide-react';
import { useTopics, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const schema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(200),
  description: z.string().trim().max(2000).optional(),
});

function DescriptionPopover({ description, children }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const timeoutRef = useRef(null);

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({
          top: rect.top - 8,
          left: Math.min(rect.left, window.innerWidth - 320),
        });
      }
      setShow(true);
    }, 400);
  };

  const handleLeave = () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setShow(false), 200);
  };

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  if (!description) return children;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className="relative"
      >
        {children}
      </div>
      {show && (
        <div
          className="fixed z-[65] animate-scale-in"
          style={{ top: pos.top, left: pos.left, transform: 'translateY(-100%)' }}
          onMouseEnter={() => clearTimeout(timeoutRef.current)}
          onMouseLeave={handleLeave}
        >
          <div className="glass-strong rounded-[14px] p-4 max-w-[300px] shadow-[0_16px_48px_rgba(29,36,23,0.15)] border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-[var(--green-dark,#a8e02c)] shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--text-muted)]">Описание</span>
            </div>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{description}</p>
            <div className="absolute bottom-0 left-6 w-3 h-3 bg-white border-r border-b border-[var(--border)] transform rotate-45 translate-y-1/2" />
          </div>
        </div>
      )}
    </>
  );
}

export default function Topics() {
  const { trainingTypeId } = useParams();
  const { token } = useAuth();
  const { data, isLoading } = useTopics(trainingTypeId);
  const invalidate = useInvalidate();
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  const topics = data?.data || [];

  const openCreate = () => {
    reset({ name: '', description: '' });
    setErr('');
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    setErr(''); setBusy(true);
    try {
      await api.methodistCreateTopic(token, { trainingTypeId, ...formData });
      invalidate('topics', trainingTypeId);
      setModalOpen(false);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const doArchive = async (id) => {
    setErr('');
    try {
      await api.methodistArchiveTopic(token, id);
      invalidate('topics', trainingTypeId);
      setConfirmArchive(null);
    } catch (e) {
      setErr(e.message);
    }
  };

  if (isLoading) return <SkeletonTable rows={4} cols={3} />;

  return (
    <div className="space-y-5">
      <div className="animate-fade-in">
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] mb-3">
          <Link to="/methodist/types" className="hover:text-[var(--green-dark,#a8e02c)] transition-colors font-medium">
            Типы обучения
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-[var(--text-secondary)] font-semibold">Темы</span>
        </div>
        <PageHeader title="Темы" subtitle="Уроки и тесты внутри направления">
          <Link
            to="/methodist/types"
            className="w-10 h-10 rounded-[10px] bg-[var(--surface-hover)] grid place-items-center hover:bg-base-300 transition-colors"
          >
            <ArrowLeft size={18} className="text-[var(--text-secondary)]" />
          </Link>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--green)] text-[#141B10] text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(198,255,52,0.25)]"
            onClick={openCreate}
          >
            <Plus size={16} strokeWidth={2.5} /> Добавить тему
          </button>
        </PageHeader>
      </div>

      {err && (
        <div className="flex items-center gap-3 p-4 rounded-[14px] bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.15)] animate-slide-up">
          <div className="w-8 h-8 rounded-[8px] bg-[rgba(239,68,68,0.1)] grid place-items-center shrink-0">
            <span className="text-error text-sm font-bold">!</span>
          </div>
          <span className="text-[13px] text-error flex-1">{err}</span>
        </div>
      )}

      {topics.length === 0 ? (
        <div className="glass-strong rounded-[20px] animate-scale-in">
          <div className="card-body items-center py-16">
            <div className="w-20 h-20 rounded-[20px] bg-[rgba(59,130,246,0.08)] grid place-items-center mb-5 glow-ring">
              <Layers size={32} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[15px] font-bold text-[var(--text)] mb-1">Нет тем</p>
            <p className="text-[13px] text-[var(--text-muted)] mb-5">Создайте первую тему в этом направлении</p>
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[var(--green)] text-[#141B10] text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(198,255,52,0.25)]"
              onClick={openCreate}
            >
              <Plus size={16} strokeWidth={2.5} /> Создать тему
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((tp, i) => (
            <div
              key={tp.id}
              className={`glass-strong rounded-[20px] p-5 card-hover-premium group animate-slide-up stagger-${Math.min(i + 1, 6)}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-11 h-11 rounded-[12px] bg-[rgba(59,130,246,0.08)] grid place-items-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                    <Layers size={18} className="text-info" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/methodist/topics/${tp.id}/lessons`}
                      className="text-[14px] font-bold text-[var(--text)] hover:text-[var(--green-dark,#a8e02c)] transition-colors block truncate"
                    >
                      {tp.name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-0.5">
                      <FileQuestion size={11} />
                      <span className="font-medium">{tp.lessons_count || 0} уроков</span>
                      {tp.description && (
                        <>
                          <span className="text-[var(--text-muted)] opacity-50">·</span>
                          <span className="text-[var(--text-muted)] opacity-70 flex items-center gap-1">
                            <Info size={10} /> описание
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="w-8 h-8 rounded-[8px] grid place-items-center opacity-0 group-hover:opacity-100 hover:bg-[rgba(239,68,68,0.08)] transition-all duration-200 shrink-0"
                  onClick={() => setConfirmArchive({ id: tp.id, name: tp.name })}
                  title="Архивировать"
                >
                  <Trash2 size={14} className="text-error" />
                </button>
              </div>
              <DescriptionPopover description={tp.description}>
                <Link
                  to={`/methodist/topics/${tp.id}/lessons`}
                  className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--surface-hover)] hover:bg-[rgba(198,255,52,0.08)] transition-all text-[12px] font-semibold text-[var(--text-secondary)] hover:text-[var(--green-dark,#a8e02c)] group/link"
                >
                  <span>Уроки и тесты</span>
                  <ArrowRight size={14} className="group-hover/link:translate-x-0.5 transition-transform shrink-0" />
                </Link>
              </DescriptionPopover>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Archive Modal */}
      {confirmArchive && (
        <dialog className="modal modal-open">
          <div className="modal-backdrop" onClick={() => setConfirmArchive(null)} />
          <div className="modal-box max-w-sm rounded-[20px] border border-[rgba(239,68,68,0.15)] modal-enter p-0 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(239,68,68,0.1)] grid place-items-center shrink-0">
                  <Trash2 size={18} className="text-error" />
                </div>
                <div>
                  <h3 className="font-bold text-[15px] text-[var(--text)]">Архивировать тему?</h3>
                  <p className="text-[12px] text-[var(--text-muted)]">«{confirmArchive.name}» будет скрыта</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 h-10 rounded-[10px] bg-[var(--surface-hover)] text-[var(--text-secondary)] text-[13px] font-semibold hover:bg-base-300 transition-colors"
                  onClick={() => setConfirmArchive(null)}
                >
                  Отмена
                </button>
                <button
                  className="flex-1 h-10 rounded-[10px] bg-[rgba(239,68,68,0.1)] text-error text-[13px] font-bold hover:bg-[rgba(239,68,68,0.15)] transition-colors"
                  onClick={() => doArchive(confirmArchive.id)}
                >
                  Архивировать
                </button>
              </div>
            </div>
          </div>
        </dialog>
      )}

      {modalOpen && (
        <dialog className="modal modal-open">
          <div className="modal-backdrop" onClick={() => setModalOpen(false)} />
          <div className="modal-box max-w-md rounded-[20px] border border-[var(--border)] modal-enter p-0 overflow-hidden">
            <div className="p-6 pb-0">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(59,130,246,0.1)] grid place-items-center">
                  <Layers size={18} className="text-info" />
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-[var(--text)]">Новая тема</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Добавьте тему в направление</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
              <label className="form-control w-full">
                <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Название *</span>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Например: React Hooks"
                  className={`input input-bordered w-full rounded-[10px] h-11 text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && <span className="text-[11px] text-error mt-1">{errors.name.message}</span>}
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Описание</span>
                <textarea
                  {...register('description')}
                  placeholder="О чём эта тема..."
                  className="textarea textarea-bordered w-full rounded-[10px] text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors"
                  rows={2}
                />
              </label>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="flex-1 h-11 rounded-[10px] bg-[var(--surface-hover)] text-[var(--text-secondary)] text-[13px] font-semibold hover:bg-base-300 transition-colors"
                  onClick={() => setModalOpen(false)}
                  disabled={busy}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 rounded-[10px] bg-[var(--green)] text-[#141B10] text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(198,255,52,0.25)] flex items-center justify-center gap-2"
                  disabled={busy}
                >
                  {busy && <span className="loading loading-spinner loading-xs" />} Создать
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
