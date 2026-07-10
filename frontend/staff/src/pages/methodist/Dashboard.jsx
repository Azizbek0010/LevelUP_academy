import { BookOpen, Layers, FileQuestion, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTrainingTypes, useMethodistAnalytics } from '../../queries.js';

export default function MethodistDashboard() {
  const { data: types } = useTrainingTypes();
  const { data: analytics } = useMethodistAnalytics();

  const ttList = types?.data || [];
  const tests = analytics?.data?.tests || [];
  const hw = analytics?.data?.homework || [];

  const totalTests = tests.length;
  const totalHw = hw.length;
  const avgScore = tests.length > 0
    ? Math.round(tests.reduce((s, t) => s + Number(t.avg_score || 0), 0) / tests.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1D2417]">Дашборд методиста</h1>
        <p className="text-sm opacity-60">Управление учебными материалами и методиками</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-white shadow-sm border border-[#E6EDD8]">
          <div className="card-body p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#eef7e4] rounded-xl"><BookOpen size={20} className="text-[#46543a]" /></div>
              <span className="text-sm opacity-60 font-medium">Типы обучения</span>
            </div>
            <div className="text-2xl font-bold mt-2">{ttList.length}</div>
          </div>
        </div>
        <div className="card bg-white shadow-sm border border-[#E6EDD8]">
          <div className="card-body p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#eef7e4] rounded-xl"><Layers size={20} className="text-[#46543a]" /></div>
              <span className="text-sm opacity-60 font-medium">Всего тем</span>
            </div>
            <div className="text-2xl font-bold mt-2">{ttList.reduce((s, t) => s + (t.topics_count || 0), 0)}</div>
          </div>
        </div>
        <div className="card bg-white shadow-sm border border-[#E6EDD8]">
          <div className="card-body p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#eef7e4] rounded-xl"><FileQuestion size={20} className="text-[#46543a]" /></div>
              <span className="text-sm opacity-60 font-medium">Тестов</span>
            </div>
            <div className="text-2xl font-bold mt-2">{totalTests}</div>
          </div>
        </div>
        <div className="card bg-white shadow-sm border border-[#E6EDD8]">
          <div className="card-body p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#eef7e4] rounded-xl"><TrendingUp size={20} className="text-[#46543a]" /></div>
              <span className="text-sm opacity-60 font-medium">Средний балл</span>
            </div>
            <div className="text-2xl font-bold mt-2">{avgScore}%</div>
          </div>
        </div>
      </div>

      <div className="card bg-white shadow-sm border border-[#E6EDD8]">
        <div className="card-body p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold">Типы обучения</h2>
            <Link to="/methodist/types" className="btn btn-ghost btn-xs text-[#1D2417] font-bold">Все →</Link>
          </div>
          {ttList.length === 0 ? (
            <div className="text-center py-8 opacity-50">
              <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Нет типов обучения. <Link to="/methodist/types" className="link link-primary">Создать первый</Link></p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ttList.slice(0, 4).map((tt) => (
                <Link key={tt.id} to={`/methodist/types/${tt.id}/topics`}
                  className="block p-4 bg-[#F6FBEA] rounded-xl border border-[#E6EDD8] hover:bg-[#EEF7DE] transition-colors"
                >
                  <div className="text-xl mb-1">{tt.icon || '📚'}</div>
                  <div className="font-semibold">{tt.name}</div>
                  <div className="text-xs opacity-50">{tt.topics_count || 0} тем</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
