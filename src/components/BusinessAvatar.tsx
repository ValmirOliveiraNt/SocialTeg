import React, { useState } from 'react'

interface BusinessAvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const BusinessAvatar: React.FC<BusinessAvatarProps> = ({
  src,
  name = 'E',
  size = 'md',
  className = '',
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const initial = (name.trim().charAt(0) || 'E').toUpperCase()

  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl text-sm',
    md: 'w-16 h-16 rounded-2xl text-xl',
    lg: 'w-24 h-24 rounded-2xl text-3xl',
    xl: 'w-28 h-28 sm:w-32 sm:h-32 rounded-[1.75rem] text-4xl',
  }[size]

  if (src && failedSrc !== src) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailedSrc(src)}
        className={`${sizeClasses} object-contain bg-white p-1 ${className}`}
      />
    )
  }

  return (
    <div
      className={`${sizeClasses} bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white font-black flex items-center justify-center shadow-inner ${className}`}
    >
      <span>{initial}</span>
    </div>
  )
}
