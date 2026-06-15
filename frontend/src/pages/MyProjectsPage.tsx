import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { useToast } from '../components/ToastProvider';
import { fetchMyProjects, createProject, deleteProject } from '../api/projects';
import { Project } from '../types';
import { ProjectModal } from '../components/ProjectModal';
import { useAuth } from '../context/AuthContext';

export default function MyProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const { data, error, isLoading, isError } = useQuery<Project[], Error>({
    queryKey: ['my-projects'],
    queryFn: fetchMyProjects,
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
      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={(data) => createMutation.mutate(data)} 
      />
    </div>
  );
}
