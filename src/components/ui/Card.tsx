import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-stone-200/80 bg-white p-4 shadow-sm shadow-stone-900/5 ${
        onClick
          ? 'cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md'
          : ''
      } ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
