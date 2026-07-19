import { useState } from 'react';
import {
  FileText, Plus, Trash2, X, Check, Clock, Coins, Users, ChevronRight, AlertCircle,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../../auth.jsx';
import { api } from '../../../api.js';
import { useMentorTests, useMentorTestResults } from '../../../queries.js';
import { EmptyState, Panel, RowSkeleton } from '../_ui.jsx';

/**
 * Тесты группы: конструктор + список + результаты.
 *
 * Контракт бэкенда (POST /api/mentor/tests/groups/:groupId):
 *   { title, questions: [{ q, options[≥2], correct }], durationMin, startsAt?, endsAt?, coinReward }
 * `correct` — индекс правильного варианта внутри options.
 *
 * Редактирования и удаления теста у бэкенда пока НЕТ — только создание, список
 * и результаты, поэтому в UI этих действий сознательно нет (кнопка, ведущая в
 * 404, хуже её отсутствия).
 */

const emptyQuestion = () => ({ q: '', options: ['', ''], correct: 0 });

function QuestionEditor({ index, question, onChange, onRemove, canRemove }) {
  const setField = (patch) => onChange({ ...question, ...patch });

  const setOption = (i, value) => {
    const options = [...question.options];
    options[i] = value;
    setField({ options });
  };

  const addOption = () => setField({ options: [...question.options, ''] });

  const removeOption = (i) => {
    if (question.options.length <= 2) return; // минимум 2 — требование схемы
    const options = question.options.filter((_, idx) => idx !== i);
    // правильный ответ мог съехать или исчезнуть
    let correct = question.correct;
    if (correct === i) correct = 0;
    else if (correct > i) correct -= 1;
    setField({ options, correct });
  };

  return (
    <div className="rounded-xl border border-base-300 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-base-content/50">SAVOL {index + 1}</span>
        {canRemove && (
          <button
            className="btn btn-ghost btn-xs text-error"
            onClick={onRemove}
            aria-label={`${index + 1}-savolni o'chirish`}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <input
        className="input input-bordered input-sm w-full mb-3"
        placeholder="Savol matni"
        value={question.q}
        maxLength={1000}
        onChange={(e) => setField({ q: e.target.value })}
      />

      <div className="space-y-2">
        {question.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setField({ correct: i })}
              className={`w-6 h-6 rounded-full border-2 grid place-items-center shrink-0 transition-colors ${
                question.correct === i
                  ? 'bg-success border-success text-white'
                  : 'border-base-300 hover:border-success/50'
              }`}
              title="To'g'ri javob deb belgilash"
              aria-label={`${i + 1}-variantni to'g'ri deb belgilash`}
            >
              {question.correct === i && <Check size={13} />}
            </button>
            <input
              className="input input-bordered input-sm flex-1"
              placeholder={`${i + 1}-variant`}
              value={opt}
              maxLength={300}
              onChange={(e) => setOption(i, e.target.value)}
            />
            {question.options.length > 2 && (
              <button
                className="btn btn-ghost btn-xs"
                onClick={() => removeOption(i)}
                aria-label={`${i + 1}-variantni o'chirish`}
              >
                <X size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      <button className="btn btn-ghost btn-xs mt-2 gap-1" onClick={addOption}>
        <Plus size={12} /> Variant qo'shish
      </button>
    </div>
  );
}

function ResultsPanel({ testId, onClose }) {
  const { data, isLoading } = useMentorTestResults(testId);
  const results = data?.data ?? [];

  const finished = results.filter((r) => r.finished_at);
  const avg = finished.length
    ? Math.round(finished.reduce((s, r) => s + (r.score ?? 0), 0) / finished.length * 10) / 10
    : null;

  return (
    <Panel
      title="Natijalar"
      icon={Users}
      bodyClass="p-4"
      action={
        <button className="btn btn-ghost btn-xs btn-circle" onClick={onClose} aria-label="Yopish">
          <X size={15} />
        </button>
      }
    >
      {isLoading ? (
        <RowSkeleton count={3} height="h-11" />
      ) : results.length === 0 ? (
        <EmptyState icon={Users} title="Hali hech kim testni ishlamagan" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl bg-base-200/60 px-3 py-2.5">
              <div className="text-[11px] uppercase tracking-wider text-base-content/45 font-semibold">
                Ishladi
              </div>
              <div className="text-lg font-extrabold tabular-nums mt-0.5">
                {finished.length}<span className="text-base-content/40">/{results.length}</span>
              </div>
            </div>
            <div className="rounded-xl bg-base-200/60 px-3 py-2.5">
              <div className="text-[11px] uppercase tracking-wider text-base-content/45 font-semibold">
                O'rtacha ball
              </div>
              <div className="text-lg font-extrabold tabular-nums mt-0.5">
                {avg !== null ? avg : '—'}
              </div>
            </div>
          </div>

          <ul className="divide-y divide-base-200">
            {results.map((r) => {
              const done = !!r.finished_at;
              const pct = done && r.max_score ? Math.round((r.score / r.max_score) * 100) : null;
              return (
                <li key={r.student_id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm truncate">{r.first_name} {r.last_name}</span>
                  {done ? (
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold tabular-nums">{r.score}/{r.max_score}</span>
                      <span
                        className={`badge badge-sm ${
                          pct >= 80 ? 'badge-success' : pct >= 50 ? 'badge-warning' : 'badge-error'
                        }`}
                      >
                        {pct}%
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-base-content/40 shrink-0">Ishlamagan</span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}

export default function TestsTab({ groupId }) {
  const { token } = useAuth();
  const qc = useQueryClient();

  const [creating, setCreating] = useState(false);
  const [openResultsFor, setOpenResultsFor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState(20);
  const [coinReward, setCoinReward] = useState(0);
  const [questions, setQuestions] = useState([emptyQuestion()]);

  const { data: testsData, isLoading: testsLoading } = useMentorTests(groupId);
  const tests = testsData?.data ?? [];

  const resetForm = () => {
    setTitle('');
    setDurationMin(20);
    setCoinReward(0);
    setQuestions([emptyQuestion()]);
    setFormError('');
  };

  /** Проверяем ровно то, что проверит zod на бэкенде — чтобы не ловить 422. */
  const validate = () => {
    if (!title.trim()) return 'Test nomini kiriting';
    if (!Number(durationMin) || Number(durationMin) < 1) return 'Davomiylikni kiriting (daqiqa)';
    if (questions.length === 0) return 'Kamida bitta savol kerak';

    for (let i = 0; i < questions.length; i += 1) {
      const q = questions[i];
      if (!q.q.trim()) return `${i + 1}-savol matni bo'sh`;
      if (q.options.length < 2) return `${i + 1}-savolda kamida 2 ta variant kerak`;
      if (q.options.some((o) => !o.trim())) return `${i + 1}-savolda bo'sh variant bor`;
      if (q.correct < 0 || q.correct >= q.options.length) {
        return `${i + 1}-savolda to'g'ri javob belgilanmagan`;
      }
    }
    return '';
  };

  const handleCreate = async () => {
    const problem = validate();
    if (problem) { setFormError(problem); return; }

    setSaving(true);
    setFormError('');
    try {
      await api.mentorCreateTest(token, groupId, {
        title: title.trim(),
        durationMin: Number(durationMin),
        coinReward: Number(coinReward) || 0,
        questions: questions.map((q) => ({
          q: q.q.trim(),
          options: q.options.map((o) => o.trim()),
          correct: q.correct,
        })),
      });
      qc.invalidateQueries({ queryKey: ['mentor-tests', groupId] });
      resetForm();
      setCreating(false);
      setOpenResultsFor(null); // иначе всплыла бы панель результатов прошлого теста
    } catch (err) {
      setFormError(err.message || 'Testni saqlab bo\'lmadi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 overflow-y-auto flex-1 min-h-0">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        {/* ---------- Список тестов ---------- */}
        <div className={openResultsFor || creating ? 'lg:col-span-2' : 'lg:col-span-5'}>
          <Panel
            title="Testlar"
            icon={FileText}
            bodyClass="p-3"
            action={
              !creating && (
                <button className="btn btn-primary btn-xs gap-1" onClick={() => setCreating(true)}>
                  <Plus size={13} /> Yangi test
                </button>
              )
            }
          >
            {testsLoading ? (
              <RowSkeleton count={2} height="h-16" />
            ) : tests.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Bu guruhda hali test yo'q"
                hint="«Yangi test» tugmasi orqali birinchisini yarating."
                action={
                  <button className="btn btn-sm btn-primary gap-1.5" onClick={() => setCreating(true)}>
                    <Plus size={14} /> Yangi test
                  </button>
                }
              />
            ) : (
              <div className="space-y-2">
                {tests.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setOpenResultsFor(t.id); setCreating(false); }}
                    aria-current={openResultsFor === t.id ? 'true' : undefined}
                    className={`w-full text-left rounded-xl border p-3.5 transition-colors ${
                      openResultsFor === t.id
                        ? 'border-primary bg-primary/5'
                        : 'border-base-200 hover:bg-base-200/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate">{t.title}</div>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-base-content/50">
                          <span className="flex items-center gap-1">
                            <FileText size={11} /> {t.questions?.length ?? 0} savol
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {t.duration_min} daq
                          </span>
                          {t.coin_reward > 0 && (
                            <span className="flex items-center gap-1">
                              <Coins size={11} /> {t.coin_reward}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-base-content/30 shrink-0 mt-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>
        </div>

        {/* ---------- Конструктор ---------- */}
        {creating && (
          <div className="lg:col-span-3">
            <Panel
              title="Yangi test"
              icon={Plus}
              bodyClass="p-4"
              action={
                <button
                  className="btn btn-ghost btn-xs btn-circle"
                  onClick={() => { setCreating(false); resetForm(); }}
                  aria-label="Yopish"
                >
                  <X size={15} />
                </button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                <label className="form-control sm:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
                    Test nomi
                  </span>
                  <input
                    className="input input-bordered input-sm"
                    placeholder="Masalan: Present Simple"
                    value={title}
                    maxLength={200}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label className="form-control">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
                    Davomiyligi (daq)
                  </span>
                  <input
                    type="number"
                    min="1"
                    className="input input-bordered input-sm tabular-nums"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                  />
                </label>
                <label className="form-control">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 mb-1.5">
                    Coin mukofoti
                  </span>
                  <input
                    type="number"
                    min="0"
                    className="input input-bordered input-sm tabular-nums"
                    value={coinReward}
                    onChange={(e) => setCoinReward(e.target.value)}
                  />
                </label>
              </div>

              <div className="space-y-3">
                {questions.map((q, i) => (
                  <QuestionEditor
                    key={i}
                    index={i}
                    question={q}
                    canRemove={questions.length > 1}
                    onChange={(next) =>
                      setQuestions((prev) => prev.map((item, idx) => (idx === i ? next : item)))}
                    onRemove={() =>
                      setQuestions((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>

              <button
                className="btn btn-outline btn-sm gap-1.5 mt-3"
                onClick={() => setQuestions((prev) => [...prev, emptyQuestion()])}
              >
                <Plus size={14} /> Savol qo'shish
              </button>

              {formError && (
                <div className="flex items-center gap-2 mt-4 text-xs text-error">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setCreating(false); resetForm(); }}
                >
                  Bekor qilish
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
                  {saving
                    ? <span className="loading loading-spinner loading-xs" />
                    : <Check size={15} />}
                  Saqlash
                </button>
              </div>
            </Panel>
          </div>
        )}

        {/* ---------- Результаты ---------- */}
        {openResultsFor && !creating && (
          <div className="lg:col-span-3">
            <ResultsPanel testId={openResultsFor} onClose={() => setOpenResultsFor(null)} />
          </div>
        )}
      </div>
    </div>
  );
}
