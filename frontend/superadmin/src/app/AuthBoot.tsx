import { useEffect, type ReactNode } from 'react';
import { useAuthStore, type AuthUser } from '../shared/stores/auth';

export function AuthBoot({ children }: { children: ReactNode }): React.ReactElement {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      useAuthStore.setState({ status: 'loading' });
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });
        if (!res.ok) throw new Error('no session');
        const data = (await res.json()) as { accessToken: string; user: AuthUser };
        if (cancelled) return;
        useAuthStore.setState({ accessToken: data.accessToken, user: data.user, status: 'authenticated' });
      } catch {
        if (!cancelled) {
          useAuthStore.setState({ accessToken: null, user: null, status: 'unauthenticated' });
        }
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}
