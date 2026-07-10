import { useState } from "react";
import { Search, Coins } from "lucide-react";
import TopBar from "../components/TopBar";
import StudentCoinRow from "../components/StudentCoinRow";
import HistoryFeed from "../components/HistoryFeed";
import { COIN_STUDENTS, COIN_HISTORY } from "../mockData";

export default function CoinsPage() {
  const [selected, setSelected] = useState(COIN_STUDENTS[0].id);
  const totalCoins = COIN_STUDENTS.reduce((sum, s) => sum + s.balance, 0);

  return (
    <div>
      <TopBar title="Управление коинами" />

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
          <span className="text-[13px] font-semibold text-ink">{COIN_STUDENTS.length}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-line bg-surface-card px-4 py-2">
          <Coins size={14} className="text-accent-dark" />
          <span className="text-[11px] text-ink-faint">Всего коинов</span>
          <span className="text-[13px] font-semibold text-ink">{totalCoins}</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-5">
        <div className="flex flex-col gap-3">
          {COIN_STUDENTS.map((s) => (
            <button key={s.id} onClick={() => setSelected(s.id)} className="text-left">
              <StudentCoinRow
                initials={undefined}
                img={s.img}
                name={s.name}
                id={s.id}
                balance={s.balance}
                active={selected === s.id}
              />
            </button>
          ))}
        </div>

        <HistoryFeed entries={COIN_HISTORY} />
      </div>
    </div>
  );
}
