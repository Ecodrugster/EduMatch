import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAsRead, markAllAsRead, Notification } from '../api/notifications';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    refetchInterval: 15000, // Poll every 15s
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-gray-600 dark:text-gray-600 dark:text-gray-300 hover:text-cyan-500 transition-colors p-2 cursor-pointer"
      >
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b border-gray-200 dark:border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-50 dark:bg-gray-800 z-10">
            <h4 className="m-0 text-gray-800 dark:text-gray-700 dark:text-gray-200 font-bold">Уведомления</h4>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllReadMutation.mutate()}
                className="text-xs text-cyan-500 hover:text-cyan-600 cursor-pointer bg-transparent border-none"
              >
                Прочитать все
              </button>
            )}
          </div>
          <div className="flex flex-col">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-500 dark:text-gray-400 text-sm">Нет новых уведомлений</div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id} 
                  className={`p-3 border-b border-gray-100 dark:border-gray-200 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    !n.is_read ? 'bg-cyan-50 dark:bg-cyan-900/20' : ''
                  }`}
                  onClick={() => {
                    if (!n.is_read) markReadMutation.mutate(n.id);
                  }}
                >
                  <p className="m-0 text-sm text-gray-800 dark:text-gray-700 dark:text-gray-200">{n.message}</p>
                  <p className="m-0 mt-1 text-xs text-gray-500 dark:text-gray-400">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
