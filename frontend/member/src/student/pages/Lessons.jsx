import { useNavigate } from 'react-router-dom';
import { Lock, Check, Globe, Palette, LayoutGrid, Braces, MousePointerClick } from 'lucide-react';

/**
 * «Мои уроки» — прототип UI, данные захардкожены намеренно (Karis: «hozir
 * ui statik qilib tur keyin backend integratsiya qilamiz»). Бэкенд для
 * учебного плана по дням (тема методиста → день → группа) пока не
 * существует — training_types/topics в базе это плоский каталог без
 * привязки к дате или группе, см. discussion 2026-07-30. Когда появится
 * реальный эндпоинт — этот массив меняется на fetch, вёрстка ниже не тронется.
 *
 * 2026-07-30, вторая итерация: первая версия была вертикальным списком
 * карточек — Karis прямо сказал, что это «не другой дизайн, а те же
 * размеры». Настоящий узнаваемый паттерн детских обучающих приложений
 * (Duolingo и клоны) — не список, а извилистая ТРОПА из крупных круглых
 * узлов, смещённых то влево, то вправо. Это и есть отличие «весь дизайн»
 * от «поменяли отступы» — другая композиция страницы, не косметика.
 *
 * Иконки — только lucide (векторные), никаких emoji-как-иконок.
 */
export const MOCK_TOPICS = [
  { id: '1', day: 1, icon: Globe, title: 'HTML — основы', subtitle: 'Теги, структура страницы', locked: false, done: true, testScore: 100 },
  { id: '2', day: 2, icon: Palette, title: 'CSS — стили', subtitle: 'Цвета, отступы, шрифты', locked: false, done: true, testScore: 80 },
  { id: '3', day: 3, icon: LayoutGrid, title: 'Flexbox и Grid', subtitle: 'Раскладка элементов на странице', locked: false, done: false, testScore: null },
  { id: '4', day: 4, icon: Braces, title: 'JavaScript — переменные', subtitle: 'Первые шаги в программировании', locked: true, done: false, testScore: null },
  { id: '5', day: 5, icon: MousePointerClick, title: 'DOM и события', subtitle: 'Как оживить страницу', locked: true, done: false, testScore: null },
];

// Смещение узла по горизонтали — center/right/left по кругу, как тропа,
// а не строгий зигзаг влево-вправо (тот выглядит слишком механически).
const OFFSETS = ['justify-center', 'justify-end', 'justify-center', 'justify-start'];

function Node({ topic, index, onOpen }) {
  const { icon: Icon, day, title, locked, done, testScore } = topic;
  const current = !locked && !done;

  const bg = locked
    ? 'linear-gradient(135deg, #CBD5E1, #94A3B8)'
    : done
      ? 'linear-gradient(135deg, #4ADE80, #16A34A)'
      : 'linear-gradient(135deg, #60A5FA, #2563EB)';
  const shadowColor = locked ? '#64748B' : done ? '#15803D' : '#1E40AF';

  return (
    <div className={`flex ${OFFSETS[index % OFFSETS.length]} px-4 sm:px-10`}>
      <div className="flex flex-col items-center w-28 shrink-0">
        <button
          type="button"
          onClick={() => !locked && onOpen(topic)}
          disabled={locked}
          aria-label={title}
          className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full grid place-items-center text-white transition-transform ${
            current ? 'animate-[pulse_2.5s_ease-in-out_infinite]' : ''
          } ${locked ? 'cursor-not-allowed' : 'active:translate-y-[3px] hover:-translate-y-0.5'}`}
          style={{ background: bg, boxShadow: `0 5px 0 0 ${shadowColor}` }}
        >
          {locked ? <Lock size={28} /> : done ? <Check size={32} strokeWidth={3} /> : <Icon size={30} />}
          {current && (
            <span
              className="absolute -inset-1.5 rounded-full -z-10"
              style={{ border: '3px dashed #93C5FD' }}
              aria-hidden="true"
            />
          )}
        </button>

        <div className="mt-2.5 text-center">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-base-content/40">День {day}</div>
          <div className={`text-sm font-extrabold leading-tight mt-0.5 ${locked ? 'text-base-content/35' : ''}`}>
            {title}
          </div>
          {done && <div className="text-xs font-bold text-success mt-1">{testScore}%</div>}
          {current && <div className="text-xs font-bold text-info mt-1">Начать</div>}
        </div>
      </div>
    </div>
  );
}

export default function Lessons() {
  const navigate = useNavigate();

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[26px] sm:text-[32px] font-extrabold leading-tight tracking-tight">Мои уроки</h1>
        <p className="text-sm sm:text-base text-base-content/55 mt-1 font-medium">
          Проходи темы по порядку — новая открывается, когда сдана предыдущая
        </p>
      </div>

      <div className="space-y-10 sm:space-y-12 max-w-lg mx-auto">
        {MOCK_TOPICS.map((topic, i) => (
          <Node key={topic.id} topic={topic} index={i} onOpen={(t) => navigate(`/lessons/${t.id}`)} />
        ))}
      </div>
    </>
  );
}
