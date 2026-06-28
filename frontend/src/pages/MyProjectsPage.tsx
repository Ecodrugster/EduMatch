import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { useToast } from '../components/ToastProvider';
import { fetchMyProjects, createProject, deleteProject, getProject } from '../api/projects';
import { getMyApplications, Application, updateApplicationStatus } from '../api/applications';
import { Project } from '../types';
import { ProjectModal } from '../components/ProjectModal';
import { useAuth } from '../context/AuthContext';

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
    <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 hover:-translate-y-1 hover:shadow-xl transition-all duration-200 flex flex-col justify-between">
      <div>
        <h3 className="m-0 font-bold text-cyan-800 dark:text-cyan-100 text-lg">{project?.title || `Проект #${app.project_id}`}</h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-2">{app.message}</p>
      </div>
      <div>
        {isInvited ? (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => statusMutation.mutate({ id: app.id, status: 'approved' })}
              disabled={statusMutation.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer"
            >
              Принять
            </button>
            <button
              onClick={() => statusMutation.mutate({ id: app.id, status: 'rejected' })}
              disabled={statusMutation.isPending}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-md font-semibold text-xs transition-colors cursor-pointer"
            >
              Отклонить
            </button>
          </div>
        ) : (
          <div className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold border ${
            app.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
            app.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
            'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
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

  const deleteMutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      addToast('Проект удален', 'success');
    },
  });

  if (isLoading) return <div className="text-cyan-800 dark:text-cyan-100 text-center mt-8">Загрузка ваших проектов...</div>;
  if (error) return <div className="text-cyan-800 dark:text-cyan-100 text-center mt-8">Ошибка загрузки.</div>;

  const invitations = applications?.filter(app => app.status === 'invited') || [];
  const myApplications = applications?.filter(app => app.status !== 'invited') || [];

  const createdProjects = data?.filter(project => project.owner_id === userId) || [];
  const joinedProjects = data?.filter(project => project.owner_id !== userId) || [];

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-700 transition-colors duration-200 min-h-screen">
      <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-cyan-800 dark:text-cyan-100 m-0">Мои Проекты</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Проекты, которые вы создали или в которых участвуете.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-cyan-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-cyan-600 transition-colors"
        >
          Добавить проект
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {/* Колонка: Созданные мной */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-cyan-800 dark:text-cyan-100 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span>🛠️ Созданные мной</span>
            <span className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 text-sm px-2.5 py-0.5 rounded-full font-semibold">
              {createdProjects.length}
            </span>
          </h2>
          <div className="flex flex-col gap-4">
            {createdProjects.length > 0 ? (
              createdProjects.map((project) => (
                <Card 
                  key={project.id} 
                  project={project} 
                  onDelete={() => deleteMutation.mutate(project.id)} 
                />
              ))
            ) : (
              <div className="text-gray-500 dark:text-gray-400 py-6 text-center bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                У вас нет созданных проектов.
              </div>
            )}
          </div>
        </div>

        {/* Колонка: В которых участвую */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-cyan-800 dark:text-cyan-100 pb-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span>🤝 В которых участвую</span>
            <span className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 text-sm px-2.5 py-0.5 rounded-full font-semibold">
              {joinedProjects.length}
            </span>
          </h2>
          <div className="flex flex-col gap-4">
            {joinedProjects.length > 0 ? (
              joinedProjects.map((project) => (
                <Card 
                  key={project.id} 
                  project={project} 
                />
              ))
            ) : (
              <div className="text-gray-500 dark:text-gray-400 py-6 text-center bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                Вы пока не участвуете в других проектах.
              </div>
            )}
          </div>
        </div>
      </div>

      {invitations.length > 0 && (
        <div className="mt-16 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-cyan-800 dark:text-cyan-100 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
            <span>📩</span> Приглашения в проекты
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {invitations.map(app => <ApplicationItem key={app.id} app={app} />)}
          </div>
        </div>
      )}

      <div className="mt-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan-800 dark:text-cyan-100 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">Мои заявки</h2>
        {isLoadingApps ? (
          <div className="text-cyan-800 dark:text-cyan-100">Загрузка заявок...</div>
        ) : myApplications.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {myApplications.map(app => <ApplicationItem key={app.id} app={app} />)}
          </div>
        ) : (
          <div className="text-gray-600 dark:text-gray-400">У вас пока нет поданных заявок.</div>
        )}
      </div>

      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={(data) => createMutation.mutate(data)} 
      />
    </div>
  );
}
