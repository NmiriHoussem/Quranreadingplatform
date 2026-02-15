import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { getStoredLanguage } from '../utils/translations';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const language = getStoredLanguage();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('App is now online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('App is now offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] bg-amber-500 dark:bg-amber-600 text-white px-4 py-2 flex items-center justify-center gap-2 text-sm shadow-lg">
      <WifiOff className="w-4 h-4" />
      <span>
        {language === 'ar' 
          ? 'أنت غير متصل بالإنترنت - يمكنك الاستمرار في القراءة من المحتوى المحفوظ' 
          : 'You are offline - You can continue reading from cached content'}
      </span>
    </div>
  );
}
