import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ArrowLeft, Trash2, Check, FileQuestion, ClipboardCheck, HelpCircle, Pencil, Layers } from 'lucide-react';
import { useLessonDetails, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const questionSchema = z.object({
  questionText: z.string().trim().min(1, 'Вопрос обязателен').max(1000),
  optionA: z.string().trim().min(1, 'Вариант A обязателен').max(300),
  optionB: z.string().trim().min(1, 'Вариант B обязателен').max(300),
  optionC: z.string().trim().min(1, 'Вариант C обязателен').max(300),
  optionD: z.string().trim().min(1, 'Вариант D обязателен').max(300),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
});

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const OPTION_COLORS = {
  A: { bg: 'bg-[rgba(239,68,68,0.06)]', border: 'border-[rgba(239,68,68,0.15)]', text: 'text-error', ring: 'ring-error/20' },
  B: { bg: 'bg-[rgba(59,130,246,0.06)]', border: 'border-[rgba(59,130,246,0.15)]', text: 'text-info', ring: 'ring-info/20' },
  C: { bg: 'bg-[rgba(245,158,11,0.06)]', border: 'border-[rgba(245,158,11,0.15)]', text: 'text-warning', ring: 'ring-warning/20' },
  D: { bg: 'bg-[rgba(168,85,247,0.06)]', border: 'border-[rgba(168,85,247,0.15)]', text: 'text-purple-500', ring: 'ring-purple-500/20' },
};

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setErr('');
    try {
      await api.methodistDeleteQuestion(token, id);
      invalidate('lesson', lessonId);
    } catch (e) { setErr(e.message); }
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
      <div className="animate-fade-in">
        <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] mb-3">
          <button onClick={() => navigate(-1)} className="hover:text-[var(--green-dark,#a8e02c)] transition-colors font-medium cursor-pointer">← Назад</button>
          <span className="opacity-50">/</span>
          <span className="text-[var(--text-secondary)] font-semibold">Редактор урока</span>
        </div>
        <PageHeader title={lesson?.title || 'Редактор урока'} subtitle={isTest ? `Тест · ${questions.length} вопросов` : 'Практическое задание'}>
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-[10px] bg-[var(--surface-hover)] grid place-items-center hover:bg-base-300 transition-colors"
          >
            <ArrowLeft size={18} className="text-[var(--text-secondary)]" />
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

      {/* Description for practical tasks */}
      {isPractical && lesson?.description && (
        <div className="rounded-[16px] bg-[rgba(245,158,11,0.05)] border border-[rgba(245,158,11,0.15)] p-5 animate-slide-up stagger-1">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[rgba(245,158,11,0.12)] grid place-items-center">
              <FileQuestion size={14} className="text-warning" />
            </div>
            <h3 className="text-[13px] font-bold text-[var(--text)]">Описание задания</h3>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed pl-[42px]">{lesson.description}</p>
        </div>
      )}

      {/* Instruction */}
      {lesson?.instruction && (
        <div className="rounded-[16px] bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.15)] p-5 animate-slide-up stagger-2">
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[rgba(59,130,246,0.12)] grid place-items-center">
              <HelpCircle size={14} className="text-info" />
            </div>
            <h3 className="text-[13px] font-bold text-[var(--text)]">Инструкция / Объяснение</h3>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed pl-[42px]">{lesson.instruction}</p>
        </div>
      )}

      {/* Add question form */}
      <div className="glass-strong rounded-[20px] p-5 animate-slide-up stagger-3">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-[10px] bg-[rgba(198,255,52,0.1)] grid place-items-center">
            {editingId ? <Pencil size={16} className="text-[var(--green-dark,#a8e02c)]" /> : <Plus size={16} className="text-[var(--green-dark,#a8e02c)]" />}
          </div>
          <h3 className="text-[14px] font-bold text-[var(--text)]">
            {editingId ? 'Редактировать вопрос' : 'Добавить вопрос'}
          </h3>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <label className="form-control w-full">
            <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Текст вопроса *</span>
            <input
              type="text"
              {...register('questionText')}
              placeholder="Какой тег используется для заголовка?"
              className={`input input-bordered w-full rounded-[10px] h-11 text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors ${errors.questionText ? 'input-error' : ''}`}
            />
            {errors.questionText && <span className="text-[11px] text-error mt-1">{errors.questionText.message}</span>}
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {OPTION_LETTERS.map((letter) => {
              const c = OPTION_COLORS[letter];
              return (
                <label key={letter} className="form-control w-full">
                  <span className={`label-text mb-1.5 font-semibold text-[12px] ${c.text}`}>Вариант {letter}</span>
                  <div className="relative">
                    <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold ${c.text} opacity-60`}>{letter})</span>
                    <input
                      type="text"
                      {...register(`option${letter}`)}
                      placeholder={`Вариант ${letter}`}
                      className={`input input-bordered w-full pl-8 rounded-[10px] h-11 text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors ${errors[`option${letter}`] ? 'input-error' : ''}`}
                    />
                  </div>
                </label>
              );
            })}
          </div>

          <label className="form-control w-full max-w-xs">
            <span className="label-text mb-1.5 font-semibold text-[12px] text-[var(--text-secondary)]">Правильный ответ *</span>
            <select
              {...register('correctAnswer')}
              className="select select-bordered w-full rounded-[10px] h-11 text-[13px] hover:border-[var(--green)] focus:border-[var(--green)] transition-colors"
            >
              {OPTION_LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 h-10 rounded-[10px] bg-[var(--green)] text-[#141B10] text-[13px] font-bold hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(198,255,52,0.25)]"
              disabled={busy}
            >
              {busy ? <span className="loading loading-spinner loading-xs" /> : editingId ? 'Сохранить' : 'Добавить вопрос'}
            </button>
            {editingId && (
              <button
                type="button"
                className="h-10 px-4 rounded-[10px] bg-[var(--surface-hover)] text-[var(--text-secondary)] text-[13px] font-semibold hover:bg-base-300 transition-colors"
                onClick={openAdd}
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Batch create */}
      <div className="glass-strong rounded-[20px] p-5 animate-slide-up stagger-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[rgba(168,85,247,0.1)] grid place-items-center shrink-0">
            <Layers size={16} className="text-purple-500" />
          </div>
          <span className="text-[13px] font-semibold text-[var(--text)]">Быстрое создание</span>
        </div>
        <div className="flex items-center gap-3 mt-3 pl-[44px]">
          <input
            type="number"
            min={1}
            max={20}
            value={questionCount}
            onChange={(e) => setQuestionCount(Math.min(20, Math.max(1, Number(e.target.value))))}
            className="input input-bordered input-sm w-20 rounded-[8px] h-9 text-[13px] text-center hover:border-[var(--green)] focus:border-[var(--green)] transition-colors"
          />
          <span className="text-[12px] text-[var(--text-muted)]">пустых вопросов</span>
          <button
            className="flex items-center gap-1.5 h-9 px-4 rounded-[10px] bg-[var(--surface-hover)] text-[var(--text-secondary)] text-[12px] font-semibold hover:bg-[rgba(168,85,247,0.08)] hover:text-purple-500 transition-all"
            onClick={addBatch}
            disabled={busy}
          >
            <Plus size={14} /> Создать
          </button>
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-3 animate-slide-up stagger-5">
        <div className="flex items-center gap-2.5">
          <h3 className="text-[15px] font-bold text-[var(--text)]">Вопросы</h3>
          <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-[var(--surface-hover)] text-[11px] font-bold text-[var(--text-muted)] tabular-nums">
            {questions.length}
          </span>
        </div>
        {questions.length === 0 ? (
          <div className="glass-strong rounded-[20px]">
            <div className="card-body items-center py-10">
              <div className="w-14 h-14 rounded-[14px] bg-[rgba(198,255,52,0.06)] grid place-items-center mb-3">
                <FileQuestion size={24} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-[13px] text-[var(--text-muted)] font-medium">Нет вопросов. Добавьте первый вопрос выше.</p>
            </div>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.id}
              className={`glass-strong rounded-[16px] p-4 card-hover-premium group animate-slide-up ${editingId === q.id ? 'ring-2 ring-[var(--green)]/30' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span className="w-8 h-8 rounded-[8px] bg-[var(--surface-hover)] grid place-items-center shrink-0 text-[12px] font-bold text-[var(--text-muted)] tabular-nums mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--text)] mb-3 leading-relaxed">{q.question_text}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {OPTION_LETTERS.map((letter) => {
                      const val = q[`option_${letter.toLowerCase()}`] || q[`option${letter}`];
                      const isCorrect = (q.correct_answer || q.correctAnswer) === letter;
                      const c = OPTION_COLORS[letter];
                      return (
                        <div
                          key={letter}
                          className={`flex items-center gap-2 p-2.5 rounded-[10px] text-[12px] transition-all ${
                            isCorrect
                              ? 'bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.2)] text-[var(--text)] font-medium'
                              : `${c.bg} ${c.border} border text-[var(--text-secondary)]`
                          }`}
                        >
                          {isCorrect && <Check size={12} className="text-success shrink-0" />}
                          <span className={`${c.text} font-bold text-[11px]`}>{letter})</span>
                          <span className="truncate">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    className="w-8 h-8 rounded-[8px] grid place-items-center hover:bg-[rgba(59,130,246,0.08)] transition-colors"
                    onClick={() => openEdit(q)}
                    title="Редактировать"
                  >
                    <Pencil size={13} className="text-info" />
                  </button>
                  <button
                    className="w-8 h-8 rounded-[8px] grid place-items-center hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                    onClick={() => { if (window.confirm('Удалить вопрос?')) deleteQ(q.id); }}
                    title="Удалить"
                  >
                    <Trash2 size={13} className="text-error" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
