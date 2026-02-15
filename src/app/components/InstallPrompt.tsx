import { useState, useEffect } from 'react';
import { X, Download, Share, Plus, Square } from 'lucide-react';
import { Button } from './ui/button';
import { getStoredLanguage, getTranslations } from '../utils/translations';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  onInstallSuccess?: () => void;
}

export default function InstallPrompt({ onInstallSuccess }: InstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  
  const language = getStoredLanguage();
  const t = getTranslations(language);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(standalone);

    // Detect platform - Enhanced iOS/iPadOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Additional iPadOS detection (iPadOS 13+ reports as Mac in Safari)
    const isIPadOS = (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) 
      || /macintosh/.test(userAgent) && 'ontouchend' in document;
    
    const isAndroid = /android/.test(userAgent);
    
    // Combine iOS detection
    const isIOS_or_iPadOS = isIOSDevice || isIPadOS;
    setIsIOS(isIOS_or_iPadOS);
    
    if (isIOS_or_iPadOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Listen for beforeinstallprompt (Android/Desktop Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if user has dismissed before
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    const neverShowAgain = localStorage.getItem('pwa-install-never');
    const dismissedThisSession = sessionStorage.getItem('pwa-install-dismissed-session');
    
    // Debug logging
    console.log('PWA Install Prompt - Debug Info:', {
      isStandalone: standalone,
      platform: isIOS_or_iPadOS ? 'iOS/iPadOS' : isAndroid ? 'Android' : 'Desktop',
      userAgent: userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
      navigatorPlatform: navigator.platform,
      isIOSDevice,
      isIPadOS,
      dismissedAt,
      neverShowAgain,
      dismissedThisSession,
      willShow: !standalone && !dismissedThisSession && neverShowAgain !== 'true'
    });
    
    if (neverShowAgain === 'true') {
      console.log('PWA Install: User selected "Never show again"');
      return;
    }

    // Show prompt immediately if not installed and not dismissed this session
    if (!standalone && !dismissedThisSession) {
      const timer = setTimeout(() => {
        if (!isIOS_or_iPadOS) {
          // For Android/Desktop, wait for beforeinstallprompt event
          // Don't show immediately, wait for the event
        } else {
          // For iOS/iPadOS, show instructional modal immediately
          console.log('PWA Install: Showing iOS/iPadOS install prompt');
          setShowPrompt(true);
        }
      }, 0); // Show immediately on visit

      return () => clearTimeout(timer);
    } else if (dismissedAt) {
      // If dismissed before, check if 7 days have passed
      const dismissedDate = new Date(dismissedAt);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissed >= 7) {
        localStorage.removeItem('pwa-install-dismissed');
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Auto-show prompt when deferredPrompt is available (Android/Desktop)
  useEffect(() => {
    if (deferredPrompt && !isStandalone) {
      const neverShowAgain = localStorage.getItem('pwa-install-never');
      const dismissedThisSession = sessionStorage.getItem('pwa-install-dismissed-session');
      
      if (!dismissedThisSession && neverShowAgain !== 'true') {
        const timer = setTimeout(() => {
          console.log('PWA Install: Showing Android/Desktop install prompt');
          setShowPrompt(true);
        }, 0); // Show immediately when deferredPrompt is available
        
        return () => clearTimeout(timer);
      }
    }
  }, [deferredPrompt, isStandalone]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show native install prompt
    deferredPrompt.prompt();
    
    // Wait for user choice
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
      onInstallSuccess?.();
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
    sessionStorage.setItem('pwa-install-dismissed-session', 'true');
  };

  const handleNeverShow = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-never', 'true');
  };

  // Public method to manually show the prompt (for menu item)
  const showManually = () => {
    setShowPrompt(true);
  };

  // Public method to reset install prompt state (for debugging)
  const resetInstallPrompt = () => {
    localStorage.removeItem('pwa-install-dismissed');
    localStorage.removeItem('pwa-install-never');
    console.log('PWA Install Prompt: State has been reset. Reload the page to see the prompt again.');
  };

  // Expose showManually and resetInstallPrompt to parent via global
  useEffect(() => {
    (window as any).showPWAInstallPrompt = showManually;
    (window as any).resetPWAInstallPrompt = resetInstallPrompt;
    return () => {
      delete (window as any).showPWAInstallPrompt;
      delete (window as any).resetPWAInstallPrompt;
    };
  }, []);

  // Don't show if already installed
  if (isStandalone) {
    return null;
  }

  // Don't show if prompt not visible
  if (!showPrompt) {
    return null;
  }

  // iOS Instructions Modal
  if (isIOS || platform === 'ios') {
    return (
      <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
        <div className="bg-white dark:bg-violet-950 rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-md md:mx-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom md:slide-in-from-bottom-0">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-violet-950 border-b border-violet-100 dark:border-violet-800 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'للوصول السريع' : 'For quick access'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Benefits */}
            <div className="space-y-3">
              <h4 className="font-semibold text-violet-900 dark:text-violet-100">
                {language === 'ar' ? 'لماذا تثبت التطبيق؟' : 'Why install the app?'}
              </h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 dark:text-violet-400 mt-0.5">✓</span>
                  <span>{language === 'ar' ? 'وصول فوري من الشاشة الرئيسية' : 'Instant access from home screen'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 dark:text-violet-400 mt-0.5">✓</span>
                  <span>{language === 'ar' ? 'يعمل بدون إنترنت' : 'Works offline'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-600 dark:text-violet-400 mt-0.5">✓</span>
                  <span>{language === 'ar' ? 'تجربة تطبيق أصلي كامل' : 'Full native app experience'}</span>
                </li>
              </ul>
            </div>

            {/* Instructions */}
            <div className="space-y-4">
              <h4 className="font-semibold text-violet-900 dark:text-violet-100">
                {language === 'ar' ? 'خطوات التثبيت:' : 'Installation steps:'}
              </h4>
              
              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-violet-600 dark:bg-violet-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-2">
                    {language === 'ar' 
                      ? 'اضغط على زر المشاركة' 
                      : 'Tap the Share button'}
                  </p>
                  <div className="bg-violet-50 dark:bg-violet-900/30 rounded-lg p-3 flex items-center justify-center gap-2">
                    <Share className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    <span className="text-sm text-violet-700 dark:text-violet-300 font-medium">
                      {language === 'ar' ? '(في أسفل المتصفح)' : '(at bottom of browser)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-violet-600 dark:bg-violet-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mb-2">
                    {language === 'ar' 
                      ? 'اختر "إضافة إلى الشاشة الرئيسية"' 
                      : 'Select "Add to Home Screen"'}
                  </p>
                  <div className="bg-violet-50 dark:bg-violet-900/30 rounded-lg p-3 flex items-center justify-center gap-2">
                    <Plus className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    <Square className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-violet-600 dark:bg-violet-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
                    {language === 'ar' 
                      ? 'اضغط "إضافة" للتأكيد' 
                      : 'Tap "Add" to confirm'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-violet-950 border-t border-violet-100 dark:border-violet-800 px-6 py-4 space-y-2">
            <Button
              onClick={handleDismiss}
              className="w-full bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white"
            >
              {language === 'ar' ? 'فهمت' : 'Got it'}
            </Button>
            <button
              onClick={handleNeverShow}
              className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-2"
            >
              {language === 'ar' ? 'لا تظهر هذا مرة أخرى' : "Don't show this again"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Android/Desktop One-Click Install Modal
  return (
    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-violet-950 rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-md md:mx-4 overflow-hidden animate-in slide-in-from-bottom md:slide-in-from-bottom-0">
        {/* Header with Icon */}
        <div className="bg-gradient-to-br from-violet-600 to-purple-600 px-6 py-8 text-center relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
          
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <Download className="w-10 h-10 text-violet-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">
            {language === 'ar' ? 'حلقة القرآن' : 'Quran Circle'}
          </h3>
          <p className="text-violet-100 text-sm">
            {language === 'ar' ? 'ثبّت التطبيق للوصول السريع' : 'Install app for quick access'}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="w-2 h-2 bg-violet-600 dark:bg-violet-400 rounded-full" />
              <span>{language === 'ar' ? 'وصول فوري من الشاشة الرئيسية' : 'Instant access from home screen'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="w-2 h-2 bg-violet-600 dark:bg-violet-400 rounded-full" />
              <span>{language === 'ar' ? 'يعمل بدون إنترنت' : 'Works offline'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="w-2 h-2 bg-violet-600 dark:bg-violet-400 rounded-full" />
              <span>{language === 'ar' ? 'تجربة تطبيق أصلي كامل' : 'Full native app experience'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
              <div className="w-2 h-2 bg-violet-600 dark:bg-violet-400 rounded-full" />
              <span>{language === 'ar' ? 'بدون إشعارات مزعجة' : 'No annoying notifications'}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-2">
          <Button
            onClick={handleInstall}
            className="w-full bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white h-12 text-base font-semibold"
          >
            <Download className="w-5 h-5 mr-2" />
            {language === 'ar' ? 'تثبيت الآن' : 'Install Now'}
          </Button>
          <button
            onClick={handleDismiss}
            className="w-full text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 py-2"
          >
            {language === 'ar' ? 'ربما لاحقاً' : 'Maybe Later'}
          </button>
          <button
            onClick={handleNeverShow}
            className="w-full text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 py-1"
          >
            {language === 'ar' ? 'لا تظهر هذا مرة أخرى' : "Don't show again"}
          </button>
        </div>
      </div>
    </div>
  );
}