import clsx from 'clsx';
import type { ReactNode } from 'react';

type Variant = 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'ghost';

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const variantClass: Record<Variant, string> = {
  neutral: 'badge-neutral',
  success: 'badge-success',
  warning: 'badge-warning',
  error: 'badge-error',
  info: 'badge-info',
  primary: 'badge-primary',
  ghost: 'badge-ghost',
};

export function Badge({ variant = 'neutral', children, className }: BadgeProps): React.ReactElement {
  return <span className={clsx('badge', variantClass[variant], className)}>{children}</span>;
}
