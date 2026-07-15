import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, X } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminGroupDetail, useAdminStudents } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const fullName = (s) => s.fullName || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ') || '—';

export default function AdminGroupDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminGroupDetail(id);
  const { data: studentsData } = useAdminStudents();
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState('');

  const raw = data?.data || data || {};
  const group = raw.group || raw;
  const students = group.students || raw.students || [];
  const allStudents = (studentsData?.data || studentsData || {}).students || [];
  const candidates = allStudents.filter((s) => !students.some((gs) => gs.id === s.id));

  const add = async () => {
    if (!pick) return;
    try { await api.adminAddStudentToGroup(token, id, pick); setPick(''); setAdding(false); refetch(); }
    catch (e) { alert(e.message || 'Ошибка'); }
  };
  const remove = async (sid) => {
    if (!confirm('Убрать студента из группы?')) return;
    try { await api.adminRemoveStudentFromGroup(token, id, sid); refetch(); }
    catch (e) { alert(e.message || 'Ошибка'); }
  };

  if (isLoading) return <div><PageHeader title="Группа" /><div className="mt-6"><SkeletonTable cols={2} /></div></div>;
  if (error) return <div><PageHeader title="Группа" /><div className="alert alert-error mt-6">Ошибка: {error.message}</div></div>;

  return (
    <div>
      <Link to="/groups" className="btn btn-ghost btn-sm gap-1 mb-2"><ArrowLeft size={16} /> К группам</Link>
      <PageHeader title={group.name || 'Группа'} subtitle={group.mentor?.name ? `Ментор: ${group.mentor.name}` : undefined}>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setAdding(true)}><UserPlus size={16} /> Добавить студента</button>
      </PageHeader>

      <div className="card bg-base-100 mt-6">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr><th>Студент</th><th>Логин-код</th><th>Телефон</th><th></th></tr></thead>
              <tbody>
                {students.length === 0 && <tr><td colSpan={4} className="text-center text-base-content/40 py-8">В группе нет студентов</td></tr>}
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{fullName(s)}</td>
                    <td className="font-mono text-xs">{s.login_code || s.loginCode || '—'}</td>
                    <td className="text-sm">{s.phone || '—'}</td>
                    <td className="text-right"><button className="btn btn-ghost btn-xs text-error" onClick={() => remove(s.id)}><X size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {adding && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Добавить студента в группу</h3>
            <select className="select select-bordered w-full" value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Выберите студента…</option>
              {candidates.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
            </select>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setAdding(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={add} disabled={!pick}>Добавить</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setAdding(false)} />
        </dialog>
      )}
    </div>
  );
}
