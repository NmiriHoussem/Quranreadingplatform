import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Book, Home, Plus, Search, Users, Target, Calendar, AlertCircle, LogIn, CheckCircle2, ArrowLeft, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { 
  getJoinedGroups, 
  getCurrentKhatmah, 
  joinGroup as joinGroupLS, 
  switchKhatmahGroup,
  isMemberOfGroup,
  getSurahMemorizationStats // Added for progress tracking
} from '../utils/localStorage';
import { joinGroupOnServer, leaveGroupOnServer } from '../../services/syncService';
import AppHeader from './AppHeader';
import { getTranslations, getStoredLanguage } from '../utils/translations';
import { SURAHS, getSurahName } from '../utils/surahs';

// Khatmah reading groups
const KHATMAH_GROUPS = [
  { id: 'khatmah-7', days: 7, members: 234, progress: 92 },
  { id: 'khatmah-10', days: 10, members: 456, progress: 85 },
  { id: 'khatmah-15', days: 15, members: 678, progress: 88 },
  { id: 'khatmah-30', days: 30, members: 891, progress: 82 },
  { id: 'khatmah-60', days: 60, members: 543, progress: 76 },
  { id: 'khatmah-90', days: 90, members: 321, progress: 71 }
];

interface GroupGoalsProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
  onToggleDarkMode?: () => void;
}

export default function GroupGoals({ isAuthenticated, onSignOut, onToggleDarkMode }: GroupGoalsProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Check if filter param exists in URL
  const urlFilter = searchParams.get('filter');
  const initialFilter = urlFilter === 'reading' ? 'reading' : urlFilter === 'memorization' ? 'memorization' : 'all';
  
  // Check if tab param exists in URL (for switching between my-groups and discover)
  const urlTab = searchParams.get('tab');
  const initialTab = urlTab === 'discover' ? 'discover' : 'my-groups';
  
  const [filterType, setFilterType] = useState<'all' | 'memorization' | 'reading'>(initialFilter);
  const [showKhatmahWarning, setShowKhatmahWarning] = useState(false);
  const [pendingKhatmahGroup, setPendingKhatmahGroup] = useState<string | null>(null);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  
  // Mock: User's joined groups (IDs)
  const [joinedGroups, setJoinedGroups] = useState<string[]>(['surah-2', 'khatmah-30']);
  const currentKhatmah = joinedGroups.find(id => id.startsWith('khatmah-'));

  const translations = getTranslations(getStoredLanguage());
  const language = getStoredLanguage();

  // Dynamic color scheme based on filter
  const colorScheme = urlFilter === 'memorization' ? {
    gradient: 'from-purple-50 to-white dark:from-purple-950 dark:to-purple-900',
    text: 'text-purple-600 dark:text-purple-400',
    textDark: 'text-purple-900 dark:text-purple-100',
    bg: 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600',
    bgHover: 'hover:bg-purple-50 dark:hover:bg-purple-900',
    border: 'border-purple-200 dark:border-purple-800',
    borderInput: 'border-purple-200',
    icon: 'text-purple-600',
    cardBorder: 'border-purple-100 dark:border-purple-800',
    cardBg: 'bg-purple-50 dark:bg-purple-900/20',
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    badgeJoined: 'bg-purple-600 dark:bg-purple-700',
    outline: 'border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900',
    button: 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600'
  } : {
    gradient: 'from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900',
    text: 'text-emerald-600 dark:text-emerald-400',
    textDark: 'text-emerald-900 dark:text-emerald-100',
    bg: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600',
    bgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900',
    border: 'border-emerald-200 dark:border-emerald-800',
    borderInput: 'border-emerald-200',
    icon: 'text-emerald-600',
    cardBorder: 'border-emerald-100 dark:border-emerald-800',
    cardBg: 'bg-emerald-50 dark:bg-emerald-900/20',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    badgeJoined: 'bg-emerald-600 dark:bg-emerald-700',
    outline: 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900',
    button: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600'
  };

  // Generate memorization groups from SURAHS
  const memorizationGroups = SURAHS.map(surah => {
    const stats = getSurahMemorizationStats(surah.number, surah.verses);
    const isFullyMemorized = stats.percentComplete === 100;
    const surahName = getSurahName(surah.number, language);
    const surahMeaning = translations.surahMeanings[surah.number - 1];
    
    return {
      id: `surah-${surah.number}`,
      title: language === 'ar' ? `حفظ سورة ${surahName}` : `Memorize Surah ${surah.name}`,
      description: language === 'ar' ? `${surah.verses} آية` : `${surahMeaning} - ${surah.verses} verses`,
      members: Math.floor(Math.random() * 500) + 50, // Mock members
      progress: stats.percentComplete, // Use real progress instead of mock
      type: 'memorization' as const,
      surahNumber: surah.number,
      isFullyMemorized // Add this flag
    };
  });

  // Generate reading groups from KHATMAH_GROUPS
  const readingGroups = KHATMAH_GROUPS.map(khatmah => ({
    id: khatmah.id,
    title: language === 'ar' 
      ? `${translations.completeKhatmahIn} ${khatmah.days} ${khatmah.days === 1 ? translations.day : translations.days}`
      : `${translations.completeKhatmahIn} ${khatmah.days} ${translations.days}`,
    description: language === 'ar'
      ? `${translations.readEntireQuranIn} ${khatmah.days} ${translations.daysWithCommunity}`
      : `${translations.readEntireQuranIn} ${khatmah.days} ${translations.daysWithCommunity}`,
    members: khatmah.members,
    progress: khatmah.progress,
    type: 'reading' as const,
    days: khatmah.days
  }));

  // All available groups
  const allGroups = [...memorizationGroups, ...readingGroups];

  // Filter groups for Discover tab
  const filteredGroups = allGroups.filter(group => {
    // Filter by type
    if (filterType !== 'all' && group.type !== filterType) return false;
    
    // Filter by search query (search in title and description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = group.title.toLowerCase().includes(query);
      const matchesDescription = group.description.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) {
        return false;
      }
    }
    
    return true; // Show all groups including joined ones
  });

  // Get user's joined groups with full details and apply search filter
  const myGroupsData = allGroups.filter(g => {
    // Must be a joined group
    if (!joinedGroups.includes(g.id)) return false;
    
    // Apply type filter when coming from reading/memorization dashboard
    if (filterType !== 'all' && g.type !== filterType) return false;
    
    // Apply search query filter (search in title and description)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTitle = g.title.toLowerCase().includes(query);
      const matchesDescription = g.description.toLowerCase().includes(query);
      if (!matchesTitle && !matchesDescription) {
        return false;
      }
    }
    
    return true;
  });

  // Handle joining a group
  const handleJoinGroup = (groupId: string) => {
    // Check if user is authenticated before joining
    if (!isAuthenticated) {
      navigate(`/auth?redirect=/groups/${groupId}`);
      return;
    }
    
    const isKhatmahGroup = groupId.startsWith('khatmah-');
    
    if (isKhatmahGroup && currentKhatmah && currentKhatmah !== groupId) {
      // User is trying to join a second khatmah group
      setPendingKhatmahGroup(groupId);
      setShowKhatmahWarning(true);
    } else {
      // Join the group
      setJoinedGroups([...joinedGroups, groupId]);
      joinGroupLS(groupId);
    }
  };

  // Confirm switching khatmah groups
  const confirmSwitchKhatmah = () => {
    if (pendingKhatmahGroup && currentKhatmah) {
      // Get the old khatmah before switching
      const oldKhatmah = currentKhatmah;
      
      // Remove old khatmah, add new one
      setJoinedGroups(joinedGroups.filter(id => id !== currentKhatmah).concat(pendingKhatmahGroup));
      switchKhatmahGroup(pendingKhatmahGroup);
      
      // Sync with server if authenticated
      if (isAuthenticated) {
        // Leave old khatmah on server
        leaveGroupOnServer(oldKhatmah);
        // Join new khatmah on server
        joinGroupOnServer(pendingKhatmahGroup);
      }
    }
    setShowKhatmahWarning(false);
    setPendingKhatmahGroup(null);
  };

  useEffect(() => {
    const storedGroups = getJoinedGroups();
    const storedKhatmah = getCurrentKhatmah();
    if (storedGroups) {
      setJoinedGroups(storedGroups);
    }
    if (storedKhatmah) {
      setPendingKhatmahGroup(storedKhatmah);
    }
  }, []);

  return (
    <div className={`min-h-screen ${colorScheme.gradient}`}>
      {/* Header */}
      <AppHeader isAuthenticated={isAuthenticated} onSignOut={onSignOut} onToggleDarkMode={onToggleDarkMode} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button - Show when coming from a filtered context */}
        {urlFilter && (
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => {
                if (urlFilter === 'reading') {
                  navigate('/reading-dashboard');
                } else if (urlFilter === 'memorization') {
                  navigate('/memorization-dashboard');
                }
              }}
              className={`${colorScheme.text} ${colorScheme.bgHover} -ml-2`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {urlFilter === 'reading' 
                ? (language === 'ar' ? 'العودة إلى لوحة القراءة' : 'Back to Reading Dashboard')
                : (language === 'ar' ? 'العودة إلى لوحة الحفظ' : 'Back to Memorization Dashboard')
              }
            </Button>
          </div>
        )}
        
        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${colorScheme.icon}`} />
            <Input
              type="text"
              placeholder={`Search ${translations.circles.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-10 ${colorScheme.borderInput}`}
            />
          </div>
        </div>

        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="my-groups">{translations.myCircles} ({myGroupsData.length})</TabsTrigger>
            <TabsTrigger value="discover">{translations.discover}</TabsTrigger>
          </TabsList>

          <TabsContent value="my-groups" className="space-y-8">
            {myGroupsData.map((group) => {
              // Check if surah is fully memorized
              const isMemorized = group.type === 'memorization' && 'isFullyMemorized' in group && group.isFullyMemorized;
              
              return (
                <Link key={group.id} to={`/groups/${group.id}`} className="block mb-6">
                  <Card className={`p-6 ${colorScheme.cardBorder} hover:shadow-lg transition-shadow cursor-pointer`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-xl ${colorScheme.textDark}`}>{group.title}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            group.type === 'memorization' 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' 
                              : colorScheme.badge
                          }`}>
                            {group.type}
                          </span>
                          {isMemorized && (
                            <span className="px-3 py-1 rounded-full text-xs bg-amber-600 dark:bg-amber-700 text-white font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Memorized
                            </span>
                          )}
                        </div>
                        <p className={`${colorScheme.text} mb-3`}>{group.description}</p>
                      </div>
                    </div>

                    <div className={`flex items-center gap-4 text-sm ${colorScheme.text}`}>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.members} {translations.members.toLowerCase()}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </TabsContent>

          <TabsContent value="discover" className="space-y-8">
            {/* Filter Buttons - Only show when NOT coming from a filtered context */}
            {!urlFilter && (
              <div className="flex gap-2 mb-6">
                <Button
                  variant={filterType === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilterType('all')}
                  className={filterType === 'all' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300'}
                >
                  {translations.all} ({allGroups.length})
                </Button>
                <Button
                  variant={filterType === 'memorization' ? 'default' : 'outline'}
                  onClick={() => setFilterType('memorization')}
                  className={filterType === 'memorization' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300'}
                >
                  {translations.memorization} ({memorizationGroups.length})
                </Button>
                <Button
                  variant={filterType === 'reading' ? 'default' : 'outline'}
                  onClick={() => setFilterType('reading')}
                  className={filterType === 'reading' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300'}
                >
                  {translations.khatmah} ({readingGroups.length})
                </Button>
              </div>
            )}

            {filteredGroups.map((group) => {
              const isJoined = joinedGroups.includes(group.id);
              // Check if surah is fully memorized
              const isMemorized = group.type === 'memorization' && 'isFullyMemorized' in group && group.isFullyMemorized;
              
              return (
                <Link key={group.id} to={`/groups/${group.id}`} className="block mb-6">
                  <Card className={`p-6 ${colorScheme.cardBorder} ${isJoined ? `ring-2 ${urlFilter === 'memorization' ? 'ring-purple-400 dark:ring-purple-500' : 'ring-emerald-400 dark:ring-emerald-500'} shadow-lg` : ''} transition-all hover:shadow-lg cursor-pointer`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`text-xl ${colorScheme.textDark}`}>{group.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${ 
                            group.type === 'memorization' 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' 
                              : colorScheme.badge
                          }`}>
                            {group.type === 'memorization' ? translations.memorization : translations.khatmah}
                          </span>
                          {isMemorized && (
                            <span className="px-3 py-1 rounded-full text-xs bg-amber-600 dark:bg-amber-700 text-white font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {translations.memorized}
                            </span>
                          )}
                        </div>
                        <p className={`${colorScheme.text} mb-3`}>{group.description}</p>
                      </div>
                      {isJoined ? (
                        <div className={`w-10 h-10 rounded-full ${urlFilter === 'memorization' ? 'bg-purple-100 dark:bg-purple-900' : 'bg-emerald-100 dark:bg-emerald-900'} flex items-center justify-center shrink-0`}>
                          <Check className={`w-6 h-6 ${urlFilter === 'memorization' ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                        </div>
                      ) : (
                        <Button 
                          className={colorScheme.button} 
                          onClick={(e) => {
                            e.preventDefault(); // Prevent Link navigation
                            handleJoinGroup(group.id);
                          }}
                        >
                          {translations.joinGoal}
                        </Button>
                      )}
                    </div>

                    <div className={`flex items-center gap-4 text-sm ${colorScheme.text}`}>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {group.members} {translations.members.toLowerCase()}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <Card className={`p-6 mt-8 ${colorScheme.cardBorder} ${colorScheme.cardBg}`}>
          <h3 className={`text-lg ${colorScheme.textDark} mb-2`}>{translations.aboutCircleGoals}</h3>
          <p className={`${colorScheme.text} mb-4`}>
            {translations.aboutCircleGoalsDesc}
          </p>
          <ul className={`space-y-2 text-sm ${colorScheme.text}`}>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${urlFilter === 'memorization' ? 'bg-purple-600 dark:bg-purple-400' : 'bg-emerald-600 dark:bg-emerald-400'}`} />
              {translations.noUsernamesVisible}
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${urlFilter === 'memorization' ? 'bg-purple-600 dark:bg-purple-400' : 'bg-emerald-600 dark:bg-emerald-400'}`} />
              {translations.progressTrackedCollectively}
            </li>
            <li className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${urlFilter === 'memorization' ? 'bg-purple-600 dark:bg-purple-400' : 'bg-emerald-600 dark:bg-emerald-400'}`} />
              {translations.noChatOrComments}
            </li>
          </ul>
        </Card>
      </div>

      {/* Khatmah Warning Dialog */}
      <Dialog open={showKhatmahWarning} onOpenChange={setShowKhatmahWarning}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              {language === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
            </DialogTitle>
            <DialogDescription className="space-y-4 pt-4">
              <div className={`p-4 rounded-lg ${urlFilter === 'memorization' ? 'bg-purple-50 dark:bg-purple-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
                <p className={`font-medium mb-2 ${urlFilter === 'memorization' ? 'text-purple-900 dark:text-purple-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
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
              className={`flex-1 ${urlFilter === 'memorization' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
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
    </div>
  );
}