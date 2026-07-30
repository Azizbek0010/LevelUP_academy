import { useNavigate } from 'react-router-dom';
import {
  Lock, Check, ChevronRight, Code2, Palette, LayoutGrid, Braces, MousePointerClick, Star,
} from 'lucide-react';
import { IconTile, Ring, Pill, C } from '../components/ui.jsx';

/**
 * «Мои уроки».
 *
 * Данные захардкожены намеренно (Karis: «hozir ui statik qilib tur keyin
 * backend integratsiya qilamiz»). Учебного плана по дням на бэкенде нет:
 * training_types/topics — плоский каталог без привязки к дате и группе.
 * Когда появится эндпоинт — меняется только массив, вёрстка не тронется.
 *
 * Karis про прошлую версию: «слишком скучно и слишком пиксельный дизайн».
 * Поэтому здесь: крупные цветные значки у каждой темы (свой цвет = тему
 * видно с одного взгляда), кольцо с процентом выполнения, заметная
 * лаймовая карточка у текущего урока и общий прогресс курса сверху.
 */
export const MOCK_TOPICS = [
  { id: '1', day: 1, icon: Code2, hue: 'blue', title: 'HTML — основы', subtitle: 'Теги, структура страницы', chapter: 'Вёрстка', locked: false, done: true, testScore: 100, hwScore: 100, videoDone: true },
  { id: '2', day: 2, icon: Palette, hue: 'violet', title: 'CSS — стили', subtitle: 'Цвета, отступы, шрифты', locked: false, done: true, testScore: 80, hwScore: 90, videoDone: true },
  { id: '3', day: 3, icon: LayoutGrid, hue: 'coral', title: 'Flexbox и Grid', subtitle: 'Раскладка элементов на странице', locked: false, done: false, testScore: null, hwScore: null, videoDone: false },
  { id: '4', day: 4, icon: Braces, hue: 'amber', title: 'JavaScript — переменные', subtitle: 'Первые шаги в программировании', chapter: 'Программирование', locked: true, done: false, testScore: null, hwScore: null, videoDone: false },
  { id: '5', day: 5, icon: MousePointerClick, hue: 'teal', title: 'DOM и события', subtitle: 'Как оживить страницу', locked: true, done: false, testScore: null, hwScore: null, videoDone: false },
];

/* Процент выполнения темы: тест + домашка + видео, равными долями.
   Считается здесь, чтобы и список, и страница темы показывали одно число. */
export function topicPercent(t) {
  const parts = [
    t.testScore != null ? t.testScore : 0,
    t.hwScore != null ? t.hwScore : 0,
    t.videoDone ? 100 : 0,
  ];
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

function TopicCard({ topic, onOpen }) {
  const { icon, hue, day, title, subtitle, locked, done } = topic;
  const current = !locked && !done;
  const percent = topicPercent(topic);

  return (
    <button
      type="button"
      onClick={() => !locked && onOpen(topic)}
      disabled={locked}
      className={`k-card ${locked ? '' : 'k-hover'} w-full flex items-center gap-4 p-4 text-left ${
        locked ? 'cursor-not-allowed' : ''
      }`}
      style={{
        opacity: locked ? 0.6 : 1,
        outline: current ? `2.5px solid ${C.lime}` : 'none',
        outlineOffset: current ? -2.5 : 0,
      }}
    >
      {locked ? (
        <span className="w-[56px] h-[56px] rounded-2xl grid place-items-center shrink-0" style={{ background: C.bg, color: C.muted }}>
          <Lock size={22} strokeWidth={2.5} />
        </span>
      ) : (
        <IconTile icon={icon} hue={hue} size={56} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ color: C.muted }}>
            Урок {day}
          </span>
          {current && <Pill hue="lime">Сейчас</Pill>}
          {done && <Pill hue="teal"><Check size={11} strokeWidth={3.5} /> Готово</Pill>}
        </div>
        <div className="text-[17px] font-extrabold leading-tight mt-1" style={{ color: C.text }}>{title}</div>
        <div className="text-[13px] font-semibold mt-0.5 truncate" style={{ color: C.muted }}>
          {locked ? 'Откроется после предыдущего урока' : subtitle}
        </div>
      </div>

      {!locked && (
        <Ring percent={percent} size={54} thickness={6} color={done ? C.teal : C.lime}>
          <span className="k-num text-[13px]" style={{ color: C.text }}>{percent}%</span>
        </Ring>
      )}
      {!locked && <ChevronRight size={18} strokeWidth={2.8} style={{ color: C.muted }} className="shrink-0" />}
    </button>
  );
}

export default function Lessons() {
  const navigate = useNavigate();
  const doneCount = MOCK_TOPICS.filter((t) => t.done).length;
  const coursePercent = Math.round(
    MOCK_TOPICS.reduce((sum, t) => sum + topicPercent(t), 0) / MOCK_TOPICS.length,
  );

  const groups = [];
  MOCK_TOPICS.forEach((t) => {
    if (t.chapter || groups.length === 0) groups.push({ chapter: t.chapter, items: [t] });
    else groups[groups.length - 1].items.push(t);
  });

  return (
    <>
      {/* Общий прогресс курса — кольцо + счётчики */}
      <div className="k-card p-5 mb-5 flex items-center gap-5">
        <Ring percent={coursePercent} size={84} thickness={8}>
          <div className="text-center leading-none">
            <div className="k-num text-[21px]" style={{ color: C.text }}>{coursePercent}%</div>
          </div>
        </Ring>
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] sm:text-[29px] font-extrabold leading-[1.1] tracking-[-0.025em]" style={{ color: C.text }}>
            Мои уроки
          </h1>
          <p className="text-[13.5px] font-semibold mt-1" style={{ color: C.muted }}>
            Пройдено {doneCount} из {MOCK_TOPICS.length} тем — следующая откроется после теста
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <Pill hue="amber"><Star size={11} strokeWidth={3} fill="currentColor" /> монеты за каждый тест</Pill>
        </div>
      </div>

      <div className="space-y-5">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.chapter && (
              <div className="flex items-center gap-3 mb-2.5 px-1">
                <span className="text-[12px] font-extrabold uppercase tracking-[0.1em]" style={{ color: C.muted }}>
                  {g.chapter}
                </span>
                <span className="flex-1 h-px" style={{ background: C.line }} />
              </div>
            )}
            <div className="space-y-3">
              {g.items.map((topic) => (
                <TopicCard key={topic.id} topic={topic} onOpen={(t) => navigate(`/lessons/${t.id}`)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
