import { History, Maximize2, Download } from "lucide-react";

export default function ReviewPanel() {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="text-[11px] text-ink-faint">МОДУЛЬ 4 · ЗАДАНИЕ 2</div>
          <div className="font-display text-[16px] font-semibold text-ink">
            Мокап мобильного приложения для доставки еды
          </div>
        </div>
        <span className="rounded-full bg-accent px-3 py-1 text-[11px] font-medium text-accent-ink">
          ОЖИДАЕТ ПРОВЕРКИ
        </span>
      </div>

      <div className="mb-4 flex items-center gap-4 text-[12px] text-ink-soft">
        <span>Артем Константинов</span>
        <span>Сдано 24 Окт, 14:20</span>
        <button className="ml-auto flex items-center gap-1 text-ink-faint">
          <History size={13} /> История сдач
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-line bg-surface-card p-4">
        <div className="mb-3 flex items-center justify-between text-[12px] text-ink-soft">
          <span>PREVIEW: mobile_mockup_v1.2.png · 1920×1080 · 2.4 MB</span>
          <div className="flex gap-2">
            <Maximize2 size={14} />
            <Download size={14} />
          </div>
        </div>
        <div className="flex h-64 items-center justify-center rounded-lg bg-surface">
          <span className="text-[12px] text-ink-faint">Превью изображения</span>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_200px] gap-4">
        <div>
          <div className="mb-2 text-[12px] font-medium text-ink">Комментарий ментора</div>
          <textarea
            placeholder="Опишите сильные стороны работы и что стоит улучшить..."
            className="h-24 w-full rounded-lg border border-line bg-surface-card p-3 text-[13px] text-ink outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button className="rounded-lg border border-line bg-surface-card px-3 py-2 text-[12px] text-ink-soft">
              Использовать шаблон
            </button>
            <button className="rounded-lg border border-line bg-surface-card px-3 py-2 text-[12px] text-ink-soft">
              Записать аудио
            </button>
          </div>
        </div>
        <div className="rounded-xl border border-line bg-surface-card p-4 text-center">
          <div className="mb-1 text-[11px] text-ink-faint">Итоговая оценка</div>
          <div className="mb-1 font-display text-[26px] font-bold text-ink">
            0<span className="text-[14px] text-ink-faint">/100</span>
          </div>
          <div className="mb-3 text-[11px] text-ink-faint">
            Сложность <span className="text-ink-soft">Высокая</span>
          </div>
          <button className="w-full rounded-lg bg-accent py-2 text-[13px] font-medium text-accent-ink">
            Оценить
          </button>
        </div>
      </div>
    </div>
  );
}
