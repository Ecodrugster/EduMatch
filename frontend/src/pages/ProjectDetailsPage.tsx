import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProject } from '../api/projects';
import { createApplication, getApplicationsByProject, updateApplicationStatus, getMembersByProject } from '../api/applications';
import { Chat } from '../components/Chat';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import { Project } from '../types';

import { KanbanBoard } from '../components/KanbanBoard';

export default function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || '0', 10);
  const { userId } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [message, setMessage] = useState('');
  const [hasApplied, setHasApplied] = useState(false);
  const [tab, setTab] = useState<'chat' | 'tasks'>('chat');

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
    <div className="p-8 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-700 transition-colors duration-200 min-h-screen">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        
        {/* Project Header */}
        <div className="bg-white/10 p-8 rounded-xl shadow-2xl backdrop-blur-md relative">
          <button 
            onClick={() => navigate('/projects')}
            className="absolute top-4 right-4 bg-transparent border border-gray-500 text-gray-600 dark:text-gray-300 px-3 py-1 rounded hover:text-gray-900 dark:text-white transition-colors cursor-pointer"
          >
            Назад
          </button>
          <h1 className="text-4xl font-bold text-cyan-800 dark:text-cyan-100 m-0 mb-4">{project.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap text-lg mb-6">{project.description}</p>
          
          <div className="flex flex-wrap gap-2">
            {project.skills_required?.map(skill => (
              <span key={skill} className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium border border-cyan-500/30">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Action Area depending on role */}
        {!isOwner ? (
          !isMember ? (
            hasApplied ? (
              <div className="bg-white/5 border border-green-500/30 p-6 rounded-xl shadow-lg text-center">
                <p className="text-green-400 text-lg m-0">Ваша заявка успешно отправлена!</p>
              </div>
            ) : (
              <div className="bg-white/5 border border-cyan-500/30 p-6 rounded-xl shadow-lg">
                <h2 className="text-2xl text-cyan-800 dark:text-cyan-100 mt-0 mb-4">Подать заявку в команду</h2>
                <form onSubmit={handleApply} className="flex flex-col gap-4">
                  <label className="flex flex-col text-gray-600 dark:text-gray-300 text-sm">
                    Сопроводительное письмо
                    <textarea 
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      className="mt-2 p-3 min-h-[100px] resize-y border border-gray-300 dark:border-gray-600 rounded-md bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                      placeholder="Расскажите, почему вы хотите присоединиться к этому проекту..."
                      required
                    />
                  </label>
                  <button 
                    type="submit" 
                    disabled={applyMutation.isPending || !message.trim()}
                    className="bg-cyan-500 text-white font-bold px-6 py-3 rounded-md hover:bg-cyan-600 transition-colors disabled:opacity-50 self-start"
                  >
                    {applyMutation.isPending ? 'Отправка...' : 'Отправить заявку'}
                  </button>
                </form>
              </div>
            )
          ) : (
            <div className="bg-white/5 border border-green-500/30 p-6 rounded-xl shadow-lg text-center">
              <p className="text-green-400 text-lg m-0">Вы являетесь участником этого проекта.</p>
            </div>
          )
        ) : (
          <div className="bg-white/5 border border-gray-300 dark:border-gray-600 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl text-cyan-800 dark:text-cyan-100 mt-0 mb-4">Заявки от кандидатов</h2>
            {appsLoading ? (
              <p className="text-gray-500 dark:text-gray-400">Загрузка заявок...</p>
            ) : applications.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Пока нет новых заявок.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {applications.map(app => (
                  <div key={app.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-1"><span className="text-cyan-400 font-semibold">Кандидат ID:</span> {app.user_id}</p>
                      <p className="text-gray-900 dark:text-white italic">"{app.message}"</p>
                      <p className="text-xs text-gray-500 mt-2">Статус: {app.status}</p>
                    </div>
                    {app.status === 'pending' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleStatusChange(app.id, 'approved')}
                          className="bg-green-500/20 text-green-400 border border-green-500/50 px-4 py-2 rounded cursor-pointer hover:bg-green-500/40 transition-colors"
                        >
                          Принять
                        </button>
                        <button 
                          onClick={() => handleStatusChange(app.id, 'rejected')}
                          className="bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded cursor-pointer hover:bg-red-500/40 transition-colors"
                        >
                          Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Project Area for Members (Chat & Kanban) */}
        {(isOwner || isMember) && (
          <div className="mt-8 bg-white/5 border border-gray-300 dark:border-gray-600 p-6 rounded-xl shadow-lg">
            <div className="flex gap-4 mb-6 border-b border-gray-300 dark:border-gray-600 pb-2">
              <button
                onClick={() => setTab('chat')}
                className={`text-lg font-semibold px-4 py-2 rounded-md transition-colors ${
                  tab === 'chat' ? 'bg-cyan-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'
                }`}
              >
                Чат
              </button>
              <button
                onClick={() => setTab('tasks')}
                className={`text-lg font-semibold px-4 py-2 rounded-md transition-colors ${
                  tab === 'tasks' ? 'bg-cyan-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-200'
                }`}
              >
                Задачи
              </button>
            </div>

            {tab === 'chat' && <Chat projectId={projectId} />}
            {tab === 'tasks' && <div className="h-[600px]"><KanbanBoard projectId={projectId} /></div>}
          </div>
        )}
      </div>
    </div>
  );
}
