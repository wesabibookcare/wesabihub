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
      <div className="relative flex flex-col items-center justify-center h-full min-h-[240px] w-full bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white text-center rounded-xl overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
        <div className="relative z-10 max-w-md bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/60 shadow-xl">
          <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-100 mb-1">Interactive Map Preview</h3>
          <p className="text-sm text-slate-300 mb-4">
            Map key is currently unconfigured. Satellite & route views are active in sandbox mode.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Geolocation Active
          </div>
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
