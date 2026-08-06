import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Archive, ArchiveRestore, ChevronRight, Users, User, FolderOpen, LayoutGrid, List, Download, CalendarDays, Clock } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminGroups, useAdminMentors, useAdminSettings } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import ExportDialog from '../../components/ExportDialog.jsx';
import { Avatar, EmptyState, Kpi, RowSkeleton, SearchInput, Tip, Modal } from '../mentor/_ui.jsx';

const isArchived = (g) => g.isArchived ?? g.is_archived ?? false;
const MAX_STUDENTS = 15;

/* Дни недели в порядке календаря + короткие ярлыки (та же конвенция, что в GroupDetail). */
const WEEK_DAYS = [
  { key: 'mon', label: 'Пн' },
  { key: 'tue', label: 'Вт' },
  { key: 'wed', label: 'Ср' },
  { key: 'thu', label: 'Чт' },
  { key: 'fri', label: 'Пт' },
  { key: 'sat', label: 'Сб' },
  { key: 'sun', label: 'Вс' },
];
const DAY_PRESETS = [
  { label: '1-3-5', days: ['mon', 'wed', 'fri'] },
  { label: '2-4-6', days: ['tue', 'thu', 'sat'] },
];
const DAY_LABEL = Object.fromEntries(WEEK_DAYS.map((d) => [d.key, d.label]));

const emptyForm = { name: '', subject: '', mentorId: '', monthlyPrice: '', maxStudents: MAX_STUDENTS, days: [], startTime: '' };

/* Конец урока НЕ вводится — это превью для UX: startTime + lessonDurationMin
   из GET /api/admin/settings. Реальный конец считает бэкенд. */
function addMinutes(time, mins) {
  const [h, m] = String(time || '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  const total = h * 60 + m + (mins || 0);
  const hh = String(Math.floor((total % 1440) / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

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
  const { data: settingsData } = useAdminSettings();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [showCustomDays, setShowCustomDays] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [showExport, setShowExport] = useState(false);

  const raw = data?.data || data || {};
  const rows = raw.groups || (Array.isArray(raw) ? raw : []);
  const mraw = mentorsData?.data || mentorsData || {};
  const mentors = mraw.mentors || (Array.isArray(mraw) ? mraw : []);

  /* Длительность урока из настроек организации — для превью конца урока.
     Формы ответа: бэкенд отдаёт { lessonDurationMin }, мок — { settings }. */
  const lessonDurationMin = Number(
    settingsData?.lessonDurationMin ??
    settingsData?.settings?.lessonDurationMin ??
    settingsData?.data?.lessonDurationMin ??
    60,
  );

  const activeGroups = rows.filter((g) => !isArchived(g)).length;
  const archivedGroups = rows.filter((g) => isArchived(g)).length;
  const totalStudents = rows.reduce((s, g) => s + Number(g.studentsCount ?? g.students_count ?? g.students?.length ?? 0), 0);
  const filteredRows = search
    ? rows.filter(g => g.name?.toLowerCase().includes(search.toLowerCase()) || g.mentor?.name?.toLowerCase().includes(search.toLowerCase()))
    : rows;

  const openCreate = () => {
    setForm({ ...emptyForm, days: [] });
    setErrors({});
    setShowCustomDays(false);
    setErr('');
  };

  const validate = (f) => {
    const e = {};
    if (!f.name.trim()) e.name = 'Введите название группы';
    else if (f.name.trim().length < 2) e.name = 'Название — минимум 2 символа';
    if (!f.subject.trim()) e.subject = 'Введите направление';
    if (!f.mentorId) e.mentorId = 'Выберите ментора';
    if (!f.days || f.days.length === 0) e.days = 'Выберите хотя бы один день';
    if (!f.startTime) e.startTime = 'Укажите время начала';
    const price = Number(f.monthlyPrice);
    if (f.monthlyPrice === '' || f.monthlyPrice == null || !Number.isFinite(price)) {
      e.monthlyPrice = 'Укажите оплату за месяц';
    } else if (price < 0) {
      e.monthlyPrice = 'Сумма не может быть отрицательной';
    } else if (price > 9999999999) {
      e.monthlyPrice = 'Слишком большая сумма';
    }
    return e;
  };

  const create = async () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy(true); setErr('');
    try {
      await api.adminCreateGroup(token, {
        name: form.name.trim(),
        subject: form.subject.trim(),
        mentorId: form.mentorId,
        monthlyPrice: Number(form.monthlyPrice),
        days: form.days,
        startTime: form.startTime,
      });
      setForm(null); refetch();
    } catch (err) { setErr(err.message || 'Ошибка'); }
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

  /* Управление днями: пресеты и произвольный набор. */
  const applyPreset = (days) => {
    setForm((f) => ({ ...f, days }));
    setShowCustomDays(false);
    setErrors((prev) => ({ ...prev, days: undefined }));
  };
  const toggleDay = (key) => {
    setForm((f) => {
      const has = f.days.includes(key);
      return { ...f, days: has ? f.days.filter((d) => d !== key) : [...f.days, key] };
    });
    setErrors((prev) => ({ ...prev, days: undefined }));
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
                      <td className="tabular-nums">
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

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} pageKey="groups" data={filteredRows} />

      {/* ═══ Create Modal ═══ */}
      <Modal
        isOpen={!!form}
        onClose={() => !busy && setForm(null)}
        title="Новая группа"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setForm(null)} disabled={busy}>Отмена</button>
            <button className="btn btn-primary" onClick={create} disabled={busy}>
              {busy && <span className="loading loading-spinner loading-xs" />} Создать
            </button>
          </>
        }
      >
        {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
        {form && (
          <div className="space-y-4">
            {/* Название */}
            <div>
              <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">
                Название группы <span className="text-error">*</span>
              </label>
              <input
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="Например: English B1"
                maxLength={120}
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((p) => ({ ...p, name: undefined })); }}
              />
              {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
            </div>

            {/* Направление — обязателен (бэкенд: subject) */}
            <div>
              <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">
                Направление <span className="text-error">*</span>
              </label>
              <input
                className={`input input-bordered w-full ${errors.subject ? 'input-error' : ''}`}
                placeholder="Например: English, IELTS, Dasturlash"
                maxLength={120}
                value={form.subject}
                onChange={(e) => { setForm((f) => ({ ...f, subject: e.target.value })); setErrors((p) => ({ ...p, subject: undefined })); }}
              />
              {errors.subject && <p className="text-xs text-error mt-1">{errors.subject}</p>}
            </div>

            {/* Ментор — обязателен */}
            <div>
              <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">
                Ментор <span className="text-error">*</span>
              </label>
              <select
                className={`select select-bordered w-full ${errors.mentorId ? 'select-error' : ''}`}
                value={form.mentorId}
                onChange={(e) => { setForm((f) => ({ ...f, mentorId: e.target.value })); setErrors((p) => ({ ...p, mentorId: undefined })); }}
              >
                <option value="">Выберите ментора</option>
                {mentors.map((m) => <option key={m.id} value={m.id}>{mentorName(m)}</option>)}
              </select>
              {errors.mentorId && <p className="text-xs text-error mt-1">{errors.mentorId}</p>}
            </div>

            {/* Дни занятий: пресеты 1-3-5 / 2-4-6 + произвольный набор */}
            <div>
              <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-2 block flex items-center gap-1.5">
                <CalendarDays size={13} /> Дни занятий <span className="text-error">*</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {DAY_PRESETS.map((p) => {
                  const active = p.days.every((d) => form.days.includes(d)) && p.days.length === form.days.length;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p.days)}
                      className={`btn btn-sm rounded-lg gap-1 ${active ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {p.label}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setShowCustomDays((v) => !v)}
                  className={`btn btn-sm rounded-lg gap-1 ${showCustomDays ? 'btn-primary' : 'btn-outline'}`}
                >
                  Другие дни
                </button>
              </div>

              {showCustomDays && (
                <div className="flex flex-wrap gap-2 mt-3 p-3 rounded-xl bg-base-200/60 border border-base-300">
                  {WEEK_DAYS.map((d) => {
                    const on = form.days.includes(d.key);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => toggleDay(d.key)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          on
                            ? 'bg-primary/15 text-primary border-primary/40'
                            : 'bg-base-100 text-base-content/55 border-base-300 hover:border-primary/30 hover:text-base-content'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {form.days.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.days.map((d) => (
                    <span key={d} className="badge badge-primary badge-sm">{DAY_LABEL[d] || d}</span>
                  ))}
                </div>
              )}
              {errors.days && <p className="text-xs text-error mt-1">{errors.days}</p>}
            </div>

            {/* Время начала + превью конца урока */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">
                  Время начала <span className="text-error">*</span>
                </label>
                <input
                  type="time"
                  className={`input input-bordered w-full ${errors.startTime ? 'input-error' : ''}`}
                  value={form.startTime}
                  onChange={(e) => { setForm((f) => ({ ...f, startTime: e.target.value })); setErrors((p) => ({ ...p, startTime: undefined })); }}
                />
                {errors.startTime && <p className="text-xs text-error mt-1">{errors.startTime}</p>}
              </div>
              <div>
                <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">
                  Конец урока
                </label>
                <div className={`input input-bordered w-full flex items-center gap-2 ${form.startTime ? '' : 'text-base-content/40'}`}>
                  <Clock size={14} className="shrink-0 text-base-content/40" />
                  {form.startTime
                    ? `${form.startTime} – ${addMinutes(form.startTime, lessonDurationMin)}`
                    : 'укажите начало'}
                </div>
                <p className="text-[11px] text-base-content/45 mt-1">
                  Превью: {lessonDurationMin} мин × урок
                </p>
              </div>
            </div>

            {/* Оплата в месяц — обязательна (бэкенд: monthlyPrice) */}
            <div>
              <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">
                Оплата в месяц, сум <span className="text-error">*</span>
              </label>
              <input
                className={`input input-bordered w-full ${errors.monthlyPrice ? 'input-error' : ''}`}
                type="number"
                min="0"
                max="9999999999"
                step="1000"
                placeholder="800000"
                value={form.monthlyPrice}
                onChange={(e) => { setForm((f) => ({ ...f, monthlyPrice: e.target.value })); setErrors((p) => ({ ...p, monthlyPrice: undefined })); }}
              />
              {errors.monthlyPrice && <p className="text-xs text-error mt-1">{errors.monthlyPrice}</p>}
            </div>

            {/* Макс. студентов */}
            <div>
              <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">Макс. студентов</label>
              <input
                className="input input-bordered w-full"
                type="number" min="1" max="30"
                value={form.maxStudents}
                onChange={(e) => setForm((f) => ({ ...f, maxStudents: Number(e.target.value) }))}
              />
              {form.maxStudents > MAX_STUDENTS && (
                <p className="text-[11px] text-warning mt-1">Стандарт — {MAX_STUDENTS} студентов</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
