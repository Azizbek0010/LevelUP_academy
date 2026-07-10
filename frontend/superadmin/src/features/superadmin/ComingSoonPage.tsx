import { Construction } from 'lucide-react';

export default function ComingSoonPage({ title }: { title: string }): React.ReactElement {
  return (
    <div className="p-8">
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-warning/15 text-warning mb-4">
          <Construction className="size-7" />
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-base-content/60 text-sm mt-2">
          В работе — будет реализовано в следующих слайсах Phase 3.
        </p>
      </div>
    </div>
  );
}
