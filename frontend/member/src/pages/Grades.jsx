import { useState } from 'react';
import { GraduationCap, BookOpen, FileCheck2, BarChart3, Trophy, ChevronRight } from 'lucide-react';
import { useGradesPage } from '../queries.js';
import { useChild } from '../child-context.jsx';
import { dateShort, gradePercent } from '../format.js';
import {
  C, HUES, IconTile, PageHeader, Tabs, EmptyState, ErrorState, Skeleton, RowSkeleton,
} from '../student/components/ui.jsx';
import GradeDetail from '../components/GradeDetail.jsx';
import { useI18n } from '../i18n.jsx';

const TABS = [
  { key: 'homework', label: 'gr.tab.hw', icon: BookOpen },
  { key: 'tests', label: 'gr.tab.tests', icon: FileCheck2 },
];
const PAGE_SIZE = 15;

export default function Grades() {
  const { t } = useI18n();
  const { selectedChild } = useChild();
  const [tab, setTab] = useState('homework');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);

  // FE-PARENT-PAGINATION: overview.grades.{homework,tests} ограничены последними 5 —
  // список ниже идёт отдельным постраничным запросом. Счётчики на вкладках — по 1
  // записи каждого типа (нужен только total из ответа, не сами данные).
  const { data, isLoading, error, refetch } = useGradesPage(selectedChild?.id, tab, page, PAGE_SIZE);
  const { data: hwCountData } = useGradesPage(selectedChild?.id, 'homework', 1, 1);
  const { data: testsCountData } = useGradesPage(selectedChild?.id, 'tests', 1, 1);

  const onTabChange = (next) => {
    setTab(next);
    setPage(1);
  };

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
        <PageHeader title={t('gr.title')} subtitle={`${selectedChild.firstName} ${selectedChild.lastName}`} />
        <Skeleton h={56} count={1} />
        <div className="grid grid-cols-3 gap-3 my-4">{[0, 1, 2].map((i) => <Skeleton key={i} h={96} />)}</div>
        <RowSkeleton count={5} height={62} />
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

  const p = data?.data;
  if (!p) return null;

  const list = p.items || [];
  const pageCount = p.pageCount || 1;
  const hwCount = hwCountData?.data?.total ?? 0;
  const testsCount = testsCountData?.data?.total ?? 0;

  const avg =
    list.length > 0
      ? Math.round(list.reduce((s, g) => s + gradePercent(g.score, g.maxScore, tab), 0) / list.length)
      : 0;

  const best = list.length > 0
    ? Math.max(...list.map((g) => gradePercent(g.score, g.maxScore, tab)))
    : 0;

  const tabItems = TABS.map((tItem) => ({
    ...tItem,
    count: tItem.key === 'homework' ? hwCount : testsCount,
  }));

  return (
    <>
      <PageHeader title={t('gr.title')} subtitle={`${selectedChild.firstName} ${selectedChild.lastName}`} />

      <div className="mb-4">
        <Tabs value={tab} onChange={onTabChange} items={tabItems} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="k-card p-4 text-center">
          <IconTile icon={BarChart3} hue="blue" size={36} className="mx-auto" />
          <p className="k-num text-[22px] font-extrabold mt-2" style={{ color: C.text }}>{p.total}</p>
          <p className="text-[11px] font-bold mt-0.5" style={{ color: C.muted }}>{t('gr.total')}</p>
        </div>
        <div className="k-card p-4 text-center">
          <IconTile icon={Trophy} hue={avg >= 80 ? 'green' : avg >= 60 ? 'amber' : 'coral'} size={36} className="mx-auto" />
          <p
            className="k-num text-[22px] font-extrabold mt-2"
            style={{ color: avg >= 80 ? C.lime : avg >= 60 ? C.amber : C.coral }}
          >
            {avg}%
          </p>
          <p className="text-[11px] font-bold mt-0.5" style={{ color: C.muted }}>{t('gr.avg')}</p>
        </div>
        <div className="k-card p-4 text-center">
          <IconTile icon={GraduationCap} hue="violet" size={36} className="mx-auto" />
          <p className="k-num text-[22px] font-extrabold mt-2" style={{ color: HUES.violet }}>{best}%</p>
          <p className="text-[11px] font-bold mt-0.5" style={{ color: C.muted }}>{t('gr.best')}</p>
        </div>
      </div>

      {/* List */}
      <div className="k-card overflow-hidden">
        {list.length === 0 ? (
          <EmptyState
            icon={tab === 'homework' ? BookOpen : FileCheck2}
            hue="violet"
            title={t('gr.emptyTitle')}
            text={tab === 'homework' ? t('gr.emptyHw') : t('gr.emptyTests')}
          />
        ) : (
          <div className="pb-2">
            {list.map((g, i) => {
              const pct = gradePercent(g.score, g.maxScore, tab);
              const color = pct >= 80 ? '#1F7A3D' : pct >= 60 ? C.amber : C.coral;
              const itemId = g.id || `${tab}-${i}`;
              return (
                <button
                  key={itemId}
                  onClick={() => setDetail({ type: tab === 'homework' ? 'hw' : 'test', id: g.id, item: g })}
                  className="k-press w-full flex items-center gap-3 px-4 sm:px-5 py-2.5 text-left"
                >
                  <span
                    className="w-11 h-11 rounded-xl grid place-items-center k-num text-[13.5px] font-extrabold shrink-0"
                    style={{ background: `${color}14`, color }}
                  >
                    {pct}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold truncate" style={{ color: C.text }}>{g.title}</p>
                    <p className="text-[11.5px] font-semibold mt-0.5" style={{ color: C.muted }}>
                      {tab === 'tests' ? `${pct}%` : `${g.score}/${g.maxScore}`} · {dateShort(g.gradedAt || g.finishedAt)}
                    </p>
                  </div>
                  <ChevronRight size={16} strokeWidth={2.4} className="shrink-0" style={{ color: C.muted }} />
                </button>
              );
            })}
          </div>
        )}

        {/* FE-PARENT-PAGINATION */}
        {pageCount > 1 && (
          <div
            className="flex items-center justify-between px-4 sm:px-5 py-3"
            style={{ borderTop: `1px solid ${C.line}` }}
          >
            <span className="text-[12px] font-semibold" style={{ color: C.muted }}>
              {t('common.page', { page, total: pageCount })}
            </span>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(pageCount, 5) }).map((_, idx) => {
                const pg = idx + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className="k-press-sm w-8 h-8 rounded-lg text-[13px] font-bold"
                    style={{
                      background: page === pg ? C.lime : C.bg,
                      color: page === pg ? '#fff' : C.muted,
                    }}
                  >
                    {pg}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {detail && (
        <GradeDetail
          type={detail.type}
          id={detail.id}
          item={detail.item}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}
