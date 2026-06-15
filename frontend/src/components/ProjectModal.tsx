import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Modal } from './Modal';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; skills_required: string[] }) => void;
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
    onSubmit({ title, description: description || undefined, skills_required: skillsArray });
    setTitle('');
    setDescription('');
    setSkills('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <h2 className="m-0 mb-2 text-cyan-100 text-center">Создать новый проект</h2>
        <label className="flex flex-col text-cyan-100 text-sm">
          Название
          <input 
            type="text" 
            value={title} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
            required 
            className="mt-1 p-2 border border-gray-600 rounded-md bg-white/10 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        <label className="flex flex-col text-cyan-100 text-sm">
          Описание
          <textarea 
            value={description} 
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} 
            className="mt-1 p-2 min-h-[80px] resize-y border border-gray-600 rounded-md bg-white/10 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        <label className="flex flex-col text-cyan-100 text-sm">
          Требуемые навыки (через запятую)
          <input 
            type="text" 
            value={skills} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSkills(e.target.value)} 
            className="mt-1 p-2 border border-gray-600 rounded-md bg-white/10 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        <div className="flex justify-end gap-2 mt-2">
          <button 
            type="button" 
            onClick={onClose}
            className="bg-transparent border border-red-500 text-red-500 px-4 py-2 rounded-md cursor-pointer hover:bg-red-500/10 transition-colors"
          >
            Отмена
          </button>
          <button 
            type="submit" 
            disabled={!title.trim()}
            className="bg-cyan-500 border-none text-white px-4 py-2 rounded-md cursor-pointer hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Создать
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;
