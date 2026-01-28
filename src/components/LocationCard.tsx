import { motion } from 'framer-motion';
import { MapPin, TrendingUp, TrendingDown, Minus, Clock, Users } from 'lucide-react';
import CountUp from 'react-countup';
import { Location, getLocationTypeIcon, getTrendIcon } from '@/data/mockLocations';
import { CrowdBadge } from './CrowdBadge';
import { Progress } from '@/components/ui/progress';

interface LocationCardProps {
  location: Location;
  onClick?: () => void;
  index?: number;
}

export function LocationCard({ location, onClick, index = 0 }: LocationCardProps) {
  const capacityPercentage = Math.round((location.currentCount / location.capacity) * 100);
  
  const TrendIcon = {
    rising: TrendingUp,
    falling: TrendingDown,
    stable: Minus,
  }[location.trend];

  const trendColor = {
    rising: 'text-crowd-high',
    falling: 'text-crowd-low',
    stable: 'text-muted-foreground',
  }[location.trend];

  return (
    <motion.div
      className="glass-card-hover cursor-pointer overflow-hidden"
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{getLocationTypeIcon(location.type)}</span>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground truncate">{location.name}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{location.address}</span>
              </div>
            </div>
          </div>
          <CrowdBadge level={location.crowdLevel} size="sm" />
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium tabular-nums">
              ~<CountUp end={location.currentCount} duration={1.5} separator="," />
            </span>
            <span className="text-muted-foreground">people</span>
          </div>
          <div className={`flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-xs font-medium capitalize">{location.trend}</span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Capacity</span>
            <span className="font-medium tabular-nums">{capacityPercentage}% full</span>
          </div>
          <Progress 
            value={capacityPercentage} 
            className="h-1.5"
          />
        </div>

        {/* Best Time */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <Clock className="w-3.5 h-3.5" />
          <span>Best time: </span>
          <span className="font-medium text-foreground">{location.bestTime}</span>
        </div>

        {/* Distance */}
        {location.distance && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{location.distance} away</span>
            <span className="text-xs font-medium text-primary hover:underline">View Details →</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
