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
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
        <h2 className="m-0 mb-2 text-2xl font-black text-slate-800 dark:text-slate-100 text-center tracking-tight">
          {project ? 'Редактировать проект' : 'Создать новый проект'}
        </h2>
        <label className="flex flex-col text-slate-700 dark:text-slate-300 text-xs font-bold gap-1.5">
          Название
          <input 
            type="text" 
            value={title} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
            required 
            className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all text-sm font-medium"
          />
        </label>
        <label className="flex flex-col text-slate-700 dark:text-slate-300 text-xs font-bold gap-1.5">
          Описание
          <textarea 
            value={description} 
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} 
            className="p-3 min-h-[90px] resize-y border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all text-sm font-medium"
          />
        </label>
        <label className="flex flex-col text-slate-700 dark:text-slate-300 text-xs font-bold gap-1.5">
          Требуемые навыки (через запятую)
          <input 
            type="text" 
            value={skills} 
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSkills(e.target.value)} 
            className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all text-sm font-medium"
          />
        </label>
        
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-slate-700 dark:text-slate-300 text-xs font-bold gap-1.5">
            Дата начала
            <input 
              type="date" 
              value={startDate} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} 
              className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all text-sm font-medium dark:[color-scheme:dark]"
            />
          </label>
          <label className="flex flex-col text-slate-700 dark:text-slate-300 text-xs font-bold gap-1.5">
            Дата окончания (Дедлайн)
            <input 
              type="date" 
              value={endDate} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} 
              className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all text-sm font-medium dark:[color-scheme:dark]"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button 
            type="button" 
            onClick={handleClose}
            className="bg-transparent border border-red-500/30 text-red-500 px-5 py-2.5 rounded-xl cursor-pointer hover:bg-red-500 hover:text-white transition-all text-sm font-bold"
          >
            Отмена
          </button>
          <button 
            type="submit" 
            disabled={!title.trim()}
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 border-none text-white px-5 py-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm cursor-pointer shadow-sm hover:shadow-lg hover:shadow-cyan-500/25"
          >
            {project ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;
