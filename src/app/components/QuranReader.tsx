import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Book, ChevronLeft, ChevronRight, Home, Menu, BookOpen, Brain, Loader2, Play, Pause, RotateCcw, X, Moon, Sun, ArrowLeft, AudioLines, Check, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { getVersesByPage, getVersesByChapter, getChapter, getChapters, Verse, Chapter, RECITERS, getVerseAudioUrl, getMushafPageImageUrl } from '../../services/quranApi';
import { motion, AnimatePresence } from 'motion/react';
import { markAyahAsMemorized, unmarkAyahAsMemorized, isAyahMemorized, getLastMemorizedAyah, markPageAsMemorized as markPageAyahsAsMemorized, unmarkPageAsMemorized, isPageMemorized, getJoinedMemorizationGroups } from '../utils/localStorage';
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
  
  // Memorization view: learning vs testing
  const [memorizationView, setMemorizationView] = useState<'learning' | 'testing'>(() => {
    const saved = localStorage.getItem('memorizationView');
    return (saved === 'learning' || saved === 'testing') ? saved : 'learning';
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
  const [isCurrentPageMemorized, setIsCurrentPageMemorized] = useState(false);
  
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
  const [isReciterSheetOpen, setIsReciterSheetOpen] = useState(false); // Bottom sheet for reciter selection
  const [isRepeatSheetExpanded, setIsRepeatSheetExpanded] = useState(true); // Control repeat bottom sheet expand/collapse
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

  // Save memorization view
  useEffect(() => {
    localStorage.setItem('memorizationView', memorizationView);
  }, [memorizationView]);

  // Sync memorization page with current surah when switching to page mode (only once)
  const hasSetInitialPageRef = useRef(false);
  useEffect(() => {
    const initializePageMode = async () => {
      if (mode === 'memorization' && memorizationMode === 'page' && !hasSetInitialPageRef.current) {
        // If chapterInfo is not loaded yet, fetch it first
        if (!chapterInfo && currentChapter >= 1 && currentChapter <= 114) {
          try {
            const chapter = await getChapter(currentChapter);
            setChapterInfo(chapter);
            // Set to the first page of the current surah
            if (chapter.pages && chapter.pages.length > 0) {
              setMemorizationPage(chapter.pages[0]);
              hasSetInitialPageRef.current = true;
            }
          } catch (err) {
            console.error('Failed to load chapter info:', err);
          }
        } else if (chapterInfo?.pages && chapterInfo.pages.length > 0) {
          // ChapterInfo already loaded, just set the page
          setMemorizationPage(chapterInfo.pages[0]);
          hasSetInitialPageRef.current = true;
        }
      }
    };
    
    initializePageMode();
    
    // Reset the flag when switching away from page mode
    if (memorizationMode !== 'page') {
      hasSetInitialPageRef.current = false;
    }
  }, [memorizationMode, mode, chapterInfo, currentChapter]);

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

  // Fetch verses for memorization page mode
  const fetchMemorizationPageVerses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVersesByPage(memorizationPage);
      setVerses(data.verses);
      
      // Get chapter info for the first verse on the page
      if (data.verses.length > 0) {
        const chapterNumber = parseInt(data.verses[0].verse_key.split(':')[0]);
        const chapter = await getChapter(chapterNumber);
        setChapterInfo(chapter);
        // Update currentChapter to stay in sync with the page
        setCurrentChapter(chapterNumber);
      }
      
    } catch (err) {
      setError('Failed to load Quran data. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [memorizationPage]);

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

  // Fetch verses when chapter changes (Memorization mode - ayah/range)
  useEffect(() => {
    console.log('Memorization useEffect triggered. mode:', mode, 'currentChapter:', currentChapter);
    if (mode === 'memorization' && memorizationMode !== 'page') {
      // Only fetch if currentChapter is valid
      if (currentChapter && !isNaN(currentChapter) && currentChapter >= 1 && currentChapter <= 114) {
        console.log('Calling fetchChapterVerses for chapter:', currentChapter);
        fetchChapterVerses();
      } else {
        console.log('Chapter validation failed:', { currentChapter, isNaN: isNaN(currentChapter) });
      }
    }
  }, [currentChapter, mode, memorizationMode, fetchChapterVerses]);

  // Fetch verses when page changes (Memorization mode - page)
  useEffect(() => {
    // Only fetch if we're in page mode AND we've set the initial page (flag is true)
    // This prevents fetching page 1 before we've synced to the current surah's first page
    if (mode === 'memorization' && memorizationMode === 'page' && memorizationPage && hasSetInitialPageRef.current) {
      fetchMemorizationPageVerses();
    }
  }, [memorizationPage, mode, memorizationMode, fetchMemorizationPageVerses]);

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

  // Check if current page is memorized when verses or page changes
  useEffect(() => {
    if (mode === 'memorization' && memorizationMode === 'page' && verses.length > 0) {
      setIsCurrentPageMemorized(isPageMemorized(memorizationPage, verses));
    }
  }, [mode, memorizationMode, memorizationPage, verses]);

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
      // In memorization mode: check if user is enrolled in this surah's group
      const chapterNum = chapter.chapter_number || chapter.id;
      const memorizationGroups = getJoinedMemorizationGroups();
      const isEnrolled = memorizationGroups.includes(`surah-${chapterNum}`);
      
      if (isEnrolled) {
        // User is enrolled: navigate directly to memorization view
        console.log('Memorization mode: user enrolled, setting chapter to', chapterNum);
        setCurrentChapter(chapterNum);
      } else {
        // User is NOT enrolled: navigate to groups page for this surah
        console.log('Memorization mode: user not enrolled, redirecting to groups page');
        window.location.href = `/groups?filter=memorization&tab=discover&surah=${chapterNum}`;
        return;
      }
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

    // Swipe right (drag to right) = next page (like turning page forward)
    if (swipeDistance > minSwipeDistance && currentPage < 604) {
      setCurrentPage(prev => prev + 1);
      setSlideDirection('left');
      setShowSwipeIndicator(true);
      setTimeout(() => setShowSwipeIndicator(false), 1000);
    }
    // Swipe left (drag to left) = previous page (like turning page backward)
    else if (swipeDistance < -minSwipeDistance && currentPage > 1) {
      // Don't auto-mark when going backward - user might be reviewing
      setCurrentPage(prev => prev - 1);
      setSlideDirection('right');
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
      <header className={`border-b ${mode === 'memorization' ? 'border-violet-100 dark:border-violet-800 bg-white/80 dark:bg-violet-950/80' : 'border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80'} backdrop-blur-sm sticky top-0 z-10 transition-transform duration-300 ${headerVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to={mode === 'memorization' ? '/memorization' : '/dashboard'}>
              <Button variant="ghost" size="icon">
                {mode === 'memorization' ? (
                  <ArrowLeft className={`w-5 h-5 text-violet-600 dark:text-violet-400`} />
                ) : (
                  <Home className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                )}
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              {mode === 'memorization' ? (
                <Brain className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              ) : (
                <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              )}
              <div>
                <div className={mode === 'memorization' ? 'text-violet-900 dark:text-violet-100' : 'text-emerald-900 dark:text-emerald-100'}>
                  {language === 'ar' ? chapterInfo?.name_arabic : chapterInfo?.name_simple || 'Al-Fatiha'}
                </div>
                <div className={`text-xs ${mode === 'memorization' ? 'text-violet-600 dark:text-violet-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {chapterInfo ? t.surahMeanings[chapterInfo.chapter_number - 1] : t.surahMeanings[0]}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className={mode === 'memorization' 
                ? 'border-violet-600 dark:border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900' 
                : 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900'
              } 
              onClick={openDrawer}
            >
              <Menu className="w-4 h-4 mr-2" />
              {t.surahs}
            </Button>
            {onToggleDarkMode && (
              <Button 
                variant="outline" 
                size="icon"
                className={mode === 'memorization'
                  ? 'border-violet-600 dark:border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900'
                  : 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900'
                }
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

      <div className={`container mx-auto px-4 py-4 md:py-6 max-w-5xl ${mode === 'memorization' && (memorizationMode === 'page' || memorizationMode === 'range') ? 'pb-32 md:pb-6' : ''}`}>
        {/* Mode Toggle */}
        <div className="flex justify-between items-center mb-4">
          {mode === 'reading' ? (
            // Reading mode: show "Reading Mode" and "Memorization Mode" toggle
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
          ) : (
            // Memorization mode: show "Learning" and "Testing" toggle with violet colors
            <div className="inline-flex rounded-lg border border-violet-200 dark:border-violet-700 p-1 bg-white dark:bg-violet-950">
              <button
                onClick={() => setMemorizationView('learning')}
                className={`flex items-center gap-2 px-3 md:px-6 py-2 rounded-md transition-colors ${
                  memorizationView === 'learning'
                    ? 'bg-violet-600 dark:bg-violet-500 text-white'
                    : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>{t.learning}</span>
              </button>
              <button
                onClick={() => setMemorizationView('testing')}
                className={`flex items-center gap-2 px-3 md:px-6 py-2 rounded-md transition-colors ${
                  memorizationView === 'testing'
                    ? 'bg-violet-600 dark:bg-violet-500 text-white'
                    : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{t.testing}</span>
              </button>
            </div>
          )}

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
            <div className="flex items-center gap-2">
              {/* Desktop: Full label + dropdown */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-white dark:bg-violet-950 border border-violet-200 dark:border-violet-700 rounded-lg">
                <label className="text-sm text-violet-700 dark:text-violet-300 whitespace-nowrap">{t.reciter}:</label>
                <select 
                  value={selectedReciter}
                  onChange={(e) => setSelectedReciter(Number(e.target.value))}
                  className="px-3 py-1 border border-violet-200 dark:border-violet-700 rounded text-sm text-violet-900 dark:text-violet-100 dark:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 max-w-[200px] truncate"
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
              
              {/* Mobile: Icon button that opens bottom sheet */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsReciterSheetOpen(true)}
                className="md:hidden h-11 w-11 rounded-full bg-white dark:bg-violet-950 border-2 border-violet-200 dark:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900 text-violet-600 dark:text-violet-400"
              >
                <AudioLines className="w-5 h-5" />
              </Button>
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
            ) : memorizationView === 'testing' ? (
              /* Testing Mode - Placeholder for future implementation */
              <>
                {/* Surah Header */}
                <Card className="p-4 mb-4 border-violet-100 dark:border-violet-800 dark:bg-violet-950/50 text-center">
                  <div className="text-4xl text-violet-900 dark:text-violet-100 mb-1">{chapterInfo?.name_arabic}</div>
                  <div className="text-xl text-violet-700 dark:text-violet-300 mb-1">
                    {language === 'ar' ? chapterInfo?.name_arabic : chapterInfo?.name_simple}
                  </div>
                  <div className="text-violet-600 dark:text-violet-400">
                    {chapterInfo && t.surahMeanings[chapterInfo.chapter_number - 1]} • {chapterInfo?.revelation_place === 'makkah' ? (language === 'ar' ? 'مكية' : 'Meccan') : (language === 'ar' ? 'مدنية' : 'Medinan')} • {chapterInfo?.verses_count} {language === 'ar' ? 'آية' : 'Ayahs'}
                  </div>
                </Card>

                {/* Testing Mode Placeholder */}
                <Card className="p-12 text-center border-violet-200 dark:border-violet-700 dark:bg-violet-950/30">
                  <div className="max-w-md mx-auto">
                    <div className="text-6xl mb-4">🧪</div>
                    <h3 className="text-2xl font-bold text-violet-900 dark:text-violet-100 mb-3">
                      {language === 'ar' ? 'وضع الاختبار' : 'Testing Mode'}
                    </h3>
                    <p className="text-violet-700 dark:text-violet-300 mb-6">
                      {language === 'ar' 
                        ? 'وضع الاختبار قريبًا! سيتيح لك هذا الوضع اختبار حفظك والتحقق من الاحتفاظ به من خلال نظام تكرار متباعد ذكي.'
                        : 'Testing mode coming soon! This mode will allow you to test your memorization and verify retention through smart spaced repetition.'}
                    </p>
                    <div className="bg-violet-50 dark:bg-violet-900/30 rounded-lg p-4 text-sm text-violet-600 dark:text-violet-400">
                      <p className="mb-2 font-semibold">{language === 'ar' ? '📋 الميزات القادمة:' : '📋 Upcoming Features:'}</p>
                      <ul className="text-right space-y-1">
                        <li>• {language === 'ar' ? 'اختبار الاستدعاء الذاتي' : 'Self-testing with recall'}</li>
                        <li>• {language === 'ar' ? 'جدول المراجعة الذكي' : 'Smart review scheduling'}</li>
                        <li>• {language === 'ar' ? 'تتبع الآيات المنسية' : 'Lapsed verse tracking'}</li>
                        <li>• {language === 'ar' ? 'قياس قوة الحفظ' : 'Memorization strength metrics'}</li>
                      </ul>
                    </div>
                    <Button
                      onClick={() => setMemorizationView('learning')}
                      className="mt-6 bg-violet-600 hover:bg-violet-700 dark:bg-violet-700 dark:hover:bg-violet-600"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'العودة إلى وضع التعلم' : 'Back to Learning Mode'}
                    </Button>
                  </div>
                </Card>
              </>
            ) : (
              <>
                {/* Surah Header */}
                <Card className="p-4 mb-4 border-violet-100 dark:border-violet-800 dark:bg-violet-950/50 text-center">
                  <div className="text-4xl text-violet-900 dark:text-violet-100 mb-1">{chapterInfo?.name_arabic}</div>
                  <div className="text-xl text-violet-700 dark:text-violet-300 mb-1">
                    {language === 'ar' ? chapterInfo?.name_arabic : chapterInfo?.name_simple}
                  </div>
                  <div className="text-violet-600 dark:text-violet-400">
                    {chapterInfo && t.surahMeanings[chapterInfo.chapter_number - 1]} • {chapterInfo?.revelation_place === 'makkah' ? (language === 'ar' ? 'مكية' : 'Meccan') : (language === 'ar' ? 'مدنية' : 'Medinan')} • {chapterInfo?.verses_count} {language === 'ar' ? 'آية' : 'Ayahs'}
                  </div>
                </Card>

                {/* Memorization Sub-Mode Toggle */}
                <div className="mb-4">
                  <div className="inline-flex w-full md:w-auto rounded-lg border border-violet-200 dark:border-violet-700 p-1 bg-white dark:bg-violet-950">
                    <button
                      onClick={() => {
                        setMemorizationMode('ayah');
                        stopSequence();
                      }}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${
                        memorizationMode === 'ayah'
                          ? 'bg-violet-600 dark:bg-violet-500 text-white'
                          : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900'
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
                          ? 'bg-violet-600 dark:bg-violet-500 text-white'
                          : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900'
                      }`}
                    >
                      {t.byRange}
                    </button>
                    <button
                      onClick={() => {
                        setMemorizationMode('page');
                        stopSequence();
                      }}
                      className={`flex-1 md:flex-none px-4 py-2 rounded-md transition-colors ${
                        memorizationMode === 'page'
                          ? 'bg-violet-600 dark:bg-violet-500 text-white'
                          : 'text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900'
                      }`}
                    >
                      {t.byPage}
                    </button>
                  </div>
                </div>

                {/* Range Controls - Only show in range mode, hidden on mobile */}
                {memorizationMode === 'range' && (
                  <Card className="hidden md:block p-4 mb-4 border-violet-200 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/30">
                    {/* Mobile: 2-column grid layout, Desktop: row layout */}
                    <div className="grid grid-cols-2 md:flex md:flex-row gap-3 md:gap-4 md:items-end">
                      <div className="md:flex-1">
                        <label className="text-sm text-violet-700 dark:text-violet-300 mb-1 block">{t.startAyah}</label>
                        <Select
                          value={rangeStartAyah.toString()}
                          onValueChange={(value) => {
                            const newStart = parseInt(value);
                            setRangeStartAyah(newStart);
                            // Adjust end if it's less than new start
                            if (rangeEndAyah < newStart) {
                              setRangeEndAyah(newStart);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full border-violet-200 dark:border-violet-700 text-gray-900 dark:text-gray-100 dark:bg-violet-900 focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {Array.from({ length: chapterInfo?.verses_count || 7 }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:flex-1">
                        <label className="text-sm text-violet-700 dark:text-violet-300 mb-1 block">{t.endAyah}</label>
                        <Select
                          value={rangeEndAyah.toString()}
                          onValueChange={(value) => setRangeEndAyah(parseInt(value))}
                        >
                          <SelectTrigger className="w-full border-violet-200 dark:border-violet-700 text-gray-900 dark:text-gray-100 dark:bg-violet-900 focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {Array.from({ length: chapterInfo?.verses_count || 7 }, (_, i) => i + 1)
                              .filter(num => num >= rangeStartAyah)
                              .map((num) => (
                                <SelectItem key={num} value={num.toString()}>
                                  {num}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:flex-1">
                        <label className="text-sm text-violet-700 dark:text-violet-300 mb-1 block">{t.repeatRange}</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="10"
                          value={globalRepeatCount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setGlobalRepeatCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                          className="w-full px-3 py-2 border border-violet-200 dark:border-violet-700 rounded text-gray-900 dark:text-gray-100 dark:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400"
                        />
                      </div>
                      <div className="md:flex-1">
                        <label className="text-sm text-violet-700 dark:text-violet-300 mb-1 block">{t.repeatEachAyah}</label>
                        <input
                          type="number"
                          inputMode="numeric"
                          min="1"
                          max="10"
                          value={perAyahRepeatCount}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setPerAyahRepeatCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                          className="w-full px-3 py-2 border border-violet-200 dark:border-violet-700 rounded text-gray-900 dark:text-gray-100 dark:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400"
                        />
                      </div>
                    </div>
                    
                    {/* Play Button - Full width on mobile */}
                    <Button
                      onClick={playSequence}
                      className={`w-full mt-3 ${
                        isPlayingSequence
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-violet-600 hover:bg-violet-700'
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

                {/* Page Mode - Show Mushaf page image for memorization */}
                {memorizationMode === 'page' && (
                  <>
                    {/* Page Navigation Controls + Mark as Memorized */}
                    <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
                      {/* Next Page - on LEFT (Arabic RTL reading direction) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMemorizationPage(Math.min(604, memorizationPage + 1))}
                        disabled={memorizationPage === 604}
                        className="border-violet-600 dark:border-violet-600 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        {t.next}
                      </Button>
                      
                      <div className="flex items-center gap-3">
                        {/* Page Number Input */}
                        <div className="flex items-center gap-2">
                          <span className="text-violet-700 dark:text-violet-300 text-sm">{t.page}</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="604"
                            value={memorizationPage}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setMemorizationPage(Math.max(1, Math.min(604, val)));
                            }}
                            className="w-16 px-2 py-1 text-center border border-violet-200 dark:border-violet-700 rounded text-gray-900 dark:text-gray-100 dark:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400"
                          />
                          <span className="text-violet-600 dark:text-violet-400 text-sm">{t.of} 604</span>
                        </div>
                        
                        {/* Mark as Memorized Checkbox */}
                        <div className="hidden md:flex items-center gap-2 ml-2">
                          <Checkbox
                            id={`page-${memorizationPage}-memorized`}
                            checked={isCurrentPageMemorized}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                markPageAyahsAsMemorized(memorizationPage, verses);
                              } else {
                                unmarkPageAsMemorized(memorizationPage, verses);
                              }
                              setIsCurrentPageMemorized(checked as boolean);
                            }}
                            className="border-violet-600 data-[state=checked]:bg-violet-600"
                          />
                          <label
                            htmlFor={`page-${memorizationPage}-memorized`}
                            className="text-sm text-violet-700 dark:text-violet-300 cursor-pointer"
                          >
                            {t.markAsMemorized}
                          </label>
                        </div>
                      </div>
                      
                      {/* Previous Page - on RIGHT (Arabic RTL reading direction) */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setMemorizationPage(Math.max(1, memorizationPage - 1))}
                        disabled={memorizationPage === 1}
                        className="border-violet-600 dark:border-violet-600 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900"
                      >
                        {t.previous}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    
                    {/* Mark as Memorized - Mobile Only */}
                    <div className="flex md:hidden items-center justify-center gap-2 mb-4">
                      <Checkbox
                        id={`page-${memorizationPage}-memorized-mobile`}
                        checked={isCurrentPageMemorized}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            markPageAyahsAsMemorized(memorizationPage, verses);
                          } else {
                            unmarkPageAsMemorized(memorizationPage, verses);
                          }
                          setIsCurrentPageMemorized(checked as boolean);
                        }}
                        className="border-violet-600 data-[state=checked]:bg-violet-600"
                      />
                      <label
                        htmlFor={`page-${memorizationPage}-memorized-mobile`}
                        className="text-sm text-violet-700 dark:text-violet-300 cursor-pointer"
                      >
                        {t.markAsMemorized}
                      </label>
                    </div>
                    
                    {/* Repetition Controls - Desktop Version (hidden on mobile) */}
                    <Card className="hidden md:block p-4 mb-4 border-violet-200 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-900/30">
                      <div className="grid grid-cols-2 md:flex md:flex-row gap-3 md:gap-4 md:items-end">
                        <div className="md:flex-1">
                          <label className="text-sm text-violet-700 dark:text-violet-300 mb-1 block">{t.repeatRange}</label>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="10"
                            value={globalRepeatCount}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setGlobalRepeatCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                            className="w-full px-3 py-2 border border-violet-200 dark:border-violet-700 rounded text-gray-900 dark:text-gray-100 dark:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400"
                          />
                        </div>
                        <div className="md:flex-1">
                          <label className="text-sm text-violet-700 dark:text-violet-300 mb-1 block">{t.repeatEachAyah}</label>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="10"
                            value={perAyahRepeatCount}
                            onFocus={(e) => e.target.select()}
                            onChange={(e) => setPerAyahRepeatCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                            className="w-full px-3 py-2 border border-violet-200 dark:border-violet-700 rounded text-gray-900 dark:text-gray-100 dark:bg-violet-900 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400"
                          />
                        </div>
                      </div>
                      
                      <Button
                        onClick={playSequence}
                        className={`w-full mt-3 ${
                          isPlayingSequence
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-violet-600 hover:bg-violet-700'
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
                    
                    {/* Mushaf Page Image with Swipe Support */}
                    <div 
                      className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4 select-none touch-pan-y"
                      onTouchStart={(e) => {
                        touchStartX.current = e.touches[0].clientX;
                      }}
                      onTouchMove={(e) => {
                        touchEndX.current = e.touches[0].clientX;
                      }}
                      onTouchEnd={() => {
                        const diff = touchStartX.current - touchEndX.current;
                        const threshold = 50;
                        
                        if (Math.abs(diff) > threshold) {
                          if (diff > 0) {
                            // Swiped left - go to next page
                            if (memorizationPage < 604) {
                              setMemorizationPage(memorizationPage + 1);
                            }
                          } else {
                            // Swiped right - go to previous page
                            if (memorizationPage > 1) {
                              setMemorizationPage(memorizationPage - 1);
                            }
                          }
                        }
                      }}
                    >
                      <img 
                        src={getMushafPageImageUrl(memorizationPage, false)} 
                        alt={`${t.page} ${memorizationPage}`}
                        className="w-full h-auto block dark:invert"
                        loading="lazy"
                      />
                    </div>
                  </>
                )}

                {/* Bismillah - except for Surah 1 (already has it as verse 1) and Surah 9 - Only show in ayah/range mode */}
                {memorizationMode !== 'page' && currentChapter !== 1 && currentChapter !== 9 && (
                  <div className="text-center mb-4">
                    <div className="text-3xl text-emerald-800 dark:text-emerald-300">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
                  </div>
                )}

                {/* Individual Ayahs - Only show in ayah/range mode */}
                {memorizationMode !== 'page' && (
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
                )}

                {/* Navigation - Only show in ayah/range mode */}
                {memorizationMode !== 'page' && (
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
                )}
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

      {/* Mobile Reciter Selection Bottom Sheet */}
      <AnimatePresence>
        {isReciterSheetOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setIsReciterSheetOpen(false)}
            />
            
            {/* Bottom Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl z-50 md:hidden max-h-[70vh] overflow-hidden"
            >
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {language === 'ar' ? 'اختر القارئ' : 'Select Reciter'}
                </h3>
              </div>
              
              {/* Reciter List */}
              <div className="overflow-y-auto max-h-[calc(70vh-120px)]">
                {RECITERS.map((reciter) => (
                  <button
                    key={reciter.id}
                    onClick={() => {
                      setSelectedReciter(reciter.id);
                      setIsReciterSheetOpen(false);
                    }}
                    className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${
                      selectedReciter === reciter.id
                        ? 'bg-purple-50 dark:bg-purple-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className={`text-base ${
                      selectedReciter === reciter.id
                        ? 'text-purple-700 dark:text-purple-300 font-semibold'
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {reciter.name}
                    </span>
                    {selectedReciter === reciter.id && (
                      <Check className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Repeat Controls Bottom Sheet - Fixed at bottom, only on mobile in page/range mode */}
      {mode === 'memorization' && (memorizationMode === 'page' || memorizationMode === 'range') && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
          <motion.div
            initial={false}
            animate={{ 
              y: isRepeatSheetExpanded ? 0 : 'calc(100% - 72px)'
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white dark:bg-violet-950 border-t-2 border-violet-200 dark:border-violet-700 shadow-2xl rounded-t-3xl overflow-hidden"
          >
            {/* Collapsed Mini Player */}
            <div 
              onClick={() => setIsRepeatSheetExpanded(!isRepeatSheetExpanded)}
              className="px-4 py-4 flex items-center justify-between cursor-pointer active:bg-violet-50 dark:active:bg-violet-900/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    playSequence();
                  }}
                  className={`h-12 w-12 rounded-full shadow-lg ${
                    isPlayingSequence
                      ? 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700'
                      : 'bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600'
                  }`}
                >
                  {isPlayingSequence ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white" />
                  )}
                </Button>
                
                <div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                    {language === 'ar' ? 'وضع التكرار' : 'Repeat Mode'}
                  </div>
                  {isPlayingSequence ? (
                    <div className="text-xs text-amber-600 dark:text-amber-400">
                      {language === 'ar' 
                        ? `الدورة ${sequenceRepeatCount + 1} من ${globalRepeatCount}`
                        : `Cycle ${sequenceRepeatCount + 1} of ${globalRepeatCount}`}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {memorizationMode === 'range' && (
                        <span>{language === 'ar' ? `${rangeStartAyah}-${rangeEndAyah}` : `${rangeStartAyah}-${rangeEndAyah}`} • </span>
                      )}
                      {globalRepeatCount}× {language === 'ar' ? 'المقطع' : 'Range'} • {perAyahRepeatCount}× {language === 'ar' ? 'الآية' : 'Ayah'}
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRepeatSheetExpanded(!isRepeatSheetExpanded);
                }}
                className="text-gray-600 dark:text-gray-400"
              >
                {isRepeatSheetExpanded ? (
                  <ChevronDown className="w-5 h-5" />
                ) : (
                  <ChevronUp className="w-5 h-5" />
                )}
              </Button>
            </div>

            {/* Expanded Controls */}
            <AnimatePresence>
              {isRepeatSheetExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-6 pt-2 border-t border-violet-100 dark:border-violet-800"
                >
                  {/* Handle Bar */}
                  <div className="flex justify-center -mt-1 mb-4">
                    <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  </div>

                  {/* Range Mode: From/To Ayah Selectors */}
                  {memorizationMode === 'range' && (
                    <div className="mb-5">
                      <label className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-2 block">
                        {language === 'ar' ? 'اختر المقطع' : 'Select Range'}
                      </label>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {/* From Ayah */}
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 block">
                            {t.startAyah}
                          </label>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setRangeStartAyah(Math.max(1, rangeStartAyah - 1))}
                              disabled={rangeStartAyah <= 1}
                              className="h-10 w-10 rounded-lg border-2 border-violet-300 dark:border-violet-600 disabled:opacity-40 shrink-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            
                            <div className="flex-1 text-center bg-violet-50 dark:bg-violet-900/50 rounded-lg py-2">
                              <div className="text-xl font-bold text-violet-900 dark:text-violet-100">
                                {rangeStartAyah}
                              </div>
                            </div>
                            
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setRangeStartAyah(Math.min(rangeEndAyah, rangeStartAyah + 1))}
                              disabled={rangeStartAyah >= rangeEndAyah}
                              className="h-10 w-10 rounded-lg border-2 border-violet-300 dark:border-violet-600 disabled:opacity-40 shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* To Ayah */}
                        <div>
                          <label className="text-xs text-gray-600 dark:text-gray-400 mb-1.5 block">
                            {t.endAyah}
                          </label>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setRangeEndAyah(Math.max(rangeStartAyah, rangeEndAyah - 1))}
                              disabled={rangeEndAyah <= rangeStartAyah}
                              className="h-10 w-10 rounded-lg border-2 border-violet-300 dark:border-violet-600 disabled:opacity-40 shrink-0"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            
                            <div className="flex-1 text-center bg-violet-50 dark:bg-violet-900/50 rounded-lg py-2">
                              <div className="text-xl font-bold text-violet-900 dark:text-violet-100">
                                {rangeEndAyah}
                              </div>
                            </div>
                            
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => setRangeEndAyah(Math.min(chapterInfo?.verses_count || 286, rangeEndAyah + 1))}
                              disabled={rangeEndAyah >= (chapterInfo?.verses_count || 286)}
                              className="h-10 w-10 rounded-lg border-2 border-violet-300 dark:border-violet-600 disabled:opacity-40 shrink-0"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Visual indicator showing selected range */}
                      <div className="mt-3 p-2.5 bg-violet-100 dark:bg-violet-900/30 rounded-lg text-center">
                        <div className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                          {language === 'ar' 
                            ? `${rangeEndAyah - rangeStartAyah + 1} آية`
                            : `${rangeEndAyah - rangeStartAyah + 1} verses`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Range Repeat Control */}
                  <div className="mb-5">
                    <label className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-2 block">
                      {t.repeatRange}
                    </label>
                    
                    {/* Quick Presets */}
                    <div className="flex gap-2 mb-3">
                      {[1, 3, 5, 7].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setGlobalRepeatCount(preset)}
                          className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 ${
                            globalRepeatCount === preset
                              ? 'bg-violet-600 dark:bg-violet-500 text-white shadow-lg'
                              : 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800'
                          }`}
                        >
                          {preset}×
                        </button>
                      ))}
                    </div>
                    
                    {/* Stepper */}
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setGlobalRepeatCount(Math.max(1, globalRepeatCount - 1))}
                        disabled={globalRepeatCount <= 1}
                        className="h-12 w-12 rounded-full border-2 border-violet-300 dark:border-violet-600 disabled:opacity-40"
                      >
                        <Minus className="w-5 h-5" />
                      </Button>
                      
                      <div className="flex-1 text-center">
                        <div className="text-3xl font-bold text-violet-900 dark:text-violet-100">
                          {globalRepeatCount}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {language === 'ar' ? 'مرات' : 'times'}
                        </div>
                      </div>
                      
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setGlobalRepeatCount(Math.min(10, globalRepeatCount + 1))}
                        disabled={globalRepeatCount >= 10}
                        className="h-12 w-12 rounded-full border-2 border-violet-300 dark:border-violet-600 disabled:opacity-40"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Per Ayah Repeat Control */}
                  <div className="mb-5">
                    <label className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-2 block">
                      {t.repeatEachAyah}
                    </label>
                    
                    {/* Quick Presets */}
                    <div className="flex gap-2 mb-3">
                      {[1, 3, 5, 7].map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setPerAyahRepeatCount(preset)}
                          className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-95 ${
                            perAyahRepeatCount === preset
                              ? 'bg-violet-600 dark:bg-violet-500 text-white shadow-lg'
                              : 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800'
                          }`}
                        >
                          {preset}×
                        </button>
                      ))}
                    </div>
                    
                    {/* Stepper */}
                    <div className="flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setPerAyahRepeatCount(Math.max(1, perAyahRepeatCount - 1))}
                        disabled={perAyahRepeatCount <= 1}
                        className="h-12 w-12 rounded-full border-2 border-violet-300 dark:border-violet-600 disabled:opacity-40"
                      >
                        <Minus className="w-5 h-5" />
                      </Button>
                      
                      <div className="flex-1 text-center">
                        <div className="text-3xl font-bold text-violet-900 dark:text-violet-100">
                          {perAyahRepeatCount}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {language === 'ar' ? 'مرات' : 'times'}
                        </div>
                      </div>
                      
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => setPerAyahRepeatCount(Math.min(10, perAyahRepeatCount + 1))}
                        disabled={perAyahRepeatCount >= 10}
                        className="h-12 w-12 rounded-full border-2 border-violet-300 dark:border-violet-600 disabled:opacity-40"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  {isPlayingSequence && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-center"
                    >
                      <div className="text-xs text-amber-700 dark:text-amber-300 font-medium mb-1">
                        {language === 'ar' ? 'جاري التشغيل' : 'Now Playing'}
                      </div>
                      <div className="text-sm text-amber-900 dark:text-amber-100">
                        {language === 'ar' 
                          ? `الآية ${verses.find(v => v.verse_key === playingVerse)?.verse_number || currentSequenceIndex + 1} (${currentAyahRepeatCount + 1}/${perAyahRepeatCount})`
                          : `Ayah ${verses.find(v => v.verse_key === playingVerse)?.verse_number || currentSequenceIndex + 1} (${currentAyahRepeatCount + 1}/${perAyahRepeatCount})`}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </div>
  );
}