import { useNavigate } from 'react-router-dom';
import { Lock, ClipboardCheck, BookOpen, PlayCircle, ChevronRight } from 'lucide-react';

/**
 * «Мои уроки» — прототип UI, данные захардкожены намеренно (Karis: «hozir
 * ui statik qilib tur keyin backend integratsiya qilamiz»). Бэкенд для
 * учебного плана по дням (тема методиста → день → группа) пока не
 * существует — training_types/topics в базе это плоский каталог без
 * привязки к дате или группе, см. discussion 2026-07-30. Когда появится
 * реальный эндпоинт — этот массив меняется на fetch, вёрстка ниже не тронется.
 *
 * Разблокировка последовательная (как в Duolingo) — тема открывается только
 * после предыдущей. `locked` тут тоже мок: в реальных данных это будет
 * считаться на бэкенде по прогрессу ученика.
 */
export const MOCK_TOPICS = [
  { id: '1', day: 1, emoji: '🌐', title: 'HTML — основы', subtitle: 'Теги, структура страницы', locked: false, done: true, testScore: 100 },
  { id: '2', day: 2, emoji: '🎨', title: 'CSS — стили', subtitle: 'Цвета, отступы, шрифты', locked: false, done: true, testScore: 80 },
  { id: '3', day: 3, emoji: '📐', title: 'Flexbox и Grid', subtitle: 'Раскладка элементов на странице', locked: false, done: false, testScore: null },
  { id: '4', day: 4, emoji: '⚡', title: 'JavaScript — переменные', subtitle: 'Первые шаги в программировании', locked: true, done: false, testScore: null },
  { id: '5', day: 5, emoji: '🖱️', title: 'DOM и события', subtitle: 'Как оживить страницу', locked: true, done: false, testScore: null },
];

function TopicRow({ topic, onOpen }) {
  const { day, emoji, title, subtitle, locked, done, testScore } = topic;
  return (
    <button
      type="button"
      onClick={() => !locked && onOpen(topic)}
      disabled={locked}
      className={`w-full flex items-center gap-4 rounded-3xl px-5 py-4 text-left transition-all ${
        locked
          ? 'bg-base-200/60 cursor-not-allowed'
          : 'bg-base-100 card-hover-premium shadow-sm hover:-translate-y-0.5'
      }`}
    >
      <span
        className="w-14 h-14 rounded-2xl grid place-items-center shrink-0 text-2xl font-extrabold text-white shadow-sm"
        style={{
          background: locked
            ? 'linear-gradient(135deg, #CBD5E1, #94A3B8)'
            : done
              ? 'linear-gradient(135deg, #4ADE80, #16A34A)'
              : 'linear-gradient(135deg, #60A5FA, #2563EB)',
        }}
      >
        {locked ? <Lock size={22} /> : emoji}
      </span>

      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-base-content/40">
          День {day}
        </div>
        <div className={`text-base font-extrabold truncate ${locked ? 'text-base-content/40' : ''}`}>{title}</div>
        <div className="text-sm text-base-content/45 truncate font-medium">{subtitle}</div>
      </div>

      {!locked && (
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {done ? (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold bg-success/12 text-success">
              <ClipboardCheck size={13} /> {testScore}%
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold bg-primary/12 text-primary">
              Начать
            </span>
          )}
        </div>
      )}

      {!locked && <ChevronRight size={18} className="text-base-content/25 shrink-0" />}
    </button>
  );
}

export default function Lessons() {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[26px] sm:text-[32px] font-extrabold leading-tight tracking-tight">Мои уроки 📚</h1>
        <p className="text-sm sm:text-base text-base-content/55 mt-1 font-medium">
          Проходи темы по порядку — новая открывается, когда сдана предыдущая
        </p>
      </div>

      <div className="space-y-3">
        {MOCK_TOPICS.map((topic) => (
          <TopicRow key={topic.id} topic={topic} onOpen={(t) => navigate(`/lessons/${t.id}`)} />
        ))}
      </div>
    </>
  );
}
