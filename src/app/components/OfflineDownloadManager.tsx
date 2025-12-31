import { useState, useEffect } from 'react';
import { Download, Trash2, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Checkbox } from './ui/checkbox';
import { 
  downloadMultipleSurahs, 
  deleteSurah, 
  deleteAllSurahs,
  getDownloadedSurahs,
  getOfflineStorageInfo,
  getPopularSurahs,
  getJuzSurahs,
  isSurahDownloaded,
  type DownloadProgress,
  type OfflineStorageInfo
} from '../../services/offlineService';
import { SURAHS, getSurahName } from '../utils/surahs';
import { getTranslations, getStoredLanguage, type Language } from '../utils/translations';

export default function OfflineDownloadManager() {
  const [language, setLanguage] = useState<Language>(getStoredLanguage());
  const t = getTranslations(language);
  
  const [storageInfo, setStorageInfo] = useState<OfflineStorageInfo | null>(null);
  const [selectedSurahs, setSelectedSurahs] = useState<Set<number>>(new Set());
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSurahList, setShowSurahList] = useState(false);
  const [downloadedSurahs, setDownloadedSurahs] = useState<number[]>([]);

  // Load storage info and downloaded surahs
  useEffect(() => {
    loadStorageInfo();
    setDownloadedSurahs(getDownloadedSurahs());
  }, []);

  const loadStorageInfo = async () => {
    const info = await getOfflineStorageInfo();
    setStorageInfo(info);
  };

  const handleSelectSurah = (surahNumber: number) => {
    const newSelected = new Set(selectedSurahs);
    if (newSelected.has(surahNumber)) {
      newSelected.delete(surahNumber);
    } else {
      newSelected.add(surahNumber);
    }
    setSelectedSurahs(newSelected);
  };

  const handleSelectAll = () => {
    const allSurahs = new Set(Array.from({ length: 114 }, (_, i) => i + 1));
    setSelectedSurahs(allSurahs);
  };

  const handleSelectNone = () => {
    setSelectedSurahs(new Set());
  };

  const handleSelectPopular = () => {
    const popular = getPopularSurahs();
    setSelectedSurahs(new Set(popular));
  };

  const handleSelectJuz = (juzNumber: number) => {
    const juzSurahs = getJuzSurahs(juzNumber);
    setSelectedSurahs(new Set(juzSurahs));
  };

  const handleDownload = async () => {
    if (selectedSurahs.size === 0) return;

    setIsDownloading(true);
    setDownloadProgress([]);

    try {
      const surahsToDownload = Array.from(selectedSurahs).filter(
        num => !isSurahDownloaded(num)
      );

      if (surahsToDownload.length === 0) {
        alert(t.allSurahsAlreadyDownloaded || 'All selected surahs are already downloaded!');
        setIsDownloading(false);
        return;
      }

      await downloadMultipleSurahs(surahsToDownload, (progress) => {
        setDownloadProgress(progress);
      });

      // Refresh storage info and downloaded list
      await loadStorageInfo();
      setDownloadedSurahs(getDownloadedSurahs());
      setSelectedSurahs(new Set());
    } catch (error) {
      console.error('Download error:', error);
      alert(t.downloadError || 'Download failed. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteSurah = async (surahNumber: number) => {
    try {
      await deleteSurah(surahNumber);
      await loadStorageInfo();
      setDownloadedSurahs(getDownloadedSurahs());
    } catch (error) {
      console.error('Delete error:', error);
      alert(t.deleteError || 'Failed to delete surah. Please try again.');
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm(t.confirmDeleteAll || 'Are you sure you want to delete all downloaded surahs? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAllSurahs();
      await loadStorageInfo();
      setDownloadedSurahs([]);
    } catch (error) {
      console.error('Delete all error:', error);
      alert(t.deleteError || 'Failed to delete surahs. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getOverallProgress = () => {
    if (downloadProgress.length === 0) return 0;
    const total = downloadProgress.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(total / downloadProgress.length);
  };

  return (
    <div className="space-y-6">
      {/* Storage Info */}
      {storageInfo && (
        <Card className="p-4 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-emerald-900 dark:text-emerald-100">
              {t.offlineStorage || 'Offline Storage'}
            </Label>
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              {storageInfo.estimatedSize}
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-600 dark:text-emerald-400">
                {t.downloadedSurahs || 'Downloaded Surahs'}
              </span>
              <span className="font-medium text-emerald-900 dark:text-emerald-100">
                {storageInfo.downloadedSurahs} / {storageInfo.totalSurahs}
              </span>
            </div>
            <Progress 
              value={(storageInfo.downloadedSurahs / storageInfo.totalSurahs) * 100} 
              className="h-2"
            />
            {storageInfo.lastUpdated && (
              <p className="text-xs text-emerald-500 dark:text-emerald-500">
                {t.lastUpdated || 'Last updated'}: {new Date(storageInfo.lastUpdated).toLocaleDateString()}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="p-4 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
        <Label className="text-emerald-900 dark:text-emerald-100 mb-3 block">
          {t.quickDownload || 'Quick Download'}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectPopular}
            className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
          >
            <Download className="w-4 h-4 mr-2" />
            {t.popularSurahs || 'Popular'} (12)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
          >
            <Download className="w-4 h-4 mr-2" />
            {t.allSurahs || 'All'} (114)
          </Button>
        </div>
        
        {/* Juz Selection */}
        <div className="mt-3">
          <Label className="text-sm text-emerald-700 dark:text-emerald-300 mb-2 block">
            {t.downloadByJuz || 'Download by Juz'}:
          </Label>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 30 }, (_, i) => i + 1).map(juz => (
              <Button
                key={juz}
                variant="outline"
                size="sm"
                onClick={() => handleSelectJuz(juz)}
                className="text-xs border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 h-8"
              >
                {juz}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Custom Selection */}
      <Card className="p-4 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
        <div className="flex items-center justify-between mb-3">
          <Label className="text-emerald-900 dark:text-emerald-100">
            {t.customSelection || 'Custom Selection'} ({selectedSurahs.size} {t.selected || 'selected'})
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSurahList(!showSurahList)}
            className="text-emerald-600 dark:text-emerald-400"
          >
            {showSurahList ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {showSurahList && (
          <>
            <div className="flex gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex-1 text-xs border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
              >
                {t.selectAll || 'Select All'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectNone}
                className="flex-1 text-xs border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
              >
                {t.selectNone || 'Clear'}
              </Button>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2 border border-emerald-100 dark:border-emerald-800 rounded-lg p-3">
              {SURAHS.map((surah) => (
                <div
                  key={surah.number}
                  className="flex items-center justify-between p-2 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      checked={selectedSurahs.has(surah.number)}
                      onCheckedChange={() => handleSelectSurah(surah.number)}
                      disabled={isSurahDownloaded(surah.number)}
                    />
                    <span className="text-sm text-emerald-900 dark:text-emerald-100">
                      {surah.number}. {getSurahName(surah.number, language)}
                    </span>
                  </div>
                  {isSurahDownloaded(surah.number) && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Download Progress */}
      {isDownloading && downloadProgress.length > 0 && (
        <Card className="p-4 border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/30">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-emerald-900 dark:text-emerald-100">
              {t.downloading || 'Downloading'}...
            </Label>
            <span className="text-sm text-emerald-600 dark:text-emerald-400">
              {getOverallProgress()}%
            </span>
          </div>
          <Progress value={getOverallProgress()} className="h-2 mb-3" />
          
          <div className="max-h-32 overflow-y-auto space-y-2">
            {downloadProgress.map((progress) => (
              <div key={progress.surahNumber} className="flex items-center justify-between text-sm">
                <span className="text-emerald-700 dark:text-emerald-300">
                  {getSurahName(progress.surahNumber, language)}
                </span>
                <span className="flex items-center gap-2">
                  {progress.status === 'downloading' && (
                    <Loader2 className="w-3 h-3 animate-spin text-emerald-600 dark:text-emerald-400" />
                  )}
                  {progress.status === 'completed' && (
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  )}
                  {progress.status === 'error' && (
                    <X className="w-3 h-3 text-red-600 dark:text-red-400" />
                  )}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {progress.progress}%
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Download Button */}
      <Button
        onClick={handleDownload}
        disabled={selectedSurahs.size === 0 || isDownloading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
      >
        {isDownloading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t.downloading || 'Downloading'}...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            {t.downloadSelected || 'Download Selected'} ({selectedSurahs.size})
          </>
        )}
      </Button>

      {/* Downloaded Surahs Management */}
      {downloadedSurahs.length > 0 && (
        <Card className="p-4 border-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/50">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-emerald-900 dark:text-emerald-100">
              {t.downloadedSurahs || 'Downloaded Surahs'} ({downloadedSurahs.length})
            </Label>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="text-xs"
            >
              {isDeleting ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3 mr-1" />
              )}
              {t.deleteAll || 'Delete All'}
            </Button>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2">
            {downloadedSurahs.map((surahNum) => (
              <div
                key={surahNum}
                className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded"
              >
                <span className="text-sm text-emerald-900 dark:text-emerald-100">
                  {surahNum}. {getSurahName(surahNum, language)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSurah(surahNum)}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 h-7 px-2"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
          <strong>{t.howItWorks || 'How it works'}:</strong>
        </p>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>{t.offlineInfo1 || 'Select surahs you want to read offline'}</li>
          <li>{t.offlineInfo2 || 'Download them while you have internet'}</li>
          <li>{t.offlineInfo3 || 'Read them anytime, even without internet'}</li>
          <li>{t.offlineInfo4 || 'Delete anytime to free up space'}</li>
        </ul>
      </div>
    </div>
  );
}
