import { useState } from 'react';
import { CalendarCheck, GraduationCap, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useParentOverview, useAttendancePage } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { dateShort, ATTENDANCE_STATUS } from '../format.js';
import {
  C, Ring, IconTile, PageHeader, EmptyState, ErrorState, Skeleton, RowSkeleton,
} from '../student/components/ui.jsx';
import { useI18n } from '../i18n.jsx';

const PAGE_SIZE = 15;

const FILTERS = [
  { key: 'all', label: 'att.filter.all' },
  { key: 'present', label: 'att.filter.present' },
  { key: 'absent', label: 'att.filter.absent' },
  { key: 'late', label: 'att.filter.late' },
  { key: 'excused', label: 'att.filter.excused' },
];

const KPI_ORDER = ['present', 'absent', 'late', 'excused'];
const KPI_HUES = ['green', 'coral', 'amber', 'blue'];

export default function Attendance() {
  const { t } = useI18n();
  const { selectedChild } = useChild();
  const { data, isLoading, error, refetch } = useParentOverview(selectedChild?.id);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  // FE-PARENT-PAGINATION: overview.attendance.recent ограничен последними 5 —
  // полная история постранично идёт отдельным запросом
  const {
    data: pageData,
    isLoading: isPageLoading,
    error: pageError,
    refetch: refetchPage,
  } = useAttendancePage(selectedChild?.id, page, PAGE_SIZE);

  if (!selectedChild) {
    return (
      <div className="k-card">
        <EmptyState icon={GraduationCap} hue="violet" title={t('dash.noChildTitle')} text={t('dash.noChildMsg')} />
      </div>
    );
  }

  if (isLoading || isPageLoading) {
    return (
      <>
        <PageHeader title={t('att.title')} subtitle={`${selectedChild.firstName} ${selectedChild.lastName}`} />
        <Skeleton h={128} count={1} />
        <div className="mt-4"><RowSkeleton count={5} height={60} /></div>
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
  if (pageError) {
    return (
      <div className="k-card">
        <ErrorState message={pageError.message} onRetry={refetchPage} />
      </div>
    );
  }

  const d = data?.data;
  if (!d) return null;

  const records = pageData?.data?.items || [];
  const pageCount = pageData?.data?.pageCount || 1;
  const summary = d.attendance?.summary || {};
  const total = summary.total || 1;
  const pct = Math.round(((summary.present || 0) / total) * 100);

  const filtered = filter === 'all' ? records : records.filter((r) => r.status === filter);

  const onFilterChange = (next) => {
    setFilter(next);
    setPage(1);
  };

  const statuses = ATTENDANCE_STATUS();

  return (
    <>
      <PageHeader title={t('att.title')} subtitle={`${selectedChild.firstName} ${selectedChild.lastName}`} />

      {/* ══ Сводка: кольцо + статусы-фильтры ══ */}
      <div className="k-card p-5 mb-4 flex flex-col sm:flex-row items-center gap-6">
        <Ring percent={pct} size={104} thickness={9} color={C.lime} track={C.line}>
          <div className="text-center leading-none">
            <div className="k-num text-[24px]" style={{ color: C.text }}>{pct}%</div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: C.muted }}>{t('att.presentLabel')}</div>
          </div>
        </Ring>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full flex-1">
          {KPI_ORDER.map((s, i) => {
            const st = statuses[s];
            const count = summary[s] || 0;
            const isActive = filter === s;
            return (
              <button
                key={s}
                onClick={() => onFilterChange(filter === s ? 'all' : s)}
                className="k-card k-hover k-press p-3.5 text-center transition-all duration-150"
                style={isActive ? { borderColor: st?.color, boxShadow: `0 0 0 2px ${st?.color}30` } : undefined}
              >
                <p className="k-num text-[22px] font-extrabold" style={{ color: st?.color }}>{count}</p>
                <p className="text-[11px] font-bold mt-0.5" style={{ color: C.muted }}>{st?.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ Фильтры ══ */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {FILTERS.map((f) => {
          const isActive = filter === f.key;
          const st = ATTENDANCE_STATUS()[f.key];
          return (
            <button
              key={f.key}
              onClick={() => onFilterChange(f.key)}
              className="k-press-sm flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-all"
              style={{
                background: isActive ? `${st?.color || C.lime}1c` : C.card,
                color: isActive ? (st?.color || C.limeDk) : C.muted,
                border: `1px solid ${isActive ? (st?.color || C.lime) : C.line}`,
              }}
            >
              {f.key !== 'all' && <span className="w-2 h-2 rounded-full" style={{ background: st?.color }} />}
              {t(f.label)}
              {f.key !== 'all' && (
                <span className="text-[10.5px] font-semibold opacity-70">{summary[f.key] || 0}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══ История ══ */}
      <div className="k-card overflow-hidden">
        <div className="flex items-center gap-2.5 p-4 sm:p-5 pb-3">
          <IconTile icon={CalendarCheck} hue="green" size={34} />
          <h3 className="text-[15.5px] font-extrabold" style={{ color: C.text }}>{t('att.history')}</h3>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={CalendarCheck} hue="green" title={t('att.emptyTitle')} text={t('att.emptyMsg')} />
        ) : (
          <div className="pb-2">
            {filtered.map((r, i) => {
              const st = statuses[r.status];
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

        {/* FE-PARENT-PAGINATION */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-4 sm:px-5 py-3" style={{ borderTop: `1px solid ${C.line}` }}>
            <span className="text-[12px] font-semibold" style={{ color: C.muted }}>
              {t('common.page', { page, total: pageCount })}
            </span>
            <div className="flex items-center gap-2">
              <button
                className="k-press-sm w-8 h-8 rounded-lg grid place-items-center disabled:opacity-30"
                style={{ background: C.bg, color: C.text }}
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                aria-label="prev"
              >
                <ChevronLeft size={16} strokeWidth={2.6} />
              </button>
              <button
                className="k-press-sm w-8 h-8 rounded-lg grid place-items-center disabled:opacity-30"
                style={{ background: C.bg, color: C.text }}
                disabled={page >= pageCount}
                onClick={() => setPage((p) => p + 1)}
                aria-label="next"
              >
                <ChevronRight size={16} strokeWidth={2.6} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
