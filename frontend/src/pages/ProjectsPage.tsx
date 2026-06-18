import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { UserCard } from '../components/UserCard';
import { useToast } from '../components/ToastProvider';
import { fetchProjects, createProject, deleteProject } from '../api/projects';
import { fetchUsers } from '../api/users';
import { Project, User } from '../types';
import { ProjectModal } from '../components/ProjectModal';
import { useAuth } from '../context/AuthContext';

export default function ProjectsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<'projects' | 'students'>('projects');
  const [skillsQuery, setSkillsQuery] = useState('');
  
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useAuth();

  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<Project[], Error>({
    queryKey: ['projects', skillsQuery],
    queryFn: () => fetchProjects({ skills: skillsQuery }),
    enabled: searchMode === 'projects',
  });

  const { data: usersData, isLoading: isLoadingUsers } = useQuery<User[], Error>({
    queryKey: ['users', skillsQuery],
    queryFn: () => fetchUsers(skillsQuery),
    enabled: searchMode === 'students',
  });

  const recommendedProjects = React.useMemo(() => {
    if (!projectsData) return [];
    return projectsData.filter(p => p.match_score !== undefined && p.match_score > 0).slice(0, 3);
  }, [projectsData]);

  const otherProjects = React.useMemo(() => {
    if (!projectsData) return [];
    if (recommendedProjects.length === 0) return projectsData;
    const recIds = new Set(recommendedProjects.map(p => p.id));
    return projectsData.filter(p => !recIds.has(p.id));
  }, [projectsData, recommendedProjects]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkillsQuery(e.target.value);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-700 transition-colors duration-200 min-h-screen">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-cyan-800 dark:text-cyan-100 m-0">Общий Дашборд</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Ищите проекты или студентов по навыкам.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-cyan-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-cyan-600 transition-colors"
          >
            Добавить проект
          </button>
        </div>

        {/* Search & Toggle Bar */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex bg-white dark:bg-gray-900 rounded-md p-1 border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
            <button
              onClick={() => setSearchMode('projects')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded text-sm font-medium transition-colors ${
                searchMode === 'projects' ? 'bg-cyan-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white'
              }`}
            >
              Проекты
            </button>
            <button
              onClick={() => setSearchMode('students')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded text-sm font-medium transition-colors ${
                searchMode === 'students' ? 'bg-cyan-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white'
              }`}
            >
              Студенты
            </button>
          </div>
          
          <input
            type="text"
            placeholder={`Поиск ${searchMode === 'projects' ? 'проектов' : 'студентов'} по навыкам (через запятую)...`}
            value={skillsQuery}
            onChange={handleSearchChange}
            className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-md focus:outline-none focus:border-cyan-500 transition-colors w-full"
          />
        </div>

        {/* Content Area */}
        {searchMode === 'projects' && (
          <div className="flex flex-col gap-10">
            {isLoadingProjects ? (
              <div className="text-cyan-800 dark:text-cyan-100 text-center py-12">Загрузка проектов...</div>
            ) : projectsData && projectsData.length > 0 ? (
              <>
                {recommendedProjects.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-bold text-cyan-800 dark:text-cyan-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Рекомендуемые проекты</h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                      {recommendedProjects.map((project) => (
                        <Card 
                          key={project.id} 
                          project={project} 
                          onDelete={project.owner_id === userId ? () => deleteMutation.mutate(project.id) : undefined} 
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h2 className="text-2xl font-bold text-cyan-800 dark:text-cyan-100 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">Все проекты</h2>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                    {otherProjects.map((project) => (
                      <Card 
                        key={project.id} 
                        project={project} 
                        onDelete={project.owner_id === userId ? () => deleteMutation.mutate(project.id) : undefined} 
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-cyan-800 dark:text-cyan-100 text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">Проекты не найдены.</div>
            )}
          </div>
        )}

        {searchMode === 'students' && (
          <div>
            {isLoadingUsers ? (
              <div className="text-cyan-800 dark:text-cyan-100 text-center py-12">Загрузка студентов...</div>
            ) : usersData && usersData.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6">
                {usersData.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="text-cyan-800 dark:text-cyan-100 text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">Студенты не найдены.</div>
            )}
          </div>
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
