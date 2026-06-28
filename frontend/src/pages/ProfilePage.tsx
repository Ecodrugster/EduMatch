import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile, uploadAvatar, UserProfile } from '../api/profile';
import { fetchMyProjects } from '../api/projects';
import { useAuth } from '../context/AuthContext';
import { Project } from '../types';
import { useToast } from '../components/ToastProvider';

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
    <div className="p-8 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-700 transition-colors duration-200 min-h-screen">
      <div className="max-w-2xl mx-auto bg-white/10 p-8 rounded-xl shadow-2xl backdrop-blur-md">
        <h1 className="text-3xl font-bold text-cyan-800 dark:text-cyan-100 m-0 mb-6">Мой Профиль</h1>
        
        {profile && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-400 bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                    👤
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs text-center px-2">Сменить фото</span>
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
              <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold text-cyan-400">Имя пользователя:</span> {profile.username}</p>
              <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold text-cyan-400">Email:</span> {profile.email}</p>
            </div>
          </div>
        )}

        {/* Сводка по проектам */}
        {projects && (
          <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-white/5 rounded-xl border border-gray-200/20 dark:border-gray-700/50">
            <div className="flex flex-col items-center justify-center p-3 text-center bg-cyan-500/10 rounded-lg">
              <span className="text-3xl mb-1">🛠️</span>
              <span className="text-2xl font-black text-cyan-800 dark:text-cyan-100">
                {projects.filter(p => p.owner_id === userId).length}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-1">Созданные проекты</span>
            </div>
            <div className="flex flex-col items-center justify-center p-3 text-center bg-emerald-500/10 rounded-lg">
              <span className="text-3xl mb-1">🤝</span>
              <span className="text-2xl font-black text-emerald-800 dark:text-emerald-100">
                {projects.filter(p => p.owner_id !== userId).length}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-1">Проекты с участием</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <label className="flex flex-col text-cyan-800 dark:text-cyan-100 text-sm">
            О себе (Bio)
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="mt-1 p-3 min-h-[120px] resize-y border border-gray-300 dark:border-gray-600 rounded-md bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="Расскажите о себе, своих интересах и опыте..."
            />
          </label>
          
          <label className="flex flex-col text-cyan-800 dark:text-cyan-100 text-sm">
            Мои навыки (через запятую)
            <input
              type="text"
              value={skills}
              onChange={e => setSkills(e.target.value)}
              className="mt-1 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white/5 text-gray-900 dark:text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              placeholder="Например: Go, React, PostgreSQL"
            />
          </label>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="bg-cyan-500 text-white font-bold px-6 py-3 rounded-md hover:bg-cyan-600 transition-colors disabled:opacity-50 mt-4 self-end"
          >
            {updateMutation.isPending ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
        </form>
      </div>
    </div>
  );
}
