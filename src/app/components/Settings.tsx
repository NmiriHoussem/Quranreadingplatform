import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Moon, Sun, LogIn, AlertTriangle, Download, Trash2, Globe } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import ProfileMenu from './ProfileMenu';
import { useDarkMode } from '../utils/useDarkMode';
import { getStoredLanguage, setStoredLanguage, getTranslations, Language } from '../utils/translations';
import { getReadingStats, getMilestoneStats, resetAllProgress, resetReadingProgress, resetMemorizationProgress, exportProgressData } from '../utils/localStorage';
import { useOfflineDownload, getDownloadedSurahs, removeSurahFromCache, removeAllFromCache } from '../../services/offlineService';

interface SettingsProps {
  isAuthenticated: boolean;
  onSignOut: () => void;
}

type ResetType = 'all' | 'reading' | 'memorization';

export default function Settings({ isAuthenticated, onSignOut }: SettingsProps) {
  const navigate = useNavigate();
  const { isDarkMode, toggleDarkMode } = useDarkMode(isAuthenticated);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [language, setLanguage] = useState<Language>(getStoredLanguage());
  const t = getTranslations(language);
  
  const handleLanguageChange = (newLanguage: Language) => {
    setStoredLanguage(newLanguage);
    setLanguage(newLanguage);
    // Force page reload to apply new language across all components
    window.location.reload();
  };
  const [resetType, setResetType] = useState<ResetType>('all');
  const [confirmText, setConfirmText] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const readingStats = getReadingStats();
  const milestoneStats = getMilestoneStats();

  const openResetDialog = (type: ResetType) => {
    setResetType(type);
    setConfirmText('');
    setShowResetDialog(true);
  };

  const handleResetProgress = async () => {
    if (confirmText !== 'RESET') {
      return;
    }

    setIsResetting(true);

    try {
      // Wait a bit for UI feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      if (resetType === 'all') {
        resetAllProgress();
      } else if (resetType === 'reading') {
        resetReadingProgress();
      } else if (resetType === 'memorization') {
        resetMemorizationProgress();
      }

      // Close dialog
      setShowResetDialog(false);
      setConfirmText('');

      // Wait for sync to complete (autoSyncProgress has 2s debounce)
      console.log('Waiting for sync to complete...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('Sync should be complete, redirecting...');

      // Force a hard reload to clear all cached state
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error resetting progress:', error);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExportProgress = () => {
    try {
      const progressData = exportProgressData();
      const blob = new Blob([progressData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `quran-companion-backup-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting progress:', error);
    }
  };

  const getResetDialogContent = () => {
    switch (resetType) {
      case 'all':
        return {
          title: 'Reset All Progress',
          description: `This will permanently delete ALL your progress including:\n• ${readingStats.pagesRead} pages read\n• ${milestoneStats.completedSurahs} surahs memorized\n• ${milestoneStats.khatmahs} khatmahs completed\n• All group memberships\n\nThis action cannot be undone.`,
          buttonText: 'Reset Everything'
        };
      case 'reading':
        return {
          title: 'Reset Reading Progress',
          description: `This will permanently delete your reading progress:\n• ${readingStats.pagesRead} pages marked as read\n• All Khatmah progress\n\nYour memorization progress and all group memberships will be preserved.\n\nThis action cannot be undone.`,
          buttonText: 'Reset Reading'
        };
      case 'memorization':
        return {
          title: 'Reset Memorization Progress',
          description: `This will permanently delete your memorization progress:\n• ${milestoneStats.completedSurahs} surahs memorized\n• All ayah memorization marks\n\nYour reading progress and group memberships will be preserved.\n\nThis action cannot be undone.`,
          buttonText: 'Reset Memorization'
        };
    }
  };

  const dialogContent = getResetDialogContent();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950 dark:to-emerald-900">
      {/* Header */}
      <header className="border-b border-emerald-100 dark:border-emerald-800 bg-white/80 dark:bg-emerald-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/dashboard">
            <Button variant="ghost" className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <ProfileMenu isAuthenticated={isAuthenticated} onSignOut={onSignOut} />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl text-emerald-900 dark:text-emerald-100 mb-8">{t.settings}</h1>

        {/* Appearance */}
        <Card className="p-6 mb-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
          <div className="flex items-center gap-2 mb-4">
            {isDarkMode ? (
              <Moon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Sun className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
            <h2 className="text-xl text-emerald-900 dark:text-emerald-100">{t.appearance}</h2>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="dark-mode" className="text-emerald-900 dark:text-emerald-100">{t.darkMode}</Label>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                {isDarkMode ? t.lightModeDescription : t.darkModeDescription}
              </p>
            </div>
            <Switch 
              id="dark-mode"
              checked={isDarkMode}
              onCheckedChange={toggleDarkMode}
            />
          </div>
          
          {/* Divider */}
          <div className="my-6 border-t border-emerald-100 dark:border-emerald-800"></div>
          
          {/* Language Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <Label className="text-emerald-900 dark:text-emerald-100">{t.languagePreference}</Label>
            </div>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">
              {t.languageDescription}
            </p>
            <div className="flex gap-3">
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                className={language === 'en' 
                  ? 'flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600'
                  : 'flex-1 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900'
                }
                onClick={() => handleLanguageChange('en')}
              >
                {t.english}
              </Button>
              <Button
                variant={language === 'ar' ? 'default' : 'outline'}
                className={language === 'ar'
                  ? 'flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600'
                  : 'flex-1 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900'
                }
                onClick={() => handleLanguageChange('ar')}
              >
                {t.arabic}
              </Button>
            </div>
          </div>
        </Card>

        {/* Account Section - Show sign in prompt if not authenticated */}
        {!isAuthenticated && (
          <Card className="p-6 mb-6 border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30">
            <div className="flex items-center gap-2 mb-4">
              <LogIn className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl text-emerald-900 dark:text-emerald-100">{t.signIn}</h2>
            </div>
            
            <p className="text-emerald-600 dark:text-emerald-400 mb-4">
              {t.signInDescription}
            </p>
            <Link to="/auth">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600">
                {t.signInSignUp}
              </Button>
            </Link>
          </Card>
        )}

        {/* Data Management */}
        <Card className="p-6 mb-6 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xl text-emerald-900 dark:text-emerald-100">{t.dataManagement}</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label className="text-emerald-900 dark:text-emerald-100">{t.exportYourProgress}</Label>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">
                {t.exportProgressDescription}
              </p>
              <Button
                variant="outline"
                onClick={handleExportProgress}
                className="w-full border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
              >
                <Download className="w-4 h-4 mr-2" />
                {t.exportProgress}
              </Button>
            </div>
          </div>
        </Card>

        {/* Danger Zone - Only show for authenticated users */}
        {isAuthenticated && (
          <Card className="p-6 mb-6 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <h2 className="text-xl text-red-900 dark:text-red-100">Danger Zone</h2>
            </div>
            
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              These actions are permanent and cannot be undone. Please export your progress before resetting.
            </p>

            <div className="space-y-3">
              {/* Reset Reading Progress */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex-1">
                  <p className="text-sm text-red-900 dark:text-red-100">Reset Reading Progress</p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Clear all page marks and khatmah progress (stay in groups)
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openResetDialog('reading')}
                  className="border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Reset Memorization Progress */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex-1">
                  <p className="text-sm text-red-900 dark:text-red-100">Reset Memorization Progress</p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Clear all ayah memorization marks and surah completions
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openResetDialog('memorization')}
                  className="border-red-600 dark:border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>

              {/* Reset All Progress */}
              <div className="flex items-center justify-between p-3 bg-white dark:bg-red-900/20 rounded-lg border-2 border-red-400 dark:border-red-600">
                <div className="flex-1">
                  <p className="text-sm text-red-900 dark:text-red-100">Reset All Progress</p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Permanently delete everything including groups and milestones
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => openResetDialog('all')}
                  className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Reset All
                </Button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <span className="font-semibold">Note for signed-in users:</span> Resetting will also clear your synced progress from the database.
              </p>
            </div>
          </Card>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-emerald-600 dark:text-emerald-400">
          <p>{t.appName} v1.0.0</p>
          <p className="mt-2">{t.builtWithRespect}</p>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              {dialogContent.title}
            </DialogTitle>
            <DialogDescription className="whitespace-pre-line text-red-700 dark:text-red-300">
              {dialogContent.description}
            </DialogDescription>
          </DialogHeader>

          <div className="my-4">
            <Label htmlFor="confirm-text" className="text-red-900 dark:text-red-100">
              Type <span className="font-mono font-bold">RESET</span> to confirm:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type RESET"
              className="mt-2 border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-500"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetDialog(false);
                setConfirmText('');
              }}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetProgress}
              disabled={confirmText !== 'RESET' || isResetting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              {isResetting ? 'Resetting...' : dialogContent.buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}