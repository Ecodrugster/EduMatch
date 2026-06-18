import axiosInstance from './axios';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  bio: string;
  skills: string[];
  avatar_url?: string;
}

export const fetchProfile = async (): Promise<UserProfile> => {
  const response = await axiosInstance.get('/protected/profile');
  return response.data.user;
};

export const updateProfile = async (data: { bio: string; skills: string[] }): Promise<UserProfile> => {
  const response = await axiosInstance.patch('/protected/profile', data);
  return response.data.user;
};

export const uploadAvatar = async (file: File): Promise<{ avatar_url: string }> => {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await axiosInstance.post('/protected/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
