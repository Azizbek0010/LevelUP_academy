import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Phone, Send } from 'lucide-react';
import clsx from 'clsx';
import { studentsApi, type StudentDetail } from '../../../shared/api/endpoints/students';
import { ApiError } from '../../../shared/api/http';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import {
  CliError,
  CliSection,
  CliTextarea,
  HintFooter,
  STANDARD_HINTS,
  useCliShortcuts,
} from '../../../shared/ui/cli';
import { Avatar } from '../../../shared/ui/PageHeader';

const TEMPLATES = [
  { label: 'Об оплате', text: 'Здравствуйте! Напоминаем об оплате за текущий месяц. Спасибо за понимание.' },
  { label: 'Пропуски', text: 'Здравствуйте! Ваш ребёнок пропустил несколько занятий подряд. Уточните, всё ли в порядке.' },
  { label: 'Приход в группу', text: 'Здравствуйте! Ваш ребёнок был добавлен в новую группу. Расписание уточним отдельно.' },
  { label: 'Возврат из заморозки', text: 'Здравствуйте! Заморозка снята — ждём в понедельник на занятиях.' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  student: StudentDetail | null;
}

export function SendMessageModal({ open, onClose, student }: Props): React.ReactElement {
  const qc = useQueryClient();
  const [via, setVia] = useState<'telegram' | 'sms'>('telegram');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setVia(student?.telegramChatId ? 'telegram' : 'sms');
      setMessage('');
      setError(null);
    }
  }, [open, student]);

  // Оптимистичное добавление сообщения в StudentDetail — появляется мгновенно.
  const mut = useMutation({
    mutationFn: () => {
      if (!student) throw new Error('no student');
      return studentsApi.sendMessage(student.id, { message: message.trim(), via });
    },
    onMutate: async () => {
      if (!student) return { prev: undefined };
      const key = ['student', student.id];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<import('../../../shared/api/endpoints/students').StudentDetail>(key);
      qc.setQueryData<import('../../../shared/api/endpoints/students').StudentDetail>(key, (old) =>
        !old
          ? old
          : {
              ...old,
              sentMessages: [
                {
                  id: `temp-${Date.now()}`,
                  message: message.trim(),
                  via,
                  senderId: 'me',
                  senderName: 'Я',
                  senderRole: 'superadmin' as const,
                  status: 'pending' as const,
                  sentAt: new Date().toISOString(),
                },
                ...old.sentMessages,
              ],
            },
      );
      return { prev };
    },
    onSuccess: () => {
      toast.success(via === 'telegram' ? 'Отправлено в Telegram' : 'Отправлено SMS');
      onClose();
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev && student) {
        qc.setQueryData(['student', student.id], ctx.prev);
      }
      setError(err instanceof ApiError ? err.payload.message : 'Не удалось отправить');
    },
    onSettled: () => {
      if (student) qc.invalidateQueries({ queryKey: ['student', student.id] });
    },
  });

  function submit() {
    if (!message.trim()) {
      setError('Введите текст');
      return;
    }
    setError(null);
    mut.mutate();
  }

  useCliShortcuts({ onSubmit: submit, enabled: open });

  const noTg = !student?.telegramChatId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={student ? `send message · ${student.lastName} ${student.firstName}` : 'send message'}
      size="lg"
      hints={<HintFooter items={STANDARD_HINTS} />}
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className="btn btn-primary btn-xs gap-1.5"
            disabled={mut.isPending || !message.trim()}
            onClick={submit}
          >
            {mut.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <Send className="size-3.5" />
            )}
            <span className="font-mono">▸</span> Отправить
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {student && (
          <div className="font-mono text-[11px] text-base-content/60 bg-base-200/40 border border-base-300 rounded px-2.5 py-1.5 flex items-center gap-2">
            <Avatar name={`${student.firstName} ${student.lastName}`} size="sm" />
            <span>
              родитель{' '}
              <span className="text-base-content font-medium">{student.parentPhone}</span>
              {student.telegramChatId && (
                <>
                  {' '}· TG chat{' '}
                  <span className="text-base-content">{student.telegramChatId}</span>
                </>
              )}
            </span>
          </div>
        )}

        <CliSection label="Канал">
          <div className="pl-4 inline-flex items-center gap-0 font-mono text-[12px] p-0.5 rounded-md bg-base-200/60 border border-base-300">
            <button
              type="button"
              disabled={noTg}
              onClick={() => setVia('telegram')}
              className={clsx(
                'px-3 py-1 rounded transition-all flex items-center gap-1.5 disabled:opacity-40',
                via === 'telegram'
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/60 hover:text-base-content',
              )}
            >
              {via === 'telegram' && <span>▸</span>}
              <Send className="size-3.5" /> Telegram
            </button>
            <span className="text-base-content/20 px-1">·</span>
            <button
              type="button"
              onClick={() => setVia('sms')}
              className={clsx(
                'px-3 py-1 rounded transition-all flex items-center gap-1.5',
                via === 'sms'
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/60 hover:text-base-content',
              )}
            >
              {via === 'sms' && <span>▸</span>}
              <Phone className="size-3.5" /> SMS
            </button>
          </div>
          {noTg && (
            <div className="text-[11px] text-warning font-mono pl-4">
              △ TG не подключён — доступен только SMS
            </div>
          )}
        </CliSection>

        <CliSection label="Сообщение">
          <div className="flex flex-wrap gap-1 pl-4">
            {TEMPLATES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => setMessage(t.text)}
                className="px-2 py-0.5 rounded font-mono text-[11px] border border-base-300 text-base-content/60 hover:border-base-content/40 hover:text-base-content transition-all flex items-center gap-1"
              >
                <MessageSquare className="size-3" /> {t.label}
              </button>
            ))}
          </div>
          <CliTextarea
            label="Текст"
            value={message}
            onChange={setMessage}
            required
            rows={6}
            maxLength={1000}
            placeholder="Введи любой текст. Он придёт родителю."
          />
        </CliSection>

        <CliError>{error}</CliError>
      </div>
    </Modal>
  );
}
