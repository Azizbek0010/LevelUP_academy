import { useState } from 'react';
import { Coins, Plus, Minus, Search, History, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader.jsx';
import { useMentorGroups, useMentorGroupStudents, useMentorCoinHistory } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';

function StudentAvatar({ name }) {
  const letter = (name?.[0] || '?').toUpperCase();
  return (
    <span className="w-9 h-9 rounded-full bg-primary/20 text-primary-content grid place-items-center text-sm font-bold shrink-0">
      {letter}
    </span>
  );
}

export default function MentorCoins() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data: groupsData } = useMentorGroups();
  const groups = groupsData?.data || [];

  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [search, setSearch] = useState('');
  const [coinAmount, setCoinAmount] = useState('');
  const [coinReason, setCoinReason] = useState('');
  const [operation, setOperation] = useState('grant'); // 'grant' or 'deduct'
  const [saving, setSaving] = useState(false);

  const { data: rosterData } = useMentorGroupStudents(selectedGroupId);
  const students = rosterData?.data || [];

  const { data: historyData } = useMentorCoinHistory(selectedStudentId);
  const coinHistory = historyData?.data?.items || historyData?.data?.history || [];

  const filteredStudents = students.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.firstName + ' ' + s.lastName).toLowerCase().includes(q);
  });

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleCoins = async () => {
    if (!selectedStudentId || !coinAmount || !coinReason.trim()) return;
    const amount = operation === 'grant' ? Math.abs(Number(coinAmount)) : -Math.abs(Number(coinAmount));
    if (!amount || isNaN(amount)) return;

    setSaving(true);
    try {
      await api.mentorGrantCoins(token, {
        studentId: selectedStudentId,
        amount,
        reason: coinReason.trim(),
      });
      qc.invalidateQueries({ queryKey: ['mentor-group-students', selectedGroupId] });
      qc.invalidateQueries({ queryKey: ['mentor-coin-history', selectedStudentId] });
      setCoinAmount('');
      setCoinReason('');
    } catch (err) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div>
      <PageHeader title="Koinlar" subtitle="O'quvchilarga coin berish va ayirish" />

      <div className="form-control mb-4">
        <select
          className="select select-bordered w-full max-w-xs"
          value={selectedGroupId}
          onChange={(e) => {
            setSelectedGroupId(e.target.value);
            setSelectedStudentId(null);
          }}
        >
          <option value="">Guruhni tanlang</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name} — {g.subject}</option>
          ))}
        </select>
      </div>

      {!selectedGroupId ? (
        <div className="text-center py-16 text-base-content/40">
          <Coins size={48} className="mx-auto mb-3 opacity-30" />
          <p>Guruhni tanlang</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Student list */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100">
              <div className="card-body p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-2 rounded-lg border border-base-300 px-3 py-2 flex-1">
                    <Search size={14} className="text-base-content/40" />
                    <input
                      placeholder="Qidirish..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="bg-transparent text-sm outline-none w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStudentId(s.id)}
                      className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition-colors ${
                        selectedStudentId === s.id ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
                      }`}
                    >
                      <StudentAvatar name={`${s.firstName} ${s.lastName}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.firstName} {s.lastName}</div>
                      </div>
                      <div className={`text-sm font-bold ${selectedStudentId === s.id ? 'text-primary-content' : 'text-base-content'}`}>
                        {s.coinBalance ?? 0} 🪙
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Coin actions + history */}
          <div className="lg:col-span-3 space-y-4">
            {/* Coin action card */}
            {selectedStudent && (
              <div className="card bg-base-100">
                <div className="card-body p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <StudentAvatar name={`${selectedStudent.firstName} ${selectedStudent.lastName}`} />
                    <div>
                      <h3 className="font-bold">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                      <p className="text-sm text-base-content/50">
                        Balans: <span className="font-bold text-base-content">{selectedStudent.coinBalance ?? 0} 🪙</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setOperation('grant')}
                      className={`flex-1 btn btn-sm gap-1.5 ${operation === 'grant' ? 'btn-success text-white' : 'btn-outline'}`}
                    >
                      <Plus size={14} /> Berish
                    </button>
                    <button
                      onClick={() => setOperation('deduct')}
                      className={`flex-1 btn btn-sm gap-1.5 ${operation === 'deduct' ? 'btn-error text-white' : 'btn-outline'}`}
                    >
                      <Minus size={14} /> Ayirish
                    </button>
                  </div>

                  <div className="flex gap-3 items-end">
                    <div className="form-control flex-1">
                      <label className="label-text text-xs mb-1">Miqdor</label>
                      <input
                        type="number"
                        className="input input-bordered input-sm"
                        placeholder={operation === 'grant' ? 'Nechta coin?' : 'Nechta coin?'}
                        value={coinAmount}
                        onChange={(e) => setCoinAmount(e.target.value)}
                        min="1"
                      />
                    </div>
                    <div className="form-control flex-[2]">
                      <label className="label-text text-xs mb-1">Sabab (majburiy)</label>
                      <input
                        type="text"
                        className="input input-bordered input-sm"
                        placeholder="Nima uchun?"
                        value={coinReason}
                        onChange={(e) => setCoinReason(e.target.value)}
                      />
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleCoins}
                      disabled={saving || !coinAmount || !coinReason.trim()}
                    >
                      {saving ? <span className="loading loading-spinner loading-xs" /> : operation === 'grant' ? <Plus size={14} /> : <Minus size={14} />}
                      {operation === 'grant' ? 'Berish' : 'Ayirish'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Coin history */}
            {selectedStudent && (
              <div className="card bg-base-100">
                <div className="card-body p-4">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <History size={15} /> Operatsiyalar tarixi
                  </h3>

                  {coinHistory.length === 0 ? (
                    <p className="text-sm text-base-content/40 text-center py-6">Hali operatsiyalar yo'q</p>
                  ) : (
                    <div className="space-y-2">
                      {coinHistory.map((h, i) => (
                        <div key={h.id || i} className="flex items-center justify-between py-2 border-b border-base-200 last:border-0">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-7 h-7 rounded-full grid place-items-center ${
                              h.amount > 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                            }`}>
                              {h.amount > 0 ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                            </span>
                            <div>
                              <div className="text-sm">{h.reason}</div>
                              <div className="text-[11px] text-base-content/40">{formatDate(h.created_at)}</div>
                            </div>
                          </div>
                          <div className={`text-sm font-bold ${h.amount > 0 ? 'text-success' : 'text-danger'}`}>
                            {h.amount > 0 ? '+' : ''}{h.amount}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
