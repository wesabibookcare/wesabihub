import React from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

export function MapComponent({ center, zoom = 12, children }: {
  center: { lat: number; lng: number };
  zoom?: number;
  children?: React.ReactNode;
}) {
  if (!hasValidKey) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 p-6">
        <div className="text-center max-w-lg">
          <h2 className="text-2xl font-bold mb-4">Google Maps API Key Required</h2>
          <p className="mb-4"><strong>Step 1:</strong> <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener" className="text-blue-600 underline">Get an API Key</a></p>
          <p className="mb-4"><strong>Step 2:</strong> Add your key as a secret in AI Studio:</p>
          <ul className="text-left list-disc list-inside mb-4">
            <li>Open <strong>Settings</strong> (⚙️ gear icon)</li>
            <li>Select <strong>Secrets</strong></li>
            <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
          </ul>
          <p>The app rebuilds automatically.</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId="WESABI_MAP"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
      </Map>
    </APIProvider>
  );
}
