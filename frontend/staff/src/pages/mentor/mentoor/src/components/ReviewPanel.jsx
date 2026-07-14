import { useState } from "react";
import { History, Maximize2, Download, Loader2 } from "lucide-react";
import { api } from "../api";

export default function ReviewPanel({ submissions = [], token, onGradeComplete }) {
  const [selectedSub, setSelectedSub] = useState(submissions[0] || null);
  const [score, setScore] = useState("");
  const [comment, setComment] = useState("");
  const [grading, setGrading] = useState(false);
  const [gradeError, setGradeError] = useState("");

  // Pick first ungraded or first submission
  const activeSub =
    selectedSub && submissions.find((s) => s.id === selectedSub.id)
      ? submissions.find((s) => s.id === selectedSub.id)
      : submissions[0] || null;

  const handleGrade = async () => {
    if (!activeSub || score === "") return;

    const parsed = Number(score);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      setGradeError("Ball 0-100 oralig'ida bo'lishi kerak");
      return;
    }

    setGrading(true);
    setGradeError("");

    try {
      await api.gradeSubmission(token, activeSub.id, {
        score: parsed,
        comment: comment || undefined,
      });
      setGradeError("");
      setScore("");
      setComment("");
      onGradeComplete?.();
    } catch (err) {
      setGradeError(err.message || "Baholashda xatolik");
    } finally {
      setGrading(false);
    }
  };

  if (!activeSub) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-line py-20 text-[13px] text-ink-faint">
        Baholash uchun topshiriqni tanlang
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-ink-faint">
            {activeSub.homework_id ? `TOPSHIRIQ` : "TOPSHIRIQ"}
          </div>
          <div className="font-display text-[16px] font-semibold text-ink">
            {activeSub.first_name || ""} {activeSub.last_name || ""}
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-medium ${
            activeSub.status === "graded"
              ? "bg-success-soft text-success"
              : "bg-accent text-accent-ink"
          }`}
        >
          {activeSub.status === "graded" ? `Baho: ${activeSub.score}` : "TEKSHIRISH KUTILMOQDA"}
        </span>
      </div>

      <div className="mb-4 flex items-center gap-4 text-[12px] text-ink-soft">
        <span>
          {activeSub.first_name || ""} {activeSub.last_name || ""}
        </span>
        <span>
          {activeSub.submitted_at
            ? `Topshirilgan: ${new Date(activeSub.submitted_at).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : ""}
        </span>
      </div>

      {/* Submission content */}
      <div className="mb-4 rounded-xl border border-line bg-surface-card p-4">
        <div className="mb-3 flex items-center justify-between text-[12px] text-ink-soft">
          <span>Javob matni</span>
        </div>
        <div className="min-h-[100px] rounded-lg bg-surface p-4 text-[13px] text-ink">
          {activeSub.text_answer || activeSub.content || "Matnli javob berilmagan"}
        </div>
        {activeSub.file_key && (
          <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-soft">
            <Download size={13} />
            {activeSub.file_key}
          </div>
        )}
      </div>

      {/* Grading form */}
      {activeSub.status !== "graded" && (
        <div className="grid grid-cols-[1fr_200px] gap-4">
          <div>
            <div className="mb-2 text-[12px] font-medium text-ink">Mentor kommentariysi</div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ishning kuchli tomonlari va nimani yaxshilash kerakligini yozing..."
              className="h-24 w-full rounded-lg border border-line bg-surface-card p-3 text-[13px] text-ink outline-none"
            />
          </div>
          <div className="rounded-xl border border-line bg-surface-card p-4 text-center">
            <div className="mb-1 text-[11px] text-ink-faint">Baho</div>
            <div className="mb-1 font-display text-[26px] font-bold text-ink">
              <input
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="0"
                className="w-16 text-center text-[26px] font-bold text-ink outline-none"
              />
              <span className="text-[14px] text-ink-faint">/100</span>
            </div>
            {gradeError && (
              <div className="mb-2 text-[11px] text-danger">{gradeError}</div>
            )}
            <button
              onClick={handleGrade}
              disabled={grading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-sidebar py-2 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {grading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  ...
                </>
              ) : (
                "Baholash"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Already graded info */}
      {activeSub.status === "graded" && (
        <div className="rounded-xl border border-line bg-surface-card p-4 text-center">
          <div className="mb-1 text-[11px] text-ink-faint">Berilgan baho</div>
          <div className="font-display text-[26px] font-bold text-ink">
            {activeSub.score}
            <span className="text-[14px] text-ink-faint">/100</span>
          </div>
          {activeSub.graded_at && (
            <div className="mt-1 text-[11px] text-ink-faint">
              Baholangan: {new Date(activeSub.graded_at).toLocaleDateString("ru-RU")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
