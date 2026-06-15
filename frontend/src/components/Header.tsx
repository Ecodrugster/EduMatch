import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const { logout, userId } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!userId) return null;

  return (
    <header className="bg-gray-800 border-b border-gray-700 p-4 sticky top-0 z-50 shadow-md backdrop-blur-sm bg-gray-800/90">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link to="/projects" className="text-2xl font-bold text-cyan-400 no-underline hover:text-cyan-300 transition-colors">
          EduMatch
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/projects" className="text-gray-300 font-semibold no-underline hover:text-white transition-colors">
            Дашборд
          </Link>
          <Link to="/profile" className="text-gray-300 font-semibold no-underline hover:text-white transition-colors">
            Мой Профиль
          </Link>
          <button 
            onClick={handleLogout}
            className="bg-transparent border border-gray-500 text-gray-300 px-3 py-1.5 rounded hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer"
          >
            Выйти
          </button>
        </nav>
      </div>
    </header>
  );
};
