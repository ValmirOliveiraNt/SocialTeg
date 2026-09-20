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
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
    xl: 'h-16',
  }[size]

  return (
    <img
      src={showText
        ? theme === 'dark' ? '/brand/logo-horizontal-white-1200.png' : '/brand/logo-horizontal-color-600.png'
        : theme === 'dark' ? '/brand/symbol-negative-512.png' : '/brand/symbol-color-512.png'}
      alt="AvaliaTag — Aproximou. Avaliou. Cresceu."
      className={`${heightClasses} w-auto object-contain select-none ${className}`}
    />
  )
}
