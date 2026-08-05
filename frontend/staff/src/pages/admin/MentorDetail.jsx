import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, Mail, Phone, Award, MessageCircle, Calendar, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../../auth.jsx';
import { useAdminMentors, useAdminGroups } from '../../queries.js';
import { api } from '../../api.js';
import { formatPhone } from '../../format.js';
import PageHeader from '../../components/PageHeader.jsx';
import { Avatar, RowSkeleton } from '../mentor/_ui.jsx';

const STATUS_COLORS = {
  active: { bg: 'var(--color-success)', text: 'oklch(100% 0 0)', label: 'Активен' },
  frozen: { bg: 'var(--color-error)', text: 'oklch(100% 0 0)', label: 'Заморожен' },
};

export default function AdminMentorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: mentorsData, isLoading: mentorsLoading } = useAdminMentors();
  const { data: groupsData, isLoading: groupsLoading } = useAdminGroups();

  // Match Mentors.jsx data extraction exactly
  const rawMentors = mentorsData?.data || mentorsData || {};
  const mentors = rawMentors.mentors || (Array.isArray(rawMentors) ? rawMentors : []);
  const rawGroups = groupsData?.data || groupsData || {};
  const groups = rawGroups.groups || (Array.isArray(rawGroups) ? rawGroups : []);

  // String coercion: URL param is always string, API id can be number or string
  const mentor = mentors.find((m) => String(m.id) === String(id));
  const mentorGroups = groups.filter(g =>
    String(g.mentor?.id) === String(id) ||
    String(g.mentorId) === String(id) ||
    String(g.mentor_id) === String(id)
  );

  if (mentorsLoading) {
    return (
      <div className="p-8">
        <RowSkeleton count={4} />
      </div>
    );
  }

  if (!mentor) {
    return (
      <div className="p-8 text-center text-base-content/50">
        Ментор не найден
      </div>
    );
  }

  const fullName = [mentor.firstName || mentor.first_name, mentor.lastName || mentor.last_name].filter(Boolean).join(' ');
  const status = STATUS_COLORS[mentor.status] || STATUS_COLORS.active;

  return (
    <div className="space-y-6 pb-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/mentors')}
          className="btn btn-circle btn-ghost btn-sm text-base-content/50 hover:text-primary transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <PageHeader title={fullName} subtitle="Профиль ментора" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        {/* Left Column: Profile Card */}
        <div className="card bg-base-100 border border-base-200/50 shadow-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -z-10" />
          <div className="flex flex-col items-center text-center">
            <Avatar name={fullName} size="xl" className="ring-4 ring-base-100 shadow-xl mb-4" />
            <h2 className="text-xl font-bold">{fullName}</h2>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                style={{ backgroundColor: status.bg, color: status.text }}
              >
                {status.label}
              </span>
              {mentor.grade && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent text-accent-content">
                  <Award size={12} className="mr-1" /> {mentor.grade}
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center text-base-content/50 shrink-0">
                <Mail size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50 font-medium">Email</p>
                <p className="font-semibold truncate">{mentor.email || 'Не указан'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center text-base-content/50 shrink-0">
                <Phone size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50 font-medium">Телефон</p>
                <p className="font-semibold">{mentor.phone ? formatPhone(mentor.phone) : 'Не указан'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded-xl bg-base-200 flex items-center justify-center text-base-content/50 shrink-0">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-base-content/50 font-medium">Присоединился</p>
                <p className="font-semibold">
                  {mentor.createdAt ? new Date(mentor.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-base-200 flex gap-2">
            <button
              onClick={() => navigate(`/chat?peer=${mentor.id}`)}
              className="btn btn-primary flex-1 gap-2 shadow-lg shadow-primary/25 rounded-[12px]"
            >
              <MessageCircle size={16} /> Написать
            </button>
          </div>
        </div>

        {/* Right Column: Groups & Stats */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="card bg-base-100 border border-base-200 p-5 flex flex-row items-center gap-4 hover:border-primary/30 transition-colors">
              <div className="w-12 h-12 rounded-[14px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-base-content/50 font-medium">Группы</p>
                <p className="text-2xl font-bold">{mentorGroups.length}</p>
              </div>
            </div>
            
            <div className="card bg-base-100 border border-base-200 p-5 flex flex-row items-center gap-4 hover:border-accent/30 transition-colors">
              <div className="w-12 h-12 rounded-[14px] bg-accent/10 text-accent flex items-center justify-center shrink-0">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-base-content/50 font-medium">Всего учеников</p>
                <p className="text-2xl font-bold">
                  {mentorGroups.reduce((acc, g) => acc + Number(g.students ?? g.studentsCount ?? g.students_count ?? 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-200 overflow-hidden">
            <div className="p-5 border-b border-base-200 bg-base-100/50">
              <h3 className="font-bold">Группы ментора</h3>
            </div>
            {groupsLoading ? (
              <div className="p-5"><RowSkeleton count={2} /></div>
            ) : mentorGroups.length === 0 ? (
              <div className="p-8 text-center text-base-content/40">
                <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-3">
                  <Users size={20} />
                </div>
                <p>У этого ментора пока нет групп</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full text-[13px]">
                  <thead>
                    <tr className="bg-base-200/30">
                      <th>Название</th>
                      <th>Предмет</th>
                      <th>Студенты</th>
                      <th>Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mentorGroups.map(g => {
                      const count = Number(g.students ?? g.studentsCount ?? g.students_count ?? 0);
                      const archived = g.isArchived ?? g.is_archived;
                      return (
                        <tr 
                          key={g.id} 
                          className="hover:bg-base-200/50 cursor-pointer transition-colors"
                          onClick={() => navigate(`/groups/${g.id}`)}
                        >
                          <td className="font-semibold">{g.name}</td>
                          <td className="text-base-content/70">{g.subject}</td>
                          <td>
                            <span className="font-medium tabular-nums">{count}</span>
                            <span className="text-base-content/40"> / {g.maxStudents || 15}</span>
                          </td>
                          <td>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              archived ? 'bg-base-200 text-base-content/50' : 'bg-success/15 text-success'
                            }`}>
                              {archived ? 'Архив' : 'Активна'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
