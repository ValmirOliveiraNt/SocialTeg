import React from 'react'

export interface SavingIndicatorProps {
  label?: string
  className?: string
}

export const SavingIndicator: React.FC<SavingIndicatorProps> = ({
  label = 'Salvando...',
  className = '',
}) => (
  <span className={`phase inline-flex items-center gap-1.5 ${className}`}>
    <span className="inline-block w-2 h-2 rounded-full bg-current" />
    <span className="inline-block w-2 h-2 rounded-full bg-current" />
    <span className="inline-block w-2 h-2 rounded-full bg-current" />
    {label && <span className="ml-1 text-xs font-semibold">{label}</span>}
  </span>
)

