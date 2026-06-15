import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationBell } from './NotificationBell';

export const Header: React.FC = () => {
  const { logout, userId } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!userId) return null;

  return (
    <header className="bg-white dark:bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-200 dark:border-gray-700 p-4 sticky top-0 z-50 shadow-sm dark:shadow-md transition-colors duration-200">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/projects" className="text-2xl font-bold text-cyan-500 dark:text-cyan-400 no-underline hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors">
          EduMatch
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/projects" className="text-gray-600 dark:text-gray-600 dark:text-gray-300 font-semibold no-underline hover:text-gray-900 dark:hover:text-gray-900 dark:text-white transition-colors">
            Общий Дашборд
          </Link>
          <Link to="/my-projects" className="text-gray-600 dark:text-gray-600 dark:text-gray-300 font-semibold no-underline hover:text-gray-900 dark:hover:text-gray-900 dark:text-white transition-colors">
            Мои Проекты
          </Link>
          <Link to="/profile" className="text-gray-600 dark:text-gray-600 dark:text-gray-300 font-semibold no-underline hover:text-gray-900 dark:hover:text-gray-900 dark:text-white transition-colors">
            Мой Профиль
          </Link>
          <NotificationBell />
          <button 
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-900 dark:text-white cursor-pointer px-2 py-1 rounded-md border border-gray-300 dark:border-gray-300 dark:border-gray-600 transition-colors"
          >
            {theme === 'dark' ? '☀️ Светлая' : '🌙 Темная'}
          </button>
          <button 
            onClick={handleLogout}
            className="bg-transparent border border-gray-400 dark:border-gray-500 text-gray-600 dark:text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded hover:border-red-500 hover:text-red-500 dark:hover:border-red-500 dark:hover:text-red-500 transition-colors cursor-pointer"
          >
            Выйти
          </button>
        </nav>
      </div>
    </header>
  );
};
