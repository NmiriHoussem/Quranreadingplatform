import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

// =============================================================================
// SERVICE WORKER REGISTRATION
// =============================================================================
// If Figma Make publishing gets stuck, you can temporarily comment out
// the service worker registration below. Just uncomment this section and
// comment out the import and registration code below.
// =============================================================================

import { registerSW } from 'virtual:pwa-register';

// Register the service worker for PWA functionality
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('App is ready to work offline.');
  },
  onRegistered(registration) {
    console.log('Service Worker registered:', registration);
  },
  onRegisterError(error) {
    console.error('Service Worker registration error:', error);
  }
});

// =============================================================================
// END SERVICE WORKER REGISTRATION
// =============================================================================

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
