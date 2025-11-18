import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface GenerationOverlayProps {
  isOpen: boolean;
  progress: number;
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
  error?: string;
  onClose?: () => void;
}

export const GenerationOverlay: React.FC<GenerationOverlayProps> = ({
  isOpen,
  progress,
  status,
  message,
  error,
  onClose,
}) => {
  if (!isOpen) return null;

  const funFacts = [
    "Did you know? AI can generate designs in 30 seconds!",
    "African contemporary style is our most popular choice",
    "Over 1 million designs generated and counting...",
    "Pro tip: Use 'creative freedom' for unique results",
    "Virtual staging can increase property value by 10%",
  ];

  const [currentFact, setCurrentFact] = React.useState(0);

  React.useEffect(() => {
    if (status === 'processing') {
      const interval = setInterval(() => {
        setCurrentFact((prev) => (prev + 1) % funFacts.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
      >
        {/* Status Icon */}
        <div className="flex justify-center mb-6">
          {status === 'complete' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <CheckCircle className="w-16 h-16 text-success" />
            </motion.div>
          ) : status === 'error' ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', bounce: 0.5 }}
            >
              <XCircle className="w-16 h-16 text-error" />
            </motion.div>
          ) : (
            <Loader2 className="w-16 h-16 text-secondary-accent-blue animate-spin" />
          )}
        </div>

        {/* Status Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {status === 'uploading' && 'Uploading Image...'}
            {status === 'processing' && 'Generating Design...'}
            {status === 'complete' && 'Design Complete!'}
            {status === 'error' && 'Generation Failed'}
          </h2>
          <p className="text-gray-600">
            {message || error || 'Please wait while we process your request'}
          </p>
        </div>

        {/* Progress Bar */}
        {(status === 'uploading' || status === 'processing') && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-secondary-accent-blue to-secondary-luxury-purple"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Fun Facts */}
        {status === 'processing' && (
          <motion.div
            key={currentFact}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-blue-50 rounded-lg p-4 text-center"
          >
            <p className="text-sm text-gray-700">
              💡 {funFacts[currentFact]}
            </p>
          </motion.div>
        )}

        {/* Error Message */}
        {status === 'error' && error && (
          <div className="bg-red-50 border border-error rounded-lg p-4 mb-4">
            <p className="text-sm text-error">{error}</p>
          </div>
        )}

        {/* Action Button */}
        {(status === 'complete' || status === 'error') && onClose && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onClose}
            className="w-full py-3 bg-primary-navy text-white font-semibold rounded-lg hover:bg-primary-navy-dark transition-colors"
          >
            {status === 'complete' ? 'View Result' : 'Try Again'}
          </motion.button>
        )}

        {/* Loading Dots */}
        {(status === 'uploading' || status === 'processing') && (
          <div className="flex justify-center gap-2 mt-6">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-secondary-accent-blue rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default GenerationOverlay;
