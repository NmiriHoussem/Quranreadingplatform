import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { useState } from 'react';
import { getTranslations, getStoredLanguage } from '../utils/translations';

interface InvitationMigrationModalProps {
  isOpen: boolean;
  khatmahName: string;
  khatmahDuration: number;
  currentPublicProgress: number;
  currentPublicPagesRead: number;
  currentPublicKhatmahName: string;
  onClose: () => void;
  onConfirm: (copyProgress: boolean) => void;
}

export default function InvitationMigrationModal({
  isOpen,
  khatmahName,
  khatmahDuration,
  currentPublicProgress,
  currentPublicPagesRead,
  currentPublicKhatmahName,
  onClose,
  onConfirm
}: InvitationMigrationModalProps) {
  const [selectedOption, setSelectedOption] = useState<'copy' | 'fresh'>('copy');
  const lang = getStoredLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === 'ar';

  const handleConfirm = () => {
    onConfirm(selectedOption === 'copy');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <div dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {lang === 'ar' ? `الانضمام إلى "${khatmahName}"` : `Join "${khatmahName}"`}
            </DialogTitle>
            <DialogDescription className="text-base">
              {lang === 'ar' 
                ? 'هذه أول ختمة خاصة لك. اختر كيف تريد البدء:' 
                : 'This is your first private khatmah. Choose how to start:'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Progress Info */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                {lang === 'ar' ? 'تقدمك الحالي' : 'Your Current Progress'}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {currentPublicKhatmahName}: <span className="font-bold">{currentPublicProgress}%</span> ({currentPublicPagesRead}/604 {lang === 'ar' ? 'صفحة' : 'pages'})
              </p>
            </div>

            {/* New Khatmah Info */}
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                {lang === 'ar' ? 'ختمة خاصة جديدة' : 'New Private Khatmah'}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {khatmahName}: {khatmahDuration} {lang === 'ar' ? 'يوم' : 'days'}
              </p>
            </div>

            {/* Options */}
            <RadioGroup value={selectedOption} onValueChange={(value) => setSelectedOption(value as 'copy' | 'fresh')}>
              <div className="space-y-3">
                {/* Option 1: Copy Progress */}
                <div 
                  className={`
                    flex items-start space-x-3 rtl:space-x-reverse p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedOption === 'copy' 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
                  `}
                  onClick={() => setSelectedOption('copy')}
                >
                  <RadioGroupItem value="copy" id="copy" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="copy" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-base">
                          {lang === 'ar' ? 'نسخ التقدم' : 'Copy Progress'}
                        </span>
                        <span className="text-xs bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded">
                          {lang === 'ar' ? 'موصى به' : 'Recommended'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {lang === 'ar' 
                          ? `ابدأ عند ${currentPublicProgress}% (${currentPublicPagesRead} صفحة)`
                          : `Start at ${currentPublicProgress}% (${currentPublicPagesRead} pages)`}
                      </p>
                      <ul className="text-xs text-gray-500 dark:text-gray-500 mt-2 space-y-1" dir={isRTL ? 'rtl' : 'ltr'}>
                        <li className="flex items-center gap-1.5">
                          <span className={isRTL ? 'mr-1' : 'ml-1'}>✓</span>
                          {lang === 'ar' ? 'احتفظ بتقدمك الحالي' : 'Keep your current progress'}
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className={isRTL ? 'mr-1' : 'ml-1'}>✓</span>
                          {lang === 'ar' ? 'تُحدّث تلقائياً في جميع الختمات الخاصة' : 'Automatically synced across all private khatmahs'}
                        </li>
                      </ul>
                    </Label>
                  </div>
                </div>

                {/* Option 2: Start Fresh */}
                <div 
                  className={`
                    flex items-start space-x-3 rtl:space-x-reverse p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedOption === 'fresh' 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}
                  `}
                  onClick={() => setSelectedOption('fresh')}
                >
                  <RadioGroupItem value="fresh" id="fresh" className="mt-0.5" />
                  <div className="flex-1">
                    <Label htmlFor="fresh" className="cursor-pointer">
                      <span className="font-semibold text-base">
                        {lang === 'ar' ? 'بداية جديدة' : 'Start Fresh'}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {lang === 'ar' ? 'ابدأ من 0% (الصفحة 1)' : 'Start at 0% (Page 1)'}
                      </p>
                      <ul className="text-xs text-gray-500 dark:text-gray-500 mt-2 space-y-1" dir={isRTL ? 'rtl' : 'ltr'}>
                        <li className="flex items-center gap-1.5">
                          <span className={isRTL ? 'mr-1' : 'ml-1'}>✓</span>
                          {lang === 'ar' ? 'ابدأ من البداية مع المجموعة' : 'Start from the beginning with the group'}
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className={isRTL ? 'mr-1' : 'ml-1'}>✓</span>
                          {lang === 'ar' ? 'اقرأ بنفس وتيرة الأعضاء' : 'Read at the same pace as members'}
                        </li>
                      </ul>
                    </Label>
                  </div>
                </div>
              </div>
            </RadioGroup>

            {/* Warning for Copy Progress */}
            {selectedOption === 'copy' && currentPublicProgress > 10 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  {lang === 'ar' 
                    ? `ملاحظة: ستكون متقدماً على أعضاء المجموعة الآخرين. قد لا تنتهون معاً في نفس الوقت.`
                    : `Note: You'll be ahead of other group members. You may not finish together.`}
                </p>
              </div>
            )}

            {/* Info about public khatmah staying separate */}
            <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
              <ArrowRight className={`w-4 h-4 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {lang === 'ar' 
                  ? 'ختمتك العامة ستبقى منفصلة ومستقلة.'
                  : 'Your public khatmah will stay separate and independent.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleConfirm} className="bg-emerald-600 hover:bg-emerald-700">
              {selectedOption === 'copy' 
                ? (lang === 'ar' ? `نسخ التقدم والانضمام` : `Copy & Join`)
                : (lang === 'ar' ? 'بداية جديدة والانضمام' : 'Start Fresh & Join')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}