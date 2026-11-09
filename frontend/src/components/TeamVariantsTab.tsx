import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTeamVariants, sendRoleInvite } from '../api/smartMatching';
import { TeamVariant } from '../types';
import { useToast } from './ToastProvider';

interface TeamVariantsTabProps {
  projectId: number;
  isOwner: boolean;
}

export const TeamVariantsTab: React.FC<TeamVariantsTabProps> = ({ projectId, isOwner }) => {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [invitingVariantIndex, setInvitingVariantIndex] = useState<number | null>(null);

  const { data, isLoading, refetch } = useQuery<{ error: string | null; variants: TeamVariant[] }>({
    queryKey: ['teamVariants', projectId],
    queryFn: () => fetchTeamVariants(projectId),
    enabled: projectId > 0,
  });

  const variants = data?.variants || [];
  const errorMessage = data?.error;

  const inviteAllMutation = useMutation({
    mutationFn: async (variant: TeamVariant) => {
      for (const member of variant.members) {
        try {
          await sendRoleInvite(member.roleId, member.userId, 'invite');
        } catch (e) {
          // ignore already invited
        }
      }
    },
    onSuccess: () => {
      addToast('Приглашения отправлены всем участникам выбранного варианта команды!', 'success');
      queryClient.invalidateQueries({ queryKey: ['projectRoles', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projectTeam', projectId] });
    },
    onError: (err: any) => {
      addToast(err.message || 'Ошибка при отправке приглашений', 'error');
    },
    onSettled: () => {
      setInvitingVariantIndex(null);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">
          Сборщик формирует 3 оптимальных варианта сбалансированной команды...
        </span>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-6 rounded-xl flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-700 dark:text-amber-300 text-2xl mb-3">
          ⚠️
        </div>
        <h4 className="text-lg font-bold text-amber-900 dark:text-amber-200 m-0">{errorMessage}</h4>
        <p className="text-sm text-amber-700 dark:text-amber-400 mt-2 max-w-md m-0">
          Для автоматической сборки команды на каждую роль в проекте должен быть хотя бы один подходящий кандидат (score &ge; 40, не более 1 активного проекта).
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          Обновить проверку
        </button>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400 text-lg m-0">Не удалось сформировать варианты команды.</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2 mb-0">
          Возможно, кандидаты перекрываются или не удовлетворяют минимальным требованиям.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white m-0">
          Сбалансированные варианты команды (Smart Team Builder)
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 m-0">
          Формула оценки: 0.7 &times; avg(score) + 0.3 &times; min(score). Ни один участник не повторяется на двух ролях.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {variants.map((variant, vIdx) => {
          const isInviting = invitingVariantIndex === vIdx;
          const isBest = vIdx === 0;

          return (
            <div
              key={vIdx}
              className={`bg-white dark:bg-gray-800 rounded-xl border flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-lg ${
                isBest
                  ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-cyan-500/5'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div>
                {/* Header with team score */}
                <div
                  className={`p-4 rounded-t-xl border-b ${
                    isBest
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-transparent'
                      : 'bg-gray-50 dark:bg-gray-900/40 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                      Вариант #{vIdx + 1} {isBest && '• Рекомендуемый'}
                    </span>
                    <span className="text-xl font-extrabold">{variant.teamScore}%</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs opacity-80">
                    <span>Средний: {variant.avgScore}%</span>
                    <span>•</span>
                    <span>Слабое звено: {variant.minScore}%</span>
                  </div>
                </div>

                {/* Member roles list */}
                <div className="p-4 flex flex-col gap-3">
                  {variant.members.map((member, mIdx) => (
                    <div
                      key={mIdx}
                      className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-200 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            member.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate m-0">
                            {member.username}
                          </p>
                          <p className="text-[11px] text-cyan-700 dark:text-cyan-400 font-medium truncate m-0">
                            {member.roleTitle}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {member.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Invite All */}
              {isOwner && (
                <div className="p-4 pt-0">
                  <button
                    onClick={() => {
                      setInvitingVariantIndex(vIdx);
                      inviteAllMutation.mutate(variant);
                    }}
                    disabled={isInviting || inviteAllMutation.isPending}
                    className={`w-full py-2.5 rounded-lg font-semibold text-xs transition-all shadow-sm cursor-pointer ${
                      isBest
                        ? 'bg-cyan-600 hover:bg-cyan-700 text-white active:scale-98'
                        : 'bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white active:scale-98'
                    }`}
                  >
                    {isInviting ? 'Отправка приглашений...' : 'Пригласить всех в проект'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

