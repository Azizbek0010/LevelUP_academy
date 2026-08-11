import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check, ChevronRight, ClipboardCheck, BookOpen, Star, Layers, Clock,
} from 'lucide-react';
import { api } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { IconTile, Ring, Pill, Skeleton, EmptyState, ErrorState, C } from '../components/ui.jsx';
import { fmt, useI18n } from '../../i18n/index.jsx';

/**
 * «Мои уроки» — реальные темы/уроки методиста (training_types → topics →
 * methodology_lessons), подключённые к группе студента админом.
 *
 * Раньше это был статичный мок с придуманным прогрессом (дни, «замки»,
 * оценки за тест/дз/видео на тему в целом). В базе нет ни порядка дней,
 * ни блокировки следующей темы — поэтому здесь честно: все темы открыты,
 * прогресс считается по каждому уроку отдельно (тест или домашка), без
 * выдумки того, чего в системе нет.
 */

/* Честный процент по одному уроку — только то, что реально есть в базе:
   тест — фактический балл (0, если ещё не сдан); домашка — 100 при оценке,
   50 пока на проверке, 0 если не сдана. */
export function lessonPercent(lesson) {
  if (lesson.type === 'test') return lesson.score ?? 0;
  if (lesson.submissionStatus === 'graded') return lesson.submissionScore ?? 100;
  if (lesson.submissionStatus === 'submitted' || lesson.submissionStatus === 'late') return 50;
  return 0;
}

function LessonRow({ lesson, onOpen, delay = 0 }) {
  const { t } = useI18n();
  const isTest = lesson.type === 'test';
  const percent = lessonPercent(lesson);
  const done = isTest ? lesson.score != null : lesson.submissionStatus === 'graded';
  const inProgress = !isTest && (lesson.submissionStatus === 'submitted' || lesson.submissionStatus === 'late');

  return (
    <button
      type="button"
      onClick={() => onOpen(lesson)}
      className="k-card k-pop-in k-hover k-press w-full flex items-center gap-4 p-4 text-left"
      style={{ animationDelay: `${delay}ms` }}
    >
      <IconTile icon={isTest ? ClipboardCheck : BookOpen} hue={isTest ? 'blue' : 'coral'} size={52} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.08em]" style={{ color: C.muted }}>
            {isTest ? t.lessons.test : t.lessons.homework}
          </span>
          {done && <Pill hue="teal"><Check size={11} strokeWidth={3.5} /> {t.lessons.done}</Pill>}
          {inProgress && <Pill hue="amber"><Clock size={11} strokeWidth={3} /> {t.lessons.checking}</Pill>}
        </div>
        <div className="text-[16px] font-extrabold leading-tight mt-1" style={{ color: C.text }}>{lesson.title}</div>
        {lesson.coinReward > 0 && (
          <div className="text-[12.5px] font-bold mt-0.5 flex items-center gap-1" style={{ color: C.limeDk }}>
            <Star size={11} strokeWidth={3} fill="currentColor" /> {fmt(t.lessons.coins, { n: lesson.coinReward })}
          </div>
        )}
      </div>

      <Ring percent={percent} size={50} thickness={6} color={done ? C.teal : C.lime}>
        <span className="k-num text-[12px]" style={{ color: C.text }}>{percent}%</span>
      </Ring>
      <ChevronRight size={18} strokeWidth={2.8} style={{ color: C.muted }} className="shrink-0" />
    </button>
  );
}

export default function Lessons() {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useI18n();
  const [topics, setTopics] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    setError(null);
    return api
      .lessons()
      .then((d) => setTopics(d.data))
      .catch((err) => { setError(err); toast(err.message, 'error'); });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <ErrorState message={error.message} onRetry={load} />;
  if (!topics) return <Skeleton h={90} count={3} />;

  const allLessons = topics.flatMap((t) => t.lessons);

  if (allLessons.length === 0) {
    return (
      <div className="k-card">
        <EmptyState
          icon={Layers}
          hue="violet"
          title={t.lessons.empty}
          text={t.lessons.emptyText}
        />
      </div>
    );
  }

  const doneCount = allLessons.filter((l) => (l.type === 'test' ? l.score != null : l.submissionStatus === 'graded')).length;
  const coursePercent = Math.round(allLessons.reduce((sum, l) => sum + lessonPercent(l), 0) / allLessons.length);
  let cardIndex = 0;

  return (
    <>
      <div className="k-card p-5 mb-5 flex items-center gap-5">
        <Ring percent={coursePercent} size={84} thickness={8}>
          <div className="text-center leading-none">
            <div className="k-num text-[21px]" style={{ color: C.text }}>{coursePercent}%</div>
          </div>
        </Ring>
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] sm:text-[29px] font-extrabold leading-[1.1] tracking-[-0.025em]" style={{ color: C.text }}>
            {t.lessons.title}
          </h1>
          <p className="text-[13.5px] font-semibold mt-1" style={{ color: C.muted }}>
            {fmt(t.lessons.doneOf, { done: doneCount, total: allLessons.length })}
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {topics.map((topic) => (
          <div key={topic.id}>
            <div className="flex items-center gap-3 mb-2.5 px-1">
              <span className="text-[12px] font-extrabold uppercase tracking-[0.1em]" style={{ color: C.muted }}>
                {topic.name}
              </span>
              <span className="flex-1 h-px" style={{ background: C.line }} />
            </div>
            {topic.lessons.length === 0 ? (
              <p className="text-[13px] font-semibold px-1" style={{ color: C.muted }}>{t.lessons.soon}</p>
            ) : (
              <div className="space-y-3">
                {topic.lessons.map((lesson) => (
                  <LessonRow
                    key={lesson.id}
                    lesson={lesson}
                    onOpen={(l) => navigate(`/lessons/${l.id}`)}
                    delay={Math.min(cardIndex++, 9) * 50}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
