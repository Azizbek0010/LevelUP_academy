import { useState, useMemo, useCallback } from 'react';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlinePencilSquare, HiOutlineLockClosed, HiOutlineLockOpen, HiOutlineDevicePhoneMobile, HiOutlineEnvelope, HiOutlineBookOpen } from 'react-icons/hi2';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Input from '../components/Input.jsx';
import EmptyState from '../components/EmptyState.jsx';

const MOCK_MENTORS = [
  { id: 1, name: 'Aziz Karimov', phone: '+998 90 111 22 33', email: 'aziz@example.com', groupsCount: 2, status: 'active', specialty: 'Frontend' },
  { id: 2, name: 'Jasur Toshmatov', phone: '+998 91 222 33 44', email: 'jasur@example.com', groupsCount: 3, status: 'active', specialty: 'Backend' },
  { id: 3, name: 'Malika Rahimova', phone: '+998 93 333 44 55', email: 'malika@example.com', groupsCount: 1, status: 'active', specialty: 'Design' },
  { id: 4, name: 'Sevara Azizova', phone: '+998 90 444 55 66', email: 'sevara@example.com', groupsCount: 1, status: 'frozen', specialty: 'English' },
  { id: 5, name: 'Rustam Yuldashev', phone: '+998 94 555 66 77', email: 'rustam@example.com', groupsCount: 2, status: 'active', specialty: 'Math' },
  { id: 6, name: 'Dilmurod Ergashev', phone: '+998 91 666 77 88', email: 'dilmurod@example.com', groupsCount: 1, status: 'active', specialty: 'Mobile' },
  { id: 7, name: 'Gulnora Sobirova', phone: '+998 93 777 88 99', email: 'gulnora@example.com', groupsCount: 0, status: 'frozen', specialty: 'IELTS' },
];

export default function Mentors() {
  const [mentors, setMentors] = useState(MOCK_MENTORS);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMentor, setEditMentor] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', specialty: '', status: 'active' });

  const filtered = useMemo(() => mentors.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.phone.includes(search)
  ), [mentors, search]);

  const openAddModal = () => {
    setEditMentor(null);
    setFormData({ name: '', phone: '', email: '', specialty: '', status: 'active' });
    setModalOpen(true);
  };

  const openEditModal = (mentor) => {
    setEditMentor(mentor);
    setFormData({ name: mentor.name, phone: mentor.phone, email: mentor.email, specialty: mentor.specialty, status: mentor.status });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editMentor) {
      setMentors(mentors.map((m) => m.id === editMentor.id ? { ...m, ...formData } : m));
    } else {
      setMentors([...mentors, { id: Date.now(), ...formData, groupsCount: 0 }]);
    }
    setModalOpen(false);
  };

  const toggleStatus = (id) => {
    setMentors(mentors.map((m) => m.id === id ? { ...m, status: m.status === 'active' ? 'frozen' : 'active' } : m));
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 sm:max-w-md w-full">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input placeholder="Mentorlarni qidirish..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors" />
        </div>
        <Button variant="primary" size="sm" onClick={openAddModal} className="sm:flex-none">
          <HiOutlinePlus className="w-4 h-4" />
          Mentor qo'shish
        </Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Mentorlar topilmadi" description="Yangi mentor qo'shishingiz mumkin" action={{ label: 'Qo\'shish', onClick: openAddModal }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((mentor) => (
            <div key={mentor.id} className="glass-strong rounded-[20px] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[12px] bg-[var(--green)] flex items-center justify-center text-[#141B10] font-extrabold text-[14px]">
                    {mentor.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-[var(--text)]">{mentor.name}</h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">{mentor.specialty}</p>
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
                  {mentor.email}
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
                <button onClick={() => toggleStatus(mentor.id)}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-[10px] text-[11px] font-semibold border transition-all"
                  style={{
                    borderColor: mentor.status === 'active' ? 'var(--danger)' : 'var(--border)',
                    color: mentor.status === 'active' ? 'var(--danger)' : 'var(--text-secondary)',
                    background: mentor.status === 'active' ? 'rgba(232,84,62,0.08)' : 'transparent',
                  }}>
                  {mentor.status === 'active' ? <HiOutlineLockClosed className="w-3.5 h-3.5" /> : <HiOutlineLockOpen className="w-3.5 h-3.5" />}
                  {mentor.status === 'active' ? 'Bloklash' : 'Blokni ochish'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <Modal title={editMentor ? 'Mentorni tahrirlash' : 'Mentor qo\'shish'} onClose={() => setModalOpen(false)}>
          <div className="space-y-4">
            <Input label="Ism" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Mentor ismi" />
            <Input label="Telefon" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+998 XX XXX XX XX" />
            <Input label="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@example.com" />
            <Input label="Mutaxassislik" value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} placeholder="Frontend, Backend..." />
            <div>
              <label className="block text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full h-10 px-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)]">
                <option value="active">Faol</option>
                <option value="frozen">Muzlatilgan</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
              <Button variant="primary" size="sm" onClick={handleSave}>{editMentor ? 'Saqlash' : 'Qo\'shish'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
