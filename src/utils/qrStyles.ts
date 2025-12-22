// QR Code Style Configurations

export interface QRStyleConfig {
  id: string;
  name: string;
  type: 'solid' | 'gradient' | 'pattern';
  fgColor: string;
  bgColor: string;
  gradient?: {
    type: 'linear' | 'radial';
    colors: string[];
    rotation?: number;
  };
  dotStyle?: 'square' | 'dots' | 'rounded';
  cornerStyle?: 'square' | 'dot' | 'rounded';
  premium: boolean;
}

export const QR_STYLES: QRStyleConfig[] = [
  // Free styles - no ad required
  {
    id: 'classic',
    name: 'Classic',
    type: 'solid',
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    dotStyle: 'square',
    premium: false,
  },
  {
    id: 'slate',
    name: 'Slate',
    type: 'solid',
    fgColor: '#334155',
    bgColor: '#FFFFFF',
    dotStyle: 'square',
    premium: false,
  },
  {
    id: 'sky',
    name: 'Sky',
    type: 'solid',
    fgColor: '#0284C7',
    bgColor: '#FFFFFF',
    dotStyle: 'rounded',
    premium: false,
  },
  // Premium styles - Gradients
  {
    id: 'sunset',
    name: 'Sunset',
    type: 'gradient',
    fgColor: '#F97316',
    bgColor: '#FFFFFF',
    gradient: {
      type: 'linear',
      colors: ['#F97316', '#EC4899'],
      rotation: 45,
    },
    dotStyle: 'square',
    premium: true,
  },
  {
    id: 'aurora',
    name: 'Aurora',
    type: 'gradient',
    fgColor: '#10B981',
    bgColor: '#FFFFFF',
    gradient: {
      type: 'linear',
      colors: ['#10B981', '#3B82F6'],
      rotation: 135,
    },
    dotStyle: 'rounded',
    premium: true,
  },
  {
    id: 'lavender',
    name: 'Lavender',
    type: 'gradient',
    fgColor: '#8B5CF6',
    bgColor: '#FFFFFF',
    gradient: {
      type: 'linear',
      colors: ['#8B5CF6', '#EC4899'],
      rotation: 90,
    },
    dotStyle: 'square',
    premium: true,
  },
  // Premium styles - Solid accents
  {
    id: 'ruby',
    name: 'Ruby',
    type: 'solid',
    fgColor: '#DC2626',
    bgColor: '#FFFFFF',
    dotStyle: 'dots',
    premium: true,
  },
  {
    id: 'emerald',
    name: 'Emerald',
    type: 'solid',
    fgColor: '#059669',
    bgColor: '#FFFFFF',
    dotStyle: 'rounded',
    premium: true,
  },
  {
    id: 'gold',
    name: 'Gold',
    type: 'solid',
    fgColor: '#D97706',
    bgColor: '#FFFFFF',
    dotStyle: 'square',
    premium: true,
  },
  // Premium styles - Patterns
  {
    id: 'midnight',
    name: 'Midnight',
    type: 'solid',
    fgColor: '#1E293B',
    bgColor: '#F8FAFC',
    dotStyle: 'dots',
    cornerStyle: 'dot',
    premium: true,
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    type: 'gradient',
    fgColor: '#6366F1',
    bgColor: '#FFFFFF',
    gradient: {
      type: 'radial',
      colors: ['#6366F1', '#A855F7'],
    },
    dotStyle: 'rounded',
    cornerStyle: 'rounded',
    premium: true,
  },
  {
    id: 'mint',
    name: 'Mint',
    type: 'solid',
    fgColor: '#14B8A6',
    bgColor: '#FFFFFF',
    dotStyle: 'dots',
    premium: true,
  },
  {
    id: 'fire',
    name: 'Fire',
    type: 'gradient',
    fgColor: '#EF4444',
    bgColor: '#FFFFFF',
    gradient: {
      type: 'linear',
      colors: ['#EF4444', '#F59E0B'],
      rotation: 45,
    },
    dotStyle: 'square',
    premium: true,
  },
  {
    id: 'neon',
    name: 'Neon',
    type: 'solid',
    fgColor: '#22C55E',
    bgColor: '#FFFFFF',
    dotStyle: 'rounded',
    cornerStyle: 'rounded',
    premium: true,
  },
];

export const getFreeStyles = () => QR_STYLES.filter(s => !s.premium);
export const getPremiumStyles = () => QR_STYLES.filter(s => s.premium);
export const getStyleById = (id: string) => QR_STYLES.find(s => s.id === id);
