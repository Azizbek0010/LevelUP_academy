import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Layers, FileQuestion, ArrowLeft, Trash2 } from 'lucide-react';
import { useTopics, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const schema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(200),
  description: z.string().trim().max(2000).optional(),
});

export default function Topics() {
  const { trainingTypeId } = useParams();
  const { token } = useAuth();
  const { data, isLoading } = useTopics(trainingTypeId);
  const invalidate = useInvalidate();
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

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

  const archive = async (id) => {
    setErr('');
    try {
      await api.methodistArchiveTopic(token, id);
      invalidate('topics', trainingTypeId);
    } catch (e) {
      setErr(e.message);
    }
  };

  if (isLoading) return <SkeletonTable rows={4} cols={3} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/methodist/types" className="btn btn-ghost btn-sm btn-square">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#1D2417]">Темы</h1>
            <p className="text-sm opacity-60">Уроки и тесты внутри направления</p>
          </div>
        </div>
        <button className="btn bg-[#C6FF34] text-[#141B10] border-none hover:bg-[#b0e62c] gap-2 font-bold" onClick={openCreate}>
          <Plus size={16} /> Добавить тему
        </button>
      </div>

      {err && <div className="alert alert-error text-sm"><span>{err}</span></div>}

      {topics.length === 0 ? (
        <div className="card bg-white border border-[#E6EDD8]">
          <div className="card-body items-center py-16">
            <Layers size={48} className="opacity-20 mb-4" />
            <p className="text-base font-semibold">Нет тем</p>
            <p className="text-sm opacity-50">Создайте первую тему в этом типе обучения</p>
            <button className="btn bg-[#C6FF34] text-[#141B10] border-none mt-4 gap-2 font-bold" onClick={openCreate}>
              <Plus size={16} /> Создать тему
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topics.map((tp) => (
            <div key={tp.id} className="card bg-white border border-[#E6EDD8] hover:shadow-md transition-shadow">
              <div className="card-body p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/methodist/topics/${tp.id}/lessons`}
                      className="font-bold text-[#1D2417] hover:underline text-base block"
                    >
                      {tp.name}
                    </Link>
                    <div className="flex items-center gap-3 text-xs opacity-50 mt-1">
                      <span className="flex items-center gap-1"><FileQuestion size={12} /> {tp.lessons_count || 0} уроков</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-square btn-xs" onClick={() => archive(tp.id)} title="Удалить">
                    <Trash2 size={14} className="text-error" />
                  </button>
                </div>
                {tp.description && <p className="text-xs opacity-60 mt-2">{tp.description}</p>}
                <Link to={`/methodist/topics/${tp.id}/lessons`}
                  className="btn btn-ghost btn-xs w-full mt-3 text-[#1D2417] font-semibold hover:bg-[#F6FBEA]"
                >
                  Уроки и тесты →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box border border-[#E6EDD8] shadow-xl bg-white max-w-md">
            <h3 className="font-bold text-lg">Новая тема</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Название *</span>
                <input type="text" {...register('name')} placeholder="React Hooks"
                  className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`} />
                {errors.name && <span className="text-xs text-error mt-1">{errors.name.message}</span>}
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Описание</span>
                <textarea {...register('description')} className="textarea textarea-bordered w-full" rows={2} />
              </label>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={busy}>Отмена</button>
                <button type="submit" className="btn bg-[#C6FF34] text-[#141B10] border-none font-bold" disabled={busy}>
                  {busy && <span className="loading loading-spinner loading-xs" />} Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
