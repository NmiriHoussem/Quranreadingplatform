import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  isDanger = false
}: ConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

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
                className="absolute top-4 right-4 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors z-10"
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
                  className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                    isDanger 
                      ? 'bg-red-100 dark:bg-red-900/50' 
                      : 'bg-amber-100 dark:bg-amber-900/50'
                  }`}
                >
                  <AlertTriangle className={`w-12 h-12 ${
                    isDanger 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-amber-600 dark:text-amber-400'
                  }`} />
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl text-emerald-900 dark:text-emerald-100 mb-2"
                >
                  {title}
                </motion.h2>

                {/* Message */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-emerald-600 dark:text-emerald-400 mb-6"
                >
                  {message}
                </motion.p>

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-3"
                >
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="flex-1 border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900"
                  >
                    {cancelText}
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    className={`flex-1 ${
                      isDanger
                        ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
                        : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600'
                    }`}
                  >
                    {confirmText}
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
