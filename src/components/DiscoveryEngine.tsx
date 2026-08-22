import React, { useState, useEffect } from 'react';
import { MapComponent } from './MapComponent';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { HubCenter } from '../types';

export function DiscoveryEngine({ points, center = { lat: 6.5244, lng: 3.3792 } }: {
  points: HubCenter[];
  center?: { lat: number; lng: number };
}) {
  return (
    <div className="h-full w-full">
        <MapComponent center={center}>
          {points.map(point => (
            point.location && (
              <AdvancedMarker key={point.id} position={point.location}>
                <Pin background={'#fbbc04'} glyphColor={'#000'} borderColor={'#000'} />
              </AdvancedMarker>
            )
          ))}
        </MapComponent>
    </div>
  );
}
