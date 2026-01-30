import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Location } from '@/data/mockLocations';
import { CrowdBadge } from './CrowdBadge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CHENNAI_CENTER: [number, number] = [13.0500, 80.2500];
const DEFAULT_ZOOM = 12;

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
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

  const TrendIcon = (trend: Location['trend']) => {
    const icons = { rising: TrendingUp, falling: TrendingDown, stable: Minus };
    return icons[trend];
  };

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
    <div className="w-full h-full">
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
                <div className="p-4 min-w-[220px]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground">{location.name}</h3>
                      <p className="text-xs text-muted-foreground">{location.address}</p>
                    </div>
                    <CrowdBadge level={location.crowdLevel} size="sm" showPulse={false} />
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Trend</span>
                      <span className="flex items-center gap-1 capitalize">
                        <Icon className={`w-3.5 h-3.5 ${location.trend === 'rising' ? 'text-crowd-high' :
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
