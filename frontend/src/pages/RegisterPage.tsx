import React, { useState } from 'react';
import { useToast } from '../components/ToastProvider';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';

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
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-800 to-gray-700">
      <form 
        onSubmit={handleSubmit} 
        className="flex flex-col gap-4 bg-white/10 p-8 rounded-xl w-80 shadow-2xl backdrop-blur-md"
      >
        <h2 className="m-0 text-cyan-100 text-center text-2xl font-bold">Регистрация</h2>
        <label className="flex flex-col text-cyan-100 text-sm">
          Имя пользователя
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            className="mt-1 p-2 border border-gray-600 rounded-md bg-white/10 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        <label className="flex flex-col text-cyan-100 text-sm">
          Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="mt-1 p-2 border border-gray-600 rounded-md bg-white/10 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        <label className="flex flex-col text-cyan-100 text-sm">
          Пароль
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="mt-1 p-2 border border-gray-600 rounded-md bg-white/10 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        <button 
          type="submit"
          className="mt-2 bg-cyan-500 border-none text-white p-2.5 rounded-md cursor-pointer hover:bg-cyan-600 transition-colors font-semibold"
        >
          Зарегистрироваться
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
