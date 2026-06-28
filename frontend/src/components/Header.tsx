import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { NotificationBell } from './NotificationBell';
import { Sun, Moon } from 'lucide-react';

export const Header: React.FC = () => {
  const { logout, userId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!userId) return null;

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/85 border-b border-slate-200/50 dark:border-slate-800/80 p-4 sticky top-0 z-50 backdrop-blur-md shadow-sm transition-all duration-300">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/projects" className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent no-underline hover:opacity-90 transition-opacity tracking-tight">
          EduMatch
        </Link>
        <nav className="flex items-center gap-6">
          <Link 
            to="/projects" 
            className={`font-semibold no-underline transition-all duration-300 text-sm relative py-1 ${
              isActive('/projects') 
                ? 'text-cyan-600 dark:text-cyan-400' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Общий Дашборд
            {isActive('/projects') && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 rounded-full" />
            )}
          </Link>
          <Link 
            to="/my-projects" 
            className={`font-semibold no-underline transition-all duration-300 text-sm relative py-1 ${
              isActive('/my-projects') 
                ? 'text-cyan-600 dark:text-cyan-400' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Мои Проекты
            {isActive('/my-projects') && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 rounded-full" />
            )}
          </Link>
          <Link 
            to="/profile" 
            className={`font-semibold no-underline transition-all duration-300 text-sm relative py-1 ${
              isActive('/profile') 
                ? 'text-cyan-600 dark:text-cyan-400' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Мой Профиль
            {isActive('/profile') && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500 rounded-full" />
            )}
          </Link>
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800" />

          <NotificationBell />
          
          <button 
            onClick={toggleTheme}
            className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 cursor-pointer px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold transition-all"
          >
            {theme === 'dark' ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-indigo-500 dark:text-indigo-400" />}
            <span className="hidden sm:inline">{theme === 'dark' ? 'Светлая' : 'Темная'}</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="bg-transparent border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-3.5 py-1.5 rounded-full text-xs font-bold hover:border-red-500 hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
          >
            Выйти
          </button>
        </nav>
      </div>
    </header>
  );
};
