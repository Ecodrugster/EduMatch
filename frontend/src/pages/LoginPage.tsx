import React from 'react';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

type FormValues = {
  username: string;
  password: string;
};

const Container = styled.div`
  display: flex;
  height: 100vh;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #2c3e50, #4ca1af);
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  width: 320px;
`;

const Title = styled.h2`
  margin: 0 0 1rem 0;
  color: #e0f7fa;
  text-align: center;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  ::placeholder { color: #cfd8dc; }
`;

const ErrorMsg = styled.span`
  color: #ff6b6b;
  font-size: 0.85rem;
  display: block;
  margin-bottom: 0.5rem;
`;

const Button = styled.button`
  width: 100%;
  padding: 0.6rem;
  border: none;
  border-radius: 4px;
  background: #00bcd4;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #0097a7; }
`;

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
      await login(data.username, data.password);
      // redirect to the page they wanted or default
      const from = (location.state as any)?.from?.pathname || '/projects';
      navigate(from, { replace: true });
    } catch (e: any) {
      // backend returns 401 with message
      addToast(e?.response?.data?.message || 'Ошибка входа', 'error');
      setError('username', { type: 'manual', message: 'Неправильные данные' });
    }
  };

  return (
    <Container>
      <Card>
        <Title>Вход в EduMatch</Title>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            placeholder="Логин"
            {...register('username', { required: 'Введите логин' })}
          />
          {errors.username && <ErrorMsg>{errors.username.message}</ErrorMsg>}
          <Input
            type="password"
            placeholder="Пароль"
            {...register('password', { required: 'Введите пароль' })}
          />
          {errors.password && <ErrorMsg>{errors.password.message}</ErrorMsg>}
          <Button type="submit" disabled={isSubmitting}>Войти</Button>
        </form>
      </Card>
    </Container>
  );
}
