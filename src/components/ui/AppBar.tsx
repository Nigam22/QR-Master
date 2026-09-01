import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AppBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string; // New prop for custom back navigation
  actions?: React.ReactNode;
  gradient?: boolean;
}

export const AppBar: React.FC<AppBarProps> = ({
  title,
  subtitle,
  showBack = false,
  backTo, // New prop
  actions,
  gradient = false,
}) => {
  const navigate = useNavigate();

  // Handle back navigation
  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`px-4 pt-12 pb-6 ${gradient ? 'gradient-primary rounded-b-[2rem]' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className={`p-2.5 rounded-xl transition-all active:scale-95 ${
                gradient
                  ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              <ArrowLeft className={`w-5 h-5 ${gradient ? 'text-primary-foreground' : 'text-foreground'}`} />
            </button>
          )}
          <div>
            <h1 className={`text-xl font-bold ${gradient ? 'text-primary-foreground' : 'gradient-text'}`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-sm mt-0.5 ${gradient ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};