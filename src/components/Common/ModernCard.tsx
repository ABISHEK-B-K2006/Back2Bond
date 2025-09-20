import React from 'react';

interface ModernCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export function ModernCard({ children, className = '', hover = true, padding = 'md' }: ModernCardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  return (
    <div 
      className={`
        bg-white rounded-xl shadow-sm border border-gray-200 
        ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface ProfileCardProps {
  name: string;
  role: string;
  avatarUrl?: string;
  company?: string;
  course?: string;
  location?: string;
  stats?: {
    posts?: number;
    connections?: number;
    views?: number;
  };
}

export function ProfileCard({ 
  name, 
  role, 
  avatarUrl, 
  company, 
  course, 
  location, 
  stats 
}: ProfileCardProps) {
  return (
    <ModernCard>
      <div className="text-center">
        <img
          src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=ffffff`}
          alt={name}
          className="w-20 h-20 rounded-full mx-auto mb-4"
        />
        <h3 className="font-semibold text-gray-900 text-lg">{name}</h3>
        <p className="text-gray-600 text-sm mb-2">
          {role === 'student' ? course : company}
        </p>
        {location && (
          <p className="text-gray-500 text-sm mb-4">{location}</p>
        )}
        
        {stats && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            <div className="text-center">
              <p className="font-semibold text-blue-600">{stats.posts || 0}</p>
              <p className="text-xs text-gray-500">Posts</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-green-600">{stats.connections || 0}</p>
              <p className="text-xs text-gray-500">Connections</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-purple-600">{stats.views || 0}</p>
              <p className="text-xs text-gray-500">Views</p>
            </div>
          </div>
        )}
      </div>
    </ModernCard>
  );
}