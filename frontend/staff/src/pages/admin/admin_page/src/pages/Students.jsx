import { useState, useMemo, useCallback, memo } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineKey, HiOutlineStar, HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Input from '../components/Input.jsx';
import EmptyState from '../components/EmptyState.jsx';

// ─── Backend model: student = { id, firstName, lastName, phone, status, login, password, coinBalance, totalDebt, hasParent, groups: [{id, name}], createdAt } ───

function generateLogin(firstName, lastName) {
  const base = (firstName + lastName).toLowerCase().replace(/[^a-z]/g, '');
  const suffix = Math.floor(10 + Math.random() * 90); // 2 xonali son
  return base.slice(0, 10) + suffix;
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let pwd = '';
  for (let i = 0; i < 8; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

const ITEMS_PER_PAGE = 10;

const MOCK_GROUPS = [
  { id: 'g1', name: 'Frontend N13' },
  { id: 'g2', name: 'Backend N7' },
  { id: 'g3', name: 'Design N2' },
  { id: 'g4', name: 'Data Science' },
];

const MOCK_STUDENTS = [
  { id: 's1', firstName: 'Abdulloh', lastName: 'Karimov', phone: '+998 90 123 45 67', status: 'active', login: 'abdulloh12', password: 'KwR7pX3m', coinBalance: 250, totalDebt: 0, hasParent: true, groups: [{ id: 'g1', name: 'Frontend N13' }], createdAt: '2026-01-15' },
  { id: 's2', firstName: 'Odiljon', lastName: 'Rahimov', phone: '+998 91 234 56 78', status: 'active', login: 'odiljon45', password: 'bN8sV2kL', coinBalance: 180, totalDebt: 0, hasParent: false, groups: [{ id: 'g2', name: 'Backend N7' }], createdAt: '2026-02-10' },
  { id: 's3', firstName: 'Hamidulla', lastName: 'Sobirov', phone: '+998 93 345 67 89', status: 'active', login: 'hamidulla78', password: 'xJ5mR9qW', coinBalance: 90, totalDebt: 450000, hasParent: true, groups: [{ id: 'g1', name: 'Frontend N13' }], createdAt: '2026-01-20' },
  { id: 's4', firstName: 'Malika', lastName: 'Azizova', phone: '+998 90 456 78 90', status: 'active', login: 'malika33', password: 'pF2tH7cN', coinBalance: 310, totalDebt: 0, hasParent: false, groups: [{ id: 'g3', name: 'Design N2' }], createdAt: '2026-03-05' },
  { id: 's5', firstName: 'Javohir', lastName: 'Toshmatov', phone: '+998 94 567 89 01', status: 'frozen', login: 'javohir56', password: 'dK9wB4mX', coinBalance: 45, totalDebt: 0, hasParent: false, groups: [{ id: 'g2', name: 'Backend N7' }], createdAt: '2026-01-08' },
  { id: 's6', firstName: 'Zarina', lastName: 'Nurmatova', phone: '+998 91 678 90 12', status: 'active', login: 'zarina91', password: 'gH3nR8vP', coinBalance: 420, totalDebt: 0, hasParent: true, groups: [{ id: 'g1', name: 'Frontend N13' }], createdAt: '2026-04-12' },
  { id: 's7', firstName: 'Dilmurod', lastName: 'Ergashev', phone: '+998 93 789 01 23', status: 'active', login: 'dilmurod27', password: 'tL6fW2kS', coinBalance: 0, totalDebt: 320000, hasParent: false, groups: [{ id: 'g3', name: 'Design N2' }], createdAt: '2026-02-28' },
  { id: 's8', firstName: 'Sevara', lastName: 'Abdullaeva', phone: '+998 90 890 12 34', status: 'active', login: 'sevara64', password: 'mC1zX9qJ', coinBalance: 195, totalDebt: 0, hasParent: true, groups: [{ id: 'g2', name: 'Backend N7' }], createdAt: '2026-03-20' },
  { id: 's9', firstName: 'Rustam', lastName: 'Yuldashev', phone: '+998 94 901 23 45', status: 'frozen', login: 'rustam82', password: 'hR4eT6aL', coinBalance: 120, totalDebt: 150000, hasParent: false, groups: [{ id: 'g1', name: 'Frontend N13' }], createdAt: '2026-01-25' },
  { id: 's10', firstName: 'Nodira', lastName: 'Alimova', phone: '+998 91 012 34 56', status: 'active', login: 'nodira15', password: 'wK8fV3nG', coinBalance: 280, totalDebt: 0, hasParent: false, groups: [{ id: 'g3', name: 'Design N2' }], createdAt: '2026-04-05' },
  { id: 's11', firstName: 'Bexruz', lastName: 'Salimov', phone: '+998 93 123 45 67', status: 'active', login: 'bexruz39', password: 'qP5jM2rX', coinBalance: 160, totalDebt: 0, hasParent: true, groups: [{ id: 'g2', name: 'Backend N7' }], createdAt: '2026-05-01' },
  { id: 's12', firstName: 'Gulnora', lastName: 'Rahimova', phone: '+998 90 234 56 78', status: 'active', login: 'gulnora73', password: 'vN9yH6dK', coinBalance: 75, totalDebt: 500000, hasParent: false, groups: [{ id: 'g1', name: 'Frontend N13' }], createdAt: '2026-02-14' },
];

const STATUS_FILTERS = ['All', 'Active', 'Frozen', 'Dropped'];

function formatCurrency(n) {
  return Number(n || 0).toLocaleString('uz-UZ') + " so'm";
}

export default function Students() {
  const [students, setStudents] = useState(MOCK_STUDENTS);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', groupId: '', status: 'active' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showCredentials, setShowCredentials] = useState({});
  const [newStudentCreds, setNewStudentCreds] = useState(null); // { login, password } after add

  // ⚡ PERFORMANCE: Memoized filter — avoids re-filtering on unrelated state changes
  const filtered = useMemo(() => students.filter((s) => {
    if (statusFilter !== 'All' && s.status !== statusFilter.toLowerCase()) return false;
    if (search) {
      const q = search.toLowerCase();
      const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
      if (!fullName.includes(q) && !s.phone.includes(q) && !(s.login || '').toLowerCase().includes(q)) return false;
    }
    return true;
  }), [students, statusFilter, search]);

  const totalPages = useMemo(() => Math.ceil(filtered.length / ITEMS_PER_PAGE), [filtered.length]);
  const paginated = useMemo(() => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE), [filtered, page]);

  const getStatusCount = useCallback((status) =>
    status === 'All' ? students.length : students.filter((s) => s.status === status.toLowerCase()).length,
  [students]);

  // ─── Modal actions ───
  const openAddModal = () => {
    setEditStudent(null);
    setFormData({ firstName: '', lastName: '', phone: '', groupId: '', status: 'active' });
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditStudent(student);
    setFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone,
      groupId: student.groups[0]?.id || '',
      status: student.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editStudent) {
      setStudents(students.map((s) =>
        s.id === editStudent.id
          ? {
              ...s,
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              status: formData.status,
              groups: formData.groupId
                ? [{ id: formData.groupId, name: MOCK_GROUPS.find((g) => g.id === formData.groupId)?.name || '' }]
                : [],
            }
          : s
      ));
      setModalOpen(false);
    } else {
      const newGroup = formData.groupId ? MOCK_GROUPS.find((g) => g.id === formData.groupId) : null;
      const login = generateLogin(formData.firstName, formData.lastName);
      const password = generatePassword();
      const newStudent = {
        id: `s${Date.now()}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        status: formData.status,
        login,
        password,
        coinBalance: 0,
        totalDebt: 0,
        hasParent: false,
        groups: newGroup ? [{ id: newGroup.id, name: newGroup.name }] : [],
        createdAt: new Date().toISOString().slice(0, 10),
      };
      setStudents([...students, newStudent]);
      setNewStudentCreds({ login, password, firstName: formData.firstName, lastName: formData.lastName });
      setFormData({ firstName: '', lastName: '', phone: '', groupId: '', status: 'active' });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setStudents(students.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  // ─── Render ───
  return (
    <div className="space-y-4">
      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            placeholder="Ism, telefon yoki login orqali qidirish..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-10 pl-10 pr-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors"
            style={{ background: 'var(--surface)' }}
          />
        </div>
        <Button variant="primary" size="sm" onClick={openAddModal}>
          <HiOutlinePlus className="w-4 h-4" />
          Talaba qo‘shish
        </Button>
      </div>

      {/* Filter tabs — backend statuses: active, frozen, dropped, graduated */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => { setStatusFilter(status); setPage(1); }}
            className="px-4 py-2 rounded-[10px] text-[12px] font-semibold transition-all"
            style={{
              background: statusFilter === status ? 'var(--green)' : 'var(--surface)',
              color: statusFilter === status ? '#141B10' : 'var(--text-secondary)',
              border: `1px solid ${statusFilter === status ? 'var(--green)' : 'var(--border)'}`,
            }}
          >
            {status === 'Active' && 'Faol'}
            {status === 'Frozen' && 'Muzlatilgan'}
            {status === 'Dropped' && 'Tark etgan'}
            {status === 'All' && 'Barchasi'}
            {' '}({getStatusCount(status)})
          </button>
        ))}
      </div>

      {/* Table */}
      {paginated.length === 0 ? (
        <EmptyState
          title="Talabalar topilmadi"
          description={search ? 'Qidiruvni o‘zgartiring' : 'Hozircha talabalar yo‘q'}
          action={search ? undefined : { label: 'Talaba qo‘shish', onClick: openAddModal }}
        />
      ) : (
        <div className="glass-strong rounded-[20px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] border-b border-[var(--border)]">
                  <th className="px-5 py-3.5 w-12">№</th>
                  <th className="px-5 py-3.5">Ism / Familiya</th>
                  <th className="px-5 py-3.5">Telefon</th>
                  <th className="px-5 py-3.5">Login / Parol</th>
                  <th className="px-5 py-3.5">Guruhlar</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Qarz</th>
                  <th className="px-5 py-3.5 text-right">Koin</th>
                  <th className="px-5 py-3.5 text-right w-20">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((student, i) => (
                  <tr
                    key={student.id}
                    className="border-t border-[var(--border)] text-[13px] transition-colors hover:bg-[var(--surface-hover)]"
                  >
                    <td className="px-5 py-3.5 text-[var(--text-muted)]">{(page - 1) * ITEMS_PER_PAGE + i + 1}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-[10px] bg-[var(--green-bg)] flex items-center justify-center text-[11px] font-bold text-[var(--text)]">
                          {student.firstName[0]}{student.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text)]">{student.firstName} {student.lastName}</div>
                          {student.hasParent && <div className="text-[9px] text-[var(--text-muted)]">+ ota-ona</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[var(--text-secondary)] tabular-nums">{student.phone}</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setShowCredentials((prev) => ({ ...prev, [student.id]: !prev[student.id] }))}
                        className="flex flex-col items-start gap-0.5 text-[11px] font-mono tracking-wider text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors"
                      >
                        {showCredentials[student.id] ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="flex items-center gap-1">
                              <HiOutlineKey className="w-3 h-3 shrink-0" />
                              Login: <strong>{student.login}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <HiOutlineKey className="w-3 h-3 shrink-0" />
                              Parol: <strong>{student.password}</strong>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <HiOutlineKey className="w-3.5 h-3.5 shrink-0" />
                            <span>•••• / ••••••••</span>
                          </div>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {student.groups.map((g) => (
                          <span
                            key={g.id}
                            className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-[9px] font-semibold"
                            style={{ background: 'var(--green-bg)', color: 'var(--text)' }}
                          >
                            {g.name}
                          </span>
                        ))}
                        {student.groups.length === 0 && (
                          <span className="text-[10px] text-[var(--text-muted)]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge status={student.status === 'frozen' ? 'frozen' : student.status === 'dropped' ? 'inactive' : 'active'} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`font-semibold tabular-nums ${student.totalDebt > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                        {student.totalDebt > 0 ? formatCurrency(student.totalDebt) : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="flex items-center justify-end gap-1 font-semibold tabular-nums text-[var(--text)]">
                        <HiOutlineStar className="w-3 h-3 text-[#F59E0B]" />
                        {student.coinBalance}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(student)}
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] transition-all"
                          title="Tahrirlash"
                        >
                          <HiOutlinePencilSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(student)}
                          className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[rgba(232,84,62,0.1)] transition-all"
                          title="O‘chirish"
                        >
                          <HiOutlineTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)]">
              <span className="text-[11px] text-[var(--text-muted)]">
                {filtered.length} talaba — {page} / {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] disabled:opacity-30 transition-all"
                >
                  <HiOutlineChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[12px] font-semibold transition-all"
                    style={{
                      background: p === page ? 'var(--green)' : 'transparent',
                      color: p === page ? '#141B10' : 'var(--text-secondary)',
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-hover)] disabled:opacity-30 transition-all"
                >
                  <HiOutlineChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal — backend POST /api/admin/students */}
      <Modal open={modalOpen} title={editStudent ? 'Talabani tahrirlash' : 'Yangi talaba qo‘shish'} onClose={() => setModalOpen(false)}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ism"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Ism"
            />
            <Input
              label="Familiya"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Familiya"
            />
          </div>
          <Input
            label="Telefon"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+998 XX XXX XX XX"
          />
          <div>
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-[0.06em]">Guruh</label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              className="w-full h-10 px-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238FA283' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option value="">Guruh tanlanmagan</option>
              {MOCK_GROUPS.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full h-10 px-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors"
            >
              <option value="active">Faol</option>
              <option value="frozen">Muzlatilgan</option>
            </select>
          </div>
          {!editStudent && (
            <div className="rounded-[12px] p-3" style={{ background: 'var(--green-bg)' }}>
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                Talaba avtomatik login va parol bilan yaratiladi. Qo'shgandan so'ng
                login va parol ma'lumotlari ko'rsatiladi.
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {editStudent ? 'Saqlash' : 'Qo‘shish'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* New Student Credentials Modal */}
      <Modal open={!!newStudentCreds} title="Talaba yaratildi" onClose={() => setNewStudentCreds(null)}>
        <div className="space-y-4">
          <p className="text-[13px] text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text)]">{newStudentCreds?.firstName} {newStudentCreds?.lastName}</span>{" "}
            uchun login va parol yaratildi:
          </p>
          <div className="rounded-[16px] p-4 space-y-3" style={{ background: 'var(--green-bg)' }}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Login</span>
              <span className="text-[14px] font-mono font-bold text-[var(--text)] tracking-wider">{newStudentCreds?.login}</span>
            </div>
            <div className="border-t border-[var(--border)]" />
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-semibold text-[var(--text-secondary)]">Parol</span>
              <span className="text-[14px] font-mono font-bold text-[var(--text)] tracking-wider">{newStudentCreds?.password}</span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--text-muted)]">
            Ushbu ma'lumotlarni talabaga bering. Keyinroq sozlamalarda o'zgartirish mumkin.
          </p>
          <div className="flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setNewStudentCreds(null)}>
              Tushunarli
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} title="Talabani o‘chirish" onClose={() => setDeleteTarget(null)}>
        <div className="space-y-5">
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--text)]">{deleteTarget?.firstName} {deleteTarget?.lastName}</span>{" "}
            ni o‘chirishni xohlaysizmi? Bu amalni qaytarib bo‘lmaydi.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)}>Bekor qilish</Button>
            <Button variant="danger" size="sm" onClick={handleDelete}>O‘chirish</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
