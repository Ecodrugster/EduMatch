import React, { useState } from 'react';
import { useToast } from '../components/ToastProvider';
import axiosInstance from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { addToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/auth/signup', { username, email, password });
      addToast('Регистрация прошла успешно', 'success');
      navigate('/login');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Ошибка регистрации';
      addToast(msg, 'error');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-700 transition-colors duration-200">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl w-80 border border-gray-300 dark:border-gray-600/50">
        <h2 className="m-0 mb-6 text-cyan-400 text-center text-3xl font-bold">EduMatch</h2>
        <h3 className="m-0 mb-6 text-gray-700 dark:text-gray-200 text-center text-lg font-medium">Регистрация</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              placeholder="Имя пользователя"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
            />
          </div>
          <button 
            type="submit"
            className="w-full p-3 mt-2 border-none rounded-md bg-cyan-600 text-white font-bold cursor-pointer transition-colors duration-200 hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
          >
            Зарегистрироваться
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors font-medium">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
