import { useAdminSettings } from '../../queries.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Clock, Info } from 'lucide-react';
import { SkeletonKpis } from '../../components/Skeleton.jsx';
import { Tip } from '../mentor/_ui.jsx';

export default function AdminSettings() {
  const { data: settingsData, isLoading, error } = useAdminSettings();
  const settings = settingsData?.data || settingsData || {};

  return (
    <div className="space-y-6 pb-8">
      <PageHeader 
        title="Настройки филиала" 
        subtitle="Просмотр глобальных настроек (Редактирование доступно только Super Admin)"
      />

      <Tip
        icon={Info}
        title="Режим чтения"
        text="Эти настройки устанавливаются руководством (Super Admin) и применяются ко всему филиалу. Вы можете только просматривать их значения."
        tone="info"
      />

      {isLoading ? (
        <SkeletonKpis />
      ) : error ? (
        <div className="alert alert-error">Ошибка загрузки: {error.message}</div>
      ) : (
        <div className="max-w-2xl space-y-5 animate-fade-in">
          <div
            className="rounded-2xl border transition-all duration-300"
            style={{
              background: 'var(--glass-bg)',
              borderColor: 'var(--glass-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: '#3b82f615' }}
                >
                  <Clock size={17} style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Параметры обучения</h3>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Глобальные настройки организации</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border bg-base-200/50">
                  <div className="flex-1 min-w-0">
                    <label className="block text-[13px] font-semibold text-base-content">
                      Длительность урока (мин)
                    </label>
                    <p className="text-[11px] text-base-content/60 mt-1">Применяется ко всем группам филиала</p>
                  </div>
                  <div className="text-lg font-bold text-primary">
                    {settings.lessonDurationMin || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
