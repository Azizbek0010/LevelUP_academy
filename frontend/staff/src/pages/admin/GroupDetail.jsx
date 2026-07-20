import { useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, UserPlus, X, Users, GraduationCap, KeyRound, Phone,
  CalendarDays, ChevronLeft, ChevronRight, Check, XIcon, Clock, AlertCircle,
  BookOpen, Plus, Star, MessageSquare, Send, FileText, Loader2,
} from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import {
  useAdminGroupDetail, useAdminStudents,
  useAdminGroupAttendance, useAdminGroupHomework, useAdminGroupFeedback,
} from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Avatar, RowSkeleton } from '../mentor/_ui.jsx';

/* ─── helpers ─── */
const fullName = (s) => s.fullName || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ') || '—';
const today = () => new Date().toISOString().slice(0, 10);
const yesterday = (d) => { const dt = new Date(d); dt.setDate(dt.getDate() - 1); return dt.toISOString().slice(0, 10); };
const tomorrow = (d) => { const dt = new Date(d); dt.setDate(dt.getDate() + 1); return dt.toISOString().slice(0, 10); };
const STATUS_LABELS = { present: 'Мавжуд', absent: 'Йук', late: 'Кечикди', excused: 'Узрли' };
const STATUS_COLORS = {
  present: 'bg-emerald-500 text-white',
  absent: 'bg-red-500 text-white',
  late: 'bg-amber-500 text-white',
  excused: 'bg-gray-400 text-white',
};
const STATUS_ICONS = {
  present: Check,
  absent: XIcon,
  late: Clock,
  excused: AlertCircle,
};

/* ═══════════════ AttendanceTab ═══════════════ */
function AttendanceTab({ groupId, token }) {
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);
  const { data: attData, refetch } = useAdminGroupAttendance(groupId, date);
  const records = attData?.data || attData || [];

  const cycleStatus = useCallback((current) => {
    const order = [null, 'present', 'absent', 'late', 'excused'];
    const idx = order.indexOf(current);
    return order[(idx + 1) % order.length];
  }, []);

  const handleToggle = async (studentId, studentName, currentStatus) => {
    const newStatus = cycleStatus(currentStatus);
    // Optimistic update
    const updated = records.map((r) =>
      r.studentId === studentId ? { ...r, status: newStatus } : r
    );
    // Save optimistically (will refetch)
    try {
      setSaving(true);
      await api.adminMarkGroupAttendance(token, groupId, {
        lessonDate: date,
        records: updated.map((r) => ({ studentId: r.studentId, studentName: r.studentName, status: r.status })),
      });
      refetch();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    present: records.filter((r) => r.status === 'present').length,
    absent: records.filter((r) => r.status === 'absent').length,
    late: records.filter((r) => r.status === 'late').length,
    excused: records.filter((r) => r.status === 'excused').length,
  };
  const total = records.length;
  const attendancePct = total > 0 ? Math.round((stats.present / total) * 100) : 0;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Date nav */}
      <div className="flex items-center gap-3">
        <button className="btn btn-ghost btn-sm" onClick={() => setDate(yesterday(date))}>
          <ChevronLeft size={18} />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[var(--surface)] border border-[var(--border)]">
          <CalendarDays size={14} className="text-[var(--green)]" />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-transparent text-[13px] font-semibold text-[var(--text)] outline-none"
          />
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => setDate(tomorrow(date))}>
          <ChevronRight size={18} />
        </button>
        {date !== today() && (
          <button className="btn btn-ghost btn-xs text-[var(--green)]" onClick={() => setDate(today())}>
            Бугун
          </button>
        )}
        {saving && <Loader2 size={14} className="animate-spin text-[var(--green)]" />}
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-emerald-50 text-emerald-700 text-[12px] font-bold">
          <Check size={14} /> {stats.present} / {total} ({attendancePct}%)
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-red-50 text-red-700 text-[12px] font-bold">
          <XIcon size={14} /> {stats.absent}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-amber-50 text-amber-700 text-[12px] font-bold">
          <Clock size={14} /> {stats.late}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-gray-100 text-gray-600 text-[12px] font-bold">
          <AlertCircle size={14} /> {stats.excused}
        </div>
      </div>

      {/* Student list */}
      {records.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)] text-[13px]">
          <CalendarDays size={32} className="mx-auto mb-2 opacity-30" />
          Бугун учун давомат йўқ
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const Icon = r.status ? STATUS_ICONS[r.status] : null;
            return (
              <button
                key={r.id || r.studentId}
                onClick={() => handleToggle(r.studentId, r.studentName, r.status)}
                className="w-full flex items-center gap-3 p-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--green)] hover:shadow-sm transition-all text-left group"
              >
                {/* Status badge */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-[13px] font-extrabold transition-all ${
                  r.status ? STATUS_COLORS[r.status] : 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300'
                }`}>
                  {Icon ? <Icon size={16} /> : (r.studentName?.[0] || '?')}
                </div>

                {/* Name */}
                <span className="flex-1 text-[13px] font-semibold text-[var(--text)]">{r.studentName || r.studentId}</span>

                {/* Status label */}
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  r.status ? STATUS_COLORS[r.status] : 'bg-gray-100 text-gray-400'
                }`}>
                  {r.status ? STATUS_LABELS[r.status] : 'Босма'}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ HomeworkTab ═══════════════ */
function HomeworkTab({ groupId }) {
  const { data: hwData, refetch } = useAdminGroupHomework(groupId);
  const hw = hwData?.data || hwData || [];
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await api.adminCreateGroupHomework(null, groupId, form);
      setForm({ title: '', description: '', dueDate: '' });
      setShowAdd(false);
      refetch();
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const statusBadge = (s) => {
    if (s === 'active') return 'bg-emerald-100 text-emerald-700';
    if (s === 'completed') return 'bg-blue-100 text-blue-700';
    if (s === 'overdue') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-500';
  };
  const statusLabel = (s) => s === 'active' ? 'Актив' : s === 'completed' ? 'Бajarildi' : s === 'overdue' ? 'Muddati otgan' : s;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold text-[var(--text-secondary)]">Уй вазифалари ({hw.length})</span>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Қўшиш
        </button>
      </div>

      {hw.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)] text-[13px]">
          <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
          Ҳали уй вазифаси йўқ
        </div>
      ) : (
        <div className="space-y-3">
          {hw.map((h) => (
            <div key={h.id} className="p-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-bold text-[var(--text)] truncate">{h.title}</h4>
                  {h.description && <p className="text-[12px] text-[var(--text-muted)] mt-1 line-clamp-2">{h.description}</p>}
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusBadge(h.status)}`}>
                  {statusLabel(h.status)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-[var(--text-muted)]">
                {h.dueDate && <span>Муддат: {h.dueDate}</span>}
                <span>{h.submissions || 0} / {h.totalStudents || 0} топширилган</span>
              </div>
              {/* Progress bar */}
              {h.totalStudents > 0 && (
                <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--green)] transition-all"
                    style={{ width: `${Math.round(((h.submissions || 0) / h.totalStudents) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-4">Уй вазифаси қўшиш</h3>
            <div className="space-y-3">
              <input
                className="input input-bordered w-full"
                placeholder="Сарлавха"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Тафсилот (ихтиёрий)"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
              <input
                type="date"
                className="input input-bordered w-full"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Бекор қилиш</button>
              <button className="btn btn-primary gap-1" onClick={handleAdd} disabled={!form.title.trim() || submitting}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Қўшиш
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowAdd(false)} />
        </dialog>
      )}
    </div>
  );
}

/* ═══════════════ FeedbackTab ═══════════════ */
function FeedbackTab({ groupId }) {
  const { data: fbData, refetch } = useAdminGroupFeedback(groupId);
  const fb = fbData?.data || fbData || [];
  const [filter, setFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'student', authorName: '', content: '', rating: 5 });
  const [submitting, setSubmitting] = useState(false);

  const filtered = filter === 'all' ? fb : fb.filter((f) => f.type === filter);

  const handleAdd = async () => {
    if (!form.content.trim()) return;
    setSubmitting(true);
    try {
      await api.adminCreateGroupFeedback(null, groupId, form);
      setForm({ type: 'student', authorName: '', content: '', rating: 5 });
      setShowAdd(false);
      refetch();
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const renderStars = (count) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} className={i <= count ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
      ))}
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {['all', 'student', 'teacher'].map((f) => (
            <button
              key={f}
              className={`text-[12px] font-bold px-3 py-1 rounded-full transition-all ${
                filter === f ? 'bg-[var(--green)] text-white' : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'
              }`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Барчаси' : f === 'student' ? 'О\'quvchi' : 'Ментор'}
            </button>
          ))}
        </div>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Қўшиш
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)] text-[13px]">
          <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
          Ҳали фикр-мулоҳоза йўқ
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <div key={f.id} className="p-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold ${
                    f.type === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {f.type === 'student' ? 'О' : 'М'}
                  </div>
                  <span className="text-[13px] font-bold text-[var(--text)]">{f.authorName || 'Аноним'}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    f.type === 'student' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                  }`}>
                    {f.type === 'student' ? 'О\'quvchi' : 'Ментор'}
                  </span>
                </div>
                {renderStars(f.rating)}
              </div>
              <p className="text-[13px] text-[var(--text)] leading-relaxed">{f.content}</p>
              <div className="mt-2 text-[11px] text-[var(--text-muted)]">{f.createdAt?.slice(0, 10)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-4">Фикр-мулоҳоза қўшиш</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                {['student', 'teacher'].map((t) => (
                  <button
                    key={t}
                    className={`flex-1 py-2 rounded-[10px] text-[13px] font-bold transition-all ${
                      form.type === t ? 'bg-[var(--green)] text-white' : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                    onClick={() => setForm({ ...form, type: t })}
                  >
                    {t === 'student' ? 'О\'quвчи' : 'Ментор'}
                  </button>
                ))}
              </div>
              <input
                className="input input-bordered w-full"
                placeholder="Муаллиф номи"
                value={form.authorName}
                onChange={(e) => setForm({ ...form, authorName: e.target.value })}
              />
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Фикр-мулоҳоза матни..."
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
              <div>
                <label className="text-[12px] font-bold text-[var(--text-secondary)] mb-1 block">Баҳо</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      onClick={() => setForm({ ...form, rating: i })}
                      className="p-1"
                    >
                      <Star size={20} className={i <= form.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Бекор қилиш</button>
              <button className="btn btn-primary gap-1" onClick={handleAdd} disabled={!form.content.trim() || submitting}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Юбориш
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowAdd(false)} />
        </dialog>
      )}
    </div>
  );
}

/* ═══════════════ StudentCard ═══════════════ */
function StudentCard({ s, onRemove }) {
  return (
    <div className="glass-strong rounded-[16px] p-4 card-hover-premium group">
      <div className="flex items-center gap-3.5">
        <div className="transition-transform duration-300 group-hover:scale-105">
          <Avatar name={fullName(s)} size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-bold text-[var(--text)] truncate block">{fullName(s)}</span>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--text-muted)]">
            {(s.login_code || s.loginCode) && (
              <span className="font-mono flex items-center gap-1">
                <KeyRound size={10} /> {s.login_code || s.loginCode}
              </span>
            )}
            {s.phone && (
              <span className="flex items-center gap-1">
                <Phone size={10} /> {s.phone}
              </span>
            )}
          </div>
        </div>
        <button
          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
          title="Группадан олиб ташлаш"
          onClick={() => onRemove(s.id)}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════ Main GroupDetail ═══════════════ */
const TABS = [
  { key: 'attendance', label: 'Давомат', icon: CalendarDays },
  { key: 'homework', label: 'Уй вазифаси', icon: BookOpen },
  { key: 'feedback', label: 'Фикр-мулоҳоза', icon: MessageSquare },
];

export default function AdminGroupDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminGroupDetail(id);
  const { data: studentsData } = useAdminStudents();
  const [activeTab, setActiveTab] = useState('attendance');
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState('');

  const raw = data?.data || data || {};
  const group = raw.group || raw;
  const students = group.students || raw.students || [];
  const allStudents = (studentsData?.data || studentsData || {}).students || [];
  const candidates = allStudents.filter((s) => !students.some((gs) => gs.id === s.id));

  const add = async () => {
    if (!pick) return;
    try { await api.adminAddStudentToGroup(token, id, pick); setPick(''); setAdding(false); refetch(); }
    catch (e) { alert(e.message || 'Ошибка'); }
  };
  const remove = async (sid) => {
    if (!confirm('Убрать студента из группы?')) return;
    try { await api.adminRemoveStudentFromGroup(token, id, sid); refetch(); }
    catch (e) { alert(e.message || 'Ошибка'); }
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Группа" />
        <div className="mt-6"><RowSkeleton count={2} /></div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <PageHeader title="Группа" />
        <div className="alert alert-error mt-6">Ошибка: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Back link */}
      <Link to="/groups" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--green)] transition-colors animate-fade-in">
        <ArrowLeft size={16} /> Группаларга
      </Link>

      <PageHeader title={group.name || 'Группа'} subtitle={group.mentorName ? `Ментор: ${group.mentorName}` : group.mentor?.name ? `Ментор: ${group.mentor.name}` : undefined}>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setAdding(true)}>
          <UserPlus size={16} /> Қўшиш
        </button>
      </PageHeader>

      {/* Stats bar */}
      <div className="glass-strong rounded-[16px] p-4 flex items-center gap-6 animate-fade-in stagger-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-[var(--green-bg)] text-[var(--green)]">
            <Users size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">О'кувчилар</div>
            <div className="text-[20px] font-extrabold text-[var(--text)] tabular-nums leading-none mt-0.5">{students.length}</div>
          </div>
        </div>
        {(group.mentorName || group.mentor?.name) && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-[#3B82F615] text-[#3B82F6]">
              <GraduationCap size={18} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">Ментор</div>
              <div className="text-[14px] font-bold text-[var(--text)] mt-0.5">{group.mentorName || group.mentor?.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-[14px] bg-[var(--surface)] border border-[var(--border)] animate-fade-in stagger-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] text-[13px] font-bold transition-all duration-200 ${
              activeTab === key
                ? 'bg-[var(--green)] text-white shadow-md'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--green-bg)]'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="glass-strong rounded-[16px] p-5 animate-fade-in stagger-3">
        {activeTab === 'attendance' && <AttendanceTab groupId={id} token={token} />}
        {activeTab === 'homework' && <HomeworkTab groupId={id} />}
        {activeTab === 'feedback' && <FeedbackTab groupId={id} />}
      </div>

      {/* Student List (always visible below tabs) */}
      <div className="animate-fade-in stagger-4">
        <h3 className="text-[14px] font-bold text-[var(--text)] mb-3 flex items-center gap-2">
          <Users size={16} className="text-[var(--green)]" />
          О'кувчилар рўйхати ({students.length})
        </h3>
        {students.length === 0 ? (
          <div className="glass-strong rounded-[20px] p-12 text-center">
            <Users size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
            <p className="text-[14px] font-medium text-[var(--text-muted)]">Группада о'кувчилар йўқ</p>
            <p className="text-[12px] text-[var(--text-muted)] mt-1 opacity-60">Биринчи о'кувчини қўшинг</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {students.map((s) => (
              <StudentCard key={s.id} s={s} onRemove={remove} />
            ))}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {adding && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-4">О'кувчини қўшиш</h3>
            <select className="select select-bordered w-full" value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">О'кувчини танланг...</option>
              {candidates.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
            </select>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setAdding(false)}>Бекор қилиш</button>
              <button className="btn btn-primary" onClick={add} disabled={!pick}>Қўшиш</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setAdding(false)} />
        </dialog>
      )}
    </div>
  );
}
