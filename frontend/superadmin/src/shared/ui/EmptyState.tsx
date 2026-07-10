import type { ReactNode } from 'react';
import clsx from 'clsx';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps): React.ReactElement {
  return (
    <div className={clsx('text-center py-16 px-6', className)}>
      <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-base-200 text-base-content/40 mb-4">
        <Icon className="size-8" />
      </div>
      <h3 className="text-lg font-medium text-base-content">{title}</h3>
      {description && (
        <p className="text-sm text-base-content/60 mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
