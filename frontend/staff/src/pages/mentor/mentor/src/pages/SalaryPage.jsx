import TopBar from "../components/TopBar";
import EmptyHint from "../components/EmptyHint";

export default function SalaryPage() {
  return (
    <div>
      <TopBar title="Зарплата" />
      <div className="rounded-xl border border-line bg-surface-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-ink-faint">Июнь 2026</div>
            <div className="font-display text-[20px] font-semibold text-ink">4 200 000 сум</div>
          </div>
          <span className="rounded-full bg-success-soft px-3 py-1 text-[11px] font-medium text-success">
            Выплачено
          </span>
        </div>
      </div>
      <div className="mt-4">
        <EmptyHint text="История начислений за прошлые месяцы появится здесь" />
      </div>
    </div>
  );
}
