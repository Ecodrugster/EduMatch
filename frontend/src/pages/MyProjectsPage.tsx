import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { useToast } from '../components/ToastProvider';
import { fetchMyProjects, createProject, updateProject, deleteProject, getProject, leaveProject } from '../api/projects';
import { getMyApplications, Application, updateApplicationStatus } from '../api/applications';
import { Project } from '../types';
import { ProjectModal } from '../components/ProjectModal';
import { useAuth } from '../context/AuthContext';
import { FolderGit2, Handshake, Mail } from 'lucide-react';

const ApplicationItem = ({ app }: { app: Application }) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data: project } = useQuery({
    queryKey: ['project', app.project_id],
    queryFn: () => getProject(app.project_id),
  });

  const statusMutation = useMutation({
    mutationFn: updateApplicationStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      addToast('Статус приглашения обновлен', 'success');
    },
    onError: (err: any) => {
      addToast(err.message || 'Ошибка обновления статуса', 'error');
    }
  });

  const isInvited = app.status === 'invited';
  const statusText = app.status === 'approved' ? 'Одобрена' : app.status === 'rejected' ? 'Отклонена' : app.status === 'invited' ? 'Приглашение' : 'На рассмотрении';

  return (
    <div className="bg-white dark:bg-slate-900/45 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
      <div>
        <h3 className="m-0 font-extrabold text-slate-800 dark:text-slate-100 text-base">{project?.title || `Проект #${app.project_id}`}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed line-clamp-2">{app.message}</p>
      </div>
      <div>
        {isInvited ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => statusMutation.mutate({ id: app.id, status: 'approved' })}
              disabled={statusMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Принять
            </button>
            <button
              onClick={() => statusMutation.mutate({ id: app.id, status: 'rejected' })}
              disabled={statusMutation.isPending}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Отклонить
            </button>
          </div>
        ) : (
          <div className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold border ${
            app.status === 'approved' ? 'bg-emerald-100/80 text-emerald-700 border-emerald-200/40 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900' :
            app.status === 'rejected' ? 'bg-red-100/80 text-red-700 border-red-200/40 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900' :
            'bg-amber-100/80 text-amber-700 border-amber-200/40 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900'
          }`}>
            {statusText}
          </div>
        )}
      </div>
    </div>
  );
};

export default function MyProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const { data, error, isLoading, isError } = useQuery<Project[], Error>({
    queryKey: ['my-projects'],
    queryFn: fetchMyProjects,
  });

  const { data: applications, isLoading: isLoadingApps } = useQuery<Application[], Error>({
    queryKey: ['my-applications'],
    queryFn: getMyApplications,
  });

  React.useEffect(() => {
    if (isError && error) {
      addToast(error.message || 'Не удалось загрузить проекты', 'error');
    }
  }, [isError, error, addToast]);

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      setIsModalOpen(false);
      addToast('Проект успешно создан', 'success');
    },
    onError: (err: Error) => {
      addToast(err.message || 'Ошибка создания', 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, project }: { id: number; project: any }) => updateProject(id, project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      setIsModalOpen(false);
      setEditingProject(null);
      addToast('Проект успешно обновлен', 'success');
    },
    onError: (err: Error) => {
      addToast(err.message || 'Ошибка обновления', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      addToast('Проект удален', 'success');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: leaveProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      addToast('Вы успешно вышли из проекта', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || err.message || 'Ошибка выхода из проекта', 'error');
    }
  });

  if (isLoading) return <div className="text-cyan-600 dark:text-cyan-400 text-center mt-12 font-semibold">Загрузка ваших проектов...</div>;
  if (error) return <div className="text-red-500 text-center mt-12">Ошибка загрузки.</div>;

  const invitations = applications?.filter(app => app.status === 'invited') || [];
  const myApplications = applications?.filter(app => app.status !== 'invited') || [];

  const createdProjects = data?.filter(project => project.owner_id === userId) || [];
  const joinedProjects = data?.filter(project => project.owner_id !== userId) || [];

  return (
    <div className="p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-50/20 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 min-h-screen">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 m-0 tracking-tight">Мои Проекты</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-medium">Проекты, которые вы создали или в которых участвуете.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 cursor-pointer text-sm"
        >
          Добавить проект
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Колонка: Созданные мной */}
        <div className="flex flex-col gap-5">
          <h2 className="text-xl font-bold text-slate-855 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between tracking-tight">
            <span className="flex items-center gap-2"><FolderGit2 size={20} className="text-cyan-550 text-cyan-500" /> Созданные мной</span>
            <span className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-350 text-xs px-2.5 py-1 rounded-full font-bold border border-slate-200/50 dark:border-slate-800">
              {createdProjects.length}
            </span>
          </h2>
          <div className="flex flex-col gap-4">
            {createdProjects.length > 0 ? (
              createdProjects.map((project) => (
                <Card 
                  key={project.id} 
                  project={project} 
                  onEdit={() => {
                    setEditingProject(project);
                    setIsModalOpen(true);
                  }}
                  onDelete={() => deleteMutation.mutate(project.id)} 
                />
              ))
            ) : (
              <div className="text-slate-400 dark:text-slate-500 py-8 text-center bg-white/40 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 text-sm font-medium">
                У вас нет созданных проектов.
              </div>
            )}
          </div>
        </div>

        {/* Колонка: В которых участвую */}
        <div className="flex flex-col gap-5">
          <h2 className="text-xl font-bold text-slate-855 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between tracking-tight">
            <span className="flex items-center gap-2"><Handshake size={20} className="text-emerald-500" /> В которых участвую</span>
            <span className="bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-350 text-xs px-2.5 py-1 rounded-full font-bold border border-slate-200/50 dark:border-slate-800">
              {joinedProjects.length}
            </span>
          </h2>
          <div className="flex flex-col gap-4">
            {joinedProjects.length > 0 ? (
              joinedProjects.map((project) => (
                <Card 
                  key={project.id} 
                  project={project} 
                  onLeave={() => leaveMutation.mutate(project.id)}
                />
              ))
            ) : (
              <div className="text-slate-400 dark:text-slate-500 py-8 text-center bg-white/40 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 text-sm font-medium">
                Вы пока не участвуете в других проектах.
              </div>
            )}
          </div>
        </div>
      </div>

      {invitations.length > 0 && (
        <div className="mt-16 max-w-6xl mx-auto">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2.5 tracking-tight">
            <Mail size={20} className="text-cyan-500" /> Приглашения в проекты
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {invitations.map(app => <ApplicationItem key={app.id} app={app} />)}
          </div>
        </div>
      )}

      <div className="mt-16 max-w-6xl mx-auto">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 tracking-tight">Мои заявки</h2>
        {isLoadingApps ? (
          <div className="text-slate-400 dark:text-slate-500 text-sm font-semibold">Загрузка заявок...</div>
        ) : myApplications.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
            {myApplications.map(app => <ApplicationItem key={app.id} app={app} />)}
          </div>
        ) : (
          <div className="text-slate-400 dark:text-slate-500 text-sm font-medium">У вас пока нет поданных заявок.</div>
        )}
      </div>

      <ProjectModal 
        isOpen={isModalOpen} 
        project={editingProject || undefined}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProject(null);
        }} 
        onSubmit={(data) => {
          if (editingProject) {
            updateMutation.mutate({ id: editingProject.id, project: data });
          } else {
            createMutation.mutate(data);
          }
        }} 
      />
    </div>
  );
}
