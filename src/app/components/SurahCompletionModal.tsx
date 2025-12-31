import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Sparkles, X } from 'lucide-react';
import { Button } from './ui/button';

interface SurahCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  surahName: string;
  surahTransliteration: string;
  surahNumber: number;
  totalAyahs: number;
}

export default function SurahCompletionModal({
  isOpen,
  onClose,
  surahName,
  surahTransliteration,
  surahNumber,
  totalAyahs
}: SurahCompletionModalProps) {
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
              className="bg-white dark:bg-emerald-950 rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto border-2 border-emerald-200 dark:border-emerald-700 overflow-hidden"
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Content */}
              <div className="p-8 text-center">
                {/* Icon with animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4 relative"
                >
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                  
                  {/* Sparkles */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="w-6 h-6 text-amber-500" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -bottom-2 -left-2"
                  >
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl text-emerald-900 dark:text-emerald-100 mb-2"
                >
                  Masha'Allah! 🎉
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-emerald-600 dark:text-emerald-400 mb-6"
                >
                  You have completed memorizing
                </motion.p>

                {/* Surah Details */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-emerald-50 to-amber-50 dark:from-emerald-900/30 dark:to-amber-900/30 rounded-xl p-6 mb-6 border border-emerald-200 dark:border-emerald-700"
                >
                  <div className="text-3xl text-emerald-900 dark:text-emerald-100 mb-2">
                    {surahName}
                  </div>
                  <div className="text-emerald-600 dark:text-emerald-400 mb-2">
                    {surahTransliteration}
                  </div>
                  <div className="text-sm text-emerald-600 dark:text-emerald-400">
                    Surah {surahNumber} • {totalAyahs} ayahs
                  </div>
                </motion.div>

                {/* Encouragement */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-emerald-600 dark:text-emerald-400 mb-6 italic"
                >
                  "The best of you are those who learn the Quran and teach it."
                  <br />
                  <span className="text-xs">— Prophet Muhammad ﷺ</span>
                </motion.p>

                {/* Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Button
                    onClick={onClose}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                  >
                    Continue Your Journey
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
