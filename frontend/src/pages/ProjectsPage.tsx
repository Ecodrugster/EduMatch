import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { useToast } from '../components/ToastProvider';
import { fetchProjects, createProject, deleteProject } from '../api/projects';
import { Project } from '../types';
import { ProjectModal } from '../components/ProjectModal';

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, error, isLoading, isError } = useQuery<Project[], Error>({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  });

  // Handle query error effect since onError is removed from useQuery in v5
  React.useEffect(() => {
    if (isError && error) {
      addToast(error.message || 'Не удалось загрузить проекты', 'error');
    }
  }, [isError, error, addToast]);

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
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
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      addToast('Проект удален', 'success');
    },
  });

  if (isLoading) return <div className="text-cyan-100 text-center mt-8">Загрузка проектов...</div>;
  if (error) return <div className="text-cyan-100 text-center mt-8">Ошибка загрузки.</div>;

  return (
    <div className="p-8 bg-gradient-to-br from-gray-800 to-gray-700 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-cyan-100 m-0">Дашборд Проектов</h1>
          <p className="text-gray-300 mt-2">Здесь отображаются проекты, отсортированные по совпадению с вашими навыками.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-cyan-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-cyan-600 transition-colors"
        >
          Добавить проект
        </button>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
        {data && data.length > 0 ? (
          data.map((project) => (
            <Card 
              key={project.id} 
              project={project} 
              onDelete={() => deleteMutation.mutate(project.id)} 
            />
          ))
        ) : (
          <div className="text-cyan-100 mt-8 col-span-full">Нет проектов.</div>
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
