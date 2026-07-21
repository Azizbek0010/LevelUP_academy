import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, BookOpen, Layers, Trash2, Pencil } from 'lucide-react';
import { useTrainingTypes, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import TrainingTypeIcon from '../../components/TrainingTypeIcon.jsx';


const schema = z.object({
  name: z.string().trim().min(1, 'Название обязательно').max(160),
  description: z.string().trim().max(1000).optional(),
  icon: z.string().trim().max(60).optional(),
});

export default function TrainingTypes() {
  const { token } = useAuth();
  const { data, isLoading } = useTrainingTypes();
  const invalidate = useInvalidate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', icon: '📚' },
  });

  const types = data?.data || [];

  const openCreate = () => {
    setEditingId(null);
    reset({ name: '', description: '', icon: '📚' });
    setErr('');
    setModalOpen(true);
  };

  const openEdit = (tt) => {
    setEditingId(tt.id);
    reset({ name: tt.name, description: tt.description || '', icon: tt.icon || '📚' });
    setErr('');
    setModalOpen(true);
  };

  const onSubmit = async (formData) => {
    setErr('');
    setBusy(true);
    try {
      if (editingId) {
        await api.methodistUpdateTrainingType(token, editingId, formData);
      } else {
        await api.methodistCreateTrainingType(token, formData);
      }
      invalidate('training-types');
      setModalOpen(false);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const archive = async (id) => {
    setErr('');
    try {
      await api.methodistArchiveTrainingType(token, id);
      invalidate('training-types');
    } catch (e) {
      setErr(e.message);
    }
  };

  if (isLoading) return <SkeletonTable rows={4} cols={3} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1D2417]">Типы обучения</h1>
          <p className="text-sm opacity-60">Например: Backend, Frontend, Python — направления подготовки</p>
        </div>
        <button className="btn bg-[#C6FF34] text-[#141B10] border-none hover:bg-[#b0e62c] gap-2 font-bold" onClick={openCreate}>
          <Plus size={16} /> Добавить тип
        </button>
      </div>

      {err && <div className="alert alert-error text-sm"><span>{err}</span></div>}

      {types.length === 0 ? (
        <div className="card bg-white border border-[#E6EDD8]">
          <div className="card-body items-center py-16">
            <BookOpen size={48} className="opacity-20 mb-4" />
            <p className="text-base font-semibold">Нет типов обучения</p>
            <p className="text-sm opacity-50">Начните с добавления первого типа обучения</p>
            <button className="btn bg-[#C6FF34] text-[#141B10] border-none hover:bg-[#b0e62c] mt-4 gap-2 font-bold" onClick={openCreate}>
              <Plus size={16} /> Создать первый тип
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {types.map((tt) => (
            <div key={tt.id} className="card bg-white border border-[#E6EDD8] hover:shadow-md transition-shadow">
              <div className="card-body p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <TrainingTypeIcon name={tt.name} icon={tt.icon} className="w-10 h-10" />
                    <div>
                      <Link to={`/methodist/types/${tt.id}/topics`}
                        className="font-bold text-[#1D2417] hover:underline text-base block"
                      >
                        {tt.name}
                      </Link>
                      <div className="flex items-center gap-2 text-xs opacity-50 mt-0.5">
                        <Layers size={12} /> {tt.topics_count || 0} тем
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-square btn-xs" onClick={() => openEdit(tt)} title="Редактировать">
                      <Pencil size={14} className="text-info" />
                    </button>
                    <button className="btn btn-ghost btn-square btn-xs" onClick={() => archive(tt.id)} title="Удалить">
                      <Trash2 size={14} className="text-error" />
                    </button>
                  </div>
                </div>
                {tt.description && (
                  <p className="text-xs opacity-60 mt-2 line-clamp-2">{tt.description}</p>
                )}
                <Link to={`/methodist/types/${tt.id}/topics`}
                  className="btn btn-ghost btn-xs w-full mt-3 text-[#1D2417] font-semibold hover:bg-[#F6FBEA]"
                >
                  Открыть темы →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="modal modal-open">
          <div className="modal-box border border-[#E6EDD8] shadow-xl bg-white max-w-md">
            <h3 className="font-bold text-lg text-[#1D2417]">{editingId ? 'Редактировать тип' : 'Новый тип обучения'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Название *</span>
                <input type="text" {...register('name')} placeholder="Backend"
                  className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`} />
                {errors.name && <span className="text-xs text-error mt-1">{errors.name.message}</span>}
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Описание</span>
                <textarea {...register('description')} placeholder="Описание направления"
                  className="textarea textarea-bordered w-full" rows={2} />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Иконка (emoji)</span>
                <input type="text" {...register('icon')} placeholder="📚" className="input input-bordered w-full" />
              </label>
              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} disabled={busy}>Отмена</button>
                <button type="submit" className="btn bg-[#C6FF34] text-[#141B10] border-none font-bold" disabled={busy}>
                  {busy && <span className="loading loading-spinner loading-xs" />} {editingId ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
