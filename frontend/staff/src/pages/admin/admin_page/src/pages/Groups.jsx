import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineChevronRight, HiOutlineUser, HiOutlineClock, HiOutlineHomeModern } from 'react-icons/hi2';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Input from '../components/Input.jsx';
import EmptyState from '../components/EmptyState.jsx';

const MOCK_GROUPS = [
  { id: 1, name: 'Frontend N13', mentor: 'Aziz Karimov', time: '09:00 - 11:00', days: 'Dush/Chor/Juma', room: '201', students: 12, maxStudents: 15, status: 'active' },
  { id: 2, name: 'Backend N7', mentor: 'Jasur Toshmatov', time: '11:00 - 13:00', days: 'Sesh/Pay/Shan', room: '103', students: 15, maxStudents: 15, status: 'full' },
  { id: 3, name: 'Design N2', mentor: 'Malika Rahimova', time: '14:00 - 16:00', days: 'Dush/Chor', room: '305', students: 8, maxStudents: 12, status: 'active' },
  { id: 4, name: 'English B1', mentor: 'Sevara Azizova', time: '16:00 - 18:00', days: 'Sesh/Pay', room: '202', students: 3, maxStudents: 12, status: 'starting' },
  { id: 5, name: 'Math Advanced', mentor: 'Rustam Yuldashev', time: '10:00 - 12:00', days: 'Shan/Yak', room: '101', students: 10, maxStudents: 12, status: 'active' },
  { id: 6, name: 'Mobile Dev N4', mentor: 'Dilmurod Ergashev', time: '13:00 - 15:00', days: 'Dush/Chor/Juma', room: '204', students: 14, maxStudents: 15, status: 'full' },
  { id: 7, name: 'IELTS Prep', mentor: 'Gulnora Sobirova', time: '09:00 - 11:00', days: 'Sesh/Pay/Shan', room: '301', students: 6, maxStudents: 10, status: 'starting' },
  { id: 8, name: 'Python N2', mentor: 'Temur Abdurahimov', time: '15:00 - 17:00', days: 'Dush/Chor/Juma', room: '104', students: 0, maxStudents: 12, status: 'archived' },
];

const FILTERS = ['All', 'Active', 'Full', 'Starting', 'Archived'];

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState(MOCK_GROUPS);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', mentor: '', time: '', days: '', room: '', maxStudents: 12 });

  const filtered = useMemo(() => groups.filter((g) => {
    if (filter !== 'All' && g.status !== filter.toLowerCase()) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [groups, filter, search]);

  const counts = useMemo(() => ({
    All: groups.length,
    Active: groups.filter((g) => g.status === 'active').length,
    Full: groups.filter((g) => g.status === 'full').length,
    Starting: groups.filter((g) => g.status === 'starting').length,
    Archived: groups.filter((g) => g.status === 'archived').length,
  }), [groups]);

  const handleSave = () => {
    setGroups([...groups, { id: Date.now(), ...formData, students: 0 }]);
    setModalOpen(false);
  };

  const progressColor = (pct) => pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#10B981';

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            name="search-groups"
            placeholder="Guruh nomi bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none hover:border-[var(--green)] focus:border-[var(--green)] transition-colors"
          />
        </div>
        <Button variant="primary" size="sm" onClick={() => { setFormData({ name: '', mentor: '', time: '', days: '', room: '', maxStudents: 12 }); setModalOpen(true); }}>
          <HiOutlinePlus className="w-4 h-4" />
          Yangi guruh
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-4 py-2 rounded-[10px] text-[12px] font-semibold transition-all hover:text-[var(--text)]"
            style={{
              background: filter === f ? 'var(--green)' : 'var(--surface)',
              color: filter === f ? '#141B10' : 'var(--text-secondary)',
              border: `1px solid ${filter === f ? 'var(--green)' : 'var(--border)'}`,
            }}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <EmptyState title="Guruhlar topilmadi" description="Yangi guruh yarating" action={{ label: 'Yangi guruh', onClick: () => setModalOpen(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((group) => {
            const progress = Math.round((group.students / group.maxStudents) * 100);
            return (
              <div
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="glass-strong rounded-[20px] card-hover-premium p-5 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[15px] font-bold text-[var(--text)]">{group.name}</h3>
                  <Badge status={group.status} />
                </div>
                <div className="space-y-1.5 text-[12px] text-[var(--text-secondary)] mb-4">
                  <p className="flex items-center gap-1.5"><HiOutlineUser className="w-3.5 h-3.5 shrink-0" /> {group.mentor}</p>
                  <p className="flex items-center gap-1.5"><HiOutlineClock className="w-3.5 h-3.5 shrink-0" /> {group.time} · {group.days}</p>
                  <p className="flex items-center gap-1.5"><HiOutlineHomeModern className="w-3.5 h-3.5 shrink-0" /> Xona {group.room}</p>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    Student: <span className="text-[var(--text)]">{group.students}/{group.maxStudents}</span>
                  </span>
                  <span className="text-[11px] font-bold" style={{ color: progressColor(progress) }}>{progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progressColor(progress) }} />
                </div>
                <div className="flex justify-end mt-3">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-[var(--green)]">
                    Batafsil <HiOutlineChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Yangi guruh yaratish">
        <div className="space-y-4">
          <Input label="Guruh nomi" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Frontend N13" />
          <Input label="Mentor" value={formData.mentor} onChange={(e) => setFormData({ ...formData, mentor: e.target.value })} placeholder="Ism familiya" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Vaqt" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} placeholder="09:00 - 11:00" />
            <Input label="Kunlar" value={formData.days} onChange={(e) => setFormData({ ...formData, days: e.target.value })} placeholder="Dush/Chor/Juma" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Xona" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} placeholder="201" />
            <Input label="Maks. o'rin" type="number" value={formData.maxStudents} onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)}>Bekor qilish</Button>
            <Button variant="primary" size="sm" onClick={handleSave}>Yaratish</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
