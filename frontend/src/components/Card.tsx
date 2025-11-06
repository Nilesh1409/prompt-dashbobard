import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = ({ children, className, padding = 'md', hover = false }: CardProps) => {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={clsx(
        'glass-effect rounded-xl',
        paddingStyles[padding],
        hover && 'hover:shadow-2xl transition-shadow duration-300',
        className
      )}
    >
      {children}
    </div>
  );
};

