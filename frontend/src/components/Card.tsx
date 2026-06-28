import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types';
import { Flame, Calendar } from 'lucide-react';

interface CardProps {
  project: Project;
  onSelect?: (project: Project) => void;
  onDelete?: () => void;
  onLeave?: () => void;
  onEdit?: () => void;
}

export const Card: React.FC<CardProps> = ({ project, onSelect, onDelete, onLeave, onEdit }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onSelect) onSelect(project);
    navigate(`/projects/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  const handleLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onLeave) onLeave();
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) onEdit();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div 
      onClick={handleClick} 
      role="button"
      className="relative bg-white dark:bg-slate-900/45 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-cyan-500/5 hover:-translate-y-1 hover:border-cyan-500/40 dark:hover:border-cyan-500/40 transition-all duration-300 backdrop-blur-md cursor-pointer"
    >
      {project.match_score !== undefined && project.match_score > 0 && (
        <div className={`absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1 ${
          project.match_score >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 
          project.match_score >= 50 ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'bg-slate-500 text-white'
        }`}>
          {project.match_score >= 80 && <Flame size={12} className="fill-white" />}
          <span>{project.match_score}% Совпадение</span>
        </div>
      )}
      <h3 className="m-0 mb-1.5 text-xl font-bold text-slate-800 dark:text-slate-100 pr-24 tracking-tight group-hover:text-cyan-500 transition-colors">{project.title}</h3>
      {(project.start_date || project.end_date) && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-3.5 font-semibold flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/60 w-fit px-2.5 py-1 rounded-full">
          <Calendar size={12} className="text-slate-400 dark:text-slate-500" />
          <span>Сроки: {project.start_date ? `с ${formatDate(project.start_date)}` : ''} {project.end_date ? `по ${formatDate(project.end_date)}` : ''}</span>
        </div>
      )}
      <p className="text-slate-600 dark:text-slate-350 text-sm m-0 mb-4 leading-relaxed line-clamp-3">{project.description}</p>
      {project.skills_required && project.skills_required.length > 0 && (
        <ul className="list-none p-0 flex flex-wrap gap-1.5 mb-2">
          {project.skills_required.map((skill, idx) => (
            <li 
              key={idx}
              className="bg-blue-50/70 text-blue-600 dark:bg-blue-950/20 dark:text-blue-300 border border-blue-100/50 dark:border-blue-900/30 px-2.5 py-0.5 rounded-lg text-xs font-semibold"
            >
              {skill}
            </li>
          ))}
        </ul>
      )}
      
      {/* Action buttons footer */}
      {(onEdit || onDelete || onLeave) && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          {onEdit && (
            <button 
              onClick={handleEdit}
              className="bg-cyan-500 text-white border-none rounded-xl px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-cyan-600 transition-colors"
            >
              Редактировать
            </button>
          )}
          {onDelete && (
            <button 
              onClick={handleDelete}
              className="bg-red-500/10 text-red-500 border border-red-500/25 rounded-xl px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-red-500 hover:text-white transition-colors"
            >
              Удалить
            </button>
          )}
          {onLeave && (
            <button 
              onClick={handleLeave}
              className="bg-amber-500/10 text-amber-500 border border-amber-500/25 rounded-xl px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-amber-600 hover:text-white transition-colors"
            >
              Выйти из проекта
            </button>
          )}
        </div>
      )}
    </div>
  );
};
