import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from './Modal';
import { Project, Skill } from '../types';
import { fetchSkills } from '../api/smartMatching';

interface RoleFormState {
  title: string;
  hours_per_week: number;
  requirements: {
    skill_id: number;
    min_level: number;
    weight: number;
  }[];
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  project?: Project;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSubmit, project }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Roles state for Smart Team Builder
  const [roles, setRoles] = useState<RoleFormState[]>([
    {
      title: 'Frontend разработчик',
      hours_per_week: 20,
      requirements: [
        { skill_id: 1, min_level: 4, weight: 3 }, // React
        { skill_id: 2, min_level: 3, weight: 2 }, // TypeScript
      ],
    },
    {
      title: 'Backend разработчик',
      hours_per_week: 20,
      requirements: [
        { skill_id: 8, min_level: 3, weight: 3 }, // Go
        { skill_id: 10, min_level: 3, weight: 2 }, // PostgreSQL
      ],
    },
    {
      title: 'UI/UX дизайнер',
      hours_per_week: 15,
      requirements: [
        { skill_id: 13, min_level: 4, weight: 3 }, // Figma
        { skill_id: 14, min_level: 3, weight: 2 }, // UI/UX
      ],
    },
  ]);

  const { data: availableSkills = [] } = useQuery<Skill[]>({
    queryKey: ['availableSkills'],
    queryFn: fetchSkills,
    enabled: isOpen,
  });

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

  const handleAddRole = () => {
    setRoles(prev => [
      ...prev,
      {
        title: 'Новая роль',
        hours_per_week: 15,
        requirements: availableSkills.length > 0 ? [{ skill_id: availableSkills[0].id, min_level: 3, weight: 2 }] : [],
      },
    ]);
  };

  const handleRemoveRole = (roleIdx: number) => {
    setRoles(prev => prev.filter((_, idx) => idx !== roleIdx));
  };

  const handleRoleChange = (roleIdx: number, field: keyof RoleFormState, val: any) => {
    setRoles(prev => {
      const copy = [...prev];
      copy[roleIdx] = { ...copy[roleIdx], [field]: val };
      return copy;
    });
  };

  const handleAddRequirement = (roleIdx: number) => {
    const defaultSkillId = availableSkills.length > 0 ? availableSkills[0].id : 1;
    setRoles(prev => {
      const copy = [...prev];
      copy[roleIdx].requirements.push({
        skill_id: defaultSkillId,
        min_level: 3,
        weight: 2,
      });
      return copy;
    });
  };

  const handleRemoveRequirement = (roleIdx: number, reqIdx: number) => {
    setRoles(prev => {
      const copy = [...prev];
      copy[roleIdx].requirements = copy[roleIdx].requirements.filter((_, idx) => idx !== reqIdx);
      return copy;
    });
  };

  const handleReqChange = (roleIdx: number, reqIdx: number, field: string, val: number) => {
    setRoles(prev => {
      const copy = [...prev];
      copy[roleIdx].requirements[reqIdx] = {
        ...copy[roleIdx].requirements[reqIdx],
        [field]: val,
      };
      return copy;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const skillsArray = skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const formattedStartDate = startDate ? new Date(startDate).toISOString() : undefined;
    const formattedEndDate = endDate ? new Date(endDate).toISOString() : undefined;

    onSubmit({
      title,
      description: description || undefined,
      skills_required: skillsArray,
      start_date: formattedStartDate,
      end_date: formattedEndDate,
      deadline: formattedEndDate,
      roles: !project ? roles : undefined, // send roles when creating new project
    });

    handleClose();
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full max-h-[85vh] overflow-y-auto pr-1">
        <h2 className="m-0 mb-1 text-2xl font-black text-slate-800 dark:text-slate-100 text-center tracking-tight">
          {project ? 'Редактировать проект' : 'Создать проект (Smart Team Builder)'}
        </h2>
        <p className="text-xs text-center text-gray-500 dark:text-gray-400 m-0 -mt-2 mb-2">
          Задайте название, описание и роли для автоматического подбора сбалансированной команды.
        </p>

        <label className="flex flex-col text-slate-700 dark:text-slate-300 text-xs font-bold gap-1.5">
          Название проекта
          <input
            type="text"
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            placeholder="например, Сервис аренды"
            required
            className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all text-sm font-medium"
          />
        </label>

        <label className="flex flex-col text-slate-700 dark:text-slate-300 text-xs font-bold gap-1.5">
          Описание
          <textarea
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Цель проекта, стэк, задачи..."
            className="p-3 min-h-[75px] resize-y border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all text-sm font-medium"
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col text-slate-700 dark:text-slate-300 text-xs font-bold gap-1.5">
            Дата начала
            <input
              type="date"
              value={startDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
              className="p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 text-xs font-medium dark:[color-scheme:dark]"
            />
          </label>
          <label className="flex flex-col text-slate-700 dark:text-slate-300 text-xs font-bold gap-1.5">
            Дедлайн
            <input
              type="date"
              value={endDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
              className="p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 text-xs font-medium dark:[color-scheme:dark]"
            />
          </label>
        </div>

        {/* Roles & Requirements Builder */}
        {!project && (
          <div className="mt-2 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white m-0">
                  Роли в проекте и требования к навыкам
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 m-0">
                  Система подберёт лучших кандидатов по формуле с учётом часов и подтверждённости.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddRole}
                className="px-3 py-1.5 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 rounded-lg text-xs font-bold hover:bg-cyan-100 transition-colors cursor-pointer"
              >
                + Добавить роль
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {roles.map((role, rIdx) => (
                <div
                  key={rIdx}
                  className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={role.title}
                      onChange={e => handleRoleChange(rIdx, 'title', e.target.value)}
                      placeholder="Название роли (например: Frontend)"
                      required
                      className="p-2 text-xs font-bold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 flex-1 dark:text-white"
                    />

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={role.hours_per_week}
                        onChange={e => handleRoleChange(rIdx, 'hours_per_week', Number(e.target.value))}
                        className="w-16 p-2 text-xs font-semibold border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-gray-800 text-center dark:text-white"
                      />
                      <span className="text-xs text-gray-500">ч/нед</span>
                    </div>

                    {roles.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRole(rIdx)}
                        className="text-xs text-rose-500 hover:text-rose-700 px-2 py-1"
                        title="Удалить роль"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Requirements for this role */}
                  <div className="pl-2 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-500 uppercase">Требуемые навыки:</span>
                      <button
                        type="button"
                        onClick={() => handleAddRequirement(rIdx)}
                        className="text-[11px] font-semibold text-cyan-600 hover:underline"
                      >
                        + Добавить навык
                      </button>
                    </div>

                    {role.requirements.map((req, reqIdx) => (
                      <div key={reqIdx} className="flex items-center gap-2 text-xs">
                        <select
                          value={req.skill_id}
                          onChange={e => handleReqChange(rIdx, reqIdx, 'skill_id', Number(e.target.value))}
                          className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 text-xs flex-1 dark:text-white"
                        >
                          {availableSkills.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.category})
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-gray-400">Ур:</span>
                          <select
                            value={req.min_level}
                            onChange={e => handleReqChange(rIdx, reqIdx, 'min_level', Number(e.target.value))}
                            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 text-xs dark:text-white"
                          >
                            {[1, 2, 3, 4, 5].map(lvl => (
                              <option key={lvl} value={lvl}>
                                {lvl}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-gray-400">Вес:</span>
                          <select
                            value={req.weight}
                            onChange={e => handleReqChange(rIdx, reqIdx, 'weight', Number(e.target.value))}
                            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-gray-800 text-xs dark:text-white"
                          >
                            <option value={1}>1 (низкий)</option>
                            <option value={2}>2 (средний)</option>
                            <option value={3}>3 (высокий)</option>
                          </select>
                        </div>

                        {role.requirements.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveRequirement(rIdx, reqIdx)}
                            className="text-xs text-gray-400 hover:text-rose-500"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
            {project ? 'Сохранить' : 'Создать проект'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProjectModal;
