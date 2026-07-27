import { useEffect, useState } from 'react';
import { BookOpen, Paperclip, Coins } from 'lucide-react';
import { api, uploadToPresignedUrl } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { PageHeader, Skeleton, EmptyState, Modal, Pill } from '../components/ui.jsx';
import { fmtDateTime, deadlineLabel } from '../format.js';

function StatusPill({ hw }) {
  if (hw.submission_status === 'graded')
    return <Pill tone="success">Оценено · {hw.score}/{hw.max_score}</Pill>;
  if (hw.submission_status === 'late') return <Pill tone="danger">Сдано с опозданием</Pill>;
  if (hw.submission_status === 'submitted') return <Pill tone="primary">На проверке</Pill>;
  const overdue = hw.deadline && Date.now() > new Date(hw.deadline).getTime();
  return overdue ? <Pill tone="danger">Просрочено</Pill> : <Pill tone="muted">{deadlineLabel(hw.deadline)}</Pill>;
}

export default function Homework() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [active, setActive] = useState(null); // ДЗ в модалке сдачи
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api
      .homework()
      .then((d) => setList(d.data))
      .catch((err) => toast(err.message, 'error'));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openSubmit = (hw) => {
    setActive(hw);
    setText(hw.text_answer || '');
    setFile(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) {
      toast('Добавь текст ответа или файл', 'error');
      return;
    }
    setBusy(true);
    try {
      let fileKey;
      if (file) {
        const d = await api.homeworkUploadUrl(active.id, file.name, file.type || 'application/octet-stream');
        await uploadToPresignedUrl(d.data.uploadUrl, file);
        fileKey = d.data.fileKey;
      }
      await api.submitHomework(active.id, {
        ...(fileKey ? { fileKey } : {}),
        ...(text.trim() ? { textAnswer: text.trim() } : {}),
      });
      toast('Домашка отправлена на проверку', 'success');
      setActive(null);
      load();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Домашние задания" subtitle="Сдавай до дедлайна — после оценки пересдача закрыта" />

      {!list ? (
        <Skeleton h={80} count={4} />
      ) : list.length === 0 ? (
        <div className="card bg-base-100">
          <EmptyState icon={BookOpen} title="Заданий пока нет" text="Ментор ещё не выдал домашки твоим группам." />
        </div>
      ) : (
        <div className="card bg-base-100 divide-y divide-base-200">
          {list.map((hw) => {
            const canSubmit = hw.submission_status !== 'graded';
            return (
              <div key={hw.id} className="flex items-center gap-3 px-4 py-3.5 flex-wrap sm:flex-nowrap">
                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                  <BookOpen size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold truncate">{hw.title}</div>
                  <div className="text-xs text-base-content/45 mt-0.5 flex items-center gap-1 flex-wrap">
                    <span>до {fmtDateTime(hw.deadline)} · макс. {hw.max_score} баллов</span>
                    {hw.coin_reward > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-primary font-semibold">
                        · <Coins size={12} /> +{hw.coin_reward}
                      </span>
                    )}
                  </div>
                </div>
                <StatusPill hw={hw} />
                {canSubmit && (
                  <button className="btn btn-sm btn-neutral" onClick={() => openSubmit(hw)}>
                    {hw.submission_status ? 'Пересдать' : 'Сдать'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {active && (
        <Modal title={`Сдать: ${active.title}`} onClose={() => !busy && setActive(null)}>
          {active.description && (
            <p className="text-sm text-base-content/55 mb-4">{active.description}</p>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="hw-text" className="block text-[13px] font-bold mb-1.5">Текст ответа</label>
              <textarea
                id="hw-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Опиши решение или вставь ссылку…"
                maxLength={10000}
                rows={4}
                className="textarea textarea-bordered w-full text-base sm:text-sm resize-y"
              />
            </div>
            <div>
              <label htmlFor="hw-file" className="flex items-center gap-1.5 text-[13px] font-bold mb-1.5">
                <Paperclip size={13} /> Файл решения (необязательно)
              </label>
              <input
                id="hw-file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="file-input file-input-bordered file-input-sm w-full"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-1">
              <button type="button" className="btn btn-ghost" onClick={() => setActive(null)} disabled={busy}>
                Отмена
              </button>
              <button className="btn btn-primary" disabled={busy}>
                {busy ? <span className="loading loading-spinner loading-sm" /> : 'Отправить'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
