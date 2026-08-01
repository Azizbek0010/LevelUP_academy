import { useEffect, useState, useCallback } from 'react';
import { Trophy, Star } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../../auth.jsx';
import { useToast } from '../components/toast.jsx';
import { PageHeader, Skeleton, EmptyState, ErrorState, Tabs, Avatar, CountUp, C } from '../components/ui.jsx';

// Медаль — цветной бейдж с номером места, как в мини-рейтинге на Home.jsx.
const MEDAL_COLORS = { 1: C.amber, 2: '#C9BEDB', 3: '#D9A574' };

function LeaderRow({ r, me, delay = 0 }) {
  const medal = MEDAL_COLORS[r.rank];
  return (
    <div
      className="k-pop-in flex items-center gap-3 px-4 sm:px-5 py-2.5"
      style={{ animationDelay: `${delay}ms`, background: me ? '#FFF7E2' : undefined }}
    >
      <span
        className="w-8 h-8 rounded-2xl grid place-items-center k-num text-[13.5px] shrink-0"
        style={medal ? { background: medal, color: '#fff' } : { background: C.bg, color: C.muted }}
      >
        {r.rank}
      </span>
      <Avatar name={`${r.firstName ?? ''} ${r.lastName ?? ''}`} size={34} />
      <div className="min-w-0 flex-1">
        <div className="text-[14.5px] font-extrabold truncate" style={{ color: C.text }}>
          {r.firstName} {r.lastName}
          {me && <span className="ml-1.5" style={{ color: C.limeDk }}>· ты</span>}
        </div>
      </div>
      <span className="k-num text-[15px] flex items-center gap-1.5 shrink-0" style={{ color: C.text }}>
        <CountUp value={Number(r.coins) || 0} />
        <Star size={13} strokeWidth={2.6} fill={C.lime} style={{ color: C.lime }} />
      </span>
    </div>
  );
}

export default function Leaderboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [period, setPeriod] = useState('week');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setData(null);
    setError(null);
    api
      .leaderboard(period)
      .then((d) => setData(d.data))
      .catch((err) => { setError(err); toast(err.message, 'error'); });
  }, [period, toast]);

  useEffect(() => { load(); }, [load]);

  const inTop = data?.top?.some((r) => r.studentId === user?.id);

  return (
    <>
      <PageHeader
        title="Лидерборд"
        subtitle="Топ студентов филиала по заработанным коинам"
        actions={
          <Tabs
            value={period}
            onChange={setPeriod}
            items={[{ value: 'week', label: 'Неделя' }, { value: 'month', label: 'Месяц' }]}
          />
        }
      />

      {error ? (
        <ErrorState message={error.message} onRetry={load} />
      ) : !data ? (
        <Skeleton h={64} count={5} />
      ) : data.top.length === 0 ? (
        <div className="k-card">
          <EmptyState
            icon={Trophy}
            hue="amber"
            title="Рейтинг пока пуст"
            text="Никто ещё не заработал коины за этот период. Будь первым!"
          />
        </div>
      ) : (
        <div className="k-card py-2 max-w-2xl">
          {data.top.map((r, i) => (
            <LeaderRow key={r.studentId} r={r} me={r.studentId === user?.id} delay={Math.min(i, 9) * 50} />
          ))}

          {!inTop && data.me?.rank && (
            <div className="pt-2 mt-1" style={{ borderTop: `1px solid ${C.line}` }}>
              <LeaderRow
                r={{ rank: data.me.rank, firstName: user?.firstName, lastName: user?.lastName, coins: data.me.coins }}
                me
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
