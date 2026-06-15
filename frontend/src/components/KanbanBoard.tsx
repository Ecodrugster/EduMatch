import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, createTask, updateTaskStatus, deleteTask, Task } from '../api/tasks';
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

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => fetchTasks(projectId),
  });

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
    mutationFn: (title: string) => createTask(projectId, { title, description: '' }),
    onSuccess: () => {
      setNewTaskTitle('');
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
      createMutation.mutate(newTaskTitle);
    }
  };

  if (isLoading) return <div className="text-gray-500 dark:text-gray-600 dark:text-gray-300">Загрузка задач...</div>;

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <form onSubmit={handleCreateTask} className="flex gap-2">
        <input 
          type="text" 
          value={newTaskTitle}
          onChange={e => setNewTaskTitle(e.target.value)}
          placeholder="Новая задача..."
          className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-900 dark:text-white"
        />
        <button type="submit" className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-500">Добавить</button>
      </form>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex flex-col sm:flex-row gap-4 items-start w-full">
          {COLUMNS.map(col => (
            <div key={col.id} className="flex-1 w-full bg-gray-100 dark:bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-200 dark:border-gray-700 min-h-[300px]">
              <h3 className="m-0 mb-4 font-bold text-gray-700 dark:text-gray-700 dark:text-gray-200">{col.title}</h3>
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
                            className={`p-3 bg-white dark:bg-gray-700 rounded shadow-sm border border-gray-200 dark:border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 flex justify-between items-center group
                              ${snapshot.isDragging ? 'shadow-lg ring-2 ring-cyan-500 opacity-90' : ''}
                            `}
                          >
                            <span>{task.title}</span>
                            <button 
                              onClick={() => deleteMutation.mutate(task.id)}
                              className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
