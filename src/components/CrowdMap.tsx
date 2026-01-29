import { useEffect, useRef, useMemo } from 'react';
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
  onNavigate?: (location: Location) => void;
  selectedLocation?: Location | null;
}

export function CrowdMap({ locations, onLocationSelect, onNavigate, selectedLocation }: CrowdMapProps) {
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

  // Memoize icons to prevent re-creation on every render
  const icons = useMemo(() => {
    const createIcon = (color: string) => L.divIcon({
      className: 'custom-marker',
      html: `
        <div class="map-marker-container">
          <div class="map-marker-dot" style="background: ${color};"></div>
          <div class="map-marker-pulse" style="background: ${color};"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });

    return {
      low: createIcon('#10B981'),
      medium: createIcon('#F59E0B'),
      high: createIcon('#EF4444'),
    };
  }, []);

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
              icon={icons[location.crowdLevel]}
              eventHandlers={{
                click: () => onLocationSelect?.(location),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-4 min-w-[240px]">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{location.name}</h3>
                      <p className="text-xs text-muted-foreground">{location.address}</p>
                    </div>
                    <CrowdBadge level={location.crowdLevel} size="sm" />
                  </div>

                  {location.crowdLevel === 'high' && (
                    <div className="mb-3 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 text-destructive">⚠️</div>
                        <div>
                          <p className="text-xs font-semibold text-destructive">High Density Zone</p>
                          <p className="text-[10px] text-destructive/80 leading-tight mt-0.5">
                            Public Safety Redirect Active: Please avoid this area. Security monitoring intense.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

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
                    onClick={() => onNavigate?.(location)}
                  >
                    View Details
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
