import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Coins } from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { Skeleton, EmptyState } from '../components/ui.jsx';
import { fmtDateTime } from '../format.js';

/** Статус теста для студента по данным списка. */
export function testStatus(t) {
  const now = Date.now();
  if (t.finished_at) return { key: 'done', label: `Сдан · ${t.score}%`, pill: t.score >= 50 ? 'pill--success' : 'pill--danger' };
  if (t.started_at) return { key: 'inProgress', label: 'В процессе', pill: 'pill--lime' };
  if (t.starts_at && now < new Date(t.starts_at).getTime())
    return { key: 'scheduled', label: `Откроется ${fmtDateTime(t.starts_at)}`, pill: 'pill--muted' };
  if (t.ends_at && now > new Date(t.ends_at).getTime())
    return { key: 'closed', label: 'Закрыт', pill: 'pill--muted' };
  return { key: 'open', label: 'Доступен', pill: 'pill--lime' };
}

export default function Tests() {
  const navigate = useNavigate();
  const toast = useToast();
  const [tests, setTests] = useState(null);

  useEffect(() => {
    api
      .tests()
      .then((d) => setTests(d.data))
      .catch((err) => toast(err.message, 'error'));
  }, [toast]);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Тесты</h1>
          <p>Сдай тест на 50% и выше — получишь коины</p>
        </div>
      </div>

      {!tests ? (
        <Skeleton h={72} count={4} />
      ) : tests.length === 0 ? (
        <div className="card">
          <EmptyState icon={ClipboardCheck} title="Тестов пока нет" text="Ментор ещё не назначил тесты твоим группам." />
        </div>
      ) : (
        <div className="card">
          {tests.map((t) => {
            const st = testStatus(t);
            const clickable = st.key === 'open' || st.key === 'inProgress' || st.key === 'done';
            return (
              <div
                key={t.id}
                className={`row${clickable ? ' row--clickable' : ''}`}
                onClick={clickable ? () => navigate(`/tests/${t.id}`) : undefined}
              >
                <div className="row__body">
                  <div className="row__title">{t.title}</div>
                  <div className="row__sub">
                    {t.questions.length} вопросов · {t.duration_min} мин
                    {t.coin_reward > 0 && (
                      <>
                        {' · '}
                        <Coins size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> +{t.coin_reward}
                      </>
                    )}
                  </div>
                </div>
                <span className={`pill ${st.pill}`}>{st.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
