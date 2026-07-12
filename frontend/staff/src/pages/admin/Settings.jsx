import PageHeader from '../../components/PageHeader.jsx';

// Backend /admin/settings endpoint пока не готов (см. adminService TODO).
// Заглушка staff-native; подключить форму, когда появится эндпоинт.
export default function AdminSettings() {
  return (
    <div>
      <PageHeader title="Настройки" subtitle="Настройки филиала" />
      <div className="card bg-base-100 mt-6">
        <div className="card-body">
          <p className="text-base-content/50 text-sm py-6 text-center">
            Раздел настроек в разработке — ожидается backend-эндпоинт <code>/admin/settings</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
