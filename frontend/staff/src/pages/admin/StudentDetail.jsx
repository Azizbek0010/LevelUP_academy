import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, GraduationCap, Phone, Coins, Calendar, Wallet, Mail, User, BookOpen } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminStudentDetail } from '../../queries.js';
import { useAdminInvoices } from '../../queries.js';
import { money, dateShort } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { SkeletonTable } from '../../components/Skeleton.jsx';

const STATUS = {
  paid: { label: 'Оплачен', bg: '#2ECC7115', text: '#2ECC71' },
  partially_paid: { label: 'Частично', bg: '#F59E0B15', text: '#F59E0B' },
  pending: { label: 'Ожидает', bg: '#6B728015', text: '#6B7280' },
  overdue: { label: 'Просрочен', bg: '#E8543E15', text: '#E8543E' },
  cancelled: { label: 'Отменён', bg: '#6B728008', text: '#6B7280' },
};

const STATUS_COLORS = {
  active: { bg: '#2ECC7115', text: '#2ECC71', label: 'Активен' },
  frozen: { bg: '#E8543E15', text: '#E8543E', label: 'Заморожен' },
};

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { data, isLoading, error } = useAdminStudentDetail(id);
  const { data: invoicesData } = useAdminInvoices(`?limit=100`);

  const raw = data?.data || data || {};
  const student = raw.student || raw;
  const invoices = invoicesData?.data?.invoices || invoicesData?.invoices || [];
  const studentInvoices = invoices.filter(
    (inv) => (inv.studentId || inv.student_id) === id || (inv.student || inv.studentName || '').toLowerCase().includes((student.firstName || '').toLowerCase())
  );

  const name = [student.firstName || student.first_name, student.lastName || student.last_name].filter(Boolean).join(' ') || (student.student || student.studentName || '—');
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  const status = STATUS_COLORS[student.status] || STATUS_COLORS.active;
  const groupsData = student.groups || [];

  const totalPaid = studentInvoices
    .filter((inv) => inv.status === 'paid' || inv.status === 'partially_paid')
    .reduce((sum, inv) => sum + Number(inv.paidAmount || inv.paid_amount || 0), 0);
  const totalDue = studentInvoices
    .filter((inv) => inv.status === 'pending' || inv.status === 'overdue')
    .reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0) - Number(inv.paidAmount || inv.paid_amount || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader title="Загрузка..." />
        <SkeletonTable cols={4} />
      </div>
    );
  }

  if (error || !student.id) {
    return (
      <div className="space-y-6 pb-8">
        <PageHeader title="Студент не найден" subtitle="Проверьте ссылку">
          <Link to="/students" className="btn btn-ghost btn-sm gap-1">
            <ArrowLeft size={14} /> К списку
          </Link>
        </PageHeader>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-page-enter">
      <PageHeader title={name} subtitle="Профиль студента">
        <Link to="/students" className="h-9 px-4 rounded-[10px] flex items-center gap-1.5 text-[12px] font-bold transition-all hover:bg-[var(--surface)]" style={{ color: 'var(--text)' }}>
          <ArrowLeft size={14} /> Студенты
        </Link>
      </PageHeader>

      {/* ═══ Student Info Card ═══ */}
      <div className="glass-strong rounded-[20px] p-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-[22px] font-extrabold shrink-0"
            style={{ background: `${status.text}15`, color: status.text }}>
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-[20px] font-extrabold text-[var(--text)]">{name}</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                style={{ background: status.bg, color: status.text }}>
                {status.label}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {student.loginCode || student.login_code ? (
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                  <User size={14} /> <span className="font-semibold">Код:</span> {student.loginCode || student.login_code}
                </div>
              ) : null}
              {student.phone ? (
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                  <Phone size={14} /> <span className="font-semibold">Телефон:</span> {student.phone}
                </div>
              ) : null}
              {student.createdAt || student.created_at ? (
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                  <Calendar size={14} /> <span className="font-semibold">Создан:</span> {dateShort(student.createdAt || student.created_at)}
                </div>
              ) : null}
              {student.coins != null && (
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                  <Coins size={14} /> <span className="font-semibold">Коины:</span> {student.coins}
                </div>
              )}
              {student.email && (
                <div className="flex items-center gap-2 text-[13px] text-[var(--text-muted)]">
                  <Mail size={14} /> {student.email}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-strong rounded-[16px] p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: '#3B82F615', color: '#3B82F6' }}>
              <Wallet size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">Всего счетов</div>
              <div className="text-[20px] font-extrabold text-[var(--text)] tabular-nums leading-none mt-0.5">{studentInvoices.length}</div>
            </div>
          </div>
        </div>
        <div className="glass-strong rounded-[16px] p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: '#2ECC7115', color: '#2ECC71' }}>
              <Coins size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">Оплачено</div>
              <div className="text-[20px] font-extrabold tabular-nums leading-none mt-0.5" style={{ color: '#2ECC71' }}>{money(totalPaid)}</div>
            </div>
          </div>
        </div>
        <div className="glass-strong rounded-[16px] p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: '#F59E0B15', color: '#F59E0B' }}>
              <Calendar size={18} strokeWidth={2.2} />
            </div>
            <div>
              <div className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.05em]">Долг</div>
              <div className="text-[20px] font-extrabold tabular-nums leading-none mt-0.5" style={{ color: totalDue > 0 ? '#E8543E' : '#2ECC71' }}>{totalDue > 0 ? money(totalDue) : '0 UZS'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Groups ═══ */}
      {groupsData.length > 0 && (
        <div className="glass-strong rounded-[16px] p-5">
          <h3 className="text-[13px] font-bold text-[var(--text)] mb-3 flex items-center gap-2">
            <BookOpen size={16} /> Группы
          </h3>
          <div className="flex flex-wrap gap-2">
            {groupsData.map((g, i) => (
              <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-[10px] text-[12px] font-semibold"
                style={{ background: 'var(--surface)', color: 'var(--text)' }}>
                {g.name || g.subject || g.groupName || '—'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Payment History ═══ */}
      <div className="glass-strong rounded-[16px] p-5">
        <h3 className="text-[13px] font-bold text-[var(--text)] mb-3 flex items-center gap-2">
          <Wallet size={16} /> История платежей
        </h3>
        {studentInvoices.length === 0 ? (
          <p className="text-[12px] text-[var(--text-muted)] text-center py-4">Нет платежей</p>
        ) : (
          <div className="space-y-2">
            {studentInvoices.map((inv, i) => {
              const st = STATUS[inv.status] || STATUS.pending;
              const total = Number(inv.totalAmount || inv.amount || 0);
              const paid = Number(inv.paidAmount || inv.paid_amount || 0);
              return (
                <div key={inv.id || i} className="flex items-center justify-between p-3 rounded-[12px] hover:bg-[var(--surface)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] flex items-center justify-center" style={{ background: st.bg }}>
                      <Wallet size={14} style={{ color: st.text }} />
                    </div>
                    <div>
                      <div className="text-[12px] font-bold text-[var(--text)]">{money(total)}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{inv.group || inv.groupName || '—'} · {dateShort(inv.dueDate || inv.due_date)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: st.bg, color: st.text }}>
                      {st.label}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{money(paid)} оплачено</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
