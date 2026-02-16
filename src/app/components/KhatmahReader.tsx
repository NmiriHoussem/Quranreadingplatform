import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Menu, Loader2, Check, Users, Moon, Sun, BookOpen, Type } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { getVersesByPage, getChapter, getChapters, getMushafPageImageUrl, Verse, Chapter } from '../../services/quranApi';
import { motion } from 'motion/react';
import { 
  isMemberOfGroup, 
  calculateKhatmahMilestonesForGroup, 
  isKhatmahPageRead, 
  markKhatmahPageAsRead,
  getKhatmahReadingStats
} from '../utils/localStorage';
import { updatePresence, getActiveReaders } from '../../services/presenceService';
import { getOrCreateSessionId } from '../utils/sessionId';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';
import { getTranslations, getStoredLanguage } from '../utils/translations';
import { getMushafViewMode, setMushafViewMode, type MushafViewMode } from '../../services/preferenceService';

interface KhatmahReaderProps {
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

export default function KhatmahReader({ isAuthenticated, onSignOut, onToggleDarkMode }: KhatmahReaderProps) {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  const [currentPage, setCurrentPage] = useState(() => {
    // Load saved page for this specific khatmah
    const savedPage = localStorage.getItem(`khatmah-${groupId}-currentPage`);
    if (!savedPage || savedPage.trim() === '' || savedPage === 'undefined' || savedPage === 'null') {
      localStorage.setItem(`khatmah-${groupId}-currentPage`, '1');
      return 1;
    }
    const page = parseInt(savedPage, 10);
    if (isNaN(page) || page < 1 || page > 604) {
      localStorage.setItem(`khatmah-${groupId}-currentPage`, '1');
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
    // Check if user has joined this khatmah group
    if (!groupId || !isMemberOfGroup(groupId)) {
      navigate(`/groups/${groupId}`);
      return;
    }

    // Initialize khatmah data
    if (groupId.startsWith('khatmah-')) {
      const days = parseInt(groupId.split('-')[1]);
      setKhatmahDays(days);
      setKhatmahTitle(language === 'ar' ? `تحدي ختمة ${days} ${days === 1 ? translations.day : translations.days}` : `${days}-${translations.day} ${translations.khatmah} Challenge`);

      // Calculate milestones
      const calculatedMilestones = calculateKhatmahMilestonesForGroup(groupId, days);
      setMilestones(calculatedMilestones);

      // Find current day based on progress
      const completedDays = calculatedMilestones.filter(m => m.completed).length;
      setCurrentDay(Math.min(completedDays + 1, days));
    }
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
    if (currentPage !== undefined && currentPage !== null && groupId) {
      localStorage.setItem(`khatmah-${groupId}-currentPage`, currentPage.toString());
    }
  }, [currentPage, groupId]);

  // Save night mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('quranNightMode', nightMode.toString());
  }, [nightMode]);

  // Update page read status when current page changes
  useEffect(() => {
    if (groupId) {
      setPageReadStatus(isKhatmahPageRead(groupId, currentPage));
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

  const handleMarkPageAsRead = () => {
    if (groupId) {
      markKhatmahPageAsRead(groupId, currentPage);
      setPageReadStatus(true);
      
      // Recalculate milestones to update progress
      if (groupId.startsWith('khatmah-')) {
        const days = parseInt(groupId.split('-')[1]);
        const calculatedMilestones = calculateKhatmahMilestonesForGroup(groupId, days);
        setMilestones(calculatedMilestones);
        
        // Update current day based on new progress
        const completedDays = calculatedMilestones.filter(m => m.completed).length;
        setCurrentDay(Math.min(completedDays + 1, days));
      }
    }
  };

  // Auto-mark page as read if user spent 15+ seconds on it
  const autoMarkPageIfTimeSpent = (pageNumber: number) => {
    const timeSpent = Date.now() - pageEntryTime.current;
    if (timeSpent >= MIN_READ_TIME && !isKhatmahPageRead(groupId, pageNumber)) {
      markKhatmahPageAsRead(groupId, pageNumber);
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

  // Presence tracking - update every 15 seconds if authenticated
  useEffect(() => {
    if (!groupId || !isAuthenticated) return;

    // Update presence immediately
    const sendPresence = async () => {
      const result = await updatePresence(groupId);
      if (result) {
        const prevCount = activeReaders;
        setActiveReaders(result.activeReadersExcludingSelf || 0);
        
        // Show animation if count increased
        if (result.activeReadersExcludingSelf && result.activeReadersExcludingSelf > prevCount) {
          setShowPresenceAnimation(true);
          setTimeout(() => setShowPresenceAnimation(false), 3000);
        }
      }
    };

    sendPresence();

    // Set up interval to update presence every 15 seconds
    const presenceInterval = setInterval(sendPresence, 15000);

    return () => clearInterval(presenceInterval);
  }, [groupId, isAuthenticated]);

  // Anonymous heartbeat tracking - "Reading with you now" feature
  // Sends heartbeat every 3 minutes, shows banner if 2+ readers
  useEffect(() => {
    if (!groupId) return;

    const sessionId = getOrCreateSessionId();
    console.log('📖 [KHATMAH] Starting anonymous heartbeat tracking');

    // Send heartbeat to server
    const sendHeartbeat = async () => {
      // Skip if offline
      if (!navigator.onLine) {
        console.log('📵 [HEARTBEAT] Offline - skipping heartbeat');
        return;
      }
      
      try {
        const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-bf07b5b1/khatmah/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ sessionId })
        });

        if (response.ok) {
          const data = await response.json();
          console.log('💓 [HEARTBEAT] Response:', data);
          
          // Update active readers count
          // Only show if count >= 2 (at least one other person besides you)
          if (data.count >= 2) {
            setActiveReaders(data.count);
          } else {
            setActiveReaders(0); // Hide banner if less than 2
          }
        } else {
          console.error('💓 [HEARTBEAT] Failed:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('💓 [HEARTBEAT] Error:', error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Send heartbeat every 3 minutes (180 seconds)
    const heartbeatInterval = setInterval(sendHeartbeat, 180000);

    // Cleanup
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [groupId]);

  // Calculate overall progress based on pages read
  const calculateProgress = () => {
    if (!groupId) return 0;
    const stats = getKhatmahReadingStats(groupId);
    return stats.percentComplete;
  };

  // Get pages read count
  const getPagesRead = () => {
    if (!groupId) return 0;
    const stats = getKhatmahReadingStats(groupId);
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
      if (isKhatmahPageRead(groupId, page)) {
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

  const translations = getTranslations(getStoredLanguage());
  const language = getStoredLanguage();

  return (
    <div className={`min-h-screen ${nightMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900'}`}>
      {/* Contextual Khatmah Header */}
      <header className={`border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-sm sticky top-0 z-10 transition-transform duration-300 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            {/* Back Arrow & Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Link to="/reading-dashboard">
                <Button variant="ghost" size="icon" className="hover:bg-emerald-50 dark:hover:bg-emerald-900 shrink-0">
                  <ArrowLeft className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </Button>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="text-emerald-900 dark:text-emerald-100 font-medium text-sm md:text-base truncate">
                  {khatmahTitle}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 truncate">
                  {language === 'ar' ? chapterInfo?.name_arabic : chapterInfo?.name_simple} - {chapterInfo && translations.surahMeanings[chapterInfo.chapter_number - 1]}
                </div>
              </div>
            </div>

            {/* Current Day & Menu */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div className="text-sm text-emerald-900 dark:text-emerald-100 font-medium whitespace-nowrap">
                  {language === 'ar' ? `${translations.day} ${currentDay} ${translations.of} ${khatmahDays}` : `${translations.day} ${currentDay} ${translations.of} ${khatmahDays}`}
                </div>
                {todayMilestone && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap hidden sm:block">
                    {language === 'ar' ? `${translations.pagesLabel} ${todayMilestone.startPage}-${todayMilestone.endPage}` : `${translations.pagesLabel} ${todayMilestone.startPage}-${todayMilestone.endPage}`}
                  </div>
                )}
              </div>
              
              {/* Mushaf View Toggle Button */}
              <Button 
                variant="outline" 
                size="icon"
                className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 shrink-0"
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
                  className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 shrink-0"
                  onClick={onToggleDarkMode}
                >
                  {document.documentElement.classList.contains('dark') ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button variant="outline" size="icon" className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 shrink-0" onClick={openDrawer}>
                <Menu className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-2 space-y-2">
            <div 
              className="text-xs text-emerald-600 dark:text-emerald-400"
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
              <div className="absolute inset-0 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/30">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 dark:from-emerald-400 dark:via-emerald-500 dark:to-emerald-400 transition-all duration-1000 ease-out relative"
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
        {/* "Reading With You Now" Banner - Shows for everyone when 2+ readers */}
        {activeReaders >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4"
          >
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg px-4 py-3">
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-emerald-900 dark:text-emerald-100 text-sm md:text-base">
                  <strong>{activeReaders} people</strong> reading with you now
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Swipe Indicator */}
        {showSwipeIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-center text-sm text-emerald-600 dark:text-emerald-400 mb-4"
          >
            ← Swipe to navigate pages →
          </motion.div>
        )}

        {/* Verses Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-spin mb-4" />
            <p className="text-emerald-600 dark:text-emerald-400">Loading verses...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button onClick={fetchPageVerses} className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600">
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
              ? 'overflow-hidden p-0 gap-0 border-0 rounded-none bg-white dark:bg-emerald-950' 
              : 'border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-950/50'}`}>
              {/* Decorative top border */}
              <div className={`h-2 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 dark:from-emerald-500 dark:via-amber-600 dark:to-emerald-500 ${viewMode === 'mushaf' ? '' : 'rounded-t-lg'}`}></div>
              
              <div className={viewMode === 'mushaf' ? '' : 'p-4 md:p-6'}>
                {/* Mushaf Image Mode */}
                {viewMode === 'mushaf' ? (
                  <div className="relative min-h-[600px]">
                    {/* Loading overlay */}
                    {imageLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-emerald-950/90 z-10 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-4 bg-white dark:bg-emerald-900 rounded-full p-8 shadow-2xl border-4 border-emerald-500 dark:border-emerald-400">
                          <Loader2 className="w-16 h-16 text-emerald-600 dark:text-emerald-400 animate-spin" />
                          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
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
                  /* Text Mode */
                  <>
                    {/* Surah Header - show if page starts with a new surah */}
                    {verses.length > 0 && verses[0].verse_number === 1 && (
                      <div className="text-center mb-3 md:mb-4 pb-2 md:pb-3 border-b-2 border-emerald-200 dark:border-emerald-700">
                        <div className="text-3xl md:text-4xl lg:text-5xl text-emerald-900 dark:text-emerald-100 mb-1 md:mb-2">{chapterInfo?.name_arabic}</div>
                        <div className="text-xs md:text-sm text-emerald-600 dark:text-emerald-400">
                          {chapterInfo?.revelation_place === 'makkah' ? 'مَكِّيَّةٌ' : 'مَدَنِيَّةٌ'}
                        </div>
                      </div>
                    )}

                    {/* Bismillah - show for new surah (except Surah 9) */}
                    {verses.length > 0 && verses[0].verse_number === 1 && parseInt(verses[0].verse_key.split(':')[0]) !== 9 && parseInt(verses[0].verse_key.split(':')[0]) !== 1 && (
                      <div className="text-center mb-3 md:mb-4">
                        <div className="text-2xl md:text-3xl lg:text-4xl text-emerald-800 dark:text-emerald-300 leading-loose">
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </div>
                      </div>
                    )}

                    {/* Continuous Ayahs (Mushaf style) */}
                    <div className="text-right leading-loose">
                      <p className="text-xl md:text-2xl lg:text-3xl text-gray-900 dark:text-gray-100" style={{ lineHeight: '2.2' }}>
                        {verses.map((verse) => (
                          <span key={verse.id} className="inline">
                            {verse.text_uthmani}
                            {' '}
                            <span className="inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-emerald-600 dark:border-emerald-400 text-emerald-700 dark:text-emerald-300 text-xs md:text-sm mx-1">
                              {verse.verse_number}
                            </span>
                            {' '}
                          </span>
                        ))}
                      </p>
                    </div>
                  </>
                )}

                {/* Page Footer - Surah name - Only show in text mode */}
                {viewMode !== 'mushaf' && (
                  <div className="mt-4 md:mt-6 pt-2 md:pt-3 border-t-2 border-emerald-200 dark:border-emerald-700 text-center">
                    <div className="text-sm md:text-base text-emerald-600 dark:text-emerald-400">
                      {language === 'ar' ? chapterInfo?.name_arabic : chapterInfo?.name_simple}
                    </div>
                  </div>
                )}
              </div>

              {/* Decorative bottom border */}
              <div className={`h-2 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 dark:from-emerald-500 dark:via-amber-600 dark:to-emerald-500 ${viewMode === 'mushaf' ? '' : 'rounded-b-lg'}`}></div>
            </Card>

            {/* Page Navigation - Moved Below Card */}
            <div className="flex justify-between items-center my-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  autoMarkPageIfTimeSpent(currentPage);
                  setCurrentPage(Math.min(604, currentPage + 1));
                }}
                onTouchEnd={(e) => e.stopPropagation()}
                disabled={currentPage === 604 || loading}
                className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {translations.next}
              </Button>
              
              <div className="text-center">
                <div className="text-emerald-900 dark:text-emerald-100">
                  {language === 'ar' ? `${translations.page} ${currentPage} ${translations.of} 604` : `${translations.page} ${currentPage} ${translations.of} 604`}
                </div>
                {pageReadStatus && (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" />
                    {translations.completed}
                  </div>
                )}
              </div>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  autoMarkPageIfTimeSpent(currentPage);
                  setCurrentPage(Math.max(1, currentPage - 1));
                }}
                onTouchEnd={(e) => e.stopPropagation()}
                disabled={currentPage === 1 || loading}
                className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
              >
                {translations.previous}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>

            {/* Mark Page as Read Button */}
            {!pageReadStatus && (
              <div className="mt-4 text-center">
                <Button
                  type="button"
                  onClick={handleMarkPageAsRead}
                  onTouchEnd={(e) => e.stopPropagation()}
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {translations.markPageAsComplete}
                </Button>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                  {language === 'ar' ? 'أو اقضِ 15+ ثانية على هذه الصفحة للإكمال التلقائي' : 'Or spend 15+ seconds on this page to auto-complete'}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Surah Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setDrawerOpen(false)}>
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-emerald-950 shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl text-emerald-900 dark:text-emerald-100">Surahs</h2>
                <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>
              
              {chaptersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {allChapters.map((chapter) => {
                    const isCurrentChapter = chapterInfo?.chapter_number === chapter.chapter_number;
                    return (
                      <button
                        key={chapter.chapter_number}
                        id={`chapter-${chapter.chapter_number}`}
                        onClick={() => selectChapter(chapter)}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                          isCurrentChapter 
                            ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-100 dark:bg-emerald-800 ring-2 ring-emerald-500 dark:ring-emerald-400'
                            : 'border-emerald-100 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className={`${isCurrentChapter ? 'font-semibold text-emerald-700 dark:text-emerald-300' : 'text-emerald-900 dark:text-emerald-100'}`}>
                              {chapter.chapter_number}. {chapter.name_simple}
                            </div>
                            <div className="text-sm text-emerald-600 dark:text-emerald-400">
                              {chapter.translated_name?.name}
                            </div>
                          </div>
                          <div className={`text-2xl ${isCurrentChapter ? 'text-emerald-600 dark:text-emerald-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                            {chapter.name_arabic}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}