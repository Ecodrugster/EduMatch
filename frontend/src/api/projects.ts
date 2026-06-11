import axiosInstance from './axios';

export const fetchProjects = async () => {
  const response = await axiosInstance.get('/projects');
  return response.data; // expected array of Project objects
};

export const createProject = async (project: any) => {
  const response = await axiosInstance.post('/projects', project);
  return response.data;
};

export const updateProject = async (id: number, project: any) => {
  const response = await axiosInstance.put(`/projects/${id}`, project);
  return response.data;
};

export const deleteProject = async (id: number) => {
  await axiosInstance.delete(`/projects/${id}`);
};
