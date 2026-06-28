import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { Modal } from './Modal';
import { Project } from '../types';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; skills_required: string[]; start_date?: string; end_date?: string }) => void;
  project?: Project;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, project }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState(''); // comma‑separated list
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (project && isOpen) {
      setTitle(project.title || '');
      setDescription(project.description || '');
      setSkills(project.skills_required?.join(', ') || '');
      
      const formatDateForInput = (d?: string) => {
        if (!d) return '';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      };
      setStartDate(formatDateForInput(project.start_date));
      setEndDate(formatDateForInput(project.end_date));
    } else if (isOpen) {
      setTitle('');
      setDescription('');
      setSkills('');
      setStartDate('');
      setEndDate('');
    }
  }, [project, isOpen]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const skillsArray = skills
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    
    const formattedStartDate = startDate ? new Date(startDate).toISOString() : undefined;
    const formattedEndDate = endDate ? new Date(endDate).toISOString() : undefined;

    onSubmit({ 
      title, 
      description: description || undefined, 
      skills_required: skillsArray,
      start_date: formattedStartDate,
      end_date: formattedEndDate
    });
    if (!project) {
      setTitle('');
      setDescription('');
      setSkills('');
      setStartDate('');
      setEndDate('');
    }
  };

  const handleClose = () => {
    if (!project) {
      setTitle('');
      setDescription('');
      setSkills('');
      setStartDate('');
      setEndDate('');
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <h2 className="m-0 mb-2 text-cyan-800 dark:text-cyan-100 text-center">
          {project ? 'Редактировать проект' : 'Создать новый проект'}
        </h2>
        <label className="flex flex-col text-cyan-800 dark:text-cyan-100 text-sm">
          Название
          <input 
            type="text" 
            value={title} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
            required 
            className="mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        <label className="flex flex-col text-cyan-800 dark:text-cyan-100 text-sm">
          Описание
          <textarea 
            value={description} 
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} 
            className="mt-1 p-2 min-h-[80px] resize-y border border-gray-300 dark:border-gray-600 rounded-md bg-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        <label className="flex flex-col text-cyan-800 dark:text-cyan-100 text-sm">
          Требуемые навыки (через запятую)
          <input 
            type="text" 
            value={skills} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSkills(e.target.value)} 
            className="mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
          />
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-cyan-800 dark:text-cyan-100 text-sm">
            Дата начала
            <input 
              type="date" 
              value={startDate} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} 
              className="mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 [color-scheme:dark]"
            />
          </label>
          <label className="flex flex-col text-cyan-800 dark:text-cyan-100 text-sm">
            Дата окончания (Дедлайн)
            <input 
              type="date" 
              value={endDate} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} 
              className="mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white/10 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 [color-scheme:dark]"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button 
            type="button" 
            onClick={handleClose}
            className="bg-transparent border border-red-500 text-red-500 px-4 py-2 rounded-md cursor-pointer hover:bg-red-500/10 transition-colors"
          >
            Отмена
          </button>
          <button 
            type="submit" 
            disabled={!title.trim()}
            className="bg-cyan-500 border-none text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {project ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;
