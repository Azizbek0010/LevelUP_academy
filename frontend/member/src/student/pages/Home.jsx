import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Wallet, Trophy, Users, BookOpen, ArrowRight } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../../auth.jsx';
import { useToast } from '../components/toast.jsx';
import {
  StatCard, Panel, Pill, Skeleton, EmptyState, ErrorState,
} from '../components/ui.jsx';
import { fmtNum, fmtMoney, fmtDateTime, deadlineLabel } from '../format.js';

export default function Home() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .home()
      .then((d) => {
        if (!cancelled) setData(d.data);
      })
      .catch((err) => {
        if (cancelled) return;
        // без данных нельзя рисовать нули — они читаются как настоящий баланс/долг
        setError(err.message);
        toast(err.message, 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast, reloadKey]);

  const debt = Number(data?.totalDebt) || 0;

  // Формулировка баннера — только из настоящих данных (коины/место), без
  // выдуманных «уровней» и стриков, которых нет в модели данных.
  const heroText = data?.rank?.rank
    ? `Ты на ${data.rank.rank}-м месте в рейтинге филиала — так держать!`
    : 'Сдавай тесты и домашки, зарабатывай коины и поднимайся в рейтинге';

  return (
    <>
      <div
        className="rounded-3xl p-6 sm:p-7 mb-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(120deg, #16A34A 0%, #65A30D 55%, #C6FF34 130%)' }}
      >
        <div className="relative z-10">
          <h1 className="text-[26px] sm:text-[32px] font-extrabold leading-tight tracking-tight">
            Привет, {user?.firstName || 'студент'}! 👋
          </h1>
          <p className="text-sm sm:text-base mt-1.5 font-semibold text-white/90 max-w-md">{heroText}</p>
        </div>
        <span className="absolute -right-4 -bottom-8 text-[110px] leading-none opacity-20 select-none" aria-hidden="true">🚀</span>
      </div>

      {loading ? (
        <Skeleton h={96} count={3} />
      ) : error ? (
        <div className="card bg-base-100"><ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard Icon={Coins} label="Коины" value={fmtNum(data?.coins)} hint="потрать их в магазине" />
            <StatCard
              Icon={Trophy}
              tone="purple"
              label="Место в рейтинге"
              value={data?.rank?.rank ? `#${data.rank.rank}` : '—'}
              hint={data?.rank?.rank ? `${fmtNum(data.rank.coins)} коинов за неделю` : 'заработай коины, чтобы попасть в топ'}
            />
            <StatCard
              Icon={Wallet}
              label="Задолженность"
              tone={debt > 0 ? 'danger' : 'success'}
              value={debt > 0 ? fmtMoney(debt) : 'Нет 🎉'}
              valueClass={debt > 0 ? 'text-error' : ''}
              hint={debt > 0 ? 'уточни оплату у администратора' : undefined}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6 items-start">
            <Panel
              title="Ближайшие дедлайны"
              icon={BookOpen}
              action={
                <Link to="/homework" className="btn btn-ghost btn-xs gap-1 text-primary">
                  все ДЗ <ArrowRight size={13} />
                </Link>
              }
            >
              {data?.upcomingHomework?.length ? (
                <div className="space-y-2">
                  {data.upcomingHomework.map((hw) => {
                    const label = deadlineLabel(hw.deadline);
                    return (
                      <div key={hw.id} className="flex items-center gap-3 rounded-xl bg-base-200/50 border border-base-200 px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold truncate">{hw.title}</div>
                          <div className="text-xs text-base-content/45 mt-0.5">до {fmtDateTime(hw.deadline)}</div>
                        </div>
                        <Pill tone={label === 'сегодня' || label === 'просрочено' ? 'danger' : 'primary'}>{label}</Pill>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState emoji="🎉" title="Всё сдано!" text="Новых дедлайнов пока нет." />
              )}
            </Panel>

            <Panel title="Мои группы" icon={Users}>
              {data?.groups?.length ? (
                <div className="space-y-2">
                  {data.groups.map((g) => (
                    <div key={g.id} className="flex items-center gap-3 rounded-xl bg-base-200/50 border border-base-200 px-4 py-3">
                      <span className="w-9 h-9 rounded-lg bg-primary/12 text-primary grid place-items-center shrink-0">
                        <Users size={16} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold truncate">{g.name}</div>
                        <div className="text-xs text-base-content/45 mt-0.5 truncate">{g.subject} · {g.mentorName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState emoji="👥" title="Пока нет групп" text="Администратор добавит тебя в группу." />
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
