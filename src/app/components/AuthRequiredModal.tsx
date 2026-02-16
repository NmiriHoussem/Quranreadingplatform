import React from 'react';
import { X, Lock, LogIn } from 'lucide-react';
import { Button } from './ui/button';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
  language: 'en' | 'ar';
}

export function AuthRequiredModal({ isOpen, onClose, onSignup, language }: AuthRequiredModalProps) {
  if (!isOpen) return null;

  const translations = {
    en: {
      title: 'Login Required',
      message: 'You must be logged in to create a private khatmah. Private khatmahs allow you to track your reading progress with friends and family.',
      features: [
        'Sync your progress across devices',
        'Create private reading groups',
        'Track collective khatmah completion',
        'Invite friends and family'
      ],
      signupButton: 'Sign Up / Login',
      cancelButton: 'Cancel'
    },
    ar: {
      title: 'تسجيل الدخول مطلوب',
      message: 'يجب عليك تسجيل الدخول لإنشاء ختمة خاصة. الختمات الخاصة تسمح لك بتتبع تقدمك في القراءة مع الأصدقاء والعائلة.',
      features: [
        'مزامنة تقدمك عبر الأجهزة',
        'إنشاء مجموعات قراءة خاصة',
        'تتبع إتمام الختمة الجماعية',
        'دعوة الأصدقاء والعائلة'
      ],
      signupButton: 'تسجيل دخول / إنشاء حساب',
      cancelButton: 'إلغاء'
    }
  };

  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className={`relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all ${
          language === 'ar' ? 'rtl' : 'ltr'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 ${language === 'ar' ? 'left-4' : 'right-4'} text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors`}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center pt-8 pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900 dark:to-emerald-800 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-emerald-600 dark:text-emerald-300" />
          </div>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {t.title}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            {t.message}
          </p>

          {/* Features */}
          <div className={`bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-6 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
            <ul className="space-y-2">
              {t.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <span className="text-emerald-500 dark:text-emerald-400 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              {t.cancelButton}
            </Button>
            <Button
              onClick={onSignup}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              <LogIn className={`w-4 h-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {t.signupButton}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
