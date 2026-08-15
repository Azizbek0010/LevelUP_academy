import { useState } from 'react';
import {
  Star, Wallet, Trophy, TrendingUp, CalendarCheck, GraduationCap, ArrowLeft, ChevronRight, Clock,
} from 'lucide-react';
import { useParentOverview, useGroupRating } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { fmt, money, dateShort, timeAgo, ATTENDANCE_STATUS, gradePercent } from '../format.js';
import Avatar from '../components/Avatar.jsx';
import {
  C, Ring, IconTile, PageHeader, EmptyState, ErrorState, Skeleton, RowSkeleton,
} from '../student/components/ui.jsx';
import { useI18n } from '../i18n.jsx';

const RANK_COLORS = ['#B9832E', '#9BA39A', '#B08655'];

function groupInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function KidStat({ icon: Icon, hue, label, value, sub, valueStyle }) {
  return (
    <div className="k-card k-hover p-4 flex items-center gap-3 h-full">
      <IconTile icon={Icon} hue={hue} size={42} />
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: C.muted }}>{label}</div>
        <div className="text-[20px] font-extrabold k-num leading-tight truncate" style={valueStyle || { color: C.text }}>{value}</div>
        <div className="text-[11px] font-semibold truncate" style={{ color: C.muted }}>{sub}</div>
      </div>
    </div>
  );
}

function StatChip({ icon: Icon, label, children }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-9 h-9 rounded-lg grid place-items-center shrink-0" style={{ background: 'rgba(255,255,255,0.16)' }}>
        <Icon size={17} strokeWidth={2.2} color="#fff" />
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,0.72)' }}>{label}</div>
        <div className="text-[15px] leading-tight font-bold text-white">{children}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);
  const { data: ratingData, isLoading: ratingLoading } = useGroupRating(selectedChild?.id);
  const [showRating, setShowRating] = useState(false);

  if (!selectedChild) {
    return (
      <div className="k-card">
        <EmptyState icon={GraduationCap} hue="violet" title={t('dash.noChildTitle')} text={t('dash.noChildMsg')} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title={t('dash.title')} />
        <Skeleton h={96} count={1} />
        <div className="mt-4"><RowSkeleton count={3} height={64} /></div>
      </>
    );
  }

  if (error) {
    return (
      <div className="k-card">
        <ErrorState message={error.message} onRetry={refetch} />
      </div>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const att = d.attendance?.summary || {};
  const attTotal = att.total || 1;
  const attPct = Math.round(((att.present || 0) / attTotal) * 100);

  const allGrades = [
    ...(d.grades?.homework || []).map((g) => ({ ...g, type: 'hw' })),
    ...(d.grades?.tests || []).map((g) => ({ ...g, type: 'test' })),
  ]
    .sort((a, b) => new Date(b.gradedAt || b.finishedAt) - new Date(a.gradedAt || a.finishedAt))
    .slice(0, 5);

  const avgScore =
    allGrades.length > 0
      ? Math.round(allGrades.reduce((s, g) => s + gradePercent(g.score, g.maxScore, g.type), 0) / allGrades.length)
      : 0;

  const group = d.groups?.[0];
  const ratingStudents = ratingData?.data?.students || [];
  // Сортируем сами (у бэкенда поле rank может отсутствовать) — позиция = место в рейтинге.
  const students = [...ratingStudents].sort((a, b) => Number(b.coins) - Number(a.coins));
  const debt = Number(d.totalDebt) || 0;

  if (showRating && group) {
    return (
      <>
        <button
          onClick={() => setShowRating(false)}
          className="k-press-sm flex items-center gap-2 text-[13.5px] font-bold mb-4"
          style={{ color: C.blue }}
        >
          <ArrowLeft size={16} strokeWidth={2.4} /> {t('dash.rating.back')}
        </button>

        <div className="k-card p-5 mb-4 flex items-center gap-4">
          <IconTile icon={GraduationCap} hue="violet" size={52} />
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-extrabold truncate" style={{ color: C.text }}>{group.name}</h2>
            <p className="text-[13px] font-semibold mt-0.5 truncate" style={{ color: C.muted }}>
              {group.subject} · {group.mentorName}
            </p>
            <p className="text-[11.5px] font-semibold mt-0.5" style={{ color: C.muted }}>
              {t('dash.rating.members', { count: students.length })}
            </p>
          </div>
        </div>

        <div className="k-card overflow-hidden">
          <div className="flex items-center gap-2.5 p-4 sm:p-5 pb-3">
            <IconTile icon={Trophy} hue="amber" size={34} />
            <h3 className="text-[15.5px] font-extrabold" style={{ color: C.text }}>{t('dash.rating.header')}</h3>
          </div>
          {ratingLoading ? (
            <div className="px-4 sm:px-5 pb-5"><RowSkeleton count={5} height={52} /></div>
          ) : students.length === 0 ? (
            <EmptyState icon={Trophy} hue="amber" title={t('dash.rating.emptyTitle')} text={t('dash.rating.emptyMsg')} />
          ) : (
            <div className="pb-2">
              {students.map((s, i) => {
                const isMe = s.childId === selectedChild?.id;
                const rankColor = i < 3 ? RANK_COLORS[i] : null;
                return (
                  <div
                    key={s.childId}
                    className="flex items-center gap-3 px-4 sm:px-5 py-2.5"
                    style={isMe ? { background: `${C.lime}0d` } : undefined}
                  >
                    <span
                      className="w-8 h-8 rounded-lg grid place-items-center k-num text-[13px] shrink-0"
                      style={rankColor
                        ? { background: rankColor, color: '#fff' }
                        : { background: C.bg, color: C.muted }}
                    >
                      {i + 1}
                    </span>
                    <Avatar name={`${s.firstName} ${s.lastName}`} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-bold truncate" style={{ color: isMe ? C.limeDk : C.text }}>
                        {s.firstName} {s.lastName}
                        {isMe && <span className="ml-1.5 font-semibold">· {t('dash.rating.you')}</span>}
                      </p>
                      <p className="text-[11.5px] font-semibold mt-0.5" style={{ color: C.muted }}>
                        {fmt(s.coins)} {t('common.coins')}
                      </p>
                    </div>
                    <span
                      className="k-num text-[14px] shrink-0"
                      style={{ color: s.avgScore >= 80 ? '#1F7A3D' : s.avgScore >= 60 ? '#B9832E' : '#C0392B' }}
                    >
                      {s.avgScore}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={t('dash.title')} subtitle={`${d.child.firstName} ${d.child.lastName}`} />

      {/* ══ Герой: тёмно-зелёный баннер с кольцом посещаемости ══ */}
      <div
        className="p-5 sm:p-6 mb-4 relative overflow-hidden rounded-2xl"
        style={{ background: 'linear-gradient(135deg, #21391A 0%, #142A0F 100%)' }}
      >
        <span className="absolute -right-8 -top-10 w-40 h-40 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} aria-hidden="true" />
        <span className="absolute right-16 -bottom-12 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} aria-hidden="true" />
        <div className="relative flex items-center gap-5 flex-wrap sm:flex-nowrap">
          <Ring percent={attPct} size={86} thickness={6} color={C.lime} track="rgba(255,255,255,0.28)">
            <div className="text-center leading-none">
              <div className="k-num text-[22px]" style={{ color: '#C6FF34' }}>{attPct}%</div>
              <div className="text-[9px] font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('dash.attendanceShort')}</div>
            </div>
          </Ring>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {t('nav.child')}
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-extrabold leading-[1.15] tracking-[-0.01em] mt-1 text-white">
              {d.child.firstName} {d.child.lastName}
            </h1>
            {group && (
              <p className="text-[13px] font-semibold mt-0.5 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.8)' }}>
                <GraduationCap size={14} strokeWidth={2.4} />
                <span className="truncate">{group.name} · {group.mentorName}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-5 shrink-0">
            {d.rank?.rank && (
              <StatChip icon={TrendingUp} label={t('dash.kpi.rating')}>
                #{d.rank.rank}
              </StatChip>
            )}
            <StatChip icon={Star} label={t('dash.kpi.coins')}>
              {fmt(d.coins)}
            </StatChip>
          </div>
        </div>
      </div>

      {/* ══ KPI ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KidStat icon={Star} hue="lime" label={t('dash.kpi.coins')} value={fmt(d.coins)} sub={t('dash.kpi.coinsSub')} />
        <KidStat
          icon={Wallet}
          hue={debt > 0 ? 'coral' : 'teal'}
          label={t('dash.kpi.debt')}
          value={money(d.totalDebt)}
          sub={debt > 0 ? t('dash.kpi.debtSub.yes') : t('dash.kpi.debtSub.no')}
          valueStyle={{ color: debt > 0 ? '#C0392B' : '#1F7A3D' }}
        />
        <KidStat
          icon={Trophy}
          hue="amber"
          label={t('dash.kpi.rating')}
          value={d.rank?.rank ? `#${d.rank.rank}` : '—'}
          sub={t('dash.kpi.ratingSub')}
        />
        <KidStat icon={CalendarCheck} hue="blue" label={t('dash.kpi.attendance')} value={`${attPct}%`} sub={t('dash.kpi.attendanceSub', { present: att.present || 0, total: attTotal })} />
      </div>

      {/* ══ Посещаемость + Группа ══ */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="k-card p-4 sm:p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <IconTile icon={CalendarCheck} hue="blue" size={34} />
            <h3 className="text-[15.5px] font-extrabold" style={{ color: C.text }}>{t('dash.attendance.title')}</h3>
          </div>
          <div className="flex items-center gap-6">
            <Ring percent={attPct} size={104} thickness={8} color={C.blue}>
              <div className="text-center leading-none">
                <div className="k-num text-[24px]" style={{ color: C.text }}>{attPct}%</div>
                <div className="text-[10px] font-bold mt-0.5" style={{ color: C.muted }}>{t('dash.attendance.present')}</div>
              </div>
            </Ring>
            <div className="flex-1 space-y-2.5">
              {['present', 'absent', 'late', 'excused'].map((s) => {
                const count = att[s] || 0;
                const pct = Math.round((count / attTotal) * 100);
                const st = ATTENDANCE_STATUS()[s];
                return (
                  <div key={s} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: st?.color }} />
                    <span className="text-[12px] w-24 shrink-0 truncate" style={{ color: C.muted }}>{st?.label}</span>
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.line }}>
                      <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%`, background: st?.color }} />
                    </div>
                    <span className="k-num text-[12px] w-6 text-right" style={{ color: C.muted }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="k-card p-4 sm:p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <IconTile icon={GraduationCap} hue="violet" size={34} />
            <h3 className="text-[15.5px] font-extrabold" style={{ color: C.text }}>{t('dash.group.title')}</h3>
          </div>
          {!group ? (
            <EmptyState icon={GraduationCap} hue="violet" title={t('dash.group.emptyTitle')} text={t('dash.group.emptyMsg')} />
          ) : (
            <button
              onClick={() => setShowRating(true)}
              className="k-card k-hover k-press w-full flex items-center gap-3 p-4 text-left"
              style={{ background: `${C.violet}0a`, border: `1px solid ${C.violet}26` }}
            >
              <span
                className="w-12 h-12 rounded-xl grid place-items-center text-[15px] font-extrabold shrink-0"
                style={{ background: `${C.violet}1c`, color: C.violet }}
              >
                {groupInitials(group.name)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-extrabold truncate" style={{ color: C.text }}>{group.name}</p>
                <p className="text-[12.5px] font-semibold mt-0.5 flex items-center gap-1 truncate" style={{ color: C.muted }}>
                  <Star size={12} strokeWidth={2.4} />
                  <span className="truncate">{group.mentorName}</span>
                </p>
                {group.studentCount ? (
                  <p className="text-[11.5px] font-semibold mt-0.5" style={{ color: C.muted }}>
                    {t('common.students', { count: group.studentCount })}
                  </p>
                ) : null}
              </div>
              <span className="inline-flex items-center gap-1 text-[13px] font-bold shrink-0" style={{ color: C.violet }}>
                {t('dash.group.rating')}
                <ChevronRight size={15} strokeWidth={2.6} />
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ══ Последние занятия ══ */}
      <div className="k-card mb-4 overflow-hidden">
        <div className="flex items-center gap-2.5 p-4 sm:p-5 pb-3">
          <IconTile icon={Clock} hue="amber" size={34} />
          <h3 className="text-[15.5px] font-extrabold" style={{ color: C.text }}>{t('dash.lessons.title')}</h3>
        </div>
        {d.attendance?.recent?.length === 0 ? (
          <EmptyState icon={CalendarCheck} hue="amber" title={t('dash.lessons.emptyTitle')} />
        ) : (
          <div className="pb-2">
            {d.attendance?.recent?.slice(0, 5).map((r, i) => {
              const st = ATTENDANCE_STATUS()[r.status];
              return (
                <div key={i} className="flex items-center gap-3 px-4 sm:px-5 py-2.5">
                  <span
                    className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
                    style={{ background: st?.bg }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: st?.color }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-bold truncate" style={{ color: C.text }}>{r.groupName}</span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ background: st?.bg, color: st?.color }}
                      >
                        {st?.label}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-[12px] font-semibold mt-0.5 truncate" style={{ color: C.muted }}>{r.comment}</p>
                    )}
                  </div>
                  <span className="text-[11.5px] font-semibold whitespace-nowrap" style={{ color: C.muted }}>
                    {dateShort(r.lessonDate)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ Последние оценки ══ */}
      <div className="k-card overflow-hidden">
        <div className="flex items-center justify-between gap-3 p-4 sm:p-5 pb-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <IconTile icon={GraduationCap} hue="blue" size={34} />
            <h3 className="text-[15.5px] font-extrabold" style={{ color: C.text }}>{t('dash.grades.title')}</h3>
          </div>
          {allGrades.length > 0 && (
            <span className="text-[12px] font-bold" style={{ color: C.muted }}>
              {t('dash.grades.avg', { avg: avgScore })}
            </span>
          )}
        </div>
        {allGrades.length === 0 ? (
          <EmptyState icon={GraduationCap} hue="blue" title={t('dash.grades.emptyTitle')} />
        ) : (
          <div className="pb-2">
            {allGrades.map((g, i) => {
              const pct = gradePercent(g.score, g.maxScore, g.type);
              const color = pct >= 80 ? '#1F7A3D' : pct >= 60 ? '#B9832E' : '#C0392B';
              return (
                <div key={i} className="flex items-center gap-3 px-4 sm:px-5 py-2.5">
                  <span
                    className="w-10 h-10 rounded-xl grid place-items-center k-num text-[13px] shrink-0"
                    style={{ background: `${color}14`, color }}
                  >
                    {pct}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold truncate" style={{ color: C.text }}>{g.title}</p>
                    <p className="text-[11.5px] font-semibold mt-0.5" style={{ color: C.muted }}>
                      {g.type === 'hw' ? t('dash.grades.hw') : t('dash.grades.test')} · {timeAgo(g.gradedAt || g.finishedAt)}
                    </p>
                  </div>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0"
                    style={{ background: `${color}14`, color }}
                  >
                    {g.type === 'test' ? `${pct}%` : `${g.score}/${g.maxScore}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
