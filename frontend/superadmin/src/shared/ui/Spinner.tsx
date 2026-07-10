export function Spinner({ className = 'size-6' }: { className?: string }): React.ReactElement {
  return <span className={`loading loading-spinner ${className}`} />;
}
