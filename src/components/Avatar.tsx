'use client';

import React, { useState } from 'react';

interface AvatarProps {
  src?: string | null;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  firstName, 
  lastName, 
  size = 'md', 
  className = '' 
}) => {
  const [imageError, setImageError] = useState(false);
  
  // Rainbow colors array
  const colors = [
    'bg-red-500',
    'bg-orange-500', 
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500'
  ];

  // Generate initials
  const getInitials = (first: string, last: string): string => {
    const firstInitial = first?.charAt(0)?.toUpperCase() || '';
    const lastInitial = last?.charAt(0)?.toUpperCase() || '';
    return `${firstInitial}${lastInitial}`;
  };

  // Generate consistent color based on name
  const getColorForName = (first: string, last: string): string => {
    const fullName = `${first}${last}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < fullName.length; i++) {
      const char = fullName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-32 h-32 text-3xl'
  };

  const initials = getInitials(firstName, lastName);
  const backgroundColor = getColorForName(firstName, lastName);
  const shouldShowImage = src && !imageError;

  if (shouldShowImage) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${backgroundColor} rounded-full flex items-center justify-center text-white font-bold shadow-sm ${className}`}
    >
      {initials}
    </div>
  );
};

export default Avatar;
