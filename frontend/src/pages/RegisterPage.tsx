import React, { useState } from 'react';
import styled from 'styled-components';
import { useToast } from '../components/ToastProvider';
import axiosInstance from '../api/axios';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/auth/register', { username, email, password });
      addToast('Регистрация прошла успешно', 'success');
      // Optionally redirect to login page
      window.location.href = '/login';
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Ошибка регистрации';
      addToast(msg, 'error');
    }
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <Title>Регистрация</Title>
        <Label>
          Имя пользователя
          <Input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
        </Label>
        <Label>
          Email
          <Input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </Label>
        <Label>
          Пароль
          <Input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </Label>
        <SubmitButton type="submit">Зарегистрироваться</SubmitButton>
      </Form>
    </Container>
  );
};

export default RegisterPage;

// Styled components
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e272e, #2d3436);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 2rem;
  border-radius: 12px;
  width: 320px;
`;

const Title = styled.h2`
  margin: 0;
  color: #e0f7fa;
  text-align: center;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  color: #e0f7fa;
  font-size: 0.9rem;
`;

const Input = styled.input`
  margin-top: 0.3rem;
  padding: 0.5rem;
  border: 1px solid #555;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  &:focus {
    outline: none;
    border-color: #00bcd4;
  }
`;

const SubmitButton = styled.button`
  background: #00bcd4;
  border: none;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background: #0097a7;
  }
`;
