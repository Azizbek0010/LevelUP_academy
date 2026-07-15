import { useState } from 'react';
import { api } from '../../api.js';
import { useAuth } from '../../auth.jsx';

function splitName(full = '') {
  const parts = full.trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
}

export default function OnboardModal({ lead, onClose, onDone }) {
  const { token } = useAuth();
  const pre = lead ? splitName(lead.name) : { firstName: '', lastName: '' };
  const [form, setForm] = useState({
    organizationName: lead?.centerName || '',
    domain: '',
    firstName: pre.firstName,
    lastName: pre.lastName,
    email: '',
    phone: lead?.phone?.replace(/[^\d+]/g, '') || '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const body = {
        organizationName: form.organizationName.trim(),
        admin: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
        },
      };
      if (form.domain.trim()) body.domain = form.domain.trim();
      if (form.phone.trim()) body.admin.phone = form.phone.trim();
      if (lead?.id) body.leadId = lead.id;
      const res = await api.mainOnboardPartner(token, body);
      setDone(res);
    } catch (err) {
      if (err.status === 409) setError('Домен или email уже заняты');
      else if (err.status === 422) setError('Проверьте поля: домен вида name.uz, email корректный');
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        {done ? (
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-success">Партнёр создан ✓</h3>
            <p className="text-sm opacity-70">
              Организация <b>{done.organization?.name}</b> и её Super Admin заведены.
            </p>
            <div className="bg-base-200 rounded-lg p-3 text-sm space-y-1">
              <div><span className="opacity-60">Логин:</span> <b>{done.superadmin?.email}</b></div>
              <div className="flex items-center gap-2">
                <span className="opacity-60">Пароль:</span>
                <code className="font-mono font-bold">{done.tempPassword}</code>
                <button className="btn btn-xs" onClick={() => navigator.clipboard?.writeText(done.tempPassword)}>
                  копировать
                </button>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-primary" onClick={() => onDone?.()}>Готово</button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <h3 className="font-bold text-lg">
              Онбординг партнёра {lead && <span className="text-sm font-normal opacity-60">из заявки</span>}
            </h3>
            {error && <div className="alert alert-error text-sm py-2"><span>{error}</span></div>}

            <label className="form-control">
              <span className="label-text mb-1">Учебный центр *</span>
              <input className="input input-bordered" required value={form.organizationName} onChange={set('organizationName')} placeholder="Mars IT School" />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Домен (необязательно)</span>
              <input className="input input-bordered" value={form.domain} onChange={set('domain')} placeholder="mars-school.uz" />
            </label>
            <div className="divider text-xs opacity-50 my-1">Super Admin (владелец центра)</div>
            <div className="grid grid-cols-2 gap-3">
              <label className="form-control">
                <span className="label-text mb-1">Имя *</span>
                <input className="input input-bordered" required value={form.firstName} onChange={set('firstName')} />
              </label>
              <label className="form-control">
                <span className="label-text mb-1">Фамилия *</span>
                <input className="input input-bordered" required value={form.lastName} onChange={set('lastName')} />
              </label>
            </div>
            <label className="form-control">
              <span className="label-text mb-1">Email (логин) *</span>
              <input type="email" className="input input-bordered" required value={form.email} onChange={set('email')} placeholder="owner@mars-school.uz" />
            </label>
            <label className="form-control">
              <span className="label-text mb-1">Телефон (необязательно)</span>
              <input className="input input-bordered" value={form.phone} onChange={set('phone')} placeholder="+998901234567" />
            </label>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={onClose}>Отмена</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? <span className="loading loading-spinner loading-sm" /> : 'Создать партнёра'}
              </button>
            </div>
          </form>
        )}
      </div>
      <label className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
