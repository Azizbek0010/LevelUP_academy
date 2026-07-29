import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, BookOpen, PlayCircle, Clock, HelpCircle, Star, Play } from 'lucide-react';
import { Tabs, EmptyState, Button, Pill, INK, HUE, textOn } from '../components/ui.jsx';
import { MOCK_TOPICS } from './Lessons.jsx';

/**
 * Тема изнутри: три раздела — тесты, домашка, видео. Контент моковый
 * (см. комментарий в Lessons.jsx) — здесь фиксируется форма, не данные.
 *
 * 2026-07-30: переписано под язык кабинета (обводка + твёрдая тень,
 * плоские заливки). Раньше карточки были на градиентах и blur-тенях —
 * тот самый «AI-вид».
 */

const TABS = [
  { value: 'tests', label: 'Тесты' },
  { value: 'homework', label: 'Домашка' },
  { value: 'videos', label: 'Видео' },
];

/* Общая карточка раздела: цветной значок-квадрат с обводкой, заголовок,
   метаданные ярлыками, действие снизу. */
function TaskCard({ Icon, hue, title, meta, children, action }) {
  return (
    <div className="kid-card p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span
          className="w-14 h-14 grid place-items-center shrink-0"
          style={{ background: HUE[hue], color: textOn(hue), border: `3px solid ${INK}`, borderRadius: 17 }}
        >
          <Icon size={26} strokeWidth={2.7} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[20px] font-extrabold leading-tight" style={{ color: INK }}>{title}</div>
          {meta && <div className="text-[13.5px] font-bold mt-1" style={{ color: 'rgba(27,42,27,0.5)' }}>{meta}</div>}
          {children}
        </div>
      </div>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function TestsTab({ topic }) {
  return (
    <TaskCard
      Icon={ClipboardCheck}
      hue="sky"
      title={`Квиз: ${topic.title}`}
      meta="10 вопросов · 5 минут"
      action={
        <Button hue="sky" size="lg" className="w-full sm:w-auto">
          <Play size={18} strokeWidth={3} fill="currentColor" />
          {topic.done ? 'Пройти ещё раз' : 'Начать квиз'}
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Pill hue="sun"><Star size={12} strokeWidth={3} fill={INK} /> +5 монет</Pill>
        {topic.done && <Pill hue="grass">Сдано · {topic.testScore}%</Pill>}
      </div>
    </TaskCard>
  );
}

function HomeworkTab({ topic }) {
  return (
    <TaskCard
      Icon={BookOpen}
      hue="coral"
      title="Домашнее задание"
      meta="Сдать до конца недели"
      action={<Button hue="slate" disabled className="w-full sm:w-auto">Задание ещё не выдано</Button>}
    >
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <Pill hue="slate"><Clock size={12} strokeWidth={3} /> ждём ментора</Pill>
      </div>
      <p className="text-[14px] font-bold mt-3 leading-relaxed" style={{ color: 'rgba(27,42,27,0.6)' }}>
        Закрепишь тему «{topic.title}» на практике — ментор выдаст задание ближе к уроку.
      </p>
    </TaskCard>
  );
}

function VideosTab({ topic }) {
  return (
    <div className="kid-card overflow-hidden">
      {/* Заглушка плеера: плоская заливка + крупная кнопка play, без
          blur-градиента (тот читался как «пустое место») */}
      <button
        type="button"
        className="kid-press w-full aspect-video grid place-items-center relative"
        style={{ background: HUE.sky, borderBottom: `3px solid ${INK}`, borderRadius: 0, boxShadow: 'none' }}
        aria-label={`Смотреть видеоурок: ${topic.title}`}
      >
        <topic.icon
          size={180}
          strokeWidth={2}
          className="absolute text-white pointer-events-none"
          style={{ opacity: 0.16 }}
          aria-hidden="true"
        />
        <span
          className="relative w-20 h-20 rounded-full grid place-items-center"
          style={{ background: HUE.lime, border: `4px solid ${INK}`, boxShadow: `0 5px 0 0 ${INK}`, color: INK }}
        >
          <Play size={34} strokeWidth={3} fill={INK} className="ml-1" />
        </span>
      </button>
      <div className="p-5">
        <div className="text-[19px] font-extrabold" style={{ color: INK }}>Видеоурок: {topic.title}</div>
        <div className="text-[13.5px] font-bold mt-1" style={{ color: 'rgba(27,42,27,0.5)' }}>{topic.subtitle}</div>
      </div>
    </div>
  );
}

export default function LessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('tests');

  const topic = MOCK_TOPICS.find((t) => t.id === id);

  if (!topic) {
    return (
      <div className="kid-card">
        <EmptyState
          icon={HelpCircle}
          hue="coral"
          title="Тема не найдена"
          text="Вернись к тропе и выбери тему заново."
          action={<Button onClick={() => navigate('/lessons')}>К урокам</Button>}
        />
      </div>
    );
  }

  const hue = topic.done ? 'grass' : 'sky';

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/lessons')}
        className="kid-press inline-flex items-center gap-2 text-[14px] font-extrabold px-4 py-2 mb-5"
        style={{ background: '#FFFDF7', color: INK, border: `3px solid ${INK}`, borderRadius: 14, boxShadow: `3px 3px 0 0 ${INK}` }}
      >
        <ArrowLeft size={16} strokeWidth={3} /> Мои уроки
      </button>

      {/* Шапка темы: тот же узел, что на тропе — ученик узнаёт, куда попал */}
      <div className="flex items-center gap-4 mb-7">
        <span
          className="w-16 h-16 rounded-full grid place-items-center shrink-0"
          style={{ background: HUE[hue], color: textOn(hue), border: `4px solid ${INK}`, boxShadow: `0 5px 0 0 ${INK}` }}
        >
          <topic.icon size={28} strokeWidth={2.7} />
        </span>
        <div className="min-w-0">
          <div className="text-[12px] font-extrabold uppercase tracking-[0.1em]" style={{ color: 'rgba(27,42,27,0.45)' }}>
            День {topic.day}
          </div>
          <h1 className="text-[28px] sm:text-[34px] font-extrabold leading-[1.05] tracking-[-0.02em]" style={{ color: INK }}>
            {topic.title}
          </h1>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} items={TABS} />

      <div className="mt-5">
        {tab === 'tests' && <TestsTab topic={topic} />}
        {tab === 'homework' && <HomeworkTab topic={topic} />}
        {tab === 'videos' && <VideosTab topic={topic} />}
      </div>
    </>
  );
}
