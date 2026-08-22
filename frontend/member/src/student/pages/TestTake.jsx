import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import {
  Skeleton,
  Button,
  CountUp,
  Ring,
  C,
  TestTimer,
  QuestionProgress,
  ExitConfirmModal,
  ResumeTestBanner,
} from '../components/ui.jsx';
import { fmtDuration } from '../format.js';
import { fmt, useI18n } from '../../i18n/index.jsx';
import { useTestSecurity } from '../../hooks/useTestSecurity.js';

const STORAGE_KEY = (testId) => `test_${testId}_answers`;
const STARTED_KEY = (testId) => `test_${testId}_started`;

function loadSavedAnswers(testId) {
  if (!testId) return null;
  try {
    const data = localStorage.getItem(STORAGE_KEY(testId));
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('Load saved answers failed:', e);
  }
  return null;
}

function clearSavedAnswers(testId) {
  if (!testId) return;
  localStorage.removeItem(STORAGE_KEY(testId));
  localStorage.removeItem(STARTED_KEY(testId));
}

function markTestStarted(testId) {
  if (!testId) return;
  localStorage.setItem(STARTED_KEY(testId), 'true');
}

function isTestStarted(testId) {
  if (!testId) return false;
  return localStorage.getItem(STARTED_KEY(testId)) === 'true';
}

/**
 * Прохождение теста: intro → start (таймер от сервера) → вопросы → submit → результат.
 * Если попытка уже начата (перезагрузка страницы) — таймер восстанавливается
 * из started_at + duration_min строки списка тестов.
 * Новые фичи: anti-cheat, auto-save, resume, fullscreen block, tab switch detection.
 */
export default function TestTake() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useI18n();

  const [test, setTest] = useState(null);
  const [row, setRow] = useState(null);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState('loading');
  const [endsAt, setEndsAt] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(null);
  const [busy, setBusy] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const submittedRef = useRef(false);

  const savedData = loadSavedAnswers(testId);
  const testStartedLocally = isTestStarted(testId);

  const security = useTestSecurity({
    testId,
    phase,
    endsAt,
    answers,
    submit: handleSubmit,
    onExit: () => navigate('/tests'),
  });

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

        if (listRow?.started_at) {
          const deadline = new Date(listRow.started_at).getTime() + one.data.duration_min * 60_000;
          const capped = one.data.ends_at ? Math.min(deadline, new Date(one.data.ends_at).getTime()) : deadline;
          setEndsAt(capped);
          setPhase('taking');
          if (savedData?.answers?.length === one.data.questions.length) {
            setAnswers(savedData.answers);
            setShowResumeBanner(true);
          } else {
            setAnswers(new Array(one.data.questions.length).fill(-1));
          }
        } else {
          setPhase('intro');
          if (testStartedLocally && savedData?.answers?.length === one.data.questions.length) {
            setAnswers(savedData.answers);
            setShowResumeBanner(true);
          } else {
            setAnswers(new Array(one.data.questions.length).fill(-1));
          }
        }
      })
      .catch((err) => {
        setError(err.message);
        setPhase('intro');
      });
  }, [testId]);

  const handleSubmit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      security.setSubmittedRef(true);
      setBusy(true);
      try {
        const d = await api.submitTest(testId, answers);
        setScore(d.data.score);
        setPhase('done');
        if (!auto) {
          toast(d.data.score >= 50 ? t.testTake.testPassed : t.testTake.testFailed, d.data.score >= 50 ? 'success' : 'error');
        }
        clearSavedAnswers(testId);
      } catch (err) {
        if (err.status === 409) {
          setError(err.message === 'Time is up' ? t.testTake.timeUp : err.message);
          setPhase('done');
          setScore(null);
        } else {
          submittedRef.current = false;
          security.setSubmittedRef(false);
          toast(err.message, 'error');
        }
      } finally {
        setBusy(false);
      }
    },
    [testId, answers, toast, security],
  );

  useEffect(() => {
    if (phase !== 'taking' || !endsAt) return undefined;
    const tick = () => {
      const left = Math.floor((endsAt - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0) handleSubmit(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phase, endsAt, handleSubmit]);

  const start = async () => {
    setBusy(true);
    try {
      const d = await api.startTest(testId);
      setEndsAt(new Date(d.data.endsAt).getTime());
      setPhase('taking');
      markTestStarted(testId);
      setShowResumeBanner(false);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const resumeTest = () => {
    setShowResumeBanner(false);
    if (phase === 'intro') {
      start();
    }
  };

  const restartTest = () => {
    clearSavedAnswers(testId);
    setAnswers(new Array(test?.questions?.length ?? 0).fill(-1));
    setShowResumeBanner(false);
  };

  const handleExitClick = () => {
    if (phase === 'intro') {
      security.handleExitClick();
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

        {showResumeBanner && test && (
          <ResumeTestBanner
            testTitle={test.title}
            onResume={resumeTest}
            onRestart={restartTest}
          />
        )}

        {error ? (
          <div className="rounded-2xl text-sm font-semibold px-4 py-3 mb-5" style={{ background: '#FFE6E2', color: '#C23018' }}>{error}</div>
        ) : (
          <p className="text-sm font-semibold mb-6 leading-relaxed" style={{ color: C.muted }}>
            {fmt(t.testTake.questions, { n: test?.questions?.length ?? 0, minutes: test?.duration_min ?? 0 })}
            {test?.coin_reward > 0 && ` · ${fmt(t.testTake.reward, { n: test.coin_reward })}`}.
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
          {!error && !busy && (
            <Button hue="coral" onClick={handleExitClick} className="px-5 py-2.5">
              {t.testTake.exit}
            </Button>
          )}
        </div>

        <ExitConfirmModal
          isOpen={security.showExitModal}
          onClose={security.cancelExit}
          onConfirm={security.confirmExit}
          title={t.testTake.exitConfirmTitle}
          message={t.testTake.exitConfirmMessage}
          confirmText={t.testTake.exitConfirmYes}
          cancelText={t.testTake.exitConfirmNo}
        />
      </div>
    );
  }

  const handleAnswerChange = useCallback((qi, oi) => {
    setAnswers((prev) => prev.map((a, i) => (i === qi ? oi : a)));
    setCurrentQuestion(qi + 1);
  }, []);

  const handleJumpToQuestion = useCallback((index) => {
    setCurrentQuestion(index + 1);
  }, []);

  return (
    <div className="max-w-3xl mx-auto" style={{ userSelect: 'none', webkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}>
      <TestTimer remaining={remaining} endsAt={endsAt} />

      <QuestionProgress
        current={currentQuestion}
        total={test?.questions?.length ?? 0}
        answered={answered}
        onJump={handleJumpToQuestion}
      />

      <div className="space-y-4">
        {test?.questions?.map((q, qi) => (
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
              {q.options?.map((opt, oi) => {
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
                      onChange={() => handleAnswerChange(qi, oi)}
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
          {t.testTake.answered}: <b className="k-num" style={{ color: C.text }}><CountUp value={answered} />/{test?.questions?.length ?? 0}</b>
        </span>
        <Button onClick={() => handleSubmit(false)} disabled={busy}>
          {busy ? <span className="loading loading-spinner loading-sm" /> : t.testTake.finish}
        </Button>
      </div>

      <ExitConfirmModal
        isOpen={security.showExitModal}
        onClose={security.cancelExit}
        onConfirm={security.confirmExit}
        title={t.testTake.exitConfirmTitle}
        message={t.testTake.exitConfirmMessage}
        confirmText={t.testTake.exitConfirmYes}
        cancelText={t.testTake.exitConfirmNo}
      />
    </div>
  );
}