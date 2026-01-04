import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import HomePage from './components/HomePage';
import ReadingDashboard from './components/ReadingDashboard';
import MemorizationDashboard from './components/MemorizationDashboard';
import QuranReader from './components/QuranReader';
import KhatmahReader from './components/KhatmahReader';
import GroupGoals from './components/GroupGoals';
import GroupGoalDetail from './components/GroupGoalDetail';
import Settings from './components/Settings';
import HelpPage from './components/HelpPage';
import DownloadQuran from './pages/DownloadQuran';
import AdminPanel from './components/AdminPanel';
import { useDarkMode } from './utils/useDarkMode';
import { getCurrentSession, signOut as authSignOut, refreshSession } from '../services/authService';
import { loadProgressFromServer, autoSyncProgress } from '../services/syncService';
import { setSyncTrigger } from './utils/localStorage';
import { getTranslations, getStoredLanguage } from './utils/translations';
import { initializeLogo, getCachedLogo } from './utils/logoStorage';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isDarkMode, toggleDarkMode } = useDarkMode(isAuthenticated);
  
  // Initialize logo from KV store
  useEffect(() => {
    initializeLogo().then(logoUrl => {
      // Update favicon with logo from KV store
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/svg+xml';
      link.rel = 'icon';
      link.href = logoUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }).catch(error => {
      console.error('Error initializing logo:', error);
    });
  }, []);
  
  // Set document title and meta description based on language
  useEffect(() => {
    const language = getStoredLanguage();
    const t = getTranslations(language);
    
    // Update document title
    document.title = t.appName;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', t.metaDescription);
    } else {
      // Create meta description if it doesn't exist
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = t.metaDescription;
      document.head.appendChild(meta);
    }
    
    // Update Open Graph tags for social sharing
    const updateOrCreateMetaTag = (property: string, content: string) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`);
      if (metaTag) {
        metaTag.setAttribute('content', content);
      } else {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('property', property);
        metaTag.setAttribute('content', content);
        document.head.appendChild(metaTag);
      }
    };
    
    updateOrCreateMetaTag('og:title', t.appName);
    updateOrCreateMetaTag('og:description', t.metaDescription);
    updateOrCreateMetaTag('og:type', 'website');
    updateOrCreateMetaTag('og:image', `${window.location.origin}/pwa-192x192.png`);
    updateOrCreateMetaTag('og:image:width', '192');
    updateOrCreateMetaTag('og:image:height', '192');
    updateOrCreateMetaTag('og:url', window.location.href);
    
    // Twitter Card tags
    const updateOrCreateTwitterTag = (name: string, content: string) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`);
      if (metaTag) {
        metaTag.setAttribute('content', content);
      } else {
        metaTag = document.createElement('meta');
        metaTag.setAttribute('name', name);
        metaTag.setAttribute('content', content);
        document.head.appendChild(metaTag);
      }
    };
    
    updateOrCreateTwitterTag('twitter:card', 'summary_large_image');
    updateOrCreateTwitterTag('twitter:title', t.appName);
    updateOrCreateTwitterTag('twitter:description', t.metaDescription);
    updateOrCreateTwitterTag('twitter:image', `${window.location.origin}/pwa-192x192.png`);
  }, []);
  
  // Set up sync trigger for localStorage changes
  useEffect(() => {
    if (isAuthenticated) {
      setSyncTrigger(() => {
        autoSyncProgress();
      });
    } else {
      setSyncTrigger(() => {});
    }
  }, [isAuthenticated]);
  
  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await getCurrentSession();
      setIsAuthenticated(session.isAuthenticated);
      
      if (session.isAuthenticated) {
        // Load progress from server when authenticated
        await loadProgressFromServer();
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async () => {
    setIsAuthenticated(true);
    // Progress is loaded in the Auth component
  };

  const handleSignOut = async () => {
    await authSignOut();
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-emerald-600 dark:text-emerald-400">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Main landing page for desktop */}
        <Route path="/" element={<LandingPage isAuthenticated={isAuthenticated} onSignOut={handleSignOut} />} />
        
        {/* Home page - main dashboard */}
        <Route 
          path="/home" 
          element={<HomePage isAuthenticated={isAuthenticated} onSignOut={handleSignOut} onToggleDarkMode={toggleDarkMode} />} 
        />
        
        {/* Auth */}
        <Route 
          path="/auth" 
          element={<Auth onAuthSuccess={handleAuth} />} 
        />
        
        {/* Legacy /dashboard route - redirect to /home */}
        <Route 
          path="/dashboard" 
          element={<Navigate to="/home" replace />} 
        />
        
        {/* Reading & Memorization Dashboards */}
        <Route 
          path="/reading-dashboard" 
          element={<ReadingDashboard isAuthenticated={isAuthenticated} onSignOut={handleSignOut} onToggleDarkMode={toggleDarkMode} />} 
        />
        <Route 
          path="/memorization-dashboard" 
          element={<MemorizationDashboard isAuthenticated={isAuthenticated} onSignOut={handleSignOut} onToggleDarkMode={toggleDarkMode} />} 
        />
        
        {/* Readers */}
        <Route 
          path="/reader" 
          element={<QuranReader isAuthenticated={isAuthenticated} onSignOut={handleSignOut} onToggleDarkMode={toggleDarkMode} />} 
        />
        <Route 
          path="/khatmah/:groupId" 
          element={<KhatmahReader isAuthenticated={isAuthenticated} onSignOut={handleSignOut} onToggleDarkMode={toggleDarkMode} />} 
        />
        
        {/* Groups */}
        <Route 
          path="/groups" 
          element={<GroupGoals isAuthenticated={isAuthenticated} onSignOut={handleSignOut} onToggleDarkMode={toggleDarkMode} />} 
        />
        <Route 
          path="/groups/:id" 
          element={<GroupGoalDetail isAuthenticated={isAuthenticated} onSignOut={handleSignOut} onToggleDarkMode={toggleDarkMode} />} 
        />
        
        {/* Settings & Help */}
        <Route 
          path="/settings" 
          element={<Settings isAuthenticated={isAuthenticated} onSignOut={handleSignOut} />} 
        />
        <Route 
          path="/help" 
          element={<HelpPage isAuthenticated={isAuthenticated} onSignOut={handleSignOut} />} 
        />
        <Route 
          path="/download" 
          element={<DownloadQuran isAuthenticated={isAuthenticated} onSignOut={handleSignOut} />} 
        />
        
        {/* Admin Panel */}
        <Route 
          path="/admin" 
          element={<AdminPanel isDarkMode={isDarkMode} />} 
        />
      </Routes>
    </Router>
  );
}

export default App;