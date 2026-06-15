import axiosInstance from './axios';

export const fetchProjects = async () => {
  const response = await axiosInstance.get('/protected/projects');
  return response.data.projects; // expected array of Project objects
};

export const getProject = async (id: number) => {
  const response = await axiosInstance.get(`/protected/projects/${id}`);
  return response.data.project;
};

export const createProject = async (project: any) => {
  const response = await axiosInstance.post('/protected/projects', project);
  return response.data;
};

export const updateProject = async (id: number, project: any) => {
  const response = await axiosInstance.patch(`/protected/projects/${id}`, project);
  return response.data;
};

export const deleteProject = async (id: number) => {
  await axiosInstance.delete(`/protected/projects/${id}`);
};
