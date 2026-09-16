import React from 'react'

interface BrandLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  theme?: 'light' | 'dark'
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  theme = 'light',
}) => {
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  }[size]

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative shrink-0 flex items-center justify-center">
        <img
          src="/logo.png"
          alt="SocialTag Logo"
          className={`${heightClasses} w-auto object-contain rounded-xl`}
        />
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={`font-black tracking-tight leading-none ${
              size === 'sm'
                ? 'text-base'
                : size === 'md'
                ? 'text-xl'
                : size === 'lg'
                ? 'text-2xl'
                : 'text-3xl'
            } ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
          >
            Social<span className="text-blue-600">Tag</span>
          </span>
          <span
            className={`text-[9px] uppercase tracking-widest font-bold mt-0.5 ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            NFC Inteligente
          </span>
        </div>
      )}
    </div>
  )
}
