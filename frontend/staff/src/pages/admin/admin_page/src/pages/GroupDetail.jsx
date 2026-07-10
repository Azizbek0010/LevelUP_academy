import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineUserGroup, HiOutlineCalendarDays } from 'react-icons/hi2';
import Badge from '../components/Badge.jsx';
import StatCard from '../components/StatCard.jsx';

const MOCK_GROUPS = {
  1: {
    id: 1, name: 'Frontend N13', mentor: 'Aziz Karimov', time: '09:00 - 11:00', days: 'Dush/Chor/Juma', room: '201',
    students: 12, maxStudents: 15, status: 'active', subject: 'Frontend',
    schedule: [
      { day: 'Dush', date: '06.07', topic: 'React Hooks' },
      { day: 'Chor', date: '08.07', topic: 'useEffect Deep Dive' },
      { day: 'Juma', date: '10.07', topic: 'Custom Hooks' },
      { day: 'Dush', date: '13.07', topic: 'Context API' },
    ],
    studentsList: [
      { id: 1, name: 'Abdulloh Karimov', phone: '+998 90 123 45 67', payment: 'paid', present: true },
      { id: 2, name: 'Hamidulla Sobirov', phone: '+998 93 345 67 89', payment: 'debt', present: false },
      { id: 3, name: 'Malika Azizova', phone: '+998 90 456 78 90', payment: 'paid', present: true },
      { id: 4, name: 'Zarina Nurmatova', phone: '+998 91 678 90 12', payment: 'paid', present: true },
      { id: 5, name: 'Rustam Yuldashev', phone: '+998 94 901 23 45', payment: 'debt', present: false },
      { id: 6, name: 'Gulnora Rahimova', phone: '+998 90 234 56 78', payment: 'paid', present: true },
    ],
  },
};

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const group = MOCK_GROUPS[id] || MOCK_GROUPS[1];
  const [studentsList, setStudentsList] = useState(group?.studentsList || []);
  const present = useMemo(() => studentsList.filter((s) => s.present).length, [studentsList]);

  if (!group) {
    return (
      <div className="glass-strong rounded-[20px] p-8 text-center">
        <p className="text-[var(--text-secondary)]">Guruh topilmadi</p>
        <button onClick={() => navigate('/groups')} className="mt-3 text-[13px] font-bold text-[var(--green)] hover:underline">← Guruhlar ro'yxatiga</button>
      </div>
    );
  }

  const toggleAttendance = (id) => {
    setStudentsList(studentsList.map((s) => s.id === id ? { ...s, present: !s.present } : s));
  };

  const progress = Math.round((group.students / group.maxStudents) * 100);

  return (
    <div className="space-y-5">
      {/* Back button */}
      <button onClick={() => navigate('/groups')} className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" />
        Guruhlarga qaytish
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">

        {/* Left column */}
        <div className="space-y-5">
          {/* Info card */}
          <div className="glass-strong rounded-[20px] card-hover-premium p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-[22px] font-extrabold text-[var(--text)]">{group.name}</h2>
                <p className="text-[13px] text-[var(--text-secondary)] mt-1">Mentor: {group.mentor}</p>
              </div>
              <Badge status={group.status} />
            </div>
            <div className="grid grid-cols-3 gap-4 text-[12px]">
              <div>
                <span className="text-[var(--text-muted)]">Vaqt</span>
                <p className="font-bold text-[var(--text)]">{group.time}</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Kunlar</span>
                <p className="font-bold text-[var(--text)]">{group.days}</p>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Xona</span>
                <p className="font-bold text-[var(--text)]">{group.room}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-[var(--text-muted)]">Bandlik</span>
                <span className="text-[11px] font-bold">{group.students}/{group.maxStudents}</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden bg-[var(--border)]">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: progress >= 100 ? '#EF4444' : '#10B981' }} />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="glass-strong rounded-[20px] card-hover-premium p-6">
            <h3 className="text-[14px] font-bold text-[var(--text)] mb-4 flex items-center gap-2">
              <HiOutlineCalendarDays className="w-4 h-4 text-[var(--green)]" />
              Dars jadvali
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {group.schedule.map((s, i) => (
                <div key={i} className="rounded-[12px] p-3 border border-[var(--border)] text-center transition-all hover:translate-y-[-2px] hover:shadow-[0_4px_12px_var(--shadow)] hover:bg-[var(--surface-hover)]">
                  <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase">{s.day}</div>
                  <div className="text-[10px] text-[var(--text-secondary)] mb-1">{s.date}</div>
                  <div className="text-[11px] font-bold text-[var(--text)]">{s.topic}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Students table */}
          <div className="glass-strong rounded-[20px] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-[var(--text)]">
                Talabalar · {studentsList.length}
              </h3>
              <span className="text-[11px] text-[var(--text-secondary)]">
                <span className="text-[#10B981] font-bold">{present}</span> hozir · <span className="text-[#EF4444] font-bold">{studentsList.length - present}</span> yo'q
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)] border-b border-[var(--border)]">
                    <th className="px-6 py-3">Talaba</th>
                    <th className="px-6 py-3">Telefon</th>
                    <th className="px-6 py-3">To'lov</th>
                    <th className="px-6 py-3 text-center">Davomat</th>
                  </tr>
                </thead>
                <tbody>
                  {studentsList.map((s) => (
                    <tr key={s.id} className="border-t border-[var(--border)] text-[13px] transition-colors hover:bg-[var(--surface-hover)]">
                      <td className="px-6 py-3 font-bold text-[var(--text)]">{s.name}</td>
                      <td className="px-6 py-3 text-[var(--text-secondary)]">{s.phone}</td>
                      <td className="px-6 py-3">
                        <Badge status={s.payment === 'paid' ? 'paid' : 'overdue'} />
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => toggleAttendance(s.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-bold transition-all"
                          style={{
                            background: s.present ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                            color: s.present ? '#10B981' : '#EF4444',
                          }}
                        >
                          {s.present ? <HiOutlineCheckCircle className="w-3.5 h-3.5" /> : <HiOutlineXCircle className="w-3.5 h-3.5" />}
                          {s.present ? 'Bor' : 'Yo\'q'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <StatCard title="Jami talabalar" value={String(group.students)} icon={<HiOutlineUserGroup className="w-4 h-4" />} color="#3B82F6" />
          <StatCard title="Hozirgi davomat" value={String(present)} delta={Math.round((present / studentsList.length) * 100)} deltaLabel="%" icon={<HiOutlineCheckCircle className="w-4 h-4" />} color="#10B981" />
          <StatCard title="Kelmaganalar" value={String(studentsList.length - present)} icon={<HiOutlineXCircle className="w-4 h-4" />} color="#EF4444" />
          <div className="glass-strong rounded-[20px] card-hover-premium p-5">
            <h4 className="text-[12px] font-bold text-[var(--text-secondary)] mb-3">Davomat statistikasi</h4>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border-4 flex items-center justify-center" style={{ borderColor: present >= studentsList.length / 2 ? '#10B981' : '#EF4444' }}>
                <span className="text-[18px] font-extrabold">{Math.round((present / studentsList.length) * 100)}%</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                <span className="text-[#10B981] font-bold">{present}</span> ta talaba <br />darsga qatnashmoqda
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
