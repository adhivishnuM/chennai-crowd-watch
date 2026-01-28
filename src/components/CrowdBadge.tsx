import { motion } from 'framer-motion';
import { CrowdLevel } from '@/data/mockLocations';

interface CrowdBadgeProps {
  level: CrowdLevel;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export function CrowdBadge({ level, size = 'md', showPulse = true }: CrowdBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  const labels = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
  };

  return (
    <motion.span
      className={`badge-${level} ${sizeClasses[size]} uppercase tracking-wider font-semibold`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {showPulse && (
        <span className="relative flex h-2 w-2">
          <span 
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              level === 'low' ? 'bg-crowd-low' : level === 'medium' ? 'bg-crowd-medium' : 'bg-crowd-high'
            }`}
          />
          <span 
            className={`relative inline-flex rounded-full h-2 w-2 ${
              level === 'low' ? 'bg-crowd-low' : level === 'medium' ? 'bg-crowd-medium' : 'bg-crowd-high'
            }`}
          />
        </span>
      )}
      {labels[level]}
    </motion.span>
  );
}
