import { Link } from 'react-router-dom';
import { ArrowLeft, Download, CheckCircle, AlertCircle, Loader2, HardDrive, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import OfflineDownloadManager from '../components/OfflineDownloadManager';
import ProfileMenu from '../components/ProfileMenu';
import { getTranslations, getStoredLanguage } from '../utils/translations';

interface DownloadQuranProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
}

type DownloadMode = 'text' | 'images' | 'both';

export default function DownloadQuran({ isAuthenticated, onSignOut }: DownloadQuranProps) {
  const language = getStoredLanguage();
  const t = getTranslations(language);
  const [downloadMode, setDownloadMode] = useState<DownloadMode>('text');

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900">
      {/* Header */}
      <header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="hover:bg-emerald-50 dark:hover:bg-emerald-900">
                <ArrowLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </Button>
            </Link>
            <h1 className="text-xl md:text-2xl text-emerald-900 dark:text-emerald-100">
              {language === 'ar' ? 'تحميل القرآن' : 'Download Quran'}
            </h1>
          </div>
          <ProfileMenu isAuthenticated={isAuthenticated} onSignOut={onSignOut} />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl text-emerald-900 dark:text-emerald-100">
                {t.offlineReading || 'Offline Reading'}
              </h2>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {language === 'ar' ? 'اقرأ القرآن في أي وقت ومن أي مكان' : 'Read the Quran anytime, anywhere'}
              </p>
            </div>
          </div>
          
          <p className="text-emerald-700 dark:text-emerald-300 mb-4">
            {t.offlineReadingDescription || 'Download surahs to read them offline anytime, anywhere. Perfect for travel, mosques, or areas with limited internet.'}
          </p>
        </div>

        {/* Download Type Options */}
        <Card className="p-6 mb-6 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-950/50">
          <h3 className="text-lg font-medium text-emerald-900 dark:text-emerald-100 mb-4">
            {language === 'ar' ? 'اختر نوع التحميل' : 'Choose Download Type'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Text Version */}
            <button
              onClick={() => setDownloadMode('text')}
              className={`border-2 rounded-lg p-4 transition-all text-left ${
                downloadMode === 'text'
                  ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/50 shadow-lg'
                  : 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className={`w-6 h-6 ${
                  downloadMode === 'text' 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : 'text-emerald-600 dark:text-emerald-400'
                }`} />
                <h4 className={`font-medium ${
                  downloadMode === 'text'
                    ? 'text-emerald-900 dark:text-emerald-100'
                    : 'text-emerald-900 dark:text-emerald-100'
                }`}>
                  {language === 'ar' ? 'النص فقط' : 'Text Only'}
                </h4>
              </div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">
                {language === 'ar' 
                  ? 'تحميل النص العربي للآيات فقط. حجم صغير، سريع التحميل.' 
                  : 'Download Arabic text of verses only. Small size, fast download.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-500 dark:text-emerald-400">
                <Download className="w-4 h-4" />
                <span>{language === 'ar' ? '~5 ميجابايت' : '~5 MB'}</span>
              </div>
            </button>

            {/* Image Version */}
            <button
              onClick={() => setDownloadMode('images')}
              className={`border-2 rounded-lg p-4 transition-all text-left ${
                downloadMode === 'images'
                  ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/50 shadow-lg'
                  : 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className={`w-6 h-6 ${
                  downloadMode === 'images' 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : 'text-emerald-600 dark:text-emerald-400'
                }`} />
                <h4 className={`font-medium ${
                  downloadMode === 'images'
                    ? 'text-emerald-900 dark:text-emerald-100'
                    : 'text-emerald-900 dark:text-emerald-100'
                }`}>
                  {language === 'ar' ? 'صور المصحف' : 'Images Only'}
                </h4>
              </div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">
                {language === 'ar' 
                  ? 'تحميل صور صفحات المصحف الشريف. تجربة قراءة تقليدية أصيلة.' 
                  : 'Download Mushaf page images. Authentic traditional reading experience.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-500 dark:text-emerald-400">
                <Download className="w-4 h-4" />
                <span>{language === 'ar' ? '~150 ميجابايت' : '~150 MB'}</span>
              </div>
            </button>

            {/* Both Version */}
            <button
              onClick={() => setDownloadMode('both')}
              className={`border-2 rounded-lg p-4 transition-all text-left ${
                downloadMode === 'both'
                  ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-900/50 shadow-lg'
                  : 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <HardDrive className={`w-6 h-6 ${
                  downloadMode === 'both' 
                    ? 'text-emerald-700 dark:text-emerald-300' 
                    : 'text-emerald-600 dark:text-emerald-400'
                }`} />
                <h4 className={`font-medium ${
                  downloadMode === 'both'
                    ? 'text-emerald-900 dark:text-emerald-100'
                    : 'text-emerald-900 dark:text-emerald-100'
                }`}>
                  {language === 'ar' ? 'كلاهما' : 'Both'}
                </h4>
              </div>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">
                {language === 'ar' 
                  ? 'تحميل النص والصور معاً. أفضل تجربة دون اتصال.' 
                  : 'Download both text and images. Best offline experience.'}
              </p>
              <div className="flex items-center gap-2 text-xs text-emerald-500 dark:text-emerald-400">
                <Download className="w-4 h-4" />
                <span>{language === 'ar' ? '~155 ميجابايت' : '~155 MB'}</span>
              </div>
            </button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              <strong>{language === 'ar' ? 'للاستخدام دون اتصال:' : 'For Offline Use:'}</strong>
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>{language === 'ar' ? 'اختر السور التي تريد تحميلها أدناه' : 'Select surahs you want to download below'}</li>
              <li>{language === 'ar' ? 'النص يتم تحميله تلقائياً للقراءة دون اتصال' : 'Text is automatically downloaded for offline reading'}</li>
              <li>{language === 'ar' ? 'صور المصحف تُحفظ في ذاكرة المتصفح المؤقتة' : 'Mushaf images are cached in browser storage'}</li>
              <li>{language === 'ar' ? 'مثالي للسفر، المساجد، أو المناطق ذات الاتصال المحدود' : 'Perfect for travel, mosques, or limited internet areas'}</li>
            </ul>
          </div>
        </Card>

        {/* Offline Download Manager */}
        <Card className="p-6 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-950/50">
          <OfflineDownloadManager />
        </Card>
      </div>
    </div>
  );
}