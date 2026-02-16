import { Link } from 'react-router';
import { Book, Brain, ChevronRight, Users, Target, Moon, Sun, Globe, Smartphone } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { getJoinedGroups, getKhatmahReadingStats, getJoinedMemorizationGroups, getSurahMemorizationStats, getCurrentKhatmah, calculateKhatmahMilestonesForGroup } from '../utils/localStorage';
import { getSurahByNumber } from '../utils/surahs';
import ProfileMenu from './ProfileMenu';
import { getTranslations, getStoredLanguage, setStoredLanguage, type Language } from '../utils/translations';
import Logo from './Logo';
import { useState, useEffect } from 'react';
import { getHijriDate, getSpecialIslamicDay } from '../utils/hijriDate';

interface HomePageProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
  onToggleDarkMode?: () => void;
}

export default function HomePage({ isAuthenticated, onSignOut, onToggleDarkMode }: HomePageProps) {
  const language = getStoredLanguage();
  const t = getTranslations(language);
  
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  const toggleLanguage = () => {
    const newLanguage: Language = language === 'en' ? 'ar' : 'en';
    setStoredLanguage(newLanguage);
    window.location.reload();
  };

  // Check if app is installed and if device is a tablet
  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    // Detect tablet (screen width between 768px and 1024px)
    const checkIfTablet = () => {
      const width = window.innerWidth;
      return width >= 768 && width <= 1024;
    };
    
    setIsTablet(checkIfTablet());
    setShowInstallButton(!isStandalone);
    
    // Listen for resize to update tablet detection
    const handleResize = () => {
      setIsTablet(checkIfTablet());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleInstallClick = () => {
    // Trigger the global PWA install prompt
    if ((window as any).showPWAInstallPrompt) {
      (window as any).showPWAInstallPrompt();
    }
  };

  // Calculate Reading (Khatmah) Stats
  const joinedGroups = getJoinedGroups();
  const currentKhatmah = getCurrentKhatmah();
  const khatmahCount = joinedGroups.length;
  
  let totalPagesRead = 0;
  let totalPagesGoal = 0;
  joinedGroups.forEach(groupId => {
    const stats = getKhatmahReadingStats(groupId);
    if (stats) {
      totalPagesRead += stats.pagesRead;
      totalPagesGoal += 604; // Each khatmah is 604 pages
    }
  });
  
  const readingProgress = totalPagesGoal > 0 ? Math.round((totalPagesRead / totalPagesGoal) * 100) : 0;
  
  // Get current khatmah details
  const currentKhatmahStats = currentKhatmah ? getKhatmahReadingStats(currentKhatmah) : null;
  const currentKhatmahTitle = currentKhatmah ? (() => {
    const days = parseInt(currentKhatmah.split('-')[1]);
    return language === 'ar' ? `ختمة ${days} يوم` : `${days}-Day Khatmah`;
  })() : null;
  
  // Calculate completed days for current khatmah
  const currentKhatmahDays = currentKhatmah ? parseInt(currentKhatmah.split('-')[1]) : 0;
  const currentKhatmahMilestones = currentKhatmah ? calculateKhatmahMilestonesForGroup(currentKhatmah, currentKhatmahDays) : [];
  const completedDays = currentKhatmahMilestones.filter(m => m.completed).length;

  // Calculate Memorization Stats
  const memorizationGroups = getJoinedMemorizationGroups();
  const memorizationCount = memorizationGroups.length;
  
  let totalMemorized = 0;
  let totalNeedReview = 0;
  let totalAyahsGoal = 0;
  let surahsWithProgress = 0;
  
  memorizationGroups.forEach(groupId => {
    const surahNumber = parseInt(groupId.split('-')[1]);
    const surahData = getSurahByNumber(surahNumber);
    if (surahData) {
      const stats = getSurahMemorizationStats(surahNumber, surahData.verses);
      totalMemorized += stats.ayahsMemorized;
      totalNeedReview += stats.needsReview;
      totalAyahsGoal += surahData.verses;
      if (stats.ayahsMemorized > 0) {
        surahsWithProgress++;
      }
    }
  });
  
  const memorizationProgress = totalAyahsGoal > 0 ? Math.round((totalMemorized / totalAyahsGoal) * 100) : 0;

  // Get Hijri date
  const hijriDate = getHijriDate(language);
  const specialDay = getSpecialIslamicDay(language);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900">
      {/* Header */}
      <header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span className="text-2xl text-emerald-900 dark:text-emerald-100">{t.appName}</span>
          </div>
          <div className="flex gap-2 items-center">
            {/* Install Button - Show on tablets when app not installed */}
            {showInstallButton && isTablet && (
              <Button 
                variant="outline"
                className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 gap-2"
                onClick={handleInstallClick}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {language === 'ar' ? 'تثبيت التطبيق' : 'Install App'}
                </span>
              </Button>
            )}
            
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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Welcome Message */}
        <div className="text-center mb-12">
          {/* Hijri Date */}
          <div className="mb-5">
            <p className="text-sm md:text-base text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2">
              <span className="text-lg">🌙</span>
              <span>{hijriDate.formattedDate}</span>
            </p>
            {/* Special Day Indicator */}
            {specialDay && (
              <p className="text-xs md:text-sm text-emerald-700 dark:text-emerald-300 mt-1 font-medium">
                ✨ {specialDay}
              </p>
            )}
          </div>
          
          {/* Greeting */}
          <h1 className="text-4xl md:text-5xl text-emerald-900 dark:text-emerald-100 mb-3">
            {language === 'ar' ? 'السلام عليكم' : 'As-salāmu ʿalaykum'}
          </h1>
          <p className="text-emerald-700 dark:text-emerald-300">
            {language === 'ar' ? 'اختر رحلتك مع القرآن' : 'Choose your journey with the Quran'}
          </p>
        </div>

        {/* Two Main Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Reading Card */}
          <Link to="/reading-dashboard" className="block group">
            <Card className="p-8 border-2 border-emerald-100 dark:border-emerald-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-xl dark:bg-emerald-950/50 h-full">
              <div className="flex flex-col h-full">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Book className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl text-emerald-900 dark:text-emerald-100 mb-3">
                  {language === 'ar' ? 'حلقات قراءة القرآن' : 'Reading (Khatmah)'}
                </h2>

                {/* Description */}
                <p className="text-emerald-700 dark:text-emerald-300 mb-6 flex-grow">
                  {language === 'ar' 
                    ? 'اختم القرآن مع الآخرين في رحلة جماعية' 
                    : 'Complete the Quran together in a collective journey'}
                </p>

                {/* Stats */}
                {khatmahCount > 0 ? (
                  <div className="space-y-3 mb-6">
                    {/* Current Khatmah Name */}
                    {currentKhatmahTitle && (
                      <div className="text-emerald-900 dark:text-emerald-100 font-medium mb-2">
                        {currentKhatmahTitle}
                      </div>
                    )}
                    
                    {/* Current Khatmah Progress */}
                    {currentKhatmahStats && (
                      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                        <Book className="w-4 h-4" />
                        <span>
                          {currentKhatmahStats.pagesRead}/{currentKhatmahStats.totalPages} {language === 'ar' ? 'صفحة' : 'pages'}
                        </span>
                      </div>
                    )}
                    
                    {/* Days Completed - always show if there's a current khatmah */}
                    {currentKhatmah && (
                      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                        <Target className="w-4 h-4" />
                        <span>
                          {completedDays}/{currentKhatmahDays} {language === 'ar' ? 'أيام مكتملة' : 'days completed'}
                        </span>
                      </div>
                    )}
                    
                    {/* Progress Bar */}
                    {currentKhatmahStats && (
                      <div className="w-full bg-emerald-100 dark:bg-emerald-900 rounded-full h-2 mt-2">
                        <div 
                          className="bg-emerald-600 dark:bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${currentKhatmahStats.percentComplete}%` }}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-emerald-600 dark:text-emerald-400 mb-6">
                    {language === 'ar' ? 'لم تنضم إلى أي ختمة بعد' : 'No active khatmahs yet'}
                  </div>
                )}

                {/* CTA */}
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 group-hover:gap-3 transition-all">
                  <span>{language === 'ar' ? 'افتح لوحة القراءة' : 'Open Reading Dashboard'}</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </Link>

          {/* Memorization Card */}
          <Link to="/memorization-dashboard" className="block group">
            <Card className="p-8 border-2 border-purple-100 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-all duration-300 hover:shadow-xl dark:bg-purple-950/30 h-full">
              <div className="flex flex-col h-full">
                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-8 h-8 text-white" />
                </div>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl text-purple-900 dark:text-purple-100 mb-3">
                  {language === 'ar' ? 'حلقات حفظ القرآن' : 'Memorization'}
                </h2>

                {/* Description */}
                <p className="text-purple-700 dark:text-purple-300 mb-6 flex-grow">
                  {language === 'ar' 
                    ? 'تتبع رحلة حفظك للقرآن الكريم' 
                    : 'Track your Quran memorization journey'}
                </p>

                {/* Stats */}
                {memorizationCount > 0 ? (
                  <div className="space-y-3 mb-6">
                    {/* Memorization Progress Text */}
                    <div className="text-purple-900 dark:text-purple-100 font-medium">
                      {language === 'ar' 
                        ? `تم حفظ ${surahsWithProgress} سورة | ${totalMemorized} آية` 
                        : `Memorized ${surahsWithProgress} surahs | ${totalMemorized} ayahs`}
                    </div>
                    
                    {/* Progress compared to all Quran */}
                    <div className="text-sm text-purple-600 dark:text-purple-400">
                      {totalMemorized}/6236 {language === 'ar' ? 'آيات القرآن' : 'ayahs of Quran'} ({Math.round((totalMemorized / 6236) * 100)}%)
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-purple-100 dark:bg-purple-900 rounded-full h-2">
                      <div 
                        className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((totalMemorized / 6236) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-purple-600 dark:text-purple-400 mb-6">
                    {language === 'ar' ? 'لم تنضم إلى أي حلقة حفظ بعد' : 'No memorization circles yet'}
                  </div>
                )}

                {/* CTA */}
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 group-hover:gap-3 transition-all">
                  <span>{language === 'ar' ? 'افتح لوحة الحفظ' : 'Open Memorization Dashboard'}</span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Quick Start Guide (for new users) */}
        {khatmahCount === 0 && memorizationCount === 0 && (
          <div className="mt-12 text-center">
            <p className="text-emerald-700 dark:text-emerald-300 mb-4">
              {language === 'ar' 
                ? '👆 اختر واحدة من الأعلى للبدء في رحلتك مع القرآن' 
                : '👆 Choose one above to start your Quran journey'}
            </p>
            <div className="inline-block p-4 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {language === 'ar' 
                  ? '💡 نصيحة: يمكنك الانضمام إلى ختمة واحدة ومجموعات حفظ متعددة' 
                  : '💡 Tip: You can join one khatmah and multiple memorization groups'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}