import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.email, data.password);
      // redirect to the page they wanted or default
      const from = (location.state as any)?.from?.pathname || '/projects';
      navigate(from, { replace: true });
    } catch (e: any) {
      // backend returns 401 with error
      addToast(e?.response?.data?.error || 'Ошибка входа', 'error');
      setError('email', { type: 'manual', message: 'Неправильные данные' });
    }
  };

  return (
    <div className="flex min-h-screen justify-center items-center bg-gradient-to-br from-gray-800 to-teal-700">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl w-80">
        <h2 className="m-0 mb-4 text-cyan-100 text-center text-2xl font-bold">Вход в EduMatch</h2>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <input
            className="w-full p-2 mb-2 border-none rounded bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            placeholder="Email"
            type="email"
            {...register('email', { required: 'Введите email' })}
          />
          {errors.email && <span className="text-red-400 text-sm block mb-2">{errors.email.message}</span>}
          <input
            className="w-full p-2 mb-2 border-none rounded bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            type="password"
            placeholder="Пароль"
            {...register('password', { required: 'Введите пароль' })}
          />
          {errors.password && <span className="text-red-400 text-sm block mb-2">{errors.password.message}</span>}
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full p-2.5 border-none rounded bg-cyan-500 text-white font-bold cursor-pointer transition-colors duration-200 hover:bg-cyan-600 disabled:opacity-50"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
