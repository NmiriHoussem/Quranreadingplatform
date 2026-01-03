import { Link, useNavigate } from 'react-router-dom';
import { Book, ArrowLeft, Users, Target, Moon, Sun, Globe, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { getJoinedGroups, getKhatmahReadingStats, getCurrentKhatmah, calculateKhatmahMilestones } from '../utils/localStorage';
import ProfileMenu from './ProfileMenu';
import { getTranslations, getStoredLanguage, setStoredLanguage, type Language } from '../utils/translations';

interface ReadingDashboardProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
  onToggleDarkMode?: () => void;
}

export default function ReadingDashboard({ isAuthenticated, onSignOut, onToggleDarkMode }: ReadingDashboardProps) {
  const navigate = useNavigate();
  const language = getStoredLanguage();
  const t = getTranslations(language);
  
  const toggleLanguage = () => {
    const newLanguage: Language = language === 'en' ? 'ar' : 'en';
    setStoredLanguage(newLanguage);
    window.location.reload();
  };

  const joinedGroups = getJoinedGroups();
  const currentKhatmah = getCurrentKhatmah();

  // Calculate stats for current khatmah only (not aggregate)
  const currentKhatmahStats = currentKhatmah ? getKhatmahReadingStats(currentKhatmah) : null;
  const currentKhatmahDays = currentKhatmah ? parseInt(currentKhatmah.split('-')[1]) : 0;
  const currentKhatmahMilestones = currentKhatmah ? calculateKhatmahMilestones(currentKhatmahDays) : [];
  const completedDays = currentKhatmahMilestones.filter(m => m.completed).length;
  
  // Use current khatmah stats for overall progress
  const totalPagesRead = currentKhatmahStats?.pagesRead || 0;
  const totalPagesGoal = 604;
  const overallProgress = currentKhatmahStats?.percentComplete || 0;

  // Build list of all khatmahs with their stats
  const groupsWithStats = joinedGroups.map(groupId => {
    const stats = getKhatmahReadingStats(groupId);
    const days = parseInt(groupId.split('-')[1]);
    const title = language === 'ar' ? `ختمة ${days} يوم` : `${days}-Day Khatmah`;
    
    return {
      groupId,
      title,
      stats
    };
  });

  // Separate current khatmah and completed khatmahs
  const currentKhatmahData = groupsWithStats.find(g => g.groupId === currentKhatmah);
  const completedKhatmahs = groupsWithStats.filter(g => g.stats && g.stats.percentComplete === 100 && g.groupId !== currentKhatmah);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900">
      {/* Header */}
      <header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon" className="text-emerald-600 dark:text-emerald-400">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <Book className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span className="text-2xl text-emerald-900 dark:text-emerald-100">
              {language === 'ar' ? 'حلقات القراءة' : 'Reading Circles'}
            </span>
          </div>
          <div className="flex gap-2 items-center">
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
        {/* Overall Progress Stats */}
        <Card className="p-6 mb-8 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
          <h2 className="text-xl text-emerald-900 dark:text-emerald-100 mb-4">
            {language === 'ar' ? 'التقدم الإجمالي' : 'Overall Progress'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl text-emerald-900 dark:text-emerald-100">{completedDays}</div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400">
                  {language === 'ar' ? 'أيام مكتملة' : 'Days Completed'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl text-emerald-900 dark:text-emerald-100">{totalPagesRead}</div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400">
                  {language === 'ar' ? 'صفحات مقروءة' : 'Pages Read'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl text-emerald-900 dark:text-emerald-100">{overallProgress}%</div>
                <div className="text-sm text-emerald-600 dark:text-emerald-400">
                  {language === 'ar' ? 'مكتمل' : 'Complete'}
                </div>
              </div>
            </div>
          </div>
          {totalPagesGoal > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                <span>{totalPagesRead} / {totalPagesGoal} {language === 'ar' ? 'صفحة' : 'pages'}</span>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          )}
        </Card>

        {/* Khatmah Circles */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl text-emerald-900 dark:text-emerald-100">
              {language === 'ar' ? 'ختماتك' : 'Your Khatmahs'}
            </h2>
            <Link to="/groups?filter=reading&tab=discover">
              <Button variant="outline" size="sm" className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900">
                <Plus className="w-4 h-4 mr-1" />
                {language === 'ar' ? 'انضم' : 'Join'}
              </Button>
            </Link>
          </div>

          {groupsWithStats.length > 0 ? (
            <div className="space-y-6">
              {/* Current Active Khatmah */}
              {currentKhatmahData && currentKhatmahData.stats && currentKhatmahData.stats.percentComplete < 100 && (
                <Card className="p-6 border-2 border-emerald-400 dark:border-emerald-600 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/30 dark:to-emerald-950/50 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Badge className="bg-emerald-600 text-white dark:bg-emerald-500 mb-2">
                        {language === 'ar' ? 'ختمتك الحالية' : 'Current Khatmah'}
                      </Badge>
                      <h3 className="text-2xl text-emerald-900 dark:text-emerald-100 mb-1">
                        {currentKhatmahData.title}
                      </h3>
                      <p className="text-sm text-emerald-600 dark:text-emerald-400">
                        {currentKhatmahData.stats.pagesRead} / {currentKhatmahData.stats.totalPages} {language === 'ar' ? 'صفحة' : 'pages'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl text-emerald-600 dark:text-emerald-400">
                        {currentKhatmahData.stats.percentComplete}%
                      </div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400">
                        {language === 'ar' ? 'مكتمل' : 'Complete'}
                      </div>
                    </div>
                  </div>
                  
                  <Progress value={currentKhatmahData.stats.percentComplete} className="h-3 mb-4" />
                  
                  <div className="bg-white dark:bg-emerald-950 rounded-lg p-4 mb-4">
                    <p className="text-center text-emerald-700 dark:text-emerald-300 mb-1">
                      {language === 'ar' 
                        ? currentKhatmahData.stats.pagesRead > 0 
                          ? '✨ واصل القراءة وأكمل ختمتك!' 
                          : '✨ ابدأ ختمتك الآن!'
                        : currentKhatmahData.stats.pagesRead > 0
                          ? '✨ Keep reading and complete your Khatmah!'
                          : '✨ Start your Khatmah now!'
                      }
                    </p>
                    {currentKhatmahData.stats.pagesRead > 0 && (
                      <p className="text-sm text-center text-emerald-600 dark:text-emerald-400">
                        {language === 'ar' 
                          ? `${604 - currentKhatmahData.stats.pagesRead} صفحة متبقية`
                          : `${604 - currentKhatmahData.stats.pagesRead} pages remaining`
                        }
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline"
                      className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 py-6"
                      onClick={() => {
                        window.scrollTo(0, 0);
                        navigate(`/groups/${currentKhatmahData.groupId}`);
                      }}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {language === 'ar' ? 'حلقة القراءة' : 'Reading Circle'}
                    </Button>
                    <Button 
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-lg py-6"
                      onClick={() => {
                        const nextPage = (currentKhatmahData.stats.lastReadPage || 0) + 1;
                        const pageToNavigate = Math.min(nextPage, 604);
                        localStorage.setItem(`khatmah-${currentKhatmahData.groupId}-currentPage`, pageToNavigate.toString());
                        navigate(`/khatmah/${currentKhatmahData.groupId}`);
                      }}
                    >
                      {currentKhatmahData.stats.pagesRead > 0 
                        ? (language === 'ar' ? 'متابعة القراءة ←' : 'Continue Reading →')
                        : (language === 'ar' ? 'ابدأ القراءة ←' : 'Start Reading →')
                      }
                    </Button>
                  </div>
                </Card>
              )}

              {/* Completed Khatmahs History */}
              {completedKhatmahs.length > 0 && (
                <div>
                  <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-3">
                    {language === 'ar' ? 'ختمات مكتملة 🎉' : 'Completed Khatmahs 🎉'}
                  </h3>
                  <div className="grid gap-3">
                    {completedKhatmahs.map(({ groupId, title, stats }) => (
                      <Card key={groupId} className="p-4 border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/20">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-emerald-900 dark:text-emerald-100 mb-1">{title}</h4>
                            <p className="text-sm text-emerald-600 dark:text-emerald-400">
                              {language === 'ar' ? 'مكتمل 100%' : 'Completed 100%'}
                            </p>
                          </div>
                          <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
                            ✓ {language === 'ar' ? 'مكتمل' : 'Done'}
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card className="p-8 border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-4">
                <Book className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2">
                {language === 'ar' ? 'لم تنضم إلى أي ختمة بعد' : 'No Khatmahs Yet'}
              </h3>
              <p className="text-emerald-600 dark:text-emerald-400 mb-6">
                {language === 'ar' 
                  ? 'انضم إلى ختمة لتبدأ رحلة قراءة القرآن مع الآخرين' 
                  : 'Join a khatmah to start reading the Quran with others'}
              </p>
              <Link to="/groups?filter=reading&tab=discover">
                <Button className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                  <Plus className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'تصفح الختمات' : 'Browse Khatmahs'}
                </Button>
              </Link>
            </Card>
          )}
        </div>

        {/* Features Info */}
        <Card className="p-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
          <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-3">
            {language === 'ar' ? 'ميزات القراءة' : 'Reading Features'}
          </h3>
          <ul className="space-y-2 text-sm text-emerald-600 dark:text-emerald-400">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>{language === 'ar' ? 'تتبع تقدمك الشخصي في القراءة' : 'Track your personal reading progress'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>{language === 'ar' ? 'عرض المصحف أو النص' : 'Mushaf or text view'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>{language === 'ar' ? 'إحصائيات القراءة التفصيلية' : 'Detailed reading statistics'}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">✓</span>
              <span>{language === 'ar' ? 'اقرأ مع الآخرين في وقت حقيقي' : 'Read with others in real-time'}</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}