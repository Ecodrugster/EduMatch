import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile, uploadAvatar, UserProfile } from '../api/profile';
import { fetchMyProjects } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { useToast } from '../components/ToastProvider';
import { User, Briefcase, Users } from 'lucide-react';

export default function ProfilePage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading, isError, error } = useQuery<UserProfile, Error>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
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
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['profile'], updatedProfile);
      addToast('Профиль успешно обновлен', 'success');
    },
    onError: (err: Error) => {
      addToast(err.message || 'Ошибка обновления', 'error');
    },
  });

  const avatarMutation = useMutation({
    mutationFn: uploadAvatar,
    onSuccess: (data) => {
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
      setAvatarFile(file);
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

  return (
    <div className="p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-50/20 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white/80 dark:bg-slate-900/40 p-8 rounded-2xl border border-slate-200/50 dark:border-slate-800/80 shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 m-0 mb-6 tracking-tight">Мой Профиль</h1>
        
        {profile && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
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
            <div className="flex flex-col gap-2">
              <p className="text-slate-600 dark:text-slate-350 text-sm"><span className="font-bold text-cyan-600 dark:text-cyan-400">Имя пользователя:</span> {profile.username}</p>
              <p className="text-slate-600 dark:text-slate-350 text-sm"><span className="font-bold text-cyan-600 dark:text-cyan-400">Email:</span> {profile.email}</p>
            </div>
          </div>
        )}

        {/* Сводка по проектам */}
        {projects && (
          <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-200/50 dark:border-slate-850/80">
            <div className="flex flex-col items-center justify-center p-4 text-center bg-cyan-500/5 rounded-xl border border-cyan-500/10">
              <Briefcase size={20} className="text-cyan-600 dark:text-cyan-400 mb-1.5" />
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                {projects.filter(p => p.owner_id === userId).length}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Созданные проекты</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 text-center bg-emerald-500/5 rounded-xl border border-emerald-500/10">
              <Users size={20} className="text-emerald-600 dark:text-emerald-400 mb-1.5" />
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {projects.filter(p => p.owner_id !== userId).length}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">Проекты с участием</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <label className="flex flex-col text-slate-700 dark:text-slate-300 text-sm font-bold gap-1.5">
            О себе (Bio)
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="p-3 min-h-[120px] resize-y border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium text-sm"
              placeholder="Расскажите о себе, своих интересах и опыте..."
            />
          </label>
          
          <label className="flex flex-col text-slate-700 dark:text-slate-300 text-sm font-bold gap-1.5">
            Мои навыки (через запятую)
            <input
              type="text"
              value={skills}
              onChange={e => setSkills(e.target.value)}
              className="p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-white placeholder-slate-450 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 transition-all font-medium text-sm"
              placeholder="Например: Go, React, PostgreSQL"
            />
          </label>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 disabled:opacity-50 mt-4 self-end text-sm cursor-pointer"
          >
            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </div>
  );
}
