import React, { useId } from 'react'

export const InstagramIcon: React.FC<{
  className?: string
  colored?: boolean
}> = ({ className = 'w-4 h-4', colored = false }) => {
  const gradientId = useId().replace(/:/g, '')

  if (colored) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <rect
          x="2"
          y="2"
          width="20"
          height="20"
          rx="5.5"
          ry="5.5"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.2"
        />
        <circle
          cx="12"
          cy="12"
          r="4.5"
          stroke={`url(#${gradientId})`}
          strokeWidth="2.2"
        />
        <circle cx="17.5" cy="6.5" r="1.4" fill={`url(#${gradientId})`} />
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="2" y="2" width="20" height="20" rx="5.5" ry="5.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
