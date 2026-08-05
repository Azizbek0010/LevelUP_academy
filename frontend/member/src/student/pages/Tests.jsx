import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Coins, ChevronRight } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { PageHeader, Skeleton, EmptyState, ErrorState, Pill, IconTile, C } from '../components/ui.jsx';
import { fmtDateTime } from '../format.js';

/** Статус теста для студента по данным списка. */
export function testStatus(t) {
  const now = Date.now();
  if (t.finished_at) return { key: 'done', label: `Сдан · ${t.score}%`, hue: t.score >= 50 ? 'teal' : 'coral' };
  if (t.started_at) return { key: 'inProgress', label: 'В процессе', hue: 'lime' };
  if (t.starts_at && now < new Date(t.starts_at).getTime())
    return { key: 'scheduled', label: `Откроется ${fmtDateTime(t.starts_at)}`, hue: 'muted' };
  if (t.ends_at && now > new Date(t.ends_at).getTime())
    return { key: 'closed', label: 'Закрыт', hue: 'muted' };
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
        <div className="k-card">
          <EmptyState icon={ClipboardCheck} title="Тестов пока нет" text="Ментор ещё не назначил тесты твоим группам." />
        </div>
      ) : (
        <div className="k-card divide-y" style={{ borderColor: C.line }}>
          {tests.map((t, i) => {
            const st = testStatus(t);
            const clickable = st.key === 'open' || st.key === 'inProgress' || st.key === 'done';
            return (
              <div
                key={t.id}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => navigate(`/tests/${t.id}`) : undefined}
                onKeyDown={clickable ? (e) => (e.key === 'Enter' || e.key === ' ') && navigate(`/tests/${t.id}`) : undefined}
                className={`k-pop-in flex items-center gap-3 px-4 py-3.5 transition-colors ${clickable ? 'k-press cursor-pointer hover:bg-[#FFF6E9]' : ''}`}
                style={{ animationDelay: `${Math.min(i, 9) * 50}ms` }}
              >
                <IconTile icon={ClipboardCheck} hue="blue" size={42} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-extrabold truncate" style={{ color: C.text }}>{t.title}</div>
                  <div className="text-xs font-bold mt-0.5 flex items-center gap-1 flex-wrap" style={{ color: C.muted }}>
                    <span>{t.questions.length} вопросов · {t.duration_min} мин</span>
                    {t.coin_reward > 0 && (
                      <span className="inline-flex items-center gap-0.5 font-bold" style={{ color: C.limeDk }}>
                        · <Coins size={12} /> +{t.coin_reward}
                      </span>
                    )}
                  </div>
                </div>
                <Pill hue={st.hue}>{st.label}</Pill>
                {clickable && <ChevronRight size={16} className="shrink-0" style={{ color: C.muted }} />}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
