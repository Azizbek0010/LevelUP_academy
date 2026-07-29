import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Timer, ArrowLeft } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { Skeleton, Button } from '../components/ui.jsx';
import { fmtDuration } from '../format.js';

/**
 * Прохождение теста: intro → start (таймер от сервера) → вопросы → submit → результат.
 * Если попытка уже начата (перезагрузка страницы) — таймер восстанавливается
 * из started_at + duration_min строки списка тестов.
 */
export default function TestTake() {
  const { testId } = useParams();
  const toast = useToast();

  const [test, setTest] = useState(null);
  const [row, setRow] = useState(null); // строка из списка: started_at / finished_at / score
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading | intro | taking | done
  const [endsAt, setEndsAt] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null);
  const [busy, setBusy] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    Promise.all([api.tests(), api.test(testId).catch((err) => ({ error: err }))])
      .then(([list, one]) => {
        const listRow = list.data.find((t) => t.id === testId) ?? null;
        setRow(listRow);

        if (listRow?.finished_at) {
          setScore(listRow.score);
          setPhase('done');
          return;
        }
        if (one.error) {
          setError(one.error.message);
          setPhase('intro');
          return;
        }
        setTest(one.data);
        setAnswers(new Array(one.data.questions.length).fill(-1));

        if (listRow?.started_at) {
          // попытка уже идёт — восстанавливаем дедлайн
          const deadline = new Date(listRow.started_at).getTime() + one.data.duration_min * 60_000;
          const capped = one.data.ends_at ? Math.min(deadline, new Date(one.data.ends_at).getTime()) : deadline;
          setEndsAt(capped);
          setPhase('taking');
        } else {
          setPhase('intro');
        }
      })
      .catch((err) => {
        setError(err.message);
        setPhase('intro');
      });
  }, [testId]);

  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setBusy(true);
      try {
        const d = await api.submitTest(testId, answers);
        setScore(d.data.score);
        setPhase('done');
        if (!auto) toast('Тест сдан!', 'success');
      } catch (err) {
        if (err.status === 409) {
          setError(err.message === 'Time is up' ? 'Время вышло — ответы не приняты' : err.message);
          setPhase('done');
          setScore(null);
        } else {
          submittedRef.current = false;
          toast(err.message, 'error');
        }
      } finally {
        setBusy(false);
      }
    },
    [testId, answers, toast],
  );

  // тик таймера + автосабмит на нуле
  useEffect(() => {
    if (phase !== 'taking' || !endsAt) return undefined;
    const tick = () => {
      const left = Math.floor((endsAt - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) submit(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, endsAt, submit]);

  const start = async () => {
    setBusy(true);
    try {
      const d = await api.startTest(testId);
      setEndsAt(new Date(d.data.endsAt).getTime());
      setPhase('taking');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const answered = answers.filter((a) => a >= 0).length;

  if (phase === 'loading') return <Skeleton h={90} count={3} />;

  if (phase === 'done') {
    return (
      <div className="card bg-base-100 max-w-md mx-auto mt-8 sm:mt-12 p-8 text-center animate-scale-in">
        {score !== null ? (
          <>
            <div className="score-ring" style={{ '--score': score }}>
              <span className={score >= 50 ? 'text-primary' : 'text-error'}>{score}%</span>
            </div>
            <h2 className="text-xl font-extrabold mb-2">{score >= 50 ? 'Тест сдан!' : 'Тест не сдан'}</h2>
            <p className="text-sm text-base-content/55 mb-6">
              {score >= 50
                ? row?.coin_reward > 0
                  ? `Коины за тест уже начислены (+${row.coin_reward}).`
                  : 'Отличная работа!'
                : 'Порог сдачи — 50%. Спроси ментора про пересдачу.'}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-extrabold mb-2">Попытка завершена</h2>
            <p className="text-sm text-base-content/55 mb-6">{error}</p>
          </>
        )}
        <Link to="/tests" className="btn btn-neutral rounded-2xl gap-2">
          <ArrowLeft size={16} /> К списку тестов
        </Link>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="card bg-base-100 max-w-lg mx-auto mt-8 sm:mt-12 p-7 animate-scale-in">
        <h2 className="text-xl font-extrabold mb-3">{test?.title ?? 'Тест'}</h2>
        {error ? (
          <div className="rounded-xl bg-error/10 text-error text-sm font-semibold px-4 py-3 mb-5">{error}</div>
        ) : (
          <p className="text-sm text-base-content/55 mb-6 leading-relaxed">
            {test.questions.length} вопросов · {test.duration_min} минут
            {test.coin_reward > 0 && ` · +${test.coin_reward} коинов при результате ≥ 50%`}.
            <br />
            Таймер запустится сразу после старта — выйти и продолжить позже не получится без потери времени.
          </p>
        )}
        <div className="flex gap-2.5">
          <Link to="/tests" className="btn btn-ghost rounded-2xl">Назад</Link>
          {!error && (
            <Button className="flex-1" onClick={start} disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-sm" /> : 'Начать тест'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // phase === 'taking'
  const low = remaining !== null && remaining < 60;
  return (
    <div className="max-w-3xl mx-auto">
      <div className="sticky top-4 z-10 mb-5 flex items-center justify-between gap-4 rounded-2xl bg-neutral text-neutral-content px-5 py-3.5 shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <Timer size={20} className="shrink-0" />
          <b className="truncate">{test.title}</b>
        </div>
        <div className={`quiz-clock text-2xl font-extrabold ${low ? 'quiz-clock--low' : 'text-limebrand'}`}>
          {remaining !== null ? fmtDuration(remaining) : '—'}
        </div>
      </div>

      <div className="space-y-4">
        {test.questions.map((q, qi) => (
          <div key={qi} className="card bg-base-100 p-5">
            <div className="flex gap-3 mb-4">
              <span className="shrink-0 h-6 min-w-6 px-2 rounded-full bg-primary text-primary-content text-xs font-extrabold grid place-items-center tabular-nums">
                {qi + 1}
              </span>
              <p className="font-bold text-[15px] leading-snug pt-0.5">{q.q}</p>
            </div>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                return (
                  <label
                    key={oi}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer text-sm transition-colors ${
                      selected ? 'border-primary bg-primary/8 font-semibold' : 'border-base-300 bg-base-200/40 hover:bg-base-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q${qi}`}
                      className="radio radio-primary radio-sm"
                      checked={selected}
                      onChange={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-base-100 mt-4 p-4 flex-row items-center justify-between gap-4 sticky bottom-4 sm:static">
        <span className="text-sm text-base-content/55">
          Отвечено: <b className="tabular-nums text-base-content">{answered}/{test.questions.length}</b>
        </span>
        <Button onClick={() => submit(false)} disabled={busy}>
          {busy ? <span className="loading loading-spinner loading-sm" /> : 'Завершить тест'}
        </Button>
      </div>
    </div>
  );
}
