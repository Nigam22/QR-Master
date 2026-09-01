import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
  glowing?: boolean;
}

// Animated card component with glass effect and smooth transitions
export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  hoverable = true,
  glowing = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'glass rounded-2xl p-6 transition-all duration-300',
        hoverable && 'hover:scale-[1.02] hover:shadow-xl cursor-pointer',
        glowing && 'glow-primary',
        'animate-fade-in',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
