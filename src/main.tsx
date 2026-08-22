import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { seedInitialSettings } from './seedSettings';

seedInitialSettings().catch(err => {
  console.warn('Failed to seed initial settings (can be ignored if already seeded or unauthenticated):', err);
});
// NOTE: seedInitialHubs() was intentionally removed from startup (previously ran here).
// It was creating permanent fake demo hubs ("hub-seed-1", "hub-seed-2", etc.) in the
// real database on every first app load, which showed up mixed in with real hubs in
// customer/merchant hub search results. Real hubs are now created via the
// "Hub Location & Details" section on a Hub Owner's Profile page instead.
// Any fake hub documents already created by earlier runs of this script still need to
// be deleted manually from Firestore (see the note given alongside this fix).

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
