import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, ArrowLeft, Trash2, Check, FileQuestion, ClipboardCheck, ArrowUp, ArrowDown, Settings, Upload, FileText, HelpCircle, Pencil, Layers } from 'lucide-react';
import { useLessonDetails, useInvalidate } from '../../queries.js';
import { api, uploadToPresignedUrl } from '../../api.js';
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

const lessonSettingsSchema = z.object({
  title: z.string().trim().min(1, 'Название обязательно').max(200),
  description: z.string().trim().max(4000).optional(),
  instruction: z.string().trim().max(2000).optional(),
  coinReward: z.coerce.number().int().min(0).default(0),
  videoUrl: z.string().trim().url('Некорректная ссылка').or(z.literal('')).optional(),
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

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues: { questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' },
  });

  const { register: regSettings, handleSubmit: handleSettingsSubmit, reset: resetSettings, formState: { errors: settingsErrors } } = useForm({
    resolver: zodResolver(lessonSettingsSchema),
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

  const openSettings = () => {
    resetSettings({
      title: lesson?.title || '',
      description: lesson?.description || '',
      instruction: lesson?.instruction || '',
      coinReward: lesson?.coin_reward || lesson?.coinReward || 0,
      videoUrl: lesson?.video_url || lesson?.videoUrl || '',
    });
    setErr('');
    setSettingsOpen(true);
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

  const onSaveSettings = async (formData) => {
    setErr(''); setBusy(true);
    try {
      await api.methodistUpdateLesson(token, lessonId, formData);
      invalidate('lesson', lessonId);
      setSettingsOpen(false);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErr('');
    setUploading(true);
    try {
      const d = await api.methodistLessonUploadUrl(token, lessonId, file.name, file.type || 'application/octet-stream');
      await uploadToPresignedUrl(d.data.uploadUrl, file);
      await api.methodistUpdateLesson(token, lessonId, { fileKey: d.data.fileKey });
      invalidate('lesson', lessonId);
    } catch (err) {
      setErr(err.message);
    } finally {
      setUploading(false);
    }
  };

  const deleteQ = async (id) => {
    setErr('');
    try {
      await api.methodistDeleteQuestion(token, id);
      invalidate('lesson', lessonId);
    } catch (e) { setErr(e.message); }
  };

  const moveQuestion = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    setErr('');
    setBusy(true);
    try {
      const q1 = questions[index];
      const q2 = questions[targetIndex];

      const q1Data = {
        questionText: q1.question_text || q1.questionText,
        optionA: q1.option_a || q1.optionA,
        optionB: q1.option_b || q1.optionB,
        optionC: q1.option_c || q1.optionC,
        optionD: q1.option_d || q1.optionD,
        correctAnswer: q1.correct_answer || q1.correctAnswer,
      };

      const q2Data = {
        questionText: q2.question_text || q2.questionText,
        optionA: q2.option_a || q2.optionA,
        optionB: q2.option_b || q2.optionB,
        optionC: q2.option_c || q2.optionC,
        optionD: q2.option_d || q2.optionD,
        correctAnswer: q2.correct_answer || q2.correctAnswer,
      };

      await Promise.all([
        api.methodistUpdateQuestion(token, q1.id, q2Data),
        api.methodistUpdateQuestion(token, q2.id, q1Data),
      ]);

      invalidate('lesson', lessonId);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
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
          <button onClick={() => navigate(-1)} className="hover:text-[var(--primary)] transition-colors font-medium cursor-pointer">← Назад</button>
          <span className="opacity-50">/</span>
          <span className="text-[var(--text-secondary)] font-semibold">Редактор урока</span>
        </div>
        <PageHeader title={lesson?.title || 'Редактор урока'} subtitle={isTest ? `Тест · ${questions.length} вопросов` : 'Практическое задание'}>
          <button
            onClick={openSettings}
            className="w-10 h-10 rounded-[10px] bg-[var(--surface-hover)] grid place-items-center hover:bg-base-300 transition-colors"
            title="Параметры урока"
          >
            <Settings size={18} className="text-[var(--text-secondary)]" />
          </button>
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

      {/* Video lesson details */}
      {(lesson?.video_url || lesson?.videoUrl) && (
        <div className="card bg-[#F6FBEA] border border-[#E6EDD8] hover:shadow-sm transition-shadow">
          <div className="card-body p-4 flex flex-row items-center gap-3">
            <div className="p-2.5 bg-white rounded-lg text-[#1D2417]">
              <Play size={18} />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Видео-материал:</h3>
              <a href={lesson?.video_url || lesson?.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-medium break-all">
                {lesson?.video_url || lesson?.videoUrl}
              </a>
            </div>
          </div>
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

      {/* Practical task attachment */}
      {isPractical && (
        <div className="card bg-white border border-[#E6EDD8] hover:shadow-sm transition-shadow">
          <div className="card-body p-4 flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#F6FBEA] rounded-lg text-[#1D2417]">
                <FileText size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Вложенный файл к заданию:</h3>
                {(lesson?.file_key || lesson?.fileKey) ? (
                  <p className="text-xs opacity-60 mt-0.5 break-all max-w-xs md:max-w-md">
                    {lesson?.file_key || lesson?.fileKey}
                  </p>
                ) : (
                  <p className="text-xs opacity-40 mt-0.5">Файл не прикреплен</p>
                )}
              </div>
            </div>
            <label className="btn btn-ghost btn-sm gap-2 border border-[#E6EDD8] cursor-pointer" disabled={uploading}>
              <Upload size={14} />
              {uploading ? 'Загрузка...' : 'Загрузить файл'}
              <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.zip,.rar,.tar,.gz,.7z" />
            </label>
          </div>
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
          <div className="w-9 h-9 rounded-[10px] bg-[rgba(59,130,246,0.1)] grid place-items-center">
            {editingId ? <Pencil size={16} className="text-[var(--primary)]" /> : <Plus size={16} className="text-[var(--primary)]" />}
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
              className={`input input-bordered w-full rounded-[10px] h-11 text-[13px] hover:border-[var(--primary)] focus:border-[var(--primary)] transition-colors ${errors.questionText ? 'input-error' : ''}`}
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
                      className={`input input-bordered w-full pl-8 rounded-[10px] h-11 text-[13px] hover:border-[var(--primary)] focus:border-[var(--primary)] transition-colors ${errors[`option${letter}`] ? 'input-error' : ''}`}
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
              className="select select-bordered w-full rounded-[10px] h-11 text-[13px] hover:border-[var(--primary)] focus:border-[var(--primary)] transition-colors"
            >
              {OPTION_LETTERS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="btn btn-primary gap-2 h-10 text-[13px]"
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
            className="input input-bordered input-sm w-20 rounded-[8px] h-9 text-[13px] text-center hover:border-[var(--primary)] focus:border-[var(--primary)] transition-colors"
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
              <div className="w-14 h-14 rounded-[14px] bg-[rgba(59,130,246,0.06)] grid place-items-center mb-3">
                <FileQuestion size={24} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-[13px] text-[var(--text-muted)] font-medium">Нет вопросов. Добавьте первый вопрос выше.</p>
            </div>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div
              key={q.id}
              className={`glass-strong rounded-[16px] p-4 card-hover-premium group animate-slide-up ${editingId === q.id ? 'ring-2 ring-[var(--primary)]/30' : ''}`}
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
                    className="w-8 h-8 rounded-[8px] grid place-items-center hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-30"
                    onClick={() => moveQuestion(idx, 'up')}
                    disabled={idx === 0 || busy}
                    title="Вверх"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button
                    className="w-8 h-8 rounded-[8px] grid place-items-center hover:bg-[var(--surface-hover)] transition-colors disabled:opacity-30"
                    onClick={() => moveQuestion(idx, 'down')}
                    disabled={idx === questions.length - 1 || busy}
                    title="Вниз"
                  >
                    <ArrowDown size={13} />
                  </button>
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

      {settingsOpen && (
        <div className="modal modal-open">
          <div className="modal-box border border-[#E6EDD8] shadow-xl bg-white max-w-lg">
            <h3 className="font-bold text-lg">Параметры урока</h3>
            <form onSubmit={handleSettingsSubmit(onSaveSettings)} className="space-y-4 mt-4">
              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Название *</span>
                <input type="text" {...regSettings('title')} className={`input input-bordered w-full ${settingsErrors.title ? 'input-error' : ''}`} />
                {settingsErrors.title && <span className="text-xs text-error mt-1">{settingsErrors.title.message}</span>}
              </label>

              {isPractical && (
                <label className="form-control w-full">
                  <span className="label-text mb-1 font-medium">Описание задания</span>
                  <textarea {...regSettings('description')} className="textarea textarea-bordered w-full" rows={3} />
                </label>
              )}

              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Инструкция / Объяснение</span>
                <textarea {...regSettings('instruction')} className="textarea textarea-bordered w-full" rows={2} />
              </label>

              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Видео-урок (YouTube/S3 ссылка)</span>
                <input type="text" {...regSettings('videoUrl')} placeholder="https://youtube.com/watch?v=..." className={`input input-bordered w-full ${settingsErrors.videoUrl ? 'input-error' : ''}`} />
                {settingsErrors.videoUrl && <span className="text-xs text-error mt-1">{settingsErrors.videoUrl.message}</span>}
              </label>

              <label className="form-control w-full">
                <span className="label-text mb-1 font-medium">Награда (коины)</span>
                <input type="number" {...regSettings('coinReward')} className="input input-bordered w-full" />
              </label>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setSettingsOpen(false)} disabled={busy}>Отмена</button>
                <button type="submit" className="btn btn-primary font-bold" disabled={busy}>
                  {busy ? <span className="loading loading-spinner loading-xs" /> : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


