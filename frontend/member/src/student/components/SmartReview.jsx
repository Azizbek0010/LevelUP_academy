import { TrendingUp, Lightbulb, Sparkles, Hourglass, SearchX } from 'lucide-react';
import { useI18n, fmt } from '../../i18n/index.jsx';
import { C } from './ui.jsx';
import { fmtDate } from '../format.js';

/* "Aqlli tahlil" — REAL versiya (backend ulanmagan edi — FeedbackDemo maket edi).
 *
 * Kontrakt — GET /student/home → data.review (backend home.service.js):
 *   { score, praise: { topic, comment }, growth_area: { topic, comment },
 *     tips: [...], summary, source, status, lessonTitle, reviewedAt } | null
 *
 * Holatlar:
 *   - null            → umuman ko'rsatilmaydi (o'sish joyi tahlili hali yo'q)
 *   - 'processing'    → "ish tahlil qilinmoqda" (BullMQ vorker hali ishlayapti)
 *   - 'failed'        → Groq xato berdi — mentor tekshiradi (bolani tushirmaymiz)
 *   - 'done' + praise → to'liq sendvich: maqtov → o'sish joyi → maslahatlar → xulosa
 *   - 'done' + !praise→ 'tests'/'unreadable' — kod o'qilmadi, faqat xulosa bor
 */
const AMBER_FG = '#8A6321';

function SectionShell({ children }) {
  const { t } = useI18n();
  return (
    <section
      aria-label={t.feedback.title}
      className="k-pop-in mt-4 relative overflow-hidden rounded-2xl"
      style={{ background: C.card, border: `1px solid ${C.limeLine}` }}
    >
      {children}
    </section>
  );
}

/* 'processing' | 'failed' — kichik status kartasi, bolani xafa qilmaydi. */
function StatusCard({ icon, tone, title, text }) {
  return (
    <SectionShell>
      <div className="p-4 flex items-center gap-3">
        <span
          className="grid h-10 w-10 place-items-center rounded-xl shrink-0"
          style={{ background: `${tone}1c`, color: tone }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-extrabold" style={{ color: C.text }}>{title}</div>
          <div className="text-[12.5px] font-semibold mt-0.5 leading-snug" style={{ color: C.muted }}>{text}</div>
        </div>
      </div>
    </SectionShell>
  );
}

/* 'done' + !praise — kod/маtn o'qilmadi (tests/unreadable), summary backenddan. */
function SummaryOnly({ f, review }) {
  return (
    <SectionShell>
      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <span className="text-[22px] leading-none shrink-0" aria-hidden="true">🧠</span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-extrabold leading-tight" style={{ color: C.text }}>{f.title}</h2>
            {review.lessonTitle && (
              <p className="text-[11.5px] font-semibold mt-0.5 truncate" style={{ color: C.muted }}>
                {fmt(f.badge, { lesson: review.lessonTitle })}
              </p>
            )}
          </div>
        </div>
        <div
          className="mt-3 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
          style={{ background: `${C.lime}12`, border: `1px solid ${C.limeLine}` }}
        >
          <SearchX size={16} strokeWidth={2.4} color={C.limeDk} className="shrink-0" />
          <p className="text-[13px] font-bold leading-snug" style={{ color: C.text }}>
            {review.summary || f.noCodeText}
          </p>
        </div>
      </div>
    </SectionShell>
  );
}

export default function SmartReview({ review }) {
  const { lang, t } = useI18n();
  const f = t.feedback;

  if (!review) return null;

  if (review.status === 'processing') {
    return (
      <StatusCard
        icon={<Hourglass size={18} strokeWidth={2.4} />}
        tone={C.blue}
        title={f.processingTitle}
        text={review.lessonTitle ? `${fmt(f.badge, { lesson: review.lessonTitle })} · ${f.processingText}` : f.processingText}
      />
    );
  }

  if (review.status === 'failed') {
    return (
      <StatusCard
        icon={<SearchX size={18} strokeWidth={2.4} />}
        tone={C.amber}
        title={f.failedTitle}
        text={f.failedText}
      />
    );
  }

  if (review.status !== 'done' || !review.praise || !review.growth_area) {
    return <SummaryOnly f={f} review={review} />;
  }

  const score = review.score != null ? Math.round(review.score) : null;

  return (
    <SectionShell>
      <span
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-extrabold tracking-[0.04em] max-w-[60%] truncate"
        style={{ color: C.muted, background: C.bg, border: `1px solid ${C.limeLine}` }}
      >
        <Sparkles size={12} strokeWidth={2.8} color={C.limeDk} />
        {review.lessonTitle ? fmt(f.badge, { lesson: review.lessonTitle }) : f.title}
      </span>

      <div className="p-3.5 sm:p-4">
        {/* ── Sarlavha ── */}
        <div className="flex items-center gap-3 pr-24">
          <span className="text-[24px] leading-none shrink-0" aria-hidden="true">🧠</span>
          <div className="min-w-0">
            <h2 className="text-[15.5px] sm:text-[17px] font-extrabold leading-tight" style={{ color: C.text }}>
              {f.title}
            </h2>
            <p className="text-[11.5px] font-semibold mt-0.5 truncate" style={{ color: C.muted }}>
              {f.titleSub}
              {review.reviewedAt ? ` · ${fmt(f.checkedAt, { date: fmtDate(review.reviewedAt, lang) })}` : ''}
            </p>
          </div>
        </div>

        {/* ── 1. Maqtov: gradient banner + katta foiz ── */}
        <div
          className="mt-2.5 relative overflow-hidden rounded-xl px-3.5 py-3"
          style={{ background: `linear-gradient(135deg, ${C.lime}, ${C.teal})` }}
        >
          <span className="absolute -right-7 -top-9 w-24 h-24 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} aria-hidden="true" />
          <span className="absolute right-14 -bottom-8 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }} aria-hidden="true" />

          <div className="relative flex items-center gap-3.5">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ color: 'rgba(255,255,255,0.92)' }}>
                🎉 {f.praiseTag}
              </div>
              <div className="text-[17px] sm:text-[19px] font-extrabold mt-0.5 leading-snug text-white">
                {review.praise.topic}
              </div>
              <div className="text-[13px] font-bold mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.95)' }}>
                {review.praise.comment}
              </div>
            </div>

            {score != null && (
              <div
                className="k-pop-in shrink-0 w-[62px] h-[62px] rounded-xl grid place-items-center"
                style={{ background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.5)' }}
              >
                <div className="text-center leading-none">
                  <div className="k-num text-[22px] font-extrabold text-white">{score}</div>
                  <div className="text-[10px] font-extrabold mt-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>%</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 2 + 3. O'sish joyi va Maslahatlar — yonma-yon ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
          {/* O'sish joyi (yumshoq, motivatsiyani tushirmaydi) */}
          <div
            className={`rounded-xl p-3${review.tips?.length ? '' : ' sm:col-span-2'}`}
            style={{ background: `${C.amber}12`, border: `1px solid ${C.amber}55` }}
          >
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} strokeWidth={2.6} color={C.amber} />
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em]" style={{ color: AMBER_FG }}>
                🌱 {f.growTag}
              </span>
            </div>
            <div className="text-[13.5px] font-extrabold mt-1 leading-snug" style={{ color: C.text }}>
              {review.growth_area.topic}
            </div>
            <p className="text-[11.5px] font-semibold mt-1 leading-snug" style={{ color: C.muted }}>
              {review.growth_area.comment}
            </p>
          </div>

          {/* Mayda maslahatlar — yechimi bolaning o'zida */}
          {review.tips?.length > 0 && (
            <div className="rounded-xl p-3" style={{ background: `${C.blue}0f`, border: `1px solid ${C.blue}44` }}>
              <div className="flex items-center gap-1.5">
                <Lightbulb size={14} strokeWidth={2.6} color={C.blue} />
                <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em]" style={{ color: C.blue }}>
                  {f.tipTitle}
                </span>
              </div>
              <ul className="mt-1.5 space-y-1">
                {review.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="k-num text-[11px] font-extrabold w-4 h-4 rounded grid place-items-center shrink-0 mt-[2px]"
                      style={{ background: `${C.blue}1c`, color: C.blue }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[11.5px] font-semibold leading-snug" style={{ color: C.text }}>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── 4. Umumiy xulosa — yumshoq, rag'batlantiruvchi ── */}
        {review.summary && (
          <div
            className="mt-2.5 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
            style={{ background: `${C.lime}12`, border: `1px solid ${C.limeLine}` }}
          >
            <span className="text-[18px] leading-none shrink-0" aria-hidden="true">🤝</span>
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold uppercase tracking-[0.07em]" style={{ color: C.limeDk }}>
                {f.summaryTitle}
              </div>
              <p className="text-[13px] font-extrabold mt-0.5 leading-snug" style={{ color: C.text }}>
                {review.summary}
              </p>
            </div>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
