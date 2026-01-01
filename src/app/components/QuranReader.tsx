import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Book, ChevronLeft, ChevronRight, Home, Menu, BookOpen, Brain, Loader2, Play, Pause, RotateCcw, X, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { getVersesByPage, getVersesByChapter, getChapter, getChapters, Verse, Chapter, RECITERS, getVerseAudioUrl } from '../../services/quranApi';
import { motion, AnimatePresence } from 'motion/react';
import { markAyahAsMemorized, unmarkAyahAsMemorized, isAyahMemorized, getLastMemorizedAyah } from '../utils/localStorage';
import { getStoredLanguage, getTranslations, type Language } from '../utils/translations';

interface QuranReaderProps {
  isAuthenticated?: boolean;
  onSignOut?: () => void;
  onToggleDarkMode?: () => void;
}

export default function QuranReader({ isAuthenticated, onSignOut, onToggleDarkMode }: QuranReaderProps) {
  const [searchParams] = useSearchParams();
  const [language, setLanguage] = useState<Language>(getStoredLanguage());
  const t = getTranslations(language);
  
  const [memorizedAyahs, setMemorizedAyahs] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<'reading' | 'memorization'>(() => {
    // Check URL params first, then fall back to localStorage
    const urlMode = new URLSearchParams(window.location.search).get('mode');
    if (urlMode && (urlMode === 'reading' || urlMode === 'memorization')) {
      return urlMode;
    }
    // Load saved mode from localStorage
    const savedMode = localStorage.getItem('quranReaderMode');
    return (savedMode === 'reading' || savedMode === 'memorization') ? savedMode : 'reading';
  });
  
  // Memorization sub-mode
  const [memorizationMode, setMemorizationMode] = useState<'ayah' | 'range' | 'page'>(() => {
    const saved = localStorage.getItem('memorizationSubMode');
    return (saved === 'ayah' || saved === 'range' || saved === 'page') ? saved : 'ayah';
  });
  
  const [currentPage, setCurrentPage] = useState(() => {
    // Load saved page from localStorage
    const savedPage = localStorage.getItem('quranCurrentPage');
    if (!savedPage || savedPage.trim() === '' || savedPage === 'undefined' || savedPage === 'null') {
      // Clear bad value and set default
      localStorage.setItem('quranCurrentPage', '1');
      return 1;
    }
    const page = parseInt(savedPage, 10);
    if (isNaN(page) || page < 1 || page > 604) {
      // Clear bad value and set default
      localStorage.setItem('quranCurrentPage', '1');
      return 1;
    }
    return page;
  });
  const [currentChapter, setCurrentChapter] = useState(() => {
    // Check URL params first for surah parameter
    const urlSurah = new URLSearchParams(window.location.search).get('surah');
    if (urlSurah) {
      const surahNum = parseInt(urlSurah);
      if (!isNaN(surahNum) && surahNum >= 1 && surahNum <= 114) {
        return surahNum;
      }
    }
    
    // Load saved chapter from localStorage
    const savedChapter = localStorage.getItem('quranCurrentChapter');
    if (!savedChapter || savedChapter.trim() === '' || savedChapter === 'undefined' || savedChapter === 'null') {
      // Clear bad value and set default
      localStorage.setItem('quranCurrentChapter', '1');
      return 1;
    }
    const chapter = parseInt(savedChapter, 10);
    if (isNaN(chapter) || chapter < 1 || chapter > 114) {
      // Clear bad value and set default
      localStorage.setItem('quranCurrentChapter', '1');
      return 1;
    }
    return chapter;
  });
  
  // Range mode states
  const [rangeChapter, setRangeChapter] = useState(1);
  const [rangeStartAyah, setRangeStartAyah] = useState(1);
  const [rangeEndAyah, setRangeEndAyah] = useState(7);
  
  // Page mode states (for memorization)
  const [memorizationPage, setMemorizationPage] = useState(1);
  
  const [verses, setVerses] = useState<Verse[]>([]);
  const [chapterInfo, setChapterInfo] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Audio state
  const [selectedReciter, setSelectedReciter] = useState(7); // Default: Mishari Rashid al-Afasy
  const [playingVerse, setPlayingVerse] = useState<string | null>(null);
  const [repeatCounts, setRepeatCounts] = useState<Record<string, number>>({});
  const [globalRepeatCount, setGlobalRepeatCount] = useState(1); // For page/range modes
  const [perAyahRepeatCount, setPerAyahRepeatCount] = useState(1); // Repeat each ayah in range mode
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentRepeatRef = useRef<number>(0);
  const playingVerseRef = useRef<string | null>(null);
  const repeatCountsRef = useRef<Record<string, number>>({});
  
  // Sequential playback state (for page/range modes)
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [sequenceRepeatCount, setSequenceRepeatCount] = useState(0);
  const [currentAyahRepeatCount, setCurrentAyahRepeatCount] = useState(0); // Track current ayah repetition
  const versesRef = useRef<Verse[]>([]);
  const isPlayingSequenceRef = useRef(false);
  const currentSequenceIndexRef = useRef(0);
  const sequenceRepeatCountRef = useRef(0);
  const globalRepeatCountRef = useRef(1);
  const perAyahRepeatCountRef = useRef(1);
  const currentAyahRepeatCountRef = useRef(0);

  // Touch/swipe state for reading mode
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [showSwipeIndicator, setShowSwipeIndicator] = useState(false);

  // Header hide/show on scroll
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Night mode
  const [nightMode, setNightMode] = useState(() => {
    const saved = localStorage.getItem('quranNightMode');
    return saved === 'true';
  });

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // Track ayah to scroll to for memorization resume
  const [scrollToAyah, setScrollToAyah] = useState<number | null>(null);

  // Handle URL params for memorization mode
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    const urlSurah = searchParams.get('surah');
    const urlResumeFrom = searchParams.get('resumeFrom');

    if (urlMode && (urlMode === 'reading' || urlMode === 'memorization')) {
      setMode(urlMode);
    }

    if (urlSurah) {
      const surahNum = parseInt(urlSurah);
      if (!isNaN(surahNum) && surahNum >= 1 && surahNum <= 114) {
        setCurrentChapter(surahNum);
        
        // Get last memorized ayah for this surah to scroll to
        const lastMemorizedAyah = getLastMemorizedAyah(surahNum);
        if (lastMemorizedAyah) {
          // Scroll to next ayah after the last memorized one
          setScrollToAyah(lastMemorizedAyah + 1);
        } else {
          // If nothing memorized yet, scroll to first ayah
          setScrollToAyah(1);
        }
      }
    }
  }, []); // Run only once on mount

  // Keep refs in sync with state
  useEffect(() => {
    playingVerseRef.current = playingVerse;
  }, [playingVerse]);

  useEffect(() => {
    repeatCountsRef.current = repeatCounts;
  }, [repeatCounts]);
  
  // Keep sequential playback refs in sync
  useEffect(() => {
    versesRef.current = verses;
  }, [verses]);
  
  useEffect(() => {
    isPlayingSequenceRef.current = isPlayingSequence;
  }, [isPlayingSequence]);
  
  useEffect(() => {
    currentSequenceIndexRef.current = currentSequenceIndex;
  }, [currentSequenceIndex]);
  
  useEffect(() => {
    sequenceRepeatCountRef.current = sequenceRepeatCount;
  }, [sequenceRepeatCount]);
  
  useEffect(() => {
    globalRepeatCountRef.current = globalRepeatCount;
  }, [globalRepeatCount]);
  
  useEffect(() => {
    perAyahRepeatCountRef.current = perAyahRepeatCount;
  }, [perAyahRepeatCount]);
  
  useEffect(() => {
    currentAyahRepeatCountRef.current = currentAyahRepeatCount;
  }, [currentAyahRepeatCount]);
  
  // Save memorization sub-mode
  useEffect(() => {
    localStorage.setItem('memorizationSubMode', memorizationMode);
  }, [memorizationMode]);

  // Define fetch functions with useCallback
  const fetchPageVerses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVersesByPage(currentPage);
      setVerses(data.verses);
      
      // Get chapter info for the first verse on the page
      if (data.verses.length > 0) {
        const chapterNumber = parseInt(data.verses[0].verse_key.split(':')[0]);
        const chapter = await getChapter(chapterNumber);
        setChapterInfo(chapter);
        // Keep currentChapter in sync so switching to memorization mode works smoothly
        setCurrentChapter(chapterNumber);
      }
      
      console.log('Fetched verses:', data.verses);
      console.log('First verse:', data.verses[0]);
    } catch (err) {
      setError('Failed to load Quran data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchChapterVerses = useCallback(async () => {
    console.log('fetchChapterVerses called with currentChapter:', currentChapter);
    
    // Validate chapter number before fetching
    if (!currentChapter || isNaN(currentChapter) || currentChapter < 1 || currentChapter > 114) {
      console.error('Invalid chapter number:', currentChapter);
      // Set to default if invalid
      setCurrentChapter(1);
      return;
    }
    
    console.log('Fetching chapter:', currentChapter);
    setLoading(true);
    setError(null);
    try {
      const data = await getVersesByChapter(currentChapter);
      console.log('Fetched chapter data:', data);
      setVerses(data.verses);
      setChapterInfo(data.chapter);
    } catch (err) {
      setError('Failed to load Quran data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentChapter]);

  // Fetch verses when page changes (Reading mode)
  useEffect(() => {
    if (mode === 'reading') {
      fetchPageVerses();
      // Scroll to top when page changes
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage, mode, fetchPageVerses]);

  // Fetch verses when chapter changes (Memorization mode)
  useEffect(() => {
    console.log('Memorization useEffect triggered. mode:', mode, 'currentChapter:', currentChapter);
    if (mode === 'memorization') {
      // Only fetch if currentChapter is valid
      if (currentChapter && !isNaN(currentChapter) && currentChapter >= 1 && currentChapter <= 114) {
        console.log('Calling fetchChapterVerses for chapter:', currentChapter);
        fetchChapterVerses();
      } else {
        console.log('Chapter validation failed:', { currentChapter, isNaN: isNaN(currentChapter) });
      }
    }
  }, [currentChapter, mode, fetchChapterVerses]);

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    if (currentPage !== undefined && currentPage !== null) {
      localStorage.setItem('quranCurrentPage', currentPage.toString());
    }
  }, [currentPage]);

  // Save current chapter to localStorage whenever it changes
  useEffect(() => {
    if (currentChapter !== undefined && currentChapter !== null) {
      localStorage.setItem('quranCurrentChapter', currentChapter.toString());
    }
  }, [currentChapter]);

  // Save mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('quranReaderMode', mode);
  }, [mode]);

  // Save night mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('quranNightMode', nightMode.toString());
  }, [nightMode]);

  // Load memorized ayahs from localStorage when in memorization mode
  useEffect(() => {
    if (mode === 'memorization' && currentChapter && verses.length > 0) {
      const memorizedAyahsFromStorage: number[] = [];
      verses.forEach(verse => {
        if (isAyahMemorized(currentChapter, verse.verse_number)) {
          memorizedAyahsFromStorage.push(verse.verse_number);
        }
      });
      setMemorizedAyahs(new Set(memorizedAyahsFromStorage));
      
      // Auto-scroll to the target ayah if set
      if (scrollToAyah) {
        setTimeout(() => {
          const ayahElement = document.getElementById(`ayah-${scrollToAyah}`);
          if (ayahElement) {
            ayahElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Clear the scroll target after scrolling
            setTimeout(() => setScrollToAyah(null), 1000);
          }
        }, 300); // Small delay to ensure DOM is ready
      }
    }
  }, [mode, currentChapter, verses, scrollToAyah]);

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
  };

  const selectChapter = (chapter: Chapter) => {
    console.log('selectChapter called with:', chapter, 'current mode:', mode);
    setDrawerOpen(false);
    
    // Navigate based on current mode
    if (mode === 'reading') {
      // In reading mode: navigate to the first page of the surah
      if (chapter.pages && chapter.pages.length > 0) {
        console.log('Reading mode: setting page to', chapter.pages[0]);
        setCurrentPage(chapter.pages[0]);
      }
    } else {
      // In memorization mode: load the entire surah
      // Use chapter_number if available, fallback to id
      const chapterNum = chapter.chapter_number || chapter.id;
      console.log('Memorization mode: setting chapter to', chapterNum);
      setCurrentChapter(chapterNum);
    }
    
    // Scroll to top when selecting new chapter
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleMemorized = (ayahNumber: number) => {
    const newSet = new Set(memorizedAyahs);
    if (newSet.has(ayahNumber)) {
      newSet.delete(ayahNumber);
      // Remove from localStorage
      unmarkAyahAsMemorized(currentChapter, ayahNumber);
    } else {
      newSet.add(ayahNumber);
      // Save to localStorage
      markAyahAsMemorized(currentChapter, ayahNumber);
    }
    setMemorizedAyahs(newSet);
  };

  const playVerse = (verseKey: string) => {
    if (playingVerse === verseKey) {
      if (audioRef.current) {
        audioRef.current.pause();
        setPlayingVerse(null);
      }
    } else {
      const audioUrl = getVerseAudioUrl(verseKey, selectedReciter);
      console.log('Attempting to play audio from:', audioUrl);
      const repeatSetting = repeatCounts[verseKey] || 1;
      console.log(`Starting playback with repeat setting: ${repeatSetting}`);
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.addEventListener('ended', handleAudioEnded);
        audioRef.current.addEventListener('error', (e) => {
          console.error('Audio error:', e);
          console.error('Failed URL:', audioRef.current?.src);
          setPlayingVerse(null);
        });
      }
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(err => {
        console.error('Play failed:', err);
        setPlayingVerse(null);
      });
      setPlayingVerse(verseKey);
      currentRepeatRef.current = 0;
    }
  };

  const setRepetitionCount = (verseKey: string, count: number) => {
    setRepeatCounts(prev => ({
      ...prev,
      [verseKey]: Math.max(1, Math.min(10, count))
    }));
  };

  const handleAudioEnded = () => {
    const currentVerse = playingVerseRef.current;
    if (!currentVerse) {
      console.log('Audio ended but no playing verse found');
      return;
    }
    
    const repeatTimes = repeatCountsRef.current[currentVerse] || 1;
    currentRepeatRef.current += 1;
    
    console.log(`Audio ended. Completed plays: ${currentRepeatRef.current}, Target: ${repeatTimes}`);
    
    // repeatTimes = total number of plays we want
    // currentRepeatRef counts how many times we've finished playing
    // We want to keep playing while currentRepeatRef < repeatTimes
    if (currentRepeatRef.current < repeatTimes) {
      console.log(`Playing again... (${currentRepeatRef.current} < ${repeatTimes})`);
      if (audioRef.current) {
        audioRef.current.play();
      }
    } else {
      console.log(`Stopping playback (${currentRepeatRef.current} >= ${repeatTimes})`);
      setPlayingVerse(null);
      currentRepeatRef.current = 0;
    }
  };

  // Sequential playback for range mode
  const handleSequenceAudioEnded = async () => {
    if (!isPlayingSequenceRef.current) {
      return;
    }

    const verses = versesRef.current;
    const currentIndex = currentSequenceIndexRef.current;
    const currentRepeat = sequenceRepeatCountRef.current;
    const targetRepeat = globalRepeatCountRef.current;
    const ayahRepeatCount = currentAyahRepeatCountRef.current;
    const targetAyahRepeat = perAyahRepeatCountRef.current;

    console.log(`Sequence audio ended. Index: ${currentIndex}, Ayah repeat: ${ayahRepeatCount + 1}/${targetAyahRepeat}, Range repeat: ${currentRepeat + 1}/${targetRepeat}`);

    // Check if we need to repeat the current ayah
    if (ayahRepeatCount + 1 < targetAyahRepeat) {
      // Repeat the same ayah
      setCurrentAyahRepeatCount(ayahRepeatCount + 1);
      const currentVerse = verses[currentIndex];
      const audioUrl = getVerseAudioUrl(currentVerse.verse_key, selectedReciter);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        // Wait for audio to be ready
        await new Promise((resolve) => {
          if (audioRef.current) {
            audioRef.current.onloadeddata = () => resolve(true);
          }
        });
        
        try {
          await audioRef.current.play();
        } catch (err) {
          console.error('Sequential ayah repeat failed:', err);
          stopSequence();
        }
      }
    } else if (currentIndex < verses.length - 1) {
      // Move to next ayah (reset ayah repeat count)
      setCurrentAyahRepeatCount(0);
      const nextIndex = currentIndex + 1;
      setCurrentSequenceIndex(nextIndex);
      const nextVerse = verses[nextIndex];
      const audioUrl = getVerseAudioUrl(nextVerse.verse_key, selectedReciter);
      setPlayingVerse(nextVerse.verse_key);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        // Wait for audio to be ready
        await new Promise((resolve) => {
          if (audioRef.current) {
            audioRef.current.onloadeddata = () => resolve(true);
          }
        });
        
        try {
          await audioRef.current.play();
        } catch (err) {
          console.error('Sequential play failed:', err);
          stopSequence();
        }
      }
    } else {
      // Reached end of range, check if we need to repeat the entire range
      if (currentRepeat + 1 < targetRepeat) {
        // Repeat the entire range
        setSequenceRepeatCount(currentRepeat + 1);
        setCurrentSequenceIndex(0);
        setCurrentAyahRepeatCount(0);
        const firstVerse = verses[0];
        const audioUrl = getVerseAudioUrl(firstVerse.verse_key, selectedReciter);
        setPlayingVerse(firstVerse.verse_key);
        
        if (audioRef.current) {
          audioRef.current.src = audioUrl;
          // Wait for audio to be ready
          await new Promise((resolve) => {
            if (audioRef.current) {
              audioRef.current.onloadeddata = () => resolve(true);
            }
          });
          
          try {
            await audioRef.current.play();
          } catch (err) {
            console.error('Sequential range repeat failed:', err);
            stopSequence();
          }
        }
      } else {
        // Done with all repetitions
        stopSequence();
      }
    }
  };

  const playSequence = async () => {
    if (isPlayingSequence) {
      stopSequence();
      return;
    }

    const rangeVerses = getFilteredVerses();
    if (rangeVerses.length === 0) {
      console.error('No verses in range');
      return;
    }

    // IMPORTANT: Set versesRef to the filtered range, not all verses
    versesRef.current = rangeVerses;

    setIsPlayingSequence(true);
    setCurrentSequenceIndex(0);
    setSequenceRepeatCount(0);
    setCurrentAyahRepeatCount(0);

    const firstVerse = rangeVerses[0];
    const audioUrl = getVerseAudioUrl(firstVerse.verse_key, selectedReciter);
    setPlayingVerse(firstVerse.verse_key);

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        stopSequence();
      });
    }

    // Remove old event listener and add sequence handler
    audioRef.current.removeEventListener('ended', handleAudioEnded);
    audioRef.current.addEventListener('ended', handleSequenceAudioEnded);

    audioRef.current.src = audioUrl;
    
    // Wait for audio to be ready before playing
    await new Promise((resolve) => {
      if (audioRef.current) {
        audioRef.current.onloadeddata = () => resolve(true);
      }
    });
    
    try {
      await audioRef.current.play();
    } catch (err) {
      console.error('Play sequence failed:', err);
      stopSequence();
    }
  };

  const stopSequence = () => {
    setIsPlayingSequence(false);
    setCurrentSequenceIndex(0);
    setSequenceRepeatCount(0);
    setCurrentAyahRepeatCount(0);
    setPlayingVerse(null);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeEventListener('ended', handleSequenceAudioEnded);
      audioRef.current.addEventListener('ended', handleAudioEnded);
    }
  };

  // Get filtered verses based on range selection
  const getFilteredVerses = (): Verse[] => {
    if (memorizationMode === 'ayah') {
      return verses;
    } else {
      // Range mode: filter verses by start and end ayah
      return verses.filter(v => 
        v.verse_number >= rangeStartAyah && v.verse_number <= rangeEndAyah
      );
    }
  };

  // Update range end when chapter changes or start changes
  useEffect(() => {
    if (memorizationMode === 'range' && chapterInfo) {
      // Ensure end ayah doesn't exceed chapter length
      if (rangeEndAyah > chapterInfo.verses_count) {
        setRangeEndAyah(chapterInfo.verses_count);
      }
      // Ensure start is not greater than end
      if (rangeStartAyah > rangeEndAyah) {
        setRangeStartAyah(rangeEndAyah);
      }
    }
  }, [currentChapter, chapterInfo, memorizationMode, rangeStartAyah, rangeEndAyah]);

  // Swipe handlers for reading mode
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchEndX.current - touchStartX.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe to be recognized

    // Swipe right (drag to right) = next page
    if (swipeDistance > minSwipeDistance && currentPage < 604) {
      setCurrentPage(prev => prev + 1);
      setSlideDirection('right');
      setShowSwipeIndicator(true);
      setTimeout(() => setShowSwipeIndicator(false), 1000);
    }
    // Swipe left (drag to left) = previous page
    else if (swipeDistance < -minSwipeDistance && currentPage > 1) {
      // Don't auto-mark when going backward - user might be reviewing
      setCurrentPage(prev => prev - 1);
      setSlideDirection('left');
      setShowSwipeIndicator(true);
      setTimeout(() => setShowSwipeIndicator(false), 1000);
    }

    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleAudioEnded);
      }
    };
  }, []);

  // Header hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down
        setHeaderVisible(false);
      } else {
        // Scrolling up
        setHeaderVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    if (mode === 'reading') {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [mode]);

  // Show swipe indicator briefly when page loads in reading mode
  useEffect(() => {
    if (mode === 'reading' && !loading) {
      setShowSwipeIndicator(true);
      const timer = setTimeout(() => setShowSwipeIndicator(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [mode, loading]);

  return (
    <div className={`min-h-screen ${nightMode ? 'bg-gradient-to-b from-gray-900 to-gray-800' : 'bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900'}`}>
      {/* Header */}
      <header className={`border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-sm sticky top-0 z-10 transition-transform duration-300 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon">
                <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-emerald-900 dark:text-emerald-100">
                  {language === 'ar' ? chapterInfo?.name_arabic : chapterInfo?.name_simple || 'Al-Fatiha'}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">
                  {chapterInfo ? t.surahMeanings[chapterInfo.chapter_number - 1] : t.surahMeanings[0]}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900" onClick={openDrawer}>
              <Menu className="w-4 h-4 mr-2" />
              {t.surahs}
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
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 md:py-6 max-w-5xl">
        {/* Mode Toggle */}
        <div className="flex justify-between items-center mb-4">
          <div className="inline-flex rounded-lg border border-emerald-200 dark:border-emerald-700 p-1 bg-white dark:bg-emerald-950">
            <button
              onClick={() => setMode('reading')}
              className={`flex items-center gap-2 px-3 md:px-6 py-2 rounded-md transition-colors ${
                mode === 'reading'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:inline">{t.readingMode}</span>
            </button>
            <button
              onClick={() => setMode('memorization')}
              className={`flex items-center gap-2 px-3 md:px-6 py-2 rounded-md transition-colors ${
                mode === 'memorization'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span className="hidden md:inline">{t.memorizationMode}</span>
            </button>
          </div>

          {/* Page/Juz Info - Only show in reading mode */}
          {mode === 'reading' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-700 rounded-lg">
              <span className="text-sm md:text-base text-emerald-600 dark:text-emerald-400">{t.page}</span>
              <span className="text-lg md:text-2xl text-emerald-900 dark:text-emerald-100">{currentPage}</span>
              <span className="text-sm md:text-base text-emerald-600 dark:text-emerald-400">• {t.juz} {Math.ceil(currentPage / 20)}</span>
            </div>
          )}

          {/* Reciter Selection - Only show in memorization mode */}
          {mode === 'memorization' && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-700 rounded-lg">
              <label className="text-sm text-emerald-700 dark:text-emerald-300 whitespace-nowrap hidden md:inline">{t.reciter}:</label>
              <select 
                value={selectedReciter}
                onChange={(e) => setSelectedReciter(Number(e.target.value))}
                className="px-2 md:px-3 py-1 border border-emerald-200 dark:border-emerald-700 rounded text-sm text-emerald-900 dark:text-emerald-100 dark:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[200px] truncate"
                style={{ 
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {RECITERS.map(reciter => (
                  <option key={reciter.id} value={reciter.id} className="truncate">
                    {reciter.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {mode === 'reading' ? (
          /* Reading Mode - Mushaf Style */
          <>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : error ? (
              <Card className="p-8 text-center border-red-200 bg-red-50">
                <p className="text-red-600">{error}</p>
                <Button 
                  onClick={() => fetchPageVerses()} 
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  Try Again
                </Button>
              </Card>
            ) : (
              <>
                {/* Mushaf Page View */}
                <div className="relative">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                      key={currentPage}
                      initial={{ x: slideDirection === 'right' ? '100%' : '-100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: slideDirection === 'right' ? '-100%' : '100%' }}
                      transition={{ 
                        type: 'spring',
                        stiffness: 300,
                        damping: 30
                      }}
                      className="w-full"
                      style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                    >
                      <Card className="border-2 border-emerald-200 dark:border-emerald-700 bg-gradient-to-b from-amber-50/20 to-white dark:from-emerald-950 dark:to-emerald-900 shadow-xl" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                        {/* Decorative top border */}
                        <div className="h-2 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 dark:from-emerald-500 dark:via-amber-600 dark:to-emerald-500 rounded-t-lg"></div>
                        
                        <div className="p-4 md:p-6">
                          {/* Surah Header - show if page starts with a new surah */}
                          {verses.length > 0 && verses[0].verse_number === 1 && (
                            <div className="text-center mb-3 md:mb-4 pb-2 md:pb-3 border-b-2 border-emerald-200">
                              <div className="text-3xl md:text-4xl lg:text-5xl text-emerald-900 mb-1 md:mb-2">{chapterInfo?.name_arabic}</div>
                              <div className="text-xs md:text-sm text-emerald-600">
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

                          {/* Page Footer - Surah name */}
                          <div className="mt-4 md:mt-6 pt-2 md:pt-3 border-t-2 border-emerald-200 dark:border-emerald-700 text-center">
                            <div className="text-sm md:text-base text-emerald-600 dark:text-emerald-400">
                              {language === 'ar' ? chapterInfo?.name_arabic : chapterInfo?.name_simple}
                            </div>
                          </div>
                        </div>

                        {/* Decorative bottom border */}
                        <div className="h-2 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 rounded-b-lg"></div>
                      </Card>
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Spacer to maintain layout height */}
                  <div className="invisible pointer-events-none">
                    <Card className="border-2 border-emerald-200">
                      <div className="h-2"></div>
                      <div className="p-4 md:p-6">
                        {/* Match the actual content structure for proper height */}
                        {verses.length > 0 && verses[0].verse_number === 1 && (
                          <div className="text-center mb-3 md:mb-4 pb-2 md:pb-3 border-b-2 border-emerald-200">
                            <div className="text-3xl md:text-4xl lg:text-5xl text-emerald-900 mb-1 md:mb-2">{chapterInfo?.name_arabic}</div>
                            <div className="text-xs md:text-sm text-emerald-600">
                              {chapterInfo?.revelation_place === 'makkah' ? 'مَكِّيَّةٌ' : 'مَدَنِيَّةٌ'}
                            </div>
                          </div>
                        )}
                        {verses.length > 0 && verses[0].verse_number === 1 && parseInt(verses[0].verse_key.split(':')[0]) !== 9 && parseInt(verses[0].verse_key.split(':')[0]) !== 1 && (
                          <div className="text-center mb-3 md:mb-4">
                            <div className="text-2xl md:text-3xl lg:text-4xl text-emerald-800 dark:text-emerald-300 leading-loose">
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                            </div>
                          </div>
                        )}
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
                        <div className="mt-4 md:mt-6 pt-2 md:pt-3 border-t-2 border-emerald-200 dark:border-emerald-700 text-center">
                          <div className="text-sm md:text-base text-emerald-600">
                            {language === 'ar' ? chapterInfo?.name_arabic : chapterInfo?.name_simple}
                          </div>
                        </div>
                      </div>
                      <div className="h-2"></div>
                    </Card>
                  </div>
                </div>

                {/* Page Navigation */}
                <div className="flex flex-col gap-4 mt-8">
                  <div className="flex justify-between items-center">
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setCurrentPage(Math.min(604, currentPage + 1));
                        setSlideDirection('right');
                      }}
                      disabled={currentPage === 604}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      {t.next} {t.page}
                    </Button>
                    
                    <div className="text-emerald-600 dark:text-emerald-400">
                      {language === 'ar' ? `صفحة ${currentPage} من 604` : `${t.page} ${currentPage} ${t.of} 604`}
                    </div>

                    <Button 
                      variant="outline" 
                      className="border-emerald-600 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
                      onClick={() => {
                        // Don't auto-mark when going backward - user might be reviewing
                        setCurrentPage(Math.max(1, currentPage - 1));
                        setSlideDirection('left');
                      }}
                      disabled={currentPage === 1}
                    >
                      {t.previous} {t.page}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Floating Navigation Buttons - Mobile Only */}
                <div className="md:hidden fixed bottom-6 left-0 right-0 flex justify-between px-4 z-20 pointer-events-none">
                  <Button
                    size="icon"
                    className="pointer-events-auto bg-emerald-600 hover:bg-emerald-700 shadow-lg rounded-full w-14 h-14"
                    onClick={() => {
                      setCurrentPage(Math.min(604, currentPage + 1));
                      setSlideDirection('right');
                    }}
                    disabled={currentPage === 604}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="outline"
                    className="pointer-events-auto bg-white/90 backdrop-blur-sm border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 shadow-lg rounded-full w-14 h-14"
                    onClick={() => {
                      setCurrentPage(Math.max(1, currentPage - 1));
                      setSlideDirection('left');
                    }}
                    disabled={currentPage === 1}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </div>

                {/* Swipe Indicators */}
                <AnimatePresence>
                  {showSwipeIndicator && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.7 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 pointer-events-none z-10 flex items-center justify-between px-4"
                    >
                      <motion.div
                        animate={{ x: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-emerald-600"
                      >
                        <ChevronRight className="w-12 h-12" />
                      </motion.div>
                      <motion.div
                        animate={{ x: [0, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-emerald-600"
                      >
                        <ChevronLeft className="w-12 h-12" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </>
        ) : (
          /* Memorization Mode - Ayah by Ayah */
          <>
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              </div>
            ) : error ? (
              <Card className="p-8 text-center border-red-200 bg-red-50">
                <p className="text-red-600">{error}</p>
                <Button 
                  onClick={() => fetchChapterVerses()} 
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                >
                  Try Again
                </Button>
              </Card>
            ) : (
              <>
                {/* Surah Header */}
                <Card className="p-4 mb-4 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 text-center">
                  <div className="text-4xl text-emerald-900 dark:text-emerald-100 mb-1">{chapterInfo?.name_arabic}</div>
                  <div className="text-xl text-emerald-700 dark:text-emerald-300 mb-1">
                    {language === 'ar' ? chapterInfo?.name_arabic : chapterInfo?.name_simple}
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400">
                    {chapterInfo && t.surahMeanings[chapterInfo.chapter_number - 1]} • {chapterInfo?.revelation_place === 'makkah' ? (language === 'ar' ? 'مكية' : 'Meccan') : (language === 'ar' ? 'مدنية' : 'Medinan')} • {chapterInfo?.verses_count} {language === 'ar' ? 'آية' : 'Ayahs'}
                  </div>
                </Card>

                {/* Memorization Sub-Mode Toggle */}
                <div className="mb-4">
                  <div className="inline-flex w-full md:w-auto rounded-lg border border-emerald-200 dark:border-emerald-700 p-1 bg-white dark:bg-emerald-950">
                    <button
                      onClick={() => {
                        setMemorizationMode('ayah');
                        stopSequence();
                      }}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${
                        memorizationMode === 'ayah'
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                          : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900'
                      }`}
                    >
                      {t.byAyah}
                    </button>
                    <button
                      onClick={() => {
                        setMemorizationMode('range');
                        stopSequence();
                      }}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${
                        memorizationMode === 'range'
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                          : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900'
                      }`}
                    >
                      {t.byRange}
                    </button>
                  </div>
                </div>

                {/* Range Controls - Only show in range mode */}
                {memorizationMode === 'range' && (
                  <Card className="p-4 mb-4 border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/30">
                    {/* Mobile: 2-column grid layout, Desktop: row layout */}
                    <div className="grid grid-cols-2 md:flex md:flex-row gap-3 md:gap-4 md:items-end">
                      <div className="md:flex-1">
                        <label className="text-sm text-emerald-700 dark:text-emerald-300 mb-1 block">{t.startAyah}</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max={chapterInfo?.verses_count || 7}
                          value={rangeStartAyah}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setRangeStartAyah(Math.max(1, Math.min(chapterInfo?.verses_count || 7, val)));
                          }}
                          className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded text-gray-900 dark:text-gray-100 dark:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                        />
                      </div>
                      <div className="md:flex-1">
                        <label className="text-sm text-emerald-700 dark:text-emerald-300 mb-1 block">{t.endAyah}</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={rangeStartAyah}
                          max={chapterInfo?.verses_count || 7}
                          value={rangeEndAyah}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || rangeStartAyah;
                            setRangeEndAyah(Math.max(rangeStartAyah, Math.min(chapterInfo?.verses_count || 7, val)));
                          }}
                          className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded text-gray-900 dark:text-gray-100 dark:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                        />
                      </div>
                      <div className="md:flex-1">
                        <label className="text-sm text-emerald-700 dark:text-emerald-300 mb-1 block">{t.repeatRange}</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="10"
                          value={globalRepeatCount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setGlobalRepeatCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                          className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded text-gray-900 dark:text-gray-100 dark:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                        />
                      </div>
                      <div className="md:flex-1">
                        <label className="text-sm text-emerald-700 dark:text-emerald-300 mb-1 block">{t.repeatEachAyah}</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="10"
                          value={perAyahRepeatCount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setPerAyahRepeatCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                          className="w-full px-3 py-2 border border-emerald-200 dark:border-emerald-700 rounded text-gray-900 dark:text-gray-100 dark:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                        />
                      </div>
                    </div>
                    
                    {/* Play Button - Full width on mobile */}
                    <Button
                      onClick={playSequence}
                      className={`w-full mt-3 ${
                        isPlayingSequence
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isPlayingSequence ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Stop
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          {t.playRange}
                        </>
                      )}
                    </Button>
                    
                    {isPlayingSequence && (
                      <div className="mt-3 text-sm text-amber-600 text-center">
                        Playing cycle {sequenceRepeatCount + 1} of {globalRepeatCount} • Ayah {verses.find(v => v.verse_key === playingVerse)?.verse_number || currentSequenceIndex + 1} (repetition {currentAyahRepeatCount + 1}/{perAyahRepeatCount})
                      </div>
                    )}
                  </Card>
                )}

                {/* Bismillah - except for Surah 1 (already has it as verse 1) and Surah 9 */}
                {currentChapter !== 1 && currentChapter !== 9 && (
                  <div className="text-center mb-4">
                    <div className="text-3xl text-emerald-800 dark:text-emerald-300">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
                  </div>
                )}

                {/* Individual Ayahs */}
                <div className="space-y-3">{getFilteredVerses().map((verse) => (
                    <Card 
                      key={verse.id}
                      id={`ayah-${verse.verse_number}`}
                      className={`p-4 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 transition-all ${
                        memorizedAyahs.has(verse.verse_number) ? 'border-amber-400 dark:border-amber-500 border-2' : ''
                      } ${
                        playingVerse === verse.verse_key && isPlayingSequence ? 'ring-2 ring-amber-500 dark:ring-amber-400 bg-amber-50 dark:bg-amber-900/30' : ''
                      } ${
                        scrollToAyah === verse.verse_number ? 'ring-4 ring-emerald-500 dark:ring-emerald-400 bg-emerald-50 dark:bg-emerald-900/50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Ayah Number */}
                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          playingVerse === verse.verse_key && isPlayingSequence 
                            ? 'border-amber-600 dark:border-amber-500 bg-amber-600 dark:bg-amber-500 text-white' 
                            : 'border-emerald-600 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {verse.verse_number}
                        </div>

                        <div className="flex-1">
                          {/* Arabic Text */}
                          <div className="text-right mb-3">
                            <p className="text-2xl md:text-3xl leading-loose text-gray-900 dark:text-gray-100">{verse.text_uthmani}</p>
                          </div>

                          {/* Translation */}
                          {verse.translations && verse.translations.length > 0 && (
                            <div className="mb-3">
                              <p className="text-sm md:text-base text-gray-700 dark:text-gray-300 leading-relaxed">{verse.translations[0].text}</p>
                            </div>
                          )}

                          {/* Audio Controls - Only in Ayah mode */}
                          {memorizationMode === 'ayah' && (
                            <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-emerald-100">
                            <Button
                              size="sm"
                              onClick={() => playVerse(verse.verse_key)}
                              className={`${
                                playingVerse === verse.verse_key
                                  ? 'bg-amber-600 hover:bg-amber-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              {playingVerse === verse.verse_key ? (
                                <Pause className="w-4 h-4 mr-2" />
                              ) : (
                                <Play className="w-4 h-4 mr-2" />
                              )}
                              {playingVerse === verse.verse_key ? t.pause : t.play}
                            </Button>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-emerald-600 dark:text-emerald-400">{t.repeat}</label>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={repeatCounts[verse.verse_key] || 1}
                                onChange={(e) => setRepetitionCount(verse.verse_key, parseInt(e.target.value) || 1)}
                                className="w-16 px-2 py-1 border border-emerald-200 dark:border-emerald-700 rounded text-center text-gray-900 dark:text-gray-100 dark:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                              />
                              <span className="text-sm text-emerald-600 dark:text-emerald-400">{t.times}</span>
                            </div>
                            {playingVerse === verse.verse_key && (
                              <div className="text-sm text-amber-600 dark:text-amber-400">
                                Playing {currentRepeatRef.current + 1} of {repeatCounts[verse.verse_key] || 1}
                              </div>
                            )}
                          </div>
                          )}

                           {/* Progress Actions */}
                           <div className="flex gap-4">
                             <label className="flex items-center gap-2 cursor-pointer">
                               <Checkbox
                                 checked={memorizedAyahs.has(verse.verse_number)}
                                 onCheckedChange={() => toggleMemorized(verse.verse_number)}
                               />
                               <span className="text-sm text-amber-600">{t.markAsMemorized}</span>
                             </label>
                           </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-4">
                  {/* Next Surah - on LEFT (Arabic RTL reading direction) */}
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                    onClick={() => {
                      console.log('Next button clicked. Current chapter:', currentChapter);
                      setCurrentChapter(Math.min(114, currentChapter + 1));
                    }}
                    disabled={currentChapter === 114}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {t.nextSurah}
                  </Button>
                  {/* Previous Surah - on RIGHT (Arabic RTL reading direction) */}
                  <Button 
                    variant="outline" 
                    className="border-emerald-600 dark:border-emerald-600 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
                    onClick={() => {
                      console.log('Previous button clicked. Current chapter:', currentChapter);
                      setCurrentChapter(Math.max(1, currentChapter - 1));
                    }}
                    disabled={currentChapter === 1}
                  >
                    {t.previousSurah}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Drawer for Surah Selection */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setDrawerOpen(false)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-600 to-emerald-700 flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl text-white">{t.selectSurah}</h2>
                    <p className="text-sm text-emerald-100">114 {t.surahs}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Surah List */}
              <div className="flex-1 overflow-y-auto">
                {chaptersLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                ) : (
                  <div className="p-2">
                    {allChapters.map(chapter => (
                      <motion.button
                        key={chapter.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => selectChapter(chapter)}
                        className={`w-full text-left p-4 mb-2 rounded-lg border-2 transition-all ${ 
                          currentChapter === chapter.chapter_number 
                            ? 'bg-emerald-50 border-emerald-600' 
                            : 'bg-white border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {/* Number Badge */}
                            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              {chapter.chapter_number}
                            </div>
                            
                            {/* Surah Info */}
                            <div>
                              <div className="text-emerald-900">
                                {language === 'ar' ? chapter.name_arabic : chapter.name_simple}
                              </div>
                              <div className="text-xs text-emerald-600">
                                {t.surahMeanings[chapter.chapter_number - 1]} • {chapter.verses_count} {language === 'ar' ? 'آية' : 'Ayahs'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Arabic Name */}
                          <div className="text-right">
                            <div className="text-2xl text-emerald-900">{chapter.name_arabic}</div>
                            <div className="text-xs text-emerald-600">
                              {chapter.revelation_place === 'makkah' ? (language === 'ar' ? 'مكية' : 'Meccan') : (language === 'ar' ? 'مدنية' : 'Medinan')}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}