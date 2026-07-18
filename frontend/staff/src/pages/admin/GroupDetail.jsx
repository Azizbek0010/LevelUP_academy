import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, UserPlus, X, Users, GraduationCap, KeyRound, Phone,
  CalendarDays, ClipboardList, MessageSquare, Check, CheckCircle2,
  XCircle, Clock, AlertTriangle, Star, ChevronLeft, ChevronRight,
  Plus, Send, BookOpen, FileText, TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import {
  useAdminGroupDetail, useAdminStudents,
  useAdminGroupAttendance, useAdminGroupHomework, useAdminGroupFeedback,
} from '../../queries.js';
import { api } from '../../api.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';
import { useQueryClient } from '@tanstack/react-query';

/* ═══════════════ Helpers ═══════════════ */
const fullName = (s) => s.fullName || [s.firstName || s.first_name, s.lastName || s.last_name].filter(Boolean).join(' ') || '—';
const initials = (s) => {
  const f = s.firstName || s.first_name || '';
  const l = s.lastName || s.last_name || '';
  return ((f[0] || '') + (l[0] || '')).toUpperCase() || '?';
};

const statusConfig = {
  present: { color: 'var(--green)', bg: 'var(--green-bg)', icon: CheckCircle2, label: 'Присутствует' },
  absent: { color: 'var(--danger, #EF4444)', bg: 'rgba(239,68,68,0.08)', icon: XCircle, label: 'Отсутствует' },
  late: { color: 'var(--warning, #F59E0B)', bg: 'rgba(245,158,11,0.08)', icon: Clock, label: 'Опоздал' },
  excused: { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', icon: AlertTriangle, label: 'Уважит.' },
};

const tabs = [
  { id: 'attendance', label: 'Davomat', icon: CalendarDays },
  { id: 'homework', label: 'Uy vazifasi', icon: ClipboardList },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' });
}

function dateKey(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/* ═══════════════ Tab: Davomat ═══════════════ */
function AttendanceTab({ groupId, students }) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const { data, isLoading } = useAdminGroupAttendance(groupId, selectedDate);

  const records = useMemo(() => {
    const list = data?.records || data || [];
    // Merge with students list to ensure all students appear
    if (students.length > 0) {
      const merged = students.map((s) => {
        const sid = s.id;
        const existing = list.find((r) => r.studentId === sid);
        return existing || {
          id: `att-pending-${sid}-${selectedDate}`,
          studentId: sid,
          studentName: fullName(s),
          status: null,
          date: selectedDate,
        };
      });
      return merged;
    }
    return list;
  }, [data, students, selectedDate]);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    return { total, present, absent, late, rate: total ? Math.round((present / total) * 100) : 0 };
  }, [records]);

  const toggleStatus = async (studentId, currentStatus) => {
    // Cycle: null → present → absent → late → null
    const cycle = [null, 'present', 'absent', 'late'];
    const nextIdx = (cycle.indexOf(currentStatus) + 1) % cycle.length;
    const nextStatus = cycle[nextIdx];
    const student = students.find((s) => s.id === studentId);
    const updatedRecords = records.map((r) =>
      r.studentId === studentId ? { ...r, status: nextStatus } : r
    );
    // Save optimistic
    try {
      await api.adminMarkGroupAttendance(token, groupId, {
        date: selectedDate,
        records: updatedRecords.map((r) => ({
          studentId: r.studentId,
          studentName: r.studentName,
          status: r.status || 'present',
        })),
      });
      qc.invalidateQueries(['admin-group-attendance', groupId, selectedDate]);
    } catch (e) {
      console.error('Attendance save error:', e);
    }
  };

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(dateKey(d));
  };
  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(dateKey(d));
  };

  return (
    <div className="space-y-5">
      {/* Date Nav + Stats */}
      <div className="glass-strong rounded-[16px] p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={prevDay} className="btn btn-ghost btn-xs"><ChevronLeft size={16} /></button>
          <div className="text-center min-w-[120px]">
            <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase">{new Date(selectedDate).toLocaleDateString('uz-UZ', { weekday: 'short' })}</div>
            <div className="text-[15px] font-extrabold text-[var(--text)]">{new Date(selectedDate).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          </div>
          <button onClick={nextDay} className="btn btn-ghost btn-xs"><ChevronRight size={16} /></button>
          {selectedDate !== todayKey() && (
            <button onClick={() => setSelectedDate(todayKey())} className="btn btn-xs btn-primary ml-1">Bugun</button>
          )}
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold">
            <CheckCircle2 size={14} className="text-[var(--green)]" />
            <span className="text-[var(--text)]">{stats.present}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-semibold">
            <XCircle size={14} className="text-[var(--danger, #EF4444)]" />
            <span className="text-[var(--text)]">{stats.absent}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[12px] font-semibold">
            <Clock size={14} className="text-[var(--warning, #F59E0B)]" />
            <span className="text-[var(--text)]">{stats.late}</span>
          </div>
          <div className="w-px h-4 bg-[var(--border)]" />
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--green)]">
            <TrendingUp size={14} />
            <span>{stats.rate}%</span>
          </div>
        </div>
      </div>

      {/* Student Attendance List */}
      {isLoading ? (
        <SkeletonTable cols={3} />
      ) : records.length === 0 ? (
        <div className="glass-strong rounded-[20px] p-12 text-center">
          <CalendarDays size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-[14px] font-medium text-[var(--text-muted)]">Давомат маълумотлари мавжуд эмас</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const cfg = r.status ? statusConfig[r.status] : null;
            const StatusIcon = cfg?.icon || null;
            const nextStatus = !r.status ? 'present' : r.status === 'present' ? 'absent' : r.status === 'absent' ? 'late' : null;
            const nextCfg = nextStatus ? statusConfig[nextStatus] : null;

            return (
              <div key={r.id} className="glass-strong rounded-[14px] p-3.5 flex items-center gap-3 group card-hover-premium">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[13px] font-extrabold bg-[var(--green-bg)] text-[var(--green)]">
                  {initials({ firstName: r.studentName?.split(' ')[0], lastName: r.studentName?.split(' ')[1] })}
                </div>

                {/* Name + Status */}
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-bold text-[var(--text)] truncate block">{r.studentName}</span>
                  {cfg ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold mt-0.5 px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
                      {StatusIcon && <StatusIcon size={11} />} {cfg.label}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)]">Белгиланмаган</span>
                  )}
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => toggleStatus(r.studentId, r.status)}
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center transition-all duration-200 hover:scale-110"
                  style={{
                    background: cfg?.bg || 'var(--surface, #F3F4F6)',
                    color: cfg?.color || 'var(--text-muted)',
                  }}
                  title={nextCfg ? `${cfg?.label || 'Белгиланмаган'} → ${nextCfg.label}` : 'Тиклаш'}
                >
                  {StatusIcon ? <StatusIcon size={18} /> : <Check size={18} />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ Tab: Uy vazifasi ═══════════════ */
function HomeworkTab({ groupId }) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useAdminGroupHomework(groupId);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });

  const homework = data?.homework || data || [];

  const addHomework = async () => {
    if (!form.title.trim()) return;
    try {
      await api.adminCreateGroupHomework(token, groupId, {
        title: form.title,
        description: form.description,
        dueDate: form.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      setAdding(false);
      setForm({ title: '', description: '', dueDate: '' });
      qc.invalidateQueries(['admin-group-homework', groupId]);
    } catch (e) {
      alert(e.message || 'Хато');
    }
  };

  const hwStatusStyle = (s) => {
    if (s === 'active') return { color: 'var(--green)', bg: 'var(--green-bg)', label: 'Актив' };
    if (s === 'completed') return { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', label: 'Тугалланган' };
    return { color: 'var(--text-muted)', bg: 'var(--surface, #F3F4F6)', label: s };
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-[var(--text)]">Уй вазифалари ({homework.length})</h3>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setAdding(true)}>
          <Plus size={14} /> Янги вазифа
        </button>
      </div>

      {isLoading ? (
        <SkeletonTable cols={3} />
      ) : homework.length === 0 ? (
        <div className="glass-strong rounded-[20px] p-12 text-center">
          <ClipboardList size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-[14px] font-medium text-[var(--text-muted)]">Уй вазифалари мавжуд эмас</p>
          <p className="text-[12px] text-[var(--text-muted)] mt-1 opacity-60">Биринчи вазифани яратинг</p>
        </div>
      ) : (
        <div className="space-y-3">
          {homework.map((hw) => {
            const cfg = hwStatusStyle(hw.status);
            const isOverdue = hw.status === 'active' && new Date(hw.dueDate) < new Date();
            return (
              <div key={hw.id} className="glass-strong rounded-[14px] p-4 card-hover-premium">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 bg-[var(--green-bg)] text-[var(--green)]">
                    <BookOpen size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[13px] font-bold text-[var(--text)]">{hw.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: cfg.color, background: cfg.bg }}>
                        {cfg.label}
                      </span>
                      {isOverdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-[var(--danger, #EF4444)] bg-[rgba(239,68,68,0.08)]">
                          Муддат ўтган
                        </span>
                      )}
                    </div>
                    {hw.description && (
                      <p className="text-[12px] text-[var(--text-muted)] line-clamp-2">{hw.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={11} /> Муддат: {formatDate(hw.dueDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={11} /> {hw.submissions || 0}/{hw.totalStudents || '?'} топширган
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Homework Modal */}
      {adding && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)] max-w-md">
            <h3 className="font-bold text-lg mb-4">Янги уй вазифаси</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-bold text-[var(--text-secondary)] mb-1 block">Сарлавҳа *</label>
                <input
                  className="input input-bordered w-full text-[13px]"
                  placeholder="Масалан: Flexbox Layout"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-[var(--text-secondary)] mb-1 block">Тавсиф</label>
                <textarea
                  className="textarea textarea-bordered w-full text-[13px]"
                  rows={3}
                  placeholder="Вазифа тavsифи..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-[var(--text-secondary)] mb-1 block">Муддат</label>
                <input
                  type="date"
                  className="input input-bordered w-full text-[13px]"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => { setAdding(false); setForm({ title: '', description: '', dueDate: '' }); }}>Бекор</button>
              <button className="btn btn-primary" onClick={addHomework} disabled={!form.title.trim()}>
                <Plus size={14} /> Яратиш
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setAdding(false)} />
        </dialog>
      )}
    </div>
  );
}

/* ═══════════════ Tab: Feedback ═══════════════ */
function FeedbackTab({ groupId }) {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useAdminGroupFeedback(groupId);
  const [adding, setAdding] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [form, setForm] = useState({ studentName: '', content: '', rating: 5, type: 'student' });

  const feedback = data?.feedback || data || [];
  const filtered = typeFilter === 'all' ? feedback : feedback.filter((f) => f.type === typeFilter);

  const addFeedback = async () => {
    if (!form.content.trim()) return;
    try {
      await api.adminCreateGroupFeedback(token, groupId, {
        studentName: form.studentName || 'Admin',
        content: form.content,
        rating: form.rating,
        type: form.type,
      });
      setAdding(false);
      setForm({ studentName: '', content: '', rating: 5, type: 'student' });
      qc.invalidateQueries(['admin-group-feedback', groupId]);
    } catch (e) {
      alert(e.message || 'Хато');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-bold text-[var(--text)]">Фидбек ({feedback.length})</h3>
          <div className="flex items-center gap-1 ml-2">
            {['all', 'student', 'teacher'].map((t) => (
              <button
                key={t}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                  typeFilter === t
                    ? 'bg-[var(--green)] text-white'
                    : 'bg-[var(--surface, #F3F4F6)] text-[var(--text-muted)] hover:bg-[var(--green-bg)]'
                }`}
                onClick={() => setTypeFilter(t)}
              >
                {t === 'all' ? 'Барчаси' : t === 'student' ? 'Талаба' : 'Устоз'}
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setAdding(true)}>
          <Plus size={14} /> Янги фидбек
        </button>
      </div>

      {isLoading ? (
        <SkeletonTable cols={2} />
      ) : filtered.length === 0 ? (
        <div className="glass-strong rounded-[20px] p-12 text-center">
          <MessageSquare size={40} className="mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-[14px] font-medium text-[var(--text-muted)]">Фидбеклар мавжуд эмас</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((fb) => (
            <div key={fb.id} className="glass-strong rounded-[14px] p-4 card-hover-premium">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-[12px] font-extrabold ${
                  fb.type === 'teacher'
                    ? 'bg-[#3B82F615] text-[#3B82F6]'
                    : 'bg-[var(--green-bg)] text-[var(--green)]'
                }`}>
                  {fb.type === 'teacher' ? <GraduationCap size={16} /> : (fb.studentName?.[0] || '?')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-bold text-[var(--text)]">{fb.studentName}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      fb.type === 'teacher'
                        ? 'bg-[#3B82F615] text-[#3B82F6]'
                        : 'bg-[var(--green-bg)] text-[var(--green)]'
                    }`}>
                      {fb.type === 'teacher' ? 'Устоз' : 'Талаба'}
                    </span>
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)] mt-1 leading-relaxed">{fb.content}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={12}
                          className={s <= fb.rating ? 'text-[var(--warning, #F59E0B)] fill-[var(--warning, #F59E0B)]' : 'text-[var(--text-muted)] opacity-30'}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)]">{formatDate(fb.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Feedback Modal */}
      {adding && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)] max-w-md">
            <h3 className="font-bold text-lg mb-4">Янги фидбек</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[12px] font-bold text-[var(--text-secondary)] mb-1 block">Тип</label>
                <div className="flex gap-2">
                  {['student', 'teacher'].map((t) => (
                    <button
                      key={t}
                      className={`btn btn-sm flex-1 ${form.type === t ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => setForm({ ...form, type: t })}
                    >
                      {t === 'student' ? 'Талаба' : 'Устоз'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[12px] font-bold text-[var(--text-secondary)] mb-1 block">Исм</label>
                <input
                  className="input input-bordered w-full text-[13px]"
                  placeholder="Исм"
                  value={form.studentName}
                  onChange={(e) => setForm({ ...form, studentName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-[var(--text-secondary)] mb-1 block">Фидбек *</label>
                <textarea
                  className="textarea textarea-bordered w-full text-[13px]"
                  rows={4}
                  placeholder="Фидбек матни..."
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[12px] font-bold text-[var(--text-secondary)] mb-1 block">Бахо</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} onClick={() => setForm({ ...form, rating: s })}>
                      <Star
                        size={22}
                        className={`transition-all ${s <= form.rating ? 'text-[var(--warning, #F59E0B)] fill-[var(--warning, #F59E0B)]' : 'text-[var(--text-muted)] opacity-30 hover:opacity-60'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => { setAdding(false); setForm({ studentName: '', content: '', rating: 5, type: 'student' }); }}>Бекор</button>
              <button className="btn btn-primary" onClick={addFeedback} disabled={!form.content.trim()}>
                <Send size={14} /> Юбориш
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setAdding(false)} />
        </dialog>
      )}
    </div>
  );
}

/* ═══════════════ Student Card ═══════════════ */
function StudentCard({ s, onRemove }) {
  return (
    <div className="glass-strong rounded-[16px] p-4 card-hover-premium group">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-[14px] font-extrabold bg-[var(--green-bg)] text-[var(--green)] transition-transform duration-300 group-hover:scale-105">
          {initials(s)}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[13px] font-bold text-[var(--text)] truncate block">{fullName(s)}</span>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-[var(--text-muted)]">
            {s.login_code || s.loginCode ? (
              <span className="font-mono flex items-center gap-1">
                <KeyRound size={10} /> {s.login_code || s.loginCode}
              </span>
            ) : null}
            {s.phone && (
              <span className="flex items-center gap-1">
                <Phone size={10} /> {s.phone}
              </span>
            )}
          </div>
        </div>
        <button
          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--danger-light)] hover:text-[var(--danger)] transition-all opacity-0 group-hover:opacity-100"
          title="Убрать из группы"
          onClick={() => onRemove(s.id)}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════ Main GroupDetail ═══════════════ */
export default function AdminGroupDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const { data, isLoading, error, refetch } = useAdminGroupDetail(id);
  const { data: studentsData } = useAdminStudents();
  const [adding, setAdding] = useState(false);
  const [pick, setPick] = useState('');
  const [activeTab, setActiveTab] = useState('attendance');

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
        <div className="mt-6"><SkeletonTable cols={2} /></div>
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
    <div className="space-y-6 pb-8">
      {/* Back link */}
      <Link to="/groups" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--text-muted)] hover:text-[var(--green)] transition-colors animate-fade-in">
        <ArrowLeft size={16} /> К группам
      </Link>

      <PageHeader title={group.name || 'Группа'} subtitle={group.mentor?.name ? `Ментор: ${group.mentor.name}` : undefined}>
        <button className="btn btn-primary btn-sm gap-1" onClick={() => setAdding(true)}>
          <UserPlus size={16} /> Добавить студента
        </button>
      </PageHeader>

      {/* Stats bar */}
      <div className="glass-strong rounded-[16px] p-4 flex items-center gap-6 animate-fade-in stagger-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-[var(--green-bg)] text-[var(--green)]">
            <Users size={18} />
          </div>
          <div>
            <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">Студентов</div>
            <div className="text-[20px] font-extrabold text-[var(--text)] tabular-nums leading-none mt-0.5">{students.length}</div>
          </div>
        </div>
        {group.mentor?.name && (
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center bg-[#3B82F615] text-[#3B82F6]">
              <GraduationCap size={18} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">Ментор</div>
              <div className="text-[14px] font-bold text-[var(--text)] mt-0.5">{group.mentor.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="glass-strong rounded-[14px] p-1.5 flex gap-1 animate-fade-in stagger-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-semibold transition-all duration-200 flex-1 justify-center ${
                isActive
                  ? 'bg-[var(--green)] text-white shadow-md'
                  : 'text-[var(--text-muted)] hover:bg-[var(--green-bg)] hover:text-[var(--green)]'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in stagger-3">
        {activeTab === 'attendance' && <AttendanceTab groupId={id} students={students} />}
        {activeTab === 'homework' && <HomeworkTab groupId={id} />}
        {activeTab === 'feedback' && <FeedbackTab groupId={id} />}
      </div>

      {/* Add Modal */}
      {adding && (
        <dialog className="modal modal-open">
          <div className="modal-box glass-strong border border-[var(--border)]">
            <h3 className="font-bold text-lg mb-4">Добавить студента в группу</h3>
            <select className="select select-bordered w-full" value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Выберите студента…</option>
              {candidates.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
            </select>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setAdding(false)}>Отмена</button>
              <button className="btn btn-primary" onClick={add} disabled={!pick}>Добавить</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setAdding(false)} />
        </dialog>
      )}
    </div>
  );
}
