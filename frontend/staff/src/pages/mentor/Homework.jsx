import { useState } from 'react';
import { ClipboardCheck, Search, ChevronRight, Star, FileText } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader.jsx';
import { useMentorGroups, useMentorHomeworkList, useMentorHomeworkSubmissions } from '../../queries.js';
import { useAuth } from '../../auth.jsx';
import { api } from '../../api.js';

function StudentAvatar({ name }) {
  const letter = (name?.[0] || '?').toUpperCase();
  return (
    <span className="w-8 h-8 rounded-full bg-primary/20 text-primary-content grid place-items-center text-xs font-bold shrink-0">
      {letter}
    </span>
  );
}

export default function MentorHomework() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const { data: groupsData } = useMentorGroups();
  const groups = groupsData?.data || [];

  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id || '');
  const [selectedHwId, setSelectedHwId] = useState(null);
  const [gradingId, setGradingId] = useState(null);
  const [gradeScore, setGradeScore] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: homeworkData, isLoading: hwLoading } = useMentorHomeworkList(selectedGroupId);
  const homeworkItems = homeworkData?.data || [];

  const { data: submissionsData, isLoading: subLoading } = useMentorHomeworkSubmissions(selectedHwId);
  const submissions = submissionsData?.data || [];

  const selectedHw = homeworkItems.find((h) => h.id === selectedHwId);

  const handleGrade = async (submissionId) => {
    if (!gradeScore || isNaN(gradeScore) || Number(gradeScore) < 0) return;
    setSaving(true);
    try {
      await api.mentorGradeSubmission(token, submissionId, { score: Number(gradeScore) });
      qc.invalidateQueries({ queryKey: ['mentor-submissions', selectedHwId] });
      qc.invalidateQueries({ queryKey: ['mentor-homework', selectedGroupId] });
      setGradingId(null);
      setGradeScore('');
    } catch (err) {
      alert(err.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

  const getStatusBadge = (status) => {
    const map = {
      assigned: 'badge-ghost',
      submitted: 'badge-info',
      graded: 'badge-success',
      late: 'badge-warning',
    };
    return `badge ${map[status] || 'badge-ghost'} text-[11px]`;
  };

  return (
    <div>
      <PageHeader title="DZ ni tekshirish" subtitle="O'quvchilarning topshiriqlarini ko'rish va baholash" />

      <div className="form-control mb-4">
        <select
          className="select select-bordered w-full max-w-xs"
          value={selectedGroupId}
          onChange={(e) => {
            setSelectedGroupId(e.target.value);
            setSelectedHwId(null);
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
          <ClipboardCheck size={48} className="mx-auto mb-3 opacity-30" />
          <p>Guruhni tanlang</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Homework list */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100">
              <div className="card-body p-4">
                <h3 className="text-sm font-bold mb-3">Topshiriqlar</h3>

                {hwLoading ? (
                  <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-lg" />)}</div>
                ) : homeworkItems.length === 0 ? (
                  <p className="text-sm text-base-content/40 text-center py-6">Hali DZ yo'q</p>
                ) : (
                  <div className="space-y-1.5">
                    {homeworkItems.map((hw) => (
                      <button
                        key={hw.id}
                        onClick={() => { setSelectedHwId(hw.id); setGradingId(null); }}
                        className={`w-full text-left rounded-xl px-3 py-2.5 transition-colors ${
                          selectedHwId === hw.id ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
                        }`}
                      >
                        <div className="text-sm font-medium truncate">{hw.title}</div>
                        <div className={`text-[11px] mt-0.5 ${selectedHwId === hw.id ? 'text-primary-content/70' : 'text-base-content/40'}`}>
                          {formatDate(hw.deadline)}
                          {hw.submissions_count != null && ` · ${hw.graded_count || 0}/${hw.submissions_count} baholandi`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submissions */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100">
              <div className="card-body p-4">
                {!selectedHw ? (
                  <div className="text-center py-12 text-base-content/40">
                    <FileText size={40} className="mx-auto mb-3 opacity-30" />
                    <p>DZ ni tanlang</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-bold">{selectedHw.title}</h3>
                      <p className="text-sm text-base-content/50">
                        Maks ball: {selectedHw.max_score || 100}
                        {selectedHw.coin_reward > 0 && ` · +${selectedHw.coin_reward} coin`}
                        · Deadline: {formatDate(selectedHw.deadline)}
                      </p>
                      {selectedHw.description && (
                        <p className="text-sm mt-2 text-base-content/70">{selectedHw.description}</p>
                      )}
                    </div>

                    {subLoading ? (
                      <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-lg" />)}</div>
                    ) : submissions.length === 0 ? (
                      <p className="text-sm text-base-content/40 text-center py-8">Hali hech kim topshirmagan</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>O'quvchi</th>
                              <th>Topshirilgan</th>
                              <th>Status</th>
                              <th>Baho</th>
                              <th className="text-right">Amal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {submissions.map((sub) => (
                              <tr key={sub.id} className="hover">
                                <td>
                                  <div className="flex items-center gap-2.5">
                                    <StudentAvatar name={`${sub.first_name} ${sub.last_name}`} />
                                    <span className="text-sm font-medium">{sub.first_name} {sub.last_name}</span>
                                  </div>
                                </td>
                                <td className="text-xs text-base-content/50">{formatDate(sub.submitted_at)}</td>
                                <td>
                                  <span className={getStatusBadge(sub.status)}>
                                    {sub.status === 'graded' ? 'Baholangan' : sub.status === 'submitted' ? 'Topshirilgan' : 'Kutilmoqda'}
                                  </span>
                                </td>
                                <td className="font-semibold text-sm">
                                  {sub.score != null ? `${sub.score}/${selectedHw.max_score || 100}` : '—'}
                                </td>
                                <td className="text-right">
                                  {sub.status !== 'graded' ? (
                                    gradingId === sub.id ? (
                                      <div className="flex items-center gap-2 justify-end">
                                        <input
                                          type="number"
                                          className="input input-bordered input-xs w-16 text-center"
                                          placeholder="Ball"
                                          value={gradeScore}
                                          onChange={(e) => setGradeScore(e.target.value)}
                                          min="0"
                                          max={selectedHw.max_score || 100}
                                        />
                                        <button
                                          className="btn btn-primary btn-xs"
                                          onClick={() => handleGrade(sub.id)}
                                          disabled={saving || !gradeScore}
                                        >
                                          {saving ? <span className="loading loading-spinner loading-xs" /> : <Star size={13} />}
                                        </button>
                                        <button
                                          className="btn btn-ghost btn-xs"
                                          onClick={() => { setGradingId(null); setGradeScore(''); }}
                                        >
                                          ×
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        className="btn btn-primary btn-xs gap-1"
                                        onClick={() => { setGradingId(sub.id); setGradeScore(''); }}
                                      >
                                        <Star size={13} /> Baholash
                                      </button>
                                    )
                                  ) : (
                                    <span className="text-xs text-success font-medium">
                                      ✓ {sub.score}/{selectedHw.max_score || 100}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
