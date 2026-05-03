import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  children: ReactNode;
}

export function Card({ hover = false, children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl bg-white p-5 shadow-card transition-all duration-200 ${
        hover
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-elevated active:translate-y-0'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
