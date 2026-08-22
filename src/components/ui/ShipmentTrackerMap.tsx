import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { Truck, MapPin, Navigation } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
}

interface ShipmentTrackerMapProps {
  apiKey: string;
  origin: Location;
  destination: Location;
  riderLocation?: Location;
  isOutForDelivery?: boolean;
}

const RiderMarker = ({ location }: { location: Location }) => {
  return (
    <AdvancedMarker position={location} title="Dispatch Rider">
      <div className="relative">
        <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white animate-bounce">
          <Truck size={20} className="text-white" />
        </div>
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary-600 rotate-45 -z-10" />
      </div>
    </AdvancedMarker>
  );
};

export const ShipmentTrackerMap: React.FC<ShipmentTrackerMapProps> = ({
  apiKey,
  origin,
  destination,
  riderLocation: initialRiderLocation,
  isOutForDelivery = false
}) => {
  const [riderPos, setRiderPos] = useState<Location>(initialRiderLocation || origin);
  const [showInfo, setShowInfo] = useState(true);

  // Simulation of movement if out for delivery
  useEffect(() => {
    if (!isOutForDelivery) return;

    const interval = setInterval(() => {
      setRiderPos(prev => {
        const latDiff = (destination.lat - prev.lat) * 0.05;
        const lngDiff = (destination.lng - prev.lng) * 0.05;

        // If very close, stop moving
        if (Math.abs(latDiff) < 0.0001 && Math.abs(lngDiff) < 0.0001) {
          clearInterval(interval);
          return destination;
        }

        return {
          lat: prev.lat + latDiff,
          lng: prev.lng + lngDiff
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isOutForDelivery, destination]);

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="space-y-2">
          <Navigation size={32} className="mx-auto text-slate-400 animate-pulse" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Maps API Key Required</p>
          <p className="text-xs text-slate-400">Please configure VITE_GOOGLE_MAPS_API_KEY in secrets.</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800">
        <Map
          defaultCenter={origin}
          defaultZoom={13}
          mapId="bf51a910020fa25a" // Custom map ID for clean UI
          disableDefaultUI={true}
          className="w-full h-full"
        >
          {/* Origin Marker */}
          <AdvancedMarker position={origin}>
            <Pin background={'#0284c7'} glyphColor={'#fff'} borderColor={'#0369a1'} />
          </AdvancedMarker>

          {/* Destination Marker */}
          <AdvancedMarker position={destination}>
            <Pin background={'#10b981'} glyphColor={'#fff'} borderColor={'#059669'} />
          </AdvancedMarker>

          {/* Real-time Rider Marker */}
          {isOutForDelivery && <RiderMarker location={riderPos} />}

          {showInfo && isOutForDelivery && (
            <InfoWindow position={riderPos} onCloseClick={() => setShowInfo(false)}>
              <div className="p-1">
                <p className="text-xs font-black uppercase text-primary-600">Live Tracking</p>
                <p className="text-[10px] text-slate-500">Rider is approaching your location</p>
              </div>
            </InfoWindow>
          )}
        </Map>
      </div>
    </APIProvider>
  );
};
