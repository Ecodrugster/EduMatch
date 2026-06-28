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
    <div className="flex justify-center items-center min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-50/40 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 p-4">
      <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl w-full max-w-sm transition-all duration-300">
        <h2 className="m-0 mb-2 text-center text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent tracking-tight">EduMatch</h2>
        <h3 className="m-0 mb-6 text-slate-500 dark:text-slate-400 text-center text-sm font-medium">Регистрация</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <input
              type="text"
              placeholder="Имя пользователя"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-300 text-sm"
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-300 text-sm"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-300 text-sm"
            />
          </div>
          <button 
            type="submit"
            className="w-full p-3 mt-2 border-none rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold cursor-pointer transition-all duration-300 hover:opacity-95 hover:shadow-lg hover:shadow-cyan-500/25 text-sm"
          >
            Зарегистрироваться
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-cyan-500 hover:text-cyan-400 hover:underline transition-colors font-semibold">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
