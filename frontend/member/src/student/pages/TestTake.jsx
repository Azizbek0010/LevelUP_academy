import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Timer, ArrowLeft } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { Skeleton, Button, CountUp, Ring, C } from '../components/ui.jsx';
import { fmtDuration } from '../format.js';
import { fmt, useI18n } from '../../i18n/index.jsx';

/**
 * Прохождение теста: intro → start (таймер от сервера) → вопросы → submit → результат.
 * Если попытка уже начата (перезагрузка страницы) — таймер восстанавливается
 * из started_at + duration_min строки списка тестов.
 */
export default function TestTake() {
  const { testId } = useParams();
  const toast = useToast();
  const { t } = useI18n();

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
        if (!auto) {
          toast(d.data.score >= 50 ? t.testTake.testPassed : t.testTake.testFailed, d.data.score >= 50 ? 'success' : 'error');
        }
      } catch (err) {
        if (err.status === 409) {
          setError(err.message === 'Time is up' ? t.testTake.timeUp : err.message);
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
      <div className="k-card k-pop-in max-w-md mx-auto mt-8 sm:mt-12 p-8 text-center">
        {score !== null ? (
          <>
            <div className="flex justify-center mb-[18px]">
              <Ring percent={score} size={132} thickness={14} color={score >= 50 ? C.teal : C.coral}>
                <span className="k-num text-[30px]" style={{ color: score >= 50 ? C.teal : C.coral }}>
                  <CountUp value={score} />%
                </span>
              </Ring>
            </div>
            <h2 className="text-xl font-extrabold mb-2" style={{ color: C.text }}>{score >= 50 ? t.testTake.testPassed : t.testTake.testFailed}</h2>
            <p className="text-sm font-semibold mb-6" style={{ color: C.muted }}>
              {score >= 50
                ? row?.coin_reward > 0
                  ? fmt(t.testTake.coinsEarned, { n: row.coin_reward })
                  : t.testTake.greatJob
                : t.testTake.retakeClosed}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-extrabold mb-2" style={{ color: C.text }}>{t.testTake.attemptDone}</h2>
            <p className="text-sm font-semibold mb-6" style={{ color: C.muted }}>{error}</p>
          </>
        )}
        <Link
          to="/tests"
          className="k-press inline-flex items-center justify-center gap-2 font-extrabold px-5 py-3 text-[14.5px] rounded-2xl"
          style={{ background: C.violet, color: '#fff', boxShadow: '0 4px 0 #5C34E0' }}
        >
          <ArrowLeft size={16} /> {t.testTake.toList}
        </Link>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="k-card k-pop-in max-w-lg mx-auto mt-8 sm:mt-12 p-7">
        <h2 className="text-xl font-extrabold mb-3" style={{ color: C.text }}>{test?.title ?? t.testTake.title}</h2>
        {error ? (
          <div className="rounded-2xl text-sm font-semibold px-4 py-3 mb-5" style={{ background: '#FFE6E2', color: '#C23018' }}>{error}</div>
        ) : (
          <p className="text-sm font-semibold mb-6 leading-relaxed" style={{ color: C.muted }}>
            {fmt(t.testTake.questions, { n: test.questions.length, minutes: test.duration_min })}
            {test.coin_reward > 0 && ` · ${fmt(t.testTake.reward, { n: test.coin_reward })}`}.
            <br />
            {t.testTake.timerNotice}
          </p>
        )}
        <div className="flex gap-2.5">
          <Link to="/tests" className="k-press-sm px-5 py-2.5 rounded-2xl text-[14.5px] font-extrabold" style={{ color: C.muted }}>{t.testTake.back}</Link>
          {!error && (
            <Button className="flex-1" onClick={start} disabled={busy}>
              {busy ? <span className="loading loading-spinner loading-sm" /> : t.testTake.start}
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
      <div
        className="sticky top-4 z-10 mb-5 flex items-center justify-between gap-4 rounded-2xl px-5 py-3.5"
        style={{ background: C.ink, color: '#fff', boxShadow: '0 10px 24px rgba(60,40,10,0.18)' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Timer size={20} className="shrink-0" />
          <b className="truncate">{test.title}</b>
        </div>
        <div className="k-num text-2xl" style={{ color: low ? C.coral : C.lime }}>
          {remaining !== null ? fmtDuration(remaining) : '—'}
        </div>
      </div>

      <div className="space-y-4">
        {test.questions.map((q, qi) => (
          <div
            key={qi}
            className="k-pop-in k-card p-5"
            style={{ animationDelay: `${Math.min(qi, 9) * 50}ms` }}
          >
            <div className="flex gap-3 mb-4">
              <span
                className="shrink-0 h-6 min-w-6 px-2 rounded-full text-xs font-extrabold grid place-items-center tabular-nums"
                style={{ background: C.lime, color: C.ink }}
              >
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
                    className={`k-press flex items-center gap-3 rounded-2xl px-4 py-3 cursor-pointer text-sm transition-colors ${selected ? 'font-extrabold' : 'font-semibold'}`}
                    style={selected ? { background: '#FFF1CE', color: '#8A5F00' } : { background: C.bg, color: C.text }}
                  >
                    <input
                      type="radio"
                      name={`q${qi}`}
                      className="radio radio-sm"
                      checked={selected}
                      onChange={() => setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)))}
                      style={{ accentColor: C.lime }}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="k-card mt-4 p-4 flex items-center justify-between gap-4 sticky bottom-4 sm:static">
        <span className="text-sm font-bold" style={{ color: C.muted }}>
          {t.testTake.answered}: <b className="k-num" style={{ color: C.text }}><CountUp value={answered} />/{test.questions.length}</b>
        </span>
        <Button onClick={() => submit(false)} disabled={busy}>
          {busy ? <span className="loading loading-spinner loading-sm" /> : t.testTake.finish}
        </Button>
      </div>
    </div>
  );
}
