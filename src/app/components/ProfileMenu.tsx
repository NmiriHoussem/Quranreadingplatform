import { Link } from 'react-router-dom';
import { User, Settings, HelpCircle, LogOut, LogIn, CheckCircle2, Globe, BookOpen, Type, Download, Shield, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from './ui/sheet';
import { Separator } from './ui/separator';
import { useEffect, useState } from 'react';
import { getTranslations, getStoredLanguage } from '../utils/translations';
import { getMushafViewMode, setMushafViewMode, type MushafViewMode } from '../../services/preferenceService';

const ADMIN_EMAIL = 'houssem.addin@gmail.com';

interface ProfileMenuProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
  mode?: 'reading' | 'memorization'; // Add mode prop to determine color scheme
}

export default function ProfileMenu({ isAuthenticated, onSignOut, mode = 'reading' }: ProfileMenuProps) {
  const language = getStoredLanguage();
  const t = getTranslations(language);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mushafMode, setMushafMode] = useState<MushafViewMode>('mushaf');
  const [isOpen, setIsOpen] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const authUser = localStorage.getItem('auth_user');
        if (authUser) {
          const user = JSON.parse(authUser);
          setUserName(user.name || null);
          setUserEmail(user.email || null);
        }
      } catch (error) {
        console.error('Error reading user from localStorage:', error);
      }
    } else {
      setUserName(null);
      setUserEmail(null);
    }
    
    // Load mushaf view mode preference
    const currentMode = getMushafViewMode();
    setMushafMode(currentMode);
    
    // Check if app is already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    // Show install button only if NOT installed
    setShowInstallButton(!isStandalone);
  }, [isAuthenticated]);
  
  // Get first letter of name for avatar
  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : 'U';
  
  // Check if user is admin
  const isAdmin = userEmail === ADMIN_EMAIL;
  
  // Color scheme based on mode
  const colors = mode === 'memorization' ? {
    border: 'border-purple-500 dark:border-purple-400',
    borderHover: 'hover:border-purple-600 dark:hover:border-purple-300',
    borderUnauthenticated: 'border-purple-200 dark:border-purple-700',
    borderHoverUnauthenticated: 'hover:border-purple-400 dark:hover:border-purple-500',
    bg: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-500',
    checkmark: 'text-purple-600 dark:text-purple-400',
    buttonBorder: 'border-purple-600 dark:border-purple-500',
    buttonText: 'text-purple-600 dark:text-purple-400',
    buttonHover: 'hover:bg-purple-50 dark:hover:bg-purple-900',
    buttonActive: 'bg-purple-600 hover:bg-purple-700',
    iconColor: 'text-purple-600 dark:text-purple-400',
  } : {
    border: 'border-emerald-500 dark:border-emerald-400',
    borderHover: 'hover:border-emerald-600 dark:hover:border-emerald-300',
    borderUnauthenticated: 'border-emerald-200 dark:border-emerald-700',
    borderHoverUnauthenticated: 'hover:border-emerald-400 dark:hover:border-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900',
    text: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-500',
    checkmark: 'text-emerald-600 dark:text-emerald-400',
    buttonBorder: 'border-emerald-600 dark:border-emerald-500',
    buttonText: 'text-emerald-600 dark:text-emerald-400',
    buttonHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900',
    buttonActive: 'bg-emerald-600 hover:bg-emerald-700',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  };
  
  const handleMushafModeChange = async (mode: MushafViewMode) => {
    setMushafMode(mode);
    await setMushafViewMode(mode);
    
    // Trigger a custom event to notify other components
    window.dispatchEvent(new CustomEvent('mushafModeChanged', { detail: { mode } }));
  };
  
  const handleInstallClick = () => {
    setIsOpen(false);
    // Trigger the global PWA install prompt
    if ((window as any).showPWAInstallPrompt) {
      (window as any).showPWAInstallPrompt();
    }
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative rounded-full border-2 h-11 w-11 md:h-10 md:w-10 ${
            isAuthenticated 
              ? `${colors.border} ${colors.borderHover} ${colors.bg}` 
              : `${colors.borderUnauthenticated} ${colors.borderHoverUnauthenticated}`
          }`}
        >
          {isAuthenticated ? (
            <>
              {/* Avatar with first letter */}
              <span className={colors.text + ' font-semibold'}>
                {avatarLetter}
              </span>
              {/* Checkmark badge */}
              <span className={`absolute -top-1 -right-1 ${colors.badgeBg} rounded-full p-0.5`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
              </span>
            </>
          ) : (
            <User className={`w-6 h-6 md:w-5 md:h-5 ${colors.iconColor}`} />
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side={language === 'ar' ? 'left' : 'right'} className="w-80">
        <SheetHeader className="text-left">
          <SheetTitle className="text-xl">
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-500 dark:border-emerald-400 bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-lg">
                    {avatarLetter}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>{userName || t.myAccount}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-normal mt-0.5">
                    {t.connected}
                  </p>
                </div>
              </div>
            ) : (
              t.guestMode
            )}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {isAuthenticated ? 'Manage your account settings and preferences' : 'Sign in to access more features'}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 mt-6 space-y-2">
          {!isAuthenticated && (
            <>
              <Link to="/auth" onClick={() => setIsOpen(false)}>
                <Button variant="outline" className="w-full justify-start border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900">
                  <LogIn className="w-5 h-5 mr-3" />
                  {t.signInSignUp}
                </Button>
              </Link>
              <Separator className="my-4" />
            </>
          )}
          
          {/* Reading Preferences Section */}
          <div className="space-y-3 py-3">
            <h3 className="text-sm font-medium text-muted-foreground px-2">{t.readingPreferences}</h3>
            
            {/* Mushaf Version Toggle */}
            <div className="space-y-2">
              <div className="px-2">
                <p className="text-sm font-medium">{t.mushafVersion}</p>
                <p className="text-xs text-muted-foreground">{t.mushafVersionDescription}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-2 px-2">
                <Button
                  variant={mushafMode === 'mushaf' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleMushafModeChange('mushaf')}
                  className={`${mushafMode === 'mushaf' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900'} whitespace-nowrap text-xs`}
                >
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  {language === 'ar' ? 'مصحف المدينة' : 'Madinah Mushaf'}
                </Button>
                
                <Button
                  variant={mushafMode === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleMushafModeChange('text')}
                  className={`${mushafMode === 'text' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-600 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900'} whitespace-nowrap text-xs`}
                >
                  <Type className="w-4 h-4 mr-1.5" />
                  {t.mushafTextMode}
                </Button>
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <Link to="/download" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full justify-start hover:bg-emerald-50 dark:hover:bg-emerald-900">
              <Download className="w-5 h-5 mr-3" />
              {language === 'ar' ? 'تحميل القرآن' : 'Download Quran'}
            </Button>
          </Link>
          
          {/* Install App Button - Only visible if not installed */}
          {showInstallButton && (
            <Button
              variant="outline"
              className="w-full justify-start border-violet-600 dark:border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900"
              onClick={handleInstallClick}
            >
              <Smartphone className="w-5 h-5 mr-3" />
              {language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
            </Button>
          )}
          
          <Link to="/settings" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full justify-start hover:bg-emerald-50 dark:hover:bg-emerald-900">
              <Settings className="w-5 h-5 mr-3" />
              {t.settings}
            </Button>
          </Link>
          
          <Link to="/help" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full justify-start hover:bg-emerald-50 dark:hover:bg-emerald-900">
              <HelpCircle className="w-5 h-5 mr-3" />
              {t.helpAndAbout}
            </Button>
          </Link>
          
          <Link to="/" onClick={() => setIsOpen(false)}>
            <Button variant="ghost" className="w-full justify-start hover:bg-emerald-50 dark:hover:bg-emerald-900">
              <Globe className="w-5 h-5 mr-3" />
              {t.officialWebsite}
            </Button>
          </Link>
          
          {/* Admin Panel - Only visible to admin */}
          {isAdmin && (
            <>
              <Separator className="my-4" />
              <Link to="/admin" onClick={() => setIsOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950">
                  <Shield className="w-5 h-5 mr-3" />
                  {language === 'ar' ? 'لوحة الإدارة' : 'Admin Panel'}
                </Button>
              </Link>
            </>
          )}
          
          {isAuthenticated && (
            <>
              <Separator className="my-4" />
              <Button 
                variant="ghost" 
                className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
              >
                <LogOut className="w-5 h-5 mr-3" />
                {t.signOut}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}