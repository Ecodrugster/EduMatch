import axiosInstance from './axios';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  bio: string;
  skills: string[];
}

export const fetchProfile = async (): Promise<UserProfile> => {
  const response = await axiosInstance.get('/protected/profile');
  return response.data.user;
};

export const updateProfile = async (data: { bio: string; skills: string[] }): Promise<UserProfile> => {
  const response = await axiosInstance.patch('/protected/profile', data);
  return response.data.user;
};
