import { useState } from 'react';
import { Plus, Snowflake, Sun, Trash2, KeyRound, Search } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminStudents } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const fullName = (s) =>
  s.fullName || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ') || '—';

const emptyForm = { firstName: '', lastName: '', phone: '', parentPhone: '' };

export default function AdminStudents() {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const { data, isLoading, error, refetch } = useAdminStudents(qs);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [creds, setCreds] = useState(null); // { login_code, password }

  const raw = data?.data || data || {};
  const rows = raw.students || (Array.isArray(raw) ? raw : []);

  const create = async () => {
    setBusy(true); setErr('');
    try {
      const res = await api.adminCreateStudent(token, {
        firstName: form.firstName, lastName: form.lastName,
        phone: form.phone || undefined, parentPhone: form.parentPhone || undefined,
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

  return (
    <div>
      <PageHeader title="Студенты" subtitle="Учёт студентов филиала">
        <button className="btn btn-primary btn-sm gap-1" onClick={() => { setForm(emptyForm); setErr(''); }}>
          <Plus size={16} /> Добавить студента
        </button>
      </PageHeader>

      <label className="input input-bordered flex items-center gap-2 mt-6 max-w-sm">
        <Search size={16} className="opacity-50" />
        <input type="text" className="grow" placeholder="Поиск по имени…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </label>

      {isLoading ? (
        <div className="mt-4"><SkeletonTable cols={5} /></div>
      ) : error ? (
        <div className="alert alert-error mt-4">Ошибка загрузки: {error.message}</div>
      ) : (
        <div className="card bg-base-100 mt-4">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Имя</th><th>Логин-код</th><th>Телефон</th><th>Группы</th><th>Статус</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={6} className="text-center text-base-content/40 py-8">Нет студентов</td></tr>}
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td className="font-medium">{fullName(s)}</td>
                      <td className="font-mono text-xs">{s.login_code || s.loginCode || '—'}</td>
                      <td className="text-sm">{s.phone || '—'}</td>
                      <td className="text-sm">{(s.groups || []).map((g) => g.name).join(', ') || '—'}</td>
                      <td>
                        <span className={`badge badge-sm ${s.status === 'frozen' ? 'badge-error' : 'badge-success'}`}>
                          {s.status === 'frozen' ? 'Заморожен' : 'Активен'}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <button className="btn btn-ghost btn-xs" title="Сбросить пароль" onClick={() => regen(s)}><KeyRound size={15} /></button>
                        <button className="btn btn-ghost btn-xs" title={s.status === 'frozen' ? 'Разморозить' : 'Заморозить'} onClick={() => toggleFreeze(s)}>
                          {s.status === 'frozen' ? <Sun size={15} /> : <Snowflake size={15} />}
                        </button>
                        <button className="btn btn-ghost btn-xs text-error" title="Удалить" onClick={() => del(s)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {form && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Новый студент</h3>
            {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
            <div className="space-y-3">
              <input className="input input-bordered w-full" placeholder="Имя" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              <input className="input input-bordered w-full" placeholder="Фамилия" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              <input className="input input-bordered w-full" placeholder="Телефон студента" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className="input input-bordered w-full" placeholder="Телефон родителя (необязательно)" value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
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

      {creds && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-2">Данные для входа</h3>
            <p className="text-sm text-base-content/60 mb-4">Передайте студенту. Пароль показывается один раз.</p>
            <div className="space-y-2">
              <div className="flex justify-between p-3 rounded-xl bg-base-200"><span>Логин-код</span><span className="font-mono font-bold">{creds.login_code || '—'}</span></div>
              <div className="flex justify-between p-3 rounded-xl bg-base-200"><span>Пароль</span><span className="font-mono font-bold">{creds.password || '—'}</span></div>
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
