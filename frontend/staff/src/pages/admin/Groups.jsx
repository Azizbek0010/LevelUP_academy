import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Archive, ArchiveRestore, ChevronRight, Users, User, FolderOpen, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminGroups, useAdminMentors } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Avatar, SearchInput, EmptyState, RowSkeleton } from '../mentor/_ui.jsx';

const isArchived = (g) => g.isArchived ?? g.is_archived ?? false;
const MAX_STUDENTS = 15;
const emptyForm = { name: '', mentorId: '', maxStudents: MAX_STUDENTS };

/* ═══════════════ Stat Card ═══════════════ */
function StatCard({ Icon, label, value, color, gradient, delay }) {
  return (
    <div className={`animate-fade-in ${delay}`}>
      <div className="glass-strong rounded-[16px] p-4 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity duration-500" style={{ background: gradient }} />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${color}15`, color }}>
            <Icon size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">{label}</div>
            <div className="text-[20px] font-extrabold text-[var(--text)] tabular-nums leading-none mt-0.5">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Group Card ═══════════════ */
function GroupCard({ g, onArchive }) {
  const archived = isArchived(g);
  const studentsCount = g.studentsCount ?? g.students_count ?? (g.students?.length ?? 0);
  const mentorName = g.mentor?.name || g.mentorName || null;

  return (
    <div className={`glass-strong rounded-[16px] p-5 card-hover-premium group ${archived ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <Link to={`/groups/${g.id}`} className="flex items-center gap-2 group/link">
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition-transform duration-300 group-hover/link:scale-110 ${archived ? 'bg-[var(--surface)] text-[var(--text-muted)]' : 'bg-[var(--green-bg)] text-[var(--green)]'}`}>
            <FolderOpen size={18} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-[var(--text)] group-hover/link:text-[var(--green)] transition-colors flex items-center gap-1">
              {g.name}
              <ChevronRight size={14} className="opacity-0 group-hover/link:opacity-100 transition-opacity" />
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-0.5 ${archived ? 'bg-[var(--surface)] text-[var(--text-muted)]' : 'bg-[#2ECC7115] text-[#2ECC71]'}`}>
              {archived ? 'Архив' : 'Активна'}
            </span>
          </div>
        </Link>

        <button
          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-all opacity-0 group-hover:opacity-100"
          title={archived ? 'Вернуть из архива' : 'В архив'}
          onClick={() => onArchive(g)}
        >
          {archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
        </button>
      </div>

      <div className="flex items-center gap-4 text-[12px]">
        {mentorName && (
          <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
            <User size={12} className="text-[var(--text-muted)]" />
            {mentorName}
          </span>
        )}
        <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <Users size={12} className="text-[var(--text-muted)]" />
          {studentsCount}/{MAX_STUDENTS} студентов
        </span>
      </div>
      {/* Capacity bar */}
      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              studentsCount >= MAX_STUDENTS ? 'bg-[var(--danger)]' :
              studentsCount >= MAX_STUDENTS * 0.8 ? 'bg-[var(--warning)]' :
              'bg-[var(--green)]'
            }`}
            style={{ width: `${Math.min((studentsCount / MAX_STUDENTS) * 100, 100)}%` }}
          />
        </div>
        {studentsCount >= MAX_STUDENTS && (
          <p className="text-[10px] text-[var(--danger)] mt-1 font-semibold">Группа заполнена</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ Main Groups ═══════════════ */
export default function AdminGroups() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useAdminGroups();
  const { data: mentorsData } = useAdminMentors();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('card');

  const raw = data?.data || data || {};
  const rows = raw.groups || (Array.isArray(raw) ? raw : []);
  const mraw = mentorsData?.data || mentorsData || {};
  const mentors = mraw.mentors || (Array.isArray(mraw) ? mraw : []);

  const activeGroups = rows.filter((g) => !isArchived(g)).length;
  const archivedGroups = rows.filter((g) => isArchived(g)).length;
  const totalStudents = rows.reduce((s, g) => s + Number(g.studentsCount ?? g.students_count ?? g.students?.length ?? 0), 0);
  const filteredRows = search
    ? rows.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()) || g.mentor?.name?.toLowerCase().includes(search.toLowerCase()))
    : rows;

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
    <div className="space-y-6 pb-8">
      <PageHeader title="Группы" subtitle="Учебные группы филиала">
        <button className="btn btn-primary btn-sm gap-1" onClick={() => { setForm(emptyForm); setErr(''); }}>
          <Plus size={16} /> Создать группу
        </button>
      </PageHeader>

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard Icon={FolderOpen} label="Всего" value={rows.length} color="#3B82F6" gradient="linear-gradient(135deg,#3B82F6,#2980B9)" delay="stagger-1" />
        <StatCard Icon={Users} label="Активные" value={activeGroups} color="#2ECC71" gradient="linear-gradient(135deg,#2ECC71,#27AE60)" delay="stagger-2" />
        <StatCard Icon={Archive} label="В архиве" value={archivedGroups} color="#F59E0B" gradient="linear-gradient(135deg,#F59E0B,#E67E22)" delay="stagger-3" />
      </div>

      {/* ═══ Search + View Toggle ═══ */}
      {rows.length > 0 && (
        <div className="flex items-center gap-3 animate-fade-in stagger-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Поиск по названию или ментору…"
            className="flex-1"
          />
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-[12px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setViewMode('card')}
              className="w-8 h-8 rounded-[12px] flex items-center justify-center transition-all"
              style={{ background: viewMode === 'card' ? 'var(--green-bg)' : 'transparent', color: viewMode === 'card' ? 'var(--green)' : 'var(--text-muted)' }}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className="w-8 h-8 rounded-[12px] flex items-center justify-center transition-all"
              style={{ background: viewMode === 'table' ? 'var(--green-bg)' : 'transparent', color: viewMode === 'table' ? 'var(--green)' : 'var(--text-muted)' }}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ═══ Group List ═══ */}
      {isLoading ? (
        <RowSkeleton count={4} />
      ) : error ? (
        <div className="alert alert-error mt-4">Ошибка загрузки: {error.message}</div>
      ) : filteredRows.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={search ? 'Попробуйте изменить запрос' : 'Нет групп'}
          hint={search ? undefined : 'Создайте первую учебную группу'}
          action={!search ? (
            <button className="btn btn-primary btn-sm gap-1" onClick={() => { setForm(emptyForm); setErr(''); }}>
              <Plus size={14} /> Создать
            </button>
          ) : undefined}
        />
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRows.map((g) => (
            <GroupCard key={g.id} g={g} onArchive={toggleArchive} />
          ))}
        </div>
      ) : (
        /* Table view */
        <div className="glass-strong rounded-[16px] overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="table w-full text-[13px]">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Ментор</th>
                  <th>Студенты</th>
                  <th>Статус</th>
                  <th className="w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((g) => {
                  const archived = isArchived(g);
                  const count = g.studentsCount ?? g.students_count ?? (g.students?.length ?? 0);
                  return (
                    <tr key={g.id} className="hover:bg-[var(--surface-hover)] cursor-pointer" onClick={() => navigate(`/groups/${g.id}`)}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${archived ? 'bg-[var(--surface)] text-[var(--text-muted)]' : 'bg-[var(--green-bg)] text-[var(--green)]'}`}>
                            <FolderOpen size={14} />
                          </div>
                          <span className="font-semibold text-[var(--text)]">{g.name}</span>
                        </div>
                      </td>
                      <td className="text-[var(--text-secondary)]">{g.mentor?.name || g.mentorName || '—'}</td>
                      <td>
                        <span className="font-semibold">{count}</span>
                        <span className="text-[var(--text-muted)]"> / {MAX_STUDENTS}</span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${archived ? 'bg-[var(--surface)] text-[var(--text-muted)]' : 'bg-[#2ECC7115] text-[#2ECC71]'}`}>
                          {archived ? 'Архив' : 'Активна'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-all"
                            title={archived ? 'Вернуть из архива' : 'В архив'}
                            onClick={() => toggleArchive(g)}
                          >
                            {archived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Create Modal ═══ */}
      {form && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-4">Новая группа</h3>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <div className="space-y-3">
              <input className="input input-bordered w-full" placeholder="Название группы" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className="select select-bordered w-full" value={form.mentorId} onChange={(e) => setForm({ ...form, mentorId: e.target.value })}>
                <option value="">Ментор (необязательно)</option>
                {mentors.map((m) => <option key={m.id} value={m.id}>{mentorName(m)}</option>)}
              </select>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Макс. студентов</label>
                <input className="input input-bordered w-full" type="number" min="1" max="30" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })} />
                {form.maxStudents > MAX_STUDENTS && (
                  <p className="text-[11px] text-[var(--warning)] mt-1">Стандарт — {MAX_STUDENTS} студентов</p>
                )}
              </div>
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
