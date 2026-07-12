import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Archive, ArchiveRestore, ChevronRight } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminGroups, useAdminMentors } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const isArchived = (g) => g.isArchived ?? g.is_archived ?? false;
const emptyForm = { name: '', mentorId: '' };

export default function AdminGroups() {
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminGroups();
  const { data: mentorsData } = useAdminMentors();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const raw = data?.data || data || {};
  const rows = raw.groups || (Array.isArray(raw) ? raw : []);
  const mraw = mentorsData?.data || mentorsData || {};
  const mentors = mraw.mentors || (Array.isArray(mraw) ? mraw : []);

  const create = async () => {
    setBusy(true); setErr('');
    try {
      await api.adminCreateGroup(token, { name: form.name, mentorId: form.mentorId || undefined });
      setForm(null); refetch();
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };
  const toggleArchive = async (g) => {
    try {
      if (isArchived(g)) await api.adminUnarchiveGroup(token, g.id);
      else await api.adminArchiveGroup(token, g.id);
      refetch();
    } catch (e) { alert(e.message || 'Ошибка'); }
  };

  const mentorName = (m) => [m.firstName || m.first_name, m.lastName || m.last_name].filter(Boolean).join(' ');

  return (
    <div>
      <PageHeader title="Группы" subtitle="Учебные группы филиала">
        <button className="btn btn-primary btn-sm gap-1" onClick={() => { setForm(emptyForm); setErr(''); }}>
          <Plus size={16} /> Создать группу
        </button>
      </PageHeader>

      {isLoading ? (
        <div className="mt-6"><SkeletonTable cols={4} /></div>
      ) : error ? (
        <div className="alert alert-error mt-6">Ошибка загрузки: {error.message}</div>
      ) : (
        <div className="card bg-base-100 mt-6">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Название</th><th>Ментор</th><th>Студентов</th><th>Статус</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={5} className="text-center text-base-content/40 py-8">Нет групп</td></tr>}
                  {rows.map((g) => (
                    <tr key={g.id} className="hover">
                      <td className="font-medium">
                        <Link to={`/groups/${g.id}`} className="link link-hover inline-flex items-center gap-1">{g.name} <ChevronRight size={14} /></Link>
                      </td>
                      <td className="text-sm">{g.mentor?.name || g.mentorName || '—'}</td>
                      <td className="text-sm tabular-nums">{g.studentsCount ?? g.students_count ?? (g.students?.length ?? '—')}</td>
                      <td>
                        <span className={`badge badge-sm ${isArchived(g) ? 'badge-ghost' : 'badge-success'}`}>{isArchived(g) ? 'Архив' : 'Активна'}</span>
                      </td>
                      <td className="text-right">
                        <button className="btn btn-ghost btn-xs" title={isArchived(g) ? 'Вернуть из архива' : 'В архив'} onClick={() => toggleArchive(g)}>
                          {isArchived(g) ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {form && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Новая группа</h3>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <div className="space-y-3">
              <input className="input input-bordered w-full" placeholder="Название группы" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className="select select-bordered w-full" value={form.mentorId} onChange={(e) => setForm({ ...form, mentorId: e.target.value })}>
                <option value="">Ментор (необязательно)</option>
                {mentors.map((m) => <option key={m.id} value={m.id}>{mentorName(m)}</option>)}
              </select>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setForm(null)} disabled={busy}>Отмена</button>
              <button className="btn btn-primary" onClick={create} disabled={busy || !form.name}>
                {busy && <span className="loading loading-spinner loading-xs" />} Создать
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setForm(null)} />
        </dialog>
      )}
    </div>
  );
}
