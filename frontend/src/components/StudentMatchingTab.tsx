import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchRecommendedStudents, inviteStudent } from '../api/projects';
import { User } from '../types';
import { useToast } from './ToastProvider';

interface RecommendedStudent extends User {
  match_score: number;
}

interface StudentMatchingTabProps {
  projectId: number;
  skillsRequired: string[];
}

export const StudentMatchingTab: React.FC<StudentMatchingTabProps> = ({ projectId, skillsRequired }) => {
  const { addToast } = useToast();
  const [invitedIds, setInvitedIds] = useState<Set<number>>(new Set());

  const { data: students = [], isLoading, isError, refetch } = useQuery<RecommendedStudent[]>({
    queryKey: ['recommendedStudents', projectId],
    queryFn: () => fetchRecommendedStudents(projectId),
    enabled: projectId > 0,
  });

  const inviteMutation = useMutation({
    mutationFn: ({ userId }: { userId: number }) => inviteStudent(projectId, userId),
    onSuccess: (_, variables) => {
      addToast('Приглашение отправлено успешно!', 'success');
      setInvitedIds(prev => {
        const next = new Set(prev);
        next.add(variables.userId);
        return next;
      });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || err.message || 'Ошибка отправки приглашения', 'error');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Подбираем подходящих студентов...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-red-500 font-semibold">
        Не удалось загрузить рекомендации студентов.
        <button 
          onClick={() => refetch()}
          className="ml-4 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-lg m-0">
          Не найдено подходящих студентов.
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 mb-0">
          Студенты подбираются по совпадению навыков: {skillsRequired.join(', ') || 'нет требуемых навыков'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-bold text-cyan-800 dark:text-cyan-100 m-0">
          Рекомендованные кандидаты
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm m-0">
          Список сформирован на основе совпадения навыков студентов с требованиями проекта ({skillsRequired.join(', ') || 'навыки не указаны'}).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {students.map((student) => {
          const isInvited = invitedIds.has(student.id);
          return (
            <div 
              key={student.id} 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-cyan-500 dark:hover:border-cyan-500 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex-shrink-0">
                      {student.avatar_url ? (
                        <img src={`/api${student.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">👤</div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white m-0">
                        {student.username}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 m-0">
                        {student.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      student.match_score >= 70 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : student.match_score >= 40
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      Совпадение {student.match_score}%
                    </div>
                  </div>
                </div>

                {student.bio && (
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 italic">
                    "{student.bio}"
                  </p>
                )}

                <div className="mb-6">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Навыки студента:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {student.skills && student.skills.length > 0 ? (
                      student.skills.map((skill, idx) => {
                        const isMatch = skillsRequired.some(req => req.toLowerCase() === skill.toLowerCase());
                        return (
                          <span 
                            key={idx} 
                            className={`px-2 py-0.5 rounded text-xs border font-medium transition-colors ${
                              isMatch 
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800/40' 
                                : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/40 dark:text-gray-400 dark:border-gray-700/40'
                            }`}
                          >
                            {skill}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500 italic">Навыки не указаны</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => inviteMutation.mutate({ userId: student.id })}
                disabled={isInvited || inviteMutation.isPending}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-sm cursor-pointer ${
                  isInvited 
                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed border border-transparent' 
                    : 'bg-cyan-500 hover:bg-cyan-600 text-white active:scale-95'
                }`}
              >
                {inviteMutation.isPending && inviteMutation.variables?.userId === student.id 
                  ? 'Отправка...' 
                  : isInvited 
                    ? '✓ Приглашен' 
                    : 'Пригласить в проект'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
