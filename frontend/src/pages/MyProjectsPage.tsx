import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { useToast } from '../components/ToastProvider';
import { fetchMyProjects, createProject, deleteProject, getProject } from '../api/projects';
import { getMyApplications, Application } from '../api/applications';
import { Project } from '../types';
import { ProjectModal } from '../components/ProjectModal';
import { useAuth } from '../context/AuthContext';

const ApplicationItem = ({ app }: { app: Application }) => {
  const { data: project } = useQuery({
    queryKey: ['project', app.project_id],
    queryFn: () => getProject(app.project_id),
  });

  const statusColor = app.status === 'approved' ? 'text-green-500' : app.status === 'rejected' ? 'text-red-500' : 'text-yellow-500';
  const statusText = app.status === 'approved' ? 'Одобрена' : app.status === 'rejected' ? 'Отклонена' : 'На рассмотрении';

  return (
    <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl shadow-lg hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
      <h3 className="m-0 font-bold text-cyan-800 dark:text-cyan-100 text-lg">{project?.title || `Проект #${app.project_id}`}</h3>
      <p className="text-gray-600 dark:text-gray-300 text-sm mt-2 line-clamp-2">{app.message}</p>
      <div className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-bold border ${
        app.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
        app.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
        'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
      }`}>
        {statusText}
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
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 max-w-6xl mx-auto">
        {data && data.length > 0 ? (
          data.map((project) => (
            <Card 
              key={project.id} 
              project={project} 
              onDelete={project.owner_id === userId ? () => deleteMutation.mutate(project.id) : undefined} 
            />
          ))
        ) : (
          <div className="text-cyan-800 dark:text-cyan-100 mt-8 col-span-full">У вас пока нет проектов.</div>
        )}
      </div>

      <div className="mt-16 max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold text-cyan-800 dark:text-cyan-100 mb-6 border-b border-gray-200 dark:border-gray-700 pb-2">Мои заявки</h2>
        {isLoadingApps ? (
          <div className="text-cyan-800 dark:text-cyan-100">Загрузка заявок...</div>
        ) : applications && applications.length > 0 ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
            {applications.map(app => <ApplicationItem key={app.id} app={app} />)}
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
