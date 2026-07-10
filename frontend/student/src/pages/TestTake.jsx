import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Timer, ArrowLeft } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { Skeleton } from '../components/ui.jsx';
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
      <div className="card" style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
        {score !== null ? (
          <>
            <div className="score-ring" style={{ '--score': score }}>
              <span className="num">{score}%</span>
            </div>
            <h2 style={{ marginBottom: 8 }}>{score >= 50 ? 'Тест сдан! 🎉' : 'Тест не сдан'}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
              {score >= 50
                ? row?.coin_reward > 0
                  ? `Коины за тест уже начислены (+${row.coin_reward}).`
                  : 'Отличная работа!'
                : 'Порог сдачи — 50%. Спроси ментора про пересдачу.'}
            </p>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: 8 }}>Попытка завершена</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{error}</p>
          </>
        )}
        <Link to="/tests" className="btn btn--dark">
          <ArrowLeft size={16} /> К списку тестов
        </Link>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="card" style={{ maxWidth: 520, margin: '40px auto' }}>
        <h2 style={{ marginBottom: 10 }}>{test?.title ?? 'Тест'}</h2>
        {error ? (
          <div className="form-error">{error}</div>
        ) : (
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            {test.questions.length} вопросов · {test.duration_min} минут
            {test.coin_reward > 0 && ` · +${test.coin_reward} коинов при результате ≥ 50%`}.
            <br />
            Таймер запустится сразу после старта — выйти и продолжить позже не получится без потери
            времени.
          </p>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/tests" className="btn btn--ghost">
            Назад
          </Link>
          {!error && (
            <button className="btn btn--accent" onClick={start} disabled={busy}>
              {busy ? 'Стартуем…' : 'Начать тест'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // phase === 'taking'
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="test-timer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Timer size={20} />
          <b>{test.title}</b>
        </div>
        <div className={`test-timer__clock${remaining !== null && remaining < 60 ? ' test-timer__clock--low' : ''}`}>
          {remaining !== null ? fmtDuration(remaining) : '—'}
        </div>
      </div>

      {test.questions.map((q, qi) => (
        <div key={qi} className="card question">
          <div className="question__text">
            <span className="question__n num">{qi + 1}</span>
            {q.q}
          </div>
          {q.options.map((opt, oi) => (
            <label key={oi} className={`option${answers[qi] === oi ? ' option--selected' : ''}`}>
              <input
                type="radio"
                name={`q${qi}`}
                checked={answers[qi] === oi}
                onChange={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Отвечено: <b className="num">{answered}/{test.questions.length}</b>
        </span>
        <button className="btn btn--accent" onClick={() => submit(false)} disabled={busy}>
          {busy ? 'Отправляем…' : 'Завершить тест'}
        </button>
      </div>
    </div>
  );
}
