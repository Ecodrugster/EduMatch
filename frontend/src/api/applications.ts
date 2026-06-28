import axiosInstance from './axios';

export interface Application {
  id: number;
  project_id: number;
  user_id: number;
  message: string;
  status: 'pending' | 'approved' | 'rejected' | 'invited';
  created_at: string;
}

export const createApplication = async (data: { project_id: number; message: string }): Promise<Application> => {
  const response = await axiosInstance.post('/protected/applications', data);
  return response.data;
};

export const getApplicationsByProject = async (projectId: number): Promise<Application[]> => {
  const response = await axiosInstance.get(`/protected/applications?project_id=${projectId}`);
  return response.data.applications || [];
};

export const getMyApplications = async (): Promise<Application[]> => {
  const response = await axiosInstance.get('/protected/applications');
  return response.data.applications || [];
};

export const updateApplicationStatus = async (data: { id: number; status: 'approved' | 'rejected' }): Promise<void> => {
  await axiosInstance.patch(`/protected/applications/${data.id}/status`, { status: data.status });
};

export const getMembersByProject = async (projectId: number): Promise<{ id: number; user_id: number; project_id: number; username?: string }[]> => {
  const response = await axiosInstance.get(`/protected/members?project_id=${projectId}`);
  return response.data.members || [];
};
