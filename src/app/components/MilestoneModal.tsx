import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Star, Trophy, Sparkles, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

export type MilestoneType = 
  | 'surah_memorized' 
  | 'khatmah_completed' 
  | 'first_page' 
  | 'halfway_khatmah'
  | 'streak_7'
  | 'streak_30'
  | 'streak_100';

interface MilestoneData {
  type: MilestoneType;
  title: string;
  message: string;
  icon: 'book' | 'star' | 'trophy';
  surahName?: string;
  khatmahNumber?: number;
  streakDays?: number;
}

interface MilestoneModalProps {
  milestone: MilestoneData | null;
  onClose: () => void;
}

export default function MilestoneModal({ milestone, onClose }: MilestoneModalProps) {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    if (milestone) {
      // Generate confetti particles
      const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
      }));
      setConfetti(particles);
    }
  }, [milestone]);

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'trophy':
        return <Trophy className="w-16 h-16 text-amber-500" />;
      case 'star':
        return <Star className="w-16 h-16 text-amber-500" />;
      default:
        return <BookOpen className="w-16 h-16 text-emerald-500" />;
    }
  };

  const getBackgroundGradient = (type: MilestoneType) => {
    if (type === 'khatmah_completed') {
      return 'from-amber-50 via-emerald-50 to-amber-50';
    }
    if (type.includes('streak')) {
      return 'from-orange-50 via-amber-50 to-orange-50';
    }
    return 'from-emerald-50 via-teal-50 to-emerald-50';
  };

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          {/* Confetti */}
          {confetti.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 bg-amber-400 dark:bg-amber-300 rounded-full"
              initial={{ 
                top: '45%', 
                left: '50%',
                scale: 0,
                opacity: 1 
              }}
              animate={{
                top: ['45%', '100%'],
                left: [`${particle.x}%`, `${particle.x + (Math.random() - 0.5) * 20}%`],
                scale: [0, 1, 0.8],
                opacity: [1, 1, 0],
                rotate: Math.random() * 360,
              }}
              transition={{
                duration: 2,
                delay: particle.delay,
                ease: 'easeOut',
              }}
            />
          ))}

          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md"
          >
            <Card className={`p-8 border-2 border-amber-200 dark:border-amber-700 shadow-2xl bg-gradient-to-br ${getBackgroundGradient(milestone.type)} dark:from-emerald-900 dark:via-emerald-800 dark:to-emerald-900`}>
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="flex justify-center mb-6"
              >
                <div className="relative">
                  {getIcon(milestone.icon)}
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl text-center text-emerald-900 dark:text-emerald-100 mb-3"
              >
                {milestone.title}
              </motion.h2>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-center text-emerald-700 dark:text-emerald-300 mb-6"
              >
                {milestone.message}
              </motion.p>

              {/* Stats if applicable */}
              {(milestone.surahName || milestone.khatmahNumber || milestone.streakDays) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="bg-white/60 dark:bg-emerald-950/60 backdrop-blur-sm rounded-lg p-4 mb-6 border border-amber-200 dark:border-amber-700"
                >
                  {milestone.surahName && (
                    <p className="text-center text-emerald-900 dark:text-emerald-100">
                      <span className="text-xl">📖 {milestone.surahName}</span>
                    </p>
                  )}
                  {milestone.khatmahNumber && (
                    <p className="text-center text-emerald-900 dark:text-emerald-100">
                      <span className="text-2xl">🎉 Khatmah #{milestone.khatmahNumber}</span>
                    </p>
                  )}
                  {milestone.streakDays && (
                    <p className="text-center text-emerald-900 dark:text-emerald-100">
                      <span className="text-2xl">🔥 {milestone.streakDays} Days</span>
                    </p>
                  )}
                </motion.div>
              )}

              {/* Quote */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-emerald-100/50 dark:bg-emerald-900/50 border-l-4 border-emerald-600 dark:border-emerald-400 p-3 mb-6 rounded"
              >
                <p className="text-sm text-emerald-800 dark:text-emerald-200 italic text-center">
                  "The best among you are those who learn the Quran and teach it."
                  <span className="block text-xs mt-1 not-italic">— Prophet Muhammad ﷺ</span>
                </p>
              </motion.div>

              {/* Action Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 hover:from-emerald-700 hover:to-teal-700 dark:hover:from-emerald-600 dark:hover:to-teal-600 text-white shadow-lg"
                >
                  Continue Your Journey
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}