import React from 'react';
import { User } from '../types';

interface UserCardProps {
  user: User;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all flex flex-col justify-between group">
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white m-0 group-hover:text-cyan-400 transition-colors">
          {user.username}
        </h3>
        {user.bio && (
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm line-clamp-3">
            {user.bio}
          </p>
        )}
      </div>
      {user.skills && user.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {user.skills.map((skill, index) => (
            <span 
              key={index} 
              className="px-2 py-1 bg-cyan-900/30 text-cyan-300 text-xs rounded border border-cyan-800"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
