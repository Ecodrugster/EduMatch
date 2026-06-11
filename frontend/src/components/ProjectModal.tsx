import React, { useState, ChangeEvent, FormEvent } from 'react';
import styled from 'styled-components';
import { Modal } from './Modal';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; skillsRequired: string[] }) => void;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState(''); // comma‑separated list

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const skillsArray = skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    onSubmit({ title, description: description || undefined, skillsRequired: skillsArray });
    setTitle('');
    setDescription('');
    setSkills('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <FormWrapper onSubmit={handleSubmit}>
        <Header>Создать новый проект</Header>
        <Label>
          Название
          <Input type="text" value={title} onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} required />
        </Label>
        <Label>
          Описание
          <Textarea value={description} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} />
        </Label>
        <Label>
          Требуемые навыки (через запятую)
          <Input type="text" value={skills} onChange={(e: ChangeEvent<HTMLInputElement>) => setSkills(e.target.value)} />
        </Label>
        <ButtonsRow>
          <CancelButton type="button" onClick={onClose}>Отмена</CancelButton>
          <SubmitButton type="submit" disabled={!title.trim()}>Создать</SubmitButton>
        </ButtonsRow>
      </FormWrapper>
    </Modal>
  );
};

const FormWrapper = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const Header = styled.h2`
  margin: 0 0 0.5rem 0;
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

const Textarea = styled.textarea`
  margin-top: 0.3rem;
  padding: 0.5rem;
  min-height: 80px;
  border: 1px solid #555;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #00bcd4;
  }
`;

const ButtonsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.5rem;
`;

const CancelButton = styled.button`
  background: transparent;
  border: 1px solid #ff5252;
  color: #ff5252;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  &:hover {
    background: rgba(255, 82, 82, 0.1);
  }
`;

const SubmitButton = styled.button`
  background: #00bcd4;
  border: none;
  color: #fff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    background: #0097a7;
  }
`;
export default ProjectModal;
