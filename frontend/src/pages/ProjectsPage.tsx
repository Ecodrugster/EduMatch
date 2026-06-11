import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import styled from 'styled-components';
import { Card } from '../components/Card';
import { useToast } from '../components/ToastProvider';
import { fetchProjects, createProject, deleteProject } from '../api/projects';
import { Project } from '../types';
import { ProjectModal } from '../components/ProjectModal';

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 2rem;
  background: linear-gradient(135deg, #1e272e, #2d3436);
  min-height: 100vh;
`;

const Loading = styled.div`
  color: #e0f7fa;
  text-align: center;
  margin-top: 2rem;
`;

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useQuery<Project[], Error>(
    ['projects'],
    fetchProjects,
    {
      onError: (err) => {
        addToast(err.message || 'Не удалось загрузить проекты', 'error');
      },
    }
  );

  const createMutation = useMutation(createProject, {
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      setIsModalOpen(false);
      addToast('Проект успешно создан', 'success');
    },
    onError: (err: Error) => {
      addToast(err.message || 'Ошибка создания', 'error');
    },
  });

  const deleteMutation = useMutation(deleteProject, {
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      addToast('Проект удален', 'success');
    },
  });

  if (isLoading) return <Loading>Загрузка проектов...</Loading>;
  if (error) return <Loading>Ошибка загрузки.</Loading>;

  return (
    <GridContainer>
      <button onClick={() => setIsModalOpen(true)}>Добавить проект</button>
      {data && data.length > 0 ? (
        data.map((project) => (
          <Card 
            key={project.id} 
            project={project} 
            onDelete={() => deleteMutation.mutate(project.id)} 
          />
        ))
      ) : (
        <Loading>Нет проектов.</Loading>
      )}
      <ProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={(data) => createMutation.mutate(data)} 
      />
    </GridContainer>
  );
}
