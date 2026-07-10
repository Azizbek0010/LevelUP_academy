import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../components/toast.jsx';
import { Skeleton, EmptyState } from '../components/ui.jsx';
import { fmtNum, initials } from '../format.js';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

export default function Leaderboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    api
      .leaderboard(period)
      .then((d) => setData(d.data))
      .catch((err) => toast(err.message, 'error'));
  }, [period, toast]);

  const inTop = data?.top?.some((r) => r.studentId === user?.id);

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Лидерборд</h1>
          <p>Топ студентов филиала по заработанным коинам</p>
        </div>
        <div className="tabs">
          <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>
            Неделя
          </button>
          <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>
            Месяц
          </button>
        </div>
      </div>

      {!data ? (
        <Skeleton h={64} count={5} />
      ) : data.top.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Trophy}
            title="Рейтинг пока пуст"
            text="Никто ещё не заработал коины за этот период. Будь первым!"
          />
        </div>
      ) : (
        <div className="card" style={{ maxWidth: 640 }}>
          {data.top.map((r) => (
            <div key={r.studentId} className={`row${r.studentId === user?.id ? ' row--me' : ''}`}>
              <span className="row__place num">{MEDALS[r.rank] ?? r.rank}</span>
              <div className="avatar">{initials(r.firstName, r.lastName)}</div>
              <div className="row__body">
                <div className="row__title">
                  {r.firstName} {r.lastName}
                  {r.studentId === user?.id && ' (ты)'}
                </div>
              </div>
              <span className="row__score num">
                {fmtNum(r.coins)} <span>коинов</span>
              </span>
            </div>
          ))}

          {!inTop && data.me?.rank && (
            <div className="row row--me" style={{ marginTop: 16 }}>
              <span className="row__place num">{data.me.rank}</span>
              <div className="avatar">{initials(user?.firstName, user?.lastName)}</div>
              <div className="row__body">
                <div className="row__title">
                  {user?.firstName} {user?.lastName} (ты)
                </div>
              </div>
              <span className="row__score num">
                {fmtNum(data.me.coins)} <span>коинов</span>
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
