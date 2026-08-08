import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  ArrowLeft, Edit3, Save, Loader2, Coins, CalendarDays,
  KeyRound, Phone, Snowflake, Sun, Archive, Copy, Check, CreditCard,
  AlertCircle, User, GraduationCap, QrCode, Send, MessageSquare, Gift,
  UserX, Plus, Wallet, Users, RefreshCw,
} from 'lucide-react';

// Ссылка на member-app для QR-входа студента (сканирует камерой — сразу
// логинится, см. backend/src/modules/auth/qr-login.service.js). VITE_MEMBER_URL
// в frontend/staff/.env (не в репозитории, dev-only) переопределяет на LAN IP,
// чтобы камера телефона доставала до dev-сервера — см. .env.example.
// Фолбэк — прод-домен: на Vercel сборке этот VITE_MEMBER_URL сегодня не задан
// (нет доступа к дашборду Vercel из агента), а localhost в проде был бы 100%
// нерабочей ссылкой.
const MEMBER_URL = import.meta.env.VITE_MEMBER_URL || 'https://member.levelup-academy.uz';
import { useAuth } from '../../auth.jsx';
import { useAdminStudentDetail, useAdminGroups, useAdminGroupDetail, useAdminInvoices, useAdminStudentAttendance, useAdminStudentTelegram, useAdminStudentCredentials, useInvalidate } from '../../queries.js';
import { api } from '../../api.js';
import PhoneInput from '../../components/PhoneInput.jsx';
import { Avatar, RowSkeleton, Modal } from '../mentor/_ui.jsx';
import { formatPhone } from '../../format.js';

/* ─── helpers ─── */
const fullName = (s) =>
  s.fullName || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ') || '—';
const formatMoney = (n) => (n != null ? Number(n).toLocaleString('ru-RU') + ' сум' : '—');
const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};
const DAY_LABELS = { mon: 'Пн', tue: 'Вт', wed: 'Ср', thu: 'Чт', fri: 'Пт', sat: 'Сб', sun: 'Вс' };
const METHOD_LABELS = {
  cash: 'Наличные', humo: 'Humo', uzcard: 'Uzcard', uzum: 'Uzum',
  payme: 'Payme', click: 'Click', bank_transfer: 'Банк. перевод',
};
const INVOICE_STATUS = {
  paid: { label: 'Оплачено', bg: '#2ECC7115', text: '#2ECC71' },
  partially_paid: { label: 'Частично', bg: '#F5A62315', text: '#F5A623' },
  pending: { label: 'Ожидание', bg: '#94A3B815', text: '#64748B' },
  overdue: { label: 'Долг', bg: '#E8543E15', text: '#E8543E' },
  cancelled: { label: 'Отменён', bg: '#94A3B815', text: '#94A3B8' },
};
const monthLabel = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
};
const ATTENDANCE_COLORS = {
  present: { bg: '#2ECC7120', text: '#2ECC71', label: 'Был(а)' },
  late: { bg: '#F5A62320', text: '#F5A623', label: 'Опоздал(а)' },
  absent: { bg: '#E8543E20', text: '#E8543E', label: 'Отсутствовал(а)' },
  excused: { bg: '#94A3B820', text: '#64748B', label: 'Уважительная' },
};
const dayShort = (d) => new Date(d).toLocaleDateString('ru-RU', { day: 'numeric' });
const weekdayShort = (d) => new Date(d).toLocaleDateString('ru-RU', { weekday: 'short' });
const monthInputValue = (d) => {
  const dt = d ? new Date(d) : new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};
const soon = () => alert('Эта функция ещё в разработке');

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
  const [actionModal, setActionModal] = useState(null); // null | 'freeze' | 'archive'
  const [actionReason, setActionReason] = useState('');
  const [showCreds, setShowCreds] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);

  const raw = data?.data || data || {};
  const student = raw.student || raw;
  const groups = student.groups || [];
  const primaryGroup = groups[0];

  const { data: groupDetailRaw } = useAdminGroupDetail(primaryGroup?.id);
  const groupDetail = groupDetailRaw?.data || groupDetailRaw || {};
  const { data: groupsListRaw } = useAdminGroups();
  const groupOptions = (groupsListRaw?.data?.groups || groupsListRaw?.groups || []).filter((g) => !g.isArchived);
  const { data: invoicesRaw, refetch: refetchInvoices } = useAdminInvoices(`?studentId=${id}`);
  const { data: attendanceRaw } = useAdminStudentAttendance(id);
  const attendanceDays = attendanceRaw?.data?.days || attendanceRaw?.days || [];
  const { data: tgRaw } = useAdminStudentTelegram(id);
  const telegram = tgRaw?.data || tgRaw;
  const [showTgMessage, setShowTgMessage] = useState(false);
  const { data: credsRaw, isLoading: credsLoading } = useAdminStudentCredentials(id, showCreds);
  const realCreds = credsRaw?.data || credsRaw;
  const [qrImage, setQrImage] = useState(null);
  const [qrError, setQrError] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);

  // Токен постоянный (users.qr_token) — тот же QR при каждом открытии модалки,
  // пока admin не перевыпустит его явно (см. auth/qr-login.service.js).
  const buildQrImage = (r) => {
    const url = `${MEMBER_URL}/qr-login?token=${encodeURIComponent(r.token)}`;
    return QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: '#1D2417', light: '#ffffff' } });
  };

  useEffect(() => {
    if (!showCreds) { setQrImage(null); setQrError(false); return; }
    let cancelled = false;
    api.adminCreateStudentQrToken(token, id)
      .then((res) => buildQrImage(res?.data || res))
      .then((dataUrl) => { if (!cancelled) setQrImage(dataUrl); })
      .catch(() => { if (!cancelled) setQrError(true); });
    return () => { cancelled = true; };
  }, [showCreds, id, token]);

  const regenerateQr = async () => {
    setQrBusy(true); setQrError(false);
    try {
      const res = await api.adminRegenerateStudentQrToken(token, id);
      setQrImage(await buildQrImage(res?.data || res));
    } catch { setQrError(true); }
    finally { setQrBusy(false); }
  };
  const invalidate = useInvalidate();
  const invoices = (invoicesRaw?.data?.invoices || invoicesRaw?.invoices || []).slice().sort(
    (a, b) => new Date(b.periodMonth || b.createdAt) - new Date(a.periodMonth || a.createdAt)
  );
  const currentMonthKey = monthInputValue(new Date());
  const currentInvoice = invoices.find((inv) => monthInputValue(inv.periodMonth) === currentMonthKey);

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
      birthDate: student.birthDate ? String(student.birthDate).slice(0, 10) : '',
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
        birthDate: form.birthDate || undefined,
      });
      setEditing(false);
      refetch();
    } catch (e) {
      alert(e.message || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const isActive = student.status === 'active';

  const toggleFreeze = () => {
    if (isActive) { setActionReason(''); setActionModal('freeze'); }
    else doFreeze(false, '');
  };
  const doFreeze = async (frozen, reason) => {
    setBusy(true);
    try { await api.adminFreezeStudent(token, id, frozen, reason || ''); refetch(); }
    catch (e) { alert(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };
  const handleDelete = () => { setActionReason(''); setActionModal('archive'); };
  const confirmArchive = async () => {
    setBusy(true);
    try { await api.adminDeleteStudent(token, id, actionReason || ''); navigate('/students'); }
    catch (e) { alert(e.message || 'Ошибка'); }
    finally { setBusy(false); setActionModal(null); }
  };
  const handleRegen = async () => {
    setBusy(true);
    try {
      const res = await api.adminRegenStudentPassword(token, id);
      const r = res?.data || res;
      alert(`Новый пароль: ${r.password || 'сгенерирован'}`);
      refetch();
      invalidate(['admin-student-credentials', id]);
    } catch (e) { alert(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  /* ─── Loading / Error / Not found ─── */
  if (isLoading) return <div><div className="mt-6"><RowSkeleton count={3} /></div></div>;
  if (error) {
    return (
      <div className="card bg-base-100 p-8 text-center">
        <AlertCircle size={40} className="mx-auto mb-3 text-red-400" />
        <p className="text-[14px] font-bold text-base-content">Произошла ошибка</p>
        <p className="text-[12px] text-base-content/45 mt-1">{error.message}</p>
        <Link to="/students" className="btn btn-primary btn-sm mt-4"><ArrowLeft size={14} /> Назад</Link>
      </div>
    );
  }
  if (!student || !student.id) {
    return (
      <div className="card bg-base-100 p-8 text-center">
        <User size={40} className="mx-auto mb-3 text-base-content/45 opacity-30" />
        <p className="text-[14px] font-bold text-base-content">Ученик не найден</p>
        <Link to="/students" className="btn btn-primary btn-sm mt-4"><ArrowLeft size={14} /> Назад</Link>
      </div>
    );
  }

  // «Профиль заполнен» — gender/address/school/hasLaptop подключены к
  // student_profiles 08.08.2026 (миграция 1784340000000, задача #20).
  const profileFields = [
    { key: 'birthDate', label: 'Дата рождения', ok: !!student.birthDate },
    { key: 'phone', label: 'Телефон', ok: !!student.phone },
    { key: 'parent', label: 'Родитель', ok: !!student.parent },
    { key: 'gender', label: 'Пол', ok: !!student.gender },
    { key: 'address', label: 'Адрес', ok: !!student.address },
    { key: 'school', label: 'Школа', ok: !!student.school },
    { key: 'hasLaptop', label: 'Ноутбук', ok: student.hasLaptop === true },
  ];
  const profilePct = Math.round((profileFields.filter((f) => f.ok).length / profileFields.length) * 100);

  return (
    <div className="space-y-4 pb-8">
      <Link to="/students" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-base-content/45 hover:text-primary transition-colors">
        <ArrowLeft size={16} /> К ученикам
      </Link>

      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* ══════════════ КОЛОНКА 1 — карточка студента ══════════════ */}
        <div className="space-y-4 w-full shrink-0" style={{ maxWidth: 380 }}>
          <div className="card bg-base-100 p-5">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-[19px] font-extrabold text-base-content leading-tight">{fullName(student)}</h1>
              <button
                className="w-8 h-8 rounded-[8px] border border-base-300 flex items-center justify-center hover:border-primary hover:text-primary transition-colors shrink-0"
                onClick={() => setShowCreds(true)}
                title="Логин и пароль"
              >
                <QrCode size={15} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                {isActive ? 'Активен' : 'Заморожен'}
              </span>
              <span className="text-[11px] font-mono text-base-content/45">#{student.loginCode || student.login_code || '—'}</span>
              <span className="inline-flex items-center gap-1 text-[11px] text-base-content/45">
                <CalendarDays size={11} /> {formatDate(student.createdAt)}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${student.offerSigned ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-500 border border-red-200'}`}>
                {student.offerSigned ? 'Оферта подписана' : 'Оферта не подписана'}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-base-200/60">
                <span className="text-[11px] font-semibold text-base-content/50 uppercase">Телефон</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-bold text-base-content">{student.phone ? formatPhone(student.phone) : 'Не указан'}</span>
                  {student.phone && (
                    <button onClick={() => copyToClipboard(student.phone, 'phone')} className="text-base-content/45 hover:text-primary">
                      {copied === 'phone' ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-base-200/60">
                <span className="text-[11px] font-semibold text-base-content/50 uppercase">Родитель</span>
                {student.parent ? (
                  <span className="text-[13px] font-bold text-base-content">
                    {[student.parent.firstName, student.parent.lastName].filter(Boolean).join(' ')} · {formatPhone(student.parent.phone)}
                  </span>
                ) : (
                  <span className="text-[12px] text-base-content/40 italic">Не указан</span>
                )}
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-base-200/60">
                <span className="text-[11px] font-semibold text-base-content/50 uppercase">Telegram</span>
                {telegram?.student?.linked ? (
                  <button onClick={() => setShowTgMessage(true)} className="flex items-center gap-1.5 text-[12px] font-bold text-primary hover:underline">
                    <Send size={12} /> {telegram.student.username ? `@${telegram.student.username}` : 'Написать'}
                  </button>
                ) : (
                  <span className="text-[12px] text-base-content/40 italic">Не подключён</span>
                )}
              </div>
            </div>

            {/* Действия */}
            <div className="grid grid-cols-2 gap-1.5 mt-4">
              <button onClick={toggleFreeze} disabled={busy} className="btn btn-sm btn-ghost bg-base-200/60 justify-start gap-1.5 text-[12px]">
                {isActive ? <Snowflake size={13} /> : <Sun size={13} />} {isActive ? 'Заморозить' : 'Разморозить'}
              </button>
              <button onClick={soon} className="btn btn-sm btn-ghost bg-base-200/60 justify-start gap-1.5 text-[12px]">
                <GraduationCap size={13} /> Выпускник
              </button>
              <button onClick={soon} className="btn btn-sm btn-ghost bg-base-200/60 justify-start gap-1.5 text-[12px]">
                <UserX size={13} /> Отчислить
              </button>
              <button onClick={handleRegen} disabled={busy} className="btn btn-sm btn-ghost bg-base-200/60 justify-start gap-1.5 text-[12px]">
                <KeyRound size={13} /> Новый пароль
              </button>
              <button onClick={startEdit} className="btn btn-sm btn-ghost bg-base-200/60 justify-start gap-1.5 text-[12px]">
                <Edit3 size={13} /> Изменить
              </button>
              <button onClick={soon} className="btn btn-sm btn-ghost bg-base-200/60 justify-start gap-1.5 text-[12px]">
                <MessageSquare size={13} /> SMS
              </button>
              <button onClick={soon} className="btn btn-sm btn-ghost bg-base-200/60 justify-start gap-1.5 text-[12px] col-span-2">
                <Gift size={13} /> Реферал
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <button onClick={() => setShowAddGroup(true)} className="btn btn-sm bg-base-200/60 border-0 text-[12px] font-bold">
                {groups.length > 0 ? 'Сменить группу' : 'Добавить в группу'}
              </button>
              <button onClick={() => setShowTopUp(true)} className="btn btn-sm btn-primary gap-1 text-[12px] font-bold">
                <Plus size={13} /> Пополнить счёт
              </button>
            </div>
          </div>

          {/* Профиль заполнен */}
          <div className="card bg-base-100 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-bold text-base-content/60">Профиль заполнен</span>
              <span className="text-[13px] font-extrabold text-primary">{profilePct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-base-200 overflow-hidden mb-3">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${profilePct}%` }} />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {profileFields.map((f) => (
                <span key={f.key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${f.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
                  {f.ok ? '✓' : '×'} {f.label}
                </span>
              ))}
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card bg-base-100 p-4 text-center">
              <div className="text-[18px] font-extrabold text-base-content tabular-nums">{student.coinBalance ?? 0}</div>
              <div className="text-[10px] font-semibold text-base-content/45 uppercase mt-0.5 flex items-center justify-center gap-1"><Coins size={11} /> Коины</div>
            </div>
            <div className="card bg-base-100 p-4 text-center">
              <div className={`text-[18px] font-extrabold tabular-nums ${student.totalDebt > 0 ? 'text-red-500' : 'text-base-content'}`}>{formatMoney(student.totalDebt)}</div>
              <div className="text-[10px] font-semibold text-base-content/45 uppercase mt-0.5">Долг</div>
            </div>
          </div>
        </div>

        {/* ══════════════ КОЛОНКА 2 — группа + платежи ══════════════ */}
        <div className="space-y-4 w-full flex-1 min-w-0">
          <div className="card bg-base-100 p-5">
            {primaryGroup ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[16px] font-extrabold text-base-content">{primaryGroup.name}</h3>
                  <Link to="/groups" className="text-[11px] font-semibold text-primary hover:underline">Все группы</Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-[10px] bg-base-200/60">
                    <div className="text-[10px] font-bold text-base-content/45 uppercase">Курс</div>
                    <div className="text-[13px] font-bold text-base-content mt-0.5">{primaryGroup.subject}</div>
                  </div>
                  <div className="p-3 rounded-[10px] bg-base-200/60">
                    <div className="text-[10px] font-bold text-base-content/45 uppercase">Ментор</div>
                    <div className="text-[13px] font-bold text-base-content mt-0.5">{primaryGroup.mentor}</div>
                  </div>
                  <div className="p-3 rounded-[10px] bg-base-200/60">
                    <div className="text-[10px] font-bold text-base-content/45 uppercase">Время занятий</div>
                    <div className="text-[13px] font-bold text-base-content mt-0.5">
                      {groupDetail.startTime ? `${groupDetail.startTime} · ${(groupDetail.days || []).map((d) => DAY_LABELS[d] || d).join('/')}` : '—'}
                    </div>
                  </div>
                  <div className="p-3 rounded-[10px] bg-base-200/60">
                    <div className="text-[10px] font-bold text-base-content/45 uppercase">Стоимость</div>
                    <div className="text-[13px] font-bold text-base-content mt-0.5">{formatMoney(primaryGroup.monthlyPrice)}/мес</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Users size={28} className="mx-auto mb-2 text-base-content/45 opacity-30" />
                <p className="text-[13px] text-base-content/45">Не привязан к группе</p>
              </div>
            )}
          </div>

          {attendanceDays.length > 0 && (
            <div className="card bg-base-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays size={15} className="text-primary" />
                <h3 className="text-[13px] font-bold text-base-content">Посещаемость</h3>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {attendanceDays.map((d) => {
                  const c = ATTENDANCE_COLORS[d.status] || ATTENDANCE_COLORS.absent;
                  return (
                    <div
                      key={d.date}
                      title={`${c.label} · ${formatDate(d.date)}`}
                      className="shrink-0 w-11 h-14 rounded-[10px] flex flex-col items-center justify-center gap-0.5 border"
                      style={{ background: c.bg, color: c.text, borderColor: c.text + '40' }}
                    >
                      <span className="text-[13px] font-extrabold">{dayShort(d.date)}</span>
                      <span className="text-[9px] font-semibold uppercase opacity-70">{weekdayShort(d.date)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card bg-base-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard size={15} className="text-primary" />
              <h3 className="text-[13px] font-bold text-base-content">История платежей</h3>
              <span className="text-[11px] text-base-content/45 ml-auto">{invoices.length}</span>
            </div>
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard size={28} className="mx-auto mb-2 text-base-content/45 opacity-30" />
                <p className="text-[13px] text-base-content/45">Нет платежей</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {invoices.map((inv) => {
                  const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.pending;
                  return (
                    <div key={inv.id} className="flex items-center justify-between p-2.5 rounded-[10px] hover:bg-base-200/60 transition-colors">
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-base-content capitalize">{monthLabel(inv.periodMonth)}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[13px] font-bold text-base-content tabular-nums">{formatMoney(inv.paidAmount)}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════ КОЛОНКА 3 — текущий месяц ══════════════ */}
        <div className="space-y-4 w-full shrink-0" style={{ maxWidth: 300 }}>
          <div className="card bg-base-100 p-5">
            <div className="text-[13px] font-extrabold text-base-content capitalize">{monthLabel(new Date())}</div>
            <div className="flex items-baseline justify-between mt-2">
              <span className={`text-[12px] font-bold ${currentInvoice?.status === 'paid' ? 'text-emerald-600' : 'text-red-500'}`}>
                {currentInvoice?.status === 'paid' ? 'Оплачено' : 'Не оплачено'}
              </span>
              <span className="text-[20px] font-extrabold text-base-content tabular-nums">{formatMoney(currentInvoice?.paidAmount ?? 0)}</span>
            </div>
            <div className="text-[11px] text-base-content/45 mt-1">
              Ежемесячно: {formatMoney(primaryGroup?.monthlyPrice)} · Долг: {formatMoney(student.totalDebt)}
            </div>
          </div>

          <div className="card bg-base-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet size={15} className="text-primary" />
              <h3 className="text-[13px] font-bold text-base-content">Счета</h3>
            </div>
            {invoices.length === 0 ? (
              <p className="text-[12px] text-base-content/40 text-center py-4">Пока пусто</p>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto">
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-2.5 rounded-[10px] bg-base-200/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-extrabold text-emerald-600 tabular-nums">+{formatMoney(inv.paidAmount).replace(' сум', '')}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-base-300 text-base-content/60 uppercase">{inv.type === 'split' ? 'Сплит' : 'Полный'}</span>
                    </div>
                    <div className="text-[10px] text-base-content/45 mt-0.5">{formatDate(inv.createdAt)} · {monthLabel(inv.periodMonth)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Модалка логин/пароль ═══ */}
      <Modal isOpen={showCreds} onClose={() => setShowCreds(false)} title="Данные для входа">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-[10px] bg-base-200/60">
            <div>
              <div className="text-[10px] font-bold text-base-content/45 uppercase">Логин-код</div>
              <div className="text-[15px] font-mono font-extrabold text-base-content">{realCreds?.loginCode || student.loginCode || student.login_code || '—'}</div>
            </div>
            <button onClick={() => copyToClipboard(realCreds?.loginCode || student.loginCode, 'lc')} className="btn btn-ghost btn-sm">
              {copied === 'lc' ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-[10px] bg-base-200/60">
            <div>
              <div className="text-[10px] font-bold text-base-content/45 uppercase">Пароль</div>
              <div className="text-[15px] font-mono font-extrabold text-base-content">
                {credsLoading ? '…' : realCreds?.password || '— недоступен, нажмите «Новый пароль»'}
              </div>
            </div>
            {realCreds?.password && (
              <button onClick={() => copyToClipboard(realCreds.password, 'pw')} className="btn btn-ghost btn-sm">
                {copied === 'pw' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 pt-1">
            {qrImage ? (
              <img src={qrImage} alt="QR для входа" width={180} height={180} className="rounded-[10px] border border-base-300" />
            ) : qrError ? (
              <p className="text-[11px] text-error text-center">Не удалось сгенерировать QR — попробуйте открыть модалку заново</p>
            ) : (
              <div className="w-[180px] h-[180px] rounded-[10px] border border-base-300 grid place-items-center bg-base-200/60">
                <span className="loading loading-spinner loading-sm text-primary" />
              </div>
            )}
            <p className="text-[11px] text-base-content/45 text-center">
              Студент сканирует камерой телефона — входит в кабинет сразу, без набора логина и пароля.
              Код постоянный, работает при каждом сканировании — как студенческий бейдж.
            </p>
            <button
              className="btn btn-ghost btn-xs gap-1 text-base-content/45"
              onClick={regenerateQr}
              disabled={qrBusy}
            >
              {qrBusy ? <span className="loading loading-spinner loading-xs" /> : <RefreshCw size={11} />}
              Перевыпустить QR
            </button>
          </div>
        </div>
      </Modal>

      {/* ═══ Модалка отправки сообщения в Telegram ═══ */}
      <TgMessageModal
        isOpen={showTgMessage}
        onClose={() => setShowTgMessage(false)}
        token={token}
        studentId={id}
      />

      {/* ═══ Модалка «Пополнить счёт» ═══ */}
      <TopUpModal
        isOpen={showTopUp}
        onClose={() => setShowTopUp(false)}
        student={student}
        primaryGroup={primaryGroup}
        token={token}
        onDone={() => { setShowTopUp(false); refetch(); refetchInvoices(); }}
      />

      {/* ═══ Модалка «Добавить в группу» ═══ */}
      <AddGroupModal
        isOpen={showAddGroup}
        onClose={() => setShowAddGroup(false)}
        groupOptions={groupOptions}
        token={token}
        studentId={id}
        currentGroups={groups}
        onDone={() => { setShowAddGroup(false); refetch(); }}
      />

      {/* ═══ Edit Modal ═══ */}
      {editing && (
        <dialog className="modal modal-open">
          <div className="modal-box card bg-base-100 border border-base-300">
            <h3 className="font-bold text-lg mb-4">Редактирование ученика</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">Имя</label>
                  <input className="input input-bordered w-full" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">Фамилия</label>
                  <input className="input input-bordered w-full" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">Телефон</label>
                <PhoneInput className="input input-bordered w-full" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              </div>
              <div>
                <label className="text-[11px] font-bold text-base-content/70 uppercase tracking-wider mb-1 block">Дата рождения</label>
                <input className="input input-bordered w-full" type="date" value={form.birthDate || ''} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} />
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setEditing(false)} disabled={saving}>Отмена</button>
              <button className="btn btn-primary gap-1" onClick={saveEdit} disabled={saving || !form.firstName || !form.lastName}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Сохранить
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setEditing(false)} />
        </dialog>
      )}

      {/* ═══ Freeze Modal ═══ */}
      <Modal
        isOpen={actionModal === 'freeze'}
        onClose={() => setActionModal(null)}
        title="Заморозить студента"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setActionModal(null)} disabled={busy}>Отмена</button>
            <button className="btn btn-warning btn-sm gap-1" onClick={() => { const r = actionReason.trim(); setActionModal(null); doFreeze(true, r); }} disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Snowflake size={14} />} Заморозить
            </button>
          </div>
        }
      >
        <p className="text-sm text-base-content/70 mb-1">Почему вы замораживаете <b>{fullName(student)}</b>?</p>
        <p className="text-xs text-base-content/45 mb-3">Укажите причину — она будет видна другим сотрудникам.</p>
        <textarea className="textarea textarea-bordered w-full" rows={3} placeholder="Причина заморозки…" value={actionReason} onChange={(e) => setActionReason(e.target.value)} autoFocus />
      </Modal>

      {/* ═══ Archive Modal ═══ */}
      <Modal
        isOpen={actionModal === 'archive'}
        onClose={() => setActionModal(null)}
        title="Архивировать студента"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost btn-sm" onClick={() => setActionModal(null)} disabled={busy}>Отмена</button>
            <button className="btn btn-error btn-sm gap-1" onClick={confirmArchive} disabled={busy}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Archive size={14} />} Архивировать
            </button>
          </div>
        }
      >
        <p className="text-sm text-base-content/70 mb-1">Вы уверены, что хотите архивировать <b>{fullName(student)}</b>?</p>
        <p className="text-xs text-base-content/45 mb-3">Студент будет скрыт из активного списка, данные сохранятся. Укажите причину.</p>
        <textarea className="textarea textarea-bordered w-full" rows={3} placeholder="Причина архивации…" value={actionReason} onChange={(e) => setActionReason(e.target.value)} autoFocus />
      </Modal>
    </div>
  );
}

/* ═══════════════ Модалка пополнения счёта ═══════════════ */
function TopUpModal({ isOpen, onClose, student, primaryGroup, token, onDone }) {
  const [amount, setAmount] = useState('');
  const [month, setMonth] = useState(monthInputValue(new Date()));
  const [method, setMethod] = useState('cash');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!isOpen) return null;
  // Один пресет — реальная цена методики группы (training_type.price), а не
  // выдуманные 75%/50% без опоры на данные (Karis, 08.08.2026).
  const presets = primaryGroup?.monthlyPrice ? [primaryGroup.monthlyPrice] : [];

  const submit = async () => {
    if (!amount || Number(amount) <= 0) { setErr('Укажите сумму'); return; }
    setBusy(true); setErr('');
    try {
      await api.adminCreatePayment(token, {
        studentId: student.id,
        groupId: primaryGroup?.id,
        periodMonth: `${month}-01`,
        totalAmount: Number(amount),
        parts: [{ method, amount: Number(amount) }],
        comment: comment || undefined,
      });
      setAmount(''); setComment('');
      onDone();
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box card bg-base-100 border border-base-300 max-w-lg p-0">
        <div className="px-6 pt-6 pb-4 border-b border-base-200">
          <h3 className="font-extrabold text-lg text-base-content">Пополнить счёт</h3>
          <p className="text-[12px] text-base-content/45 mt-0.5">{fullName(student)} {primaryGroup ? `· ${primaryGroup.name}` : ''}</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          {err && <div className="alert alert-error py-2 text-sm">{err}</div>}
          <div>
            <label className="text-[10px] font-extrabold text-primary uppercase tracking-wide mb-1 block">Сумма *</label>
            {/* type="text" + фильтр цифр вместо type="number" — убирает нативные стрелки-спиннер */}
            <input
              className="input input-bordered w-full"
              type="text"
              inputMode="numeric"
              placeholder="Сумма пополнения"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            />
            {presets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {presets.map((p) => (
                  <button key={p} type="button" className="btn btn-xs btn-outline" onClick={() => setAmount(String(p))}>
                    +{p.toLocaleString('ru-RU')}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-primary uppercase tracking-wide mb-1 block">За какой месяц?</label>
            <input className="input input-bordered w-full" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-primary uppercase tracking-wide mb-1 block">Способ оплаты *</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(METHOD_LABELS).map(([k, label]) => (
                <label key={k} className={`flex items-center justify-center gap-1.5 cursor-pointer input input-bordered text-[13px] ${method === k ? 'border-primary text-primary' : ''}`}>
                  <input type="radio" name="method" className="radio radio-xs" checked={method === k} onChange={() => setMethod(k)} />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-extrabold text-primary uppercase tracking-wide mb-1 block">Комментарий</label>
            <textarea className="textarea textarea-bordered w-full" rows={2} placeholder="Комментарий (необязательно)" value={comment} onChange={(e) => setComment(e.target.value)} />
          </div>
        </div>
        <div className="modal-action px-6 pb-6 pt-2">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Отмена</button>
          <button className="btn btn-primary gap-1.5" onClick={submit} disabled={busy || !amount}>
            {busy && <span className="loading loading-spinner loading-xs" />} Сохранить
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}

/* ═══════════════ Модалка добавления/перевода в группу ═══════════════
   Если у студента уже есть группа — это перевод: сначала выходит из старой
   (adminRemoveStudentFromGroup), потом входит в новую. Backend атомарного
   «transfer»-эндпоинта нет — два вызова подряд, второй не идёт при ошибке первого. */
/* ═══════════════ Модалка отправки сообщения студенту в Telegram ═══════════════ */
function TgMessageModal({ isOpen, onClose, token, studentId }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState(false);
  if (!isOpen) return null;

  const submit = async () => {
    if (!text.trim()) { setErr('Введите текст'); return; }
    setBusy(true); setErr('');
    try {
      await api.adminSendStudentTelegramMessage(token, studentId, text.trim());
      setSent(true);
      setTimeout(() => { setSent(false); setText(''); onClose(); }, 900);
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box card bg-base-100 border border-base-300 max-w-md">
        <h3 className="font-extrabold text-lg text-base-content mb-4">Написать в Telegram</h3>
        {err && <div className="alert alert-error mb-3 py-2 text-sm">{err}</div>}
        <textarea
          className="textarea textarea-bordered w-full"
          rows={4}
          placeholder="Текст сообщения…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Отмена</button>
          <button className="btn btn-primary gap-1.5" onClick={submit} disabled={busy || !text.trim()}>
            {busy && <span className="loading loading-spinner loading-xs" />}
            {sent ? <Check size={14} /> : <Send size={14} />} {sent ? 'Отправлено' : 'Отправить'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}

function AddGroupModal({ isOpen, onClose, groupOptions, token, studentId, currentGroups, onDone }) {
  const [groupId, setGroupId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  if (!isOpen) return null;

  const isTransfer = (currentGroups || []).length > 0;

  const submit = async () => {
    if (!groupId) { setErr('Выберите группу'); return; }
    setBusy(true); setErr('');
    try {
      for (const g of currentGroups || []) {
        await api.adminRemoveStudentFromGroup(token, g.id, studentId);
      }
      await api.adminAddStudentToGroup(token, groupId, studentId);
      setGroupId('');
      onDone();
    } catch (e) { setErr(e.message || 'Ошибка'); }
    finally { setBusy(false); }
  };

  return (
    <dialog className="modal modal-open">
      <div className="modal-box card bg-base-100 border border-base-300 max-w-sm">
        <h3 className="font-extrabold text-lg text-base-content mb-1">{isTransfer ? 'Перевести в другую группу' : 'Добавить в группу'}</h3>
        {isTransfer && (
          <p className="text-[12px] text-base-content/45 mb-3">
            Сейчас: {currentGroups.map((g) => g.name).join(', ')} — при переводе студент выйдет отсюда.
          </p>
        )}
        {err && <div className="alert alert-error mb-3 py-2 text-sm mt-3">{err}</div>}
        <select className="select select-bordered w-full mt-3" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          <option value="">Выберите группу…</option>
          {groupOptions.filter((g) => !(currentGroups || []).some((cg) => cg.id === g.id)).map((g) => (
            <option key={g.id} value={g.id}>{g.name}{g.subject ? ` — ${g.subject}` : ''}</option>
          ))}
        </select>
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Отмена</button>
          <button className="btn btn-primary gap-1.5" onClick={submit} disabled={busy || !groupId}>
            {busy && <span className="loading loading-spinner loading-xs" />} {isTransfer ? 'Перевести' : 'Добавить'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </dialog>
  );
}
