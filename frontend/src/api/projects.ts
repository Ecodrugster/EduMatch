import axiosInstance from './axios';

export const fetchProjects = async (params?: { skills?: string, title?: string }) => {
  const response = await axiosInstance.get('/protected/projects', { params });
  return response.data.projects; // expected array of Project objects
};

export const fetchMyProjects = async () => {
  const response = await axiosInstance.get('/protected/projects/my');
  return response.data.projects;
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

export const leaveProject = async (id: number) => {
  const response = await axiosInstance.post(`/protected/projects/${id}/leave`);
  return response.data;
};

export const fetchRecommendedStudents = async (projectId: number) => {
  const response = await axiosInstance.get(`/protected/projects/${projectId}/recommended-students`);
  return response.data.students || [];
};

export const inviteStudent = async (projectId: number, userId: number) => {
  const response = await axiosInstance.post(`/protected/projects/${projectId}/invite`, { user_id: userId });
  return response.data;
};
