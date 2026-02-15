import { useState } from 'react';
import { X, Plus, UserPlus, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { getStoredLanguage } from '../utils/translations';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMembers: (emails: string[]) => Promise<void>;
  khatmahName: string;
}

export default function AddMembersModal({ 
  isOpen, 
  onClose, 
  onAddMembers,
  khatmahName 
}: AddMembersModalProps) {
  const language = getStoredLanguage();
  const isRTL = language === 'ar';
  
  const [emails, setEmails] = useState<string[]>(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    if (emails.length === 1) return; // Keep at least one field
    setEmails(emails.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Filter out empty emails and validate
    const validEmails = emails
      .map(e => e.trim())
      .filter(e => e.length > 0);

    if (validEmails.length === 0) {
      setError(language === 'ar' ? 'الرجاء إدخال بريد إلكتروني واحد على الأقل' : 'Please enter at least one email');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = validEmails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      setError(language === 'ar' ? 'بعض البريد الإلكتروني غير صالح' : 'Some emails are invalid');
      return;
    }

    setIsLoading(true);
    try {
      await onAddMembers(validEmails);
      setEmails(['']); // Reset
    } catch (err: any) {
      setError(err.message || (language === 'ar' ? 'فشل في إضافة الأعضاء' : 'Failed to add members'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {language === 'ar' ? 'إضافة أعضاء' : 'Add Members'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{khatmahName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {language === 'ar' 
              ? 'أدخل البريد الإلكتروني للأعضاء الذين تريد دعوتهم. سيتلقون إشعارًا بالدعوة.'
              : 'Enter the email addresses of members you want to invite. They will receive an invitation notification.'}
          </p>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="email"
                  placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email address'}
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  className="flex-1"
                  disabled={isLoading}
                />
                {emails.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveEmail(index)}
                    disabled={isLoading}
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddEmail}
            disabled={isLoading}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'إضافة بريد إلكتروني آخر' : 'Add another email'}
          </Button>

          {/* Footer */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'إرسال...' : 'Sending...'}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {language === 'ar' ? 'إرسال دعوات' : 'Send Invitations'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}