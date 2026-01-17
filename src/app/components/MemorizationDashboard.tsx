import { Link } from 'react-router-dom';
import { Brain, ArrowLeft, Users, Target, Moon, Sun, Globe, Plus, CheckCircle2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { getJoinedMemorizationGroups, getSurahMemorizationStats } from '../utils/localStorage';
import { getSurahByNumber } from '../utils/surahs';
import ProfileMenu from './ProfileMenu';
import { getTranslations, getStoredLanguage, setStoredLanguage, type Language } from '../utils/translations';
import { useState } from 'react';

interface MemorizationDashboardProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
  onToggleDarkMode?: () => void;
}

export default function MemorizationDashboard({ isAuthenticated, onSignOut, onToggleDarkMode }: MemorizationDashboardProps) {
  const language = getStoredLanguage();
  const t = getTranslations(language);
  
  const [showCompleted, setShowCompleted] = useState(false);
  
  const toggleLanguage = () => {
    const newLanguage: Language = language === 'en' ? 'ar' : 'en';
    setStoredLanguage(newLanguage);
    window.location.reload();
  };

  const memorizationGroups = getJoinedMemorizationGroups();

  // Calculate aggregate stats
  let totalAyahs = 0;
  let totalMemorized = 0;
  let totalNeedReview = 0;
  
  const surahs = memorizationGroups.map((groupId, index) => {
    const surahNumber = parseInt(groupId.split('-')[1]);
    const surahData = getSurahByNumber(surahNumber);
    if (!surahData) return null;
    
    const stats = getSurahMemorizationStats(surahNumber, surahData.verses);
    totalAyahs += surahData.verses;
    totalMemorized += stats.ayahsMemorized;
    totalNeedReview += stats.needsReview;
    
    return {
      surahNumber,
      name: surahData.name,
      nameArabic: surahData.nameArabic,
      transliteration: t.surahMeanings[surahNumber - 1],
      groupId,
      ayahsMemorized: stats.ayahsMemorized,
      totalAyahs: surahData.verses,
      percentComplete: stats.percentComplete,
      needsReview: stats.needsReview,
      joinIndex: index
    };
  }).filter(Boolean);

  // Sort: less memorized on top, then newest joined on top for ties
  surahs.sort((a: any, b: any) => {
    if (a.percentComplete !== b.percentComplete) {
      return a.percentComplete - b.percentComplete;
    }
    return b.joinIndex - a.joinIndex;
  });

  const overallProgress = totalAyahs > 0 ? Math.round((totalMemorized / totalAyahs) * 100) : 0;

  // Separate in-progress and completed surahs
  const inProgressSurahs = surahs.filter((s: any) => s.percentComplete < 100);
  const completedSurahs = surahs.filter((s: any) => s.percentComplete === 100);

  // Helper to render surah card
  const renderSurahCard = (surah: any) => (
    <Link 
      key={surah.groupId}
      to={`/reader?mode=memorization&surah=${surah.surahNumber}`}
    >
      <Card className="p-4 md:p-6 border-purple-100 dark:border-purple-800 dark:bg-purple-950/50 hover:border-purple-400 dark:hover:border-purple-600 transition-all active:scale-[0.98]">
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base md:text-lg text-purple-900 dark:text-purple-100 truncate">
                {language === 'ar' ? surah.nameArabic : surah.name}
              </h3>
              {surah.percentComplete === 100 && (
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs md:text-sm text-purple-600 dark:text-purple-400">
              {surah.ayahsMemorized} / {surah.totalAyahs} {language === 'ar' ? 'آيات' : 'verses'}
            </p>
            {surah.needsReview > 0 && (
              <p className="text-[10px] md:text-xs text-amber-600 dark:text-amber-400 mt-1">
                {surah.needsReview} {language === 'ar' ? 'تحتاج مراجعة' : 'need review'}
              </p>
            )}
          </div>
          <Badge className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700 text-xs md:text-sm flex-shrink-0">
            {surah.percentComplete}%
          </Badge>
        </div>
        
        <Progress value={surah.percentComplete} className="h-1.5 md:h-2 mb-3 md:mb-4" />
        
        <div className="flex gap-2">
          <Button 
            className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 h-9 md:h-10 text-xs md:text-sm"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/reader?mode=memorization&surah=${surah.surahNumber}`;
            }}
          >
            {surah.percentComplete > 0 
              ? (language === 'ar' ? 'متابعة' : 'Continue')
              : (language === 'ar' ? 'ابدأ' : 'Start')
            }
          </Button>
          {surah.needsReview > 0 && (
            <Button 
              variant="outline"
              className="border-amber-600 dark:border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 h-9 md:h-10 px-3 md:px-4 text-xs md:text-sm"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = `/reader?mode=memorization&surah=${surah.surahNumber}&review=true`;
              }}
            >
              {language === 'ar' ? 'مراجعة' : 'Review'}
            </Button>
          )}
        </div>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-purple-950 dark:to-purple-900">
      {/* Header */}
      <header className="border-b border-purple-100 dark:border-purple-800 bg-white/80 dark:bg-purple-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3 min-w-0">
            <Link to="/home">
              <Button variant="ghost" size="icon" className="text-purple-600 dark:text-purple-400 h-9 w-9 md:h-10 md:w-10 flex-shrink-0">
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
            <Brain className="w-6 h-6 md:w-8 md:h-8 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span className="text-lg md:text-2xl text-purple-900 dark:text-purple-100 truncate">
              {language === 'ar' ? 'حلقات الحفظ' : 'Memorization'}
            </span>
          </div>
          <div className="flex gap-1.5 md:gap-2 items-center flex-shrink-0">
            <Button 
              variant="outline" 
              size="icon"
              className="border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 h-9 w-9 md:h-10 md:w-10"
              onClick={toggleLanguage}
              title={language === 'en' ? 'العربية' : 'English'}
            >
              <Globe className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
            
            {onToggleDarkMode && (
              <Button 
                variant="outline" 
                size="icon"
                className="border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 h-9 w-9 md:h-10 md:w-10"
                onClick={onToggleDarkMode}
              >
                {document.documentElement.classList.contains('dark') ? (
                  <Sun className="w-3.5 h-3.5 md:w-4 md:h-4" />
                ) : (
                  <Moon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                )}
              </Button>
            )}
            <ProfileMenu isAuthenticated={isAuthenticated} onSignOut={onSignOut} mode="memorization" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-4xl">
        {/* Overall Progress Stats */}
        <Card className="p-4 md:p-6 mb-4 md:mb-8 border-purple-100 dark:border-purple-800 dark:bg-purple-950/50">
          <h2 className="text-base md:text-xl text-purple-900 dark:text-purple-100 mb-3 md:mb-4">
            {language === 'ar' ? 'التقدم الإجمالي' : 'Overall Progress'}
          </h2>
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-4">
            <div className="flex flex-col items-center gap-1.5 md:gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-semibold text-purple-900 dark:text-purple-100">{memorizationGroups.length}</div>
                <div className="text-[10px] md:text-sm text-purple-600 dark:text-purple-400 leading-tight">
                  {language === 'ar' ? 'مجموعات' : 'Groups'}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 md:gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-semibold text-purple-900 dark:text-purple-100">{totalMemorized}</div>
                <div className="text-[10px] md:text-sm text-purple-600 dark:text-purple-400 leading-tight">
                  {language === 'ar' ? 'آيات' : 'Verses'}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 md:gap-2">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-semibold text-purple-900 dark:text-purple-100">{overallProgress}%</div>
                <div className="text-[10px] md:text-sm text-purple-600 dark:text-purple-400 leading-tight">
                  {language === 'ar' ? 'مكتمل' : 'Complete'}
                </div>
              </div>
            </div>
          </div>
          {totalAyahs > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs md:text-sm text-purple-600 dark:text-purple-400">
                <span>{totalMemorized} / {totalAyahs} {language === 'ar' ? 'آيات' : 'verses'}</span>
                {totalNeedReview > 0 && (
                  <span className="text-amber-600 dark:text-amber-400">
                    {totalNeedReview} {language === 'ar' ? 'مراجعة' : 'review'}
                  </span>
                )}
              </div>
              <Progress value={overallProgress} className="h-2 md:h-3" />
            </div>
          )}
        </Card>

        {/* Memorization Groups */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-lg md:text-2xl text-purple-900 dark:text-purple-100">
              {language === 'ar' ? 'مجموعات الحفظ' : 'Memorization'}
            </h2>
            <Link to="/groups?filter=memorization&tab=discover">
              <Button variant="outline" size="sm" className="border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900 h-8 md:h-9 text-xs md:text-sm">
                <Plus className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                {language === 'ar' ? 'انضم' : 'Join'}
              </Button>
            </Link>
          </div>

          {surahs.length > 0 ? (
            <>
              {/* In Progress Surahs */}
              {inProgressSurahs.length > 0 && (
                <div className="grid gap-3 md:gap-4 mb-4 md:mb-6">
                  {inProgressSurahs.map((surah: any) => renderSurahCard(surah))}
                </div>
              )}

              {/* Completed Surahs - Collapsible */}
              {completedSurahs.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="w-full flex items-center justify-between p-3 md:p-4 mb-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      <span className="text-sm md:text-lg text-emerald-900 dark:text-emerald-100">
                        {language === 'ar' ? 'السور المكتملة' : 'Completed'} ({completedSurahs.length})
                      </span>
                    </div>
                    <ChevronDown 
                      className={`w-4 h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400 transition-transform flex-shrink-0 ${
                        showCompleted ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  
                  {showCompleted && (
                    <div className="grid gap-3 md:gap-4">
                      {completedSurahs.map((surah: any) => renderSurahCard(surah))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <Card className="p-6 md:p-8 border-purple-100 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 text-center">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mx-auto mb-3 md:mb-4">
                <Brain className="w-6 h-6 md:w-8 md:h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-base md:text-lg text-purple-900 dark:text-purple-100 mb-2">
                {language === 'ar' ? 'لم تنضم إلى أي مجموعة حفظ بعد' : 'No Memorization Groups Yet'}
              </h3>
              <p className="text-sm md:text-base text-purple-600 dark:text-purple-400 mb-4 md:mb-6">
                {language === 'ar' 
                  ? 'انضم إلى مجموعة حفظ لتبدأ رحلة حفظ القرآن' 
                  : 'Join a memorization group to start your journey'}
              </p>
              <Link to="/groups?filter=memorization&tab=discover">
                <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 h-9 md:h-10 text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'تصفح المجموعات' : 'Browse Groups'}
                </Button>
              </Link>
            </Card>
          )}
        </div>

        {/* Features Info */}
        <Card className="p-4 md:p-6 border-purple-100 dark:border-purple-800 dark:bg-purple-950/50">
          <h3 className="text-base md:text-lg text-purple-900 dark:text-purple-100 mb-2 md:mb-3">
            {language === 'ar' ? 'ميزات الحفظ' : 'Memorization Features'}
          </h3>
          <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-purple-600 dark:text-purple-400">
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5 flex-shrink-0">✓</span>
              <span>{language === 'ar' ? 'تتبع الآيات المحفوظة' : 'Track memorized verses'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5 flex-shrink-0">✓</span>
              <span>{language === 'ar' ? 'جدول المراجعة الذكي' : 'Smart review schedule'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5 flex-shrink-0">✓</span>
              <span>{language === 'ar' ? 'إحصائيات تقدم الحفظ' : 'Memorization progress stats'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-500 mt-0.5 flex-shrink-0">✓</span>
              <span>{language === 'ar' ? 'احفظ مع الآخرين في مجموعات' : 'Memorize with others in groups'}</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}