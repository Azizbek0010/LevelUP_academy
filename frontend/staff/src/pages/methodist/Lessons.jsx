import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, FileQuestion, ClipboardCheck, ArrowLeft, Trash2, Copy } from 'lucide-react';
import { useLessons, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const schema = z.object({
  title: z.string().trim().min(1, 'Название обязательно').max(200),
  lessonType: z.enum(['test', 'practical']),
  description: z.string().trim().max(2000).optional(),
  instruction: z.string().trim().max(2000).optional(),
  coinReward: z.coerce.number().int().min(0).default(0),
});

export default function Lessons() {
  const { topicId } = useParams();
  const { token } = useAuth();
  const { data, isLoading } = useLessons(topicId);
  const invalidate = useInvalidate();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

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

  const archive = async (id) => {
    setErr('');
    try {
      await api.methodistArchiveLesson(token, id);
      invalidate('lessons', topicId);
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

  const typeIcon = (lt) => lt === 'test' ? <FileQuestion size={14} className="text-[#46543a]" /> : <ClipboardCheck size={14} className="text-[#46543a]" />;
  const typeLabel = (lt) => lt === 'test' ? 'Тест' : 'Практика';

  if (isLoading) return <SkeletonTable rows={4} cols={4} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm btn-square">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1D2417]">Уроки</h1>
            <p className="text-sm opacity-60">Тесты и практические задания внутри темы</p>
          </div>
        </div>
        <button className="btn bg-[#C6FF34] text-[#141B10] border-none hover:bg-[#b0e62c] gap-2 font-bold" onClick={openCreate}>
          <Plus size={16} /> Создать урок
        </button>
      </div>

      {err && <div className="alert alert-error text-sm"><span>{err}</span></div>}

      {lessons.length === 0 ? (
        <div className="card bg-white border border-[#E6EDD8]">
          <div className="card-body items-center py-16">
            <FileQuestion size={48} className="opacity-20 mb-4" />
            <p className="text-base font-semibold">Нет уроков</p>
            <p className="text-sm opacity-50">Создайте первый тест или практическое задание</p>
            <button className="btn bg-[#C6FF34] text-[#141B10] border-none mt-4 gap-2 font-bold" onClick={openCreate}>
              <Plus size={16} /> Создать урок
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons.map((ls) => (
            <div key={ls.id} className="card bg-white border border-[#E6EDD8] hover:shadow-sm transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#F6FBEA] rounded-lg">{typeIcon(ls.lesson_type)}</div>
                    <div>
                      <Link to={`/methodist/lessons/${ls.id}/edit`} className="font-semibold text-[#1D2417] hover:underline">
                        {ls.title}
                      </Link>
                      <div className="flex items-center gap-2 text-xs opacity-50 mt-0.5">
                        <span className={`badge badge-sm ${ls.lesson_type === 'test' ? 'badge-primary' : 'badge-success'}`}>
                          {typeLabel(ls.lesson_type)}
                        </span>
                        <span>{ls.questions_count || 0} вопросов</span>
                        {ls.coin_reward > 0 && <span>+{ls.coin_reward}🪙</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-square btn-xs" onClick={() => copyLesson(ls.id)} title="Копировать">
                      <Copy size={14} />
                    </button>
                    <button className="btn btn-ghost btn-square btn-xs" onClick={() => archive(ls.id)} title="Удалить">
                      <Trash2 size={14} className="text-error" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box border border-[#E6EDD8] shadow-xl bg-white max-w-lg">
            <h3 className="font-bold text-lg">Новый урок</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Название *</span>
                <input type="text" {...register('title')} placeholder="HTML Теги"
                  className={`input input-bordered w-full ${errors.title ? 'input-error' : ''}`} />
                {errors.title && <span className="text-xs text-error mt-1">{errors.title.message}</span>}
              </label>

              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Тип урока</span>
                <select {...register('lessonType')} className="select select-bordered w-full">
                  <option value="test">Тест (A/B/C/D)</option>
                  <option value="practical">Практическое задание</option>
                </select>
              </label>

              {lessonType === 'practical' && (
                <label className="form-control w-full">
                  <span className="label-text mb-1 font-medium">Описание задания</span>
                  <textarea {...register('description')} placeholder="Опишите задание..." className="textarea textarea-bordered w-full" rows={3} />
                </label>
              )}

              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Инструкция / Объяснение</span>
                <textarea {...register('instruction')} placeholder="Краткое объяснение темы..." className="textarea textarea-bordered w-full" rows={2} />
              </label>

              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Награда (коины)</span>
                <input type="number" {...register('coinReward')} className="input input-bordered w-full" />
              </label>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={busy}>Отмена</button>
                <button type="submit" className="btn bg-[#C6FF34] text-[#141B10] border-none font-bold" disabled={busy}>
                  {busy ? <span className="loading loading-spinner loading-xs" /> : 'Создать и редактировать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
