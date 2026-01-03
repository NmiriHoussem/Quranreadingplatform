import { Link } from 'react-router-dom';
import { Book, Users, Moon, Sun, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import ProfileMenu from './ProfileMenu';
import { getTranslations, getStoredLanguage, setStoredLanguage, type Language } from '../utils/translations';

interface AppHeaderProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
  onToggleDarkMode?: () => void;
}

export default function AppHeader({ isAuthenticated, onSignOut, onToggleDarkMode }: AppHeaderProps) {
  const language = getStoredLanguage();
  const t = getTranslations(language);
  
  const toggleLanguage = () => {
    const newLanguage: Language = language === 'en' ? 'ar' : 'en';
    setStoredLanguage(newLanguage);
    // Force page reload to apply new language
    window.location.reload();
  };
  
  return (
    <header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Book className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          <span className="text-2xl text-emerald-900 dark:text-emerald-100 hidden md:inline">{t.appName}</span>
          {!isAuthenticated && (
            <Badge variant="secondary" className="ml-2 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700">
              Guest
            </Badge>
          )}
        </Link>
        <div className="flex gap-2 items-center">
          {/* Language Toggle */}
          <Button 
            variant="outline" 
            size="icon"
            className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
            onClick={toggleLanguage}
            title={language === 'en' ? 'العربية' : 'English'}
          >
            <Globe className="w-4 h-4" />
          </Button>
          
          {onToggleDarkMode && (
            <Button 
              variant="outline" 
              size="icon"
              className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
              onClick={onToggleDarkMode}
            >
              {document.documentElement.classList.contains('dark') ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>
          )}
          <ProfileMenu isAuthenticated={isAuthenticated} onSignOut={onSignOut} />
        </div>
      </div>
    </header>
  );
}