import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ClipboardCheck, BookOpen, Check, Clock, Star, Link2,
} from 'lucide-react';
import { api, uploadToPresignedUrl } from '../api.js';
import { useToast } from '../components/toast.jsx';
import {
  IconTile, Ring, Pill, Button, Skeleton, EmptyState, ErrorState, CountUp, Dropzone, C,
} from '../components/ui.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];

/* Прохождение теста внутри урока: intro → taking → done.
   Без таймера — у методических уроков нет duration_min, попытка одна на
   всю жизнь (уникальный индекс в базе), поэтому вместо обратного отсчёта —
   честное предупреждение. */
function TestSection({ phase, questions, answers, setAnswers, score, busy, onStart, onSubmit, coinReward }) {
  if (phase === 'done') {
    return (
      <div className="k-card k-pop-in p-8 text-center">
        <div className="flex justify-center mb-[18px]">
          <Ring percent={score} size={132} thickness={14} color={score >= 50 ? C.teal : C.coral}>
            <span className="k-num text-[30px]" style={{ color: score >= 50 ? C.teal : C.coral }}>
              <CountUp value={score} />%
            </span>
          </Ring>
        </div>
        <h2 className="text-xl font-extrabold mb-2" style={{ color: C.text }}>
          {score >= 50 ? 'Тест сдан!' : 'Тест не сдан'}
        </h2>
        <p className="text-sm font-semibold" style={{ color: C.muted }}>
          {score >= 50
            ? coinReward > 0
              ? `Коины за тест уже начислены (+${coinReward}).`
              : 'Отличная работа!'
            : 'Порог сдачи — 50%. Пересдача недоступна — спроси наставника.'}
        </p>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="k-card k-pop-in p-7 text-center">
        <p className="text-sm font-semibold mb-5" style={{ color: C.muted }}>
          Попытка одна — отвечай внимательно. Можно выйти и вернуться, ответы не потеряются,
          пока не нажмёшь «Завершить тест».
        </p>
        <Button onClick={onStart} disabled={busy}>
          {busy ? <span className="loading loading-spinner loading-sm" /> : 'Начать тест'}
        </Button>
      </div>
    );
  }

  // phase === 'taking'
  const answeredCount = Object.values(answers).filter((v) => v != null && v !== '').length;
  return (
    <div>
      <div className="space-y-4">
        {questions.map((q, qi) => (
          <div key={q.id} className="k-pop-in k-card p-5" style={{ animationDelay: `${Math.min(qi, 9) * 50}ms` }}>
            <div className="flex gap-3 mb-4">
              <span
                className="shrink-0 h-6 min-w-6 px-2 rounded-full text-xs font-extrabold grid place-items-center tabular-nums"
                style={{ background: C.lime, color: C.ink }}
              >
                {qi + 1}
              </span>
              <div className="min-w-0 flex-1">
                {q.type !== 'choice' && (
                  <Pill hue={q.type === 'riddle' ? 'violet' : 'blue'}>
                    {q.type === 'riddle' ? 'Загадка' : 'Вопрос и ответ'}
                  </Pill>
                )}
                <p className="font-bold text-[15px] leading-snug pt-0.5 mt-1">{q.question}</p>
              </div>
            </div>

            {q.type === 'choice' ? (
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const letter = LETTERS[oi];
                  const selected = answers[q.id] === letter;
                  return (
                    <label
                      key={oi}
                      className={`k-press flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer text-sm transition-colors ${selected ? 'font-extrabold' : 'font-semibold'}`}
                      style={selected ? { background: '#FFF1CE', color: '#8A5F00' } : { background: C.bg, color: C.text }}
                    >
                      <input
                        type="radio"
                        name={q.id}
                        className="radio radio-sm"
                        checked={selected}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                        style={{ accentColor: C.lime }}
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            ) : (
              <input
                type="text"
                value={answers[q.id] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                placeholder="Твой ответ…"
                maxLength={500}
                className="input w-full text-base sm:text-sm rounded-2xl border-2 focus:outline-none px-4 py-3 h-auto"
                style={{ borderColor: C.line, background: C.bg, color: C.text }}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.lime; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="k-card mt-4 p-4 flex items-center justify-between gap-4 sticky bottom-4 sm:static">
        <span className="text-sm font-bold" style={{ color: C.muted }}>
          Отвечено: <b className="k-num" style={{ color: C.text }}><CountUp value={answeredCount} />/{questions.length}</b>
        </span>
        <Button onClick={onSubmit} disabled={busy}>
          {busy ? <span className="loading loading-spinner loading-sm" /> : 'Завершить тест'}
        </Button>
      </div>
    </div>
  );
}

function HomeworkSection({ submission, file, setFile, link, setLink, comment, setComment, busy, onSubmit }) {
  const graded = submission?.status === 'graded';

  return (
    <div className="k-card k-pop-in p-6">
      {submission && (
        <div className="mb-5 flex items-center gap-2 flex-wrap">
          {graded ? (
            <Pill hue="teal">
              <Check size={11} strokeWidth={3.5} /> Оценено{submission.score != null ? `: ${submission.score}` : ''}
            </Pill>
          ) : (
            <Pill hue="amber"><Clock size={11} strokeWidth={3} /> На проверке</Pill>
          )}
        </div>
      )}

      {graded ? (
        <p className="text-sm font-semibold" style={{ color: C.muted }}>Задание проверено, пересдача закрыта.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[13px] font-bold mb-1.5" style={{ color: C.text }}>Файл решения</label>
            <Dropzone file={file} onFileChange={setFile} disabled={busy} />
          </div>

          <div className="flex items-center gap-3">
            <span className="flex-1 h-px" style={{ background: C.line }} />
            <span className="text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ color: C.muted }}>или</span>
            <span className="flex-1 h-px" style={{ background: C.line }} />
          </div>

          <div>
            <label htmlFor="lsn-hw-link" className="flex items-center gap-1.5 text-[13px] font-bold mb-1.5" style={{ color: C.text }}>
              <Link2 size={13} /> Ссылка на решение
            </label>
            <input
              id="lsn-hw-link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              maxLength={2000}
              className="input w-full text-base sm:text-sm rounded-2xl border-2 focus:outline-none"
              style={{ borderColor: C.line, background: C.bg, color: C.text }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.lime; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
            />
          </div>

          <div>
            <label htmlFor="lsn-hw-comment" className="block text-[13px] font-bold mb-1.5" style={{ color: C.text }}>
              Комментарий (необязательно)
            </label>
            <textarea
              id="lsn-hw-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Что-то важное про решение…"
              maxLength={5000}
              rows={3}
              className="textarea w-full text-base sm:text-sm resize-y rounded-2xl border-2 focus:outline-none"
              style={{ borderColor: C.line, background: C.bg }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.lime; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.line; }}
            />
          </div>

          <div className="flex justify-end">
            <Button disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-sm" /> : submission ? 'Отправить снова' : 'Отправить'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function LessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState('intro'); // test: intro | taking | done
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [busy, setBusy] = useState(false);

  const [file, setFile] = useState(null);
  const [link, setLink] = useState('');
  const [comment, setComment] = useState('');

  const load = () => {
    setError(null);
    setLesson(null);
    return api
      .lesson(id)
      .then((d) => {
        setLesson(d.data);
        if (d.data.type === 'test') {
          if (d.data.attempt?.finished) {
            setScore(d.data.attempt.score);
            setPhase('done');
          } else {
            setPhase('intro');
          }
        }
      })
      .catch((err) => setError(err));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const startTest = async () => {
    setBusy(true);
    try {
      const d = await api.startLessonTest(id);
      setQuestions(d.data.questions);
      setAnswers({});
      setPhase('taking');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const submitTest = async () => {
    setBusy(true);
    try {
      const d = await api.submitLessonTest(id, answers);
      setScore(d.data.score);
      setPhase('done');
      toast(d.data.score >= 50 ? 'Тест сдан!' : 'Тест не сдан', d.data.score >= 50 ? 'success' : 'error');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const submitHomework = async (e) => {
    e.preventDefault();
    if (!file && !link.trim() && !comment.trim()) {
      toast('Прикрепи файл, ссылку или комментарий', 'error');
      return;
    }
    setBusy(true);
    try {
      let fileKey;
      if (file) {
        const d = await api.lessonHomeworkUploadUrl(id, file.name, file.type || 'application/octet-stream');
        await uploadToPresignedUrl(d.data.uploadUrl, file);
        fileKey = d.data.fileKey;
      }
      // Отдельного поля под ссылку в базе нет — кладём её в text_answer
      // вместе с комментарием, честно и без выдумки нового бэкенд-поля.
      const textAnswer = [link.trim(), comment.trim()].filter(Boolean).join('\n\n');
      await api.submitLessonHomework(id, {
        ...(fileKey ? { fileKey } : {}),
        ...(textAnswer ? { textAnswer } : {}),
      });
      toast('Задание отправлено на проверку', 'success');
      setFile(null);
      setLink('');
      setComment('');
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const backButton = (
    <button
      type="button"
      onClick={() => navigate('/lessons')}
      className="inline-flex items-center gap-1.5 text-[13.5px] font-extrabold mb-4 transition-colors"
      style={{ color: C.muted }}
    >
      <ArrowLeft size={16} strokeWidth={3} /> Мои уроки
    </button>
  );

  if (error) {
    return (
      <>
        {backButton}
        <div className="k-card">
          {error.status === 404 ? (
            <EmptyState icon={ClipboardCheck} hue="coral" title="Урок не найден" text="Вернись к списку и выбери урок заново." />
          ) : (
            <ErrorState message={error.message} onRetry={load} />
          )}
        </div>
      </>
    );
  }

  if (!lesson) return <Skeleton h={90} count={3} />;

  const isTest = lesson.type === 'test';

  return (
    <>
      {backButton}

      <div className="k-card p-5 sm:p-6 mb-4">
        <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
          <IconTile icon={isTest ? ClipboardCheck : BookOpen} hue={isTest ? 'blue' : 'coral'} size={62} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.09em]" style={{ color: C.muted }}>
              {isTest ? 'Тест' : 'Домашнее задание'}
            </div>
            <h1 className="text-[24px] sm:text-[30px] font-extrabold leading-[1.1] tracking-[-0.025em] mt-0.5" style={{ color: C.text }}>
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="text-[13.5px] font-semibold mt-1" style={{ color: C.muted }}>{lesson.description}</p>
            )}
          </div>
          {lesson.coinReward > 0 && (
            <Pill hue="amber"><Star size={11} strokeWidth={3} fill="currentColor" /> +{lesson.coinReward} монет</Pill>
          )}
        </div>
      </div>

      {isTest ? (
        <TestSection
          phase={phase}
          questions={questions}
          answers={answers}
          setAnswers={setAnswers}
          score={score}
          busy={busy}
          onStart={startTest}
          onSubmit={submitTest}
          coinReward={lesson.coinReward}
        />
      ) : (
        <HomeworkSection
          submission={lesson.submission}
          file={file}
          setFile={setFile}
          link={link}
          setLink={setLink}
          comment={comment}
          setComment={setComment}
          busy={busy}
          onSubmit={submitHomework}
        />
      )}
    </>
  );
}
