import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProjectTeam,
  fetchProjectPeerReviews,
  completeProject,
  submitPeerReview,
} from '../api/smartMatching';
import { TeamMember, PeerReview, Project } from '../types';
import { useToast } from './ToastProvider';
import { useAuth } from '../context/AuthContext';

interface PeerReviewTabProps {
  project: Project;
  isOwner: boolean;
}

export const PeerReviewTab: React.FC<PeerReviewTabProps> = ({ project, isOwner }) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();

  const isCompleted = project.status === 'completed' || !project.is_open;

  // Selected target teammate to review
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);
  const [contribution, setContribution] = useState<number>(5);
  const [deadlines, setDeadlines] = useState<number>(5);
  const [communication, setCommunication] = useState<number>(5);
  const [quality, setQuality] = useState<number>(5);
  const [comment, setComment] = useState<string>('');

  // 1. Fetch team members
  const { data: team = [], isLoading: isLoadingTeam } = useQuery<TeamMember[]>({
    queryKey: ['projectTeam', project.id],
    queryFn: () => fetchProjectTeam(project.id),
    enabled: project.id > 0,
  });

  // 2. Fetch submitted reviews
  const { data: reviews = [], isLoading: isLoadingReviews, refetch: refetchReviews } = useQuery<PeerReview[]>({
    queryKey: ['projectPeerReviews', project.id],
    queryFn: () => fetchProjectPeerReviews(project.id),
    enabled: project.id > 0,
  });

  // 3. Complete project mutation
  const completeMutation = useMutation({
    mutationFn: () => completeProject(project.id),
    onSuccess: () => {
      addToast('Проект завершён! Этап взаимного Peer Review открыт.', 'success');
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || err.message || 'Ошибка завершения проекта', 'error');
    },
  });

  // 4. Submit review mutation
  const reviewMutation = useMutation({
    mutationFn: () => {
      if (!selectedTargetId) throw new Error('Выберите участника для оценки');
      return submitPeerReview(project.id, {
        target_id: selectedTargetId,
        contribution,
        deadlines,
        communication,
        quality,
        comment,
      });
    },
    onSuccess: () => {
      addToast('Отзыв успешно сохранён! Навыки тиммейта обновлены.', 'success');
      setSelectedTargetId(null);
      setComment('');
      refetchReviews();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || err.message || 'Ошибка сохранения отзыва', 'error');
    },
  });

  // Teammates eligible for review (excluding oneself)
  const teammatesToReview = team.filter(m => m.user_id !== user?.id);

  // Check which teammates current user already reviewed
  const reviewedTargetIds = new Set(
    reviews.filter(r => r.author_id === user?.id).map(r => r.target_id)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Project Status Banner */}
      {!isCompleted ? (
        <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-cyan-950 dark:text-cyan-100 m-0">
              Проект в процессе выполнения
            </h4>
            <p className="text-xs text-cyan-800 dark:text-cyan-300 mt-1 mb-0">
              Взаимная оценка (Peer Review) и автоматическое подтверждение навыков станут доступны сразу после завершения проекта.
            </p>
          </div>
          {isOwner && (
            <button
              onClick={() => completeMutation.mutate()}
              disabled={completeMutation.isPending}
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              {completeMutation.isPending ? 'Завершение...' : 'Завершить проект и открыть Peer Review'}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl flex items-center gap-3">
          <span className="text-xl">🏆</span>
          <div>
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100 m-0">
              Проект успешно завершён! Открыт этап взаимного Peer Review.
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5 mb-0">
              Оцените качество работы каждого участника команды. При средней оценке качества &ge; 4.0 навыки роли получают значок «Подтверждён через peer review», а уровень повышается!
            </p>
          </div>
        </div>
      )}

      {/* Review Submission Section */}
      {isCompleted && teammatesToReview.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white m-0 mb-4">
            Оценить участника команды
          </h3>

          {/* Teammate selection pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {teammatesToReview.map(m => {
              const isSelected = selectedTargetId === m.user_id;
              const isAlreadyReviewed = reviewedTargetIds.has(m.user_id);

              return (
                <button
                  key={m.user_id}
                  onClick={() => !isAlreadyReviewed && setSelectedTargetId(m.user_id)}
                  disabled={isAlreadyReviewed}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : isAlreadyReviewed
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-dashed border-gray-300 dark:border-gray-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{m.username}</span>
                  <span className="opacity-75">({m.role_title || 'Участник'})</span>
                  {isAlreadyReviewed && <span>✓ Оценён</span>}
                </button>
              );
            })}
          </div>

          {selectedTargetId ? (
            <div className="flex flex-col gap-5 bg-gray-50 dark:bg-gray-900/40 p-5 rounded-xl border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white m-0">
                Оценка для {teammatesToReview.find(m => m.user_id === selectedTargetId)?.username} (от 1 до 5)
              </h4>

              {/* 4 Rating Scales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Contribution */}
                <div className="bg-white dark:bg-gray-800 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Вклад в проект (Contribution)
                    </span>
                    <span className="text-xs font-extrabold text-cyan-600">{contribution}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={contribution}
                    onChange={e => setContribution(Number(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>

                {/* 2. Deadlines */}
                <div className="bg-white dark:bg-gray-800 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Соблюдение дедлайнов (Deadlines)
                    </span>
                    <span className="text-xs font-extrabold text-cyan-600">{deadlines}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={deadlines}
                    onChange={e => setDeadlines(Number(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>

                {/* 3. Communication */}
                <div className="bg-white dark:bg-gray-800 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Коммуникация (Communication)
                    </span>
                    <span className="text-xs font-extrabold text-cyan-600">{communication}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={communication}
                    onChange={e => setCommunication(Number(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>

                {/* 4. Quality */}
                <div className="bg-white dark:bg-gray-800 p-3.5 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                      Качество работы и кода (Quality)
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600">{quality}/5</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={quality}
                    onChange={e => setQuality(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Comment field */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Развёрнутый отзыв (комментарий):
                </label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Опишите сильные стороны работы участника, качество кода или соблюдение договоренностей..."
                  rows={3}
                  className="w-full p-2.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setSelectedTargetId(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={() => reviewMutation.mutate()}
                  disabled={reviewMutation.isPending}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white transition-colors cursor-pointer"
                >
                  {reviewMutation.isPending ? 'Сохранение...' : 'Отправить отзыв'}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic m-0">
              Выберите участника из списка выше, чтобы заполнить для него 4 шкалы взаимной оценки.
            </p>
          )}
        </div>
      )}

      {/* Submitted Reviews List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 dark:text-white m-0 mb-4">
          Оставленные отзывы в проекте ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <p className="text-xs text-gray-400 italic m-0">
            В этом проекте ещё не оставлено отзывов.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {reviews.map(r => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-gray-900 dark:text-white">
                      {r.author_name}
                    </span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="font-bold text-xs text-cyan-600 dark:text-cyan-400">
                      {r.target_name}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('ru-RU') : ''}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] my-1">
                  <span className="bg-white dark:bg-gray-800 p-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    Вклад: <b>{r.contribution}/5</b>
                  </span>
                  <span className="bg-white dark:bg-gray-800 p-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    Дедлайны: <b>{r.deadlines}/5</b>
                  </span>
                  <span className="bg-white dark:bg-gray-800 p-1.5 rounded border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                    Связь: <b>{r.communication}/5</b>
                  </span>
                  <span className="bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold">
                    Качество: <b>{r.quality}/5</b>
                  </span>
                </div>

                {r.comment && (
                  <p className="text-xs text-gray-600 dark:text-gray-300 italic m-0">
                    "{r.comment}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

