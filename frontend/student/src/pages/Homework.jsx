import { useEffect, useState } from 'react';
import { BookOpen, Paperclip, Coins } from 'lucide-react';
import { api, uploadToPresignedUrl } from '../api.js';
import { useToast } from '../components/toast.jsx';
import { Skeleton, EmptyState, Modal } from '../components/ui.jsx';
import { fmtDateTime, deadlineLabel } from '../format.js';

function statusPill(hw) {
  if (hw.submission_status === 'graded')
    return <span className="pill pill--success">Оценено · {hw.score}/{hw.max_score}</span>;
  if (hw.submission_status === 'late') return <span className="pill pill--danger">Сдано с опозданием</span>;
  if (hw.submission_status === 'submitted') return <span className="pill pill--lime">На проверке</span>;
  const overdue = hw.deadline && Date.now() > new Date(hw.deadline).getTime();
  return overdue ? (
    <span className="pill pill--danger">Просрочено</span>
  ) : (
    <span className="pill pill--muted">{deadlineLabel(hw.deadline)}</span>
  );
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
      <div className="page-head">
        <div>
          <h1>Домашние задания</h1>
          <p>Сдавай до дедлайна — после оценки пересдача закрыта</p>
        </div>
      </div>

      {!list ? (
        <Skeleton h={80} count={4} />
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState icon={BookOpen} title="Заданий пока нет" text="Ментор ещё не выдал домашки твоим группам." />
        </div>
      ) : (
        <div className="card">
          {list.map((hw) => {
            const canSubmit = hw.submission_status !== 'graded';
            return (
              <div key={hw.id} className="row">
                <div className="row__body">
                  <div className="row__title">{hw.title}</div>
                  <div className="row__sub">
                    до {fmtDateTime(hw.deadline)} · макс. {hw.max_score} баллов
                    {hw.coin_reward > 0 && (
                      <>
                        {' · '}
                        <Coins size={12} style={{ display: 'inline', verticalAlign: '-2px' }} /> +{hw.coin_reward}
                      </>
                    )}
                  </div>
                </div>
                {statusPill(hw)}
                {canSubmit && (
                  <button className="btn btn--dark btn--sm" onClick={() => openSubmit(hw)}>
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
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 16 }}>{active.description}</p>
          )}
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="hw-text">Текст ответа</label>
              <textarea
                id="hw-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Опиши решение или вставь ссылку…"
                maxLength={10000}
              />
            </div>
            <div className="field">
              <label htmlFor="hw-file">
                <Paperclip size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> Файл решения
                (необязательно)
              </label>
              <input id="hw-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="modal__actions">
              <button type="button" className="btn btn--ghost" onClick={() => setActive(null)} disabled={busy}>
                Отмена
              </button>
              <button className="btn btn--accent" disabled={busy}>
                {busy ? 'Отправляем…' : 'Отправить'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
