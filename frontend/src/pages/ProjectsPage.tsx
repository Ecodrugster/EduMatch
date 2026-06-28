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
import { Sparkles, FolderOpen } from 'lucide-react';

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
    <div className="p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-50/20 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 min-h-screen">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-150 dark:text-slate-100 m-0 tracking-tight">Общий Дашборд</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-sm font-medium">Ищите интересные проекты или талантливых студентов по навыкам.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 cursor-pointer text-sm"
          >
            Добавить проект
          </button>
        </div>

        {/* Search & Toggle Bar */}
        <div className="bg-white/80 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-850/60 backdrop-blur-md flex flex-col md:flex-row gap-4 items-center shadow-sm">
          <div className="flex bg-slate-100 dark:bg-slate-950/40 rounded-xl p-1 border border-slate-200/30 dark:border-slate-850 w-full md:w-auto">
            <button
              onClick={() => setSearchMode('projects')}
              className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                searchMode === 'projects' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200/20 dark:border-slate-800/40' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Проекты
            </button>
            <button
              onClick={() => setSearchMode('students')}
              className={`flex-1 md:flex-none px-5 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                searchMode === 'students' ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm border border-slate-200/20 dark:border-slate-800/40' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
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
            className="flex-1 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-250/80 border-slate-200 dark:border-slate-850 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all w-full placeholder-slate-400"
          />
        </div>

        {/* Content Area */}
        {searchMode === 'projects' && (
          <div className="flex flex-col gap-10">
            {isLoadingProjects ? (
              <div className="text-cyan-600 dark:text-cyan-400 text-center py-16 font-semibold">Загрузка проектов...</div>
            ) : projectsData && projectsData.length > 0 ? (
              <>
                {recommendedProjects.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                      <Sparkles size={18} className="text-cyan-500" /> Рекомендуемые проекты
                    </h2>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
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
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                    <FolderOpen size={18} className="text-slate-400" /> Все проекты
                  </h2>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
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
              <div className="text-slate-500 dark:text-slate-400 text-center py-16 bg-white/40 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Проекты не найдены.
              </div>
            )}
          </div>
        )}

        {searchMode === 'students' && (
          <div>
            {isLoadingUsers ? (
              <div className="text-cyan-600 dark:text-cyan-400 text-center py-16 font-semibold">Загрузка студентов...</div>
            ) : usersData && usersData.length > 0 ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
                {usersData.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))}
              </div>
            ) : (
              <div className="text-slate-500 dark:text-slate-400 text-center py-16 bg-white/40 dark:bg-slate-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                Студенты не найдены.
              </div>
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
