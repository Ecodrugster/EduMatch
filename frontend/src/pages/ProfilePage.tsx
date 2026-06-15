import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProfile, updateProfile, UserProfile } from '../api/profile';
import { useToast } from '../components/ToastProvider';

export default function ProfilePage() {
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');

  const { data: profile, isLoading, isError, error } = useQuery<UserProfile, Error>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });

  useEffect(() => {
    if (profile) {
      setBio(profile.bio || '');
      setSkills(profile.skills ? profile.skills.join(', ') : '');
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
          <div className="mb-6 flex flex-col gap-2">
            <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold text-cyan-400">Имя пользователя:</span> {profile.username}</p>
            <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold text-cyan-400">Email:</span> {profile.email}</p>
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
