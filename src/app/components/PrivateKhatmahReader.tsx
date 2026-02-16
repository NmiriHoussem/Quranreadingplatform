import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router';
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Loader2, Check, Users, Moon, Sun, BookOpen, Type } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { getVersesByPage, getChapter, getChapters, getMushafPageImageUrl, Verse, Chapter } from '../../services/quranApi';
import { motion } from 'motion/react';
import { 
  isMemberOfGroup, 
  isPrivateKhatmahPageRead, 
  markPrivateKhatmahPageAsRead,
  getPrivateKhatmahReadingStats,
  getPrivateKhatmahProgressData,
  calculatePrivateKhatmahMilestones,
  getUserData,
  restorePrivateKhatmahProgressFromDB
} from '../utils/localStorage';
import { syncMemberProgress } from '../../services/privateKhatmahService';
import { getPrivateKhatmahById, loadProgressFromDatabase } from '../../services/privateKhatmahService';
import { updatePresence, getActiveReaders } from '../../services/presenceService';
import { getOrCreateSessionId } from '../utils/sessionId';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { getTranslations, getStoredLanguage } from '../utils/translations';
import { getMushafViewMode, setMushafViewMode, type MushafViewMode } from '../../services/preferenceService';

interface PrivateKhatmahReaderProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
  onToggleDarkMode?: () => void;
}

interface Milestone {
  day: number;
  startPage: number;
  endPage: number;
  totalPages: number;
  completed: boolean;
  title: string;
  description: string;
}

export default function PrivateKhatmahReader({ isAuthenticated, onSignOut, onToggleDarkMode }: PrivateKhatmahReaderProps) {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const translations = getTranslations(getStoredLanguage());
  const language = getStoredLanguage();
  
  const [currentPage, setCurrentPage] = useState(() => {
    // Load saved page - SHARED across all private khatmahs
    const savedPage = localStorage.getItem(`private-khatmah-currentPage`);
    if (!savedPage || savedPage.trim() === '' || savedPage === 'undefined' || savedPage === 'null') {
      localStorage.setItem(`private-khatmah-currentPage`, '1');
      return 1;
    }
    const page = parseInt(savedPage, 10);
    if (isNaN(page) || page < 1 || page > 604) {
      localStorage.setItem(`private-khatmah-currentPage`, '1');
      return 1;
    }
    return page;
  });
  
  const [verses, setVerses] = useState<Verse[]>([]);
  const [chapterInfo, setChapterInfo] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [khatmahDays, setKhatmahDays] = useState(0);
  const [khatmahTitle, setKhatmahTitle] = useState('');
  const [khatmahName, setKhatmahName] = useState('');

  // Touch/swipe state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false);

  // Header hide/show on scroll
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // Track time spent on page for auto-marking
  const pageEntryTime = useRef<number>(Date.now());
  const MIN_READ_TIME = 15000; // 15 seconds

  // Track if current page is marked as read
  const [pageReadStatus, setPageReadStatus] = useState(false);

  // Night mode
  const [nightMode, setNightMode] = useState(() => {
    const saved = localStorage.getItem('quranNightMode');
    return saved === 'true';
  });

  // Active readers presence
  const [activeReaders, setActiveReaders] = useState(0);
  const [showPresenceAnimation, setShowPresenceAnimation] = useState(false);

  // Mushaf view mode (image vs text)
  const [viewMode, setViewMode] = useState<MushafViewMode>('mushaf');

  // Image loading state
  const [imageLoading, setImageLoading] = useState(true);

  // Listen for mushaf mode changes from ProfileMenu
  useEffect(() => {
    const handleMushafModeChange = (event: CustomEvent<{ mode: MushafViewMode }>) => {
      setViewMode(event.detail.mode);
    };
    
    // Load initial mode
    setViewMode(getMushafViewMode());
    
    window.addEventListener('mushafModeChanged', handleMushafModeChange as EventListener);
    
    return () => {
      window.removeEventListener('mushafModeChanged', handleMushafModeChange as EventListener);
    };
  }, []);

  // Check authentication and membership
  useEffect(() => {
    // Check if user has joined this private khatmah group
    if (!groupId || !isMemberOfGroup(groupId)) {
      navigate(`/reading`);
      return;
    }

    // Load private khatmah data from Supabase
    const loadKhatmahData = async () => {
      if (!groupId) return;
      
      // Get current local progress before loading from database
      const localProgressBeforeLoad = getPrivateKhatmahProgressData();
      const hasLocalProgress = Object.keys(localProgressBeforeLoad.pagesRead || {}).length > 0;
      
      console.log('📊 Local progress before DB load:', {
        pagesCount: Object.keys(localProgressBeforeLoad.pagesRead || {}).length,
        percentComplete: localProgressBeforeLoad.percentComplete
      });
      
      // Load progress from database FIRST
      const { progress, error: progressError } = await loadProgressFromDatabase(groupId);
      const hasDbProgress = progress && Object.keys(progress.pagesRead || {}).length > 0;
      
      if (progress && !progressError && hasDbProgress) {
        console.log('📥 Loading progress from database...');
        restorePrivateKhatmahProgressFromDB(progress);
      } else if (progressError) {
        console.warn('⚠️ Could not load progress from database:', progressError);
      } else if (hasLocalProgress && !hasDbProgress) {
        // Database has no progress, but localStorage does - sync local to database
        console.log('📤 Database has no progress, syncing local progress to database...');
        await syncMemberProgress(groupId, localProgressBeforeLoad);
      }
      
      const { khatmah, error } = await getPrivateKhatmahById(groupId);
      
      if (error || !khatmah) {
        console.error('Failed to load private khatmah:', error);
        // Remove from localStorage if khatmah doesn't exist
        const data = getUserData();
        data.groups = data.groups.filter(id => id !== groupId);
        localStorage.setItem('quranCircleUserData', JSON.stringify(data));
        // Navigate back to reading dashboard
        navigate(`/reading`);
        return;
      }

      setKhatmahDays(khatmah.duration);
      setKhatmahName(khatmah.name);
      setKhatmahTitle(language === 'ar' ? khatmah.name : khatmah.name);

      // Calculate milestones using UNIFIED private progress
      const calculatedMilestones = calculatePrivateKhatmahMilestones(khatmah.duration);
      setMilestones(calculatedMilestones);

      // Find current day based on progress
      const completedDays = calculatedMilestones.filter(m => m.completed).length;
      setCurrentDay(Math.min(completedDays + 1, khatmah.duration));
    };

    loadKhatmahData();
  }, [groupId, isAuthenticated, navigate]);

  // Fetch verses when page changes
  useEffect(() => {
    fetchPageVerses();
    setImageLoading(true); // Reset image loading state when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
    pageEntryTime.current = Date.now();
  }, [currentPage]);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (currentPage !== undefined && currentPage !== null) {
      // SHARED across all private khatmahs
      localStorage.setItem(`private-khatmah-currentPage`, currentPage.toString());
    }
  }, [currentPage]);

  // Save night mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('quranNightMode', nightMode.toString());
  }, [nightMode]);

  // Update page read status when current page changes
  useEffect(() => {
    if (groupId) {
      // Use UNIFIED private progress
      setPageReadStatus(isPrivateKhatmahPageRead(groupId, currentPage));
    }
  }, [currentPage, groupId]);

  const fetchPageVerses = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch verses data
      const data = await getVersesByPage(currentPage);
      setVerses(data.verses);
      
      if (data.verses.length > 0) {
        const chapterNum = parseInt(data.verses[0].verse_key.split(':')[0]);
        
        // Check if we already have this chapter cached in sessionStorage
        const cachedChapter = sessionStorage.getItem(`chapter-${chapterNum}`);
        if (cachedChapter) {
          setChapterInfo(JSON.parse(cachedChapter));
        } else {
          // Fetch chapter info and cache it
          const chapter = await getChapter(chapterNum);
          setChapterInfo(chapter);
          sessionStorage.setItem(`chapter-${chapterNum}`, JSON.stringify(chapter));
        }
      }
    } catch (err) {
      setError('Failed to load Quran data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = async () => {
    setDrawerOpen(true);
    if (allChapters.length === 0) {
      setChaptersLoading(true);
      try {
        const chapters = await getChapters();
        setAllChapters(chapters);
      } catch (err) {
        console.error('Failed to load chapters:', err);
      } finally {
        setChaptersLoading(false);
      }
    }
    
    // Scroll to current chapter after drawer opens
    setTimeout(() => {
      if (chapterInfo) {
        const chapterElement = document.getElementById(`chapter-${chapterInfo.chapter_number}`);
        if (chapterElement) {
          chapterElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 300); // Wait for drawer animation to complete
  };

  const selectChapter = (chapter: Chapter) => {
    setDrawerOpen(false);
    if (chapter.pages && chapter.pages.length > 0) {
      setCurrentPage(chapter.pages[0]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMarkPageAsRead = async () => {
    if (groupId) {
      // Mark in UNIFIED private progress (syncs across ALL private khatmahs)
      markPrivateKhatmahPageAsRead(groupId, currentPage);
      setPageReadStatus(true);
      
      // Sync to Supabase for display to other members
      const progressData = getPrivateKhatmahProgressData();
      console.log('📤 Syncing progress data:', {
        pagesReadCount: Object.keys(progressData.pagesRead || {}).length,
        percentComplete: progressData.percentComplete
      });
      await syncMemberProgress(groupId, progressData);
      
      // Recalculate milestones to update progress
      const calculatedMilestones = calculatePrivateKhatmahMilestones(khatmahDays);
      setMilestones(calculatedMilestones);
      
      // Update current day based on new progress
      const completedDays = calculatedMilestones.filter(m => m.completed).length;
      setCurrentDay(Math.min(completedDays + 1, khatmahDays));
    }
  };

  // Auto-mark page as read if user spent 15+ seconds on it
  const autoMarkPageIfTimeSpent = async (pageNumber: number) => {
    const timeSpent = Date.now() - pageEntryTime.current;
    if (timeSpent >= MIN_READ_TIME && !isPrivateKhatmahPageRead(groupId, pageNumber)) {
      markPrivateKhatmahPageAsRead(groupId, pageNumber);
      
      // Sync to Supabase
      const progressData = getPrivateKhatmahProgressData();
      console.log('📤 Auto-sync progress data:', {
        pagesReadCount: Object.keys(progressData.pagesRead || {}).length,
        percentComplete: progressData.percentComplete
      });
      await syncMemberProgress(groupId!, progressData);
      
      // Recalculate milestones to update progress UI
      const calculatedMilestones = calculatePrivateKhatmahMilestones(khatmahDays);
      setMilestones(calculatedMilestones);
      
      // Update current day based on new progress
      const completedDays = calculatedMilestones.filter(m => m.completed).length;
      setCurrentDay(Math.min(completedDays + 1, khatmahDays));
      
      console.log(`Auto-marked page ${pageNumber} as read (spent ${Math.round(timeSpent / 1000)}s)`);
    }
  };

  // Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX; // Initialize to prevent tap from triggering swipe
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 50;

    // Only navigate if there was actual swipe movement
    if (Math.abs(swipeDistance) >= minSwipeDistance) {
      if (swipeDistance > minSwipeDistance && currentPage < 604) {
        autoMarkPageIfTimeSpent(currentPage); // Auto-mark before navigating FORWARD
        setCurrentPage(prev => prev + 1);
        setSlideDirection('right');
        setShowSwipeIndicator(true);
        setTimeout(() => setShowSwipeIndicator(false), 1000);
      }
      else if (swipeDistance < -minSwipeDistance && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
        setSlideDirection('left');
        setShowSwipeIndicator(true);
        setTimeout(() => setShowSwipeIndicator(false), 1000);
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Header hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Show swipe indicator briefly when page loads
  useEffect(() => {
    if (!loading) {
      setShowSwipeIndicator(true);
      const timer = setTimeout(() => setShowSwipeIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Calculate overall progress based on UNIFIED private progress
  const calculateProgress = () => {
    const stats = getPrivateKhatmahReadingStats();
    return stats.percentComplete;
  };

  // Get pages read count from UNIFIED private progress
  const getPagesRead = () => {
    const stats = getPrivateKhatmahReadingStats();
    return stats.pagesRead;
  };

  // Calculate today's milestone progress
  const calculateTodayMilestoneProgress = () => {
    if (!groupId || milestones.length === 0) return { progress: 0, pagesRemaining: 0, isCompleted: false, pagesRead: 0, totalPages: 0 };
    
    // Find the current uncompleted milestone (today's goal)
    const todayMilestone = milestones.find(m => !m.completed);
    
    if (!todayMilestone) {
      // All milestones completed
      return { progress: 100, pagesRemaining: 0, isCompleted: true, pagesRead: 0, totalPages: 0 };
    }
    
    const todayMilestoneStartPage = todayMilestone.startPage;
    const todayMilestoneEndPage = todayMilestone.endPage;
    const todayMilestoneTotalPages = todayMilestoneEndPage - todayMilestoneStartPage + 1;
    
    // Count how many pages in TODAY'S milestone range have been marked as read
    let todayMilestonePagesRead = 0;
    for (let page = todayMilestoneStartPage; page <= todayMilestoneEndPage; page++) {
      if (isPrivateKhatmahPageRead(groupId, page)) {
        todayMilestonePagesRead++;
      }
    }
    
    const todayMilestoneProgress = (todayMilestonePagesRead / todayMilestoneTotalPages) * 100;
    const pagesRemainingToday = todayMilestoneTotalPages - todayMilestonePagesRead;
    
    return { 
      progress: todayMilestoneProgress, 
      pagesRemaining: pagesRemainingToday,
      pagesRead: todayMilestonePagesRead,
      totalPages: todayMilestoneTotalPages,
      isCompleted: todayMilestonePagesRead === todayMilestoneTotalPages
    };
  };

  const todayMilestoneProgress = calculateTodayMilestoneProgress();
  
  // Get today's milestone details for display
  const todayMilestone = milestones.find(m => !m.completed);

  return (
    <div className={`min-h-screen ${nightMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-purple-50 to-white dark:from-purple-950 dark:to-purple-900'}`}>
      {/* Contextual Private Khatmah Header */}
      <header className={`border-b border-purple-100 dark:border-purple-800 bg-white/80 dark:bg-purple-950/80 backdrop-blur-sm sticky top-0 z-10 transition-transform duration-300 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Back Arrow & Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-purple-50 dark:hover:bg-purple-900 shrink-0"
                onClick={() => navigate(`/private-khatmah/${groupId}`)}
              >
                <ArrowLeft className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="text-purple-900 dark:text-purple-100 font-medium text-sm md:text-base truncate flex items-center gap-2">
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                    {language === 'ar' ? 'خاصة' : 'Private'}
                  </span>
                  {khatmahName}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 truncate">
                  {language === 'ar' ? chapterInfo?.name_arabic : chapterInfo?.name_simple} - {chapterInfo && translations.surahMeanings[chapterInfo.chapter_number - 1]}
                </div>
              </div>
            </div>

            {/* Current Day & Menu */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div className="text-sm text-purple-900 dark:text-purple-100 font-medium whitespace-nowrap">
                  {language === 'ar' ? `${translations.day} ${currentDay} ${translations.of} ${khatmahDays}` : `${translations.day} ${currentDay} ${translations.of} ${khatmahDays}`}
                </div>
                {todayMilestone && (
                  <div className="text-xs text-purple-600 dark:text-purple-400 whitespace-nowrap hidden sm:block">
                    {language === 'ar' ? `${translations.pagesLabel} ${todayMilestone.startPage}-${todayMilestone.endPage}` : `${translations.pagesLabel} ${todayMilestone.startPage}-${todayMilestone.endPage}`}
                  </div>
                )}
              </div>
              
              {/* Mushaf View Toggle Button */}
              <Button 
                variant="outline" 
                size="icon"
                className="border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 shrink-0"
                onClick={async () => {
                  const newMode = viewMode === 'mushaf' ? 'text' : 'mushaf';
                  setViewMode(newMode);
                  await setMushafViewMode(newMode);
                }}
                title={viewMode === 'mushaf' ? 'Switch to Text Mode' : 'Switch to Image Mode'}
              >
                {viewMode === 'mushaf' ? (
                  <Type className="w-4 h-4" />
                ) : (
                  <BookOpen className="w-4 h-4" />
                )}
              </Button>
              
              {onToggleDarkMode && (
                <Button 
                  variant="outline" 
                  size="icon"
                  className="border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 shrink-0"
                  onClick={onToggleDarkMode}
                >
                  {document.documentElement.classList.contains('dark') ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button variant="outline" size="icon" className="border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 shrink-0" onClick={openDrawer}>
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 space-y-2">
            <div 
              className="text-xs text-purple-600 dark:text-purple-400"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              {todayMilestoneProgress.isCompleted ? (
                language === 'ar'
                  ? '🎉 أكملت ورد اليوم!'
                  : '🎉 Today\'s goal completed!'
              ) : todayMilestoneProgress.pagesRemaining > 0 ? (
                language === 'ar' 
                  ? `${todayMilestoneProgress.pagesRemaining} صفحة متبقية لإكمالك وردك اليوم`
                  : `${todayMilestoneProgress.pagesRemaining} pages remaining to complete today's goal`
              ) : (
                language === 'ar'
                  ? 'ابدأ القراءة اليوم'
                  : 'Start reading today'
              )}
            </div>
            <div className="relative">
              {/* Animated gradient background */}
              <div className="absolute inset-0 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-900/30">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-purple-500 dark:from-purple-400 dark:via-purple-500 dark:to-purple-400 transition-all duration-1000 ease-out relative"
                  style={{ width: `${todayMilestoneProgress.progress}%` }}
                >
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" 
                       style={{ 
                         backgroundSize: '200% 100%',
                         animation: 'shimmer 2s infinite'
                       }} 
                  />
                  {/* Glow effect */}
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/30 to-transparent" />
                </div>
              </div>
              {/* Progress percentage text */}
              <div className="relative h-1.5 flex items-center justify-end px-2">
                {todayMilestoneProgress.progress > 15 && (
                  <span className="text-[10px] text-white dark:text-white font-semibold drop-shadow-md">
                    {Math.round(todayMilestoneProgress.progress)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 md:py-6 max-w-5xl">
        {/* Swipe Indicator */}
        {showSwipeIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-purple-600 dark:text-purple-400 mb-4"
          >
            ← Swipe to navigate pages →
          </motion.div>
        )}

        {/* Verses Display - Same as public reader but with purple theme */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mb-4" />
            <p className="text-purple-600 dark:text-purple-400">Loading verses...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchPageVerses} className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600">
              Retry
            </Button>
          </div>
        ) : (
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: slideDirection === 'right' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Card className={`${viewMode === 'mushaf' 
              ? 'overflow-hidden p-0 gap-0 border-0 rounded-none bg-white dark:bg-purple-950' 
              : 'border-2 border-purple-200 dark:border-purple-700 bg-white dark:bg-purple-950/50'}`}>
              {/* Decorative top border */}
              <div className={`h-2 bg-gradient-to-r from-purple-600 via-amber-500 to-purple-600 dark:from-purple-500 dark:via-amber-600 dark:to-purple-500 ${viewMode === 'mushaf' ? '' : 'rounded-t-lg'}`}></div>
              
              <div className={viewMode === 'mushaf' ? '' : 'p-4 md:p-6'}>
                {/* Mushaf Image Mode */}
                {viewMode === 'mushaf' ? (
                  <div className="relative min-h-[600px]">
                    {/* Loading overlay */}
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-purple-950/90 z-10 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4 bg-white dark:bg-purple-900 rounded-full p-8 shadow-2xl border-4 border-purple-500 dark:border-purple-400">
                          <Loader2 className="w-16 h-16 text-purple-600 dark:text-purple-400 animate-spin" />
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300 whitespace-nowrap">
                            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
                          </p>
                        </div>
                      </div>
                    )}
                    <img 
                      src={getMushafPageImageUrl(currentPage, false)} 
                      alt={`Page ${currentPage}`}
                      className="w-full h-auto block dark:invert"
                      loading="lazy"
                      onLoad={() => setImageLoading(false)}
                    />
                  </div>
                ) : (
                  /* Text Mode - Same structure as public reader */
                  <div className="space-y-6">
                    {verses.map((verse) => (
                      <div key={verse.verse_key} className="space-y-2">
                        <p className="text-2xl md:text-3xl text-right leading-loose font-arabic text-gray-800 dark:text-gray-200">
                          {verse.text_uthmani}
                        </p>
                        {verse.translations && verse.translations.length > 0 && (
                          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                            {verse.translations[0].text}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Navigation & Mark as Read Buttons */}
        <div className="mt-6 flex items-center justify-between gap-4 flex-row-reverse">
          <Button
            variant="outline"
            onClick={async () => {
              // Mark current page as read before navigating (user clicked, so they finished reading)
              if (!isPrivateKhatmahPageRead(groupId, currentPage)) {
                markPrivateKhatmahPageAsRead(groupId, currentPage);
                
                // Sync to Supabase
                const progressData = getPrivateKhatmahProgressData();
                await syncMemberProgress(groupId!, progressData);
                
                // Recalculate milestones to update progress UI
                const calculatedMilestones = calculatePrivateKhatmahMilestones(khatmahDays);
                setMilestones(calculatedMilestones);
                
                // Update current day based on new progress
                const completedDays = calculatedMilestones.filter(m => m.completed).length;
                setCurrentDay(Math.min(completedDays + 1, khatmahDays));
              }
              
              setCurrentPage(prev => Math.max(1, prev - 1));
            }}
            disabled={currentPage === 1}
            className="border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 disabled:opacity-50"
          >
            {language === 'ar' ? 'السابقة' : 'Previous'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-purple-600 dark:text-purple-400">
              {language === 'ar' ? `صفحة ${currentPage} / 604` : `Page ${currentPage} / 604`}
            </span>
            <Button
              onClick={handleMarkPageAsRead}
              disabled={pageReadStatus}
              className={`${pageReadStatus 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-purple-600 hover:bg-purple-700'} text-white`}
            >
              {pageReadStatus ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  {language === 'ar' ? 'تم' : 'Done'}
                </>
              ) : (
                language === 'ar' ? 'اعتبرها مقروءة' : 'Mark as Read'
              )}
            </Button>
          </div>

          <Button
            variant="outline"
            onClick={async () => {
              // Mark current page as read before navigating (user clicked, so they finished reading)
              if (!isPrivateKhatmahPageRead(groupId, currentPage)) {
                markPrivateKhatmahPageAsRead(groupId, currentPage);
                
                // Sync to Supabase
                const progressData = getPrivateKhatmahProgressData();
                await syncMemberProgress(groupId!, progressData);
                
                // Recalculate milestones to update progress UI
                const calculatedMilestones = calculatePrivateKhatmahMilestones(khatmahDays);
                setMilestones(calculatedMilestones);
                
                // Update current day based on new progress
                const completedDays = calculatedMilestones.filter(m => m.completed).length;
                setCurrentDay(Math.min(completedDays + 1, khatmahDays));
              }
              
              setCurrentPage(prev => Math.min(604, prev + 1));
            }}
            disabled={currentPage === 604}
            className="border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {language === 'ar' ? 'التالية' : 'Next'}
          </Button>
        </div>
      </div>

      {/* Drawer - Same as public reader */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-80 bg-white dark:bg-purple-950 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">
                  {language === 'ar' ? 'السور' : 'Chapters'}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}>
                  <ArrowLeft className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </Button>
              </div>

              {chaptersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {allChapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      id={`chapter-${chapter.chapter_number}`}
                      onClick={() => selectChapter(chapter)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        chapterInfo?.id === chapter.id
                          ? 'bg-purple-50 dark:bg-purple-900 border-purple-500 dark:border-purple-400'
                          : 'bg-white dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 hover:border-purple-400 dark:hover:border-purple-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-purple-900 dark:text-purple-100">
                            {language === 'ar' ? chapter.name_arabic : chapter.name_simple}
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400">
                            {translations.surahMeanings[chapter.chapter_number - 1]}
                          </div>
                        </div>
                        <div className="text-sm text-purple-600 dark:text-purple-400">
                          {chapter.chapter_number}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}