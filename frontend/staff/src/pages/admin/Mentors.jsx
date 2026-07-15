import { useState } from 'react';
import { Plus, Snowflake, Sun, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminMentors } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const fullName = (m) =>
  [m.firstName || m.first_name, m.lastName || m.last_name].filter(Boolean).join(' ') || '—';

const emptyForm = { id: null, firstName: '', lastName: '', phone: '', email: '' };

export default function AdminMentors() {
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminMentors();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const raw = data?.data || data || {};
  const rows = raw.mentors || (Array.isArray(raw) ? raw : []);

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

  const toggleFreeze = async (m) => {
    try { await api.adminFreezeMentor(token, m.id, m.status !== 'frozen'); refetch(); }
    catch (e) { alert(e.message || 'Ошибка'); }
  };
  const del = async (m) => {
    if (!confirm(`Удалить ментора ${fullName(m)}?`)) return;
    try { await api.adminDeleteMentor(token, m.id); refetch(); }
    catch (e) { alert(e.message || 'Нельзя удалить (ведёт группу)?'); }
  };
  const edit = (m) => setForm({ id: m.id, firstName: m.firstName || m.first_name || '', lastName: m.lastName || m.last_name || '', phone: m.phone || '', email: m.email || '' });

  return (
    <div>
      <PageHeader title="Менторы" subtitle="Преподаватели филиала">
        <button className="btn btn-primary btn-sm gap-1" onClick={() => { setForm(emptyForm); setErr(''); }}>
          <Plus size={16} /> Добавить ментора
        </button>
      </PageHeader>

      {isLoading ? (
        <div className="mt-6"><SkeletonTable cols={4} /></div>
      ) : error ? (
        <div className="alert alert-error mt-6">Ошибка загрузки: {error.message}</div>
      ) : (
        <div className="card bg-base-100 mt-6">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr><th>Имя</th><th>Email</th><th>Телефон</th><th>Статус</th><th></th></tr>
                </thead>
                <tbody>
                  {rows.length === 0 && <tr><td colSpan={5} className="text-center text-base-content/40 py-8">Нет менторов</td></tr>}
                  {rows.map((m) => (
                    <tr key={m.id}>
                      <td className="font-medium">{fullName(m)}</td>
                      <td className="text-sm">{m.email || '—'}</td>
                      <td className="text-sm">{m.phone || '—'}</td>
                      <td>
                        <span className={`badge badge-sm ${m.status === 'frozen' ? 'badge-error' : 'badge-success'}`}>
                          {m.status === 'frozen' ? 'Заморожен' : 'Активен'}
                        </span>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <button className="btn btn-ghost btn-xs" title="Изменить" onClick={() => edit(m)}><Pencil size={15} /></button>
                        <button className="btn btn-ghost btn-xs" title={m.status === 'frozen' ? 'Разморозить' : 'Заморозить'} onClick={() => toggleFreeze(m)}>
                          {m.status === 'frozen' ? <Sun size={15} /> : <Snowflake size={15} />}
                        </button>
                        <button className="btn btn-ghost btn-xs text-error" title="Удалить" onClick={() => del(m)}><Trash2 size={15} /></button>
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
