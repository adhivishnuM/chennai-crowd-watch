import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronUp, ChevronDown, List, Map as MapIcon } from 'lucide-react';
import { CrowdMap } from './CrowdMap';
import { LocationCard } from './LocationCard';
import { chennaiLocations, Location } from '@/data/mockLocations';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { LocationTypeIcon, locationTypeFilters } from './LocationTypeIcon';

type FilterType = 'all' | 'mall' | 'foodcourt' | 'park' | 'transit' | 'market' | 'museum' | 'toll';
type SortType = 'crowd' | 'distance' | 'name';

export function MapDashboard() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('crowd');
  const [panelExpanded, setPanelExpanded] = useState(true);
  const [showListMobile, setShowListMobile] = useState(false);

  const filteredLocations = useMemo(() => {
    let filtered = filter === 'all'
      ? chennaiLocations
      : chennaiLocations.filter(loc => loc.type === filter);

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'crowd') {
        const crowdOrder = { high: 0, medium: 1, low: 2 };
        return crowdOrder[a.crowdLevel] - crowdOrder[b.crowdLevel];
      }
      if (sortBy === 'distance') {
        const distA = parseFloat(a.distance?.replace(' km', '') || '0');
        const distB = parseFloat(b.distance?.replace(' km', '') || '0');
        return distA - distB;
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [filter, sortBy]);

  const handleLocationClick = (location: Location) => {
    navigate(`/location/${location.id}`);
  };

  const crowdStats = useMemo(() => {
    const low = chennaiLocations.filter(l => l.crowdLevel === 'low').length;
    const medium = chennaiLocations.filter(l => l.crowdLevel === 'medium').length;
    const high = chennaiLocations.filter(l => l.crowdLevel === 'high').length;
    return { low, medium, high };
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row relative">
      {/* Map */}
      <motion.div
        className="flex-1 relative"
        layout
      >
        <CrowdMap
          locations={filteredLocations}
          onLocationSelect={handleLocationClick}
          selectedLocation={selectedLocation}
        />

        {/* Quick Stats Overlay */}
        <div className="absolute top-4 left-4 right-4 lg:right-auto flex gap-2 z-10">
          <motion.div
            className="glass-card px-3 py-2 flex items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="w-2 h-2 rounded-full bg-crowd-low" />
            <span className="text-sm font-medium">{crowdStats.low} Low</span>
          </motion.div>
          <motion.div
            className="glass-card px-3 py-2 flex items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <span className="w-2 h-2 rounded-full bg-crowd-medium" />
            <span className="text-sm font-medium">{crowdStats.medium} Medium</span>
          </motion.div>
          <motion.div
            className="glass-card px-3 py-2 flex items-center gap-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="w-2 h-2 rounded-full bg-crowd-high" />
            <span className="text-sm font-medium">{crowdStats.high} High</span>
          </motion.div>
        </div>

        {/* Mobile List Toggle */}
        <button
          className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 glass-card px-4 py-2 flex items-center gap-2 z-10"
          onClick={() => setShowListMobile(!showListMobile)}
        >
          <List className="w-4 h-4" />
          <span className="text-sm font-medium">View List</span>
          <ChevronUp className={`w-4 h-4 transition-transform ${showListMobile ? 'rotate-180' : ''}`} />
        </button>
      </motion.div>

      {/* Side Panel - Desktop */}
      <motion.div
        className={`hidden lg:flex flex-col border-l border-border/50 bg-background/95 backdrop-blur-lg ${panelExpanded ? 'w-[400px]' : 'w-0'
          }`}
        initial={false}
        animate={{ width: panelExpanded ? 400 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {panelExpanded && (
          <>
            {/* Filter Bar */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Locations</h2>
                <span className="text-sm text-muted-foreground">{filteredLocations.length} places</span>
              </div>
              <div className="w-full overflow-x-auto pb-2">
                <div className="flex gap-2">
                  {locationTypeFilters.map((option) => (
                    <button
                      key={option.value}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground'
                        }`}
                      onClick={() => setFilter(option.value as FilterType)}
                    >
                      <LocationTypeIcon type={option.value} size={16} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Location List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {filteredLocations.map((location, index) => (
                  <LocationCard
                    key={location.id}
                    location={location}
                    index={index}
                    onClick={() => handleLocationClick(location)}
                  />
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </motion.div>

      {/* Toggle Panel Button */}
      <button
        className="hidden lg:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 glass-card p-2 rounded-l-lg rounded-r-none border-r-0"
        onClick={() => setPanelExpanded(!panelExpanded)}
        style={{ right: panelExpanded ? 400 : 0 }}
      >
        {panelExpanded ? <ChevronDown className="w-4 h-4 rotate-90" /> : <ChevronUp className="w-4 h-4 rotate-90" />}
      </button>

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {showListMobile && (
          <motion.div
            className="lg:hidden fixed inset-x-0 bottom-0 z-30 bg-background rounded-t-3xl shadow-glass border-t border-border"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="p-4">
              {/* Handle */}
              <div className="w-12 h-1 bg-border rounded-full mx-auto mb-4" />

              {/* Filter */}
              <div className="w-full overflow-x-auto mb-4 pb-2">
                <div className="flex gap-2">
                  {locationTypeFilters.map((option) => (
                    <button
                      key={option.value}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === option.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80 text-foreground'
                        }`}
                      onClick={() => setFilter(option.value as FilterType)}
                    >
                      <LocationTypeIcon type={option.value} size={16} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location List */}
              <ScrollArea className="h-[50vh]">
                <div className="space-y-3 pr-4">
                  {filteredLocations.map((location, index) => (
                    <LocationCard
                      key={location.id}
                      location={location}
                      index={index}
                      onClick={() => handleLocationClick(location)}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
