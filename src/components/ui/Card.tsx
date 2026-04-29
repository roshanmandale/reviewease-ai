import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
}

export function Card({ children, className, glass = false, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border',
        glass
          ? 'bg-white/70 backdrop-blur-xl border-white/20 shadow-xl'
          : 'bg-white border-gray-100 shadow-sm',
        hover && 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-5 border-b border-gray-100', className)}>{children}</div>;
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl', className)}>
      {children}
    </div>
  );
}
