import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Check, Lock, LogIn, AlertCircle, CheckCircle2, Moon, Sun } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useState, useEffect } from 'react';
import { 
  isMemberOfGroup, 
  calculateKhatmahMilestones,
  calculateKhatmahMilestonesForGroup,
  joinGroup,
  leaveGroup,
  getSurahMemorizationStats,
  getCurrentKhatmah,
  markEntireSurahAsMemorized,
  isSurahFullyMemorized,
  switchKhatmahGroup
} from '../utils/localStorage';
import { getStoredUser } from '../../services/authService';
import { joinGroupOnServer, leaveGroupOnServer } from '../../services/syncService';
import SurahCompletionModal from './SurahCompletionModal';
import { getTranslations, getStoredLanguage } from '../utils/translations';
import { SURAHS, getSurahName } from '../utils/surahs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';

interface GroupGoalDetailProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
  onToggleDarkMode?: () => void;
}

export default function GroupGoalDetail({ isAuthenticated, onSignOut, onToggleDarkMode }: GroupGoalDetailProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isMember, setIsMember] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showKhatmahWarning, setShowKhatmahWarning] = useState(false);
  const [pendingKhatmahId, setPendingKhatmahId] = useState<string | null>(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  
  const translations = getTranslations(getStoredLanguage());
  const language = getStoredLanguage();
  
  // Check membership on mount and when id changes
  useEffect(() => {
    if (id) {
      setIsMember(isMemberOfGroup(id));
    }
  }, [id]);
  
  // Determine if this is a khatmah or memorization group
  const isKhatmahGroup = id?.startsWith('khatmah-');
  
  // Extract days from ID if khatmah
  const khatmahDays = isKhatmahGroup && id ? parseInt(id.split('-')[1]) : null;
  
  // Extract surah number from ID if memorization group (format: surah-{number})
  const surahNumber = !isKhatmahGroup && id?.startsWith('surah-') ? parseInt(id.split('-')[1]) : null;
  
  // Find the surah data
  const surahData = surahNumber ? SURAHS.find(s => s.number === surahNumber) : null;
  const surahDisplayName = surahNumber ? getSurahName(surahNumber, language) : null;
  const surahMeaning = surahNumber ? translations.surahMeanings[surahNumber - 1] : null;
  
  // Helper function to get the correct Arabic word for days
  const getArabicDaysWord = (days: number): string => {
    if (days === 1) return 'يوم';
    if (days === 2) return 'يومان';
    if (days >= 3 && days <= 10) return 'أيام';
    return 'يومًا'; // 11+
  };
  
  // Generate data based on group type
  const goal = isKhatmahGroup && khatmahDays ? {
    id: id,
    title: language === 'ar' 
      ? `إتمام الختمة في ${khatmahDays} ${getArabicDaysWord(khatmahDays)}` 
      : `${translations.completeKhatmahIn} ${khatmahDays} ${khatmahDays === 1 ? 'Day' : 'Days'}`,
    description: language === 'ar'
      ? `${translations.readEntireQuranIn} ${khatmahDays} ${translations.daysWithCommunity}`
      : `${translations.readEntireQuranIn} ${khatmahDays} ${translations.daysWithCommunity}`,
    type: 'reading',
    members: Math.floor(Math.random() * 500) + 200, // Mock - will be real in Phase 2
  } : surahData ? {
    id: id,
    title: language === 'ar' ? `حفظ سورة ${surahDisplayName}` : `Memorize Surah ${surahData.name}`,
    description: language === 'ar' ? `${surahData.verses} آية` : `${surahMeaning} - ${surahData.verses} verses`,
    type: 'memorization',
    members: Math.floor(Math.random() * 100) + 20, // Mock - will be real in Phase 2
  } : {
    id: id,
    title: 'Group Goal',
    description: 'Loading...',
    type: 'memorization',
    members: 0,
  };

  // Calculate milestones based on reading progress from localStorage
  const khatmahMilestones = isKhatmahGroup && khatmahDays ? calculateKhatmahMilestonesForGroup(id, khatmahDays) : [];
  
  const completedCount = khatmahMilestones.filter(m => m.completed).length;

  // Get memorization stats for surah groups
  const memorizationStats = surahNumber && SURAHS.find(s => s.number === surahNumber) 
    ? getSurahMemorizationStats(surahNumber, SURAHS.find(s => s.number === surahNumber)?.verses || 0)
    : null;

  const handleJoinLeave = () => {
    if (id) {
      if (isMember) {
        // Leaving group - no auth check needed
        leaveGroup(id);
        setIsMember(false);
        setJoinError(null);
        if (isAuthenticated) {
          leaveGroupOnServer(id);
        }
      } else {
        // Joining group - require authentication
        if (!isAuthenticated) {
          navigate(`/auth?redirect=/groups/${id}`);
          return;
        }
        
        // Check if trying to join a khatmah while already in another
        if (isKhatmahGroup) {
          const currentKhatmah = getCurrentKhatmah();
          if (currentKhatmah && currentKhatmah !== id) {
            // Show warning modal
            setPendingKhatmahId(id);
            setShowKhatmahWarning(true);
            return;
          }
        }
        
        try {
          joinGroup(id);
          setIsMember(true);
          setJoinError(null);
          joinGroupOnServer(id);
        } catch (error) {
          // Show the error message
          setJoinError(error instanceof Error ? error.message : 'Failed to join group');
        }
      }
    }
  };

  const confirmSwitchKhatmah = () => {
    if (pendingKhatmahId) {
      try {
        // Get the old khatmah before switching
        const oldKhatmah = getCurrentKhatmah();
        
        // Switch to new khatmah (this also leaves the old one)
        switchKhatmahGroup(pendingKhatmahId);
        setIsMember(true);
        setJoinError(null);
        setShowKhatmahWarning(false);
        setPendingKhatmahId(null);
        
        if (isAuthenticated) {
          // Leave old khatmah on server
          if (oldKhatmah) {
            leaveGroupOnServer(oldKhatmah);
          }
          // Join new khatmah on server
          joinGroupOnServer(pendingKhatmahId);
        }
        
        // Reload to show updated UI
        window.location.reload();
      } catch (error) {
        setJoinError(error instanceof Error ? error.message : 'Failed to switch khatmah');
        setShowKhatmahWarning(false);
      }
    }
  };

  const handleMarkSurahAsMemorized = () => {
    if (surahNumber && surahData) {
      markEntireSurahAsMemorized(surahNumber, surahData.verses);
      setShowCompletionModal(true);
      // Don't reload immediately - let the modal show first
    }
  };

  // Check if surah is fully memorized
  const isSurahComplete = surahNumber && surahData ? isSurahFullyMemorized(surahNumber, surahData.verses) : false;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to={`/groups?filter=${isKhatmahGroup ? 'reading' : 'memorization'}`}>
            <Button variant="ghost" className="text-emerald-600 dark:text-emerald-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {translations.backToGroups}
            </Button>
          </Link>
          <div className="flex gap-2 items-center">
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
            {isMember ? (
              <Button 
                variant="outline" 
                className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
                onClick={() => setShowLeaveConfirmation(true)}
              >
                {translations.leaveGoal}
              </Button>
            ) : (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                onClick={handleJoinLeave}
              >
                {translations.joinGoal}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Error Alert - Only khatmahs */}
        {joinError && isKhatmahGroup && (
          <Card className="p-6 mb-8 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg text-red-900 dark:text-red-100 mb-1">{translations.cannotJoinKhatmah}</h3>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  {joinError}
                </p>
                <Link to="/groups?filter=reading">
                  <Button 
                    variant="outline" 
                    className="border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900"
                  >
                    {translations.viewYourCurrentKhatmah}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Non-member Notice */}
        {!isMember && !joinError && (
          <Card className="p-6 mb-8 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h3 className="text-lg text-amber-900 dark:text-amber-100 mb-1">{translations.previewMode}</h3>
                <p className="text-amber-700 dark:text-amber-300">
                  {translations.viewingAsGuest}. {translations.joinToContribute}.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Goal Header */}
        <Card className="p-8 mb-8 border-emerald-100 dark:border-emerald-800">
          <div className="flex items-center gap-2 mb-3">
            <h1 className="text-3xl text-emerald-900 dark:text-emerald-100">{goal.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm ${
              goal.type === 'memorization' 
                ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300' 
                : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
            }`}>
              {goal.type}
            </span>
          </div>
          <p className="text-emerald-600 dark:text-emerald-400 mb-6">{goal.description}</p>

          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-6">
            <Users className="w-5 h-5" />
            <span className="text-lg">{goal.members} {translations.members.toLowerCase()}</span>
          </div>

          {isMember && (
            <Link to={
              isKhatmahGroup 
                ? `/khatmah/${id}` 
                : `/reader?mode=memorization&surah=${surahNumber || 1}`
            }>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600">
                {isKhatmahGroup ? translations.openKhatmahReader : translations.continueMemorizing}
              </Button>
            </Link>
          )}
        </Card>

        {/* Milestones (Khatmah only) */}
        {isKhatmahGroup && (
          <Card className="p-6 mb-8 border-emerald-100 dark:border-emerald-800">
            <h2 className="text-xl text-emerald-900 dark:text-emerald-100 mb-4 flex items-center justify-between">
              <span>{isMember ? translations.yourProgress : translations.readingPlan}</span>
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                {isMember && language === 'ar' && `تم إكمال ${completedCount} / ${khatmahMilestones.length} يومًا`}
                {isMember && language === 'en' && `${completedCount} ${translations.of} ${khatmahMilestones.length} ${translations.daysCompleted.toLowerCase()}`}
                {!isMember && language === 'ar' && `جدول ${khatmahMilestones.length} ${getArabicDaysWord(khatmahMilestones.length)}`}
                {!isMember && language === 'en' && `${khatmahMilestones.length} ${translations.day} ${translations.daySchedule.toLowerCase()}`}
              </span>
            </h2>
            
            {!isMember && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-4 pb-4 border-b border-emerald-100 dark:border-emerald-800">
                {translations.previewScheduleDesc}
              </p>
            )}
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {khatmahMilestones.map((milestone, idx) => {
                const isCompleted = isMember && milestone.completed;
                
                // Calculate Juz range for display
                const startJuz = Math.ceil(milestone.startPage / 20);
                const endJuz = Math.ceil(milestone.endPage / 20);
                const juzRange = startJuz !== endJuz ? `${startJuz}-${endJuz}` : `${startJuz}`;
                
                // Build translated title and description
                const milestoneTitle = language === 'ar' 
                  ? `${translations.day} ${milestone.day}`
                  : `${translations.day} ${milestone.day}`;
                
                const milestoneDescription = language === 'ar'
                  ? `${translations.pagesLabel} ${milestone.startPage}-${milestone.endPage} (${translations.juz} ${juzRange})`
                  : `${translations.pagesLabel} ${milestone.startPage}-${milestone.endPage} (${translations.juz} ${juzRange})`;
                
                return (
                  <div 
                    key={idx} 
                    className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                      isCompleted
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-600 dark:border-emerald-700' 
                        : isMember 
                        ? 'bg-white dark:bg-gray-800 border-emerald-100 dark:border-emerald-800'
                        : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                      isCompleted 
                        ? 'bg-emerald-600 dark:bg-emerald-700 border-emerald-600 dark:border-emerald-700' 
                        : isMember
                        ? 'border-emerald-300 dark:border-emerald-700'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {isCompleted && <Check className="w-4 h-4 text-white" />}
                      {!isCompleted && !isMember && <span className="text-xs text-gray-400 dark:text-gray-500">{idx + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        isCompleted 
                          ? 'text-emerald-900 dark:text-emerald-100' 
                          : isMember 
                          ? 'text-gray-900 dark:text-gray-100'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {milestoneTitle}
                      </div>
                      <div className={`text-sm ${
                        isCompleted 
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isMember
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {milestoneDescription}
                      </div>
                    </div>
                    {isCompleted && (
                      <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                );
              })}
            </div>
            
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-4 text-center">
              {isMember 
                ? translations.milestonesAutoMarked
                : translations.pagesAutoTracked
              }
            </p>
          </Card>
        )}

        {/* Memorization Progress (Memorization groups only) */}
        {!isKhatmahGroup && isMember && memorizationStats && (
          <Card className="p-6 mb-8 border-emerald-100 dark:border-emerald-800">
            <h2 className="text-xl text-emerald-900 dark:text-emerald-100 mb-4 flex items-center justify-between">
              <span>{translations.yourMemorizationProgress}</span>
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                {memorizationStats.percentComplete}{translations.percentComplete}
              </span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <div>
                  <div className="text-2xl text-emerald-900 dark:text-emerald-100">{memorizationStats.ayahsMemorized}</div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">{translations.ayahsMemorized}</div>
                </div>
                <div>
                  <div className="text-2xl text-emerald-900 dark:text-emerald-100">{memorizationStats.totalAyahs}</div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">{translations.totalAyahs}</div>
                </div>
              </div>
              
              {memorizationStats.lastMemorizedAyah && (
                <div className="text-sm text-emerald-600 dark:text-emerald-400 text-center">
                  {translations.lastMemorized}: {translations.ayah} {memorizationStats.lastMemorizedAyah}
                </div>
              )}
              
              {/* Mark as Memorized Button */}
              {!isSurahComplete && (
                <Button
                  onClick={handleMarkSurahAsMemorized}
                  variant="outline"
                  className="w-full border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {translations.markEntireSurahMemorized}
                </Button>
              )}
              
              {isSurahComplete && (
                <div className="flex items-center justify-center gap-2 p-4 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg text-emerald-900 dark:text-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{translations.surahCompleted}</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-4 text-center">
              {translations.progressUpdatesAuto}
            </p>
          </Card>
        )}

        {/* Info for non-members or memorization groups */}
        {(!isMember || !isKhatmahGroup) && (
          <Card className="p-6 border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
            <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2">
              {!isMember ? translations.joinToTrackProgress : translations.aboutThisGroup}
            </h3>
            <p className="text-emerald-600 dark:text-emerald-400">
              {!isMember 
                ? translations.joinGroupDesc
                : translations.memorizationGroupDesc
              }
            </p>
          </Card>
        )}
      </div>

      {/* Surah Completion Modal */}
      {showCompletionModal && surahData && (
        <SurahCompletionModal
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            // Reload to show updated UI
            window.location.reload();
          }}
          surahName={surahData.name}
          surahNameArabic={surahData.nameArabic}
          surahTransliteration={surahData.transliteration}
          surahNumber={surahData.number}
          totalAyahs={surahData.verses}
        />
      )}

      {/* Khatmah Switch Warning Modal */}
      {showKhatmahWarning && (
        <Dialog open={showKhatmahWarning} onOpenChange={setShowKhatmahWarning}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                {language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
              </DialogTitle>
              <DialogDescription className="space-y-4 pt-4">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="font-medium mb-2 text-emerald-900 dark:text-emerald-100">
                    {language === 'ar' 
                      ? '💡 نوصي بشدة بالاستمرار في ختمتك الحالية' 
                      : '💡 We highly recommend staying in your current khatmah'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {language === 'ar'
                      ? 'الانتظام في القراءة والالتزام بنفس الوتيرة يساعدك على تحقيق أهدافك بشكل أفضل.'
                      : 'Consistency and sticking to the same pace helps you achieve your goals better.'}
                  </p>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {language === 'ar' ? 'ماذا سيحدث إذا قمت بالتبديل؟' : 'What happens if you switch?'}
                  </p>
                  <ul className="space-y-1.5 mr-4">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">✓</span>
                      <span>{language === 'ar' 
                        ? 'ستبقى صفحاتك المقروءة محفوظة ولن تفقد تقدمك'
                        : 'Your read pages will be preserved - you won\'t lose your progress'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">↻</span>
                      <span>{language === 'ar'
                        ? 'سيتم إعادة حساب تقدمك بناءً على وتيرة الختمة الجديدة'
                        : 'Your progress will be recalculated based on the new khatmah pace'}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 mt-0.5">!</span>
                      <span>{language === 'ar'
                        ? 'قد تتغير نسبة إنجازك اليومي حسب سرعة الختمة الجديدة'
                        : 'Your daily milestone progress may change based on the new pace'}</span>
                    </li>
                  </ul>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-3">
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowKhatmahWarning(false)}
              >
                {language === 'ar' ? 'البقاء في ختمتي الحالية' : 'Stay in Current Khatmah'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={confirmSwitchKhatmah}
              >
                {language === 'ar' ? 'تبديل الختمة' : 'Switch Anyway'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveConfirmation && (
        <Dialog open={showLeaveConfirmation} onOpenChange={setShowLeaveConfirmation}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <AlertCircle className="w-6 h-6 text-orange-600" />
                {language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
              </DialogTitle>
              <DialogDescription className="space-y-4 pt-4">
                <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="font-medium mb-2 text-emerald-900 dark:text-emerald-100">
                    {language === 'ar' 
                      ? '💡 هل أنت متأكد من رغبتك في مغادرة هذه الختمة؟' 
                      : '💡 Are you sure you want to leave this khatmah?'}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {language === 'ar'
                      ? 'سيتم حفظ تقدمك حتى الآن، ولكن لن تتمكن من متابعة الختمة بعد مغادرتك.'
                      : 'Your progress will be saved, but you will not be able to follow the khatmah after leaving.'}
                  </p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:gap-3">
              <Button 
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setShowLeaveConfirmation(false)}
              >
                {language === 'ar' ? 'البقاء في الختمة' : 'Stay in Khatmah'}
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                onClick={() => {
                  handleJoinLeave();
                  setShowLeaveConfirmation(false);
                }}
              >
                {language === 'ar' ? 'مغادرة الختمة' : 'Leave Anyway'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}