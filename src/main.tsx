import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { seedInitialSettings } from './seedSettings';
import { seedInitialUsers } from './seedUsers';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';

seedInitialSettings().catch(err => {
  console.warn('Failed to seed initial settings (can be ignored if already seeded or unauthenticated):', err);
});

seedInitialUsers().catch(err => {
  console.warn('Failed to seed initial users (can be ignored if already seeded or unauthenticated):', err);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
