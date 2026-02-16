import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/index.css';
import { registerSW } from 'virtual:pwa-register';

// Register the service worker for PWA functionality
try {
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
} catch (error) {
  console.error('Failed to register service worker:', error);
}

const root = document.getElementById('root');
if (!root) {
  console.error('Root element not found!');
  throw new Error('Root element not found');
}

try {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('App mounted successfully');
} catch (error) {
  console.error('Failed to mount React app:', error);
  // Show error message in the DOM
  root.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; background: #fee; font-family: system-ui, -apple-system, sans-serif; padding: 20px; text-align: center;">
      <h1 style="color: #c00; font-size: 24px; margin-bottom: 16px;">App Failed to Load</h1>
      <p style="color: #666; margin-bottom: 8px;">An error occurred while loading the app. Please try:</p>
      <ul style="color: #666; text-align: left; list-style-position: inside;">
        <li>Clearing your browser cache</li>
        <li>Refreshing the page (Ctrl+Shift+R)</li>
        <li>Checking the browser console for errors</li>
      </ul>
      <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; margin-top: 16px; overflow: auto; max-width: 100%; color: #c00;">${error}</pre>
    </div>
  `;
}