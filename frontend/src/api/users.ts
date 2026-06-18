import axiosInstance from './axios';
import { User } from '../types';

export const fetchUsers = async (skills?: string): Promise<User[]> => {
  const params = skills ? { skills } : {};
  const response = await axiosInstance.get('/protected/users', { params });
  return response.data.users || [];
};

export const fetchUser = async (id: number): Promise<User> => {
  const response = await axiosInstance.get(`/protected/users/${id}`);
  return response.data.user;
};
