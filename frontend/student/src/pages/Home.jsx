import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Coins, Wallet, Trophy, Users, BookOpen } from 'lucide-react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { useToast } from '../components/toast.jsx';
import { Skeleton, EmptyState } from '../components/ui.jsx';
import { fmtNum, fmtMoney, fmtDateTime, deadlineLabel } from '../format.js';

export default function Home() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .home()
      .then((d) => setData(d.data))
      .catch((err) => toast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  const debt = Number(data?.totalDebt) || 0;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Привет, {user?.firstName}! 👋</h1>
          <p>Твой прогресс за эту неделю</p>
        </div>
      </div>

      {loading ? (
        <Skeleton h={96} count={3} />
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-card__label">
                <Coins size={16} /> Коины
              </div>
              <div className="stat-card__value num">{fmtNum(data?.coins)}</div>
              <div className="stat-card__hint">потрать их в магазине</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">
                <Trophy size={16} /> Место в рейтинге
              </div>
              <div className="stat-card__value num">
                {data?.rank?.rank ? `#${data.rank.rank}` : '—'}
              </div>
              <div className="stat-card__hint">
                {data?.rank?.rank
                  ? `${fmtNum(data.rank.coins)} коинов за неделю`
                  : 'заработай коины, чтобы попасть в топ'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card__label">
                <Wallet size={16} /> Задолженность
              </div>
              <div className="stat-card__value num" style={debt > 0 ? { color: 'var(--danger)' } : undefined}>
                {debt > 0 ? fmtMoney(debt) : 'Нет 🎉'}
              </div>
              {debt > 0 && <div className="stat-card__hint">уточни оплату у администратора</div>}
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card__title">
                Ближайшие дедлайны
                <Link to="/homework" className="pill pill--muted">все ДЗ →</Link>
              </div>
              {data?.upcomingHomework?.length ? (
                data.upcomingHomework.map((hw) => (
                  <div key={hw.id} className="row">
                    <div className="row__body">
                      <div className="row__title">{hw.title}</div>
                      <div className="row__sub">до {fmtDateTime(hw.deadline)}</div>
                    </div>
                    <span
                      className={`pill ${deadlineLabel(hw.deadline) === 'сегодня' ? 'pill--danger' : 'pill--lime'}`}
                    >
                      {deadlineLabel(hw.deadline)}
                    </span>
                  </div>
                ))
              ) : (
                <EmptyState icon={BookOpen} title="Всё сдано!" text="Новых дедлайнов пока нет." />
              )}
            </div>

            <div className="card">
              <div className="card__title">Мои группы</div>
              {data?.groups?.length ? (
                data.groups.map((g) => (
                  <div key={g.id} className="row">
                    <div className="avatar" style={{ borderRadius: 10 }}>
                      <Users size={16} />
                    </div>
                    <div className="row__body">
                      <div className="row__title">{g.name}</div>
                      <div className="row__sub">
                        {g.subject} · {g.mentorName}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="Пока нет групп" text="Администратор добавит тебя в группу." />
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
