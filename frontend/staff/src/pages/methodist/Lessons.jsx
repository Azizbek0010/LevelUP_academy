import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, FileQuestion, ClipboardCheck, ArrowLeft, Trash2, Copy, Coins, Pencil } from 'lucide-react';
import { useLessons, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const schema = z.object({
  title: z.string().trim().min(1, 'Название обязательно').max(200),
  lessonType: z.enum(['test', 'practical']),
  description: z.string().trim().max(2000).optional(),
  instruction: z.string().trim().max(2000).optional(),
  coinReward: z.coerce.number().int().min(0).default(0),
});

function LessonTypeIcon({ type }) {
  const isTest = type === 'test';
  return (
    <div className={`w-10 h-10 rounded-[12px] grid place-items-center shrink-0 ${isTest ? 'bg-[rgba(245,158,11,0.10)]' : 'bg-[rgba(34,197,94,0.10)]'}`}>
      {isTest
        ? <FileQuestion size={18} className="text-warning" />
        : <ClipboardCheck size={18} className="text-success" />
      }
    </div>
  );
}

export default function Lessons() {
  const { topicId } = useParams();
  const { token } = useAuth();
  const { data, isLoading } = useLessons(topicId);
  const invalidate = useInvalidate();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(null);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', lessonType: 'test', description: '', instruction: '', coinReward: 0 },
  });

  const lessons = data?.data || [];
  const lessonType = watch('lessonType');

  const openCreate = () => {
    reset({ title: '', lessonType: 'test', description: '', instruction: '', coinReward: 0 });
    setErr('');
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    setErr(''); setBusy(true);
    try {
      const result = await api.methodistCreateLesson(token, { topicId, ...formData });
      invalidate('lessons', topicId);
      setModalOpen(false);
      navigate(`/methodist/lessons/${result.data.id}/edit`);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const doArchive = async (id) => {
    setErr('');
    try {
      await api.methodistArchiveLesson(token, id);
      invalidate('lessons', topicId);
      setConfirmArchive(null);
    } catch (e) {
      setErr(e.message);
    }
  };

  const copyLesson = async (id) => {
    setErr('');
    try {
      await api.methodistCopyLesson(token, id, topicId);
      invalidate('lessons', topicId);
    } catch (e) {
      setErr(e.message);
    }
  };

  if (isLoading) return <SkeletonTable rows={4} cols={4} />;

  return (
    <div className="space-y-5">
      <div className="animate-fade-in">
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] mb-3">
          <Link to="/methodist/types" className="hover:text-[var(--green-dark,#a8e02c)] transition-colors font-medium">Типы</Link>
          <span className="opacity-50">/</span>
          <Link to="/methodist/types" className="hover:text-[var(--green-dark,#a8e02c)] transition-colors font-medium">Темы</Link>
          <span className="opacity-50">/</span>
          <span className="text-[var(--text-secondary)] font-semibold">Уроки</span>
        </div>
        <PageHeader title="Уроки" subtitle="Тесты и практические задания внутри темы">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-[10px] bg-[var(--surface-hover)] grid place-items-center hover:bg-base-300 transition-colors"
          >
            <ArrowLeft size={18} className="text-[var(--text-secondary)]" />
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-[var(--green)] text-[#141B10] text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(198,255,52,0.25)]"
            onClick={openCreate}
          >
            <Plus size={16} strokeWidth={2.5} /> Создать урок
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

      {lessons.length === 0 ? (
        <div className="glass-strong rounded-[20px] animate-scale-in">
          <div className="card-body items-center py-16">
            <div className="w-20 h-20 rounded-[20px] bg-[rgba(245,158,11,0.08)] grid place-items-center mb-5 glow-ring">
              <FileQuestion size={32} className="text-[var(--text-muted)]" />
            </div>
            <p className="text-[15px] font-bold text-[var(--text)] mb-1">Нет уроков</p>
            <p className="text-[13px] text-[var(--text-muted)] mb-5">Создайте первый тест или практическое задание</p>
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[var(--green)] text-[#141B10] text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(198,255,52,0.25)]"
              onClick={openCreate}
            >
              <Plus size={16} strokeWidth={2.5} /> Создать урок
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((ls, i) => (
            <div
              key={ls.id}
              className={`glass-strong rounded-[20px] p-4 card-hover-premium group animate-slide-up stagger-${Math.min(i + 1, 6)}`}
            >
              <div className="flex items-center gap-4">
                <LessonTypeIcon type={ls.lesson_type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/methodist/lessons/${ls.id}/edit`}
                      className="text-[14px] font-bold text-[var(--text)] hover:text-[var(--green-dark,#a8e02c)] transition-colors truncate"
                    >
                      {ls.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      ls.lesson_type === 'test'
                        ? 'bg-[rgba(245,158,11,0.12)] text-warning'
                        : 'bg-[rgba(34,197,94,0.12)] text-success'
                    }`}>
                      {ls.lesson_type === 'test' ? <FileQuestion size={10} /> : <ClipboardCheck size={10} />}
                      {ls.lesson_type === 'test' ? 'Тест' : 'Практика'}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-medium">
                      {ls.questions_count || 0} вопросов
                    </span>
                    {ls.coin_reward > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning">
                        <Coins size={11} /> +{ls.coin_reward}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    className="w-8 h-8 rounded-[8px] grid place-items-center hover:bg-[rgba(59,130,246,0.08)] transition-colors"
                    onClick={() => copyLesson(ls.id)}
                    title="Копировать урок"
                  >
                    <Copy size={14} className="text-info" />
                  </button>
                  <button
                    className="w-8 h-8 rounded-[8px] grid place-items-center hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                    onClick={() => setConfirmArchive({ id: ls.id, name: ls.title })}
                    title="Архивировать"
                  >
                    <Trash2 size={14} className="text-error" />
                  </button>
                </div>
                <Link
                  to={`/methodist/lessons/${ls.id}/edit`}
                  className="w-9 h-9 rounded-[10px] bg-[var(--surface-hover)] grid place-items-center hover:bg-[rgba(198,255,52,0.12)] transition-all group/edit shrink-0"
                  title="Редактировать"
                >
                  <Pencil size={14} className="text-[var(--text-muted)] group-hover/edit:text-[var(--green-dark,#a8e02c)] transition-colors" />
                </Link>
              </div>
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
                  <h3 className="font-bold text-[15px] text-[var(--text)]">Архивировать урок?</h3>
                  <p className="text-[12px] text-[var(--text-muted)] truncate max-w-[200px]">«{confirmArchive.name}»</p>
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
          <div className="modal-box max-w-lg rounded-[20px] border border-[var(--border)] modal-enter p-0 overflow-hidden">
            <div className="p-6 pb-0">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-[10px] bg-[rgba(245,158,11,0.1)] grid place-items-center">
                  <FileQuestion size={18} className="text-warning" />
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-[var(--text)]">Новый урок</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Создайте тест или практическое задание</p>
                </div>
              </div>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 pb-6 space-y-4">
              <label className="form-control w-full">
                <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Название *</span>
                <input
                  type="text"
                  {...register('title')}
                  placeholder="Например: HTML Теги"
                  className={`input input-bordered w-full rounded-[10px] h-11 text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors ${errors.title ? 'input-error' : ''}`}
                />
                {errors.title && <span className="text-[11px] text-error mt-1">{errors.title.message}</span>}
              </label>

              <label className="form-control w-full">
                <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Тип урока</span>
                <select
                  {...register('lessonType')}
                  className="select select-bordered w-full rounded-[10px] h-11 text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors"
                >
                  <option value="test">Тест (A/B/C/D)</option>
                  <option value="practical">Практическое задание</option>
                </select>
              </label>

              {lessonType === 'practical' && (
                <label className="form-control w-full">
                  <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Описание задания</span>
                  <textarea
                    {...register('description')}
                    placeholder="Опишите задание для студента..."
                    className="textarea textarea-bordered w-full rounded-[10px] text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors"
                    rows={3}
                  />
                </label>
              )}

              <label className="form-control w-full">
                <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Инструкция / Объяснение</span>
                <textarea
                  {...register('instruction')}
                  placeholder="Краткое объяснение темы..."
                  className="textarea textarea-bordered w-full rounded-[10px] text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors"
                  rows={2}
                />
              </label>

              <label className="form-control w-full">
                <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Награда (коины)</span>
                <input
                  type="number"
                  {...register('coinReward')}
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
                  {busy ? <span className="loading loading-spinner loading-xs" /> : 'Создать и редактировать'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
