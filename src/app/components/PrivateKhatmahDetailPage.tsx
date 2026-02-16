import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { ArrowLeft, Users, Sun, Moon, BookOpen, Calendar, Check, Loader2, UserPlus } from 'lucide-react';
import { getPrivateKhatmahById, getKhatmahMembersWithProgress, updateMemberFullName, addMembersToPrivateKhatmah } from '../../services/privateKhatmahService';
import { getPrivateKhatmahReadingStats, isPrivateKhatmah, calculatePrivateKhatmahMilestones, isPrivateKhatmahPageRead } from '../utils/localStorage';
import { getCurrentSession } from '../../services/authService';
import { supabase } from '../../lib/supabase';
import ProfileMenu from './ProfileMenu';
import Logo from './Logo';
import { getTranslations, getStoredLanguage } from '../utils/translations';
import SetFullNameModal from './SetFullNameModal';
import AddMembersModal from './AddMembersModal';

interface PrivateKhatmahDetailPageProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
  onToggleDarkMode?: () => void;
}

interface Member {
  id: string;
  fullName: string;
  email: string;
  progressPercent: number;
  pagesRead: number;
  lastUpdated: string | null;
  status: string;
}

interface Milestone {
  day: number;
  title: string;
  description: string;
  pagesRange: string;
  startPage: number;
  endPage: number;
  totalPages: number;
  completed: boolean;
}

export default function PrivateKhatmahDetailPage({ 
  isAuthenticated, 
  onSignOut,
  onToggleDarkMode 
}: PrivateKhatmahDetailPageProps) {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const lang = getStoredLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === 'ar';

  const [khatmah, setKhatmah] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('quranNightMode');
    return saved === 'true';
  });
  const [showNameModal, setShowNameModal] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState('');
  const [needsFullName, setNeedsFullName] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCreator, setIsCreator] = useState(false);

  const stats = getPrivateKhatmahReadingStats();

  // Calculate completed milestones count
  const completedCount = milestones.filter(m => m.completed).length;
  
  // Get the source from location state OR sessionStorage
  const locationFrom = (location.state as { from?: string })?.from;
  const sessionFrom = sessionStorage.getItem('khatmah-nav-source');
  const from = locationFrom || sessionFrom || undefined;
  
  // Determine back button text
  const getBackButtonText = () => {
    if (from === 'private-khatmahs') {
      return lang === 'ar' ? 'رجوع إلى الختمات الخاصة' : 'Back to Private Khatmahs';
    } else {
      return lang === 'ar' ? 'رجوع' : 'Back';
    }
  };

  useEffect(() => {
    loadKhatmahDetails();
  }, [groupId]);

  useEffect(() => {
    checkIfNeedsFullName();
  }, [members]);

  useEffect(() => {
    checkIfCreator();
  }, [khatmah]);

  const checkIfCreator = async () => {
    try {
      const { user } = await getCurrentSession();
      if (!user || !khatmah) return;
      
      setCurrentUserId(user.id);
      setIsCreator(khatmah.created_by === user.id);
    } catch (error) {
      console.error('Error checking if creator:', error);
    }
  };

  const checkIfNeedsFullName = async () => {
    try {
      const { user } = await getCurrentSession();
      if (!user) return;

      // Check if current user's member record has a full_name
      const currentMember = members.find(m => m.email === user.email);
      if (currentMember && (!currentMember.fullName || currentMember.fullName === user.email?.split('@')[0])) {
        setCurrentUserEmail(user.email || '');
        setNeedsFullName(true);
        setShowNameModal(true);
      }
    } catch (error) {
      console.error('Error checking full name:', error);
    }
  };

  const handleSaveFullName = async (fullName: string) => {
    try {
      const result = await updateMemberFullName(fullName);
      
      if (result.success) {
        console.log('✅ Full name saved successfully');
        setShowNameModal(false);
        setNeedsFullName(false);
        // Reload members to show updated name
        await loadKhatmahDetails();
      } else {
        console.error('Failed to save full name:', result.error);
      }
    } catch (error) {
      console.error('Error saving full name:', error);
    }
  };

  const loadKhatmahDetails = async () => {
    if (!groupId) return;

    try {
      setLoading(true);

      // Verify this is a private khatmah
      if (!isPrivateKhatmah(groupId)) {
        setError('This is not a private khatmah');
        setLoading(false);
        return;
      }

      // Load khatmah details
      const { khatmah: khatmahData, error: khatmahError } = await getPrivateKhatmahById(groupId);
      
      if (khatmahError || !khatmahData) {
        setError(khatmahError || 'Failed to load khatmah');
        setLoading(false);
        return;
      }

      setKhatmah(khatmahData);

      // Load members with progress
      const { members: membersData, error: membersError } = await getKhatmahMembersWithProgress(groupId);
      
      if (membersError) {
        console.error('Error loading members:', membersError);
      } else {
        setMembers(membersData || []);
      }

      // Calculate milestones based on khatmah duration
      const milestonesData = calculatePrivateKhatmahMilestones(khatmahData.duration);
      setMilestones(milestonesData);

      setLoading(false);
    } catch (err) {
      console.error('Error loading khatmah details:', err);
      setError('Failed to load khatmah details');
      setLoading(false);
    }
  };

  const handleToggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('quranNightMode', String(newMode));
    if (onToggleDarkMode) {
      onToggleDarkMode();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return lang === 'ar' ? 'الآن' : 'Just now';
    if (diffMins < 60) return lang === 'ar' ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
    if (diffHours < 24) return lang === 'ar' ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    if (diffDays < 7) return lang === 'ar' ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !khatmah) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="p-6 max-w-md text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Khatmah not found'}</p>
          <Button onClick={() => navigate('/reading')} variant="outline">
            {lang === 'ar' ? 'العودة' : 'Go Back'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header - Matching GroupGoalDetail style */}
      <header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/reading?tab=private" onClick={() => {
            // Clean up sessionStorage when navigating back
            sessionStorage.removeItem('khatmah-nav-source');
          }}>
            <Button variant="ghost" className="text-emerald-600 dark:text-emerald-400">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {getBackButtonText()}
            </Button>
          </Link>
          <div className="flex gap-2 items-center">
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Khatmah Header */}
        <Card className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {khatmah.name}
                </h1>
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  {lang === 'ar' ? 'خاصة' : 'Private'}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{khatmah.duration} {lang === 'ar' ? 'يوم' : 'days'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{members.length} {lang === 'ar' ? 'عضو' : members.length === 1 ? 'member' : 'members'}</span>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                // Find the first unread page to continue from
                let pageToNavigate = 1;
                const stats = getPrivateKhatmahReadingStats();
                if (stats.pagesRead > 0) {
                  // Find first unread page
                  for (let page = 1; page <= 604; page++) {
                    if (!isPrivateKhatmahPageRead(groupId!, page)) {
                      pageToNavigate = page;
                      break;
                    }
                  }
                }
                
                // Save the page to localStorage before navigating
                localStorage.setItem('private-khatmah-currentPage', pageToNavigate.toString());
                navigate(`/private-khatmah/${groupId}/reader`);
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              {lang === 'ar' ? 'متابعة القراءة' : 'Continue Reading'}
            </Button>
          </div>

          {/* Your Progress */}
          <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                {lang === 'ar' ? 'تقدمك' : 'Your Progress'}
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.percentComplete}%
              </span>
            </div>
            <Progress value={stats.percentComplete} className="h-2 mb-2" />
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              {stats.pagesRead} / 604 {lang === 'ar' ? 'صفحة' : 'pages'}
            </p>
          </div>
        </Card>

        {/* Members Section */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {lang === 'ar' ? 'الأعضاء' : 'Members'}
            </h2>
          </div>

          <div className="space-y-3">
            {members.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                {lang === 'ar' ? 'لا يوجد أعضاء بعد' : 'No members yet'}
              </p>
            ) : (
              members.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {member.fullName.charAt(0).toUpperCase()}
                  </div>

                  {/* Member Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {member.fullName}
                      </p>
                      {member.progressPercent === 100 && (
                        <Badge className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs">
                          ✓ {lang === 'ar' ? 'مكتمل' : 'Complete'}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                      {member.email}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {member.pagesRead} / 604 {lang === 'ar' ? 'صفحة' : 'pages'}
                        </span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {member.progressPercent}%
                        </span>
                      </div>
                      <Progress value={member.progressPercent} className="h-1.5" />
                      {member.lastUpdated && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {lang === 'ar' ? 'آخر تحديث: ' : 'Last updated: '}
                          {formatDate(member.lastUpdated)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add Members Button - Only for Creator */}
          {isCreator && (
            <Button 
              onClick={() => setShowAddMembersModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 mt-4 w-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {lang === 'ar' ? 'إضافة أعضاء' : 'Add Members'}
            </Button>
          )}
        </Card>

        {/* Milestones Section */}
        <Card className="p-6">
          <h2 className="text-xl text-emerald-900 dark:text-emerald-100 mb-4 flex items-center justify-between">
            <span>{lang === 'ar' ? 'تقدمك' : 'Your Progress'}</span>
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              {lang === 'ar' && `تم إكمال ${completedCount} / ${milestones.length} يومًا`}
              {lang === 'en' && `${completedCount} of ${milestones.length} days completed`}
            </span>
          </h2>

          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {milestones.map((milestone, idx) => {
              const isCompleted = milestone.completed;
              
              // Calculate Juz range for display
              const startJuz = Math.ceil(milestone.startPage / 20);
              const endJuz = Math.min(Math.ceil(milestone.endPage / 20), 30); // Cap at Juz 30
              const juzRange = startJuz !== endJuz ? `${startJuz}-${endJuz}` : `${startJuz}`;
              
              // Build translated title and description
              const milestoneTitle = lang === 'ar' 
                ? `${t.day} ${milestone.day}`
                : `Day ${milestone.day}`;
              
              const milestoneDescription = lang === 'ar'
                ? `${t.pagesLabel} ${milestone.startPage}-${milestone.endPage} (${t.juz} ${juzRange})`
                : `Pages ${milestone.startPage}-${milestone.endPage} (Juz ${juzRange})`;
              
              return (
                <div 
                  key={idx} 
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 ${
                    isCompleted
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-600 dark:border-emerald-700' 
                      : 'bg-white dark:bg-gray-800 border-emerald-100 dark:border-emerald-800'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                    isCompleted 
                      ? 'bg-emerald-600 dark:bg-emerald-700 border-emerald-600 dark:border-emerald-700' 
                      : 'border-emerald-300 dark:border-emerald-700'
                  }`}>
                    {isCompleted && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      isCompleted 
                        ? 'text-emerald-900 dark:text-emerald-100' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {milestoneTitle}
                    </div>
                    <div className={`text-sm ${
                      isCompleted 
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-emerald-600 dark:text-emerald-400'
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
            {lang === 'ar' ? 'يتم تتبع التقدم تلقائيًا' : 'Progress is tracked automatically'}
          </p>
        </Card>
      </div>

      {/* Set Full Name Modal */}
      {showNameModal && (
        <SetFullNameModal
          isOpen={showNameModal}
          onClose={() => setShowNameModal(false)}
          onSave={handleSaveFullName}
          userEmail={currentUserEmail}
          needsFullName={needsFullName}
        />
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && (
        <AddMembersModal
          isOpen={showAddMembersModal}
          onClose={() => setShowAddMembersModal(false)}
          khatmahName={khatmah.name}
          onAddMembers={async (emails: string[]) => {
            if (!groupId) throw new Error('No group ID');
            const result = await addMembersToPrivateKhatmah(groupId, emails);
            if (!result.success) {
              throw new Error(result.error || 'Failed to add members');
            }
            console.log('✅ Members added successfully');
            setShowAddMembersModal(false);
            // Reload members to show updated list
            await loadKhatmahDetails();
          }}
        />
      )}
    </div>
  );
}