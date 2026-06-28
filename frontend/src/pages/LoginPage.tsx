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
    <div className="flex min-h-screen justify-center items-center bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-50/40 via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300 p-4">
      <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl w-full max-w-sm transition-all duration-300">
        <h2 className="m-0 mb-2 text-center text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent tracking-tight">EduMatch</h2>
        <h3 className="m-0 mb-6 text-slate-500 dark:text-slate-400 text-center text-sm font-medium">Вход в аккаунт</h3>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div>
            <input
              className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-300 text-sm"
              placeholder="Email"
              type="email"
              {...register('email', { required: 'Введите email' })}
            />
            {errors.email && <span className="text-red-500 text-xs block mt-1.5 font-medium">{errors.email.message}</span>}
          </div>
          <div>
            <input
              className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all duration-300 text-sm"
              type="password"
              placeholder="Пароль"
              {...register('password', { required: 'Введите пароль' })}
            />
            {errors.password && <span className="text-red-500 text-xs block mt-1.5 font-medium">{errors.password.message}</span>}
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full p-3 mt-2 border-none rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold cursor-pointer transition-all duration-300 hover:opacity-95 hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:shadow-none text-sm"
          >
            Войти
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Нет аккаунта?{' '}
          <Link to="/register" className="text-cyan-500 hover:text-cyan-400 hover:underline transition-colors font-semibold">
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}
