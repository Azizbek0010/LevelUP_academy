import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Users, UserCheck, UserX, Mail, Phone, Award, MessageCircle } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminMentors } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Avatar, EmptyState, Kpi, RowSkeleton } from '../mentor/_ui.jsx';

const fullName = (m) =>
  [m.firstName || m.first_name, m.lastName || m.last_name].filter(Boolean).join(' ') || '—';

const emptyForm = { id: null, firstName: '', lastName: '', phone: '', email: '' };

const STATUS_COLORS = {
  active: { bg: '#2ECC7115', text: '#2ECC71', label: 'Активен' },
  frozen: { bg: '#E8543E15', text: '#E8543E', label: 'Заморожен' },
};

/* ═══════════════ Stat Card ═══════════════ */
/* Грейд ментора. Меняется только отсюда: сам ментор в своём профиле видит его
   как read-only — PATCH /api/users/me это поле не принимает. */
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
    <div className="card bg-base-100 p-5 card-hover-premium group">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="transition-transform duration-300 group-hover:scale-105">
          <Avatar name={fullName(m)} size="lg" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px] font-bold text-base-content truncate">{fullName(m)}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: status.bg, color: status.text }}>
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
                <Phone size={10} className="opacity-50" /> {m.phone}
              </span>
            )}
          </div>

          {/* Навыки — короткой строкой */}
          {m.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {m.skills.slice(0, 3).map((s) => (
                <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-base-200 text-base-content/70">
                  {s}
                </span>
              ))}
              {m.skills.length > 3 && (
                <span className="text-[10px] px-1 text-base-content/45">+{m.skills.length - 3}</span>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            <GradePicker
              value={m.grade}
              busy={gradeBusy === m.id}
              onChange={(grade) => onGrade(m, grade)}
            />
            <button className="h-7 px-2.5 rounded-[8px] flex items-center gap-1 text-[11px] font-semibold text-base-content/70 bg-base-100 border border-base-300 hover:border-primary/40 hover:bg-primary/10 transition-all"
              onClick={() => onEdit(m)}>
              <Pencil size={11} /> Изменить
            </button>
            <button
              className="h-7 w-7 rounded-[8px] flex items-center justify-center text-base-content/45 hover:bg-primary/10 hover:text-primary transition-all"
              title="Написать в чат"
              onClick={() => navigate('/chat')}
            >
              <MessageCircle size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Main Mentors ═══════════════ */
export default function AdminMentors() {
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminMentors();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const raw = data?.data || data || {};
  const rows = raw.mentors || (Array.isArray(raw) ? raw : []);

  const activeCount = rows.filter((m) => m.status !== 'frozen').length;
  const frozenCount = rows.filter((m) => m.status === 'frozen').length;

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = { firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined };
      if (form.id) {
        await api.adminUpdateMentor(token, form.id, body);
      } else {
        await api.adminCreateMentor(token, { ...body, email: form.email });
      }
      setForm(null); refetch();
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  const [gradeBusy, setGradeBusy] = useState(null);

  const setGrade = async (m, grade) => {
    setGradeBusy(m.id);
    try {
      await api.adminUpdateMentor(token, m.id, { grade });
      refetch();
    } catch (e) {
      alert(e.message || 'Не удалось изменить уровень');
    } finally {
      setGradeBusy(null);
    }
  };

  const edit = (m) => setForm({ id: m.id, firstName: m.firstName || m.first_name || '', lastName: m.lastName || m.last_name || '', phone: m.phone || '', email: m.email || '' });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Менторы" subtitle="Преподаватели филиала">
        <button className="btn btn-primary btn-sm gap-1" onClick={() => { setForm(emptyForm); setErr(''); }}>
          <Plus size={16} /> Добавить ментора
        </button>
      </PageHeader>

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi Icon={Users} title="Всего" value={rows.length}  tone="neutral" />
        <Kpi Icon={UserCheck} title="Активные" value={activeCount}  tone="success" />
        <Kpi Icon={UserX} title="Заморожены" value={frozenCount}  tone="danger" />
      </div>

      {/* ═══ Mentor Cards ═══ */}
      {isLoading ? (
        <RowSkeleton count={4} />
      ) : error ? (
        <div className="alert alert-error mt-4">Ошибка загрузки: {error.message}</div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Нет менторов"
          hint="Добавьте первого преподавателя"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map((m) => (
            <MentorCard
              key={m.id}
              m={m}
              onEdit={edit}
              onGrade={setGrade}
              gradeBusy={gradeBusy}
            />
          ))}
        </div>
      )}

      {/* ═══ Create/Edit Modal ═══ */}
      {form && (
        <dialog className="modal modal-open">
          <div className="modal-box card bg-base-100 border border-base-300">
            <h3 className="font-bold text-lg mb-4">{form.id ? 'Изменить ментора' : 'Новый ментор'}</h3>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <div className="space-y-3">
              <input className="input input-bordered w-full" placeholder="Имя" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <input className="input input-bordered w-full" placeholder="Фамилия" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <input className="input input-bordered w-full" placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              {!form.id && (
                <input className="input input-bordered w-full" type="email" placeholder="Email (для входа)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              )}
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setForm(null)} disabled={busy}>Отмена</button>
              <button className="btn btn-primary" onClick={save} disabled={busy || !form.firstName || !form.lastName || (!form.id && !form.email)}>
                {busy && <span className="loading loading-spinner loading-xs" />} Сохранить
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setForm(null)} />
        </dialog>
      )}
    </div>
  );
}
