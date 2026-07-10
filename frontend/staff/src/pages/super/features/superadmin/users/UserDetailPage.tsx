import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Calendar,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Shield,
  StickyNote,
  Trash2,
  UserCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import { usersApi, type UserItem } from '../../../shared/api/endpoints/users';
import { ApiError } from '../../../shared/api/http';
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog';
import { toast } from '../../../shared/ui/Toast';
import { Avatar } from '../../../shared/ui/PageHeader';
import { UserFormModal } from './UserFormModal';
import { PasswordModal } from './PasswordModal';

const ROLE_STYLE: Record<string, string> = {
  superadmin: 'bg-primary/15 text-primary border-primary/30',
  admin: 'bg-info/15 text-info border-info/30',
  mentor: 'bg-success/15 text-success border-success/30',
  parent: 'bg-base-300 text-base-content/60 border-base-300',
  student: 'bg-base-300 text-base-content/60 border-base-300',
};

const ROLE_LABEL: Record<string, string> = {
  superadmin: 'СУПЕР-АДМИН',
  admin: 'АДМИН',
  mentor: 'МЕНТОР',
};

function monthsSince(iso: string): string {
  const created = new Date(iso);
  const now = new Date();
  const months =
    (now.getFullYear() - created.getFullYear()) * 12 +
    (now.getMonth() - created.getMonth());
  if (months < 1) return 'меньше месяца';
  if (months < 12) return `${months} мес.`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? `${years} г.` : `${years} г. ${rest} мес.`;
}

export default function UserDetailPage(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [toDelete, setToDelete] = useState<UserItem | null>(null);

  const query = useQuery({
    queryKey: ['user', id],
    queryFn: () => usersApi.get(id!),
    enabled: !!id,
  });

  const archiveMut = useMutation({
    mutationFn: (archived: boolean) =>
      archived ? usersApi.archive(id!) : usersApi.unarchive(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', id] });
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => usersApi.remove(id!),
    onSuccess: () => {
      toast.success('Пользователь удалён');
      qc.invalidateQueries({ queryKey: ['users'] });
      navigate('/superadmin/users');
    },
    onError: (err) => {
      toast.success(err instanceof ApiError ? err.payload.message : 'Не удалось');
    },
  });

  if (query.isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <span className="loading loading-spinner text-primary" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return (
      <div className="p-8">
        <div className="alert alert-error">
          <span>Пользователь не найден</span>
        </div>
      </div>
    );
  }

  const u = query.data;

  return (
    <div className="p-8 max-w-5xl space-y-4">
      <div>
        <Link to="/superadmin/users" className="btn btn-ghost btn-xs gap-1">
          <ArrowLeft className="size-3.5" /> К списку админов
        </Link>
      </div>

      {/* Hero */}
      <div className="wow-card p-6 wow-rise">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <Avatar name={`${u.firstName} ${u.lastName}`} size="lg" />
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight leading-tight">
                {u.lastName} {u.firstName}
              </h1>
              {u.position && (
                <div className="text-sm text-base-content/70 mt-1 font-medium">
                  {u.position}
                </div>
              )}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span
                  className={clsx(
                    'inline-flex items-center gap-1 px-2 h-5 rounded-full border text-[10px] font-bold uppercase tracking-wide',
                    ROLE_STYLE[u.role],
                  )}
                >
                  <Shield className="size-3" />
                  {ROLE_LABEL[u.role] ?? u.role}
                </span>
                {u.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-success/15 text-success border border-success/30 text-[10px] font-bold uppercase tracking-wide">
                    <span className="size-1.5 rounded-full bg-success wow-pulse" />
                    активен
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-base-200 text-base-content/60 border border-base-300 text-[10px] font-bold uppercase tracking-wide">
                    архив
                  </span>
                )}
                {u.workingSince && (
                  <span className="inline-flex items-center gap-1 px-2 h-5 rounded-full bg-base-200 text-base-content/70 border border-base-300 text-[10px] font-bold uppercase tracking-wide">
                    <Calendar className="size-3" />
                    в команде {monthsSince(u.workingSince)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
            <button
              type="button"
              className="btn btn-primary btn-sm gap-1.5 rounded-lg wow-shine"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-3.5" /> Изменить
            </button>
            <button
              type="button"
              className="btn btn-outline btn-sm gap-1.5 rounded-lg"
              onClick={() => setPwdOpen(true)}
            >
              <KeyRound className="size-3.5" /> Пароль
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-1.5 rounded-lg border border-base-300"
              disabled={archiveMut.isPending}
              onClick={() => archiveMut.mutate(u.isActive)}
            >
              {u.isActive ? (
                <>
                  <Archive className="size-3.5" /> В архив
                </>
              ) : (
                <>
                  <ArchiveRestore className="size-3.5" /> Восст.
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-1.5 rounded-lg border border-error/30 text-error hover:bg-error/10"
              onClick={() => setToDelete(u)}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <InfoCard icon={Mail} label="Email" value={u.email} mono />
        <InfoCard icon={Phone} label="Телефон" value={u.phone ?? '—'} mono />
        <InfoCard
          icon={Calendar}
          label="В команде с"
          value={
            u.workingSince
              ? new Date(u.workingSince).toLocaleDateString('ru-RU')
              : '—'
          }
          sub={u.workingSince ? monthsSince(u.workingSince) : undefined}
        />
        <InfoCard
          icon={UserCircle2}
          label="Создан в системе"
          value={new Date(u.createdAt).toLocaleDateString('ru-RU')}
          sub={monthsSince(u.createdAt) + ' назад'}
        />
      </div>

      {/* Note */}
      <div className="wow-card">
        <header className="flex items-center gap-3 px-5 py-3.5 border-b border-base-300 bg-base-200/30">
          <div className="size-8 rounded-lg bg-primary/15 text-primary grid place-items-center shrink-0">
            <StickyNote className="size-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold leading-tight">
              Заметка о пользователе
            </h2>
            <div className="text-[11px] text-base-content/50 font-mono">
              видно только супер-админу
            </div>
          </div>
        </header>
        <div className="p-5">
          {u.note ? (
            <div className="whitespace-pre-wrap text-[14px] text-base-content/85 leading-relaxed">
              {u.note}
            </div>
          ) : (
            <div className="text-sm text-base-content/40 flex items-center gap-2">
              <span className="font-mono">○</span> Заметки пока нет.
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                className="text-primary hover:underline"
              >
                Добавить
              </button>
            </div>
          )}
        </div>
      </div>

      <UserFormModal
        open={editOpen}
        editing={u}
        onClose={() => setEditOpen(false)}
      />
      <PasswordModal
        open={pwdOpen}
        user={u}
        onClose={() => setPwdOpen(false)}
      />
      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => deleteMut.mutate()}
        title="Удалить пользователя?"
        message={
          toDelete
            ? `${toDelete.lastName} ${toDelete.firstName} · навсегда, без восстановления`
            : ''
        }
        confirmLabel="Удалить"
        danger
        pending={deleteMut.isPending}
      />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  sub,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl p-4 wow-lift">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.12em] text-base-content/50 font-semibold">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className={clsx('text-base mt-1', mono && 'font-mono')}>{value}</div>
      {sub && (
        <div className="text-[11px] text-base-content/40 mt-0.5 font-mono">
          {sub}
        </div>
      )}
    </div>
  );
}
