import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types';

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
      className="relative bg-white dark:bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
    >
      {project.match_score !== undefined && project.match_score > 0 && (
        <div className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold ${
          project.match_score >= 80 ? 'bg-green-500 text-white' : 
          project.match_score >= 50 ? 'bg-yellow-500 text-gray-900' : 'bg-gray-500 text-gray-900 dark:text-white'
        }`}>
          {project.match_score >= 80 ? '🔥 ' : ''}{project.match_score}% Совпадение
        </div>
      )}
      <h3 className="m-0 mb-1 text-cyan-800 dark:text-cyan-100 pr-24">{project.title}</h3>
      {(project.start_date || project.end_date) && (
        <div className="text-xs text-cyan-600 dark:text-cyan-400 mb-3 font-semibold flex items-center gap-1">
          📅 Сроки: {project.start_date ? `с ${formatDate(project.start_date)}` : ''} {project.end_date ? `по ${formatDate(project.end_date)}` : ''}
        </div>
      )}
      <p className="text-gray-600 dark:text-gray-300 m-0 mb-2">{project.description}</p>
      {project.skills_required && project.skills_required.length > 0 && (
        <ul className="list-none p-0 flex flex-wrap gap-2">
          {project.skills_required.map((skill, idx) => (
            <li 
              key={idx}
              className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border dark:border-cyan-800 px-2 py-1 rounded text-sm"
            >
              {skill}
            </li>
          ))}
        </ul>
      )}
      {/* Edit button */}
      {onEdit && (
        <button 
          onClick={handleEdit}
          className="mt-4 bg-cyan-500 text-white border-none rounded px-3 py-1 cursor-pointer hover:bg-cyan-600 transition-colors mr-2"
        >
          Редактировать
        </button>
      )}
      {/* Delete button */}
      {onDelete && (
        <button 
          onClick={handleDelete}
          className="mt-4 bg-red-500 text-white border-none rounded px-3 py-1 cursor-pointer hover:bg-red-600 transition-colors"
        >
          Удалить
        </button>
      )}
      {/* Leave button */}
      {onLeave && (
        <button 
          onClick={handleLeave}
          className="mt-4 bg-amber-500 text-white border-none rounded px-3 py-1 cursor-pointer hover:bg-amber-600 transition-colors"
        >
          Выйти из проекта
        </button>
      )}
    </div>
  );
};
