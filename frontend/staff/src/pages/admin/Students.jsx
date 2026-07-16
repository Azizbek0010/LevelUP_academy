import { useState } from 'react';
import { Plus, Snowflake, Sun, Trash2, KeyRound, Search, GraduationCap, UserCheck, UserX, Copy, Check, Coins, LayoutGrid, List, Filter } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminStudents } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const fullName = (s) =>
  s.fullName || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ') || '—';

const initials = (s) => {
  const f = s.firstName || s.first_name || '';
  const l = s.lastName || s.last_name || '';
  return ((f[0] || '') + (l[0] || '')).toUpperCase() || '?';
};

const emptyForm = { firstName: '', lastName: '', phone: '', parentPhone: '', age: '', gender: 'male', coins: 0, frozen: false };

const STATUS_COLORS = {
  active: { bg: '#2ECC7115', text: '#2ECC71', label: 'Активен' },
  frozen: { bg: '#E8543E15', text: '#E8543E', label: 'Заморожен' },
};

/* ═══════════════ Stat Card ═══════════════ */
function StatCard({ Icon, label, value, color, gradient, delay }) {
  return (
    <div className={`animate-fade-in ${delay}`}>
      <div className="glass-strong rounded-[16px] p-4 group relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-15 group-hover:opacity-25 transition-opacity duration-500"
          style={{ background: gradient }}
        />
        <div className="relative flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
            style={{ background: `${color}15`, color }}
          >
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

/* ═══════════════ Student Card ═══════════════ */
function StudentCard({ s, onFreeze, onDelete, onRegen }) {
  const status = STATUS_COLORS[s.status] || STATUS_COLORS.active;
  const groupNames = (s.groups || []).map((g) => g.name).filter(Boolean);

  return (
    <div className="glass-strong rounded-[16px] p-4 card-hover-premium group">
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-[14px] font-extrabold transition-transform duration-300 group-hover:scale-105"
          style={{ background: `${status.text}15`, color: status.text }}>
          {initials(s)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-[var(--text)] truncate">{fullName(s)}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: status.bg, color: status.text }}>
              {status.label}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--text-muted)]">
            {s.login_code || s.loginCode ? (
              <span className="font-mono flex items-center gap-1">
                <KeyRound size={10} /> {s.login_code || s.loginCode}
              </span>
            ) : null}
            {s.phone && <span>{s.phone}</span>}
            {s.coins != null && s.coins > 0 && (
              <span className="flex items-center gap-1 text-[var(--green)] font-semibold">
                <Coins size={10} /> {s.coins}
              </span>
            )}
          </div>

          {groupNames.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {groupNames.map((name, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-[var(--green-bg)] text-[var(--green)]">
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-all" title="Сбросить пароль" onClick={() => onRegen(s)}>
            <KeyRound size={14} />
          </button>
          <button className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)] transition-all"
            title={s.status === 'frozen' ? 'Разморозить' : 'Заморозить'} onClick={() => onFreeze(s)}>
            {s.status === 'frozen' ? <Sun size={14} /> : <Snowflake size={14} />}
          </button>
          <button className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)] transition-all" title="Удалить" onClick={() => onDelete(s)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ Main Students ═══════════════ */
export default function AdminStudents() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'frozen'
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const { data, isLoading, error, refetch } = useAdminStudents(qs);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [creds, setCreds] = useState(null);
  const [copied, setCopied] = useState('');

  const raw = data?.data || data || {};
  const rows = raw.students || (Array.isArray(raw) ? raw : []);

  const activeCount = rows.filter((s) => s.status !== 'frozen').length;
  const frozenCount = rows.filter((s) => s.status === 'frozen').length;
  const filteredRows = statusFilter === 'all' ? rows : rows.filter(s => s.status === statusFilter);

  const create = async () => {
    setBusy(true); setErr('');
    try {
      const res = await api.adminCreateStudent(token, {
        firstName: form.firstName, lastName: form.lastName,
        phone: form.phone || undefined, parentPhone: form.parentPhone || undefined,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
        coins: form.coins ? Number(form.coins) : undefined,
      });
      const r = res?.data || res;
      setForm(null);
      setCreds({ login_code: r.login_code || r.loginCode || r.student?.login_code, password: r.password });
      refetch();
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  const toggleFreeze = async (s) => {
    const frozen = s.status === 'frozen';
    try { await api.adminFreezeStudent(token, s.id, !frozen, ''); refetch(); }
    catch (e) { alert(e.message || 'Ошибка'); }
  };
  const del = async (s) => {
    if (!confirm(`Удалить студента ${fullName(s)}?`)) return;
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
        <button className="btn btn-primary btn-sm gap-1" onClick={() => { setForm(emptyForm); setErr(''); }}>
          <Plus size={16} /> Добавить студента
        </button>
      </PageHeader>

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard Icon={GraduationCap} label="Всего" value={rows.length} color="#3B82F6" gradient="linear-gradient(135deg,#3B82F6,#2980B9)" delay="stagger-1" />
        <StatCard Icon={UserCheck} label="Активные" value={activeCount} color="#2ECC71" gradient="linear-gradient(135deg,#2ECC71,#27AE60)" delay="stagger-2" />
        <StatCard Icon={UserX} label="Заморожены" value={frozenCount} color="#E8543E" gradient="linear-gradient(135deg,#E8543E,#C0392B)" delay="stagger-3" />
      </div>

      {/* ═══ Search + View Toggle ═══ */}
      <div className="flex items-center gap-3 animate-fade-in stagger-3">
        <div className="glass-strong rounded-[16px] p-1 flex-1">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <Search size={16} className="text-[var(--text-muted)] shrink-0" />
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)]"
              placeholder="Поиск по имени, фамилии или телефону…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        {/* Status filter tabs */}
        <div className="hidden sm:flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {[
            { key: 'all', label: 'Все', count: rows.length },
            { key: 'active', label: 'Активные', count: activeCount },
            { key: 'frozen', label: 'Заморожены', count: frozenCount },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200"
              style={{
                background: statusFilter === f.key ? 'var(--green-bg)' : 'transparent',
                color: statusFilter === f.key ? 'var(--green)' : 'var(--text-muted)',
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        {/* View toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <button
            onClick={() => setViewMode('card')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: viewMode === 'card' ? 'var(--green-bg)' : 'transparent', color: viewMode === 'card' ? 'var(--green)' : 'var(--text-muted)' }}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{ background: viewMode === 'table' ? 'var(--green-bg)' : 'transparent', color: viewMode === 'table' ? 'var(--green)' : 'var(--text-muted)' }}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* ═══ Student List ═══ */}
      {isLoading ? (
        <div className="mt-4"><SkeletonTable cols={5} /></div>
      ) : error ? (
        <div className="alert alert-error mt-4">Ошибка загрузки: {error.message}</div>
      ) : filteredRows.length === 0 ? (
        <div className="glass-strong rounded-[20px] p-12 text-center animate-fade-in">
          <GraduationCap size={48} className="mx-auto mb-4 text-[var(--text-muted)] opacity-20" />
          <p className="text-[15px] font-bold text-[var(--text-secondary)]">Нет студентов</p>
          <p className="text-[12px] text-[var(--text-muted)] mt-1.5">
            {search ? 'Попробуйте изменить запрос' : 'Добавьте первого студента'}
          </p>
          {!search && (
            <button className="btn btn-primary btn-sm mt-4 gap-1" onClick={() => { setForm(emptyForm); setErr(''); }}>
              <Plus size={14} /> Добавить
            </button>
          )}
        </div>
      ) : viewMode === 'card' ? (
        /* Card view */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRows.map((s) => (
            <StudentCard key={s.id} s={s} onFreeze={toggleFreeze} onDelete={del} onRegen={regen} />
          ))}
        </div>
      ) : (
        /* Table view */
        <div className="glass-strong rounded-[16px] overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="table w-full text-[13px]">
              <thead>
                <tr>
                  <th>Студент</th>
                  <th>Код</th>
                  <th>Телефон</th>
                  <th>Группы</th>
                  <th>Коины</th>
                  <th>Статус</th>
                  <th className="w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(s => (
                  <tr key={s.id} className="hover:bg-[var(--surface-hover)]">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ background: `${(STATUS_COLORS[s.status] || STATUS_COLORS.active).text}15`, color: (STATUS_COLORS[s.status] || STATUS_COLORS.active).text }}>
                          {initials(s)}
                        </div>
                        <span className="font-semibold text-[var(--text)]">{fullName(s)}</span>
                      </div>
                    </td>
                    <td className="font-mono text-[var(--text-secondary)]">{s.login_code || s.loginCode || '—'}</td>
                    <td className="text-[var(--text-muted)]">{s.phone || '—'}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {(s.groups || []).slice(0, 2).map((g, i) => (
                          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--green-bg)] text-[var(--green)]">
                            {g.name}
                          </span>
                        ))}
                        {(s.groups || []).length > 2 && (
                          <span className="text-[9px] text-[var(--text-muted)]">+{(s.groups || []).length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {s.coins != null && s.coins > 0 ? (
                        <span className="flex items-center gap-1 text-[var(--green)] font-semibold text-[12px]">
                          <Coins size={11} /> {s.coins}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: (STATUS_COLORS[s.status] || STATUS_COLORS.active).bg, color: (STATUS_COLORS[s.status] || STATUS_COLORS.active).text }}>
                        {(STATUS_COLORS[s.status] || STATUS_COLORS.active).label}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-all" title="Сбросить пароль" onClick={() => onRegen(s)}>
                          <KeyRound size={12} />
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text)] transition-all"
                          title={s.status === 'frozen' ? 'Разморозить' : 'Заморозить'} onClick={() => onFreeze(s)}>
                          {s.status === 'frozen' ? <Sun size={12} /> : <Snowflake size={12} />}
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)] transition-all" title="Удалить" onClick={() => onDelete(s)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
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
          <div className="modal-box glass-strong border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-4">Новый студент</h3>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input className="input input-bordered w-full" placeholder="Имя" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                <input className="input input-bordered w-full" placeholder="Фамилия" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="input input-bordered w-full" type="number" placeholder="Возраст" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} />
                <select className="select select-bordered w-full" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </div>
              <input className="input input-bordered w-full" placeholder="Телефон студента" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="input input-bordered w-full" placeholder="Телефон родителя (необязательно)" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Коины</label>
                  <input className="input input-bordered w-full" type="number" min="0" value={form.coins} onChange={(e) => setForm({ ...form, coins: Number(e.target.value) })} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-sm" checked={form.frozen} onChange={(e) => setForm({ ...form, frozen: e.target.checked })} />
                    <span className="text-[13px] text-[var(--text)]">Заморожен</span>
                  </label>
                </div>
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

      {/* ═══ Credentials Modal ═══ */}
      {creds && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-2">Данные для входа</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">Передайте студенту. Пароль показывается один раз.</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-[12px] bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[13px] text-[var(--text-secondary)]">Логин-код</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[14px]">{creds.login_code || '—'}</span>
                  {creds.login_code && (
                    <button className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[var(--green-bg)] transition-colors"
                      onClick={() => copyToClipboard(creds.login_code, 'login')}>
                      {copied === 'login' ? <Check size={12} className="text-[var(--green)]" /> : <Copy size={12} className="text-[var(--text-muted)]" />}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[12px] bg-[var(--surface)] border border-[var(--border)]">
                <span className="text-[13px] text-[var(--text-secondary)]">Пароль</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[14px]">{creds.password || '—'}</span>
                  {creds.password && (
                    <button className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[var(--green-bg)] transition-colors"
                      onClick={() => copyToClipboard(creds.password, 'pass')}>
                      {copied === 'pass' ? <Check size={12} className="text-[var(--green)]" /> : <Copy size={12} className="text-[var(--text-muted)]" />}
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
