import { Link } from 'react-router-dom';
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
    <div className="min-h-screen bg-[#F5F5F0] dark:bg-slate-900">
      {/* Header with Islamic arch design */}
      <div className="relative overflow-visible bg-[#0A5550] dark:bg-[#084440]">
        {/* Islamic geometric pattern background */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `repeating-linear-gradient(45deg, #D4A574 0px, #D4A574 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, #D4A574 0px, #D4A574 1px, transparent 1px, transparent 20px)`,
          backgroundSize: '20px 20px'
        }} />

        {/* Golden arch dome at top center */}
        <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10">
          <svg width="120" height="80" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Outer arch */}
            <path d="M60 10 Q30 10 15 35 Q10 45 10 55 L10 80 L110 80 L110 55 Q110 45 105 35 Q90 10 60 10 Z" fill="#D4A574" />
            {/* Inner arch */}
            <path d="M60 15 Q35 15 22 37 Q18 45 18 53 L18 80 L102 80 L102 53 Q102 45 98 37 Q85 15 60 15 Z" fill="#0A5550" />
            {/* Decorative dot */}
            <circle cx="60" cy="40" r="8" fill="#D4A574" stroke="#0A5550" strokeWidth="2" />
          </svg>
        </div>

        {/* Settings icon - top right */}
        <div className="absolute top-3 right-3 z-20">
          <button
            onClick={toggleLanguage}
            className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <Globe className="w-4 h-4" />
          </button>
        </div>

        {/* Header content */}
        <div className="relative px-6 pt-20 pb-10 text-center">
          {/* Hijri date with moon */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-xl">🌙</span>
            <span className="text-white text-sm">
              {hijriDate.formattedDate}
            </span>
          </div>

          {/* Greeting */}
          <h1 className="text-white text-2xl" style={{ fontFamily: 'var(--font-arabic, system-ui)', fontWeight: 500 }}>
            السلام عليكم
          </h1>
          {specialDay && (
            <p className="text-white/70 text-xs mt-1">{specialDay}</p>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 pb-20 max-w-sm mx-auto">
        {/* Quran card */}
        <div className="-mt-4 mb-3">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 text-center">
            {/* Quran icon */}
            <div className="flex justify-center mb-3">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Book spine */}
                <rect x="10" y="8" width="8" height="64" rx="2" fill="#D4A574" />
                {/* Book cover */}
                <rect x="18" y="8" width="52" height="64" rx="3" fill="#0A5550" />
                {/* Cover border */}
                <rect x="22" y="12" width="44" height="56" rx="2" fill="none" stroke="#D4A574" strokeWidth="1.5" />
                {/* Inner border */}
                <rect x="25" y="15" width="38" height="50" rx="1" fill="none" stroke="#D4A574" strokeWidth="0.75" opacity="0.6" />
                {/* Arabic decoration: بسم */}
                <text x="44" y="38" textAnchor="middle" fontFamily="serif" fontSize="11" fill="#D4A574">بِسْمِ</text>
                <text x="44" y="51" textAnchor="middle" fontFamily="serif" fontSize="9" fill="#D4A574" opacity="0.8">اللهِ</text>
                {/* Top corner ornaments */}
                <circle cx="28" cy="18" r="2" fill="#D4A574" opacity="0.7" />
                <circle cx="60" cy="18" r="2" fill="#D4A574" opacity="0.7" />
                <circle cx="28" cy="62" r="2" fill="#D4A574" opacity="0.7" />
                <circle cx="60" cy="62" r="2" fill="#D4A574" opacity="0.7" />
              </svg>
            </div>

            {/* Title */}
            <h2 className="text-slate-900 dark:text-slate-100 text-xl mb-1" style={{ fontFamily: 'var(--font-arabic, system-ui)', fontWeight: 600 }}>
              القرآن الكريم
            </h2>

            {/* Subtitle */}
            <p className="text-slate-500 dark:text-slate-400 text-sm" style={{ fontFamily: 'var(--font-arabic, system-ui)' }}>
              اختم ختمة مع القرآن
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-2">
          {/* حلقاتي */}
          <Link to="/reading-dashboard">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-3.5 flex items-center justify-between hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
                <span className="text-slate-800 dark:text-slate-100 text-base" style={{ fontFamily: 'var(--font-arabic, system-ui)' }}>
                  ختماتي الخاصة
                </span>
              </div>
              {khatmahCount > 0 && (
                <span className="bg-[#FFF3E0] text-[#F59E0B] text-xs px-2.5 py-0.5 rounded-full" style={{ fontFamily: 'var(--font-arabic, system-ui)' }}>
                  جديد
                </span>
              )}
            </div>
          </Link>

          {/* حلقات */}
          <Link to="/groups">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-3.5 flex items-center justify-between hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
                <span className="text-slate-800 dark:text-slate-100 text-base" style={{ fontFamily: 'var(--font-arabic, system-ui)' }}>
                  ختمات جماعية
                </span>
              </div>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
          </Link>

          {/* حفظ القرآن */}
          <Link to="/memorization-dashboard">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-3.5 flex items-center justify-between hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <ChevronRight className="w-4 h-4 text-slate-400 rotate-180" />
                <span className="text-slate-800 dark:text-slate-100 text-base" style={{ fontFamily: 'var(--font-arabic, system-ui)' }}>
                  حفظ القرآن
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-40 safe-area-inset-bottom">
        <div className="flex justify-around items-center px-8 py-2.5">
          {/* حلقات المتحدثين */}
          <Link to="/groups" className="flex flex-col items-center gap-0.5 py-1.5 min-w-[80px]">
            <Users className="w-5 h-5 text-[#D4A574]" />
            <span className="text-[10px] text-[#D4A574]" style={{ fontFamily: 'var(--font-arabic, system-ui)' }}>
              حلقات المتحدثين
            </span>
          </Link>

          {/* الصفحة الرئيسية */}
          <div className="flex flex-col items-center gap-0.5 py-1.5 min-w-[80px]">
            <div className="w-5 h-5 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500" />
            </div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400" style={{ fontFamily: 'var(--font-arabic, system-ui)' }}>
              الصفحة الرئيسية
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}