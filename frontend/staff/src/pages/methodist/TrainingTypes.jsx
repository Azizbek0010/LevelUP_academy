import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, BookOpen, Layers, Trash2, ArrowRight, Info } from 'lucide-react';
import { useTrainingTypes, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const schema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(160),
  description: z.string().trim().max(1000).optional(),
  icon: z.string().trim().max(60).optional(),
});

const TYPE_COLORS = [
  { bg: 'rgba(34,197,94,0.10)', fg: '#16a34a' },
  { bg: 'rgba(59,130,246,0.10)', fg: '#2563eb' },
  { bg: 'rgba(245,158,11,0.10)', fg: '#d97706' },
  { bg: 'rgba(168,85,247,0.10)', fg: '#9333ea' },
  { bg: 'rgba(236,72,153,0.10)', fg: '#db2777' },
  { bg: 'rgba(20,184,166,0.10)', fg: '#0d9488' },
];

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

export default function TrainingTypes() {
  const { token } = useAuth();
  const { data, isLoading } = useTrainingTypes();
  const invalidate = useInvalidate();
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', icon: '📚' },
  });

  const types = data?.data || [];

  const openCreate = () => {
    reset({ name: '', description: '', icon: '📚' });
    setErr('');
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    setErr('');
    setBusy(true);
    try {
      await api.methodistCreateTrainingType(token, formData);
      invalidate('training-types');
      setModalOpen(false);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const doArchive = async (id) => {
    setErr('');
    try {
      await api.methodistArchiveTrainingType(token, id);
      invalidate('training-types');
      setConfirmArchive(null);
    } catch (e) {
      setErr(e.message);
    }
  };

  if (isLoading) return <SkeletonTable rows={4} cols={3} />;

  return (
    <div className="space-y-5">
      <div className="animate-fade-in">
        <PageHeader title="Типы обучения" subtitle="Направления подготовки: Backend, Frontend, Python и др.">
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--green)] text-[#141B10] text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(198,255,52,0.25)]"
            onClick={openCreate}
          >
            <Plus size={16} strokeWidth={2.5} /> Добавить тип
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

      {types.length === 0 ? (
        <div className="glass-strong rounded-[20px] animate-scale-in">
          <div className="card-body items-center py-16">
            <div className="w-20 h-20 rounded-[20px] bg-[rgba(198,255,52,0.08)] grid place-items-center mb-5 glow-ring">
              <BookOpen size={32} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[15px] font-bold text-[var(--text)] mb-1">Нет типов обучения</p>
            <p className="text-[13px] text-[var(--text-muted)] mb-5">Создайте первый тип, чтобы начать наполнять контентом</p>
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[var(--green)] text-[#141B10] text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(198,255,52,0.25)]"
              onClick={openCreate}
            >
              <Plus size={16} strokeWidth={2.5} /> Создать первый тип
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {types.map((tt, i) => {
            const color = TYPE_COLORS[i % TYPE_COLORS.length];
            return (
              <div
                key={tt.id}
                className={`glass-strong rounded-[20px] p-5 card-hover-premium group animate-slide-up stagger-${Math.min(i + 1, 6)}`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-12 h-12 rounded-[12px] grid place-items-center text-[22px] shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: color.bg }}
                    >
                      {tt.icon || '📚'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/methodist/types/${tt.id}/topics`}
                        className="text-[14px] font-bold text-[var(--text)] hover:text-[var(--green-dark,#a8e02c)] transition-colors block truncate"
                      >
                        {tt.name}
                      </Link>
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-0.5">
                        <Layers size={11} />
                        <span className="font-medium">{tt.topics_count || 0} тем</span>
                        {tt.description && (
                          <span className="text-[var(--text-muted)] opacity-50">·</span>
                        )}
                        {tt.description && (
                          <span className="text-[var(--text-muted)] opacity-70 flex items-center gap-1">
                            <Info size={10} /> описание
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    className="w-8 h-8 rounded-[8px] grid place-items-center opacity-0 group-hover:opacity-100 hover:bg-[rgba(239,68,68,0.08)] transition-all duration-200 shrink-0"
                    onClick={() => setConfirmArchive({ id: tt.id, name: tt.name })}
                    title="Архивировать"
                  >
                    <Trash2 size={14} className="text-error" />
                  </button>
                </div>
                <DescriptionPopover description={tt.description}>
                  <Link
                    to={`/methodist/types/${tt.id}/topics`}
                    className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--surface-hover)] hover:bg-[rgba(198,255,52,0.08)] transition-all text-[12px] font-semibold text-[var(--text-secondary)] hover:text-[var(--green-dark,#a8e02c)] group/link"
                  >
                    <span>Открыть темы</span>
                    <ArrowRight size={14} className="group-hover/link:translate-x-0.5 transition-transform shrink-0" />
                  </Link>
                </DescriptionPopover>
              </div>
            );
          })}
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
                  <h3 className="font-bold text-[15px] text-[var(--text)]">Архивировать тип?</h3>
                  <p className="text-[12px] text-[var(--text-muted)]">«{confirmArchive.name}» будет скрыт</p>
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
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(198,255,52,0.1)] grid place-items-center">
                  <BookOpen size={18} className="text-[var(--green-dark,#a8e02c)]" />
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-[var(--text)]">Новый тип обучения</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Создайте направление подготовки</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
              <label className="form-control w-full">
                <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Название *</span>
                <input
                  type="text"
                  {...register('name')}
                  placeholder="Например: Backend"
                  className={`input input-bordered w-full rounded-[10px] h-11 text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors ${errors.name ? 'input-error' : ''}`}
                />
                {errors.name && <span className="text-[11px] text-error mt-1">{errors.name.message}</span>}
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Описание</span>
                <textarea
                  {...register('description')}
                  placeholder="Кратко о направлении..."
                  className="textarea textarea-bordered w-full rounded-[10px] text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors"
                  rows={2}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Иконка (emoji)</span>
                <input
                  type="text"
                  {...register('icon')}
                  placeholder="📚"
                  className="input input-bordered w-full rounded-[10px] h-11 text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors"
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
