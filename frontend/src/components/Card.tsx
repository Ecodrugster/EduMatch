import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types';

interface CardProps {
  project: Project;
  onSelect?: (project: Project) => void;
  onDelete?: () => void;
}

export const Card: React.FC<CardProps> = ({ project, onSelect, onDelete }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onSelect) onSelect(project);
    navigate(`/projects/${project.id}`);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete();
  };

  return (
    <div 
      onClick={handleClick} 
      role="button"
      className="relative bg-white/10 backdrop-blur-md rounded-xl p-6 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
    >
      {project.match_score !== undefined && project.match_score > 0 && (
        <div className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold ${
          project.match_score >= 80 ? 'bg-green-500 text-white' : 
          project.match_score >= 50 ? 'bg-yellow-500 text-gray-900' : 'bg-gray-500 text-gray-900 dark:text-white'
        }`}>
          {project.match_score >= 80 ? '🔥 ' : ''}{project.match_score}% Совпадение
        </div>
      )}
      <h3 className="m-0 mb-2 text-cyan-800 dark:text-cyan-100 pr-24">{project.title}</h3>
      <p className="text-gray-600 dark:text-gray-300 m-0 mb-2">{project.description}</p>
      {project.skills_required && project.skills_required.length > 0 && (
        <ul className="list-none p-0 flex flex-wrap gap-2">
          {project.skills_required.map((skill, idx) => (
            <li 
              key={idx}
              className="bg-white/20 px-2 py-1 rounded text-sm text-gray-50"
            >
              {skill}
            </li>
          ))}
        </ul>
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
    </div>
  );
};
