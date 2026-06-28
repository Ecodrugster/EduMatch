import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, createTask, updateTaskStatus, deleteTask, Task } from '../api/tasks';
import { getProject } from '../api/projects';
import { getMembersByProject } from '../api/applications';
import { fetchUser } from '../api/users';
import { useToast } from './ToastProvider';

interface KanbanBoardProps {
  projectId: number;
}

const COLUMNS = [
  { id: 'TODO', title: 'В планах' },
  { id: 'IN_PROGRESS', title: 'В работе' },
  { id: 'DONE', title: 'Готово' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId }) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState<number | undefined>(undefined);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => fetchTasks(projectId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', projectId],
    queryFn: () => getMembersByProject(projectId),
    enabled: projectId > 0,
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => getProject(projectId),
    enabled: projectId > 0,
  });

  const { data: owner } = useQuery({
    queryKey: ['user', project?.owner_id],
    queryFn: () => fetchUser(project!.owner_id),
    enabled: !!project?.owner_id,
  });

  const assignees = React.useMemo(() => {
    const list: { id: number; username: string }[] = [];
    if (owner) {
      list.push({ id: Number(owner.id), username: `${owner.username} (Создатель)` });
    }
    members.forEach(m => {
      if (owner && Number(m.user_id) === Number(owner.id)) return;
      list.push({ id: Number(m.user_id), username: m.username || `Пользователь #${m.user_id}` });
    });
    return list;
  }, [owner, members]);

  const getAssigneeName = (userId: number) => {
    if (owner && Number(owner.id) === Number(userId)) return `${owner.username} (Создатель)`;
    const member = members.find(m => Number(m.user_id) === Number(userId));
    if (member) return member.username || `Пользователь #${userId}`;
    return `Пользователь #${userId}`;
  };

  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateTaskStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    },
    onError: () => {
      addToast('Ошибка обновления статуса', 'error');
      setLocalTasks(tasks); // rollback
    }
  });

  const createMutation = useMutation({
    mutationFn: (params: { title: string; assigned_to?: number }) => 
      createTask(projectId, { title: params.title, description: '', assigned_to: params.assigned_to }),
    onSuccess: () => {
      setNewTaskTitle('');
      setNewTaskAssignee(undefined);
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
      addToast('Задача добавлена', 'success');
    },
    onError: () => addToast('Ошибка создания задачи', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] });
    }
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = parseInt(draggableId, 10);
    const newStatus = destination.droppableId;

    // Optimistic update
    const updatedTasks = localTasks.map(t => 
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setLocalTasks(updatedTasks);

    // Backend update
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      createMutation.mutate({ title: newTaskTitle, assigned_to: newTaskAssignee });
    }
  };

  if (isLoading) return <div className="text-gray-500 dark:text-gray-600 dark:text-gray-300">Загрузка задач...</div>;

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <form onSubmit={handleCreateTask} className="flex gap-2 items-center flex-wrap">
        <input 
          type="text" 
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          placeholder="Новая задача..."
          className="flex-1 min-w-[200px] p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <select
          value={newTaskAssignee || ''}
          onChange={e => setNewTaskAssignee(e.target.value ? Number(e.target.value) : undefined)}
          className="p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white max-w-[220px]"
        >
          <option value="">Назначить исполнителя...</option>
          {assignees.map(a => (
            <option key={a.id} value={a.id}>{a.username}</option>
          ))}
        </select>
        <button type="submit" className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-500 font-semibold cursor-pointer">Добавить</button>
      </form>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col sm:flex-row gap-4 items-start w-full">
          {COLUMNS.map(col => (
            <div key={col.id} className="flex-1 w-full bg-gray-100 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 min-h-[300px]">
              <h3 className="m-0 mb-4 font-bold text-gray-700 dark:text-gray-250 dark:text-gray-200">{col.title}</h3>
              <Droppable droppableId={col.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex flex-col gap-2 min-h-[200px]"
                  >
                    {localTasks.filter(t => t.status === col.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 bg-white dark:bg-gray-700 rounded shadow-sm border border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 flex justify-between items-center group
                              ${snapshot.isDragging ? 'shadow-lg ring-2 ring-cyan-500 opacity-90' : ''}
                            `}
                          >
                            <div className="flex flex-col gap-1">
                              <span className="font-semibold">{task.title}</span>
                              {task.assigned_to && (
                                <span className="text-xs text-cyan-650 dark:text-cyan-400 font-medium flex items-center gap-1">
                                  👤 {getAssigneeName(task.assigned_to)}
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={() => deleteMutation.mutate(task.id)}
                              className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                              title="Удалить"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};
