import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ArrowLeft, Trash2, Check, FileQuestion, ClipboardCheck } from 'lucide-react';
import { useLessonDetails, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const questionSchema = z.object({
  questionText: z.string().trim().min(1, 'Вопрос обязателен').max(1000),
  optionA: z.string().trim().min(1, 'Вариант A обязателен').max(300),
  optionB: z.string().trim().min(1, 'Вариант B обязателен').max(300),
  optionC: z.string().trim().min(1, 'Вариант C обязателен').max(300),
  optionD: z.string().trim().min(1, 'Вариант D обязателен').max(300),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
});

export default function LessonEditor() {
  const { lessonId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading } = useLessonDetails(lessonId);
  const invalidate = useInvalidate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [questionCount, setQuestionCount] = useState(1);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
  });

  const lesson = data?.data;
  const questions = lesson?.questions || [];

  const isTest = lesson?.lesson_type === 'test';
  const isPractical = lesson?.lesson_type === 'practical';

  const openAdd = () => {
    setEditingId(null);
    reset({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' });
  };

  const openEdit = (q) => {
    setEditingId(q.id);
    reset({
      questionText: q.question_text || q.questionText,
      optionA: q.option_a || q.optionA,
      optionB: q.option_b || q.optionB,
      optionC: q.option_c || q.optionC,
      optionD: q.option_d || q.optionD,
      correctAnswer: q.correct_answer || q.correctAnswer,
    });
  };

  const onSubmit = async (formData) => {
    setErr(''); setBusy(true);
    try {
      if (editingId) {
        await api.methodistUpdateQuestion(token, editingId, formData);
      } else {
        await api.methodistCreateQuestion(token, { lessonId, ...formData });
      }
      invalidate('lesson', lessonId);
      reset({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' });
      setEditingId(null);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const deleteQ = async (id) => {
    await api.methodistDeleteQuestion(token, id);
    invalidate('lesson', lessonId);
  };

  const addBatch = async () => {
    setErr(''); setBusy(true);
    try {
      const qs = [];
      for (let i = 0; i < questionCount; i++) {
        qs.push({
          lessonId,
          questionText: `Вопрос ${questions.length + i + 1}`,
          optionA: 'Вариант A',
          optionB: 'Вариант B',
          optionC: 'Вариант C',
          optionD: 'Вариант D',
          correctAnswer: 'A',
        });
      }
      await api.methodistCreateQuestionsBatch(token, qs);
      invalidate('lesson', lessonId);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  if (isLoading) return <SkeletonTable rows={5} cols={5} />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm btn-square">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#1D2417]">{lesson?.title || 'Редактор урока'}</h1>
            <div className="flex items-center gap-2 text-sm opacity-60 mt-0.5">
              {isTest ? (
                <><FileQuestion size={14} /> Тест · {questions.length} вопросов</>
              ) : (
                <><ClipboardCheck size={14} /> Практическое задание</>
              )}
            </div>
          </div>
        </div>
      </div>

      {err && <div className="alert alert-error text-sm"><span>{err}</span></div>}

      {/* Description for practical tasks */}
      {isPractical && lesson?.description && (
        <div className="card bg-[#FFF8E8] border border-[#F0E0A0]">
          <div className="card-body p-4">
            <h3 className="font-semibold text-sm">Описание задания:</h3>
            <p className="text-sm opacity-70 whitespace-pre-wrap">{lesson.description}</p>
          </div>
        </div>
      )}

      {/* Instruction */}
      {lesson?.instruction && (
        <div className="card bg-[#E8F4FD] border border-[#B8D4E8]">
          <div className="card-body p-4">
            <h3 className="font-semibold text-sm">Инструкция / Объяснение:</h3>
            <p className="text-sm opacity-70 whitespace-pre-wrap">{lesson.instruction}</p>
          </div>
        </div>
      )}

      {/* Add question form */}
      <div className="card bg-white border border-[#E6EDD8]">
        <div className="card-body p-5">
          <h3 className="font-semibold text-[#1D2417] mb-4">
            {editingId ? 'Редактировать вопрос' : 'Добавить вопрос'}
          </h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <label className="form-control w-full">
              <span className="label-text mb-1 font-medium">Текст вопроса *</span>
              <input type="text" {...register('questionText')} placeholder="Какой тег для заголовка?"
                className={`input input-bordered w-full ${errors.questionText ? 'input-error' : ''}`} />
              {errors.questionText && <span className="text-xs text-error mt-1">{errors.questionText.message}</span>}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(['A', 'B', 'C', 'D']).map((letter) => (
                <label key={letter} className="form-control w-full">
                  <span className="label-text mb-1 font-medium">Вариант {letter}</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold opacity-40">{letter})</span>
                    <input type="text" {...register(`option${letter}`)}
                      placeholder={`Вариант ${letter}`}
                      className={`input input-bordered w-full pl-8 ${errors[`option${letter}`] ? 'input-error' : ''}`} />
                  </div>
                </label>
              ))}
            </div>

            <label className="form-control w-full max-w-xs">
              <span className="label-text mb-1 font-medium">Правильный ответ *</span>
              <select {...register('correctAnswer')} className="select select-bordered w-full">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
              </select>
            </label>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="btn bg-[#C6FF34] text-[#141B10] border-none font-bold" disabled={busy}>
                {busy ? <span className="loading loading-spinner loading-xs" /> : editingId ? 'Сохранить' : 'Добавить вопрос'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-ghost" onClick={openAdd}>Отмена</button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Batch create */}
      <div className="card bg-white border border-[#E6EDD8]">
        <div className="card-body p-5">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Быстрое создание:</span>
            <input type="number" min={1} max={20} value={questionCount}
              onChange={(e) => setQuestionCount(Math.min(20, Math.max(1, Number(e.target.value))))}
              className="input input-bordered input-sm w-20" />
            <span className="text-sm opacity-60">пустых вопросов</span>
            <button className="btn btn-ghost btn-sm" onClick={addBatch} disabled={busy}>
              <Plus size={14} /> Создать
            </button>
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-[#1D2417]">Вопросы ({questions.length})</h3>
        {questions.length === 0 ? (
          <div className="card bg-white border border-[#E6EDD8]">
            <div className="card-body items-center py-8">
              <FileQuestion size={36} className="opacity-20 mb-2" />
              <p className="text-sm opacity-50">Нет вопросов. Добавьте первый вопрос.</p>
            </div>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="card bg-white border border-[#E6EDD8] hover:shadow-sm transition-shadow">
              <div className="card-body p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold opacity-40">#{idx + 1}</span>
                      <span className="font-semibold text-sm">{q.question_text}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {(['A', 'B', 'C', 'D']).map((letter) => {
                        const val = q[`option_${letter.toLowerCase()}`] || q[`option${letter}`];
                        const isCorrect = (q.correct_answer || q.correctAnswer) === letter;
                        return (
                          <div key={letter} className={`flex items-center gap-1.5 p-1.5 rounded ${isCorrect ? 'bg-[#E8F8EE] text-[#2ECC71] font-semibold' : ''}`}>
                            {isCorrect && <Check size={12} />}
                            <span className="opacity-40">{letter})</span>
                            <span>{val}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-1 ml-3">
                    <button className="btn btn-ghost btn-square btn-xs" onClick={() => openEdit(q)} title="Редактировать">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="btn btn-ghost btn-square btn-xs" onClick={() => deleteQ(q.id)} title="Удалить">
                      <Trash2 size={14} className="text-error" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
