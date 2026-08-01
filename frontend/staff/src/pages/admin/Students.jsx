import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Snowflake, Sun, Archive, KeyRound, GraduationCap, UserCheck, UserX,
  Copy, Check, Coins, LayoutGrid, List, AlertTriangle, Download
} from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminStudents, useAdminGroups } from '../../queries.js';
import { api } from '../../api.js';
import { formatPhone } from '../../format.js';
import PhoneInput from '../../components/PhoneInput.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ExportDialog from '../../components/ExportDialog.jsx';
import { Avatar, EmptyState, Kpi, RowSkeleton, SearchInput, Tip } from '../mentor/_ui.jsx';

const fullName = (s) =>
  s.fullName || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ') || '—';

/* Qarz summasi — backend `totalDebt` kabi qaytaradi (eski aliaslar ham saqlanadi) */
const studentDebt = (s) => Number(s.totalDebt || s.debt || s.outstandingDebt || s.balance || 0);

const emptyForm = { firstName: '', lastName: '', phone: '', birthDate: '', groupId: '', parentFirstName: '', parentLastName: '', parentPhone: '' };

const STATUS_COLORS = {
  active: { bg: '#2ECC7115', text: '#2ECC71', label: 'Активен' },
  frozen: { bg: '#E8543E15', text: '#E8543E', label: 'Заморожен' },
};

/* ═══════════════ Stat Card ═══════════════ */
/* ═══════════════ Student Card ═══════════════ */
function StudentCard({ s, onNavigate }) {
  const status = STATUS_COLORS[s.status] || STATUS_COLORS.active;
  const groupNames = (s.groups && s.groups.length > 0) ? s.groups.map((g) => g.name).filter(Boolean) : (s.groupName ? [s.groupName] : []);
  const debt = studentDebt(s);

  return (
    <div className="card bg-base-100 p-4 card-hover-premium group cursor-pointer" onClick={() => onNavigate?.(s.id)}>
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div className="transition-transform duration-300 group-hover:scale-105">
          <Avatar name={fullName(s)} size="lg" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-base-content truncate">{fullName(s)}</span>
            {s.status !== 'active' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: status.bg, color: status.text }}>
                {status.label}
              </span>
            )}
            {debt > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                style={{ background: '#E8543E15', color: '#E8543E' }}>
                <AlertTriangle size={10} /> Долг {debt.toLocaleString('ru-RU')} сум
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-base-content/45">
            {s.login_code || s.loginCode ? (
              <span className="font-mono flex items-center gap-1">
                <KeyRound size={10} /> {s.login_code || s.loginCode}
              </span>
            ) : null}
            {s.phone && <span>{formatPhone(s.phone)}</span>}
            {s.coins != null && s.coins > 0 && (
              <span className="flex items-center gap-1 text-primary font-semibold">
                <Coins size={10} /> {s.coins}
              </span>
            )}
          </div>

          {groupNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {groupNames.map((name, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-primary/10 text-primary">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Main Students ═══════════════ */
export default function AdminStudents() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'frozen'
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const { data, isLoading, error, refetch } = useAdminStudents(qs);
  const { data: groupsData } = useAdminGroups('?limit=200');
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [creds, setCreds] = useState(null);
  const [copied, setCopied] = useState('');
  const [showExport, setShowExport] = useState(false);

  const raw = data?.data || data || {};
  const rows = raw.students || (Array.isArray(raw) ? raw : []);

  const activeCount = rows.filter((s) => s.status !== 'frozen').length;
  const frozenCount = rows.filter((s) => s.status === 'frozen').length;
  const debtCount = rows.filter((s) => studentDebt(s) > 0).length;
  const filteredRows = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) => {
        const name = fullName(s).toLowerCase();
        const phone = (s.phone || '').toLowerCase();
        const code = (s.login_code || s.loginCode || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || code.includes(q);
      });
    }
    if (statusFilter === 'all') return result;
    if (statusFilter === 'active') return result.filter(s => s.status !== 'frozen');
    if (statusFilter === 'frozen') return result.filter(s => s.status === 'frozen');
    if (statusFilter === 'debt') return result.filter(s => studentDebt(s) > 0);
    return result;
  }, [rows, search, statusFilter]);

  const create = async () => {
    setBusy(true); setErr('');
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        birthDate: form.birthDate || undefined,
        groupId: form.groupId || undefined,
      };
      
      if (form.parentFirstName || form.parentLastName || form.parentPhone) {
        payload.parent = {
          firstName: form.parentFirstName || form.firstName,
          lastName: form.parentLastName || form.lastName,
          phone: form.parentPhone || undefined,
        };
      }
      
      const res = await api.adminCreateStudent(token, payload);
      const r = res?.data || res;
      setForm(null);
      setCreds({ login_code: r.login_code || r.loginCode || r.student?.login_code || r.student?.loginCode, password: r.password || r.student?.password });
      refetch();
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  const toggleFreeze = async (s) => {
    const frozen = s.status === 'frozen';
    try { await api.adminFreezeStudent(token, s.id, !frozen, ''); refetch(); }
    catch (e) { alert(e.message || 'Ошибка'); }
  };
  const archive = async (s) => {
    if (!confirm(`Архивировать студента ${fullName(s)}?\n\nСтудент будет скрыт из списка, но данные сохранятся.`)) return;
    try { await api.adminDeleteStudent(token, s.id); refetch(); }
    catch (e) { alert(e.message || 'Ошибка'); }
  };
  const regen = async (s) => {
    try {
      const res = await api.adminRegenStudentPassword(token, s.id);
      const r = res?.data || res;
      setCreds({ login_code: s.login_code || s.loginCode, password: r.password });
    } catch (e) { alert(e.message || 'Ошибка'); }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader title="Студенты" subtitle="Учёт студентов филиала">
        <button className="btn btn-ghost btn-sm gap-1.5" onClick={() => setShowExport(true)} disabled={filteredRows.length === 0}>
          <Download size={14} /> Экспорт
        </button>
        {statusFilter !== 'frozen' && (
          <button className="btn btn-primary btn-sm gap-1" onClick={() => { setForm(emptyForm); setErr(''); }}>
            <Plus size={16} /> Добавить студента
          </button>
        )}
      </PageHeader>

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi Icon={GraduationCap} title="Всего" value={rows.length}  tone="neutral" />
        <Kpi Icon={UserCheck} title="Активные" value={activeCount}  tone="success" />
        <Kpi Icon={UserX} title="Заморожены" value={frozenCount}  tone="danger" />
      </div>

      {/* ═══ Search + View Toggle ═══ */}
      <div className="flex items-center gap-3 animate-fade-in stagger-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Поиск по имени, фамилии или телефону…"
          className="flex-1"
        />
        {/* Status filter tabs */}
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-[12px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {[
            { key: 'all', label: 'Все', count: rows.length },
            { key: 'active', label: 'Активные', count: activeCount },
            { key: 'frozen', label: 'Заморожены', count: frozenCount },
            { key: 'debt', label: 'Задолжен', count: debtCount },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className="px-3 py-1.5 rounded-[12px] text-[11px] font-bold transition-all duration-200"
              style={{
                background: statusFilter === f.key ? 'rgba(59,130,246,0.12)' : 'transparent',
                color: statusFilter === f.key ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-[12px]" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setViewMode('card')}
            className="w-8 h-8 rounded-[12px] flex items-center justify-center transition-all"
            style={{ background: viewMode === 'card' ? 'rgba(59,130,246,0.12)' : 'transparent', color: viewMode === 'card' ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className="w-8 h-8 rounded-[12px] flex items-center justify-center transition-all"
            style={{ background: viewMode === 'table' ? 'rgba(59,130,246,0.12)' : 'transparent', color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-muted)' }}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* ═══ Student List ═══ */}
      {isLoading ? (
        <RowSkeleton count={5} />
      ) : error ? (
        <div className="alert alert-error mt-4">Ошибка загрузки: {error.message}</div>
      ) : filteredRows.length === 0 ? (
        <EmptyState
          icon={statusFilter === 'debt' ? AlertTriangle : GraduationCap}
          title={
            search ? 'Попробуйте изменить запрос'
              : statusFilter === 'frozen' ? 'Нет замороженных студентов'
              : statusFilter === 'debt' ? 'Нет должников'
              : 'Нет студентов'
          }
          hint={
            search || statusFilter === 'frozen' ? undefined
              : statusFilter === 'debt' ? 'У всех студентов оплата в порядке'
              : 'Добавьте первого студента'
          }
          action={(!search && statusFilter !== 'frozen' && statusFilter !== 'debt') ? (
            <button className="btn btn-primary btn-sm gap-1" onClick={() => { setForm(emptyForm); setErr(''); }}>
              <Plus size={14} /> Добавить
            </button>
          ) : undefined}
        />
      ) : viewMode === 'card' ? (
        /* Card view */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRows.map((s) => (
            <StudentCard key={s.id} s={s} onNavigate={(id) => navigate(`/students/${id}`)} />
          ))}
        </div>
      ) : (
        /* Table view */
        <div className="card bg-base-100 overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="table w-full text-[13px]">
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>Код</th>
                  <th>Телефон</th>
                  <th>Группы</th>
                  <th>Коины</th>
                  <th>Долг</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(s => (
                  <tr key={s.id} className="hover:bg-base-200 cursor-pointer" onClick={() => navigate(`/students/${s.id}`)}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={fullName(s)} size="sm" />
                        <span className="font-semibold text-base-content">{fullName(s)}</span>
                      </div>
                    </td>
                    <td className="font-mono text-base-content/70">{s.login_code || s.loginCode || '—'}</td>
                    <td className="text-base-content/45">{formatPhone(s.phone)}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const tg = (s.groups && s.groups.length > 0) ? s.groups : (s.groupName ? [{name: s.groupName}] : []);
                          return [
                            ...tg.slice(0, 2).map((g, i) => (
                              <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-primary/10 text-primary">
                                {g.name}
                              </span>
                            )),
                            tg.length > 2 && (
                              <span key="more" className="text-[9px] text-base-content/45">+{tg.length - 2}</span>
                            )
                          ];
                        })()}
                      </div>
                    </td>
                    <td className="tabular-nums">
                      {s.coins != null && s.coins > 0 ? (
                        <span className="flex items-center gap-1 text-primary font-semibold text-[12px]">
                          <Coins size={11} /> {s.coins}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="tabular-nums">
                      {studentDebt(s) > 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[11px]" style={{ color: '#E8543E' }}>
                          <AlertTriangle size={11} /> {studentDebt(s).toLocaleString('ru-RU')}
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold" style={{ color: '#2ECC71' }}>Нет</span>
                      )}
                    </td>
                    <td>
                      {s.status !== 'active' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: (STATUS_COLORS[s.status] || STATUS_COLORS.active).bg, color: (STATUS_COLORS[s.status] || STATUS_COLORS.active).text }}>
                          {(STATUS_COLORS[s.status] || STATUS_COLORS.active).label}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ Create Modal ═══ */}
      {form && (
        <dialog className="modal modal-open">
          <div className="modal-box card bg-base-100 border border-base-300">
            <h3 className="font-bold text-lg mb-4">Новый студент</h3>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <div className="space-y-4">
              <div>
                <h4 className="text-[12px] font-bold text-base-content/50 uppercase tracking-wider mb-2">Данные студента</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input className="input input-bordered w-full" placeholder="Имя" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                  <input className="input input-bordered w-full" placeholder="Фамилия" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <PhoneInput className="input input-bordered w-full" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
                  <input className="input input-bordered w-full" type="date" placeholder="Дата рождения" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
                </div>

              </div>
              
              <div>
                <h4 className="text-[12px] font-bold text-base-content/50 uppercase tracking-wider mb-2">Данные родителя (опционально)</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input className="input input-bordered w-full" placeholder="Имя родителя" value={form.parentFirstName} onChange={(e) => setForm({ ...form, parentFirstName: e.target.value })} />
                  <input className="input input-bordered w-full" placeholder="Фамилия родителя" value={form.parentLastName} onChange={(e) => setForm({ ...form, parentLastName: e.target.value })} />
                </div>
                <PhoneInput className="input input-bordered w-full" value={form.parentPhone} onChange={(v) => setForm({ ...form, parentPhone: v })} />
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setForm(null)} disabled={busy}>Отмена</button>
              <button className="btn btn-primary" onClick={create} disabled={busy || !form.firstName || !form.lastName}>
                {busy && <span className="loading loading-spinner loading-xs" />} Создать
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setForm(null)} />
        </dialog>
      )}

      <ExportDialog open={showExport} onClose={() => setShowExport(false)} pageKey="students" data={filteredRows} />

      {/* ═══ Credentials Modal ═══ */}
      {creds && (
        <dialog className="modal modal-open">
          <div className="modal-box card bg-base-100 border border-base-300">
            <h3 className="font-bold text-lg mb-2">Данные для входа</h3>
            <p className="text-sm text-base-content/45 mb-4">Передайте студенту. Пароль показывается один раз.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-[12px] bg-base-100 border border-base-300">
                <span className="text-[13px] text-base-content/70">Логин-код</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[14px]">{creds.login_code || '—'}</span>
                  {creds.login_code && (
                    <button className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-primary/10 transition-colors"
                      onClick={() => copyToClipboard(creds.login_code, 'login')}>
                      {copied === 'login' ? <Check size={12} className="text-primary" /> : <Copy size={12} className="text-base-content/45" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[12px] bg-base-100 border border-base-300">
                <span className="text-[13px] text-base-content/70">Пароль</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[14px]">{creds.password || '—'}</span>
                  {creds.password && (
                    <button className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-primary/10 transition-colors"
                      onClick={() => copyToClipboard(creds.password, 'pass')}>
                      {copied === 'pass' ? <Check size={12} className="text-primary" /> : <Copy size={12} className="text-base-content/45" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-primary" onClick={() => setCreds(null)}>Понятно</button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
