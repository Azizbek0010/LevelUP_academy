import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, CalendarCheck, FileText, ClipboardCheck, Coins,
  Check, X, Clock, AlertTriangle, TrendingUp, UserX,
} from 'lucide-react';

import { useMentorStudentStats } from '../../queries.js';
import Avatar from '../../components/Avatar.jsx';
import { EmptyState } from './_ui.jsx';

/**
 * Карточка ученика для ментора: посещаемость, домашние задания, тесты, коины.
 *
 * Главный вопрос, ради которого её открывают, — «что он сделал, а что нет».
 * Поэтому список домашних заданий показывает ВСЕ задания группы, включая те,
 * которых ученик не сдавал, и по умолчанию открыт на фильтре «не сдал»:
 * сделанное само о себе не напомнит, а пропущенное требует реакции.
 */

const HW_STATE = {
  graded:    { label: 'Baholangan', cls: 'bg-success/10 text-success border-success/25', Icon: Check },
  submitted: { label: 'Topshirgan', cls: 'bg-info/10 text-info border-info/25', Icon: ClipboardCheck },
  late:      { label: 'Kech topshirgan', cls: 'bg-warning/10 text-warning border-warning/25', Icon: Clock },
  missed:    { label: 'Topshirmagan', cls: 'bg-error/10 text-error border-error/25', Icon: X },
  pending:   { label: 'Muddati kelmagan', cls: 'bg-base-200 text-base-content/50 border-base-300', Icon: Clock },
};

const ATT_STATE = {
  present: { label: 'Keldi', cls: 'bg-success/15 text-success' },
  late:    { label: 'Kechikdi', cls: 'bg-warning/15 text-warning' },
  absent:  { label: 'Kelmadi', cls: 'bg-error/15 text-error' },
  excused: { label: 'Sababli', cls: 'bg-info/15 text-info' },
};

/** Крупная метрика. `tone` красит только цифру — по ней и читают строку. */
function Metric({ icon: Icon, label, value, suffix, hint, tone = 'default' }) {
  const toneCls = {
    default: 'text-base-content',
    good: 'text-success',
    warn: 'text-warning',
    bad: 'text-error',
  }[tone];

  return (
    <div className="card bg-base-100 p-4">
      <div className="flex items-center gap-2.5">
        <span className="w-8 h-8 rounded-lg grid place-items-center bg-primary/10 text-primary shrink-0">
          <Icon size={16} />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45">
          {label}
        </span>
      </div>
      <div className={`text-3xl font-extrabold mt-3 leading-none tabular-nums ${toneCls}`}>
        {value ?? '—'}
        {value !== null && value !== undefined && suffix && (
          <span className="text-lg font-bold ml-0.5">{suffix}</span>
        )}
      </div>
      {hint && <div className="text-xs text-base-content/45 mt-1">{hint}</div>}
    </div>
  );
}

/* Полоса из сегментов вместо круговой диаграммы: доли читаются подряд, а
   подписи стоят рядом с цветом, а не в отдельной легенде. */
function SegmentBar({ segments, total }) {
  if (!total) return <div className="h-2.5 rounded-full bg-base-200" />;
  return (
    <div className="flex h-2.5 rounded-full overflow-hidden bg-base-200">
      {segments.filter((s) => s.value > 0).map((s) => (
        <div
          key={s.key}
          className={s.cls}
          style={{ width: `${(s.value / total) * 100}%` }}
          title={`${s.label}: ${s.value}`}
        />
      ))}
    </div>
  );
}

function Panel({ title, icon: Icon, action, children }) {
  return (
    <section className="card bg-base-100">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-base-200 flex-wrap">
        <h2 className="text-sm font-bold flex items-center gap-2">
          <Icon size={15} className="text-primary" /> {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) : '—';

export default function MentorStudentDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useMentorStudentStats(id);
  const stats = data?.data ?? null;

  // Открываем на «не сдал»: ради этого списка карточку и открывают.
  const [hwFilter, setHwFilter] = useState('missed');

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="skeleton h-28 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="card bg-base-100">
        <EmptyState
          icon={UserX}
          title="O'quvchi topilmadi"
          hint="Balki u sizning guruhingizdan chiqarilgan."
          action={<Link to="/students" className="btn btn-sm btn-primary">O'quvchilarga qaytish</Link>}
        />
      </div>
    );
  }

  const { student, groups, attendance, recentAttendance, homework, tests, coins } = stats;
  const fullName = `${student.firstName} ${student.lastName}`.trim();

  const hwFiltered = hwFilter === 'all'
    ? homework.items
    : homework.items.filter((h) => (hwFilter === 'missed'
      ? h.state === 'missed'
      : h.state !== 'missed'));

  return (
    <div className="space-y-5">
      <Link to="/students" className="btn btn-ghost btn-sm gap-1.5 -ml-2">
        <ArrowLeft size={15} /> Barcha o'quvchilar
      </Link>

      {/* ═════ Шапка ═════ */}
      <section className="card bg-base-100 p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar name={fullName} size={64} />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-extrabold truncate">{fullName}</h1>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {student.status !== 'active' && (
                <span className="badge badge-warning badge-sm">Muzlatilgan</span>
              )}
              {groups.map((g) => (
                <Link
                  key={g.id}
                  to={`/groups/${g.id}`}
                  className="text-[11px] font-medium px-2 py-1 rounded-md bg-base-200 hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  {g.name}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2.5 text-xs text-base-content/50 flex-wrap">
              {student.loginCode && <span>ID: {student.loginCode}</span>}
              {student.phone && <span>{student.phone}</span>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-base-content/45 font-semibold">
              Koinlar
            </div>
            <div className="text-2xl font-extrabold text-warning tabular-nums flex items-center gap-1.5 justify-end">
              <Coins size={18} /> {coins.balance}
            </div>
          </div>
        </div>
      </section>

      {/* ═════ Метрики ═════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric
          icon={CalendarCheck}
          label="Davomat"
          value={attendance.rate}
          suffix="%"
          hint={`${attendance.present + attendance.late} / ${attendance.total} darsda`}
          tone={attendance.rate === null ? 'default' : attendance.rate >= 85 ? 'good' : attendance.rate >= 65 ? 'warn' : 'bad'}
        />
        <Metric
          icon={FileText}
          label="Uy vazifasi"
          value={homework.completionRate}
          suffix="%"
          hint={`${homework.done} / ${homework.total} topshirgan`}
          tone={homework.completionRate === null ? 'default' : homework.completionRate >= 85 ? 'good' : homework.completionRate >= 60 ? 'warn' : 'bad'}
        />
        <Metric
          icon={TrendingUp}
          label="O'rtacha baho"
          value={homework.avgPercent}
          suffix="%"
          hint={`${homework.graded} ta baholangan`}
          tone={homework.avgPercent === null ? 'default' : homework.avgPercent >= 80 ? 'good' : homework.avgPercent >= 60 ? 'warn' : 'bad'}
        />
        <Metric
          icon={ClipboardCheck}
          label="Testlar"
          value={tests.avgPercent}
          suffix="%"
          hint={`${tests.taken} / ${tests.total} ishlagan`}
          tone={tests.avgPercent === null ? 'default' : tests.avgPercent >= 80 ? 'good' : tests.avgPercent >= 60 ? 'warn' : 'bad'}
        />
      </div>

      {/* Тревожная строка — если пропусков много, это должно бросаться в глаза
          раньше, чем ментор начнёт листать списки. */}
      {homework.missed > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-error/25 bg-error/5">
          <AlertTriangle size={18} className="text-error shrink-0" />
          <span className="text-sm">
            <b className="text-error">{homework.missed} ta uy vazifasi topshirilmagan</b>
            <span className="text-base-content/60"> — quyida ro'yxati bor</span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ═════ Домашние задания ═════ */}
        <div className="lg:col-span-2">
          <Panel
            title="Uy vazifalari"
            icon={FileText}
            action={
              <div role="tablist" className="flex gap-1 bg-base-200/70 p-0.5 rounded-lg">
                {[
                  { key: 'missed', label: `Topshirmagan (${homework.missed})` },
                  { key: 'done', label: `Topshirgan (${homework.done})` },
                  { key: 'all', label: 'Barchasi' },
                ].map((t) => (
                  <button
                    key={t.key}
                    role="tab"
                    aria-selected={hwFilter === t.key}
                    onClick={() => setHwFilter(t.key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      hwFilter === t.key
                        ? 'bg-base-100 text-base-content shadow-sm'
                        : 'text-base-content/50 hover:text-base-content'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            }
          >
            {hwFiltered.length === 0 ? (
              <EmptyState
                icon={hwFilter === 'missed' ? Check : FileText}
                title={
                  hwFilter === 'missed'
                    ? "Barcha vazifalar topshirilgan"
                    : "Bu bo'limda vazifa yo'q"
                }
                hint={hwFilter === 'missed' ? "Qarzdorlik yo'q." : undefined}
              />
            ) : (
              <ul className="divide-y divide-base-200">
                {hwFiltered.map((h) => {
                  const st = HW_STATE[h.state] ?? HW_STATE.pending;
                  const percent = h.score !== null ? Math.round((h.score / (h.maxScore || 100)) * 100) : null;
                  return (
                    <li key={h.id} className="flex items-center gap-3 px-4 py-3">
                      <span className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 border ${st.cls}`}>
                        <st.Icon size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{h.title}</div>
                        <div className="text-[11px] text-base-content/45 truncate">
                          {h.groupName} · {fmtDate(h.deadline)} gacha
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {percent !== null ? (
                          <>
                            <div className="text-sm font-bold tabular-nums">
                              {h.score}<span className="text-base-content/40">/{h.maxScore}</span>
                            </div>
                            <div className={`text-[11px] font-semibold ${
                              percent >= 80 ? 'text-success' : percent >= 60 ? 'text-warning' : 'text-error'
                            }`}>
                              {percent}%
                            </div>
                          </>
                        ) : (
                          <span className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${st.cls}`}>
                            {st.label}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <div className="mt-5">
            <Panel title="Testlar" icon={ClipboardCheck}>
              {tests.items.length === 0 ? (
                <EmptyState icon={ClipboardCheck} title="Test topshirilmagan" />
              ) : (
                <ul className="divide-y divide-base-200">
                  {tests.items.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">{t.title}</div>
                        <div className="text-[11px] text-base-content/45">
                          {t.groupName}{t.finishedAt ? ` · ${fmtDate(t.finishedAt)}` : ''}
                        </div>
                      </div>
                      {t.finishedAt ? (
                        <div className="flex items-center gap-3 shrink-0">
                          {/* Полоса результата: 40 подряд идущих процентов
                              глазом не сравнить, длину — можно. */}
                          <div className="hidden sm:block w-24 h-1.5 rounded-full bg-base-200 overflow-hidden">
                            <div
                              className={`h-full ${t.percent >= 80 ? 'bg-success' : t.percent >= 60 ? 'bg-warning' : 'bg-error'}`}
                              style={{ width: `${t.percent}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold tabular-nums w-20 text-right">
                            {t.score}/{t.maxScore}
                            <span className={`ml-1.5 text-[11px] ${
                              t.percent >= 80 ? 'text-success' : t.percent >= 60 ? 'text-warning' : 'text-error'
                            }`}>
                              {t.percent}%
                            </span>
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-md border border-base-300 text-base-content/45 shrink-0">
                          Ishlamagan
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>

        {/* ═════ Правая колонка ═════ */}
        <div className="space-y-5">
          <Panel title="Davomat" icon={CalendarCheck}>
            <div className="p-4">
              <SegmentBar
                total={attendance.total}
                segments={[
                  { key: 'present', value: attendance.present, cls: 'bg-success', label: 'Keldi' },
                  { key: 'late', value: attendance.late, cls: 'bg-warning', label: 'Kechikdi' },
                  { key: 'absent', value: attendance.absent, cls: 'bg-error', label: 'Kelmadi' },
                  { key: 'excused', value: attendance.excused, cls: 'bg-info', label: 'Sababli' },
                ]}
              />
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                {[
                  { label: 'Keldi', value: attendance.present, cls: 'text-success' },
                  { label: 'Kechikdi', value: attendance.late, cls: 'text-warning' },
                  { label: 'Kelmadi', value: attendance.absent, cls: 'text-error' },
                ].map((s) => (
                  <div key={s.label}>
                    <div className={`text-lg font-extrabold tabular-nums ${s.cls}`}>{s.value}</div>
                    <div className="text-[11px] text-base-content/45">{s.label}</div>
                  </div>
                ))}
              </div>

              {recentAttendance.length > 0 && (
                <>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/40 mt-5 mb-2">
                    Oxirgi darslar
                  </div>
                  <ul className="space-y-1">
                    {recentAttendance.slice(0, 6).map((a, i) => {
                      const st = ATT_STATE[a.status] ?? ATT_STATE.present;
                      return (
                        <li key={`${a.date}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-base-content/55">{fmtDate(a.date)}</span>
                          <span className={`px-2 py-0.5 rounded-md font-semibold ${st.cls}`}>
                            {st.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </Panel>

          <Panel title="Koinlar" icon={Coins}>
            <div className="p-4">
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg bg-success/10 px-3 py-2">
                  <div className="text-[11px] text-base-content/50">Olgan</div>
                  <div className="text-lg font-extrabold text-success tabular-nums">
                    +{coins.earned}
                  </div>
                </div>
                <div className="flex-1 rounded-lg bg-base-200 px-3 py-2">
                  <div className="text-[11px] text-base-content/50">Sarflagan</div>
                  <div className="text-lg font-extrabold tabular-nums">−{coins.spent}</div>
                </div>
              </div>

              {coins.recent.length > 0 && (
                <ul className="divide-y divide-base-200 mt-3">
                  {coins.recent.slice(0, 5).map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                      <span className="text-xs truncate">{c.reason}</span>
                      <span className={`text-xs font-bold tabular-nums shrink-0 ${
                        c.amount > 0 ? 'text-success' : 'text-error'
                      }`}>
                        {c.amount > 0 ? '+' : ''}{c.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
