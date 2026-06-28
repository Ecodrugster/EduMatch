import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject } from '../api/projects';
import { createApplication, getApplicationsByProject, updateApplicationStatus, getMembersByProject } from '../api/applications';
import { fetchUser } from '../api/users';
import { Chat } from '../components/Chat';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Project, User as UserType } from '../types';
import { User, Calendar } from 'lucide-react';
import { KanbanBoard } from '../components/KanbanBoard';
import { DocumentsTab } from '../components/DocumentsTab';
import { StudentMatchingTab } from '../components/StudentMatchingTab';

const ApplicationItem = ({ app, onStatusChange }: { app: any; onStatusChange: (id: number, status: 'approved' | 'rejected') => void }) => {
  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ['user', app.user_id],
    queryFn: () => fetchUser(app.user_id),
  });

  return (
    <div className="bg-slate-50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200/50 dark:border-slate-850/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-center">
            {user?.avatar_url ? (
              <img src={`/api${user.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-slate-400" />
            )}
          </div>
          <div>
            <p className="text-base font-extrabold text-slate-800 dark:text-white m-0">
              {isLoading ? 'Загрузка...' : user?.username || `Кандидат ID: ${app.user_id}`}
            </p>
            {user?.skills && user.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {user.skills.map((skill, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 dark:bg-slate-800/55 dark:text-slate-300 border border-slate-200/30 px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-800/80">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold mb-1">Сопроводительное письмо:</p>
          <p className="text-slate-800 dark:text-slate-200 text-sm m-0 italic">"{app.message}"</p>
        </div>
        
        <p className="text-xs text-slate-550 dark:text-slate-450 m-0">Текущий статус: <span className="font-bold text-cyan-600 dark:text-cyan-400">{app.status}</span></p>
      </div>

      {app.status === 'pending' && (
        <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
          <button 
            onClick={() => onStatusChange(app.id, 'approved')}
            className="flex-1 md:flex-initial bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2 rounded-xl transition-colors shadow-sm text-sm cursor-pointer"
          >
            Принять
          </button>
          <button 
            onClick={() => onStatusChange(app.id, 'rejected')}
            className="flex-1 md:flex-initial bg-red-500 hover:bg-red-600 text-white font-bold px-5 py-2 rounded-xl transition-colors shadow-sm text-sm cursor-pointer"
          >
            Отклонить
          </button>
        </div>
      )}
    </div>
  );
};

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || '0', 10);
  const { userId } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [tab, setTab] = useState<'chat' | 'tasks' | 'documents' | 'matching'>('chat');

  const { data: project, isLoading, isError } = useQuery<Project, Error>({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: projectId > 0,
  });

  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['applications', projectId],
    queryFn: () => getApplicationsByProject(projectId),
    enabled: projectId > 0 && project?.owner_id === userId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => getMembersByProject(projectId),
    enabled: projectId > 0,
  });

  const applyMutation = useMutation({
    mutationFn: createApplication,
    onSuccess: () => {
      addToast('Заявка успешно отправлена!', 'success');
      setMessage('');
      setHasApplied(true);
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || err.message || 'Ошибка при отправке', 'error');
    },
  });

  const statusMutation = useMutation({
    mutationFn: updateApplicationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', projectId] });
      addToast('Статус заявки обновлен', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || err.message || 'Ошибка обновления', 'error');
    },
  });

  if (isLoading) return <div className="text-center text-cyan-800 dark:text-cyan-100 mt-8">Загрузка проекта...</div>;
  if (isError || !project) return <div className="text-center text-red-500 mt-8">Ошибка: Проект не найден</div>;

  const isOwner = project.owner_id === userId;
  const isMember = members.some(m => m.user_id === userId);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    applyMutation.mutate({ project_id: projectId, message });
  };

  const handleStatusChange = (appId: number, newStatus: 'approved' | 'rejected') => {
    statusMutation.mutate({ id: appId, status: newStatus });
  };

  return (
    <div className="p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-50/20 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 min-h-screen">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Project Header */}
        <div className="bg-white/80 dark:bg-slate-900/40 p-8 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800/80 backdrop-blur-xl relative">
          <button 
            onClick={() => navigate('/projects')}
            className="absolute top-4 right-4 bg-transparent border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
          >
            Назад
          </button>
          <h1 className="text-3xl font-bold text-slate-855 dark:text-slate-100 m-0 mb-2 tracking-tight">{project.title}</h1>
          {(project.start_date || project.end_date) && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-semibold flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 w-fit px-2.5 py-1 rounded-full">
              <Calendar size={12} className="text-slate-400 dark:text-slate-500" />
              <span>Сроки проекта: {project.start_date ? `с ${new Date(project.start_date).toLocaleDateString('ru-RU')}` : ''} {project.end_date ? `по ${new Date(project.end_date).toLocaleDateString('ru-RU')}` : ''}</span>
            </div>
          )}
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap text-base mb-6 leading-relaxed">{project.description}</p>
          
          <div className="flex flex-wrap gap-1.5">
            {project.skills_required?.map(skill => (
              <span key={skill} className="bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-350 px-3 py-1 rounded-xl text-xs font-semibold border border-slate-200/30 dark:border-slate-800/50">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Action Area depending on role */}
        {!isOwner ? (
          !isMember ? (
            hasApplied ? (
              <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl shadow-sm text-center">
                <p className="text-emerald-500 dark:text-emerald-450 text-base font-bold m-0">Ваша заявка успешно отправлена!</p>
              </div>
            ) : (
              <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-xl">
                <h2 className="text-xl font-bold text-slate-855 dark:text-slate-100 mt-0 mb-4 tracking-tight">Подать заявку в команду</h2>
                <form onSubmit={handleApply} className="flex flex-col gap-4">
                  <label className="flex flex-col text-slate-600 dark:text-slate-400 text-sm font-bold gap-1.5">
                    Сопроводительное письмо
                    <textarea 
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      className="p-3 min-h-[100px] resize-y border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium text-sm"
                      placeholder="Расскажите, почему вы хотите присоединиться к этому проекту..."
                      required
                    />
                  </label>
                  <button 
                    type="submit" 
                    disabled={applyMutation.isPending || !message.trim()}
                    className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold px-6 py-2.5 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 disabled:opacity-50 self-start text-sm cursor-pointer"
                  >
                    {applyMutation.isPending ? 'Отправка...' : 'Отправить заявку'}
                  </button>
                </form>
              </div>
            )
          ) : (
            <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 rounded-2xl shadow-sm text-center">
              <p className="text-emerald-500 dark:text-emerald-450 text-base font-bold m-0">Вы являетесь участником этого проекта.</p>
            </div>
          )
        ) : (
          <div className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-xl">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-0 mb-4 tracking-tight">Заявки от кандидатов</h2>
            {appsLoading ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm font-semibold">Загрузка заявок...</p>
            ) : applications.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium">Пока нет новых заявок.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {applications.map((app: any) => (
                  <ApplicationItem key={app.id} app={app} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Project Area for Members (Chat & Kanban) */}
        {(isOwner || isMember) && (
          <div className="mt-4 bg-white/80 dark:bg-slate-900/40 border border-slate-200/50 dark:border-slate-800/80 p-6 rounded-2xl shadow-xl backdrop-blur-xl">
            <div className="flex bg-slate-100 dark:bg-slate-950/40 rounded-xl p-1 border border-slate-200/30 dark:border-slate-850 gap-1 mb-6 max-w-fit">
              <button
                onClick={() => setTab('chat')}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
                  tab === 'chat' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200/20 dark:border-slate-800/40' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Чат
              </button>
              <button
                onClick={() => setTab('tasks')}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
                  tab === 'tasks' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200/20 dark:border-slate-800/40' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Задачи
              </button>
              <button
                onClick={() => setTab('documents')}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
                  tab === 'documents' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200/20 dark:border-slate-800/40' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Документы
              </button>
              {isOwner && (
                <button
                  onClick={() => setTab('matching')}
                  className={`text-xs font-bold px-4 py-2 rounded-lg transition-all duration-300 ${
                    tab === 'matching' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200/20 dark:border-slate-800/40' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Подбор студентов
                </button>
              )}
            </div>

            {tab === 'chat' && <Chat projectId={projectId} />}
            {tab === 'tasks' && <div className="h-[600px]"><KanbanBoard projectId={projectId} /></div>}
            {tab === 'documents' && <DocumentsTab projectId={projectId} isOwner={isOwner} currentUserId={userId} />}
            {tab === 'matching' && isOwner && <StudentMatchingTab projectId={projectId} skillsRequired={project.skills_required} />}
          </div>
        )}
      </div>
    </div>
  );
}
