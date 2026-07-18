import { useEffect, useState, useCallback } from "react";
import { Search, Loader2, Send } from "lucide-react";
import TopBar from "../components/TopBar";
import EmptyHint from "../components/EmptyHint";
import SubmissionCard from "../components/SubmissionCard";
import ReviewPanel from "../components/ReviewPanel";
import { api, getToken } from "../api";

export default function HomeworkPage({ token, user }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [homeworkList, setHomeworkList] = useState([]);
  const [selectedHwId, setSelectedHwId] = useState("");
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load groups
  useEffect(() => {
    const t = token || getToken();
    if (!t) return;
    api
      .getGroups(t)
      .then((res) => {
        const gs = res.data || [];
        setGroups(gs);
        if (gs.length > 0) setSelectedGroupId(gs[0].id);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Load homework list
  useEffect(() => {
    const t = token || getToken();
    if (!t || !selectedGroupId) return;

    setLoading(true);
    api
      .getHomeworkList(t, selectedGroupId)
      .then((res) => {
        const hw = res.data || [];
        setHomeworkList(hw);
        if (hw.length > 0 && !selectedHwId) {
          setSelectedHwId(hw[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, selectedGroupId]);

  // Load submissions when homework selected
  const loadSubmissions = useCallback(() => {
    if (!selectedHwId) return;
    const t = token || getToken();
    if (!t) return Promise.resolve();

    return api
      .getSubmissions(t, selectedHwId)
      .then((res) => setSubmissions(res.data || []))
      .catch((err) => setError(err.message));
  }, [selectedHwId, token]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Reload submissions after grading
  const handleGradeComplete = useCallback(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  return (
    <div>
      <TopBar title="Проверка домашних заданий" />

      {/* Group selector */}
      <div className="mb-4">
        <div className="mb-1 text-[11px] text-ink-faint">Guruh</div>
        <select
          value={selectedGroupId}
          onChange={(e) => {
            setSelectedGroupId(e.target.value);
            setSelectedHwId("");
          }}
          className="rounded-lg border border-line bg-surface-card px-3 py-2 text-[13px] text-ink outline-none"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger-soft px-4 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-ink-faint">
          Yuklanmoqda...
        </div>
      ) : homeworkList.length === 0 ? (
        <EmptyHint text="Bu guruhda hali vazifalar yo'q" />
      ) : (
        <div className="grid grid-cols-[320px_1fr] gap-5">
          {/* Left: Homework List */}
          <div className="flex flex-col gap-3">
            {homeworkList.map((hw) => (
              <button
                key={hw.id}
                onClick={() => setSelectedHwId(hw.id)}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  selectedHwId === hw.id
                    ? "border-accent bg-surface-card"
                    : "border-line bg-surface-card hover:border-ink-faint"
                }`}
              >
                <div className="text-[13px] font-medium text-ink">{hw.title}</div>
                <div className="mt-1 text-[11px] text-ink-faint">
                  {hw.submissions_count || 0} ta topshirgan
                  {hw.graded_count > 0 && ` · ${hw.graded_count} ta baholangan`}
                </div>
                {hw.max_score && (
                  <div className="mt-1 text-[11px] text-ink-faint">
                    Max ball: {hw.max_score}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Right: Submissions */}
          <div>
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-surface-card px-3 py-2.5">
              <Search size={14} className="text-ink-faint" />
              <input
                placeholder="Student yoki vazifa qidirish..."
                className="w-full bg-transparent text-[13px] text-ink outline-none"
              />
            </div>

            <div className="flex flex-col gap-3">
              {submissions.length === 0 ? (
                <EmptyHint text="Bu vazifaga hali topshiriqlar kelmagan" />
              ) : (
                submissions.map((sub) => (
                  <SubmissionCard
                    key={sub.id}
                    initials={`${(sub.first_name?.[0] || "").toUpperCase()}${(
                      sub.last_name?.[0] || ""
                    ).toUpperCase()}`}
                    name={`${sub.first_name || ""} ${sub.last_name || ""}`}
                    group=""
                    time={
                      sub.submitted_at
                        ? new Date(sub.submitted_at).toLocaleDateString("ru-RU")
                        : ""
                    }
                    task={sub.text_answer || "Topshiriq"}
                    file={sub.file_key || ""}
                  />
                ))
              )}
            </div>

            {submissions.length > 0 && (
              <ReviewPanel
                submissions={submissions}
                token={token || getToken()}
                onGradeComplete={handleGradeComplete}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
