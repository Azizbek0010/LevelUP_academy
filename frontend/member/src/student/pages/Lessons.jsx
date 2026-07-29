import { useNavigate } from 'react-router-dom';
import { Lock, Check, Globe, Palette, LayoutGrid, Braces, MousePointerClick, Play } from 'lucide-react';
import { INK, HUE, textOn } from '../components/ui.jsx';

/**
 * «Мои уроки» — тропа тем.
 *
 * Данные захардкожены намеренно (Karis: «hozir ui statik qilib tur keyin
 * backend integratsiya qilamiz»). Учебного плана по дням на бэкенде нет:
 * training_types/topics это плоский каталог без привязки к дате и группе.
 * Когда появится эндпоинт — меняется только массив, вёрстка не тронется.
 *
 * 2026-07-30, третья итерация. Первая была списком карточек (Karis: «это
 * не другой дизайн»). Вторая — кругами, но они висели в пустоте без
 * связи между собой, поэтому читались как поломка, а не как путь.
 * Здесь узлы нанизаны на пунктирную нить (.kid-spine) и разбиты на
 * главы — видно и последовательность, и структуру курса.
 */
export const MOCK_TOPICS = [
  { id: '1', day: 1, icon: Globe, title: 'HTML — основы', subtitle: 'Теги, структура страницы', chapter: 'Глава 1 · Вёрстка', locked: false, done: true, testScore: 100 },
  { id: '2', day: 2, icon: Palette, title: 'CSS — стили', subtitle: 'Цвета, отступы, шрифты', locked: false, done: true, testScore: 80 },
  { id: '3', day: 3, icon: LayoutGrid, title: 'Flexbox и Grid', subtitle: 'Раскладка элементов на странице', locked: false, done: false, testScore: null },
  { id: '4', day: 4, icon: Braces, title: 'JavaScript — переменные', subtitle: 'Первые шаги в программировании', chapter: 'Глава 2 · Программирование', locked: true, done: false, testScore: null },
  { id: '5', day: 5, icon: MousePointerClick, title: 'DOM и события', subtitle: 'Как оживить страницу', locked: true, done: false, testScore: null },
];

/* Смещение от центра. Небольшое (±76px) и намеренно не строго
   попеременное: нить читается как тропа, а не как механический зигзаг. */
const SHIFT = [0, 76, -60, 66, -72];

function Node({ topic, index, onOpen }) {
  const { icon: Icon, day, title, subtitle, locked, done, testScore } = topic;
  const current = !locked && !done;
  const hue = locked ? 'slate' : done ? 'grass' : 'sky';
  const size = current ? 108 : 88;

  return (
    <div className="relative flex justify-center" style={{ zIndex: 1 }}>
      <div className="flex flex-col items-center" style={{ transform: `translateX(${SHIFT[index % SHIFT.length]}px)` }}>
        <button
          type="button"
          onClick={() => !locked && onOpen(topic)}
          disabled={locked}
          aria-label={title}
          className={`kid-press relative rounded-full grid place-items-center ${locked ? 'cursor-not-allowed' : ''}`}
          style={{
            width: size,
            height: size,
            background: HUE[hue],
            color: textOn(hue),
            border: `4px solid ${INK}`,
            boxShadow: `0 ${current ? 7 : 5}px 0 0 ${INK}`,
          }}
        >
          {locked ? (
            <Lock size={30} strokeWidth={2.8} />
          ) : done ? (
            <Check size={38} strokeWidth={3.5} />
          ) : (
            <Play size={34} strokeWidth={3} fill="currentColor" className="ml-1" />
          )}

          {/* Номер дня — жетоном на краю узла, а не подписью под ним */}
          <span
            className="absolute -top-1.5 -left-1.5 w-8 h-8 rounded-full grid place-items-center kid-num text-[14px]"
            style={{ background: '#FFFDF7', border: `3px solid ${INK}`, color: INK }}
          >
            {day}
          </span>

          {/* Результат теста — жетоном с другой стороны */}
          {done && (
            <span
              className="absolute -bottom-1 -right-1.5 px-2 py-0.5 rounded-full kid-num text-[12px]"
              style={{ background: HUE.sun, border: `3px solid ${INK}`, color: INK }}
            >
              {testScore}%
            </span>
          )}
        </button>

        <div className="mt-3.5 text-center max-w-[190px]">
          <div className="text-[16px] font-extrabold leading-tight" style={{ color: locked ? 'rgba(27,42,27,0.38)' : INK }}>
            {title}
          </div>
          <div className="text-[12.5px] font-bold mt-1" style={{ color: 'rgba(27,42,27,0.45)' }}>
            {locked ? 'Откроется позже' : subtitle}
          </div>
          {current && (
            <span
              className="inline-block mt-2.5 px-3 py-1 text-[11.5px] font-extrabold uppercase tracking-wider"
              style={{ background: HUE.lime, color: INK, border: `2.5px solid ${INK}`, borderRadius: 999 }}
            >
              Ты здесь
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ChapterLabel({ children }) {
  return (
    <div className="relative flex justify-center py-2" style={{ zIndex: 1 }}>
      <span
        className="px-5 py-2 text-[13px] font-extrabold uppercase tracking-[0.08em]"
        style={{ background: '#FFFDF7', color: INK, border: `3px solid ${INK}`, borderRadius: 999, boxShadow: `4px 4px 0 0 ${INK}` }}
      >
        {children}
      </span>
    </div>
  );
}

export default function Lessons() {
  const navigate = useNavigate();
  const doneCount = MOCK_TOPICS.filter((t) => t.done).length;

  return (
    <>
      <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="text-[30px] sm:text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em]" style={{ color: INK }}>
            Мои уроки
          </h1>
          <p className="text-[15px] mt-1.5 font-bold" style={{ color: 'rgba(27,42,27,0.55)' }}>
            Идём по тропе сверху вниз — новая тема открывается после сдачи предыдущей
          </p>
        </div>
        <span
          className="px-4 py-2.5 kid-num text-[15px]"
          style={{ background: HUE.grass, color: '#fff', border: `3px solid ${INK}`, borderRadius: 16, boxShadow: `4px 4px 0 0 ${INK}` }}
        >
          {doneCount} / {MOCK_TOPICS.length} пройдено
        </span>
      </div>

      {/* kid-spine рисует пунктирную нить по центру — узлы нанизаны на неё */}
      <div className="kid-spine relative max-w-md mx-auto py-4 space-y-9">
        {MOCK_TOPICS.map((topic, i) => (
          <div key={topic.id}>
            {topic.chapter && <ChapterLabel>{topic.chapter}</ChapterLabel>}
            <div className={topic.chapter ? 'mt-9' : ''}>
              <Node topic={topic} index={i} onOpen={(t) => navigate(`/lessons/${t.id}`)} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
