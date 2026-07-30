import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ClipboardCheck, BookOpen, Video, Check, Clock, Star, Play, HelpCircle, ChevronRight,
} from 'lucide-react';
import { IconTile, Ring, Pill, Button, EmptyState, C } from '../components/ui.jsx';
import { MOCK_TOPICS, topicPercent } from './Lessons.jsx';

/**
 * Страница урока — по постановке Karis: сверху рейтинг/процент выполнения
 * этого урока, ниже три раздела кнопками — Тест, Домашнее задание,
 * Видеоурок.
 *
 * Раньше это были вкладки: приходилось переключаться, чтобы понять, что
 * вообще есть в уроке. Теперь все три видны сразу карточками со своим
 * статусом — ребёнку понятно, что сделано, а что осталось.
 *
 * Контент разделов — мок (см. Lessons.jsx), форма фиксируется сейчас.
 */

/* Карточка раздела урока: крупный цветной значок, статус, кнопка. */
function SectionCard({ icon, hue, title, meta, score, doneLabel, cta, ctaHue, disabled, note }) {
  const done = score != null;
  return (
    <div className="k-card p-5 flex flex-col h-full">
      <div className="flex items-start gap-4">
        <IconTile icon={icon} hue={hue} size={54} />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-extrabold leading-tight" style={{ color: C.text }}>{title}</div>
          <div className="text-[13px] font-semibold mt-1" style={{ color: C.muted }}>{meta}</div>
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {done ? (
              <Pill hue="teal"><Check size={11} strokeWidth={3.5} /> {doneLabel}</Pill>
            ) : (
              <Pill hue="muted"><Clock size={11} strokeWidth={3} /> не сделано</Pill>
            )}
            {!disabled && <Pill hue="amber"><Star size={11} strokeWidth={3} fill="currentColor" /> +5</Pill>}
          </div>
          {note && (
            <p className="text-[12.5px] font-semibold mt-2.5 leading-relaxed" style={{ color: C.muted }}>{note}</p>
          )}
        </div>
      </div>

      {/* Полоса прогресса раздела — видно результат, а не только «сделано» */}
      {done && (
        <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: C.line }}>
          <div className="h-full rounded-full" style={{ width: `${score}%`, background: C.teal }} />
        </div>
      )}

      <div className="mt-4 pt-1 mt-auto">
        <Button hue={ctaHue} size="md" disabled={disabled} className="w-full">
          {!disabled && <Play size={15} strokeWidth={3} fill="currentColor" />}
          {cta}
        </Button>
      </div>
    </div>
  );
}

export default function LessonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const topic = MOCK_TOPICS.find((t) => t.id === id);

  if (!topic) {
    return (
      <div className="k-card">
        <EmptyState
          icon={HelpCircle}
          hue="coral"
          title="Урок не найден"
          text="Вернись к списку и выбери урок заново."
          action={<Button onClick={() => navigate('/lessons')}>К урокам</Button>}
        />
      </div>
    );
  }

  const percent = topicPercent(topic);
  const parts = [
    { label: 'Тест', ok: topic.testScore != null },
    { label: 'Домашка', ok: topic.hwScore != null },
    { label: 'Видео', ok: topic.videoDone },
  ];
  const doneParts = parts.filter((p) => p.ok).length;

  return (
    <>
      <button
        type="button"
        onClick={() => navigate('/lessons')}
        className="inline-flex items-center gap-1.5 text-[13.5px] font-extrabold mb-4 transition-colors"
        style={{ color: C.muted }}
        onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = C.muted; }}
      >
        <ArrowLeft size={16} strokeWidth={3} /> Мои уроки
      </button>

      {/* ══ Рейтинг урока: процент + что именно сделано ══ */}
      <div className="k-card p-5 sm:p-6 mb-4">
        <div className="flex items-center gap-5 flex-wrap sm:flex-nowrap">
          <IconTile icon={topic.icon} hue={topic.hue} size={62} />
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.09em]" style={{ color: C.muted }}>
              Урок {topic.day}
            </div>
            <h1 className="text-[24px] sm:text-[30px] font-extrabold leading-[1.1] tracking-[-0.025em] mt-0.5" style={{ color: C.text }}>
              {topic.title}
            </h1>
            <p className="text-[13.5px] font-semibold mt-1" style={{ color: C.muted }}>{topic.subtitle}</p>
          </div>

          <Ring percent={percent} size={96} thickness={9} color={percent === 100 ? C.teal : C.lime}>
            <div className="text-center leading-none">
              <div className="k-num text-[23px]" style={{ color: C.text }}>{percent}%</div>
              <div className="text-[9.5px] font-extrabold mt-1" style={{ color: C.muted }}>ВЫПОЛНЕНО</div>
            </div>
          </Ring>
        </div>

        {/* Из чего состоит процент — чтобы цифра не была загадкой */}
        <div className="flex items-center gap-2 mt-5 flex-wrap">
          <span className="text-[12px] font-extrabold" style={{ color: C.muted }}>
            {doneParts} из {parts.length} частей:
          </span>
          {parts.map((p) => (
            <Pill key={p.label} hue={p.ok ? 'teal' : 'muted'}>
              {p.ok && <Check size={11} strokeWidth={3.5} />} {p.label}
            </Pill>
          ))}
        </div>
      </div>

      {/* ══ Три раздела урока ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          icon={ClipboardCheck}
          hue="blue"
          ctaHue="blue"
          title="Тест"
          meta="10 вопросов · 5 минут"
          score={topic.testScore}
          doneLabel={`сдан на ${topic.testScore}%`}
          cta={topic.testScore != null ? 'Пройти ещё раз' : 'Начать тест'}
        />
        <SectionCard
          icon={BookOpen}
          hue="coral"
          ctaHue="coral"
          title="Домашнее задание"
          meta="сдать до конца недели"
          score={topic.hwScore}
          doneLabel={`оценка ${topic.hwScore}`}
          cta={topic.hwScore != null ? 'Посмотреть' : 'Задание ещё не выдано'}
          disabled={topic.hwScore == null}
          note={topic.hwScore == null ? 'Ментор выдаст задание ближе к уроку.' : null}
        />
        <SectionCard
          icon={Video}
          hue="violet"
          ctaHue="violet"
          title="Видеоурок"
          meta={topic.subtitle}
          score={topic.videoDone ? 100 : null}
          doneLabel="просмотрен"
          cta={topic.videoDone ? 'Смотреть снова' : 'Смотреть'}
        />
      </div>
    </>
  );
}
