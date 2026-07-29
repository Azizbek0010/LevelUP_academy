import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck, BookOpen, PlayCircle, Coins, Clock, HelpCircle } from 'lucide-react';
import { Tabs, EmptyState } from '../components/ui.jsx';
import { MOCK_TOPICS } from './Lessons.jsx';

/**
 * Внутри темы — три вкладки. Контент вкладок тоже мок (см. комментарий в
 * Lessons.jsx) — здесь фиксируется UI-форма, не реальные квизы/файлы.
 */

const TABS = [
  { value: 'tests', label: 'Тесты', icon: ClipboardCheck },
  { value: 'homework', label: 'Домашние задания', icon: BookOpen },
  { value: 'videos', label: 'Видеоуроки', icon: PlayCircle },
];

function TestsTab({ topic }) {
  return (
    <div className="card bg-base-100 rounded-3xl p-6">
      <div className="flex items-start gap-4">
        <span className="w-14 h-14 rounded-2xl grid place-items-center shrink-0 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #60A5FA, #2563EB)' }}>
          <ClipboardCheck size={24} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-extrabold">Квиз: {topic.title}</div>
          <div className="text-sm text-base-content/50 font-medium mt-0.5">10 вопросов · 5 минут</div>
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold bg-amber-500/12 text-amber-600">
              <Coins size={12} /> +5 коинов
            </span>
            {topic.done && (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold bg-success/12 text-success">
                Сдано · {topic.testScore}%
              </span>
            )}
          </div>
        </div>
      </div>
      <button type="button" className="btn btn-primary rounded-full mt-5 font-bold w-full sm:w-auto">
        {topic.done ? 'Пройти ещё раз' : 'Начать квиз'}
      </button>
    </div>
  );
}

function HomeworkTab({ topic }) {
  return (
    <div className="card bg-base-100 rounded-3xl p-6">
      <div className="flex items-start gap-4">
        <span className="w-14 h-14 rounded-2xl grid place-items-center shrink-0 text-white shadow-sm" style={{ background: 'linear-gradient(135deg, #FB923C, #EA580C)' }}>
          <BookOpen size={24} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-lg font-extrabold">Домашнее задание</div>
          <div className="text-sm text-base-content/50 font-medium mt-0.5 flex items-center gap-1.5">
            <Clock size={13} /> Сдать до конца недели
          </div>
          <p className="text-sm text-base-content/60 mt-3 leading-relaxed">
            Закрепи тему «{topic.title}» на практике — задание пришлёт ментор ближе к уроку.
          </p>
        </div>
      </div>
      <button type="button" className="btn btn-outline rounded-full mt-5 font-bold w-full sm:w-auto" disabled>
        Пока нет задания
      </button>
    </div>
  );
}

function VideosTab({ topic }) {
  return (
    <div className="card bg-base-100 rounded-3xl overflow-hidden">
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 grid place-items-center relative">
        <span className="w-16 h-16 rounded-full bg-white/90 grid place-items-center shadow-lg">
          <PlayCircle size={32} className="text-primary ml-0.5" />
        </span>
      </div>
      <div className="p-5">
        <div className="text-base font-extrabold">Видеоурок: {topic.title}</div>
        <div className="text-sm text-base-content/45 font-medium mt-0.5">{topic.subtitle}</div>
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
      <div className="card bg-base-100 rounded-3xl">
        <EmptyState
          icon={HelpCircle}
          title="Тема не найдена"
          text="Вернись к списку и выбери тему заново."
          action={<Link to="/lessons" className="btn btn-primary rounded-full font-bold">К урокам</Link>}
        />
      </div>
    );
  }

  return (
    <>
      <button type="button" onClick={() => navigate('/lessons')} className="btn btn-ghost btn-sm rounded-full gap-1.5 mb-4 -ml-2">
        <ArrowLeft size={15} /> Мои уроки
      </button>

      <div className="flex items-center gap-3 mb-6">
        <span
          className="w-12 h-12 rounded-2xl grid place-items-center shrink-0 text-white shadow-sm"
          style={{ background: 'linear-gradient(135deg, #4ADE80, #16A34A)' }}
        >
          <topic.icon size={22} />
        </span>
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-base-content/40">День {topic.day}</div>
          <h1 className="text-2xl font-extrabold leading-tight">{topic.title}</h1>
        </div>
      </div>

      <Tabs value={tab} onChange={setTab} items={TABS.map(({ value, label }) => ({ value, label }))} />

      <div className="mt-5">
        {tab === 'tests' && <TestsTab topic={topic} />}
        {tab === 'homework' && <HomeworkTab topic={topic} />}
        {tab === 'videos' && <VideosTab topic={topic} />}
      </div>
    </>
  );
}
