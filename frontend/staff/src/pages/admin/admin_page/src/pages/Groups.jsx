import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineMagnifyingGlass, HiOutlinePlus, HiOutlineChevronRight, HiOutlineUser, HiOutlineClock, HiOutlineHomeModern, HiOutlineArrowPath } from 'react-icons/hi2';
import Badge from '../components/Badge.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Input from '../components/Input.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { fetchGroups as apiFetchGroups, createGroup as apiCreateGroup, fetchMentors as apiFetchMentors } from '../services/adminService.js';

const FILTERS = ['All', 'Active', 'Full', 'Starting', 'Archived'];

// Map API status
function mapStatus(group) {
  if (group.isArchived) return 'archived';
  if (group.students >= 15) return 'full';
  if (group.students === 0) return 'starting';
  return 'active';
}

// Format schedule array -> display string
function formatSchedule(schedule) {
  if (!schedule || !schedule.length) return '';
  const dayMap = { mon: 'Dush', tue: 'Sesh', wed: 'Chor', thu: 'Pay', fri: 'Juma', sat: 'Shan', sun: 'Yak' };
  const days = schedule.map((s) => dayMap[s.day] || s.day).filter(Boolean);
  const uniqueDays = [...new Set(days)];
  const time = schedule[0]?.start && schedule[0]?.end ? `${schedule[0].start} - ${schedule[0].end}` : '';
  return uniqueDays.length ? `${time ? time + ' · ' : ''}${uniqueDays.join('/')}` : '';
}

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', subject: '', mentorId: '', monthlyPrice: '', room: '', scheduleDays: '', scheduleStart: '', scheduleEnd: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchGroups({ limit: 100 });
      setGroups(data.groups || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
      setError(err.response?.data?.message || err.message || 'Guruhlarni yuklashda xatolik');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMentors = useCallback(async () => {
    try {
      const data = await apiFetchMentors();
      setMentors(data.mentors || []);
    } catch (err) {
      console.error('Failed to load mentors:', err);
      setMentors([]);
    }
  }, []);

  useEffect(() => {
    loadGroups();
    loadMentors();
  }, [loadGroups, loadMentors]);

  const filtered = useMemo(() => groups.filter((g) => {
    const status = mapStatus(g);
    if (filter !== 'All' && status !== filter.toLowerCase()) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [groups, filter, search]);

  const counts = useMemo(() => ({
    All: groups.length,
    Active: groups.filter((g) => mapStatus(g) === 'active').length,
    Full: groups.filter((g) => mapStatus(g) === 'full').length,
    Starting: groups.filter((g) => mapStatus(g) === 'starting').length,
    Archived: groups.filter((g) => mapStatus(g) === 'archived').length,
  }), [groups]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const schedule = [];
      if (formData.scheduleDays) {
        const dayMap = { Dush: 'mon', Sesh: 'tue', Chor: 'wed', Pay: 'thu', Juma: 'fri', Shan: 'sat', Yak: 'sun' };
        const days = formData.scheduleDays.split('/').map((d) => d.trim()).filter(Boolean);
        days.forEach((day) => {
          const mapped = dayMap[day] || day.toLowerCase().slice(0, 3);
          schedule.push({
            day: mapped,
            start: formData.scheduleStart || '09:00',
            end: formData.scheduleEnd || '11:00',
          });
        });
      }
      await apiCreateGroup({
        name: formData.name,
        subject: formData.subject || undefined,
        mentorId: formData.mentorId || undefined,
        monthlyPrice: formData.monthlyPrice ? Number(formData.monthlyPrice) : undefined,
        room: formData.room || undefined,
        schedule: schedule.length > 0 ? schedule : undefined,
      });
      setModalOpen(false);
      setFormData({ name: '', subject: '', mentorId: '', monthlyPrice: '', room: '', scheduleDays: '', scheduleStart: '', scheduleEnd: '' });
      await loadGroups();
    } catch (err) {
      console.error('Create group failed:', err);
      setError(err.response?.data?.message || err.message || 'Guruh yaratishda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const progressColor = (pct) => pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#10B981';
  const MAX_STUDENTS = 15;

  return (
    <div className="space-y-5">

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-[12px] text-[12px] font-semibold"
          style={{ background: 'rgba(232,84,62,0.12)', color: '#E8543E', border: '1px solid rgba(232,84,62,0.2)' }}
        >
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="hover:opacity-70 transition-opacity">
            <span className="text-[16px]">&times;</span>
          </button>
        </div>
      )}

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
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <HiOutlineArrowPath className="w-4 h-4 text-[var(--text-muted)] animate-spin" />
            </div>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={() => { setFormData({ name: '', subject: '', mentorId: '', monthlyPrice: '', room: '', scheduleDays: '', scheduleStart: '', scheduleEnd: '' }); setModalOpen(true); }}>
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

      {/* Loading */}
      {loading && groups.length === 0 ? (
        <div className="glass-strong rounded-[20px] p-12 flex flex-col items-center justify-center">
          <HiOutlineArrowPath className="w-8 h-8 text-[var(--text-muted)] animate-spin mb-3" />
          <p className="text-[13px] text-[var(--text-secondary)]">Guruhlar yuklanmoqda...</p>
        </div>
      ) : filtered.length === 0 && !loading ? (
        <EmptyState
          title="Guruhlar topilmadi"
          description={search ? 'Qidiruvni o\'zgartiring' : 'Yangi guruh yarating'}
          action={search ? undefined : { label: 'Yangi guruh', onClick: () => setModalOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((group) => {
            const students = group.students || 0;
            const max = MAX_STUDENTS;
            const progress = Math.min(Math.round((students / max) * 100), 100);
            const status = mapStatus(group);
            const mentorName = group.mentor?.name || '—';
            const scheduleStr = formatSchedule(group.schedule);
            return (
              <div
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="glass-strong rounded-[20px] card-hover-premium p-5 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-[15px] font-bold text-[var(--text)]">{group.name}</h3>
                  <Badge status={status} />
                </div>
                <div className="space-y-1.5 text-[12px] text-[var(--text-secondary)] mb-4">
                  <p className="flex items-center gap-1.5"><HiOutlineUser className="w-3.5 h-3.5 shrink-0" /> {mentorName}</p>
                  {scheduleStr && (
                    <p className="flex items-center gap-1.5"><HiOutlineClock className="w-3.5 h-3.5 shrink-0" /> {scheduleStr}</p>
                  )}
                  {group.room && (
                    <p className="flex items-center gap-1.5"><HiOutlineHomeModern className="w-3.5 h-3.5 shrink-0" /> Xona {group.room}</p>
                  )}
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                    Student: <span className="text-[var(--text)]">{students}/{max}</span>
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

      {/* Create modal — backend POST /api/admin/groups body: { name, subject, mentorId, monthlyPrice, schedule?, room? } */}
      <Modal open={modalOpen} onClose={() => { if (!saving) setModalOpen(false); }} title="Yangi guruh yaratish">
        <div className="space-y-4">
          <Input label="Guruh nomi *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Frontend N13" />

          <Input label="Fan (ixtiyoriy)" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Frontend dasturlash" />

          <div>
            <label className="block text-[10px] font-bold text-[var(--text-secondary)] mb-1.5 uppercase tracking-[0.06em]">Mentor</label>
            <select
              value={formData.mentorId}
              onChange={(e) => setFormData({ ...formData, mentorId: e.target.value })}
              className="w-full h-10 px-4 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] text-[13px] text-[var(--text)] outline-none focus:border-[var(--green)] transition-colors appearance-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238FA283' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
              }}
            >
              <option value="">Mentor tanlanmagan</option>
              {mentors.map((m) => (
                <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
              ))}
            </select>
          </div>

          <Input label="Oylik to'lov (so'm)" type="number" value={formData.monthlyPrice} onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })} placeholder="500000" />

          <Input label="Xona (ixtiyoriy)" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} placeholder="201" />

          <div className="rounded-[12px] p-3" style={{ background: 'var(--green-bg)' }}>
            <p className="text-[10px] font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-[0.06em]">Dars jadvali (ixtiyoriy)</p>
            <div className="grid grid-cols-3 gap-2">
              <Input label="Kunlar" value={formData.scheduleDays} onChange={(e) => setFormData({ ...formData, scheduleDays: e.target.value })} placeholder="Dush/Chor/Juma" className="col-span-3" />
              <Input label="Boshlanish" value={formData.scheduleStart} onChange={(e) => setFormData({ ...formData, scheduleStart: e.target.value })} placeholder="09:00" />
              <Input label="Tugash" value={formData.scheduleEnd} onChange={(e) => setFormData({ ...formData, scheduleEnd: e.target.value })} placeholder="11:00" />
            </div>
          </div>

          {error && (
            <div className="text-[11px] text-[var(--danger)] font-semibold rounded-[8px] px-3 py-2"
              style={{ background: 'rgba(232,84,62,0.08)' }}
            >
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} disabled={saving}>Bekor qilish</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving || !formData.name}>
              {saving ? 'Yaratilmoqda...' : 'Yaratish'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
