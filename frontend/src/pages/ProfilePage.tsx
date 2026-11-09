import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile, uploadAvatar, UserProfile } from '../api/profile';
import { fetchMyProjects } from '../api/projects';
import { fetchUserProfileDetail } from '../api/smartMatching';
import { useAuth } from '../context/AuthContext';
import { Project, UserProfileDetail } from '../types';
import { useToast } from '../components/ToastProvider';
import { User, Briefcase, Users, CheckCircle, ShieldCheck, Clock, Award } from 'lucide-react';

export default function ProfilePage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading, isError, error } = useQuery<UserProfile, Error>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  const { data: detailProfile } = useQuery<UserProfileDetail>({
    queryKey: ['userProfileDetail', userId],
    queryFn: () => fetchUserProfileDetail(userId!),
    enabled: Boolean(userId),
  });

  const { data: projects } = useQuery<Project[], Error>({
    queryKey: ['my-projects'],
    queryFn: fetchMyProjects,
  });

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setSkills(profile.skills ? profile.skills.join(', ') : '');
      if (profile.avatar_url) {
        setAvatarPreview(`/api${profile.avatar_url}`);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (isError && error) {
      addToast(error.message || 'Ошибка загрузки профиля', 'error');
    }
  }, [isError, error, addToast]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: updatedProfile => {
      queryClient.setQueryData(['profile'], updatedProfile);
      addToast('Профиль успешно обновлен', 'success');
      queryClient.invalidateQueries({ queryKey: ['userProfileDetail', userId] });
    },
    onError: (err: Error) => {
      addToast(err.message || 'Ошибка обновления', 'error');
    },
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: data => {
      setAvatarPreview(`/api${data.avatar_url}`);
      addToast('Фото успешно обновлено', 'success');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: Error) => {
      addToast(err.message || 'Ошибка загрузки фото', 'error');
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarPreview(URL.createObjectURL(file));
      avatarMutation.mutate(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    updateMutation.mutate({ bio, skills: skillsArray });
  };

  if (isLoading) return <div className="text-cyan-800 dark:text-cyan-100 text-center mt-8">Загрузка профиля...</div>;

  const verifiedSkills = detailProfile?.skills?.filter(s => s.verified) || [];
  const otherSkills = detailProfile?.skills?.filter(s => !s.verified) || [];
  const trackRecord = detailProfile?.track_record || [];

  return (
    <div className="p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-50/20 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 min-h-screen">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Main profile card */}
        <div className="bg-white/80 dark:bg-slate-900/40 p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-6">
              <div className="relative group cursor-pointer">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-400 bg-slate-100 dark:bg-slate-800 flex-shrink-0 shadow-md">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={40} className="text-slate-450 dark:text-slate-500" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-[10px] font-bold text-center px-2">Сменить фото</span>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleAvatarChange}
                  disabled={avatarMutation.isPending}
                />
              </div>

              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 m-0 tracking-tight">
                  {profile?.username}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-xs m-0">{profile?.email}</p>
                {bio && <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 m-0 italic">"{bio}"</p>}
              </div>
            </div>

            {/* Quick Stats: Reliability & Hours */}
            <div className="flex sm:flex-col gap-2 shrink-0">
              <div className="bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-3.5 py-2 rounded-xl flex items-center gap-2">
                <Award size={18} className="text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 m-0">
                    Надёжность
                  </p>
                  <p className="text-sm font-extrabold text-purple-900 dark:text-purple-100 m-0">
                    {detailProfile?.user?.avg_peer_score
                      ? `${detailProfile.user.avg_peer_score.toFixed(1)} / 5.0`
                      : '0.6 (Новичок)'}
                  </p>
                </div>
              </div>

              <div className="bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 px-3.5 py-2 rounded-xl flex items-center gap-2">
                <Clock size={18} className="text-cyan-600 dark:text-cyan-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-cyan-700 dark:text-cyan-300 m-0">
                    Доступность
                  </p>
                  <p className="text-sm font-extrabold text-cyan-900 dark:text-cyan-100 m-0">
                    {detailProfile?.hours_per_week || 20} ч / нед
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Project numbers summary */}
          {projects && (
            <div className="grid grid-cols-2 gap-4 my-6 p-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-200/50 dark:border-slate-850/80">
              <div className="flex flex-col items-center justify-center p-3 text-center bg-cyan-500/5 rounded-xl border border-cyan-500/10">
                <Briefcase size={18} className="text-cyan-600 dark:text-cyan-400 mb-1" />
                <span className="text-xl font-black text-cyan-600 dark:text-cyan-400">
                  {projects.filter(p => p.owner_id === userId).length}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Созданные проекты
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                <Users size={18} className="text-emerald-600 dark:text-emerald-400 mb-1" />
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {projects.filter(p => p.owner_id !== userId).length}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Участие в командах
                </span>
              </div>
            </div>
          )}

          {/* Verified Skills Section */}
          <div className="my-6">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={20} className="text-emerald-500" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white m-0">
                Подтверждённые навыки (Verified Skills)
              </h3>
            </div>

            {verifiedSkills.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Пока нет подтверждённых навыков. Навыки автоматически подтверждаются после успешного Peer Review (качество &ge; 4.0) или через GitHub/портфолио.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {verifiedSkills.map(s => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/20 flex flex-col gap-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-emerald-600" />
                        {s.skill_name}
                      </span>
                      <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                        Уровень {s.level}/5
                      </span>
                    </div>

                    <div className="w-full bg-emerald-200 dark:bg-emerald-900/60 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${(s.level / 5) * 100}%` }}
                      ></div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-emerald-800 dark:text-emerald-400">
                      <span>{s.category}</span>
                      <span className="font-semibold bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                        {s.evidence_type === 'peer_review'
                          ? '✓ Peer Review'
                          : s.evidence_type === 'github'
                          ? '✓ GitHub'
                          : s.evidence_type === 'certificate'
                          ? '✓ Сертификат'
                          : '✓ Подтверждён'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Other Skills Section */}
          {otherSkills.length > 0 && (
            <div className="my-6">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Заявленные навыки (не подтверждены):
              </h4>
              <div className="flex flex-wrap gap-2">
                {otherSkills.map(s => (
                  <span
                    key={s.id}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {s.skill_name} ({s.level}/5)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Project Track Record Section */}
          <div className="my-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-white m-0 mb-3">
              Трек-рекорд завершённых проектов
            </h3>

            {trackRecord.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                Пока нет завершённых проектов с оценками peer review.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {trackRecord.map((tr, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white m-0">
                        {tr.project_title}
                      </h4>
                      <p className="text-xs text-cyan-600 dark:text-cyan-400 font-semibold m-0">
                        Роль: {tr.role_title}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 px-2 py-1 rounded-lg">
                        Качество: {tr.avg_quality.toFixed(1)} / 5.0
                      </span>
                      <p className="text-[10px] text-gray-400 mt-1 m-0">
                        Отзывов: {tr.review_count}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Edit bio & skills form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-6 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white m-0">
              Редактировать данные профиля
            </h4>

            <label className="flex flex-col text-slate-700 dark:text-slate-300 text-xs font-bold gap-1.5">
              О себе (Bio)
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="p-3 min-h-[90px] resize-y border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-medium"
                placeholder="Расскажите о себе, своих интересах и опыте..."
              />
            </label>

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 self-end text-xs cursor-pointer"
            >
              {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
