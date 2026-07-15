import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, X, Users, GraduationCap, KeyRound, Phone } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminGroupDetail, useAdminStudents } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const fullName = (s) => s.fullName || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ') || '—';

const initials = (s) => {
  const f = s.firstName || s.first_name || '';
  const l = s.lastName || s.last_name || '';
  return ((f[0] || '') + (l[0] || '')).toUpperCase() || '?';
};

/* ═══════════════ Student Card ═══════════════ */
function StudentCard({ s, onRemove }) {
  return (
    <div className="glass-strong rounded-[16px] p-4 card-hover-premium group">
      <div className="flex items-center gap-3.5">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-[14px] font-extrabold bg-[var(--green-bg)] text-[var(--green)] transition-transform duration-300 group-hover:scale-105">
          {initials(s)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-bold text-[var(--text)] truncate block">{fullName(s)}</span>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--text-muted)]">
            {s.login_code || s.loginCode ? (
              <span className="font-mono flex items-center gap-1">
                <KeyRound size={10} /> {s.login_code || s.loginCode}
              </span>
            ) : null}
            {s.phone && (
              <span className="flex items-center gap-1">
                <Phone size={10} /> {s.phone}
              </span>
            )}
          </div>
        </div>

        {/* Remove */}
        <button
          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)] transition-all opacity-0 group-hover:opacity-100"
          title="Убрать из группы"
          onClick={() => onRemove(s.id)}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════ Main GroupDetail ═══════════════ */
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

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Группа" />
        <div className="mt-6"><SkeletonTable cols={2} /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <PageHeader title="Группа" />
        <div className="alert alert-error mt-6">Ошибка: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Back link */}
      <Link to="/groups" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--green)] transition-colors animate-fade-in">
        <ArrowLeft size={16} /> К группам
      </Link>

      <PageHeader title={group.name || 'Группа'} subtitle={group.mentor?.name ? `Ментор: ${group.mentor.name}` : undefined}>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setAdding(true)}>
          <UserPlus size={16} /> Добавить студента
        </button>
      </PageHeader>

      {/* Stats bar */}
      <div className="glass-strong rounded-[16px] p-4 flex items-center gap-6 animate-fade-in stagger-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-[var(--green-bg)] text-[var(--green)]">
            <Users size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">Студентов</div>
            <div className="text-[20px] font-extrabold text-[var(--text)] tabular-nums leading-none mt-0.5">{students.length}</div>
          </div>
        </div>
        {group.mentor?.name && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-[#3B82F615] text-[#3B82F6]">
              <GraduationCap size={18} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">Ментор</div>
              <div className="text-[14px] font-bold text-[var(--text)] mt-0.5">{group.mentor.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Student List */}
      {students.length === 0 ? (
        <div className="glass-strong rounded-[20px] p-12 text-center animate-fade-in stagger-2">
          <Users size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-[14px] font-medium text-[var(--text-muted)]">В группе нет студентов</p>
          <p className="text-[12px] text-[var(--text-muted)] mt-1 opacity-60">Добавьте первого студента</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {students.map((s) => (
            <StudentCard key={s.id} s={s} onRemove={remove} />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {adding && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)]">
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
