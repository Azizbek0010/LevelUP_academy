import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Phone, Search, User } from 'lucide-react';
import clsx from 'clsx';
import { http } from '../../../shared/api/http';
import { ApiError } from '../../../shared/api/http';
import type { ReminderItem } from '../../../shared/api/endpoints/reminders';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import { MOCK_STUDENTS } from '../../../dev/mockData';
import {
  CliSection,
  CliTextarea,
  CliError,
  HintFooter,
  STANDARD_HINTS,
  useCliShortcuts,
} from '../../../shared/ui/cli';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = 'student' | 'phone';

const TEMPLATES = [
  { label: 'Об оплате', text: 'Здравствуйте! Напоминаем об оплате за текущий месяц. Спасибо за понимание.' },
  { label: 'Пропуски', text: 'Здравствуйте! Ваш ребёнок пропустил несколько занятий подряд. Уточните, всё ли в порядке.' },
  { label: 'Родительское собрание', text: 'Здравствуйте! В субботу в 15:00 состоится родительское собрание. Просим прийти.' },
];

const UZ_PHONE_RE = /^\+998\d{9}$/;

export function SendReminderModal({ open, onClose }: Props): React.ReactElement {
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>('student');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [customName, setCustomName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMode('student');
      setSearch('');
      setSelectedId(null);
      setPhone('');
      setCustomName('');
      setMessage('');
      setError(null);
    }
  }, [open]);

  const options = useMemo(() => {
    const active = MOCK_STUDENTS.filter((s) => !s.isArchived);
    if (!search) return active.slice(0, 30);
    const q = search.toLowerCase();
    return active
      .filter(
        (s) =>
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.parentPhone.includes(q),
      )
      .slice(0, 30);
  }, [search]);

  const mut = useMutation({
    mutationFn: () => {
      const body =
        mode === 'student'
          ? { studentId: selectedId, message: message.trim() }
          : {
              studentId: null,
              parentPhone: phone.trim(),
              recipientName: customName.trim() || 'Родитель',
              message: message.trim(),
            };
      return http.post<ReminderItem>('/superadmin/reminders', body);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      toast.success('Напоминание отправлено в очередь');
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.payload.message : 'Ошибка');
    },
  });

  const selectedStudent = MOCK_STUDENTS.find((s) => s.id === selectedId);
  const phoneValid = UZ_PHONE_RE.test(phone.trim());
  const canSubmit =
    (mode === 'student' ? !!selectedId : phoneValid) && !!message.trim();

  function submit() {
    if (mode === 'student' && !selectedId) {
      setError('Выберите студента');
      return;
    }
    if (mode === 'phone' && !phoneValid) {
      setError('Введите номер в формате +998XXXXXXXXX');
      return;
    }
    if (!message.trim()) {
      setError('Введите текст сообщения');
      return;
    }
    setError(null);
    mut.mutate();
  }

  useCliShortcuts({ onSubmit: submit, enabled: open });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="send reminder"
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
            disabled={!canSubmit || mut.isPending}
            onClick={submit}
          >
            {mut.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <MessageSquare className="size-3.5" />
            )}
            <span className="font-mono">▸</span> отправить
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <CliSection label="Режим">
          <div className="inline-flex items-center gap-0 font-mono text-[12px] p-0.5 rounded-md bg-base-200/60 border border-base-300 ml-4">
            <button
              type="button"
              onClick={() => setMode('student')}
              className={clsx(
                'px-3 py-1 rounded transition-all flex items-center gap-1.5',
                mode === 'student'
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/60 hover:text-base-content',
              )}
            >
              {mode === 'student' && <span>▸</span>}
              <User className="size-3.5" /> студент
            </button>
            <span className="text-base-content/20 px-1">·</span>
            <button
              type="button"
              onClick={() => setMode('phone')}
              className={clsx(
                'px-3 py-1 rounded transition-all flex items-center gap-1.5',
                mode === 'phone'
                  ? 'bg-primary text-primary-content shadow-sm'
                  : 'text-base-content/60 hover:text-base-content',
              )}
            >
              {mode === 'phone' && <span>▸</span>}
              <Phone className="size-3.5" /> телефон
            </button>
          </div>
        </CliSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CliSection label="Получатель">
            {mode === 'student' ? (
              <>
                <label className="flex items-center gap-2 border-b border-base-300 mx-2 pb-1 focus-within:border-primary">
                  <Search className="size-3.5 text-base-content/40" />
                  <input
                    type="search"
                    value={search}
                    placeholder="поиск студента…"
                    className="flex-1 bg-transparent text-base-content outline-none text-sm placeholder:text-base-content/25"
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                  />
                </label>
                <div className="border border-base-300 rounded-md max-h-56 overflow-y-auto divide-y divide-base-200 mx-2 font-mono text-[12px]">
                  {options.length === 0 && (
                    <div className="p-4 text-center text-base-content/40">
                      ○ ничего не найдено
                    </div>
                  )}
                  {options.map((s) => {
                    const active = selectedId === s.id;
                    return (
                      <button
                        type="button"
                        key={s.id}
                        className={clsx(
                          'w-full text-left px-2.5 py-1.5 flex items-center justify-between transition-colors',
                          active
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-base-200/60',
                        )}
                        onClick={() => setSelectedId(s.id)}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={active ? 'text-primary' : 'text-base-content/25'}>▸</span>
                          <span className="font-sans font-medium truncate">
                            {s.lastName} {s.firstName}
                          </span>
                          <span className="text-base-content/40">· {s.parentPhone}</span>
                        </div>
                        {active && <span className="text-[10px]">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Широкие полноразмерные поля — без хинтов сбоку, чтобы весь номер помещался */}
                <WideField
                  label="Телефон"
                  required
                  value={phone}
                  onChange={setPhone}
                  type="tel"
                  autoFocus
                  mono
                />
                <WideField
                  label="Имя"
                  value={customName}
                  onChange={setCustomName}
                />
                <div className="font-mono text-[11px] text-warning bg-warning/5 border-l-2 border-warning/50 pl-2 py-1 mx-2">
                  △ родитель должен быть подписан на бота, иначе доставка вернётся ошибкой
                </div>
              </>
            )}
          </CliSection>

          <CliSection label="Сообщение">
            <div className="flex flex-wrap gap-1 pl-4">
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setMessage(t.text)}
                  className="px-2 py-0.5 rounded font-mono text-[11px] border border-base-300 text-base-content/60 hover:border-base-content/40 hover:text-base-content transition-all"
                >
                  {t.label}
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
              placeholder="Введи любой текст. Он придёт в Telegram."
              hint={
                mode === 'student' && selectedStudent
                  ? `→ ${selectedStudent.parentPhone}`
                  : mode === 'phone' && phone
                    ? `→ ${phone}`
                    : ''
              }
            />
          </CliSection>
        </div>

        <CliError>{error}</CliError>
      </div>
    </Modal>
  );
}

/**
 * Полноширочное поле для контактов: label сверху, input под ним.
 * Без CliField-подсказок сбоку — весь номер помещается.
 */
function WideField({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  mono = false,
  autoFocus = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  mono?: boolean;
  autoFocus?: boolean;
}): React.ReactElement {
  return (
    <label className="block px-2 py-1">
      <div className="text-[11px] text-base-content/60 font-medium mb-1 flex items-center gap-1">
        <span className="text-base-content/30 font-mono">▸</span>
        {label}
        {required && <span className="text-error/70">*</span>}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoFocus={autoFocus}
        className={`w-full h-9 px-3 rounded-md border border-base-300 bg-base-100 text-base text-base-content outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-colors ${
          mono ? 'font-mono' : ''
        }`}
      />
    </label>
  );
}
