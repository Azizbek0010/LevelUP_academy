import { BookOpen, FileCheck2, Check, X, AlertTriangle, Sparkles } from 'lucide-react';
import { useHomeworkDetail, useTestDetail } from '../queries.js';
import { dateShort, gradePercent } from '../format.js';
import { C, IconTile, Modal, Skeleton } from '../student/components/ui.jsx';
import { useI18n } from '../i18n.jsx';

function Loading() {
  return (
    <div className="py-4"><Skeleton h={48} /><div className="mt-3"><Skeleton h={120} /></div></div>
  );
}

function gradeColor(pct) {
  return pct >= 80 ? { color: '#1F7A3D', bg: '#E8F6EC' } : pct >= 60 ? { color: C.amber, bg: '#F7EDD9' } : { color: C.coral, bg: '#FBE9E3' };
}

function Tag({ children, color, bg }) {
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0" style={{ background: bg, color }}>
      {children}
    </span>
  );
}

function AnswerLine({ label, value, color, icon: Icon }) {
  return (
    <p className="flex items-start gap-2 text-[12.5px] font-semibold">
      <Icon size={14} strokeWidth={2.4} className="shrink-0 mt-0.5" style={{ color }} />
      <span className="min-w-0">
        <span style={{ color: C.muted }}>{label}: </span>
        <span className="font-bold" style={{ color }}>{value}</span>
      </span>
    </p>
  );
}

function HomeworkDetail({ data }) {
  const { t } = useI18n();
  const pct = gradePercent(data.score, data.maxScore, 'hw');
  const c = gradeColor(pct);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <IconTile icon={BookOpen} hue="blue" size={46} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-extrabold leading-tight" style={{ color: C.text }}>{data.title}</h3>
          <p className="text-[12px] font-semibold flex items-center gap-2 mt-1">
            {data.groupName && <Tag color={C.blue} bg="#E1EDF5">{data.groupName}</Tag>}
            <span style={{ color: C.muted }}>{dateShort(data.gradedAt)}</span>
          </p>
        </div>
        <span
          className="k-num text-[15px] font-extrabold w-12 h-12 rounded-xl grid place-items-center shrink-0"
          style={{ background: c.bg, color: c.color }}
        >
          {pct}%
        </span>
      </div>

      {data.description && (
        <div className="p-4 rounded-xl" style={{ background: C.bg }}>
          <p className="text-[11px] font-bold uppercase tracking-wide mb-1" style={{ color: C.muted }}>{t('gd.taskCondition')}</p>
          <p className="text-[13.5px] font-semibold leading-relaxed" style={{ color: C.text }}>{data.description}</p>
        </div>
      )}

      <div>
        <div className="flex justify-between text-[12px] font-semibold mb-1.5" style={{ color: C.muted }}>
          <span>{t('gd.score')}</span>
          <span className="font-extrabold" style={{ color: c.color }}>{data.score} / {data.maxScore}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: C.line }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
        </div>
      </div>

      {data.comment && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl" style={{ background: `${c.bg}66`, border: `1px solid ${c.bg}` }}>
          <Sparkles size={16} strokeWidth={2.2} className="shrink-0 mt-0.5" style={{ color: c.color }} />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide mb-0.5" style={{ color: C.muted }}>{t('gd.mentorComment')}</p>
            <p className="text-[13.5px] font-semibold" style={{ color: C.text }}>{data.comment}</p>
          </div>
        </div>
      )}

      {data.mistakes?.length > 0 && (
        <div>
          <h4 className="text-[14px] font-extrabold mb-3" style={{ color: C.text }}>{t('gd.mistakes', { count: data.mistakes.length })}</h4>
          <div className="space-y-2">
            {data.mistakes.map((m, i) => (
              <div key={i} className="p-3.5 rounded-xl" style={{ background: '#FBE9E3', border: '1px solid #F3C9BD' }}>
                <p className="text-[13px] font-bold mb-1.5" style={{ color: C.text }}>{m.question}</p>
                <div className="space-y-1">
                  <AnswerLine icon={X} color={C.coral} label={t('gd.yourAnswer')} value={m.studentAnswer} />
                  <AnswerLine icon={Check} color="#1F7A3D" label={t('gd.correct')} value={m.correctAnswer} />
                  {m.comment && (
                    <p className="text-[12.5px] font-semibold flex items-start gap-2 mt-1" style={{ color: C.muted }}>
                      <AlertTriangle size={14} strokeWidth={2.2} className="shrink-0 mt-0.5" />
                      {m.comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pct >= 90 && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl" style={{ background: '#E8F6EC', border: '1px solid #BCE0C6' }}>
          <Sparkles size={18} strokeWidth={2.2} className="shrink-0" style={{ color: '#1F7A3D' }} />
          <p className="text-[13.5px] font-bold" style={{ color: '#1F7A3D' }}>{t('gd.excellent')}</p>
        </div>
      )}
    </div>
  );
}

function TestDetail({ data }) {
  const { t } = useI18n();
  const pct = gradePercent(data.score, data.maxScore, 'test');
  const c = gradeColor(pct);

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <IconTile icon={FileCheck2} hue="violet" size={46} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[16px] font-extrabold leading-tight" style={{ color: C.text }}>{data.title}</h3>
          <p className="text-[12px] font-semibold flex items-center gap-2 mt-1">
            {data.groupName && <Tag color={C.violet} bg="#E9E6F3">{data.groupName}</Tag>}
            <span style={{ color: C.muted }}>{dateShort(data.finishedAt)}</span>
            {data.durationMin && <span style={{ color: C.muted }}>· {t('gd.min', { min: data.durationMin })}</span>}
          </p>
        </div>
        <span
          className="k-num text-[15px] font-extrabold w-12 h-12 rounded-xl grid place-items-center shrink-0"
          style={{ background: c.bg, color: c.color }}
        >
          {pct}%
        </span>
      </div>

      {data.totalQuestions != null && (
        <div className="grid grid-cols-3 gap-2.5">
          <div className="text-center p-3 rounded-xl" style={{ background: C.bg }}>
            <p className="k-num text-[20px] font-extrabold" style={{ color: C.text }}>{data.totalQuestions}</p>
            <p className="text-[10.5px] font-bold mt-0.5" style={{ color: C.muted }}>{t('gd.total')}</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: '#E8F6EC' }}>
            <p className="k-num text-[20px] font-extrabold" style={{ color: '#1F7A3D' }}>{data.correctCount}</p>
            <p className="text-[10.5px] font-bold mt-0.5" style={{ color: '#1F7A3D' }}>{t('gd.correctCount')}</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: '#FBE9E3' }}>
            <p className="k-num text-[20px] font-extrabold" style={{ color: C.coral }}>{data.wrongCount}</p>
            <p className="text-[10.5px] font-bold mt-0.5" style={{ color: C.coral }}>{t('gd.wrongCount')}</p>
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between text-[12px] font-semibold mb-1.5" style={{ color: C.muted }}>
          <span>{t('gd.result')}</span>
          <span className="font-extrabold" style={{ color: c.color }}>{pct}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: C.line }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
        </div>
      </div>

      {data.wrongAnswers?.length > 0 && (
        <div>
          <h4 className="text-[14px] font-extrabold mb-3" style={{ color: C.text }}>{t('gd.wrongAnswers', { count: data.wrongAnswers.length })}</h4>
          <div className="space-y-2">
            {data.wrongAnswers.map((q, i) => (
              <div key={i} className="p-3.5 rounded-xl" style={{ background: '#FBE9E3', border: '1px solid #F3C9BD' }}>
                <p className="text-[13px] font-bold mb-1.5" style={{ color: C.text }}>{i + 1}. {q.question}</p>
                <div className="space-y-1">
                  <AnswerLine icon={X} color={C.coral} label={t('gd.yourAnswer')} value={q.studentAnswer} />
                  <AnswerLine icon={Check} color="#1F7A3D" label={t('gd.correct')} value={q.correctAnswer} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.correctAnswers?.length > 0 && (
        <div>
          <h4 className="text-[14px] font-extrabold mb-3" style={{ color: C.text }}>{t('gd.correctAnswers', { count: data.correctAnswers.length })}</h4>
          <div className="space-y-1.5">
            {data.correctAnswers.map((q, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: '#E8F6EC' }}>
                <Check size={15} strokeWidth={2.8} className="shrink-0" style={{ color: '#1F7A3D' }} />
                <span className="text-[12.5px] font-semibold truncate" style={{ color: '#1F7A3D' }}>{q.question}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GradeDetail({ type, id, item, onClose }) {
  const { t } = useI18n();
  const isHomework = type === 'hw';
  const { data, isLoading, error } = isHomework ? useHomeworkDetail(id) : useTestDetail(id);

  // API возвращает { data: {...} }; в списке же строка — без обёртки.
  // Если detail-эндпоинт недоступен (нет id в списке, 404) — показываем
  // read-only вариант из данных строки (score/maxScore достаточно для %).
  const detail = data?.data ?? item;

  return (
    <Modal title={isHomework ? t('gd.homework') : t('gd.testResult')} onClose={onClose}>
      {isLoading && <Loading />}
      {error && !item && (
        <div className="text-center py-8">
          <IconTile icon={AlertTriangle} hue="coral" size={56} className="mx-auto" />
          <p className="text-[13.5px] font-semibold mt-3" style={{ color: C.muted }}>{error.message}</p>
        </div>
      )}
      {detail && (isHomework ? <HomeworkDetail data={detail} /> : <TestDetail data={detail} />)}
    </Modal>
  );
}
