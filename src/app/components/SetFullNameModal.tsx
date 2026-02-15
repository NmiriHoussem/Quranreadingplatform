import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getTranslations, getStoredLanguage } from '../utils/translations';

interface SetFullNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fullName: string) => void;
  userEmail: string;
  needsFullName: boolean;
}

export default function SetFullNameModal({
  isOpen,
  onClose,
  onSave,
  userEmail,
  needsFullName
}: SetFullNameModalProps) {
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const lang = getStoredLanguage();
  const t = getTranslations(lang);
  const isRTL = lang === 'ar';

  const handleSave = () => {
    if (!fullName.trim()) {
      setError(lang === 'ar' ? 'الرجاء إدخال اسمك الكامل' : 'Please enter your full name');
      return;
    }

    if (fullName.trim().length < 2) {
      setError(lang === 'ar' ? 'الاسم قصير جداً' : 'Name is too short');
      return;
    }

    onSave(fullName.trim());
    setFullName('');
    setError('');
  };

  const handleSkip = () => {
    // Use email prefix as default
    const defaultName = userEmail.split('@')[0];
    onSave(defaultName);
    setFullName('');
    setError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
            {lang === 'ar' ? 'ما هو اسمك؟' : "What's your name?"}
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            {lang === 'ar' 
              ? 'سيظهر اسمك للأعضاء الآخرين في الختمة الخاصة.'
              : 'Your name will be visible to other members in your private khatmah.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-gray-700 dark:text-gray-300">
              {lang === 'ar' ? 'الاسم الكامل' : 'Full Name'}
            </Label>
            <Input
              id="fullName"
              placeholder={lang === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
              }}
              className="text-base"
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            )}
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {lang === 'ar' 
                ? '💡 يمكنك تخطي هذه الخطوة، وسنستخدم بريدك الإلكتروني بدلاً من ذلك.'
                : "💡 You can skip this step, and we'll use your email instead."}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-gray-600 dark:text-gray-400"
          >
            {lang === 'ar' ? 'تخطي' : 'Skip'}
          </Button>
          <Button
            onClick={handleSave}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {lang === 'ar' ? 'حفظ' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}