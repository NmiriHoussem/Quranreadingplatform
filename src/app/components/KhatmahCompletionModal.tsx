import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, X, BookOpen, Award } from 'lucide-react';
import { Button } from './ui/button';

interface KhatmahCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestartKhatmah: () => void;
  khatmahTitle: string;
  daysCompleted: number;
}

export default function KhatmahCompletionModal({
  isOpen,
  onClose,
  onRestartKhatmah,
  khatmahTitle,
  daysCompleted
}: KhatmahCompletionModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-emerald-950 rounded-2xl shadow-2xl max-w-lg w-full pointer-events-auto border-2 border-emerald-200 dark:border-emerald-700 overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Content */}
              <div className="p-8 text-center">
                {/* Icon with animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-100 to-amber-100 dark:from-emerald-900/50 dark:to-amber-900/50 rounded-full flex items-center justify-center mb-6 relative"
                >
                  <Award className="w-14 h-14 text-emerald-600 dark:text-emerald-400" />
                  
                  {/* Sparkles animation */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="w-8 h-8 text-amber-500" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -bottom-2 -left-2"
                  >
                    <Sparkles className="w-6 h-6 text-amber-400" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="absolute top-1 -left-3"
                  >
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl text-emerald-900 dark:text-emerald-100 mb-3"
                >
                  Alhamdulillah! 🎉
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-emerald-600 dark:text-emerald-400 mb-6"
                >
                  You have completed the entire Quran!
                </motion.p>

                {/* Khatmah Details */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-900/30 dark:to-amber-900/30 rounded-xl p-6 mb-6 border border-emerald-200 dark:border-emerald-700"
                >
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <div className="text-2xl text-emerald-900 dark:text-emerald-100">
                      {khatmahTitle}
                    </div>
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 mb-2">
                    All 604 pages completed
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {daysCompleted} days of dedication
                    </span>
                  </div>
                </motion.div>

                {/* Hadith Quote */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-emerald-600 dark:text-emerald-400 mb-6 italic px-4"
                >
                  "Whoever reads a letter from the Book of Allah, he will have a reward, and this reward will be multiplied by ten."
                  <br />
                  <span className="text-xs">— Prophet Muhammad ﷺ (Tirmidhi)</span>
                </motion.p>

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={onRestartKhatmah}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Start a New Khatmah
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
                  >
                    Back to Dashboard
                  </Button>
                </motion.div>

                {/* Achievement saved note */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-xs text-emerald-600 dark:text-emerald-400 mt-4"
                >
                  ✓ This achievement has been saved to your account
                </motion.p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
