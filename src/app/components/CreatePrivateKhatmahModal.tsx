import { useState } from 'react';
import { X, Plus, Users, Calendar, Type, Mail } from 'lucide-react';
import { getTranslations, getStoredLanguage } from '../utils/translations';
import { getStoredUser } from '../../services/authService';

interface CreatePrivateKhatmahModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateKhatmah: (data: {
    duration: number;
    groupName: string;
    memberEmails: string[];
  }) => void;
}

export default function CreatePrivateKhatmahModal({
  isOpen,
  onClose,
  onCreateKhatmah,
}: CreatePrivateKhatmahModalProps) {
  const language = getStoredLanguage();
  const t = getTranslations(language);
  const currentUser = getStoredUser();

  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [groupName, setGroupName] = useState('');
  const [visibleCount, setVisibleCount] = useState(1);
  const [email0, setEmail0] = useState('');
  const [email1, setEmail1] = useState('');
  const [email2, setEmail2] = useState('');
  const [email3, setEmail3] = useState('');
  const [email4, setEmail4] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const durations = [7, 10, 15, 30, 60, 90];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupName.trim()) {
      alert(language === 'ar' ? 'الرجاء إدخال اسم المجموعة' : 'Please enter a group name');
      return;
    }

    const allEmails = [email0, email1, email2, email3, email4];
    const validEmails = allEmails.filter(email => email.trim() !== '');

    // Check if user is trying to invite themselves
    if (currentUser && validEmails.some(email => email.toLowerCase().trim() === currentUser.email.toLowerCase())) {
      alert(language === 'ar' 
        ? 'لا يمكنك دعوة نفسك! 😊 أنت بالفعل منشئ هذه الختمة' 
        : 'You cannot invite yourself! 😊 You are already the creator of this khatmah');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateKhatmah({
        duration: selectedDuration,
        groupName: groupName.trim(),
        memberEmails: validEmails,
      });
      
      setGroupName('');
      setSelectedDuration(30);
      setEmail0('');
      setEmail1('');
      setEmail2('');
      setEmail3('');
      setEmail4('');
      onClose();
    } catch (error) {
      console.error('Error creating private khatmah:', error);
      alert(language === 'ar' ? 'حدث خطأ أثناء إنشاء الختمة' : 'Error creating khatmah');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-emerald-950 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white dark:bg-emerald-950 border-b border-emerald-100 dark:border-emerald-800 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl text-emerald-900 dark:text-emerald-100 mb-1">
              {t.createPrivateKhatmah || 'Create Private Khatmah'}
            </h2>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {language === 'ar' 
                ? 'أنشئ ختمة خاصة وادع الأصدقاء والعائلة'
                : 'Create a private khatmah and invite friends and family'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-3">
              <Calendar className="w-4 h-4" />
              {language === 'ar' ? 'مدة الختمة' : 'Khatmah Duration'}
            </label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {durations.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setSelectedDuration(days)}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    selectedDuration === days
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-900/50'
                      : 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-400 dark:hover:border-emerald-600'
                  }`}
                >
                  <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                    {days}
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                    {language === 'ar' ? 'يوم' : 'days'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-2">
              <Type className="w-4 h-4" />
              {language === 'ar' ? 'اسم المجموعة' : 'Group Name'}
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: ختمة رمضان مع العائلة' : 'e.g., Ramadan Khatmah with Family'}
              className="w-full px-4 py-3 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 placeholder:text-emerald-400 dark:placeholder:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-100 mb-2">
              <Users className="w-4 h-4" />
              {language === 'ar' ? 'دعوة الأعضاء (اختياري)' : 'Invite Members (Optional)'}
            </label>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">
              {language === 'ar'
                ? 'أدخل البريد الإلكتروني لكل عضو تريد دعوته'
                : 'Enter the email address for each member you want to invite'}
            </p>

            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email0}
                    onChange={(e) => setEmail0(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 placeholder:text-emerald-400 dark:placeholder:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                {visibleCount > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmail0('');
                      setVisibleCount(Math.max(1, visibleCount - 1));
                    }}
                    className="px-3 py-2.5 rounded-lg border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2" style={{ display: visibleCount >= 2 ? 'flex' : 'none' }}>
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email1}
                    onChange={(e) => setEmail1(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 placeholder:text-emerald-400 dark:placeholder:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail1('');
                    setVisibleCount(visibleCount - 1);
                  }}
                  className="px-3 py-2.5 rounded-lg border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2" style={{ display: visibleCount >= 3 ? 'flex' : 'none' }}>
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email2}
                    onChange={(e) => setEmail2(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 placeholder:text-emerald-400 dark:placeholder:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail2('');
                    setVisibleCount(visibleCount - 1);
                  }}
                  className="px-3 py-2.5 rounded-lg border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2" style={{ display: visibleCount >= 4 ? 'flex' : 'none' }}>
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email3}
                    onChange={(e) => setEmail3(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 placeholder:text-emerald-400 dark:placeholder:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail3('');
                    setVisibleCount(visibleCount - 1);
                  }}
                  className="px-3 py-2.5 rounded-lg border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-2" style={{ display: visibleCount >= 5 ? 'flex' : 'none' }}>
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 dark:text-emerald-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email4}
                    onChange={(e) => setEmail4(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-emerald-200 dark:border-emerald-700 bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-100 placeholder:text-emerald-400 dark:placeholder:text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail4('');
                    setVisibleCount(visibleCount - 1);
                  }}
                  className="px-3 py-2.5 rounded-lg border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setVisibleCount(Math.min(5, visibleCount + 1))}
              disabled={visibleCount >= 5}
              className="mt-3 px-4 py-2 rounded-lg border-2 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 transition-colors text-sm font-medium inline-flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {language === 'ar' ? 'إضافة عضو آخر' : 'Add Another Member'}
            </button>
          </div>

          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 border-2 border-emerald-200 dark:border-emerald-700 rounded-lg">
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              <strong>{language === 'ar' ? '💡 ملاحظة:' : '💡 Note:'}</strong>{' '}
              {language === 'ar'
                ? 'الأعضاء المدعوون سيتلقون إشعارًا للانضمام إلى الختمة الخاصة'
                : 'Invited members will receive a notification to join your private khatmah'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg border-2 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900 font-medium transition-colors disabled:opacity-50"
            >
              {language === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting
                ? (language === 'ar' ? 'جارٍ الإنشاء...' : 'Creating...')
                : (language === 'ar' ? 'إنشاء الختمة' : 'Create Khatmah')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}