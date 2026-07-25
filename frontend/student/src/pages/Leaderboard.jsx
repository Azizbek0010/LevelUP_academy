import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../components/toast.jsx';
import { PageHeader, Skeleton, EmptyState, Tabs, Avatar } from '../components/ui.jsx';
import { fmtNum } from '../format.js';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

function LeaderRow({ r, me }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
      me ? 'border-primary/40 bg-primary/8' : 'border-base-200 bg-base-200/40'
    }`}>
      <span className="w-7 text-center font-extrabold text-[15px] tabular-nums shrink-0">
        {MEDALS[r.rank] ?? r.rank}
      </span>
      <Avatar name={`${r.firstName ?? ''} ${r.lastName ?? ''}`} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold truncate">
          {r.firstName} {r.lastName}{me && <span className="text-primary"> (ты)</span>}
        </div>
      </div>
      <span className="text-sm font-extrabold tabular-nums whitespace-nowrap">
        {fmtNum(r.coins)} <span className="text-primary font-bold">коинов</span>
      </span>
    </div>
  );
}

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

      {!data ? (
        <Skeleton h={64} count={5} />
      ) : data.top.length === 0 ? (
        <div className="card bg-base-100">
          <EmptyState
            icon={Trophy}
            title="Рейтинг пока пуст"
            text="Никто ещё не заработал коины за этот период. Будь первым!"
          />
        </div>
      ) : (
        <div className="card bg-base-100 p-3 max-w-2xl space-y-2">
          {data.top.map((r) => (
            <LeaderRow key={r.studentId} r={r} me={r.studentId === user?.id} />
          ))}

          {!inTop && data.me?.rank && (
            <div className="pt-2 mt-2 border-t border-base-200">
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
