import { useState, useCallback } from 'react';
import { 
  checkKhatmahComplete, 
  recordKhatmahCompletion, 
  checkAndRecordSurahCompletion,
  recordMilestone,
  checkReadingMilestone
} from './localStorage';

export type MilestoneData = {
  type: 'surah_memorized' | 'khatmah_completed' | 'first_page' | 'halfway_khatmah';
  title: string;
  message: string;
  icon: 'book' | 'star' | 'trophy';
  surahName?: string;
  khatmahNumber?: number;
};

export const useMilestones = () => {
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneData | null>(null);

  const checkSurahCompletion = useCallback((surahNumber: number, totalAyahs: number, surahName: string) => {
    const isNewlyCompleted = checkAndRecordSurahCompletion(surahNumber, totalAyahs);
    
    if (isNewlyCompleted) {
      recordMilestone('surah_memorized', { surahNumber, surahName });
      
      setCurrentMilestone({
        type: 'surah_memorized',
        title: 'Surah Memorized!',
        message: `Masha'Allah! You have successfully memorized the entire surah.`,
        icon: 'star',
        surahName
      });
      
      return true;
    }
    
    return false;
  }, []);

  const checkKhatmahCompletion = useCallback(() => {
    if (checkKhatmahComplete()) {
      const khatmahNumber = recordKhatmahCompletion();
      recordMilestone('khatmah_completed', { khatmahNumber });
      
      setCurrentMilestone({
        type: 'khatmah_completed',
        title: 'Khatmah Completed!',
        message: `Alhamdulillah! You have completed reading the entire Quran.`,
        icon: 'trophy',
        khatmahNumber
      });
      
      return true;
    }
    
    return false;
  }, []);

  const checkReadingMilestones = useCallback(() => {
    const milestone = checkReadingMilestone();
    
    if (milestone === 'first_page') {
      recordMilestone('first_page');
      setCurrentMilestone({
        type: 'first_page',
        title: 'Journey Begun!',
        message: 'You have started your Quran reading journey. May Allah make it easy for you.',
        icon: 'book'
      });
      return true;
    }
    
    if (milestone === 'halfway_khatmah') {
      recordMilestone('halfway_khatmah');
      setCurrentMilestone({
        type: 'halfway_khatmah',
        title: 'Halfway There!',
        message: 'Masha\'Allah! You have completed half of the Quran. Keep going!',
        icon: 'star'
      });
      return true;
    }
    
    return false;
  }, []);

  const clearMilestone = useCallback(() => {
    setCurrentMilestone(null);
  }, []);

  return {
    currentMilestone,
    checkSurahCompletion,
    checkKhatmahCompletion,
    checkReadingMilestones,
    clearMilestone
  };
};
