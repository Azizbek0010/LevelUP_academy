import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Users, UserCheck, UserX, Mail, Phone, Award, MessageCircle, Download, Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminMentors } from '../../queries.js';
import { api } from '../../api.js';
import { formatPhone } from '../../format.js';
import PhoneInput from '../../components/PhoneInput.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ExportDialog from '../../components/ExportDialog.jsx';
import { Avatar, EmptyState, Kpi, RowSkeleton } from '../mentor/_ui.jsx';

const fullName = (m) =>
  [m.firstName || m.first_name, m.lastName || m.last_name].filter(Boolean).join(' ') || '—';

const emptyForm = { id: null, firstName: '', lastName: '', phone: '', email: '', password: '' };

const STATUS_COLORS = {
  active: { bg: '#2ECC7115', text: '#2ECC71', label: 'Активен' },
  frozen: { bg: '#E8543E15', text: '#E8543E', label: 'Заморожен' },
};

/* ═══════════════ Grade Picker ═══════════════ */
const GRADES = [
  { value: '', label: 'Не задан', color: 'var(--text-muted)' },
  { value: 'junior', label: 'Junior', color: '#2563eb' },
  { value: 'middle', label: 'Middle', color: '#b45309' },
  { value: 'senior', label: 'Senior', color: '#15803d' },
];

function GradePicker({ value, onChange, busy }) {
  const current = GRADES.find((g) => g.value === (value || '')) || GRADES[0];
  return (
    <label className="flex items-center gap-1.5" title="Уровень ментора">
      <Award size={11} style={{ color: current.color }} />
      <select
        className="h-7 pl-1.5 pr-6 rounded-[8px] text-[11px] font-bold bg-base-100 border border-base-300 outline-none cursor-pointer disabled:opacity-50"
        style={{ color: current.color }}
        value={value || ''}
        disabled={busy}
        onChange={(e) => onChange(e.target.value || null)}
      >
        {GRADES.map((g) => (
          <option key={g.value} value={g.value}>{g.label}</option>
        ))}
      </select>
    </label>
  );
}

/* ═══════════════ Mentor Card ═══════════════ */
function MentorCard({ m, onEdit, onGrade, gradeBusy }) {
  const navigate = useNavigate();
  const status = STATUS_COLORS[m.status] || STATUS_COLORS.active;

  return (
    <div
      className="card bg-base-100 p-5 card-hover-premium group cursor-pointer"
      onClick={() => navigate(`/mentors/${m.id}`)}
    >
      <div className="flex items-start gap-4">
        <div className="transition-transform duration-300 group-hover:scale-105">
          <Avatar name={fullName(m)} size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px] font-bold text-base-content truncate group-hover:text-primary transition-colors">
              {fullName(m)}
            </span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: status.bg, color: status.text }}
            >
              {status.label}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-[11px] text-base-content/45">
            {m.email && (
              <span className="flex items-center gap-1.5">
                <Mail size={10} className="opacity-50" /> {m.email}
              </span>
            )}
            {m.phone && (
              <span className="flex items-center gap-1.5">
                <Phone size={10} className="opacity-50" /> {formatPhone(m.phone)}
              </span>
            )}
          </div>
          {m.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {m.skills.slice(0, 3).map((s) => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-base-200 text-base-content/70">{s}</span>
              ))}
              {m.skills.length > 3 && (
                <span className="text-[10px] px-1 text-base-content/45">+{m.skills.length - 3}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1 mt-3 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <GradePicker value={m.grade} busy={gradeBusy === m.id} onChange={(grade) => onGrade(m, grade)} />
            <button
              className="h-7 px-2.5 rounded-[8px] flex items-center gap-1 text-[11px] font-semibold text-base-content/70 bg-base-100 border border-base-300 hover:border-primary/40 hover:bg-primary/10 transition-all"
              onClick={() => onEdit(m)}
            >
              <Pencil size={11} /> Изменить
            </button>
            <button
              className="h-7 w-7 rounded-[8px] flex items-center justify-center text-base-content/45 hover:bg-primary/10 hover:text-primary transition-all"
              title="Написать в чат"
              onClick={(e) => { e.stopPropagation(); navigate(`/chat?peer=${m.id}`); }}
            >
              <MessageCircle size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Form Field ═══════════════ */
function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-base-content/55 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-error mt-1 flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
}

/* ═══════════════ Main ═══════════════ */
export default function AdminMentors() {
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminMentors();

  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiErr, setApiErr] = useState('');
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [gradeBusy, setGradeBusy] = useState(null);

  const raw = data?.data || data || {};
  const rows = raw.mentors || (Array.isArray(raw) ? raw : []);
  const activeCount = rows.filter((m) => m.status !== 'frozen').length;
  const frozenCount = rows.filter((m) => m.status === 'frozen').length;

  /* Validation — matches backend createMentorSchema; в edit-режиме email/password
     опциональны (предзаполнены/пустые), но при заполнении проверяются так же */
  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Ism majburiy';
    if (!form.lastName.trim()) errs.lastName = 'Familiya majburiy';
    const emailOk = form.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
    const passwordOk = form.password && form.password.length >= 8;
    if (!form.id) {
      if (!form.email.trim()) errs.email = 'Email majburiy';
      else if (!emailOk) errs.email = "Email noto'g'ri formatda";
      if (!form.password) errs.password = 'Parol majburiy';
      else if (!passwordOk) errs.password = 'Kamida 8 ta belgi bo\'lishi kerak';
    } else {
      if (form.email.trim() && !emailOk) errs.email = "Email noto'g'ri formatda";
      if (form.password && !passwordOk) errs.password = 'Kamida 8 ta belgi bo\'lishi kerak';
    }
    return errs;
  };

  const save = async () => {
    setApiErr('');
    setNotice('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setBusy(true);
    try {
      if (form.id) {
        /* PATCH — backend updateMentorSchema: firstName, lastName, phone, grade (все
           опциональны). email/password пока НЕ принимаются (zod их выкидывает) —
           отправляем их всё равно и после ответа сверяем email: если бэкенд
           «съел» поле, честно предупреждаем и ждём доработки Karis. */
        const emailSent = form.email.trim().toLowerCase();
        const passwordSent = !!form.password;
        const prevMentor = rows.find((m) => m.id === form.id);
        const prevEmail = (prevMentor?.email || '').trim().toLowerCase();
        const emailChanged = emailSent !== prevEmail;

        const body = {};
        if (form.firstName.trim()) body.firstName = form.firstName.trim();
        if (form.lastName.trim()) body.lastName = form.lastName.trim();
        if (form.phone) body.phone = form.phone;
        if (emailSent) body.email = emailSent;
        if (passwordSent) body.password = form.password;

        const res = await api.adminUpdateMentor(token, form.id, body);
        const savedEmail = ((res?.mentor?.email) || '').trim().toLowerCase();

        /* Стриппинг ловим так: email изменён, но ответ вернул старый — значит
           updateMentorSchema не принял поле. Пароль в ответе не приходит, поэтому
           при смене только пароля полагаемся на известный gap схемы. */
        const stripped = (emailChanged && savedEmail !== emailSent) || (passwordSent && !emailChanged);

        refetch();
        if (stripped) {
          setNotice(
            'Email/parol saqlanmadi — backend updateMentorSchema hali bu maydonlarni qabul qilmaydi. Karis kengaytirguncha ular faqat yaratishda ishlaydi.'
          );
        } else {
          setForm(null);
        }
      } else {
        /* POST — backend createMentorSchema: firstName, lastName, email, password required; phone optional */
        const body = {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        };
        if (form.phone) body.phone = form.phone;
        await api.adminCreateMentor(token, body);
        setForm(null);
        refetch();
      }
    } catch (e) {
      setApiErr(e.message || 'Xatolik yuz berdi');
    } finally {
      setBusy(false);
    }
  };

  const setGrade = async (m, grade) => {
    setGradeBusy(m.id);
    try {
      await api.adminUpdateMentor(token, m.id, { grade });
      refetch();
    } catch (e) {
      alert(e.message || 'Greyд o\'zgartirb bo\'lmadi');
    } finally {
      setGradeBusy(null);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setFieldErrors({});
    setApiErr('');
    setNotice('');
    setShowPassword(false);
  };

  const openEdit = (m) => {
    setForm({
      id: m.id,
      firstName: m.firstName || m.first_name || '',
      lastName: m.lastName || m.last_name || '',
      phone: m.phone || '',
      email: m.email || '',
      password: '',
    });
    setFieldErrors({});
    setApiErr('');
    setNotice('');
    setShowPassword(false);
  };

  const patch = (key, val) => {
    setForm((f) => ({ ...f, [key]: val }));
    setFieldErrors((e) => ({ ...e, [key]: '' }));
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Менторы" subtitle="Преподаватели филиала">
        <button className="btn btn-ghost btn-sm gap-1.5" onClick={() => setShowExport(true)} disabled={rows.length === 0}>
          <Download size={14} /> Экспорт
        </button>
        <button className="btn btn-primary btn-sm gap-1" onClick={openCreate}>
          <Plus size={16} /> Добавить ментора
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi Icon={Users} title="Всего" value={rows.length} tone="neutral" />
        <Kpi Icon={UserCheck} title="Активные" value={activeCount} tone="success" />
        <Kpi Icon={UserX} title="Заморожены" value={frozenCount} tone="danger" />
      </div>

      {/* Cards */}
      {isLoading ? (
        <RowSkeleton count={4} />
      ) : error ? (
        <div className="alert alert-error mt-4">Ошибка загрузки: {error.message}</div>
      ) : rows.length === 0 ? (
        <EmptyState icon={Users} title="Нет менторов" hint="Добавьте первого преподавателя" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((m) => (
            <MentorCard key={m.id} m={m} onEdit={openEdit} onGrade={setGrade} gradeBusy={gradeBusy} />
          ))}
        </div>
      )}

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} pageKey="mentors" data={rows} />

      {/* ═══ Create / Edit Modal ═══ */}
      {form && (
        <dialog className="modal modal-open">
          <div className="modal-box card bg-base-100 border border-base-300 max-w-md w-full">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-[12px] bg-primary/10 flex items-center justify-center shrink-0">
                <Users size={18} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-[15px]">
                  {form.id ? 'Mentorni tahrirlash' : "Yangi mentor qo'shish"}
                </h3>
                <p className="text-[11px] text-base-content/45">
                  {form.id
                    ? "Ma'lumotlarni yangilang"
                    : "* bilan belgilangan maydonlar majburiy"}
                </p>
              </div>
            </div>

            {apiErr && (
              <div className="alert alert-error py-2 text-sm mb-4">
                <span>{apiErr}</span>
              </div>
            )}

            {notice && (
              <div className="alert alert-warning py-2 text-sm mb-4">
                <span>{notice}</span>
              </div>
            )}

            <div className="space-y-3">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ism *" error={fieldErrors.firstName}>
                  <input
                    className={`input input-bordered w-full ${fieldErrors.firstName ? 'input-error' : ''}`}
                    placeholder="Jasur"
                    value={form.firstName}
                    onChange={(e) => patch('firstName', e.target.value)}
                  />
                </Field>
                <Field label="Familiya *" error={fieldErrors.lastName}>
                  <input
                    className={`input input-bordered w-full ${fieldErrors.lastName ? 'input-error' : ''}`}
                    placeholder="Karimov"
                    value={form.lastName}
                    onChange={(e) => patch('lastName', e.target.value)}
                  />
                </Field>
              </div>

              {/* Phone */}
              <Field label="Telefon">
                <PhoneInput
                  className="input input-bordered w-full"
                  value={form.phone}
                  onChange={(v) => patch('phone', v)}
                />
              </Field>

              {/* Email + Password — create: обязательны; edit: опциональны (предзаполнен email,
                  пароль пуст — отправляется только если заполнен). Бэкенд-схема пока принимает
                  их лишь при создании, при редактировании — известный gap, см. save() */}
              <Field label={form.id ? 'Email (kirish uchun)' : 'Email * (kirish uchun)'} error={fieldErrors.email}>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/35 pointer-events-none" />
                  <input
                    className={`input input-bordered w-full pl-9 ${fieldErrors.email ? 'input-error' : ''}`}
                    type="email"
                    placeholder="mentor@example.com"
                    value={form.email}
                    onChange={(e) => patch('email', e.target.value)}
                  />
                </div>
              </Field>

              <Field label={form.id ? 'Parol (faqat o\'zgartirilganda)' : 'Parol * (kamida 8 belgi)'} error={fieldErrors.password}>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/35 pointer-events-none" />
                  <input
                    className={`input input-bordered w-full pl-9 pr-10 ${fieldErrors.password ? 'input-error' : ''}`}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={form.id ? 'Yangi parol (ixtiyoriy)' : 'Kamida 8 ta belgi'}
                    value={form.password}
                    onChange={(e) => patch('password', e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
            </div>

            <div className="modal-action mt-5">
              <button className="btn btn-ghost" onClick={() => setForm(null)} disabled={busy}>
                Bekor qilish
              </button>
              <button className="btn btn-primary gap-1.5" onClick={save} disabled={busy}>
                {busy && <span className="loading loading-spinner loading-xs" />}
                {form.id ? 'Saqlash' : "Qo'shish"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !busy && setForm(null)} />
        </dialog>
      )}
    </div>
  );
}
