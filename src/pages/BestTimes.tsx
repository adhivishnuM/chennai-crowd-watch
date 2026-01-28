import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Filter, ChevronRight } from 'lucide-react';
import { chennaiLocations, Location, getLocationTypeIcon } from '@/data/mockLocations';
import { CrowdBadge } from '@/components/CrowdBadge';
import { PopularTimesChart } from '@/components/PopularTimesChart';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

type FilterType = 'all' | 'mall' | 'beach' | 'park' | 'transit' | 'market' | 'museum';

const filterOptions: { value: FilterType; label: string; emoji: string }[] = [
  { value: 'all', label: 'All', emoji: '📍' },
  { value: 'mall', label: 'Malls', emoji: '🏬' },
  { value: 'beach', label: 'Beaches', emoji: '🏖️' },
  { value: 'park', label: 'Parks', emoji: '🌳' },
  { value: 'transit', label: 'Transit', emoji: '🚉' },
  { value: 'market', label: 'Markets', emoji: '🛒' },
  { value: 'museum', label: 'Museums', emoji: '🏛️' },
];

export default function BestTimes() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const filteredLocations = useMemo(() => {
    return filter === 'all' 
      ? chennaiLocations 
      : chennaiLocations.filter(loc => loc.type === filter);
  }, [filter]);

  const toggleLocationSelection = (id: string) => {
    setSelectedLocations(prev => 
      prev.includes(id) 
        ? prev.filter(l => l !== id)
        : prev.length < 3 
          ? [...prev, id]
          : prev
    );
  };

  const comparisonLocations = chennaiLocations.filter(loc => selectedLocations.includes(loc.id));

  return (
    <motion.div
      className="min-h-screen bg-background pt-20 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">Plan Your Visit</h1>
          <p className="text-muted-foreground">Find the best times to visit Chennai's popular spots</p>
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filter === option.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                  onClick={() => setFilter(option.value)}
                >
                  <span>{option.emoji}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </motion.div>

        {/* Comparison Feature */}
        {selectedLocations.length > 0 && (
          <motion.div
            className="glass-card p-6 mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Compare Peak Times</h3>
              <button 
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedLocations([])}
              >
                Clear all
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {comparisonLocations.map((location) => (
                <div key={location.id} className="bg-secondary/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{getLocationTypeIcon(location.type)}</span>
                    <span className="font-medium text-sm truncate">{location.name}</span>
                  </div>
                  <PopularTimesChart data={location.popularTimes} />
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Location Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location, index) => (
            <motion.div
              key={location.id}
              className={`glass-card-hover overflow-hidden cursor-pointer ${
                selectedLocations.includes(location.id) ? 'ring-2 ring-primary' : ''
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/location/${location.id}`)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getLocationTypeIcon(location.type)}</span>
                    <div>
                      <h3 className="font-semibold text-sm">{location.name}</h3>
                      <p className="text-xs text-muted-foreground">{location.address}</p>
                    </div>
                  </div>
                  <CrowdBadge level={location.crowdLevel} size="sm" showPulse={false} />
                </div>

                {/* Mini Chart */}
                <div className="h-16 mb-3 opacity-70">
                  <PopularTimesChart data={location.popularTimes} />
                </div>

                {/* Best Time */}
                <div className="flex items-center justify-between border-t border-border/50 pt-3">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Clock className="w-3.5 h-3.5 text-crowd-low" />
                    <span className="text-muted-foreground">Best:</span>
                    <span className="font-semibold text-crowd-low">{location.bestTime}</span>
                  </div>
                  <button
                    className="p-1.5 rounded-full hover:bg-secondary transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLocationSelection(location.id);
                    }}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      selectedLocations.includes(location.id)
                        ? 'bg-primary border-primary'
                        : 'border-border'
                    }`}>
                      {selectedLocations.includes(location.id) && (
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Helper Text */}
        <motion.p
          className="text-center text-sm text-muted-foreground mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Select up to 3 locations to compare their peak times
        </motion.p>
      </div>
    </motion.div>
  );
}
