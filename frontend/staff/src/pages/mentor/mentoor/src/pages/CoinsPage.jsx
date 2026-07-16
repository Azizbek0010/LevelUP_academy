import { useEffect, useState } from "react";
import { Search, Coins, Loader2, Plus, Minus } from "lucide-react";
import TopBar from "../components/TopBar";
import StudentCoinRow from "../components/StudentCoinRow";
import HistoryFeed from "../components/HistoryFeed";
import EmptyHint from "../components/EmptyHint";
import { api, getToken } from "../api";

export default function CoinsPage({ token, user }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [coinHistory, setCoinHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Grant coins modal
  const [showGrant, setShowGrant] = useState(false);
  const [grantAmount, setGrantAmount] = useState(10);
  const [grantReason, setGrantReason] = useState("");
  const [granting, setGranting] = useState(false);
  const [grantError, setGrantError] = useState("");

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

  // Load students when group changes
  useEffect(() => {
    const t = token || getToken();
    if (!t || !selectedGroupId) return;

    setLoading(true);
    api
      .getGroupStudents(t, selectedGroupId)
      .then((res) => {
        const sts = res.data || [];
        setStudents(sts);
        if (sts.length > 0 && !selectedStudentId) {
          setSelectedStudentId(sts[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, selectedGroupId]);

  // Load coin history when student selected
  useEffect(() => {
    if (!selectedStudentId) return;
    const t = token || getToken();
    if (!t) return;

    api
      .getCoinHistory(t, selectedStudentId)
      .then((res) => {
        const data = res.data || {};
        const history = data.items || data.history || [];
        setCoinHistory(
          history.map((h) => ({
            title: `${h.amount > 0 ? "+" : ""}${h.amount} ${h.reason || ""}`,
            by: h.operation === "reward" ? "Начисление" : "Списание",
            when: h.created_at
              ? new Date(h.created_at).toLocaleDateString("ru-RU")
              : "",
            positive: h.amount > 0,
          }))
        );
      })
      .catch(() => setCoinHistory([]));
  }, [selectedStudentId, token]);

  const handleGrantCoins = async () => {
    if (!selectedStudentId || !grantReason.trim() || grantAmount === 0) {
      setGrantError("Summa va sababni kiriting");
      return;
    }

    setGranting(true);
    setGrantError("");

    try {
      const t = token || getToken();
      await api.grantCoins(t, {
        studentId: selectedStudentId,
        amount: grantAmount,
        reason: grantReason,
      });

      // Refresh students to get updated balances
      const res = await api.getGroupStudents(t, selectedGroupId);
      setStudents(res.data || []);

      setShowGrant(false);
      setGrantReason("");
      setGrantAmount(10);
    } catch (err) {
      setGrantError(err.message || "Xatolik yuz berdi");
    } finally {
      setGranting(false);
    }
  };

  const totalCoins = students.reduce((sum, s) => sum + (s.coin_balance || 0), 0);

  return (
    <div>
      <TopBar title="Управление коинами" />

      {/* Group selector */}
      <div className="mb-4">
        <div className="mb-1 text-[11px] text-ink-faint">Guruh</div>
        <select
          value={selectedGroupId}
          onChange={(e) => {
            setSelectedGroupId(e.target.value);
            setSelectedStudentId("");
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

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-[38px] flex-1 items-center gap-2 rounded-lg border border-line bg-surface-card px-3">
          <Search size={14} className="text-ink-faint" />
          <input
            placeholder="Поиск студента..."
            className="w-full bg-transparent text-[13px] text-ink outline-none"
          />
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-card px-4 py-2">
          <span className="text-[11px] text-ink-faint">Студентов</span>
          <span className="text-[13px] font-semibold text-ink">{students.length}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-card px-4 py-2">
          <Coins size={14} className="text-accent-dark" />
          <span className="text-[11px] text-ink-faint">Всего коинов</span>
          <span className="text-[13px] font-semibold text-ink">{totalCoins}</span>
        </div>
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
      ) : students.length === 0 ? (
        <EmptyHint text="Bu guruhda studentlar yo'q" />
      ) : (
        <div className="grid grid-cols-[1fr_320px] gap-5">
          {/* Student list */}
          <div className="flex flex-col gap-3">
            {students.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedStudentId(s.id)}
                className="text-left"
              >
                <StudentCoinRow
                  img={null}
                  name={`${s.first_name || ""} ${s.last_name || ""}`}
                  id={s.student_code || s.id}
                  balance={s.coin_balance || 0}
                  active={selectedStudentId === s.id}
                />
              </button>
            ))}
          </div>

          {/* Right: History + Grant action */}
          <div className="flex flex-col gap-4">
            {/* Grant coins button */}
            {selectedStudentId && (
              <button
                onClick={() => setShowGrant(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-sidebar py-3 text-[13px] font-medium text-white shadow-sm transition-all hover:shadow-md"
              >
                <Plus size={14} />
                Коины начислить
              </button>
            )}

            <HistoryFeed entries={coinHistory} />
          </div>
        </div>
      )}

      {/* Grant Modal */}
      {showGrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface-card p-6 shadow-xl">
            <h3 className="mb-4 font-display text-[16px] font-semibold text-ink">
              Начислить / списать коины
            </h3>

            <div className="flex flex-col gap-4">
              {/* Amount */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                  Сумма
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGrantAmount((prev) => Math.max(-100, prev - 5))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(Number(e.target.value))}
                    className="flex-1 rounded-lg border border-line bg-surface px-3 text-center text-[14px] text-ink outline-none"
                  />
                  <button
                    onClick={() => setGrantAmount((prev) => Math.min(1000, prev + 5))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-surface text-ink-soft"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-ink-faint">
                  Отрицательное число = списание
                </p>
              </div>

              {/* Reason */}
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-ink-soft">
                  Причина
                </label>
                <input
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  placeholder="Например: за активность на уроке"
                  className="w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-[14px] text-ink outline-none"
                />
              </div>

              {/* Error */}
              {grantError && (
                <div className="rounded-lg bg-danger-soft px-4 py-2 text-[13px] text-danger">
                  {grantError}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowGrant(false);
                    setGrantError("");
                  }}
                  className="flex-1 rounded-lg border border-line bg-surface px-4 py-2.5 text-[13px] text-ink-soft"
                >
                  Отмена
                </button>
                <button
                  onClick={handleGrantCoins}
                  disabled={granting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-sidebar px-4 py-2.5 text-[13px] font-medium text-white disabled:opacity-50"
                >
                  {granting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      ...
                    </>
                  ) : (
                    "Сохранить"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
