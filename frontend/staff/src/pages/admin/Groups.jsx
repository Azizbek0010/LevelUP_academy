import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Archive, ArchiveRestore, ChevronRight, Users, User, FolderOpen, LayoutGrid, List, Download, Clock, Pencil } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminGroups, useAdminMentors, useAdminSettings } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import ExportDialog from '../../components/ExportDialog.jsx';
import { Avatar, EmptyState, Kpi, RowSkeleton, SearchInput, Tip } from '../mentor/_ui.jsx';

const isArchived = (g) => g.isArchived ?? g.is_archived ?? false;
const MAX_STUDENTS = 15;
const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABEL = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' };

const PRESETS = [
  { label: '1-3-5', days: ['mon', 'wed', 'fri'] },
  { label: '2-4-6', days: ['tue', 'thu', 'sat'] },
];

const emptyForm = { name: '', subject: '', monthlyPrice: '', room: '', mentorId: '', days: [], startTime: '', showCustomDays: false };

/** Вычисляет время конца урока: "15:00" + 80 мин → "16:20" */
function calcEndTime(startTime, durationMin) {
  if (!startTime || !durationMin) return null;
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + Number(durationMin);
  const eh = Math.floor(total / 60) % 24;
  const em = total % 60;
  return `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
}

/* ═══════════════ Group Card ═══════════════ */
function GroupCard({ g, onEdit }) {
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
        {/* Edit button — stops propagation so click doesn't navigate */}
        {!archived && onEdit && (
          <button
            className="w-7 h-7 rounded-lg flex items-center justify-center text-base-content/45 hover:text-primary hover:bg-primary/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(g); }}
            title="Изменить группу"
          >
            <Pencil size={13} />
          </button>
        )}
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
        {g.startTime && (
          <span className="flex items-center gap-1.5 text-base-content/70 shrink-0">
            <Clock size={12} className="text-base-content/45" />
            {g.startTime}{g.endTime ? `–${g.endTime}` : ''}
          </span>
        )}
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

/* ═══════════════ Group Form Modal ═══════════════ */
function GroupFormModal({ open, onClose, mentors, lessonDurationMin, initial, onSave }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(initial ?? emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Reset form when modal opens
  if (!open) return null;

  const endPreview = calcEndTime(form.startTime, lessonDurationMin);

  const setDays = (days) => setForm((f) => ({ ...f, days }));
  const toggleDay = (d) => setDays(
    form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d]
  );
  const applyPreset = (preset) => {
    setDays(preset.days);
    setForm((f) => ({ ...f, showCustomDays: false }));
  };
  const activePreset = PRESETS.find((p) => JSON.stringify([...p.days].sort()) === JSON.stringify([...form.days].sort()))?.label;

  const submit = async () => {
    setErr('');
    if (!form.name.trim()) return setErr('Введите название группы');
    if (!form.subject.trim()) return setErr('Введите предмет');
    if (!form.monthlyPrice) return setErr('Укажите стоимость');
    if (!form.mentorId) return setErr('Выберите ментора — это обязательное поле');
    if (!form.days || form.days.length === 0) return setErr('Выберите хотя бы один день занятий');
    if (!form.startTime) return setErr('Укажите время начала занятий');
    
    // transform for backend — send only what schema expects
    const payload = {
      name: form.name.trim(),
      subject: form.subject.trim(),
      mentorId: form.mentorId,
      monthlyPrice: Number(form.monthlyPrice),
      days: form.days,
      startTime: form.startTime,
    };
    // room is optional — only send if filled
    if (form.room?.trim()) payload.room = form.room.trim();
    
    setBusy(true);
    try {
      await onSave(payload);
      onClose();
    } catch (e) {
      setErr(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box card bg-base-100 border border-base-300 max-w-md p-6">
        <h3 className="font-bold text-lg mb-6">{isEdit ? 'Изменить группу' : 'Новая группа'}</h3>
        {err && <div className="alert alert-error mb-4 py-2 text-sm rounded-lg">{err}</div>}

        <div className="space-y-4">
          {/* Название */}
          <label className="form-control">
            <span className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">
              Название группы <span className="text-error">*</span>
            </span>
            <input
              className="input input-bordered w-full rounded-lg"
              placeholder="напр. Frontend React A1"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label className="form-control">
            <span className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">
              Предмет <span className="text-error">*</span>
            </span>
            <input
              className="input input-bordered w-full rounded-lg"
              placeholder="напр. Веб-разработка"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="form-control">
              <span className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">
                Стоимость (UZS) <span className="text-error">*</span>
              </span>
              <input
                className="input input-bordered w-full rounded-lg"
                type="number"
                min="0"
                placeholder="0"
                value={form.monthlyPrice}
                onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
              />
            </label>
            <label className="form-control">
              <span className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">
                Кабинет
              </span>
              <input
                className="input input-bordered w-full rounded-lg"
                placeholder="напр. 204"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
              />
            </label>
          </div>

          {/* Ментор — ОБЯЗАТЕЛЬНО */}
          <label className="form-control">
            <span className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">
              Ментор <span className="text-error">*</span>
            </span>
            <select
              className="select select-bordered w-full rounded-lg"
              value={form.mentorId}
              onChange={(e) => setForm({ ...form, mentorId: e.target.value })}
            >
              <option value="">— Выберите ментора —</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>
                  {[m.firstName || m.first_name, m.lastName || m.last_name].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
            {mentors.length === 0 && (
              <span className="text-xs text-warning mt-1">Менторов нет — сначала добавьте ментора</span>
            )}
          </label>

          {/* Дни занятий */}
          <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
            <span className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-2 block">
              Дни занятий
            </span>

            {/* Быстрые пресеты */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className={`btn btn-sm rounded-lg flex-1 ${activePreset === p.label ? 'btn-primary' : 'btn-outline bg-base-100'}`}
                  onClick={() => applyPreset(p)}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                className={`btn btn-sm rounded-lg flex-1 ${form.showCustomDays ? 'btn-neutral' : 'btn-outline bg-base-100'}`}
                onClick={() => setForm((f) => ({ ...f, showCustomDays: !f.showCustomDays, days: f.showCustomDays ? [] : f.days }))}
              >
                Другие
              </button>
            </div>

            {/* Кастомные галочки */}
            {form.showCustomDays && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-base-300">
                {DAYS.map((d) => {
                  const active = form.days.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`btn btn-xs rounded-md ${active ? 'btn-primary' : 'btn-ghost bg-base-100 border border-base-300'}`}
                      onClick={() => toggleDay(d)}
                    >
                      {DAY_LABEL[d]}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Выбранные дни — показать если не custom */}
            {!form.showCustomDays && form.days.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {form.days.map((d) => (
                  <span key={d} className="badge badge-primary badge-sm font-semibold">{DAY_LABEL[d]}</span>
                ))}
              </div>
            )}
          </div>

          {/* Время начала + превью конца */}
          <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
            <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-2 block">
              Время начала
            </label>
            <input
              className="input input-bordered w-full rounded-lg"
              type="time"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
            {endPreview && (
              <div className="mt-3 flex items-center justify-between bg-primary/5 px-3 py-2 rounded-lg border border-primary/10">
                <span className="text-xs font-medium text-base-content/70 flex items-center gap-1.5">
                  <Clock size={13} className="text-primary" />
                  Окончание:
                </span>
                <span className="text-sm font-bold text-primary">
                  {endPreview}
                  {lessonDurationMin && <span className="text-[10px] font-normal text-primary/60 ml-1">({lessonDurationMin} мин)</span>}
                </span>
              </div>
            )}
          </div>


        </div>

        <div className="modal-action mt-6">
          <button className="btn btn-ghost rounded-lg" onClick={onClose} disabled={busy}>Отмена</button>
          <button className="btn btn-primary rounded-lg" onClick={submit} disabled={busy || !form.name || !form.mentorId}>
            {busy && <span className="loading loading-spinner loading-xs" />}
            {isEdit ? 'Сохранить изменения' : 'Создать группу'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-base-300/60 backdrop-blur-sm" onClick={onClose} />
    </dialog>
  );
}

/* ═══════════════ Main Groups ═══════════════ */
export default function AdminGroups() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useAdminGroups();
  const { data: mentorsData } = useAdminMentors();
  const { data: settingsData } = useAdminSettings();
  const [form, setForm] = useState(null);   // null = closed | object = open (new or edit)
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [showExport, setShowExport] = useState(false);

  const raw = data?.data || data || {};
  const rows = raw.groups || (Array.isArray(raw) ? raw : []);
  const mraw = mentorsData?.data || mentorsData || {};
  const mentors = mraw.mentors || (Array.isArray(mraw) ? mraw : []);
  const lessonDurationMin = settingsData?.lessonDurationMin ?? settingsData?.data?.lessonDurationMin ?? null;

  const activeGroups = rows.filter((g) => !isArchived(g)).length;
  const archivedGroups = rows.filter((g) => isArchived(g)).length;
  const totalStudents = rows.reduce((s, g) => s + Number(g.studentsCount ?? g.students_count ?? g.students?.length ?? 0), 0);
  const filteredRows = search
    ? rows.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()) || g.mentor?.name?.toLowerCase().includes(search.toLowerCase()))
    : rows;

  // Build API body from form state
  const buildBody = (f) => {
    const body = { 
      name: f.name.trim(), 
      subject: f.subject?.trim() || '',
      monthlyPrice: Number(f.monthlyPrice) || 0,
      mentorId: f.mentorId || undefined 
    };
    if (f.days?.length > 0) body.days = f.days;
    if (f.startTime) body.startTime = f.startTime;
    if (f.room?.trim()) body.room = f.room.trim();
    return body;
  };

  const openCreate = () => setForm({ ...emptyForm });
  const openEdit = (g) => {
    const scheduleDays = g.schedule?.map(s => String(s.day).toLowerCase()) || [];
    const initialDays = g.days?.length > 0 ? g.days : scheduleDays;
    setForm({
      id: g.id,
      name: g.name || '',
      subject: g.subject || '',
      monthlyPrice: g.monthlyPrice || g.monthly_price || '',
      room: g.room || '',
      mentorId: g.mentor?.id || g.mentorId || '',
      maxStudents: g.maxStudents ?? g.max_students ?? MAX_STUDENTS,
      days: initialDays,
      startTime: g.startTime || g.start_time || '',
      showCustomDays: initialDays.length > 0 && !PRESETS.some(p => JSON.stringify([...p.days].sort()) === JSON.stringify([...initialDays].sort())),
    });
  };

  const handleSave = async (f) => {
    const body = buildBody(f);
    if (f.id) {
      await api.adminUpdateGroup(token, f.id, body);
    } else {
      await api.adminCreateGroup(token, body);
    }
    refetch();
  };

  const toggleArchive = async (g) => {
    try {
      if (isArchived(g)) await api.adminUnarchiveGroup(token, g.id);
      else await api.adminArchiveGroup(token, g.id);
      refetch();
    } catch (e) { alert(e.message || 'Ошибка'); }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Группы" subtitle="Учебные группы филиала">
        <button className="btn btn-ghost btn-sm gap-1.5" onClick={() => setShowExport(true)} disabled={filteredRows.length === 0}>
          <Download size={14} /> Экспорт
        </button>
        <button className="btn btn-primary btn-sm gap-1" onClick={openCreate}>
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
            <button className="btn btn-primary btn-sm gap-1" onClick={openCreate}>
              <Plus size={14} /> Создать
            </button>
          ) : undefined}
        />
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRows.map((g) => (
            <GroupCard key={g.id} g={g} onEdit={openEdit} />
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
                  <th>Расписание</th>
                  <th>Статус</th>
                  <th></th>
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
                      <td className="tabular-nums">
                        <span className="font-semibold">{count}</span>
                        <span className="text-base-content/45"> / {MAX_STUDENTS}</span>
                      </td>
                      <td className="text-xs text-base-content/60">
                        {g.startTime ? (
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {g.startTime}{g.endTime ? `–${g.endTime}` : ''}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${archived ? 'bg-base-100 text-base-content/45' : 'bg-success/15 text-success'}`}>
                          {archived ? 'Архив' : 'Активна'}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {!archived && (
                          <button
                            className="btn btn-xs btn-ghost hover:text-primary hover:bg-primary/10"
                            onClick={(e) => { e.stopPropagation(); openEdit(g); }}
                            title="Изменить группу"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} pageKey="groups" data={filteredRows} />

      {/* ═══ Create/Edit Modal ═══ */}
      <GroupFormModal
        key={form?.id || 'create'}
        open={Boolean(form)}
        onClose={() => setForm(null)}
        mentors={mentors}
        lessonDurationMin={lessonDurationMin}
        initial={form}
        onSave={handleSave}
      />
    </div>
  );
}
