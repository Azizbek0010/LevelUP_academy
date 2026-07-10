import { useEffect, useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { usersApi, type UserItem } from '../../../shared/api/endpoints/users';
import { ApiError } from '../../../shared/api/http';
import { Modal } from '../../../shared/ui/Modal';
import { toast } from '../../../shared/ui/Toast';
import { useT } from '../../../shared/i18n/useT';
import {
  CliPasswordField,
  CliField,
  CliSection,
  CliError,
  HintFooter,
  STANDARD_HINTS,
  useCliShortcuts,
} from '../../../shared/ui/cli';

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserItem | null;
}

export function PasswordModal({ open, onClose, user }: Props): React.ReactElement {
  const t = useT();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPassword('');
      setConfirm('');
      setError(null);
    }
  }, [open]);

  const mut = useMutation({
    mutationFn: () => usersApi.changePassword(user!.id, { password }),
    onSuccess: () => {
      toast.success('Пароль обновлён');
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.payload.message : 'Ошибка');
    },
  });

  function submit() {
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов');
      return;
    }
    if (password !== confirm) {
      setError('Пароли не совпадают');
      return;
    }
    setError(null);
    mut.mutate();
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit();
  }

  useCliShortcuts({ onSubmit: submit, enabled: open });

  const match: { text: string; tone: 'ok' | 'warn' | 'muted' } = confirm.length === 0
    ? { text: 'повтори пароль', tone: 'muted' }
    : confirm === password
      ? { text: 'совпадает', tone: 'ok' }
      : { text: 'не совпадает', tone: 'warn' };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? `password · ${user.email}` : 'password'}
      size="sm"
      hints={<HintFooter items={STANDARD_HINTS} />}
      footer={
        <>
          <button type="button" className="btn btn-ghost btn-xs" onClick={onClose}>
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            form="pwd-form"
            className="btn btn-primary btn-xs gap-1.5"
            disabled={mut.isPending}
          >
            {mut.isPending && <span className="loading loading-spinner loading-xs" />}
            <span className="font-mono">▸</span> сохранить
          </button>
        </>
      }
    >
      <form id="pwd-form" className="space-y-4" onSubmit={onSubmit}>
        {user && (
          <div className="font-mono text-[11px] text-base-content/60 bg-base-200/40 border border-base-300 rounded px-2.5 py-1.5">
            <span className="text-warning mr-1">△</span>смена пароля для{' '}
            <span className="text-base-content">
              {user.lastName} {user.firstName}
            </span>{' '}
            · роль <span className="text-primary">{user.role}</span>
          </div>
        )}

        <CliSection label="Новый пароль">
          <CliPasswordField
            label="Пароль"
            value={password}
            onChange={setPassword}
            required
            minLength={6}
          />
          <CliField
            label="Повтор"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            mono
            placeholder="••••••••"
            hintText={match.text}
            hintTone={match.tone}
          />
        </CliSection>

        <CliError>{error}</CliError>
      </form>
    </Modal>
  );
}
