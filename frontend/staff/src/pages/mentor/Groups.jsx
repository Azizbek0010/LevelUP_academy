import { useState } from 'react';
import { Users, BookOpen, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader.jsx';
import { useMentorGroups, useMentorGroupStudents } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';

const STATUS_LABELS = {
  active: { label: 'Faol', cls: 'badge-success' },
  frozen: { label: 'Muzlatilgan', cls: 'badge-error' },
  dropped: { label: "O'chirilgan", cls: 'badge-ghost' },
};

function StudentAvatar({ name }) {
  const letter = (name?.[0] || '?').toUpperCase();
  return (
    <span className="w-9 h-9 rounded-full bg-primary/20 text-primary-content grid place-items-center text-sm font-bold shrink-0">
      {letter}
    </span>
  );
}

export default function MentorGroups() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data: groupsData, isLoading: groupsLoading } = useMentorGroups();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [search, setSearch] = useState('');

  const groups = groupsData?.data || [];
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const { data: rosterData, isLoading: rosterLoading } = useMentorGroupStudents(selectedGroupId);
  const students = rosterData?.data || [];

  const filteredStudents = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (s.first_name + ' ' + s.last_name).toLowerCase().includes(q) ||
      s.phone?.includes(q)
    );
  });

  return (
    <div>
      <PageHeader title="Mening guruhlarim" subtitle="Guruhlar va o'quvchilar ro'yxati" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups list */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100">
            <div className="card-body p-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <BookOpen size={16} /> Guruhlar
              </h3>

              {groupsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="skeleton h-14 rounded-lg" />
                  ))}
                </div>
              ) : groups.length === 0 ? (
                <p className="text-sm text-base-content/40 text-center py-6">
                  Sizda hali guruhlar yo'q
                </p>
              ) : (
                <div className="space-y-1.5">
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className={`w-full text-left rounded-xl px-3.5 py-3 transition-colors ${
                        selectedGroupId === g.id
                          ? 'bg-primary text-primary-content font-semibold'
                          : 'hover:bg-base-200 text-base-content'
                      }`}
                    >
                      <div className="text-sm font-medium">{g.name}</div>
                      <div className={`text-[11px] mt-0.5 ${selectedGroupId === g.id ? 'text-primary-content/70' : 'text-base-content/50'}`}>
                        {g.subject} · {g.students?.length || 0} o'quvchi
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Students roster */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100">
            <div className="card-body p-4">
              {selectedGroup ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{selectedGroup.name}</h3>
                      <p className="text-sm text-base-content/50">{selectedGroup.subject} · {students.length} o'quvchi</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-lg border border-base-300 px-3 py-2">
                      <Search size={14} className="text-base-content/40" />
                      <input
                        placeholder="Qidirish..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent text-sm outline-none w-28"
                      />
                    </div>
                  </div>

                  {rosterLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton h-14 rounded-lg" />
                      ))}
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <p className="text-sm text-base-content/40 text-center py-8">
                      {search ? 'Hech narsa topilmadi' : 'Bu guruhda o\'quvchilar yo\'q'}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>O'quvchi</th>
                            <th>Telefon</th>
                            <th>Status</th>
                            <th>Koinlar</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredStudents.map((s) => {
                            const st = STATUS_LABELS[s.status] || STATUS_LABELS.active;
                            return (
                              <tr key={s.id} className="hover">
                                <td>
                                  <div className="flex items-center gap-3">
                                    <StudentAvatar name={`${s.first_name} ${s.last_name}`} />
                                    <div>
                                      <div className="font-medium text-sm">{s.first_name} {s.last_name}</div>
                                      {s.student_code && (
                                        <div className="text-[11px] text-base-content/40">ID: {s.student_code}</div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="text-sm text-base-content/60">{s.phone || '—'}</td>
                                <td>
                                  <span className={`badge ${st.cls} text-[11px]`}>{st.label}</span>
                                </td>
                                <td className="text-sm font-semibold">
                                  {s.coin_balance ?? '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-base-content/40">
                  <Users size={40} className="mx-auto mb-3 opacity-30" />
                  <p>Chap tomondan guruhni tanlang</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
