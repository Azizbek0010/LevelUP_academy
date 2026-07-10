import { ExternalLink } from 'lucide-react';

const SUPERADMIN_URL = import.meta.env.VITE_SUPERADMIN_URL || 'http://localhost:5175';

// Super Admin панель переехала в отдельное приложение frontend/superadmin
// (ветка shohjahon, 2026-07-11) — эта старая staff-версия отключена.
export default function SuperMoved() {
  return (
    <div className="card bg-base-100">
      <div className="card-body items-center text-center py-16 gap-3">
        <h1 className="text-xl font-bold">Панель Super Admin переехала</h1>
        <p className="text-base-content/60 max-w-md">
          Теперь Super Admin работает в отдельном приложении.
        </p>
        <a href={SUPERADMIN_URL} className="btn btn-primary btn-sm gap-1.5 mt-2">
          Открыть новую панель <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
}
