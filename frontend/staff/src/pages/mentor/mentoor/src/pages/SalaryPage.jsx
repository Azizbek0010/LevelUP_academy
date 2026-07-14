import { useEffect, useState } from "react";
import TopBar from "../components/TopBar";
import EmptyHint from "../components/EmptyHint";
import { api, getToken, getUser } from "../api";

export default function SalaryPage({ token, user }) {
  const [salaryData, setSalaryData] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const mentorId = user?.id;
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const t = token || getToken();
    if (!t || !mentorId) return;

    setLoading(true);
    setError("");

    const monthParam = currentMonth;

    Promise.all([
      api.getSalary(t, mentorId, { year: currentYear }),
      api.getSalarySuggestion(t, mentorId, monthParam),
    ])
      .then(([salaryRes, suggestionRes]) => {
        setSalaryData(salaryRes.data || []);
        setSuggestion(suggestionRes.data || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, mentorId, currentYear, currentMonth]);

  // Get current month's salary
  const currentSalary =
    Array.isArray(salaryData)
      ? salaryData.find(
          (s) => s.month === currentMonth || s.period?.startsWith(currentMonth)
        )
      : null;

  const formatMoney = (amount) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat("uz-UZ").format(amount) + " сум";
  };

  if (loading) {
    return (
      <div>
        <TopBar title="Зарплата" />
        <div className="flex items-center justify-center py-20 text-ink-faint">
          Yuklanmoqda...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <TopBar title="Зарплата" />
        <div className="rounded-lg bg-danger-soft px-6 py-4 text-[13px] text-danger">
          {error}
        </div>
      </div>
    );
  }

  const monthNames = {
    "01": "Январь", "02": "Февраль", "03": "Март", "04": "Апрель",
    "05": "Май", "06": "Июнь", "07": "Июль", "08": "Август",
    "09": "Сентябрь", "10": "Октябрь", "11": "Ноябрь", "12": "Декабрь",
  };
  const monthLabel = monthNames[currentMonth.slice(5)] || currentMonth;

  return (
    <div>
      <TopBar title="Зарплата" />

      {/* Current month */}
      <div className="rounded-xl border border-line bg-surface-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-ink-faint">{monthLabel} {currentYear}</div>
            <div className="font-display text-[28px] font-semibold text-ink">
              {currentSalary
                ? formatMoney(currentSalary.amount || currentSalary.total)
                : suggestion
                ? formatMoney(suggestion.suggested_amount || suggestion.amount)
                : "—"}
            </div>
            {suggestion && (
              <div className="mt-1 text-[12px] text-ink-faint">
                {suggestion.details || `Основание: ${suggestion.basis || "расчет"}`}
              </div>
            )}
          </div>
          <div>
            {currentSalary?.status === "paid" && (
              <span className="rounded-full bg-success-soft px-3 py-1 text-[11px] font-medium text-success">
                Выплачено
              </span>
            )}
            {currentSalary?.status === "pending" && (
              <span className="rounded-full bg-warning-soft px-3 py-1 text-[11px] font-medium text-warning">
                В обработке
              </span>
            )}
            {!currentSalary && (
              <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-medium text-ink-faint">
                Ожидание
              </span>
            )}
          </div>
        </div>

        {/* Suggestion details */}
        {suggestion && suggestion.breakdown && (
          <div className="mt-4 border-t border-line pt-4">
            <div className="text-[12px] font-medium text-ink-soft mb-2">Детали расчета</div>
            {Object.entries(suggestion.breakdown).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between py-1.5 text-[13px]"
              >
                <span className="text-ink-soft">{key}</span>
                <span className="text-ink font-medium">{formatMoney(val)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      <div className="mt-4">
        {Array.isArray(salaryData) && salaryData.length > 0 ? (
          <div className="rounded-xl border border-line bg-surface-card p-4 shadow-sm">
            <h3 className="mb-3 font-display text-[14px] font-semibold text-ink">
              История начислений
            </h3>
            {salaryData.map((s, i) => (
              <div
                key={s.id || i}
                className="flex items-center justify-between border-b border-line py-2.5 last:border-b-0"
              >
                <span className="text-[13px] text-ink">
                  {s.month || s.period || `Месяц ${i + 1}`}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-medium text-ink">
                    {formatMoney(s.amount || s.total)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      s.status === "paid"
                        ? "bg-success-soft text-success"
                        : s.status === "pending"
                        ? "bg-warning-soft text-warning"
                        : "bg-surface text-ink-faint"
                    }`}
                  >
                    {s.status === "paid"
                      ? "Выплачено"
                      : s.status === "pending"
                      ? "Ожидает"
                      : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyHint text="История начислений за прошлые месяцы появится здесь" />
        )}
      </div>
    </div>
  );
}
