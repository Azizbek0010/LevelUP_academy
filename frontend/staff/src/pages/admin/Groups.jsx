import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Archive, ArchiveRestore, ChevronRight, Users, User, FolderOpen, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminGroups, useAdminMentors } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Avatar, EmptyState, Kpi, RowSkeleton, SearchInput } from '../mentor/_ui.jsx';

const isArchived = (g) => g.isArchived ?? g.is_archived ?? false;
const MAX_STUDENTS = 15;
const emptyForm = { name: '', mentorId: '', maxStudents: MAX_STUDENTS };

/* ═══════════════ Group Card ═══════════════ */
/* Раньше ссылкой был только маленький блок «иконка + название» — клик по всей
   остальной площади карточки (ментор, счётчик, полоса) не открывал группу, и
   это читалось как «карточка не работает». Теперь ВСЯ карточка — ссылка, а
   кнопка архива лежит поверх и гасит всплытие, чтобы архивация не открывала
   группу. Полоса заполнения раньше стояла на bg-base-100 (белая на белой
   карточке — не видно самого трека); фон дорожки исправлен на bg-base-200. */
function GroupCard({ g }) {
  const archived = isArchived(g);
  const studentsCount = g.studentsCount ?? g.students_count ?? (g.students?.length ?? 0);
  const mentorName = g.mentor?.name || g.mentorName || null;
  const full = studentsCount >= MAX_STUDENTS;

  return (
    <Link
      to={`/groups/${g.id}`}
      className={`card bg-base-100 p-5 card-hover-premium hover:border-primary/40 group relative block ${archived ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${archived ? 'bg-base-200 text-base-content/45' : 'bg-primary/10 text-primary'}`}>
            <FolderOpen size={18} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="text-[14px] font-bold text-base-content group-hover:text-primary transition-colors flex items-center gap-1 truncate">
              {g.name}
              <ChevronRight size={14} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h3>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-0.5 ${archived ? 'bg-base-200 text-base-content/45' : 'bg-success/10 text-success'}`}>
              {archived ? 'Архив' : 'Активна'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[12px]">
        {mentorName && (
          <span className="flex items-center gap-1.5 text-base-content/70 min-w-0">
            <User size={12} className="text-base-content/45 shrink-0" />
            <span className="truncate">{mentorName}</span>
          </span>
        )}
        <span className="flex items-center gap-1.5 text-base-content/70 shrink-0">
          <Users size={12} className="text-base-content/45" />
          {studentsCount}/{MAX_STUDENTS} студентов
        </span>
      </div>

      {/* Полоса заполнения */}
      <div className="mt-3">
        <div className="h-1.5 rounded-full bg-base-200 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              full ? 'bg-error' : studentsCount >= MAX_STUDENTS * 0.8 ? 'bg-warning' : 'bg-primary'
            }`}
            style={{ width: `${Math.min((studentsCount / MAX_STUDENTS) * 100, 100)}%` }}
          />
        </div>
        {full && <p className="text-[10px] text-error mt-1 font-semibold">Группа заполнена</p>}
      </div>
    </Link>
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
        <Kpi Icon={FolderOpen} title="Всего" value={rows.length}  tone="neutral" />
        <Kpi Icon={Users} title="Активные" value={activeGroups}  tone="success" />
        <Kpi Icon={Archive} title="В архиве" value={archivedGroups}  tone="warning" />
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
          <div className="flex items-center gap-1 p-1 rounded-[12px] bg-base-100 border border-base-300">
            <button
              onClick={() => setViewMode('card')}
              className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all ${viewMode === 'card' ? 'bg-primary/10 text-primary' : 'text-base-content/45 hover:text-base-content'}`}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-primary/10 text-primary' : 'text-base-content/45 hover:text-base-content'}`}
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
            <GroupCard key={g.id} g={g} />
          ))}
        </div>
      ) : (
        /* Table view */
        <div className="card bg-base-100 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="table w-full text-[13px]">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Ментор</th>
                  <th>Студенты</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((g) => {
                  const archived = isArchived(g);
                  const count = g.studentsCount ?? g.students_count ?? (g.students?.length ?? 0);
                  return (
                    <tr key={g.id} className="hover:bg-base-200 cursor-pointer" onClick={() => navigate(`/groups/${g.id}`)}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 ${archived ? 'bg-base-100 text-base-content/45' : 'bg-primary/10 text-primary'}`}>
                            <FolderOpen size={14} />
                          </div>
                          <span className="font-semibold text-base-content">{g.name}</span>
                        </div>
                      </td>
                      <td className="text-base-content/70">{g.mentor?.name || g.mentorName || '—'}</td>
                      <td>
                        <span className="font-semibold">{count}</span>
                        <span className="text-base-content/45"> / {MAX_STUDENTS}</span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${archived ? 'bg-base-100 text-base-content/45' : 'bg-blue-500/15 text-blue-500'}`}>
                          {archived ? 'Архив' : 'Активна'}
                        </span>
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
          <div className="modal-box card bg-base-100 border border-base-300">
            <h3 className="font-bold text-lg mb-4">Новая группа</h3>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <div className="space-y-3">
              <input className="input input-bordered w-full" placeholder="Название группы" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <select className="select select-bordered w-full" value={form.mentorId} onChange={(e) => setForm({ ...form, mentorId: e.target.value })}>
                <option value="">Ментор (необязательно)</option>
                {mentors.map((m) => <option key={m.id} value={m.id}>{mentorName(m)}</option>)}
              </select>
              <div>
                <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">Макс. студентов</label>
                <input className="input input-bordered w-full" type="number" min="1" max="30" value={form.maxStudents} onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })} />
                {form.maxStudents > MAX_STUDENTS && (
                  <p className="text-[11px] text-warning mt-1">Стандарт — {MAX_STUDENTS} студентов</p>
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
