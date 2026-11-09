import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProjectRoles, fetchRoleCandidates, sendRoleInvite } from '../api/smartMatching';
import { ProjectRole, Candidate } from '../types';
import { useToast } from './ToastProvider';

interface RoleCandidatesTabProps {
  projectId: number;
  isOwner: boolean;
}

export const RoleCandidatesTab: React.FC<RoleCandidatesTabProps> = ({ projectId, isOwner }) => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [invitedUserIds, setInvitedUserIds] = useState<Set<number>>(new Set());

  // 1. Fetch project roles
  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<ProjectRole[]>({
    queryKey: ['projectRoles', projectId],
    queryFn: () => fetchProjectRoles(projectId),
    enabled: projectId > 0,
  });

  // Set default selected role
  React.useEffect(() => {
    if (roles.length > 0 && selectedRoleId === null) {
      setSelectedRoleId(roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const activeRole = roles.find(r => r.id === selectedRoleId) || roles[0];

  // 2. Fetch candidates for selected role
  const {
    data: candidates = [],
    isLoading: isLoadingCandidates,
    refetch,
  } = useQuery<Candidate[]>({
    queryKey: ['roleCandidates', activeRole?.id],
    queryFn: () => fetchRoleCandidates(activeRole.id),
    enabled: Boolean(activeRole?.id),
  });

  // 3. Invite mutation
  const inviteMutation = useMutation({
    mutationFn: ({ roleId, userId }: { roleId: number; userId: number }) =>
      sendRoleInvite(roleId, userId, 'invite'),
    onSuccess: (_, variables) => {
      addToast('Приглашение кандидату успешно отправлено!', 'success');
      setInvitedUserIds(prev => new Set(prev).add(variables.userId));
      queryClient.invalidateQueries({ queryKey: ['projectTeam', projectId] });
      queryClient.invalidateQueries({ queryKey: ['teamVariants', projectId] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || err.message || 'Ошибка отправки приглашения', 'error');
    },
  });

  if (isLoadingRoles) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Загрузка ролей проекта...</span>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-lg m-0">В этом проекте ещё не настроены роли.</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 mb-0">
          При создании проекта добавьте роли (Frontend, Backend, Дизайн...) и требования к навыкам.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Role selector tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-3">
        {roles.map(r => {
          const isSelected = activeRole?.id === r.id;
          const isAssigned = Boolean(r.assigned_user);
          return (
            <button
              key={r.id}
              onClick={() => setSelectedRoleId(r.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span>{r.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-black/20 text-white">
                {r.hours_per_week} ч/нед
              </span>
              {isAssigned && (
                <span className="text-xs bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                  ✓ Закрыта
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Role requirements header */}
      {activeRole && (
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 m-0">
              Требования роли «{activeRole.title}»
            </h4>
            <div className="flex flex-wrap gap-2 mt-2">
              {activeRole.requirements && activeRole.requirements.length > 0 ? (
                activeRole.requirements.map(req => (
                  <span
                    key={req.id || req.skill_id}
                    className="px-2.5 py-1 rounded text-xs font-medium bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800"
                  >
                    {req.skill_name || `Навык #${req.skill_id}`}: уровень {req.min_level}/5 (вес {req.weight})
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">Требования к навыкам не заданы</span>
              )}
            </div>
          </div>

          {activeRole.assigned_user && (
            <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-2 rounded-lg flex items-center gap-2">
              <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-xs">
                Утверждён: {activeRole.assigned_user.username}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Candidates List */}
      {isLoadingCandidates ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">
            Вычисляем рейтинг кандидатов и причины совпадения...
          </span>
        </div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg m-0">
            Роль «{activeRole?.title}» не закрыта: подходящих кандидатов не найдено.
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 mb-0">
            Кандидаты отсекаются, если балл &lt; 40 или если студент уже занят в 2+ активных проектах.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {candidates.map((cand, index) => {
            const isInvited = invitedUserIds.has(cand.userId);
            const scoreColor =
              cand.score >= 80
                ? 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                : cand.score >= 60
                ? 'text-cyan-600 bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:text-cyan-400 dark:border-cyan-800'
                : 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800';

            return (
              <div
                key={cand.userId}
                className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header: User & Overall Score */}
                  <div className="flex justify-between items-start gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex-shrink-0 flex items-center justify-center font-bold text-gray-500">
                        {cand.avatar_url ? (
                          <img src={cand.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span>{cand.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-gray-900 dark:text-white m-0">
                            {cand.username}
                          </h4>
                          {index === 0 && (
                            <span className="text-[10px] uppercase font-bold bg-amber-400 text-amber-950 px-1.5 py-0.5 rounded">
                              Топ-1
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 m-0">{cand.email}</p>
                      </div>
                    </div>

                    <div className={`px-3 py-1.5 rounded-xl border font-bold text-sm ${scoreColor}`}>
                      {cand.score}% совпадение
                    </div>
                  </div>

                  {cand.bio && (
                    <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 italic line-clamp-2">
                      "{cand.bio}"
                    </p>
                  )}

                  {/* 3 Sub-scores breakdown */}
                  <div className="bg-gray-50 dark:bg-gray-900/60 p-3 rounded-lg mb-4 text-xs flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Навыки (вес 60%):</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-500 h-full rounded-full"
                            style={{ width: `${Math.round(cand.parts.sSkills * 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-gray-200 w-8 text-right">
                          {Math.round(cand.parts.sSkills * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Часы (вес 20%):</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${Math.round(cand.parts.sTime * 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-gray-200 w-8 text-right">
                          {cand.hoursPerWeek} ч
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 dark:text-gray-400 font-medium">Надёжность (вес 20%):</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-purple-500 h-full rounded-full"
                            style={{ width: `${Math.round(cand.parts.sRel * 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-semibold text-gray-700 dark:text-gray-200 w-8 text-right">
                          {cand.avgPeerScore ? `${cand.avgPeerScore.toFixed(1)}/5` : '0.6'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reasons list */}
                  <div className="mb-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Причины оценки алгоритмом:
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {cand.reasons.map((reason, rIdx) => {
                        const isPlus = reason.startsWith('+');
                        const isTilde = reason.startsWith('~');
                        const isMinus = reason.startsWith('−') || reason.startsWith('-');

                        const badgeClass = isPlus
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40'
                          : isTilde
                          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40'
                          : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40';

                        return (
                          <div
                            key={rIdx}
                            className={`px-2.5 py-1 rounded text-xs border font-medium flex items-center gap-1.5 ${badgeClass}`}
                          >
                            <span>{reason}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                {isOwner && (
                  <button
                    onClick={() => inviteMutation.mutate({ roleId: activeRole.id, userId: cand.userId })}
                    disabled={isInvited || inviteMutation.isPending}
                    className={`w-full py-2.5 rounded-lg font-semibold text-xs transition-all shadow-sm cursor-pointer ${
                      isInvited
                        ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                        : 'bg-cyan-600 hover:bg-cyan-700 text-white active:scale-98'
                    }`}
                  >
                    {isInvited ? '✓ Приглашение отправлено' : `Пригласить на роль «${activeRole.title}»`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

