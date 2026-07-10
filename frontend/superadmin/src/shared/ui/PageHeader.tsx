import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  online?: boolean;
}

export function PageHeader({ icon: Icon, title, subtitle, right, online }: PageHeaderProps): React.ReactElement {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0">
            <Icon className="size-5" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-base-content/60 text-sm mt-0.5">{subtitle}</p>
          )}
        </div>
        {online && (
          <div className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-bold ml-1">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            ONLINE
          </div>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

/** Аватар-круг с инициалами для таблиц (Branch admin, User name, Group mentor). */
export function Avatar({
  name,
  size = 'md',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}): React.ReactElement {
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase()
    : (parts[0]?.slice(0, 2) ?? '??').toUpperCase();
  const sizeCls = { sm: 'size-6 text-[9px]', md: 'size-8 text-[10px]', lg: 'size-10 text-xs' }[size];
  return (
    <div className={`avatar-chip ${sizeCls}`}>{initials}</div>
  );
}
