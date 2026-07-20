import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Save, X, Loader2, Coins, Wallet, Users, CalendarDays,
  KeyRound, Phone, Mail, Snowflake, Sun, Trash2, Copy, Check, CreditCard,
  Clock, AlertCircle, User, GraduationCap, Shield, Hash, CoinsIcon,
} from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminStudentDetail } from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Avatar, RowSkeleton } from '../mentor/_ui.jsx';

/* ─── helpers ─── */
const fullName = (s) =>
  s.fullName || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ') || '—';
const formatMoney = (n) =>
  n != null ? n.toLocaleString('ru-RU') + ' UZS' : '—';
const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
};
const PAYMENT_TYPE_LABELS = { cash: 'Нақт', card: 'Карта', transfer: 'Перечисление' };
const PAYMENT_STATUS_LABELS = { paid: 'Оплачен', pending: 'Ожидание', overdue: 'Просрочен', cancelled: 'Отменён' };
const PAYMENT_STATUS_COLORS = {
  paid: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
};

/* ═══════════════ Main StudentDetail ═══════════════ */
export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminStudentDetail(id);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState('');
  const [busy, setBusy] = useState(false);

  const raw = data?.data || data || {};
  const student = raw.student || raw;
  const groups = student.groups || [];
  const payments = student.payments || [];

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const startEdit = () => {
    setForm({
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      phone: student.phone || '',
      parentPhone: student.parentPhone || '',
      age: student.age || '',
      gender: student.gender || 'male',
    });
    setEditing(true);
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.adminUpdateStudent(token, id, {
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || undefined,
        parentPhone: form.parentPhone || undefined,
        age: form.age ? Number(form.age) : undefined,
        gender: form.gender || undefined,
      });
      setEditing(false);
      refetch();
    } catch (e) {
      alert(e.message || 'Xatolik');
    } finally {
      setSaving(false);
    }
  };

  const toggleFreeze = async () => {
    const frozen = student.status === 'frozen';
    setBusy(true);
    try {
      await api.adminFreezeStudent(token, id, !frozen, '');
      refetch();
    } catch (e) {
      alert(e.message || 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`O'chirishni xohlaysizmi: ${fullName(student)}?`)) return;
    setBusy(true);
    try {
      await api.adminDeleteStudent(token, id);
      navigate('/students');
    } catch (e) {
      alert(e.message || 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  const handleRegen = async () => {
    setBusy(true);
    try {
      const res = await api.adminRegenStudentPassword(token, id);
      const r = res?.data || res;
      alert(`Yangi parol: ${r.password || r.loginCode || 'generate qilindi'}`);
      refetch();
    } catch (e) {
      alert(e.message || 'Xatolik');
    } finally {
      setBusy(false);
    }
  };

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div>
        <PageHeader title="Talaba" />
        <div className="mt-6"><RowSkeleton count={2} /></div>
      </div>
    );
  }

  /* ─── Error ─── */
  if (error) {
    return (
      <div>
        <PageHeader title="Talaba" />
        <div className="glass-strong rounded-[16px] p-8 text-center">
          <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
          <p className="text-[14px] font-bold text-[var(--text)]">Xatolik yuz berdi</p>
          <p className="text-[12px] text-[var(--text-muted)] mt-1">{error.message}</p>
          <Link to="/students" className="btn btn-primary btn-sm mt-4">
            <ArrowLeft size={14} /> Ortga
          </Link>
        </div>
      </div>
    );
  }

  if (!student || !student.id) {
    return (
      <div>
        <PageHeader title="Talaba" />
        <div className="glass-strong rounded-[16px] p-8 text-center">
          <User size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-[14px] font-bold text-[var(--text)]">Talaba topilmadi</p>
          <Link to="/students" className="btn btn-primary btn-sm mt-4">
            <ArrowLeft size={14} /> Ortga
          </Link>
        </div>
      </div>
    );
  }

  const isActive = student.status === 'active';

  return (
    <div className="space-y-5 pb-8">
      {/* Back link */}
      <Link
        to="/students"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--green)] transition-colors animate-fade-in"
      >
        <ArrowLeft size={16} /> Talabalarga
      </Link>

      {/* Header */}
      <PageHeader
        title={fullName(student)}
        subtitle={student.groupName ? `Guruh: ${student.groupName}` : undefined}
      >
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm gap-1"
            onClick={startEdit}
            disabled={busy}
          >
            <Edit3 size={14} /> Tahrirlash
          </button>
          <button
            className={`btn btn-sm gap-1 ${isActive ? 'btn-warning' : 'btn-success'}`}
            onClick={toggleFreeze}
            disabled={busy}
          >
            {busy ? <Loader2 size={14} className="animate-spin" /> : isActive ? <Snowflake size={14} /> : <Sun size={14} />}
            {isActive ? 'Muzlatish' : 'Tiklash'}
          </button>
          <button
            className="btn btn-ghost btn-sm gap-1 text-red-500 hover:bg-red-50"
            onClick={handleDelete}
            disabled={busy}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </PageHeader>

      {/* ═══ Stats Bar ═══ */}
      <div className="glass-strong rounded-[16px] p-5 animate-fade-in stagger-1">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${
              isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}>
              {isActive ? <User size={18} /> : <Snowflake size={18} />}
            </div>
            <div>
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Holat</div>
              <div className={`text-[14px] font-extrabold ${isActive ? 'text-emerald-600' : 'text-red-500'}`}>
                {isActive ? 'Aktiv' : 'Muzlatilgan'}
              </div>
            </div>
          </div>

          {/* Coins */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-[var(--green-bg)] text-[var(--green)]">
              <Coins size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Koinlar</div>
              <div className="text-[14px] font-extrabold text-[var(--text)] tabular-nums">
                {student.coins ?? 0}
              </div>
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-amber-50 text-amber-600">
              <Wallet size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Balans</div>
              <div className="text-[14px] font-extrabold text-[var(--text)] tabular-nums">
                {formatMoney(student.balance)}
              </div>
            </div>
          </div>

          {/* Groups count */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-blue-50 text-blue-600">
              <Users size={18} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Guruhlar</div>
              <div className="text-[14px] font-extrabold text-[var(--text)] tabular-nums">
                {groups.length || (student.groupName ? 1 : 0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Personal Info Card ═══ */}
      <div className="glass-strong rounded-[16px] p-5 animate-fade-in stagger-2">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-[var(--green)]" />
          <h3 className="text-[14px] font-bold text-[var(--text)]">Shaxsiy ma'lumotlar</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4 p-4 rounded-[12px] bg-[var(--surface)] border border-[var(--border)]">
            <Avatar name={fullName(student)} size="lg" />
            <div className="min-w-0">
              <p className="text-[16px] font-extrabold text-[var(--text)] truncate">{fullName(student)}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                }`}>
                  {isActive ? 'Aktiv' : 'Muzlatilgan'}
                </span>
                {student.gender && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {student.gender === 'male' ? 'Erkak' : 'Ayol'}
                  </span>
                )}
                {student.age && (
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {student.age} yosh
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            {/* Phone */}
            <div className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="text-[var(--text-muted)]" />
                <div>
                  <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Telefon</div>
                  <div className="text-[13px] font-semibold text-[var(--text)]">{student.phone || "Ko'rsatilmagan"}</div>
                </div>
              </div>
              {student.phone && (
                <button
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[var(--green-bg)] transition-colors"
                  onClick={() => copyToClipboard(student.phone, 'phone')}
                >
                  {copied === 'phone' ? <Check size={12} className="text-[var(--green)]" /> : <Copy size={12} className="text-[var(--text-muted)]" />}
                </button>
              )}
            </div>

            {/* Login Code */}
            <div className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--surface)] border border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <Hash size={14} className="text-[var(--text-muted)]" />
                <div>
                  <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Login-kod</div>
                  <div className="text-[13px] font-mono font-bold text-[var(--text)]">
                    {student.login_code || student.loginCode || "Yo'q"}
                  </div>
                </div>
              </div>
              {(student.login_code || student.loginCode) && (
                <button
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[var(--green-bg)] transition-colors"
                  onClick={() => copyToClipboard(student.login_code || student.loginCode, 'login')}
                >
                  {copied === 'login' ? <Check size={12} className="text-[var(--green)]" /> : <Copy size={12} className="text-[var(--text-muted)]" />}
                </button>
              )}
            </div>

            {/* Parent Phone */}
            {student.parentPhone && (
              <div className="flex items-center justify-between p-3 rounded-[10px] bg-[var(--surface)] border border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <Phone size={14} className="text-[var(--text-muted)]" />
                  <div>
                    <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Ota-ona telefoni</div>
                    <div className="text-[13px] font-semibold text-[var(--text)]">{student.parentPhone}</div>
                  </div>
                </div>
                <button
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-[var(--green-bg)] transition-colors"
                  onClick={() => copyToClipboard(student.parentPhone, 'parent')}
                >
                  {copied === 'parent' ? <Check size={12} className="text-[var(--green)]" /> : <Copy size={12} className="text-[var(--text-muted)]" />}
                </button>
              </div>
            )}

            {/* Created At */}
            <div className="flex items-center gap-2.5 p-3 rounded-[10px] bg-[var(--surface)] border border-[var(--border)]">
              <CalendarDays size={14} className="text-[var(--text-muted)]" />
              <div>
                <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Qo'shilgan sana</div>
                <div className="text-[13px] font-semibold text-[var(--text)]">{formatDate(student.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Groups Section ═══ */}
      <div className="glass-strong rounded-[16px] p-5 animate-fade-in stagger-3">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap size={16} className="text-[var(--green)]" />
          <h3 className="text-[14px] font-bold text-[var(--text)]">Guruhlar</h3>
          <span className="text-[12px] text-[var(--text-muted)] ml-auto">
            {groups.length || (student.groupName ? 1 : 0)} ta
          </span>
        </div>

        {groups.length === 0 && !student.groupName ? (
          <div className="text-center py-8">
            <Users size={32} className="mx-auto mb-2 text-[var(--text-muted)] opacity-30" />
            <p className="text-[13px] text-[var(--text-muted)]">Guruhga biriktirilmagan</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Mock groups from student data */}
            {(groups.length > 0 ? groups : [{ id: 'g1', name: student.groupName, subject: '—' }]).map((g) => (
              <div key={g.id} className="flex items-center gap-3 p-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--green)] transition-all">
                <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-[var(--green-bg)] text-[var(--green)]">
                  <GraduationCap size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-[var(--text)] block truncate">{g.name}</span>
                  <span className="text-[11px] text-[var(--text-muted)]">{g.subject}</span>
                </div>
                <Link
                  to={`/groups/${g.id}`}
                  className="text-[11px] font-semibold text-[var(--green)] hover:underline"
                >
                  Ko'rish
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ Payments Section ═══ */}
      <div className="glass-strong rounded-[16px] p-5 animate-fade-in stagger-4">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={16} className="text-[var(--green)]" />
          <h3 className="text-[14px] font-bold text-[var(--text)]">To'lovlar tarixi</h3>
          <span className="text-[12px] text-[var(--text-muted)] ml-auto">
            {payments.length} ta
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard size={32} className="mx-auto mb-2 text-[var(--text-muted)] opacity-30" />
            <p className="text-[13px] text-[var(--text-muted)]">To'lovlar mavjud emas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full text-[13px]">
              <thead>
                <tr>
                  <th className="text-[var(--text-secondary)]">Sana</th>
                  <th className="text-[var(--text-secondary)]">Summa</th>
                  <th className="text-[var(--text-secondary)]">Usul</th>
                  <th className="text-[var(--text-secondary)]">Holat</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[var(--surface-hover)]">
                    <td className="font-semibold text-[var(--text)]">{formatDate(p.date)}</td>
                    <td className="font-bold text-[var(--text)] tabular-nums">{formatMoney(p.amount)}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 text-[var(--text-secondary)]">
                        <CreditCard size={11} />
                        {PAYMENT_TYPE_LABELS[p.type] || p.type}
                      </span>
                    </td>
                    <td>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PAYMENT_STATUS_COLORS[p.status] || 'bg-gray-100 text-gray-500'}`}>
                        {PAYMENT_STATUS_LABELS[p.status] || p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Total */}
        {payments.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--border)] flex items-center justify-between">
            <span className="text-[12px] font-bold text-[var(--text-secondary)]">Jami to'langan</span>
            <span className="text-[14px] font-extrabold text-[var(--green)] tabular-nums">
              {formatMoney(payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0))}
            </span>
          </div>
        )}
      </div>

      {/* ═══ Quick Actions ═══ */}
      <div className="glass-strong rounded-[16px] p-5 animate-fade-in stagger-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-[var(--green)]" />
          <h3 className="text-[14px] font-bold text-[var(--text)]">Tezkor amallar</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <button
            className="flex items-center gap-3 p-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--green)] hover:shadow-sm transition-all text-left group"
            onClick={handleRegen}
            disabled={busy}
          >
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform">
              <KeyRound size={16} />
            </div>
            <div>
              <div className="text-[12px] font-bold text-[var(--text)]">Parolni yangilash</div>
              <div className="text-[10px] text-[var(--text-muted)]">Yangi login-kod</div>
            </div>
          </button>

          <button
            className="flex items-center gap-3 p-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--green)] hover:shadow-sm transition-all text-left group"
            onClick={toggleFreeze}
            disabled={busy}
          >
            <div className={`w-9 h-9 rounded-[10px] flex items-center justify-center group-hover:scale-105 transition-transform ${
              isActive ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {isActive ? <Snowflake size={16} /> : <Sun size={16} />}
            </div>
            <div>
              <div className="text-[12px] font-bold text-[var(--text)]">
                {isActive ? 'Muzlatish' : 'Tiklash'}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {isActive ? 'Kirishni cheklash' : 'Kirishni tiklash'}
              </div>
            </div>
          </button>

          <button
            className="flex items-center gap-3 p-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] hover:border-red-300 hover:bg-red-50 transition-all text-left group"
            onClick={handleDelete}
            disabled={busy}
          >
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-red-50 text-red-500 group-hover:scale-105 transition-transform">
              <Trash2 size={16} />
            </div>
            <div>
              <div className="text-[12px] font-bold text-[var(--text)]">O'chirish</div>
              <div className="text-[10px] text-[var(--text-muted)]">Butunlay o'chirish</div>
            </div>
          </button>
        </div>
      </div>

      {/* ═══ Edit Modal ═══ */}
      {editing && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-4">Talabani tahrirlash</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Ism</label>
                  <input
                    className="input input-bordered w-full"
                    placeholder="Ism"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Familiya</label>
                  <input
                    className="input input-bordered w-full"
                    placeholder="Familiya"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Telefon</label>
                <input
                  className="input input-bordered w-full"
                  placeholder="+998 XX XXX XX XX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Ota-ona telefoni</label>
                <input
                  className="input input-bordered w-full"
                  placeholder="+998 XX XXX XX XX"
                  value={form.parentPhone}
                  onChange={(e) => setForm({ ...form, parentPhone: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Yosh</label>
                  <input
                    className="input input-bordered w-full"
                    type="number"
                    min="5"
                    max="100"
                    placeholder="Yosh"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1 block">Jins</label>
                  <select
                    className="select select-bordered w-full"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="male">Erkak</option>
                    <option value="female">Ayol</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setEditing(false)} disabled={saving}>Bekor qilish</button>
              <button
                className="btn btn-primary gap-1"
                onClick={saveEdit}
                disabled={saving || !form.firstName || !form.lastName}
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Saqlash
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setEditing(false)} />
        </dialog>
      )}
    </div>
  );
}
