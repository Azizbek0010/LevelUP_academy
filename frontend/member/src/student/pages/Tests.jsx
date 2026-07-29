import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Coins, ChevronRight } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { PageHeader, Skeleton, EmptyState, ErrorState, Pill } from '../components/ui.jsx';
import { fmtDateTime } from '../format.js';

/** Статус теста для студента по данным списка. */
export function testStatus(t) {
  const now = Date.now();
  if (t.finished_at) return { key: 'done', label: `Сдан · ${t.score}%`, hue: t.score >= 50 ? 'grass' : 'coral' };
  if (t.started_at) return { key: 'inProgress', label: 'В процессе', hue: 'sky' };
  if (t.starts_at && now < new Date(t.starts_at).getTime())
    return { key: 'scheduled', label: `Откроется ${fmtDateTime(t.starts_at)}`, hue: 'slate' };
  if (t.ends_at && now > new Date(t.ends_at).getTime())
    return { key: 'closed', label: 'Закрыт', hue: 'slate' };
  return { key: 'open', label: 'Доступен', hue: 'lime' };
}

export default function Tests() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tests, setTests] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    api
      .tests()
      .then((d) => setTests(d.data))
      .catch((err) => { setError(err); toast(err.message, 'error'); });
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageHeader title="Тесты" subtitle="Сдай тест на 50% и выше — получишь коины" />

      {error ? (
        <ErrorState message={error.message} onRetry={load} />
      ) : !tests ? (
        <Skeleton h={72} count={4} />
      ) : tests.length === 0 ? (
        <div className="card bg-base-100">
          <EmptyState icon={ClipboardCheck} title="Тестов пока нет" text="Ментор ещё не назначил тесты твоим группам." />
        </div>
      ) : (
        <div className="card bg-base-100 divide-y divide-base-200">
          {tests.map((t) => {
            const st = testStatus(t);
            const clickable = st.key === 'open' || st.key === 'inProgress' || st.key === 'done';
            return (
              <div
                key={t.id}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => navigate(`/tests/${t.id}`) : undefined}
                onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/tests/${t.id}`) : undefined}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${clickable ? 'cursor-pointer hover:bg-base-200/60' : ''}`}
              >
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <ClipboardCheck size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{t.title}</div>
                  <div className="text-xs text-base-content/45 mt-0.5 flex items-center gap-1 flex-wrap">
                    <span>{t.questions.length} вопросов · {t.duration_min} мин</span>
                    {t.coin_reward > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-primary font-semibold">
                        · <Coins size={12} /> +{t.coin_reward}
                      </span>
                    )}
                  </div>
                </div>
                <Pill hue={st.hue}>{st.label}</Pill>
                {clickable && <ChevronRight size={16} className="text-base-content/25 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
