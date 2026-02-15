import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/index.css';
import { registerSW } from 'virtual:pwa-register';

// FULL PWA VERSION with Service Worker
// Use this for Vercel production deployment
// For Figma Make, use the version without PWA imports

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

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
