import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Plus, Archive, ArchiveRestore, ChevronRight, Users, User, FolderOpen, LayoutGrid, List, Download, Clock, Pencil, CalendarDays, KeyRound, UserPlus, Copy, Check } from 'lucide-react';
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

/* ─── Task 4: свободные часы ментора (08:00–20:00, шаг 30 мин) ─── */
const SLOT_WINDOW = { start: 8 * 60, end: 20 * 60 }; // 08:00–20:00
const SLOT_STEP = 30;

function toMin(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}
function toHM(min) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}

/** Все кандидаты-старты в окне 08:00–20:00 (последний урок должен успеть закончиться) */
function candidateStarts(durationMin) {
  const out = [];
  for (let m = SLOT_WINDOW.start; m + durationMin <= SLOT_WINDOW.end; m += SLOT_STEP) out.push(toHM(m));
  return out;
}

/** Свободен ли слот [start, start+duration) в конкретный день (без пересечения с занятыми) */
function isSlotFree(day, start, durationMin, busy) {
  const cStart = toMin(start);
  const cEnd = cStart + durationMin;
  const occ = busy[day] || [];
  return !occ.some((o) => cStart < toMin(o.end) && cEnd > toMin(o.start));
}

/* ─── Task 4: автоподсчёт даты окончания модуля (превью) ─── */
const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
const MODULES = [
  { label: '1 месяц', value: 1 },
  { label: '3 месяца', value: 3 },
  { label: '6 месяцев', value: 6 },
];

/** Ближайшая дата урока (если день = сегодня и время ещё не прошло — сегодня, иначе следующая неделя) */
function nextLessonDate(dayCode, startTime) {
  const now = new Date();
  const d = new Date(now);
  const target = DAY_INDEX[dayCode];
  let diff = (target - d.getDay() + 7) % 7;
  if (diff === 0 && startTime) {
    const [h, m] = startTime.split(':').map(Number);
    const lessonAt = new Date(now);
    lessonAt.setHours(h, m, 0, 0);
    if (lessonAt <= now) diff = 7; // урок сегодня уже прошёл → следующая неделя
  }
  d.setDate(d.getDate() + diff);
  return d;
}

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function fmtDate(d) {
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ═══════════════ Group Card ═══════════════ */
function GroupCard({ g, onEdit }) {
  const archived = isArchived(g);
  // Backend listGroups qaytaradi: students — NUMBER (count), array emas
  const studentsCount = Number(g.students ?? g.studentsCount ?? g.students_count ?? 0);
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
function GroupFormModal({ open, onClose, mentors, lessonDurationMin, initial, onSave, token, groups }) {
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(initial ?? emptyForm);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Task 4: свободные часы ментора
  const [busySlots, setBusySlots] = useState({});   // { day: [{ start, end }] }
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');
  const [moduleMonths, setModuleMonths] = useState(3);
  const [showStudent, setShowStudent] = useState(false);
  const [student, setStudent] = useState({ firstName: '', lastName: '', phone: '' });
  const [creds, setCreds] = useState(null);          // { loginCode, password } после создания ученика
  const [copied, setCopied] = useState('');

  const groupsRef = useRef(groups);
  groupsRef.current = groups;

  const durationMin = Number(lessonDurationMin) || 80;

  // При смене ментора — тянем расписания его групп и строим карту занятости
  useEffect(() => {
    if (!open) return;
    if (isEdit || !form.mentorId) {
      setBusySlots({});
      setSlotsError('');
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError('');
    setBusySlots({});

    const myGroups = (groupsRef.current || []).filter(
      (g) => g.mentor && String(g.mentor.id) === String(form.mentorId)
    );

    if (myGroups.length === 0) {
      setSlotsLoading(false);
      return;
    }

    Promise.allSettled(myGroups.map((g) => api.adminGroupDetail(token, g.id)))
      .then((results) => {
        if (cancelled) return;
        const busy = {};
        let failed = false;
        results.forEach((r) => {
          if (r.status !== 'fulfilled') { failed = true; return; }
          const detail = r.value?.data || r.value;
          const schedule = detail?.schedule || detail?.group?.schedule || [];
          (Array.isArray(schedule) ? schedule : []).forEach((s) => {
            const day = String(s.day).toLowerCase();
            if (s.start && s.end) (busy[day] = busy[day] || []).push({ start: s.start, end: s.end });
          });
        });
        if (failed && Object.keys(busy).length === 0) setSlotsError('Не удалось загрузить расписание ментора');
        setBusySlots(busy);
      })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isEdit, form.mentorId, token]);

  // Task 4: свободные слоты = пересечение по всем выбранным дням
  const freeSlots = useMemo(() => {
    if (isEdit || !form.mentorId || !form.days?.length) return null;
    if (Object.keys(busySlots).length === 0 && slotsLoading) return null;
    const starts = candidateStarts(durationMin);
    return starts.filter((s) => form.days.every((d) => isSlotFree(d, s, durationMin, busySlots)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, form.mentorId, form.days, busySlots, slotsLoading, durationMin]);

  // Reset form when modal opens
  if (!open) return null;

  const endPreview = calcEndTime(form.startTime, durationMin);

  // Есть ли хоть один свободный слот в конкретный день (для точки на кнопке дня)
  const dayHasSlots = (day) => {
    if (Object.keys(busySlots).length === 0 && !slotsLoading) return true; // нет данных → не блокируем
    const starts = candidateStarts(durationMin);
    return starts.some((s) => isSlotFree(day, s, durationMin, busySlots));
  };

  // Task 4: автодата окончания модуля (первый выбранный день + moduleMonths)
  const modulePreview = (() => {
    if (isEdit || !form.days?.length) return null;
    const firstDay = form.days[0];
    const firstDate = nextLessonDate(firstDay, form.startTime);
    const lastDate = addMonths(firstDate, moduleMonths);
    return { firstDate, lastDate };
  })();

  const setDays = (days) => setForm((f) => ({ ...f, days }));
  const toggleDay = (d) => setDays(
    form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d]
  );
  const applyPreset = (preset) => {
    setDays(preset.days);
    setForm((f) => ({ ...f, showCustomDays: false }));
  };
  const activePreset = PRESETS.find((p) => JSON.stringify([...p.days].sort()) === JSON.stringify([...form.days].sort()))?.label;

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  const submit = async () => {
    setErr('');
    if (!form.name.trim()) return setErr('Введите название группы');
    if (!form.subject.trim()) return setErr('Введите предмет');
    if (!form.monthlyPrice) return setErr('Укажите стоимость');
    if (!form.mentorId) return setErr('Выберите ментора — это обязательное поле');
    if (!form.days || form.days.length === 0) return setErr('Выберите хотя бы один день занятий');
    if (!form.startTime) return setErr('Укажите время начала занятий');
    if (!isEdit && !slotsLoading && freeSlots && freeSlots.length === 0 && Object.keys(busySlots).length > 0) {
      return setErr('У ментора нет свободного времени в выбранные дни — измените дни или ментора');
    }

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
      const created = await onSave(payload); // возвращает созданную группу

      // Task 4: новый ученик — создаём сразу в эту группу
      if (!isEdit && showStudent && student.firstName?.trim()) {
        const groupId = created?.id || created?.data?.id;
        if (groupId) {
          const res = await api.adminCreateStudent(token, {
            firstName: student.firstName.trim(),
            lastName: student.lastName.trim(),
            phone: student.phone?.trim() || undefined,
            groupId,
          });
          const r = res?.data || res;
          const stu = r?.student || r;
          setCreds({ loginCode: stu.loginCode || stu.login_code || '', password: stu.password || '' });
          return; // не закрываем — показываем логин-код/пароль
        }
      }
      onClose();
    } catch (e) {
      setErr(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box card bg-base-100 border border-base-300 max-w-md p-6 max-h-[92vh] overflow-y-auto">
        <h3 className="font-bold text-lg mb-6">{isEdit ? 'Изменить группу' : 'Новая группа'}</h3>
        {err && <div className="alert alert-error mb-4 py-2 text-sm rounded-lg">{err}</div>}

        {/* Ученик создан — показываем логин-код и пароль */}
        {creds ? (
          <div className="animate-fade-in">
            <div className="rounded-2xl border border-success/30 bg-success/5 p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-success/15 text-success flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <div>
                  <p className="font-bold text-sm text-base-content">Ученик создан и добавлен в группу</p>
                  <p className="text-xs text-base-content/60">Передайте эти данные ученику для входа</p>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                {[
                  { label: 'Логин-код', value: creds.loginCode, field: 'code' },
                  { label: 'Пароль', value: creds.password, field: 'pass' },
                ].map((row) => (
                  <div key={row.field} className="flex items-center justify-between bg-base-100 border border-base-300 rounded-xl px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <KeyRound size={14} className="text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-base-content/50 font-bold">{row.label}</p>
                        <p className="font-mono font-bold text-[15px] text-base-content truncate">{row.value}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs rounded-lg"
                      onClick={() => copyToClipboard(row.value, row.field)}
                    >
                      {copied === row.field ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      {copied === row.field ? 'Скопировано' : 'Копировать'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-action mt-6">
              <button className="btn btn-primary rounded-lg w-full" onClick={onClose}>Готово</button>
            </div>
          </div>
        ) : (
        <>
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
              onChange={(e) => setForm({ ...form, mentorId: e.target.value, startTime: '' })}
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
            {!isEdit && form.mentorId && (
              <span className="text-xs text-base-content/50 mt-1 flex items-center gap-1">
                {slotsLoading ? (
                  <><span className="loading loading-spinner loading-xs text-primary" /> Загружаем расписание ментора…</>
                ) : slotsError ? (
                  <span className="text-warning">{slotsError} — время укажите вручную</span>
                ) : (
                  <>Расписание ментора загружено — ниже покажем свободные часы</>
                )}
              </span>
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
                  const free = !isEdit && form.mentorId ? dayHasSlots(d) : true;
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`btn btn-xs rounded-md ${active ? 'btn-primary' : 'btn-ghost bg-base-100 border border-base-300'}`}
                      onClick={() => toggleDay(d)}
                    >
                      {DAY_LABEL[d]}
                      {!isEdit && form.mentorId && (
                        <span className={`ml-0.5 w-1.5 h-1.5 rounded-full ${free ? 'bg-success' : 'bg-error'}`} title={free ? 'Есть свободное время' : 'День занят'} />
                      )}
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

          {/* Время начала */}
          <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
            <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-2 block">
              Время начала
            </label>

            {/* Task 4: свободные слоты ментора (только для новой группы) */}
            {!isEdit && form.mentorId && !slotsError && (
              form.days.length === 0 ? (
                <p className="text-xs text-base-content/50 mb-3">Сначала выберите дни занятий — покажем свободные часы ментора</p>
              ) : slotsLoading ? (
                <div className="flex items-center gap-2 text-xs text-base-content/60 py-2">
                  <span className="loading loading-spinner loading-xs text-primary" />
                  Ищем свободное время…
                </div>
              ) : (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-base-content/50 font-bold">
                      Свободные часы ({SLOT_WINDOW.start / 60}:00–{SLOT_WINDOW.end / 60}:00)
                    </span>
                    <span className="text-[10px] text-base-content/40">урок {durationMin} мин</span>
                  </div>
                  {freeSlots && freeSlots.length > 0 ? (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5">
                      {freeSlots.map((s) => {
                        const active = form.startTime === s;
                        return (
                          <button
                            key={s}
                            type="button"
                            className={`py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                              active
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : 'bg-base-100 border-base-300 text-base-content/70 hover:border-primary/50 hover:text-primary'
                            }`}
                            onClick={() => setForm({ ...form, startTime: s })}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  ) : Object.keys(busySlots).length > 0 ? (
                    <div className="alert alert-warning py-2 px-3 text-xs rounded-lg mb-2">
                      Нет общего свободного времени для выбранных дней — уберите занятые дни или выберите другого ментора
                    </div>
                  ) : (
                    <p className="text-xs text-base-content/50">Нет данных о расписании — укажите время вручную</p>
                  )}
                </div>
              )
            )}

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
                  {durationMin && <span className="text-[10px] font-normal text-primary/60 ml-1">({durationMin} мин)</span>}
                </span>
              </div>
            )}
          </div>

          {/* Task 4: модуль + автодата окончания */}
          {!isEdit && modulePreview && (
            <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
              <div className="flex items-center justify-between gap-3">
                <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider block">
                  Модуль
                </label>
                <select
                  className="select select-bordered select-sm rounded-lg text-sm"
                  value={moduleMonths}
                  onChange={(e) => setModuleMonths(Number(e.target.value))}
                >
                  {MODULES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="mt-3 flex items-center gap-2.5 bg-primary/5 border border-primary/10 rounded-lg px-3 py-2.5">
                <CalendarDays size={15} className="text-primary shrink-0" />
                <div className="text-xs text-base-content/70">
                  <span className="font-semibold text-base-content">
                    {fmtDate(modulePreview.firstDate)}
                  </span>
                  {' — '}
                  <span className="font-semibold text-primary">
                    {fmtDate(modulePreview.lastDate)}
                  </span>
                  <span className="text-base-content/50"> · модуль {moduleMonths} мес</span>
                </div>
              </div>
              <p className="text-[10px] text-base-content/40 mt-1.5">Дата окончания — предварительная, считается от первого занятия</p>
            </div>
          )}

          {/* Task 4: новый ученик в этой группе */}
          {!isEdit && (
            <div className="border border-base-300 rounded-xl overflow-hidden">
              <button
                type="button"
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors ${showStudent ? 'bg-primary/5 text-primary' : 'bg-base-100 text-base-content/70 hover:bg-base-200/60'}`}
                onClick={() => setShowStudent(!showStudent)}
              >
                <span className="flex items-center gap-2">
                  <UserPlus size={15} />
                  Добавить нового ученика в группу
                </span>
                <span className={`transition-transform ${showStudent ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {showStudent && (
                <div className="p-4 space-y-3 bg-base-100 border-t border-base-300 animate-fade-in">
                  <p className="text-[10px] uppercase tracking-wider text-base-content/50 font-bold">
                    Ученик будет создан и сразу добавлен в группу
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="form-control">
                      <span className="text-[11px] font-bold text-base-content/70 mb-1 block">Имя <span className="text-error">*</span></span>
                      <input
                        className="input input-bordered input-sm rounded-lg w-full"
                        placeholder="Азиза"
                        value={student.firstName}
                        onChange={(e) => setStudent({ ...student, firstName: e.target.value })}
                      />
                    </label>
                    <label className="form-control">
                      <span className="text-[11px] font-bold text-base-content/70 mb-1 block">Фамилия</span>
                      <input
                        className="input input-bordered input-sm rounded-lg w-full"
                        placeholder="Рахимова"
                        value={student.lastName}
                        onChange={(e) => setStudent({ ...student, lastName: e.target.value })}
                      />
                    </label>
                  </div>
                  <label className="form-control">
                    <span className="text-[11px] font-bold text-base-content/70 mb-1 block">Телефон</span>
                    <input
                      className="input input-bordered input-sm rounded-lg w-full"
                      placeholder="+998 90 123 45 67"
                      value={student.phone}
                      onChange={(e) => setStudent({ ...student, phone: e.target.value })}
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-action mt-6">
          <button className="btn btn-ghost rounded-lg" onClick={onClose} disabled={busy}>Отмена</button>
          <button className="btn btn-primary rounded-lg" onClick={submit} disabled={busy || !form.name || !form.mentorId}>
            {busy && <span className="loading loading-spinner loading-xs" />}
            {isEdit ? 'Сохранить изменения' : 'Создать группу'}
          </button>
        </div>
        </>
        )}
      </div>
      <div className="modal-backdrop bg-base-300/60 backdrop-blur-sm" onClick={onClose} />
    </dialog>
  );
}

/* ═══════════════ Main Groups ═══════════════ */
export default function AdminGroups() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data, isLoading, error, refetch } = useAdminGroups();
  const { data: mentorsData } = useAdminMentors();
  const { data: settingsData } = useAdminSettings();
  const [form, setForm] = useState(null);   // null = closed | object = open (new or edit)
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [showExport, setShowExport] = useState(false);

  // Auto-open the create modal when arriving from Dashboard «Новая группа»
  // (navigate('/groups', { state: { openCreate: true } })). State is cleared
  // so a browser refresh doesn't re-open the modal.
  useEffect(() => {
    if (location.state?.openCreate) {
      setForm({ ...emptyForm });
      navigate(location.pathname, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const raw = data?.data || data || {};
  const rows = raw.groups || (Array.isArray(raw) ? raw : []);
  const mraw = mentorsData?.data || mentorsData || {};
  const mentors = mraw.mentors || (Array.isArray(mraw) ? mraw : []);
  const lessonDurationMin = settingsData?.lessonDurationMin ?? settingsData?.data?.lessonDurationMin ?? null;

  const activeGroups = rows.filter((g) => !isArchived(g)).length;
  const archivedGroups = rows.filter((g) => isArchived(g)).length;
  const totalStudents = rows.reduce((s, g) => s + Number(g.students ?? g.studentsCount ?? g.students_count ?? 0), 0);
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
    const res = f.id
      ? await api.adminUpdateGroup(token, f.id, body)
      : await api.adminCreateGroup(token, body);
    refetch();
    return res; // возвращаем созданную группу — нужна для привязки нового ученика
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
                  const count = Number(g.students ?? g.studentsCount ?? g.students_count ?? 0);
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
        token={token}
        groups={rows}
      />
    </div>
  );
}
