import { TrendingUp, Lightbulb, Gift, Sparkles } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useI18n, fmt } from '../../i18n/index.jsx';
import { C } from './ui.jsx';

/**
 * ⚠️ MAKET — "Aqlli tahlil" demo-bloki (backend hali ulanmagan!).
 *
 * G'oya (Karis bilan kelishilgan, plan rejimi 2026-08-07): bola dashboardga
 * kirishi bilan oxirgi natijalarining "aqlli tahlilini" ko'radi — teacher-
 * review "sandwich" uslubida, motivatsiyani tushirmasdan:
 *   1) eng kuchli tomoni → katta maqtov (+ maxsus sovrin, mock)
 *   2) o'sish joyi      → yumshoq tushuntirish (hech qachon "zaif" emas)
 *   3) mayda maslahatlar → yechimi bolaning o'zida
 *   4) yumshoq umumiy xulosa → "yaxshi ketyapsan, ozgina to'g'irlang"
 *
 * BARCHA ma'lumotlar o'rinbosar (mock) — backenddan KELMAYDI. Shuning uchun
 * karta aniq "MAKET" deb belgilangan (dashed ramka + shaffoflik + yozuv),
 * hech kim buni haqiqiy tahlil deb adashib qolmasligi uchun.
 *
 * Dizayn (2026-08-08): ixcham + o'ynoqi — gradient maqtov banneri (lime→teal)
 * katta foiz barchasi bilan, sovrin chipi, "o'sish joyi" va "maslahatlar"
 * yonma-yon mini-kartalarda, xulosa emoji bilan. Eskisi 4 ta bir xil oq quti
 * edi — zerikarli deb topildi.
 *
 * Haqiqiy versiyaga yo'l:
 *   1-daraja (test tahlili) — frontend o'zi hisoblay oladi: /student/lessons
 *     da har bir darsning balli bor → kuchli/o'sish mavzularini topish mumkin.
 *   2-daraja (kod tahlili: "section o'rniga div") — backend ishi: mentor
 *     baholashi (hozir yo'q) yoki AI-analiz. Shuning uchun demoda bu qism
 *     ham mock. Backend tayyor bo'lgach bu fayl o'chirilib, haqiqiy
 *     komponent bilan almashtiriladi.
 */
/* Amber to'plami — Pill(uix) ning amber soyalari bilan bir xil, palette token
   qo'shmagan holda maketda ishlatamiz (haqiqiy versiyada C tokenlarga o'tadi). */
const AMBER_FG = '#8A6321';
const BADGE_FG = '#7A5510';

/* Maket ma'lumotlari — o'rinbosar foizlar (haqiqiy versiyada hisoblanadi) */
const strongPct = 92;
const growPct = 58;

export default function FeedbackDemo() {
  const { user } = useAuth();
  const { lang, t } = useI18n();
  const f = t.feedback;
  const name = user?.firstName || (lang === 'uz' ? "o'quvchi" : 'ученик');

  return (
    <section
      aria-label={f.title}
      className="k-pop-in mt-4 relative overflow-hidden rounded-2xl"
      style={{
        opacity: 0.93,
        background: C.card,
        border: `2px dashed ${C.amber}`,
      }}
    >
      {/* ── MAKET belgisi — bu shunchaki maket ekani aniq ko'rinishi uchun ── */}
      <span
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11.5px] font-extrabold tracking-[0.06em] uppercase"
        style={{
          color: BADGE_FG,
          background: 'repeating-linear-gradient(45deg, #F3E9D8 0 6px, #EAD9B8 6px 12px)',
          border: `1.5px dashed ${C.amber}`,
        }}
      >
        <Sparkles size={12} strokeWidth={2.8} /> {f.maket}
      </span>

      <div className="p-3.5 sm:p-4">
        {/* ── Sarlavha (ixcham) ── */}
        <div className="flex items-center gap-3 pr-24">
          <span className="text-[24px] leading-none shrink-0" aria-hidden="true">🧠</span>
          <div className="min-w-0">
            <h2 className="text-[15.5px] sm:text-[17px] font-extrabold leading-tight" style={{ color: C.text }}>
              {f.title}
            </h2>
            <p className="text-[11.5px] font-semibold mt-0.5 truncate" style={{ color: C.muted }}>{f.titleSub}</p>
          </div>
        </div>

        {/* ── 1. Maqtov: gradient banner + katta foiz barchasi ── */}
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
                {fmt(f.praiseTitle, { name })}
              </div>
              <div className="text-[13px] font-bold mt-0.5 leading-snug" style={{ color: 'rgba(255,255,255,0.95)' }}>
                {fmt(f.praiseTopic, { topic: f.topicHtml, pct: strongPct })}
              </div>

              {/* Maxsus sovrin chipi (mock) — oq fonda amber, oson o'qiladi */}
              <div
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[12px] font-extrabold"
                style={{ background: 'rgba(255,255,255,0.94)', color: AMBER_FG }}
              >
                <Gift size={13} strokeWidth={2.6} color={C.amber} /> {f.prize}
              </div>
              <div className="text-[10.5px] font-semibold mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {f.prizeNote}
              </div>
            </div>

            {/* Katta foiz barchasi — vizual markaz */}
            <div
              className="k-pop-in shrink-0 w-[62px] h-[62px] rounded-xl grid place-items-center"
              style={{ background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.5)' }}
            >
              <div className="text-center leading-none">
                <div className="k-num text-[22px] font-extrabold text-white">{strongPct}</div>
                <div className="text-[10px] font-extrabold mt-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>%</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2 + 3. O'sish joyi va Maslahatlar — yonma-yon ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
          {/* O'sish joyi (yumshoq, motivatsiyani tushirmaydi) */}
          <div className="rounded-xl p-3" style={{ background: `${C.amber}12`, border: `1px solid ${C.amber}55` }}>
            <div className="flex items-center gap-1.5">
              <TrendingUp size={14} strokeWidth={2.6} color={C.amber} />
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em]" style={{ color: AMBER_FG }}>
                🌱 {f.growTag}
              </span>
            </div>
            <div className="text-[13.5px] font-extrabold mt-1 leading-snug" style={{ color: C.text }}>
              {fmt(f.growTopic, { topic: f.topicCss, pct: growPct })}
            </div>
            <p className="text-[11.5px] font-semibold mt-1 leading-snug" style={{ color: C.muted }}>{f.growText}</p>
          </div>

          {/* Mayda maslahatlar — yechimi bolaning o'zida */}
          <div className="rounded-xl p-3" style={{ background: `${C.blue}0f`, border: `1px solid ${C.blue}44` }}>
            <div className="flex items-center gap-1.5">
              <Lightbulb size={14} strokeWidth={2.6} color={C.blue} />
              <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em]" style={{ color: C.blue }}>
                {f.tipTitle}
              </span>
            </div>
            <ul className="mt-1.5 space-y-1">
              {[f.tip1, f.tip2, f.tip3].map((tip, i) => (
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
        </div>

        {/* ── 4. Umumiy xulosa — yumshoq, rag'batlantiruvchi ── */}
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
              {fmt(f.summary, { name })}
            </p>
          </div>
        </div>

        {/* ── Maket izohi (pastki) ── */}
        <p className="text-[10.5px] font-semibold mt-2.5 text-center" style={{ color: C.muted }}>
          {f.maketNote}
        </p>
      </div>
    </section>
  );
}
