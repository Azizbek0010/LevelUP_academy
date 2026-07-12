import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlinePencilSquare,
  HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineTrash,
  HiOutlineDevicePhoneMobile, HiOutlineEnvelope, HiOutlineBookOpen,
  HiOutlineArrowPath, HiOutlineInformationCircle,
} from 'react-icons/hi2';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Input from '../components/Input.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  fetchMentors as apiFetchMentors,
  createMentor as apiCreateMentor,
  updateMentor as apiUpdateMentor,
  freezeMentor as apiFreezeMentor,
  deleteMentor as apiDeleteMentor,
} from '../services/adminService.js';

// ─── Backend model: mentor = { id, firstName, lastName, phone, email, specialty, status, groupsCount } ───

export default function Mentors() {
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editMentor, setEditMentor] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '', specialty: '', status: 'active',
  });

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Freeze modal
  const [freezeTarget, setFreezeTarget] = useState(null);

  const loadTimerRef = useRef(null);

  // ─── Data fetching ─────────────────────────────────────────

  const loadMentors = useCallback(async (searchQuery) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      const data = await apiFetchMentors(params);
      const mapped = (data.mentors || []).map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        phone: m.phone,
        email: m.email,
        specialty: m.specialty,
        status: m.status,
        groupsCount: m.groupsCount || 0,
      }));
      setMentors(mapped);
    } catch (err) {
      console.error('Failed to load mentors:', err);
      setError(err.response?.data?.message || err.message || 'Mentorlarni yuklashda xatolik');
      setMentors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMentors();
  }, [loadMentors]);

  // Debounced search
  useEffect(() => {
    if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    loadTimerRef.current = setTimeout(() => {
      loadMentors(search || undefined);
    }, 350);
    return () => {
      if (loadTimerRef.current) clearTimeout(loadTimerRef.current);
    };
  }, [search, loadMentors]);

  // ─── Filter (client-side, by search only — no status tabs) ─

  const filtered = useMemo(() => mentors.filter((m) =>
    !search
    || m.firstName?.toLowerCase().includes(search.toLowerCase())
    || m.lastName?.toLowerCase().includes(search.toLowerCase())
    || m.phone?.includes(search)
    || m.specialty?.toLowerCase().includes(search.toLowerCase())
  ), [mentors, search]);

  // ─── Modal actions ─────────────────────────────────────────

  const openAddModal = () => {
    setEditMentor(null);
    setFormData({ firstName: '', lastName: '', phone: '', email: '', specialty: '', status: 'active' });
    setModalOpen(true);
  };

  const openEditModal = (mentor) => {
    setEditMentor(mentor);
    setFormData({
      firstName: mentor.firstName,
      lastName: mentor.lastName,
      phone: mentor.phone,
      email: mentor.email || '',
      specialty: mentor.specialty || '',
      status: mentor.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (editMentor) {
        await apiUpdateMentor(editMentor.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email || undefined,
          specialty: formData.specialty || undefined,
        });
        setModalOpen(false);
        await loadMentors(search || undefined);
      } else {
        await apiCreateMentor({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          email: formData.email || undefined,
          specialty: formData.specialty || undefined,
        });
        setFormData({ firstName: '', lastName: '', phone: '', email: '', specialty: '', status: 'active' });
        setModalOpen(false);
        await loadMentors(search || undefined);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setError(err.response?.data?.message || err.message || 'Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    setError(null);
    try {
      await apiDeleteMentor(deleteTarget.id);
      setDeleteTarget(null);
      await loadMentors(search || undefined);
    } catch (err) {
      console.error('Delete failed:', err);
      setError(err.response?.data?.message || err.message || "O'chirishda xatolik");
    } finally {
      setSaving(false);
    }
  };

  const handleFreezeToggle = async () => {
    if (!freezeTarget) return;
    const isFrozen = freezeTarget.status === 'frozen';
    setSaving(true);
    setError(null);
    try {
      await apiFreezeMentor(freezeTarget.id, !isFrozen);
      setFreezeTarget(null);
      await loadMentors(search || undefined);
    } catch (err) {
      console.error('Freeze/unfreeze failed:', err);
      setError(err.response?.data?.message || err.message || 'Amalni bajarishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const initials = (firstName, lastName) =>
    ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '??';

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[12px] font-semibold"
          style={{ background: 'rgba(232,84,62,0.12)', color: '#E8543E', border: '1px solid rgba(232,84,62,0.2)' }}
        >
          <HiOutlineInformationCircle className="w-4 h-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity">
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md w-full">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            placeholder="Ism, telefon yoki mutaxassislik bo'yicha qidirish..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
            className="w-full h-10 pl-10 pr-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <HiOutlineArrowPath className="w-4 h-4 text-[var(--text-muted)] animate-spin" />
            </div>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={openAddModal}>
          <HiOutlinePlus className="w-4 h-4" />
          Mentor qo'shish
        </Button>
      </div>

      {/* Cards */}
      {loading && mentors.length === 0 ? (
        <div className="glass-strong rounded-[20px] p-12 flex flex-col items-center justify-center">
          <HiOutlineArrowPath className="w-8 h-8 text-[var(--text-muted)] animate-spin mb-3" />
          <p className="text-[13px] text-[var(--text-secondary)]">Mentorlar yuklanmoqda...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Mentorlar topilmadi"
          description={search ? 'Qidiruvni o\'zgartiring' : 'Hozircha mentorlar yo‘q'}
          action={search ? undefined : { label: 'Mentor qo\'shish', onClick: openAddModal }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((mentor) => (
            <div key={mentor.id} className="glass-strong rounded-[20px] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-[var(--green)] flex items-center justify-center text-[#141B10] font-extrabold text-[14px]">
                    {initials(mentor.firstName, mentor.lastName)}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[var(--text)]">
                      {mentor.firstName} {mentor.lastName}
                    </h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">{mentor.specialty || '—'}</p>
                  </div>
                </div>
                <Badge variant={mentor.status === 'active' ? 'success' : 'default'} size="sm">
                  {mentor.status === 'active' ? 'Faol' : 'Muzlatilgan'}
                </Badge>
              </div>
              <div className="space-y-1.5 text-[12px] text-[var(--text-secondary)] mb-4">
                <p className="flex items-center gap-1.5">
                  <HiOutlineDevicePhoneMobile className="w-3.5 h-3.5 shrink-0" />
                  {mentor.phone}
                </p>
                <p className="flex items-center gap-1.5">
                  <HiOutlineEnvelope className="w-3.5 h-3.5 shrink-0" />
                  {mentor.email || '—'}
                </p>
                <p className="flex items-center gap-1.5">
                  <HiOutlineBookOpen className="w-3.5 h-3.5 shrink-0" />
                  {mentor.groupsCount} ta guruh
                </p>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                <button onClick={() => openEditModal(mentor)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[10px] text-[11px] font-semibold border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all text-[var(--text-secondary)]">
                  <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                  Tahrirlash
                </button>
                <button onClick={() => setFreezeTarget(mentor)}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-[10px] text-[11px] font-semibold border transition-all"
                  style={{
                    borderColor: mentor.status === 'active' ? 'var(--danger)' : 'var(--border)',
                    color: mentor.status === 'active' ? 'var(--danger)' : 'var(--text-secondary)',
                    background: mentor.status === 'active' ? 'rgba(232,84,62,0.08)' : 'transparent',
                  }}>
                  {mentor.status === 'active'
                    ? <HiOutlineLockClosed className="w-3.5 h-3.5" />
                    : <HiOutlineLockOpen className="w-3.5 h-3.5" />
                  }
                  {mentor.status === 'active' ? 'Bloklash' : 'Blokni ochish'}
                </button>
                <button onClick={() => setDeleteTarget(mentor)}
                  className="flex items-center justify-center p-2 rounded-[10px] text-[11px] font-semibold border border-[var(--border)] hover:bg-[rgba(232,84,62,0.08)] hover:text-[var(--danger)] transition-all text-[var(--text-secondary)]"
                  title="O'chirish">
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} title={editMentor ? 'Mentorni tahrirlash' : 'Mentor qo\'shish'} onClose={() => { if (!saving) setModalOpen(false); }}>
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
          <Input
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@example.com"
          />
          <Input
            label="Mutaxassislik"
            value={formData.specialty}
            onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
            placeholder="Frontend, Backend, IELTS..."
          />
          {error && (
            <div className="text-[11px] text-[var(--danger)] font-semibold rounded-[8px] px-3 py-2"
              style={{ background: 'rgba(232,84,62,0.08)' }}>
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>
              Bekor qilish
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !formData.firstName || !formData.lastName || !formData.phone}>
              {saving ? 'Saqlanmoqda...' : (editMentor ? 'Saqlash' : 'Qo\'shish')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteTarget} title="Mentorni o'chirish" onClose={() => { if (!saving) setDeleteTarget(null); }}>
        <div className="space-y-5">
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--text)]">
              {deleteTarget?.firstName} {deleteTarget?.lastName}
            </span>{' '}
            ni o‘chirishni xohlaysizmi? Bu amalni qaytarib bo‘lmaydi.
          </p>
          {error && (
            <div className="text-[11px] text-[var(--danger)] font-semibold rounded-[8px] px-3 py-2"
              style={{ background: 'rgba(232,84,62,0.08)' }}>
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(null)} disabled={saving}>Bekor qilish</Button>
            <Button variant="danger" size="sm" onClick={handleDelete} disabled={saving}>
              {saving ? "O'chirilmoqda..." : "O'chirish"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Freeze / Unfreeze Confirmation */}
      <Modal
        open={!!freezeTarget}
        title={freezeTarget?.status === 'frozen' ? 'Muzlatishni ochish' : 'Mentorni bloklash'}
        onClose={() => { if (!saving) setFreezeTarget(null); }}
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center"
              style={{ background: freezeTarget?.status === 'frozen' ? 'rgba(46,204,113,0.14)' : 'rgba(245,158,11,0.14)' }}
            >
              {freezeTarget?.status === 'frozen'
                ? <HiOutlineLockOpen className="w-5 h-5 text-[#2ECC71]" />
                : <HiOutlineLockClosed className="w-5 h-5 text-[#F59E0B]" />
              }
            </div>
            <div>
              <p className="text-[14px] font-bold text-[var(--text)]">
                {freezeTarget?.firstName} {freezeTarget?.lastName}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {freezeTarget?.status === 'frozen' ? 'Hozirda muzlatilgan' : 'Hozirda faol'}
              </p>
            </div>
          </div>
          <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
            {freezeTarget?.status === 'frozen'
              ? 'Mentorning blokini ochish — u yana tizimga kirishi va guruhlar bilan ishlashi mumkin bo\'ladi.'
              : 'Mentorni bloklash — u vaqtincha tizimga kira olmaydi va guruhlar bilan ishlashi cheklanadi. Bu amalni keyin ochish mumkin.'
            }
          </p>
          {error && (
            <div className="text-[11px] text-[var(--danger)] font-semibold rounded-[8px] px-3 py-2"
              style={{ background: 'rgba(232,84,62,0.08)' }}>
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setFreezeTarget(null)} disabled={saving}>Bekor qilish</Button>
            <Button
              variant={freezeTarget?.status === 'frozen' ? 'primary' : 'danger'}
              size="sm"
              onClick={handleFreezeToggle}
              disabled={saving}
            >
              {saving
                ? (freezeTarget?.status === 'frozen' ? 'Ochilmoqda...' : 'Bloklanmoqda...')
                : (freezeTarget?.status === 'frozen' ? 'Blokni ochish' : 'Bloklash')
              }
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
