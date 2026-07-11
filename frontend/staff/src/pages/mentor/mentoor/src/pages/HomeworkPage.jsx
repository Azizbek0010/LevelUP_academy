import { Search } from "lucide-react";
import TopBar from "../components/TopBar";
import EmptyHint from "../components/EmptyHint";
import SubmissionCard from "../components/SubmissionCard";
import ReviewPanel from "../components/ReviewPanel";

export default function HomeworkPage() {
  return (
    <div>
      <TopBar title="Проверка домашних заданий" />
      <div className="grid grid-cols-[320px_1fr] gap-5">
        <div>
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-line bg-surface-card px-3 py-2.5">
            <Search size={14} className="text-ink-faint" />
            <input
              placeholder="Поиск студента или задания..."
              className="w-full bg-transparent text-[13px] text-ink outline-none"
            />
          </div>
          <div className="mb-4 flex gap-2">
            <span className="rounded-full bg-accent px-3 py-1 text-[12px] font-medium text-accent-ink">
              Новые (1)
            </span>
            <span className="rounded-full border border-line bg-surface-card px-3 py-1 text-[12px] text-ink-soft">
              На доработку
            </span>
          </div>

          <SubmissionCard
            initials="АК"
            name="Артем Константинов"
            group="UX/UI Дизайн • Группа А-12"
            time="2ч назад"
            task="Мокап мобильного приложения для доставки еды"
            file="preview.png"
          />

          <div className="mt-3">
            <EmptyHint text="Новые сдачи заданий появятся здесь по мере поступления" />
          </div>
        </div>

        <ReviewPanel />
      </div>
    </div>
  );
}
