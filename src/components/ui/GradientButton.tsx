import React from 'react';
import { cn } from '@/lib/utils';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

// Beautiful gradient button component with glow effects
export const GradientButton: React.FC<GradientButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseStyles = 'relative font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'gradient-primary text-primary-foreground glow-primary hover:shadow-lg',
    secondary: 'gradient-secondary text-secondary-foreground glow-accent hover:shadow-lg',
    outline: 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };
  
  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
};
