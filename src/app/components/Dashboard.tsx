import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Book, Flame, Target, Users, Settings as SettingsIcon, CheckCircle2, CloudOff, Cloud, Moon, Sun, Globe } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { getReadingStats, getJoinedGroups, getMilestoneStats, getCurrentKhatmah, getKhatmahReadingStats, getJoinedMemorizationGroups, getSurahMemorizationStats } from '../utils/localStorage';
import { SURAHS, getSurahByNumber } from '../utils/surahs';
import ProfileMenu from './ProfileMenu';
import { getTranslations, getStoredLanguage, setStoredLanguage, type Language } from '../utils/translations';

interface DashboardProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
  onToggleDarkMode?: () => void;
}

export default function Dashboard({ isAuthenticated, onSignOut, onToggleDarkMode }: DashboardProps) {
  const navigate = useNavigate();
  const language = getStoredLanguage();
  const t = getTranslations(language);
  
  const toggleLanguage = () => {
    const newLanguage: Language = language === 'en' ? 'ar' : 'en';
    setStoredLanguage(newLanguage);
    // Force page reload to apply new language
    window.location.reload();
  };
  
  // Get real reading stats from localStorage
  const joinedGroups = getJoinedGroups();
  const milestoneStats = getMilestoneStats();
  const currentKhatmah = getCurrentKhatmah();
  
  // State for showing all memorization surahs (mobile)
  const [showAllSurahs, setShowAllSurahs] = useState(false);
  
  // Get khatmah-specific stats if user has joined a khatmah
  const khatmahStats = currentKhatmah ? getKhatmahReadingStats(currentKhatmah) : null;
  
  // Get khatmah title
  const khatmahTitle = currentKhatmah ? (() => {
    const days = parseInt(currentKhatmah.split('-')[1]);
    return language === 'ar' ? `تحدي ختمة ${days} يوم` : `${days}-Day Khatmah Challenge`;
  })() : null;

  // Get memorization groups
  const memorizationGroups = getJoinedMemorizationGroups();
  const memorizationStats = memorizationGroups.length > 0 ? (() => {
    let totalAyahs = 0;
    let totalMemorized = 0;
    const surahs = memorizationGroups.map((groupId, index) => {
      const surahNumber = parseInt(groupId.split('-')[1]);
      const surahData = getSurahByNumber(surahNumber);
      if (!surahData) return null;
      
      const stats = getSurahMemorizationStats(surahNumber, surahData.verses);
      totalAyahs += surahData.verses;
      totalMemorized += stats.ayahsMemorized;
      
      return {
        surahNumber,
        name: surahData.name,
        nameArabic: surahData.nameArabic,
        transliteration: t.surahMeanings[surahNumber - 1],
        groupId,
        ayahsMemorized: stats.ayahsMemorized,
        totalAyahs: surahData.verses,
        percentComplete: stats.percentComplete,
        joinIndex: index // Track join order (lower = joined earlier)
      };
    }).filter(Boolean);
    
    // Sort: less memorized on top, then newest joined on top for ties
    surahs.sort((a: any, b: any) => {
      // First sort by completion percentage (ascending - less complete first)
      if (a.percentComplete !== b.percentComplete) {
        return a.percentComplete - b.percentComplete;
      }
      // For ties, sort by join date (descending - newer first)
      return b.joinIndex - a.joinIndex;
    });
    
    return { totalAyahs, totalMemorized, surahs };
  })() : null;

  // Mock data (will be replaced later)
  const stats = {
    currentStreak: 12,
    totalRead: khatmahStats?.pagesRead || 0,
    memorized: milestoneStats.completedSurahs,
    khatmaProgress: khatmahStats?.percentComplete || 0,
    completedKhatmas: milestoneStats.khatmahs
  };

  const recentProgress = [
    { date: 'Today', ayahs: 10, type: 'read' },
    { date: 'Yesterday', ayahs: 15, type: 'memorized' },
    { date: '2 days ago', ayahs: 12, type: 'read' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900">
      {/* Header */}
      <header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Book className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span className="text-2xl text-emerald-900 dark:text-emerald-100 hidden md:inline">{t.appName}</span>
            {!isAuthenticated && (
              <Badge variant="secondary" className="ml-2 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700">
                {t.guest}
              </Badge>
            )}
          </div>
          <div className="flex gap-2 items-center">
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
            <Link to="/reader">
              <Button variant="outline" className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900">
                <Book className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">{t.reader}</span>
              </Button>
            </Link>
            <Link to="/groups">
              <Button variant="outline" className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900">
                <Users className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">{t.circles}</span>
              </Button>
            </Link>
            <ProfileMenu isAuthenticated={isAuthenticated} onSignOut={onSignOut} />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl text-emerald-900 dark:text-emerald-100 mb-8">
          {language === 'ar' ? 'السلام عليكم' : 'As-salāmu ʿalaykum'}
        </h1>

        {/* Sync Status Banner */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <CloudOff className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <span className="font-semibold">{t.guestMode}:</span> {language === 'ar' ? 'يتم حفظ تقدمك على هذا الجهاز فقط.' : 'Your progress is saved on this device only.'}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  <Link to="/auth" className="underline hover:text-amber-800 dark:hover:text-amber-200">
                    {language === 'ar' ? 'تسجيل الدخول أو إنشاء حساب' : 'Sign in or create an account'}
                  </Link> {language === 'ar' ? 'للمزامنة عبر جميع أجهزتك والانضمام إلى أهداف المجتمع.' : 'to sync across all your devices and join community goals.'}
                </p>
              </div>
            </div>
          </div>
        )}
        {isAuthenticated && (
          <div className="mb-6 p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                {t.progressSyncing}
              </p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card className="p-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-3xl text-emerald-900 dark:text-emerald-100">{stats.memorized}</div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400">{t.surahsMemorized}</div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-3xl text-emerald-900 dark:text-emerald-100">{stats.completedKhatmas}</div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400">{t.khatmasCompleted}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Current Khatmah Progress - Only show if user is in a Khatmah group */}
        {currentKhatmah ? (
          <Card className="p-6 mb-8 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
            <h2 className="text-xl text-emerald-900 dark:text-emerald-100 mb-4">{khatmahTitle}</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600 dark:text-emerald-400">{t.pagesRead}</span>
                <span className="text-emerald-900 dark:text-emerald-100">{khatmahStats?.pagesRead} / {khatmahStats?.totalPages}</span>
              </div>
              <Progress value={khatmahStats?.percentComplete} className="h-3" />
              <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                <span>{khatmahStats?.percentComplete}% {t.complete}</span>
                {khatmahStats?.lastReadPage > 1 && (
                  <span>{t.lastRead}: {t.page} {khatmahStats?.lastReadPage}</span>
                )}
              </div>
            </div>
            <Button 
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
              onClick={() => {
                // Calculate next page to read (page after last completed page)
                const nextPage = (khatmahStats?.lastReadPage || 0) + 1;
                const pageToNavigate = Math.min(nextPage, 604); // Cap at 604
                
                // Save the target page to localStorage so KhatmahReader opens to it
                localStorage.setItem(`khatmah-${currentKhatmah}-currentPage`, pageToNavigate.toString());
                
                // Navigate to khatmah reader using React Router (faster than full page reload)
                navigate(`/khatmah/${currentKhatmah}`);
              }}
            >
              {t.continueReading}
            </Button>
          </Card>
        ) : (
          <Card className="p-6 mb-8 border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg text-emerald-900 dark:text-emerald-100">{t.startKhatmah}</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-400">{language === 'ar' ? 'ابدأ رحلة قراءة القرآن' : 'Begin your Quran reading journey'}</p>
              </div>
            </div>
            <p className="text-emerald-600 dark:text-emerald-400 mb-4">
              {t.joinKhatmahDesc}
            </p>
            <Link to="/groups?filter=reading&tab=discover">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                {t.browseKhatmahCircles}
              </Button>
            </Link>
          </Card>
        )}
        
        {/* Memorization Groups Progress - Show if user has joined memorization groups */}
        {memorizationStats && memorizationStats.surahs.length > 0 && (
          <Card className="p-6 mb-8 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
            <h2 className="text-xl text-emerald-900 dark:text-emerald-100 mb-4">{t.memorizationProgress}</h2>
            
            {/* Overall Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600 dark:text-emerald-400">{t.totalAyahsToMemorize}</span>
                <span className="text-emerald-900 dark:text-emerald-100">{memorizationStats.totalMemorized} / {memorizationStats.totalAyahs}</span>
              </div>
              <Progress 
                value={memorizationStats.totalAyahs > 0 ? Math.round((memorizationStats.totalMemorized / memorizationStats.totalAyahs) * 100) : 0} 
                className="h-3" 
              />
              <div className="text-sm text-emerald-600 dark:text-emerald-400">
                {memorizationStats.totalAyahs > 0 ? Math.round((memorizationStats.totalMemorized / memorizationStats.totalAyahs) * 100) : 0}% {t.complete}
              </div>
            </div>
            
            {/* List of Surahs */}
            <div className="space-y-3 mb-4">
              <h3 className="text-sm text-emerald-900 dark:text-emerald-100">{t.yourSurahs} ({memorizationStats.surahs.length})</h3>
              <div className="space-y-2">
                {/* Desktop: Show all surahs */}
                {memorizationStats.surahs.map((surah: any) => (
                  <Link 
                    key={surah.groupId} 
                    to={`/reader?mode=memorization&surah=${surah.surahNumber}`}
                    className="hidden md:block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-900 dark:text-emerald-100">{language === 'ar' ? surah.nameArabic : surah.name}</span>
                          {surah.percentComplete === 100 && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">
                          {surah.ayahsMemorized}/{surah.totalAyahs} {language === 'ar' ? 'آيات' : 'ayahs'}
                        </div>
                      </div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400">
                        {surah.percentComplete}%
                      </div>
                    </div>
                  </Link>
                ))}
                
                {/* Mobile: Show first 5 or all based on state */}
                {(showAllSurahs ? memorizationStats.surahs : memorizationStats.surahs.slice(0, 5)).map((surah: any) => (
                  <Link 
                    key={surah.groupId} 
                    to={`/reader?mode=memorization&surah=${surah.surahNumber}`}
                    className="block md:hidden"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-emerald-900 dark:text-emerald-100">{language === 'ar' ? surah.nameArabic : surah.name}</span>
                          {surah.percentComplete === 100 && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">
                          {surah.ayahsMemorized}/{surah.totalAyahs} {language === 'ar' ? 'آيات' : 'ayahs'}
                        </div>
                      </div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400">
                        {surah.percentComplete}%
                      </div>
                    </div>
                  </Link>
                ))}
                
                {/* See Full List button - Only on mobile when there are more than 5 surahs */}
                {memorizationStats.surahs.length > 5 && !showAllSurahs && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowAllSurahs(true)}
                    className="w-full md:hidden text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                  >
                    {t.seeFullList} ({memorizationStats.surahs.length - 5} {t.more})
                  </Button>
                )}
                
                {/* Show Less button - Only on mobile when showing all */}
                {memorizationStats.surahs.length > 5 && showAllSurahs && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowAllSurahs(false)}
                    className="w-full md:hidden text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                  >
                    {t.showLess}
                  </Button>
                )}
              </div>
            </div>
            
            <Link to="/groups?filter=memorization&tab=discover">
              <Button variant="outline" className="w-full border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900">
                {t.browseMoreSurahs}
              </Button>
            </Link>
          </Card>
        )}
        
        {joinedGroups.length > 0 && (
          <Card className="p-6 mt-8 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-emerald-900 dark:text-emerald-100">{t.myCircles}</h2>
              <Link to="/groups">
                <Button variant="outline" className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900">
                  {t.viewAll}
                </Button>
              </Link>
            </div>
            <div className="text-emerald-600 dark:text-emerald-400 text-center py-4">
              {language === 'ar' 
                ? `${t.youveJoined} ${joinedGroups.length} ${joinedGroups.length === 1 ? t.circle : t.circles}`
                : `${t.youveJoined} ${joinedGroups.length} ${joinedGroups.length === 1 ? t.circle : t.circles}`
              }
            </div>
            <Link to="/groups">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                {t.viewMyCircles}
              </Button>
            </Link>
          </Card>
        )}
        
        {joinedGroups.length === 0 && (
          <Card className="p-6 mt-8 border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30">
            <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2">{t.joinACircle}</h3>
            <p className="text-emerald-600 dark:text-emerald-400 mb-4">
              {language === 'ar' 
                ? 'ابق متحفزًا بالقراءة جنبًا إلى جنب مع الآخرين. انضم إلى حلقة ختمة لتتبع تقدمك معًا.'
                : 'Stay motivated by reading alongside others. Join a Khatmah circle to track your progress together.'
              }
            </p>
            <Link to="/groups">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                {t.discoverCircles}
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}