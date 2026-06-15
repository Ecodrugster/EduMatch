import axiosInstance from './axios';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const fetchNotifications = async (): Promise<Notification[]> => {
  const response = await axiosInstance.get('/protected/notifications');
  return response.data.notifications;
};

export const markAsRead = async (id: number): Promise<void> => {
  await axiosInstance.patch(`/protected/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await axiosInstance.post('/protected/notifications/read-all');
};
