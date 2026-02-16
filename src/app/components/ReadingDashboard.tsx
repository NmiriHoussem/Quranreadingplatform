import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router';
import { Users, TrendingUp, Clock, BookOpen, Calendar, ChevronRight, Loader2, Plus, Moon, Sun, Mail, UserPlus, Check, X, ArrowLeft, Book, Globe, Lock, Target, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { createPrivateKhatmah as createPrivateKhatmahSupabase, getPrivateKhatmahs as getPrivateKhatmahsSupabase, type PrivateKhatmah, getPendingInvitations, acceptPrivateKhatmahInvitation, declinePrivateKhatmahInvitation, type PrivateKhatmahInvitation, deletePrivateKhatmah, loadProgressFromDatabase } from '../../services/privateKhatmahService';
import { getCurrentSession } from '../../services/authService';
import { joinGroupOnServer } from '../../services/syncService';
import ProfileMenu from './ProfileMenu';
import { getTranslations, getStoredLanguage, setStoredLanguage, type Language } from '../utils/translations';
import CreatePrivateKhatmahModal from './CreatePrivateKhatmahModal';
import InvitationMigrationModal from './InvitationMigrationModal';
import SuccessModal from './SuccessModal';
import ConfirmationModal from './ConfirmationModal';
import { AuthRequiredModal } from './AuthRequiredModal';
import Logo from './Logo';
import { getCachedData, setCachedData, CACHE_KEYS, areDataEqual, invalidateCache, isCacheStale } from '../../services/cacheService';
import { 
  getPrivateKhatmahIds, 
  initializePrivateKhatmahProgress, 
  joinPrivateKhatmah,
  leavePrivateKhatmah,
  getPublicKhatmahReadingStats,
  getCurrentKhatmah,
  migrateKhatmahProgressStructure,
  joinGroup,
  isMemberOfGroup,
  getJoinedGroups,
  getKhatmahReadingStats,
  calculateKhatmahMilestonesForGroup,
  isKhatmahPageRead,
  getPrivateKhatmahReadingStats,
  calculatePrivateKhatmahMilestones,
  isPrivateKhatmahPageRead,
  restorePrivateKhatmahProgressFromDB
} from '../utils/localStorage';

// Khatmah reading groups
const KHATMAH_GROUPS = [
  { id: 'khatmah-7', days: 7, members: 234, progress: 92 },
  { id: 'khatmah-10', days: 10, members: 456, progress: 85 },
  { id: 'khatmah-15', days: 15, members: 678, progress: 88 },
  { id: 'khatmah-30', days: 30, members: 891, progress: 82 },
  { id: 'khatmah-60', days: 60, members: 543, progress: 76 },
  { id: 'khatmah-90', days: 90, members: 321, progress: 71 }
];

interface ReadingDashboardProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
  onToggleDarkMode?: () => void;
}

export default function ReadingDashboard({ isAuthenticated, onSignOut, onToggleDarkMode }: ReadingDashboardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const language = getStoredLanguage();
  const t = getTranslations(language);
  
  // Debug logging
  console.log('🔧 ReadingDashboard render:', {
    language,
    translations: { publicKhatmahs: t.publicKhatmahs, privateKhatmahs: t.privateKhatmahs },
    isAuthenticated
  });
  
  // Initialize activeTab from URL parameter or default to 'public'
  const [activeTab, setActiveTab] = useState<'public' | 'private'>(() => {
    const tabParam = searchParams.get('tab');
    return tabParam === 'private' ? 'private' : 'public';
  });
  
  // Update activeTab when URL changes
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'private' || tabParam === 'public') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [privateKhatmahs, setPrivateKhatmahs] = useState<(PrivateKhatmah & { members?: any[] })[]>([]);
  const [isLoadingPrivateKhatmahs, setIsLoadingPrivateKhatmahs] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<(PrivateKhatmahInvitation & { khatmah?: PrivateKhatmah })[]>([]);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string; buttonText: string }>({
    isOpen: false,
    title: '',
    message: '',
    buttonText: ''
  });
  
  // Confirmation modal state for delete confirmation
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    cancelText: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: '',
    cancelText: ''
  });
  
  // Migration modal state for first-time private khatmah join
  const [migrationModal, setMigrationModal] = useState<{
    isOpen: boolean;
    invitationId: string;
    khatmahId: string;
    khatmahName: string;
    khatmahDuration: number;
  } | null>(null);
  
  // Check dark mode on mount
  useEffect(() => {
    try {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    } catch (err) {
      console.error('Error checking dark mode:', err);
    }
  }, []);

  // Run migration on mount
  useEffect(() => {
    try {
      migrateKhatmahProgressStructure();
    } catch (err) {
      console.error('Error migrating khatmah progress structure:', err);
    }
  }, []);

  // Load current user ID
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const { user } = await getCurrentSession();
        if (user) {
          setCurrentUserId(user.id);
        }
      } catch (err) {
        console.error('Error loading current user:', err);
      }
    };
    if (isAuthenticated) {
      loadCurrentUser();
    }
  }, [isAuthenticated]);

  // Update dark mode state when toggled
  const handleToggleDarkMode = () => {
    try {
      if (onToggleDarkMode) {
        onToggleDarkMode();
        // Update state after a short delay to ensure DOM has updated
        setTimeout(() => {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }, 50);
      }
    } catch (err) {
      console.error('Error toggling dark mode:', err);
    }
  };
  
  const toggleLanguage = () => {
    try {
      const newLanguage: Language = language === 'en' ? 'ar' : 'en';
      setStoredLanguage(newLanguage);
      window.location.reload();
    } catch (err) {
      console.error('Error toggling language:', err);
    }
  };

  // Load private khatmahs when authenticated and tab is active
  useEffect(() => {
    if (isAuthenticated && activeTab === 'private') {
      loadPrivateKhatmahs();
      loadPendingInvitations();
    }
  }, [isAuthenticated, activeTab]);

  const loadPrivateKhatmahs = async () => {
    try {
      setIsLoadingPrivateKhatmahs(true);
      
      // Try to load from cache first (stale-while-revalidate strategy)
      const cachedData = getCachedData<PrivateKhatmah[]>(CACHE_KEYS.PRIVATE_KHATMAHS);
      if (cachedData && cachedData.length > 0) {
        console.log('⚡ Loading from cache immediately');
        
        // Register all cached khatmahs in localStorage metadata
        cachedData.forEach(khatmah => {
          joinPrivateKhatmah(khatmah.id);
          console.log('📝 Registered cached khatmah in metadata:', khatmah.id);
        });
        
        setPrivateKhatmahs(cachedData);
        setIsLoadingPrivateKhatmahs(false);
      }
      
      // Fetch fresh data in background
      const { khatmahs, error } = await getPrivateKhatmahsSupabase();
      if (!error && Array.isArray(khatmahs)) {
        console.log('📚 Loaded', khatmahs.length, 'private khatmahs from server');
        
        // Check if data has changed
        const dataChanged = !areDataEqual(cachedData, khatmahs);
        
        if (dataChanged) {
          console.log('🔄 Data changed, updating UI and cache');
          
          // Register all khatmahs in localStorage metadata
          khatmahs.forEach(khatmah => {
            // Always call joinPrivateKhatmah to ensure it's registered in metadata
            // The function itself handles duplicate checks
            joinPrivateKhatmah(khatmah.id);
            console.log('📝 Registered private khatmah in metadata:', khatmah.id);
          });
          
          // Load progress from database for the first khatmah (unified progress applies to all)
          if (khatmahs.length > 0) {
            console.log('🔍 Loading progress for khatmah:', khatmahs[0].id);
            const { progress, error: progressError } = await loadProgressFromDatabase(khatmahs[0].id);
            console.log('📊 Progress from DB:', progress ? `Found ${Object.keys(progress.pagesRead || {}).length} pages` : 'null');
            
            if (progress && !progressError) {
              console.log('📥 Restoring private khatmah progress from database...');
              restorePrivateKhatmahProgressFromDB(progress);
              
              // Verify the progress was restored
              const stats = getPrivateKhatmahReadingStats();
              console.log('✅ Stats after restore:', stats);
            } else if (progressError) {
              console.warn('⚠️ Could not load progress from database:', progressError);
            } else {
              console.warn('⚠️ No progress data found in database');
            }
          }
          
          // Update cache and UI
          setCachedData(CACHE_KEYS.PRIVATE_KHATMAHS, khatmahs);
          setPrivateKhatmahs(khatmahs);
        } else {
          console.log('✨ Data unchanged, using cached version');
        }
      } else {
        console.error('Error loading private khatmahs:', error);
        // Don't clear the cached data on error - keep showing what we have
        if (!cachedData) {
          setPrivateKhatmahs([]);
        }
      }
    } catch (err) {
      console.error('Exception in loadPrivateKhatmahs:', err);
      // Don't clear cached data on exception
      const cachedData = getCachedData<PrivateKhatmah[]>(CACHE_KEYS.PRIVATE_KHATMAHS);
      if (!cachedData) {
        setPrivateKhatmahs([]);
      }
    } finally {
      setIsLoadingPrivateKhatmahs(false);
    }
  };

  const loadPendingInvitations = async () => {
    try {
      setIsLoadingInvitations(true);
      const { invitations, error } = await getPendingInvitations();
      if (!error && Array.isArray(invitations)) {
        setPendingInvitations(invitations);
      } else if (error) {
        // Only log if there's an actual error message (not null from permission issues)
        console.error('Error loading invitations:', error);
        setPendingInvitations([]);
      } else {
        setPendingInvitations([]);
      }
    } catch (err) {
      console.error('Exception in loadPendingInvitations:', err);
      setPendingInvitations([]);
    } finally {
      setIsLoadingInvitations(false);
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      // Find the invitation to get the khatmah ID
      const invitation = pendingInvitations.find(inv => inv.id === invitationId);
      
      const { success, error } = await acceptPrivateKhatmahInvitation(invitationId);
      if (success) {
        // Join the private khatmah in localStorage
        if (invitation?.khatmah_id) {
          // Check if this is the first private khatmah - show migration modal
          const existingPrivateIds = getPrivateKhatmahIds();
          
          if (existingPrivateIds.length === 0) {
            // First private khatmah - show migration modal
            setMigrationModal({
              isOpen: true,
              invitationId: invitationId,
              khatmahId: invitation.khatmah_id,
              khatmahName: invitation.khatmah?.name || 'Private Khatmah',
              khatmahDuration: invitation.khatmah?.duration || 30
            });
            return;
          } else {
            // Not the first private khatmah - just join
            joinPrivateKhatmah(invitation.khatmah_id);
            console.log('✅ Joined private khatmah:', invitation.khatmah_id);
          }
        }
        
        // Reload invitations and khatmahs
        invalidateCache(CACHE_KEYS.PRIVATE_KHATMAHS);
        await loadPendingInvitations();
        await loadPrivateKhatmahs();
        setSuccessModal({
          isOpen: true,
          title: language === 'ar' ? 'تم قبول الدعوة بنجاح!' : 'Invitation accepted successfully!',
          message: '',
          buttonText: language === 'ar' ? 'حسناً' : 'OK'
        });
      } else {
        alert(language === 'ar' ? `خطأ: ${error}` : `Error: ${error}`);
      }
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert(language === 'ar' ? 'حدث خطأ أثناء قبول الدعوة' : 'An error occurred while accepting the invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const { success, error } = await declinePrivateKhatmahInvitation(invitationId);
      if (success) {
        // Reload invitations
        await loadPendingInvitations();
        alert(language === 'ar' ? 'تم رفض الدعوة' : 'Invitation declined');
      } else {
        alert(language === 'ar' ? `خطأ: ${error}` : `Error: ${error}`);
      }
    } catch (err) {
      console.error('Error declining invitation:', err);
      alert(language === 'ar' ? 'حدث خطأ أثناء رفض الدعوة' : 'An error occurred while declining the invitation');
    }
  };

  const handleDeletePrivateKhatmah = async (khatmahId: string, khatmahName: string) => {
    // Show custom confirmation modal instead of native alert
    const performDelete = async () => {
      try {
        // First, remove from localStorage
        leavePrivateKhatmah(khatmahId);
        console.log('✅ Cleaned up localStorage for private khatmah:', khatmahId);
        
        // Then delete from database
        const { success, error } = await deletePrivateKhatmah(khatmahId);
        if (success) {
          // Invalidate cache so fresh data is fetched next time
          invalidateCache(CACHE_KEYS.PRIVATE_KHATMAHS);
          
          // Remove from local state immediately
          setPrivateKhatmahs(prev => prev.filter(k => k.id !== khatmahId));
          
          setSuccessModal({
            isOpen: true,
            title: language === 'ar' ? 'تم حذف الختمة بنجاح' : 'Khatmah deleted successfully',
            message: '',
            buttonText: language === 'ar' ? 'حسناً' : 'OK'
          });
        } else {
          alert(language === 'ar' ? `خطأ: ${error}` : `Error: ${error}`);
        }
      } catch (err) {
        console.error('Error deleting khatmah:', err);
        alert(language === 'ar' ? 'حدث خطأ أثناء حذف الختمة' : 'An error occurred while deleting the khatmah');
      }
    };

    setConfirmationModal({
      isOpen: true,
      title: language === 'ar' ? 'تأكيد الحذف' : 'Confirm Deletion',
      message: language === 'ar' 
      ? `هل أنت متأكد أنك تريد حذف "${khatmahName}"؟ سيتم حذف جميع البيانات المرتبطة بها.`
      : `Are you sure you want to delete "${khatmahName}"? All associated data will be removed.`,
      confirmText: language === 'ar' ? 'حذف' : 'Delete',
      cancelText: language === 'ar' ? 'إلغاء' : 'Cancel',
      onConfirm: performDelete
    });

  };

  const handleCreatePrivateKhatmah = async (data: {
    duration: number;
    groupName: string;
    memberEmails: string[];
  }) => {
    try {
      const { user } = await getCurrentSession();
      if (!user) {
        setIsCreateModalOpen(false);
        setIsAuthModalOpen(true);
        return;
      }

      // Create the private khatmah in Supabase
      const { khatmah, error } = await createPrivateKhatmahSupabase({
        name: data.groupName,
        duration: data.duration,
        memberEmails: data.memberEmails,
      });

      if (error || !khatmah) {
        alert(language === 'ar' ? 'فشل إنشاء الختمة' : 'Failed to create khatmah');
        return;
      }

      // Join the private khatmah in localStorage (creator is automatically a member)
      joinPrivateKhatmah(khatmah.id);
      console.log('✅ Creator joined private khatmah:', khatmah.id);

      // Close modal and reload private khatmahs
      setIsCreateModalOpen(false);
      
      // Invalidate cache so fresh data is fetched
      invalidateCache(CACHE_KEYS.PRIVATE_KHATMAHS);
      loadPrivateKhatmahs();

      // Show success modal
      setSuccessModal({
        isOpen: true,
        title: language === 'ar' 
          ? `تم إنشاء الختمة "${data.groupName}" بنجاح!${data.memberEmails.length > 0 ? ' تم إرسال الدعوات.' : ''}` 
          : `Private khatmah created successfully! ${data.memberEmails.length > 0 ? 'Invitations sent.' : ''}`,
        message: '',
        buttonText: language === 'ar' ? 'حسناً' : 'OK'
      });
    } catch (err) {
      console.error('Error in handleCreatePrivateKhatmah:', err);
      alert(language === 'ar' ? 'حدث خطأ أثناء إنشاء الختمة' : 'An error occurred while creating the khatmah');
    }
  };

  // Handle joining a khatmah group
  const handleJoinKhatmah = async (groupId: string) => {
    try {
      // Check if user is authenticated before joining
      if (!isAuthenticated) {
        navigate(`/auth?redirect=/reading-dashboard`);
        return;
      }

      // Join the group
      joinGroup(groupId);

      // Sync with server if authenticated
      if (isAuthenticated) {
        await joinGroupOnServer(groupId);
      }

      // Reload the page to show the new khatmah
      window.location.reload();
    } catch (err) {
      console.error('Error joining khatmah:', err);
      alert(language === 'ar' ? 'حدث خطأ أثناء الانضمام للختمة' : 'An error occurred while joining the khatmah');
    }
  };

  // Safely get data with error handling
  let joinedGroups: string[] = [];
  let currentKhatmah: string | null = null;
  let currentKhatmahStats = null;
  let currentKhatmahDays = 0;
  let currentKhatmahMilestones: any[] = [];
  let completedDays = 0;
  let totalPagesRead = 0;
  let totalPagesGoal = 604;
  let overallProgress = 0;
  let todayMilestone: any = null;
  let todayMilestoneNumber = 0;
  let todayMilestonePagesRead = 0;
  let todayMilestoneTotalPages = 0;
  let pagesRemainingToday = 0;
  let todayMilestoneProgress = 0;
  let groupsWithStats: any[] = [];
  let currentKhatmahData: any = null;
  let completedKhatmahs: any[] = [];

  try {
    joinedGroups = getJoinedGroups();
    currentKhatmah = getCurrentKhatmah();

    // Calculate stats for current khatmah only (not aggregate)
    currentKhatmahStats = currentKhatmah ? getKhatmahReadingStats(currentKhatmah) : null;
    currentKhatmahDays = currentKhatmah ? parseInt(currentKhatmah.split('-')[1]) : 0;
    currentKhatmahMilestones = currentKhatmah ? calculateKhatmahMilestonesForGroup(currentKhatmah, currentKhatmahDays) : [];
    completedDays = currentKhatmahMilestones.filter((m: any) => m.completed).length;
    
    // Use current khatmah stats for overall progress
    totalPagesRead = currentKhatmahStats?.pagesRead || 0;
    overallProgress = currentKhatmahStats?.percentComplete || 0;

    // Calculate today's milestone remaining pages
    todayMilestone = currentKhatmahMilestones.find((m: any) => !m.completed);
    todayMilestoneNumber = todayMilestone 
      ? currentKhatmahMilestones.findIndex((m: any) => !m.completed) + 1 
      : currentKhatmahMilestones.length > 0 ? currentKhatmahMilestones.length : 0;
    
    // Calculate today's milestone progress by counting pages within the milestone range
    if (todayMilestone && currentKhatmah) {
      const todayMilestoneStartPage = todayMilestone.startPage;
      const todayMilestoneEndPage = todayMilestone.endPage;
      todayMilestoneTotalPages = todayMilestoneEndPage - todayMilestoneStartPage + 1;
      
      // Count how many pages in TODAY'S milestone range have been marked as read
      for (let page = todayMilestoneStartPage; page <= todayMilestoneEndPage; page++) {
        if (isKhatmahPageRead(currentKhatmah, page)) {
          todayMilestonePagesRead++;
        }
      }
      
      // Safely calculate progress to avoid NaN
      todayMilestoneProgress = todayMilestoneTotalPages > 0 
        ? (todayMilestonePagesRead / todayMilestoneTotalPages) * 100 
        : 0;
      pagesRemainingToday = Math.max(0, todayMilestoneTotalPages - todayMilestonePagesRead);
    }
    
    // Build list of all khatmahs with their stats
    groupsWithStats = joinedGroups.map(groupId => {
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
    currentKhatmahData = groupsWithStats.find(g => g.groupId === currentKhatmah);
    completedKhatmahs = groupsWithStats.filter(g => g.stats && g.stats.percentComplete === 100 && g.groupId !== currentKhatmah);
  } catch (err) {
    console.error('Error loading khatmah data:', err);
    // Set safe defaults if there's an error
    joinedGroups = [];
    groupsWithStats = [];
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900">
      {/* Header */}
      <header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/home">
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
                onClick={handleToggleDarkMode}
              >
                {isDarkMode ? (
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

      <div className="container mx-auto px-4 py-8 max-w-4xl pb-24 md:pb-8">
        {/* Guest Mode Banner */}
        {!isAuthenticated && (
          <Card className="p-4 mb-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                  {language === 'ar' ? 'وضع الضيف' : 'Guest Mode'}
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {language === 'ar' 
                    ? 'تقدمك محفوظ محليًا على هذا الجهاز فقط. سجّل حسابًا لمزامنة تقدمك عبر جميع أجهزتك.' 
                    : 'Your progress is saved locally on this device only. Create an account to sync your progress across all devices.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs - Desktop */}
        <div className="hidden md:flex justify-center mb-6">
          <div className="inline-flex rounded-lg border-2 border-emerald-200 dark:border-emerald-700 p-1 bg-white dark:bg-emerald-950">
            <button
              onClick={() => setActiveTab('public')}
              className={`px-8 py-2 rounded-md transition-colors ${
                activeTab === 'public'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900'
              }`}
            >
              {t.publicKhatmahs}
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`flex items-center gap-2 px-8 py-2 rounded-md transition-colors ${
                activeTab === 'private'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900'
              }`}
            >
              <Lock className="w-4 h-4" />
              {t.privateKhatmahs}
            </button>
          </div>
        </div>

        {/* Pending Invitations Banners */}
        {isAuthenticated && activeTab === 'private' && pendingInvitations.length > 0 && (
          <div className="space-y-3 mb-6">
            {pendingInvitations.map((invitation) => (
              <Card 
                key={invitation.id} 
                className="p-4 border-2 border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                      <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                        {invitation.khatmah?.name || (language === 'ar' ? 'ختمة خاصة' : 'Private Khatmah')}
                      </h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {language === 'ar' 
                          ? `دعوة للانضمام إلى ختمة خاصة` 
                          : `Invitation to join a private khatmah`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
                      onClick={() => handleAcceptInvitation(invitation.id)}
                    >
                      {language === 'ar' ? 'قبول' : 'Accept'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => handleDeclineInvitation(invitation.id)}
                    >
                      {language === 'ar' ? 'رفض' : 'Refuse'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
        
        {/* Today's Milestone Progress - Only Current Milestone */}
        {currentKhatmah && currentKhatmahData && currentKhatmahMilestones.length > 0 && activeTab === 'public' && (
          <Card 
            className="p-6 mb-8 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50 cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-600 transition-all"
            onClick={() => {
              if (currentKhatmahData?.stats) {
                const nextPage = (currentKhatmahData.stats.lastReadPage || 0) + 1;
                const pageToNavigate = Math.min(nextPage, 604);
                localStorage.setItem(`khatmah-${currentKhatmahData.groupId}-currentPage`, pageToNavigate.toString());
                navigate(`/khatmah/${currentKhatmahData.groupId}`);
              }
            }}
          >
            <h2 className="text-xl text-emerald-900 dark:text-emerald-100 mb-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {language === 'ar' ? `ورد اليوم ${todayMilestoneNumber}` : `Day ${todayMilestoneNumber} Goal`}
            </h2>
            
            {todayMilestone ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Pages Read in Current Milestone */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-2xl text-emerald-900 dark:text-emerald-100">{todayMilestonePagesRead}</div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400">
                        {language === 'ar' ? 'صفحات مقروءة' : 'Pages Read'}
                      </div>
                    </div>
                  </div>

                  {/* Pages Remaining in Current Milestone */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                      <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-2xl text-emerald-900 dark:text-emerald-100">{pagesRemainingToday}</div>
                      <div className="text-sm text-emerald-600 dark:text-emerald-400">
                        {language === 'ar' ? 'صفحات متبقية' : 'Pages Remaining'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div 
                    className="text-sm text-emerald-600 dark:text-emerald-400"
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                  >
                    {pagesRemainingToday > 0 ? (
                      language === 'ar' 
                        ? `${pagesRemainingToday} صفحة متبقية لإكمال ورد اليوم ${todayMilestoneNumber}`
                        : `${pagesRemainingToday} pages remaining to complete Day ${todayMilestoneNumber} goal`
                    ) : (
                      language === 'ar'
                        ? `🎉 أكملت ورد اليوم ${todayMilestoneNumber}!`
                        : `🎉 Day ${todayMilestoneNumber} goal completed!`
                    )}
                  </div>
                  <div className="relative">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 rounded-full overflow-hidden bg-emerald-100 dark:bg-emerald-900/30">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 dark:from-emerald-400 dark:via-emerald-500 dark:to-emerald-400 transition-all duration-1000 ease-out relative"
                        style={{ width: `${todayMilestoneProgress}%` }}
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
                    <div className="relative h-3 flex items-center justify-end px-2">
                      {todayMilestoneProgress > 15 && (
                        <span className="text-xs text-white dark:text-white font-semibold drop-shadow-md">
                          {Math.round(todayMilestoneProgress)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-emerald-600 dark:text-emerald-400">
                  {language === 'ar' 
                    ? '🎉 أكملت جميع أيام الختمة!' 
                    : '🎉 All milestones completed!'}
                </p>
              </div>
            )}
          </Card>
        )}
        
        {/* Public Khatmahs Tab Content */}
        {activeTab === 'public' && (
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
                    
                    <Progress value={currentKhatmahData.stats.percentComplete} className="h-3 mb-2" />
                    <p className="text-sm text-center text-emerald-600 dark:text-emerald-400" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {language === 'ar' 
                        ? `${604 - currentKhatmahData.stats.pagesRead} صفحة متبقية`
                        : `${604 - currentKhatmahData.stats.pagesRead} pages remaining`
                      }
                    </p>
                    
                    <div className="flex gap-3 mt-4">
                      <Button 
                        variant="outline"
                        className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 py-6"
                        onClick={() => {
                          window.scrollTo(0, 0);
                          // Store navigation source in sessionStorage as backup
                          sessionStorage.setItem('khatmah-nav-source', 'public-khatmahs');
                          navigate(`/groups/${currentKhatmahData.groupId}`, { state: { from: 'public-khatmahs' } });
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
                                {language === 'ar' ? 'مكمل 100%' : 'Completed 100%'}
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
              /* Empty State with Available Khatmahs */
              <div className="space-y-4">
                <Card className="p-8 border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-4">
                    <Book className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg text-emerald-900 dark:text-emerald-100 mb-2">
                    {language === 'ar' ? 'لم تنضم إلى أي ختمة بعد' : 'No Khatmahs Yet'}
                  </h3>
                  <p className="text-emerald-600 dark:text-emerald-400 mb-4">
                    {language === 'ar' 
                      ? 'انضم إلى ختمة لتبدأ رحلة قراءة القرآن مع الآخرين' 
                      : 'Join a khatmah to start reading the Quran with others'}
                  </p>
                </Card>

                {/* Available Khatmahs */}
                <h3 className="text-xl text-emerald-900 dark:text-emerald-100 mb-4 font-semibold">
                  {language === 'ar' ? 'الختمات المتاحة' : 'Available Khatmahs'}
                </h3>
                <div className="space-y-4">
                  {KHATMAH_GROUPS.map((khatmah) => {
                    const getArabicDaysWord = (days: number) => {
                      if (days === 1) return 'يوم';
                      if (days === 2) return 'يومين';
                      if (days >= 3 && days <= 10) return 'أيام';
                      return 'يوم';
                    };

                    const title = language === 'ar' 
                      ? `إتمام الختمة في ${khatmah.days} ${getArabicDaysWord(khatmah.days)}`
                      : `Complete Khatmah in ${khatmah.days} Days`;
                    
                    const description = language === 'ar'
                      ? `اقرأ القرآن كاملاً في ${khatmah.days} ${getArabicDaysWord(khatmah.days)} مع المجتمع`
                      : `Read the entire Quran in ${khatmah.days} days with the community`;

                    return (
                      <Card key={khatmah.id} className="p-6 border-emerald-100 dark:border-emerald-800 hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-xl text-emerald-900 dark:text-emerald-100">{title}</h3>
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                                {language === 'ar' ? 'ختمة' : 'Khatmah'}
                              </span>
                            </div>
                            <p className="text-emerald-600 dark:text-emerald-400 mb-3">{description}</p>
                          </div>
                          <Button 
                            className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600" 
                            onClick={() => handleJoinKhatmah(khatmah.id)}
                          >
                            {language === 'ar' ? 'انضم' : 'Join'}
                          </Button>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-emerald-600 dark:text-emerald-400">
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {khatmah.members} {language === 'ar' ? 'عضو' : 'members'}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Private Khatmahs Tab Content */}
        {activeTab === 'private' && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                <Lock className="w-6 h-6" />
                {t.privateKhatmahs}
              </h2>
              <Button className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600" onClick={() => {
                if (!isAuthenticated) {
                  setIsAuthModalOpen(true);
                  return;
                }
                setIsCreateModalOpen(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                {t.createPrivateKhatmah}
              </Button>
            </div>

            {/* Unified Progress Info Notice */}
            <div className="mb-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg px-4 py-3">
              <div className="flex items-start gap-2">
                <div className="text-xs text-purple-800 dark:text-purple-200">
                  <strong>{language === 'ar' ? '📚 ملاحظة:' : '📚 Note:'}</strong>{' '}
                  {language === 'ar' 
                    ? 'تقدمك يتزامن تلقائياً عبر جميع ختماتك الخاصة. قراءتك في أي ختمة خاصة ستظهر في جميع مجموعاتك الخاصة.'
                    : 'Your progress syncs automatically across all your private khatmahs. Reading in any private khatmah will update all your private groups.'}
                </div>
              </div>
            </div>

            {privateKhatmahs.length > 0 ? (
              <div className="space-y-4">
                {privateKhatmahs.map((khatmah) => {
                  const memberCount = khatmah.members?.filter(m => m.status === 'active').length || 0;
                  const totalMembers = (khatmah.members?.length || 0) + 1; // +1 for creator
                  
                  // Get reading stats for this specific private khatmah
                  const privateStats = getPrivateKhatmahReadingStats();
                  const hasProgress = privateStats.pagesRead > 0;
                  
                  // Calculate milestones based on this khatmah's duration
                  const milestones = calculatePrivateKhatmahMilestones(khatmah.duration);
                  const completedDays = milestones.filter(m => m.completed).length;
                  const currentDay = Math.min(completedDays + 1, khatmah.duration);
                  
                  // Calculate today's wird progress
                  const todayMilestone = milestones.find(m => !m.completed);
                  let todayProgress = 0;
                  let todayPagesRead = 0;
                  let todayTotalPages = 0;
                  
                  if (todayMilestone) {
                    todayTotalPages = todayMilestone.endPage - todayMilestone.startPage + 1;
                    for (let page = todayMilestone.startPage; page <= todayMilestone.endPage; page++) {
                      if (isPrivateKhatmahPageRead(khatmah.id, page)) {
                        todayPagesRead++;
                      }
                    }
                    todayProgress = (todayPagesRead / todayTotalPages) * 100;
                  }
                  
                  const isCompleted = completedDays === khatmah.duration;
                  
                  return (
                    <Card key={khatmah.id} className="p-6 border-2 border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <h3 className="text-xl text-emerald-900 dark:text-emerald-100 font-semibold">
                              {khatmah.name}
                            </h3>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-emerald-600 dark:text-emerald-400">
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>
                                {language === 'ar' 
                                  ? `${totalMembers} ${totalMembers === 1 ? 'عضو' : 'أعضاء'}`
                                  : `${totalMembers} ${totalMembers === 1 ? 'member' : 'members'}`
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              <span>
                                {language === 'ar' 
                                  ? `${khatmah.duration} يوم`
                                  : `${khatmah.duration} days`
                                }
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-emerald-600 text-white dark:bg-emerald-500">
                          {language === 'ar' ? 'نشط' : 'Active'}
                        </Badge>
                      </div>
                      
                      {/* Progress Section */}
                      <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg border border-purple-200 dark:border-purple-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                              {language === 'ar' ? `اليوم ${currentDay} من ${khatmah.duration}` : `Day ${currentDay} of ${khatmah.duration}`}
                            </div>
                            {isCompleted && (
                              <span className="text-xs">🎉</span>
                            )}
                          </div>
                          <div className="text-xs font-medium text-purple-700 dark:text-purple-300">
                            {Math.round(privateStats.percentComplete)}%
                          </div>
                        </div>
                        
                        {/* Overall Progress Bar */}
                        <div className="mb-3">
                          <div className="relative h-2 rounded-full overflow-hidden bg-purple-200 dark:bg-purple-900/50">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 dark:from-purple-400 dark:to-purple-500 transition-all duration-500"
                              style={{ width: `${privateStats.percentComplete}%` }}
                            />
                          </div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                            {language === 'ar' 
                              ? `${privateStats.pagesRead} من 604 صفحة`
                              : `${privateStats.pagesRead} of 604 pages`}
                          </div>
                        </div>
                        
                        {/* Current Wird Info */}
                        {!isCompleted && todayMilestone && (
                          <div className="pt-3 border-t border-purple-200 dark:border-purple-700">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-medium text-purple-800 dark:text-purple-200">
                                {language === 'ar' ? 'ورد اليوم:' : 'Today\'s Wird:'}
                              </div>
                              <div className="text-xs text-purple-700 dark:text-purple-300">
                                {language === 'ar' 
                                  ? `صفحة ${todayMilestone.startPage}-${todayMilestone.endPage}`
                                  : `Page ${todayMilestone.startPage}-${todayMilestone.endPage}`}
                              </div>
                            </div>
                            <div className="relative h-1.5 rounded-full overflow-hidden bg-purple-200 dark:bg-purple-900/50">
                              <div 
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600 transition-all duration-500"
                                style={{ width: `${todayProgress}%` }}
                              />
                            </div>
                            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                              {todayPagesRead === todayTotalPages ? (
                                language === 'ar' ? '✅ اكتمل ورد اليوم!' : '✅ Today\'s wird completed!'
                              ) : (
                                language === 'ar' 
                                  ? `${todayTotalPages - todayPagesRead} صفحة متبقية`
                                  : `${todayTotalPages - todayPagesRead} pages remaining`
                              )}
                            </div>
                          </div>
                        )}
                        
                        {isCompleted && (
                          <div className="pt-3 border-t border-purple-200 dark:border-purple-700 text-center">
                            <div className="text-sm font-semibold text-purple-800 dark:text-purple-200">
                              {language === 'ar' ? '🎉 أكملت الختمة!' : '🎉 Khatmah completed!'}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Members preview - Only visible to creator */}
                      {currentUserId && khatmah.created_by === currentUserId && khatmah.members && khatmah.members.length > 0 && (
                        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2">
                            {language === 'ar' ? 'الأعضاء:' : 'Members:'}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {khatmah.members.slice(0, 3).map((member) => (
                              <span 
                                key={member.id}
                                className="text-xs px-2 py-1 rounded-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                              >
                                {member.email}
                              </span>
                            ))}
                            {khatmah.members.length > 3 && (
                              <span className="text-xs px-2 py-1 rounded-full bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
                                +{khatmah.members.length - 3} {language === 'ar' ? 'المزيد' : 'more'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        <Button 
                          variant="outline"
                          className="flex-1 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
                          onClick={() => {
                            // Store navigation source in sessionStorage as backup
                            sessionStorage.setItem('khatmah-nav-source', 'private-khatmahs');
                            navigate(`/private-khatmah/${khatmah.id}`, { state: { from: 'private-khatmahs' } });
                          }}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {language === 'ar' ? 'التفاصيل' : 'Details'}
                        </Button>
                        <Button 
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                          onClick={() => {
                            // Find the first unread page to continue from
                            let pageToNavigate = 1;
                            if (hasProgress) {
                              // Find first unread page
                              for (let page = 1; page <= 604; page++) {
                                if (!isPrivateKhatmahPageRead(khatmah.id, page)) {
                                  pageToNavigate = page;
                                  break;
                                }
                              }
                            }
                            
                            // Save the page to localStorage before navigating
                            localStorage.setItem('private-khatmah-currentPage', pageToNavigate.toString());
                            navigate(`/private-khatmah/${khatmah.id}/reader`);
                          }}
                        >
                          <Book className="w-4 h-4 mr-2" />
                          {hasProgress
                            ? (language === 'ar' ? 'متابعة القراءة' : 'Continue Reading')
                            : (language === 'ar' ? 'ابدأ القراءة' : 'Start Reading')
                          }
                        </Button>
                        {/* Delete button - Only visible to creator */}
                        {currentUserId && khatmah.created_by === currentUserId && (
                          <Button 
                            className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600"
                            onClick={() => {
                              handleDeletePrivateKhatmah(khatmah.id, khatmah.name);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {language === 'ar' ? 'حذف' : 'Delete'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-12 border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl text-emerald-900 dark:text-emerald-100 mb-3">
                  {t.noPrivateKhatmahsYet}
                </h3>
                <p className="text-emerald-600 dark:text-emerald-400 mb-8 max-w-md mx-auto">
                  {t.noPrivateKhatmahsDesc}
                </p>
                
                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                  <div className="p-4 bg-white dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      {t.inviteMembers}
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <Target className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      {t.trackTogether}
                    </p>
                  </div>
                  <div className="p-4 bg-white dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <Book className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                      {t.encourageEachOther}
                    </p>
                  </div>
                </div>

                <Button className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600" onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t.createPrivateKhatmah}
                </Button>
              </Card>
            )}
          </div>
        )}

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

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-emerald-950 border-t-2 border-emerald-200 dark:border-emerald-700 z-50">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setActiveTab('public')}
            className={`flex flex-col items-center justify-center py-3 px-4 transition-colors ${
              activeTab === 'public'
                ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-600 dark:border-emerald-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Users className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{t.publicKhatmahs}</span>
          </button>
          <button
            onClick={() => setActiveTab('private')}
            className={`flex flex-col items-center justify-center py-3 px-4 transition-colors ${
              activeTab === 'private'
                ? 'bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-600 dark:border-emerald-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <Lock className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">{t.privateKhatmahs}</span>
          </button>
        </div>
      </div>

      {/* Create Private Khatmah Modal */}
      {isCreateModalOpen && (
        <CreatePrivateKhatmahModal
          key="create-private-khatmah-modal"
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreateKhatmah={handleCreatePrivateKhatmah}
        />
      )}

      {/* Invitation Migration Modal */}
      {migrationModal && (
        <InvitationMigrationModal
          key="invitation-migration-modal"
          isOpen={migrationModal.isOpen}
          khatmahName={migrationModal.khatmahName}
          khatmahDuration={migrationModal.khatmahDuration}
          currentPublicProgress={currentKhatmahStats?.percentComplete || 0}
          currentPublicPagesRead={currentKhatmahStats?.pagesRead || 0}
          currentPublicKhatmahName={currentKhatmahData?.title || ''}
          onClose={() => setMigrationModal(null)}
          onConfirm={async (copyProgress: boolean) => {
            if (!migrationModal) return;
            
            // Initialize private khatmah progress
            if (copyProgress && currentKhatmah) {
              initializePrivateKhatmahProgress(false, currentKhatmah);
            } else {
              initializePrivateKhatmahProgress(true);
            }
            
            // Join the private khatmah
            joinPrivateKhatmah(migrationModal.khatmahId);
            console.log('✅ Joined first private khatmah with migration:', migrationModal.khatmahId);
            
            // Reload private khatmahs
            invalidateCache(CACHE_KEYS.PRIVATE_KHATMAHS);
            await loadPrivateKhatmahs();
            await loadPendingInvitations();
            
            // Close migration modal
            setMigrationModal(null);
            
            // Show success modal
            setSuccessModal({
              isOpen: true,
              title: language === 'ar' ? 'تم قبول الدعوة بنجاح!' : 'Invitation accepted successfully!',
              message: '',
              buttonText: language === 'ar' ? 'حسناً' : 'OK'
            });
          }}
        />
      )}

      {/* Success Modal */}
      {successModal.isOpen && (
        <SuccessModal
          key="success-modal"
          isOpen={successModal.isOpen}
          onClose={() => setSuccessModal({ isOpen: false, title: '', message: '', buttonText: '' })}
          title={successModal.title}
          message={successModal.message}
          buttonText={successModal.buttonText}
        />
      )}

      {/* Confirmation Modal */}
      {confirmationModal.isOpen && (
        <ConfirmationModal
          key="confirmation-modal"
          isOpen={confirmationModal.isOpen}
          onClose={() => setConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {}, confirmText: '', cancelText: '' })}
          onConfirm={confirmationModal.onConfirm}
          title={confirmationModal.title}
          message={confirmationModal.message}
          confirmText={confirmationModal.confirmText}
          cancelText={confirmationModal.cancelText}
          isDanger={true}
        />
      )}

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSignup={() => {
          setIsAuthModalOpen(false);
          navigate('/auth');
        }}
        language={language}
      />
    </div>
  );
}