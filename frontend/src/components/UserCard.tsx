import React from 'react';
import { User } from '../types';

interface UserCardProps {
  user: User;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <div className="bg-white dark:bg-slate-900/45 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5 transition-all duration-300 flex flex-col justify-between group backdrop-blur-md">
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 m-0 group-hover:text-cyan-500 transition-colors">
          {user.username}
        </h3>
        {user.bio && (
          <p className="text-slate-500 dark:text-slate-400 mt-2.5 text-sm line-clamp-3 leading-relaxed">
            {user.bio}
          </p>
        )}
      </div>
      {user.skills && user.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {user.skills.map((skill, index) => (
            <span 
              key={index} 
              className="px-2.5 py-0.5 bg-blue-50/70 text-blue-600 dark:bg-blue-950/20 dark:text-blue-300 border border-blue-100/50 dark:border-blue-900/30 text-xs font-semibold rounded-lg"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
