import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ScanLine, QrCode, History, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

// Navigation items configuration
const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/scan', icon: ScanLine, label: 'Scan' },
  { path: '/generate', icon: QrCode, label: 'Generate' },
  { path: '/history', icon: History, label: 'History' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

// Bottom navigation bar for mobile-first design
export const BottomNav: React.FC = () => {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 safe-area-bottom z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-300',
                isActive 
                  ? 'text-primary scale-110' 
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className={cn('w-6 h-6', isActive && 'drop-shadow-lg')} />
              <span className="text-xs font-medium">{label}</span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
