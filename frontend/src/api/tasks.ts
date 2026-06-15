import axiosInstance from './axios';

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: string; // 'TODO', 'IN_PROGRESS', 'DONE'
  assigned_to?: number;
  created_at: string;
}

export const fetchTasks = async (projectId: number): Promise<Task[]> => {
  const response = await axiosInstance.get(`/protected/projects/${projectId}/tasks`);
  return response.data.tasks;
};

export const createTask = async (projectId: number, data: { title: string; description: string; assigned_to?: number }): Promise<Task> => {
  const response = await axiosInstance.post(`/protected/projects/${projectId}/tasks`, data);
  return response.data.task;
};

export const updateTaskStatus = async (taskId: number, status: string): Promise<void> => {
  await axiosInstance.patch(`/protected/tasks/${taskId}/status`, { status });
};

export const deleteTask = async (taskId: number): Promise<void> => {
  await axiosInstance.delete(`/protected/tasks/${taskId}`);
};
