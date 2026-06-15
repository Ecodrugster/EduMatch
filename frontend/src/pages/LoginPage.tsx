import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
    <div className="flex min-h-screen justify-center items-center bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-700 transition-colors duration-200">
      <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl shadow-2xl w-80 border border-gray-300 dark:border-gray-600/50">
        <h2 className="m-0 mb-6 text-cyan-400 text-center text-3xl font-bold">EduMatch</h2>
        <h3 className="m-0 mb-6 text-gray-700 dark:text-gray-200 text-center text-lg font-medium">Вход в аккаунт</h3>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div>
            <input
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              placeholder="Email"
              type="email"
              {...register('email', { required: 'Введите email' })}
            />
            {errors.email && <span className="text-red-400 text-xs block mt-1">{errors.email.message}</span>}
          </div>
          <div>
            <input
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-colors"
              type="password"
              placeholder="Пароль"
              {...register('password', { required: 'Введите пароль' })}
            />
            {errors.password && <span className="text-red-400 text-xs block mt-1">{errors.password.message}</span>}
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full p-3 mt-2 border-none rounded-md bg-cyan-600 text-white font-bold cursor-pointer transition-colors duration-200 hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:shadow-none"
          >
            Войти
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-cyan-400 hover:text-cyan-300 hover:underline transition-colors font-medium">
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}
