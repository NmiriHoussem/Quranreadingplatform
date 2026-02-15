#!/bin/bash

# Quick script to toggle between full PWA and simplified Figma publishing config

if [ "$1" == "figma" ]; then
    echo "🔧 Switching to simplified config for Figma publishing..."
    
    # Backup current configs
    cp vite.config.ts vite.config.pwa.backup.ts
    cp src/main.tsx src/main.pwa.backup.tsx
    
    # Use simplified config
    cp vite.config.simple.ts vite.config.ts
    
    # Create simplified main.tsx without service worker
    cat > src/main.tsx << 'EOF'
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './styles/index.css';

// Service worker temporarily disabled for Figma publishing
// See main.backup.tsx for full version with PWA

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF
    
    echo "✅ Switched to Figma publishing mode"
    echo "💡 Now try publishing in Figma Make"
    echo "⚠️  Run './toggle-config.sh restore' when done to restore PWA features"
    
elif [ "$1" == "restore" ]; then
    echo "🔧 Restoring full PWA configuration..."
    
    # Restore from backups
    if [ -f "vite.config.pwa.backup.ts" ]; then
        cp vite.config.pwa.backup.ts vite.config.ts
        rm vite.config.pwa.backup.ts
        echo "✅ Restored vite.config.ts"
    fi
    
    if [ -f "src/main.pwa.backup.tsx" ]; then
        cp src/main.pwa.backup.tsx src/main.tsx
        rm src/main.pwa.backup.tsx
        echo "✅ Restored main.tsx with service worker"
    fi
    
    echo "✅ Full PWA configuration restored"
    echo "💡 Your production build will now include offline support"
    
else
    echo "Usage:"
    echo "  ./toggle-config.sh figma    - Switch to simplified config for Figma publishing"
    echo "  ./toggle-config.sh restore  - Restore full PWA configuration"
    echo ""
    echo "Current mode: $([ -f vite.config.pwa.backup.ts ] && echo 'Figma Publishing Mode' || echo 'Full PWA Mode')"
fi
