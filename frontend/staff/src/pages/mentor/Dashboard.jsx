import { BookOpen, Users, Clock, CheckSquare } from 'lucide-react';
import { fmt } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';

function Kpi({ Icon, tint, title, value, unit }) {
  return (
    <div className="card bg-base-100">
      <div className="card-body p-5">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl grid place-items-center shrink-0" style={{ background: tint.bg, color: tint.fg }}>
            <Icon size={20} strokeWidth={2.2} />
          </span>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-base-content/45 leading-tight">
            {title}
          </div>
        </div>
        <div className="text-3xl font-extrabold mt-3 leading-none">{value}</div>
        {unit && <div className="text-xs text-base-content/45 mt-1">{unit}</div>}
      </div>
    </div>
  );
}

export default function MentorDashboard() {
  return (
    <div>
      <PageHeader title="Дашборд ментора" subtitle="Мои группы, студенты и занятия" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi Icon={BookOpen} tint={{ bg: '#E0F2FE', fg: '#075985' }} title="Группы" value="0" unit="активных" />
        <Kpi Icon={Users} tint={{ bg: '#EDE9FE', fg: '#5B21B6' }} title="Студенты" value="0" unit="всего" />
        <Kpi Icon={Clock} tint={{ bg: '#DCFCE7', fg: '#166534' }} title="Занятия" value="0" unit="на неделе" />
        <Kpi Icon={CheckSquare} tint={{ bg: '#FEF9C3', fg: '#854D0E' }} title="ДЗ" value="0" unit="на проверке" />
      </div>

      <div className="card bg-base-100 mt-6">
        <div className="card-body">
          <h2 className="card-title text-base mb-2">Мои группы</h2>
          <p className="text-base-content/40 text-sm py-6 text-center">
            Панель ментора в разработке. Скоро здесь появится расписание, посещаемость и успеваемость студентов.
          </p>
        </div>
      </div>
    </div>
  );
}
