import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion } from 'framer-motion';
import 'leaflet/dist/leaflet.css';
import { Location, CrowdLevel } from '@/data/mockLocations';
import { CrowdBadge } from './CrowdBadge';
import { Users, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import CountUp from 'react-countup';
import { useMode } from '@/context/ModeContext';

// Chennai center coordinates
const CHENNAI_CENTER: [number, number] = [13.0500, 80.2500];
const DEFAULT_ZOOM = 12;

// Create custom pulsing markers
const createPulsingIcon = (level: CrowdLevel) => {
  const colors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
  };

  const color = colors[level];

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="position: relative; width: 24px; height: 24px;">
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 16px;
          height: 16px;
          background: ${color};
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          z-index: 2;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          background: ${color};
          border-radius: 50%;
          opacity: 0.3;
          animation: pulse-ring 1.5s ease-out infinite;
        "></div>
      </div>
      <style>
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
      </style>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

interface MapRecenterProps {
  lat: number;
  lng: number;
}

function MapRecenter({ lat, lng }: MapRecenterProps) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

interface CrowdMapProps {
  locations: Location[];
  onLocationSelect?: (location: Location) => void;
  selectedLocation?: Location | null;
}

export function CrowdMap({ locations, onLocationSelect, selectedLocation }: CrowdMapProps) {
  const mapRef = useRef<L.Map>(null);
  const { mode } = useMode();

  const TrendIcon = (trend: Location['trend']) => {
    const icons = {
      rising: TrendingUp,
      falling: TrendingDown,
      stable: Minus,
    };
    return icons[trend];
  };

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-glass">
      <MapContainer
        center={CHENNAI_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        ref={mapRef}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {selectedLocation && (
          <MapRecenter lat={selectedLocation.lat} lng={selectedLocation.lng} />
        )}

        {locations.map((location) => {
          const Icon = TrendIcon(location.trend);
          const capacityPercentage = Math.round((location.currentCount / location.capacity) * 100);

          return (
            <Marker
              key={location.id}
              position={[location.lat, location.lng]}
              icon={createPulsingIcon(location.crowdLevel)}
              eventHandlers={{
                click: () => onLocationSelect?.(location),
              }}
            >
              <Popup className="custom-popup">
                <motion.div
                  className="p-4 min-w-[240px]"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{location.name}</h3>
                      <p className="text-xs text-muted-foreground">{location.address}</p>
                    </div>
                    <CrowdBadge level={location.crowdLevel} size="sm" />
                  </div>

                  <div className="space-y-2 mb-3">
                    {mode === 'admin' && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Users className="w-4 h-4" />
                          Current
                        </span>
                        <span className="font-semibold tabular-nums">
                          ~<CountUp end={location.currentCount} duration={1} separator="," /> people
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">{capacityPercentage}% full</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Trend</span>
                      <span className="flex items-center gap-1 capitalize">
                        <Icon className={`w-4 h-4 ${location.trend === 'rising' ? 'text-crowd-high' :
                            location.trend === 'falling' ? 'text-crowd-low' :
                              'text-muted-foreground'
                          }`} />
                        {location.trend}
                      </span>
                    </div>
                  </div>

                  <button
                    className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    onClick={() => onLocationSelect?.(location)}
                  >
                    View Details
                  </button>
                </motion.div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
