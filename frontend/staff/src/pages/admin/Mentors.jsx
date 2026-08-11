import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Users, UserCheck, UserX, Mail, Phone, Award, MessageCircle, Download, Copy, Check, KeyRound, Snowflake, Archive, LayoutGrid, List } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminMentors } from '../../queries.js';
import { api } from '../../api.js';
import PhoneInput from '../../components/PhoneInput.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ExportDialog from '../../components/ExportDialog.jsx';
import { Avatar, EmptyState, Kpi, RowSkeleton, Tip, SearchInput } from '../mentor/_ui.jsx';

const fullName = (m) =>
  [m.firstName || m.first_name, m.lastName || m.last_name].filter(Boolean).join(' ') || '—';

const emptyForm = { id: null, firstName: '', lastName: '', phone: '', email: '' };

const STATUS_COLORS = {
  active: { bg: '#2ECC7115', text: '#2ECC71', label: 'Активен' },
  frozen: { bg: '#E8543E15', text: '#E8543E', label: 'Заморожен' },
};

/* ═══════════════ Grade ═══════════════ */
/* Грейд ментора — read-only везде (Karis, 11.08.2026): выбор уровня убран из
   админки, в карточке ментора показывается статичный бейдж. PATCH /api/users/me
   это поле не принимает, так что ментор тоже видит его только для чтения. */
const GRADES = [
  { value: '', label: 'Не задан', className: 'text-base-content/60' },
  { value: 'junior', label: 'Junior', className: 'text-info' },
  { value: 'middle', label: 'Middle', className: 'text-warning' },
  { value: 'senior', label: 'Senior', className: 'text-success' },
];

/* ═══════════════ Mentor Card ═══════════════ */
function MentorCard({ m, onEdit, onFreeze, onDelete }) {
  const navigate = useNavigate();
  const status = STATUS_COLORS[m.status] || STATUS_COLORS.active;
  const grade = GRADES.find((g) => g.value === (m.grade || '')) || GRADES[0];
  const isFrozen = m.status === 'frozen';

  return (
    <div className="card bg-base-100 p-5 card-hover-premium group cursor-pointer" onClick={() => navigate(`/mentors/${m.id}`)}>
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

          {/* Action buttons */}
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold" title="Уровень ментора">
              <Award size={11} className={grade.className} /> {grade.label}
            </span>
            <button className="h-7 px-2.5 rounded-[8px] flex items-center gap-1 text-[11px] font-semibold text-base-content/70 bg-base-100 border border-base-300 hover:border-primary/40 hover:bg-primary/10 transition-all"
              onClick={(e) => { e.stopPropagation(); onEdit(m); }}>
              <Pencil size={11} /> Изменить
            </button>
            <button
              className="h-7 w-7 rounded-[8px] flex items-center justify-center text-base-content/45 hover:bg-primary/10 hover:text-primary transition-all"
              title="Написать в чат"
              onClick={(e) => { e.stopPropagation(); navigate('/chat'); }}
            >
              <MessageCircle size={13} />
            </button>
            <button
              className={`h-7 w-7 rounded-[8px] flex items-center justify-center transition-all ${isFrozen ? 'bg-primary/10 text-primary' : 'text-base-content/45 hover:bg-primary/10 hover:text-primary'}`}
              title={isFrozen ? 'Разморозить' : 'Заморозить'}
              onClick={(e) => { e.stopPropagation(); onFreeze(m); }}
            >
              <Snowflake size={13} />
            </button>
            <button
              className="h-7 w-7 rounded-[8px] flex items-center justify-center text-base-content/45 hover:bg-error/10 hover:text-error transition-all"
              title="Удалить"
              onClick={(e) => { e.stopPropagation(); onDelete(m); }}
            >
              <Archive size={13} />
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
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useAdminMentors();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('card');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [showExport, setShowExport] = useState(false);
  const [creds, setCreds] = useState(null);
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(field); setTimeout(() => setCopied(''), 2000); });
  };

  const raw = data?.data || data || {};
  const rows = raw.mentors || (Array.isArray(raw) ? raw : []);

  const activeCount = rows.filter((m) => m.status !== 'frozen').length;
  const frozenCount = rows.filter((m) => m.status === 'frozen').length;

  const filteredRows = useMemo(() => {
    return rows.filter(m => {
      if (statusFilter === 'active' && m.status === 'frozen') return false;
      if (statusFilter === 'frozen' && m.status !== 'frozen') return false;
      if (search) {
        const q = search.toLowerCase();
        const n = fullName(m).toLowerCase();
        return n.includes(q) || m.phone?.includes(q) || m.email?.includes(q);
      }
      return true;
    });
  }, [rows, search, statusFilter]);

  const toggleFreeze = async (m) => {
    const frozen = m.status === 'frozen';
    try { 
      await api.adminFreezeMentor(token, m.id, !frozen); 
      refetch(); 
    } catch (e) { alert(e.message || 'Ошибка'); }
  };
  
  const archiveMentor = async (m) => {
    if (!confirm(`Удалить ментора ${fullName(m)}?`)) return;
    try { 
      await api.adminDeleteMentor(token, m.id); 
      refetch(); 
    } catch (e) { alert(e.message || 'Ошибка'); }
  };

  const save = async () => {
    setBusy(true); setErr('');
    try {
      const body = { firstName: form.firstName, lastName: form.lastName, phone: form.phone || undefined };
      if (form.id) {
        await api.adminUpdateMentor(token, form.id, body);
        setForm(null);
      } else {
        const res = await api.adminCreateMentor(token, { ...body, email: form.email });
        const r = res?.data || res;
        setForm(null);
        if (r.mentor?.password) {
          setCreds({ email: form.email, password: r.mentor.password });
        }
      }
      refetch();
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  const edit = (m) => setForm({ id: m.id, firstName: m.firstName || m.first_name || '', lastName: m.lastName || m.last_name || '', phone: m.phone || '', email: m.email || '' });

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Менторы" subtitle="Преподаватели филиала">
        <button className="btn btn-ghost btn-sm gap-1.5" onClick={() => setShowExport(true)} disabled={filteredRows.length === 0}>
          <Download size={14} /> Экспорт
        </button>
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

      {/* ═══ Search + View Toggle ═══ */}
      <div className="flex items-center gap-3 animate-fade-in stagger-3 mb-6 mt-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по имени, email или телефону…"
          className="flex-1"
        />
        {/* Status filter tabs */}
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-[12px] bg-base-100 border border-base-300">
          {[
            { key: 'all', label: 'Все', count: rows.length },
            { key: 'active', label: 'Активные', count: activeCount },
            { key: 'frozen', label: 'Заморожены', count: frozenCount },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-[12px] text-[11px] font-bold transition-all duration-200 ${
                statusFilter === f.key
                  ? 'bg-primary/10 text-primary'
                  : 'text-base-content/50 hover:text-base-content'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-[12px] bg-base-100 border border-base-300">
          <button
            onClick={() => setViewMode('card')}
            className={`w-8 h-8 rounded-[12px] flex items-center justify-center transition-all ${
              viewMode === 'card'
                ? 'bg-primary/10 text-primary'
                : 'text-base-content/50 hover:text-base-content'
            }`}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`w-8 h-8 rounded-[12px] flex items-center justify-center transition-all ${
              viewMode === 'table'
                ? 'bg-primary/10 text-primary'
                : 'text-base-content/50 hover:text-base-content'
            }`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* ═══ Mentor List ═══ */}
      {isLoading ? (
        <RowSkeleton count={4} />
      ) : error ? (
        <div className="alert alert-error mt-4">Ошибка загрузки: {error.message}</div>
      ) : filteredRows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'Попробуйте изменить запрос' : 'Нет менторов'}
          hint={search ? undefined : 'Добавьте первого преподавателя'}
          action={!search ? (
            <button className="btn btn-primary btn-sm gap-1" onClick={() => { setForm(emptyForm); setErr(''); }}>
              <Plus size={14} /> Добавить
            </button>
          ) : undefined}
        />
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRows.map((m) => (
            <MentorCard
              key={m.id}
              m={m}
              onEdit={edit}
              onFreeze={toggleFreeze}
              onDelete={archiveMentor}
            />
          ))}
        </div>
      ) : (
        <div className="card bg-base-100 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="table w-full text-[13px]">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Телефон</th>
                  <th>Грейд</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((m, i) => {
                  const status = STATUS_COLORS[m.status] || STATUS_COLORS.active;
                  const grade = GRADES.find((g) => g.value === (m.grade || '')) || GRADES[0];
                  return (
                    <tr key={m.id} className="hover:bg-base-200 cursor-pointer" onClick={() => navigate(`/mentors/${m.id}`)}>
                      <td>
                        <div className="flex items-center gap-2">
                           <span className="text-base-content/40 font-mono text-[11px] tabular-nums">{i + 1}.</span>
                           <span className="font-semibold text-base-content">{fullName(m)}</span>
                        </div>
                      </td>
                      <td className="text-base-content/70">{m.email || '—'}</td>
                      <td className="text-primary font-medium">{m.phone || '—'}</td>
                      <td>
                         <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${grade.className}`}>
                           <Award size={11} /> {grade.label}
                         </span>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                          style={{ background: status.bg, color: status.text }}>
                          {status.label}
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

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} pageKey="mentors" data={filteredRows} />

      {/* ═══ Create/Edit Modal ═══ */}
      {form && (
        <dialog className="modal modal-open">
          <div className="modal-box card bg-base-100 border border-base-300">
            <h3 className="font-bold text-lg mb-4">{form.id ? 'Изменить ментора' : 'Новый ментор'}</h3>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <div className="space-y-3">
              <input className="input input-bordered w-full" placeholder="Имя" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <input className="input input-bordered w-full" placeholder="Фамилия" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <PhoneInput className="input input-bordered w-full" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
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

      {/* ═══ Модалка с паролем нового ментора — показывается один раз ═══ */}
      {creds && (
        <dialog className="modal modal-open">
          <div className="modal-box card bg-base-100 border border-base-300 max-w-sm">
            <h3 className="font-bold text-lg mb-1 flex items-center gap-2"><KeyRound size={18} className="text-primary" /> Ментор создан</h3>
            <p className="text-[12px] text-base-content/45 mb-4">Пароль показывается один раз — передайте его ментору сейчас.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-[10px] bg-base-200/60">
                <div>
                  <div className="text-[10px] font-bold text-base-content/45 uppercase">Email</div>
                  <div className="text-[13px] font-semibold text-base-content">{creds.email}</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[10px] bg-base-200/60">
                <div>
                  <div className="text-[10px] font-bold text-base-content/45 uppercase">Пароль</div>
                  <div className="text-[15px] font-mono font-extrabold text-base-content">{creds.password}</div>
                </div>
                <button onClick={() => copyToClipboard(creds.password, 'pw')} className="btn btn-ghost btn-sm">
                  {copied === 'pw' ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-primary" onClick={() => setCreds(null)}>Готово</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setCreds(null)} />
        </dialog>
      )}
    </div>
  );
}
